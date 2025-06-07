import re
from flask import Blueprint, request, jsonify, send_file
from flask_cors import CORS, cross_origin
import os
from pathlib import Path
import shutil
from bson.objectid import ObjectId
import pandas as pd
import traceback # Importado para printar tracebacks completos

# Importa a classe Config
from ..core.config import Config
# Importa o Database
from ..core.database import Database
# Importa as funções de processamento de dados
from ..data_processing.vulnerability_analyzer import processar_relatorio_csv, processar_relatorio_json, extrair_quantidades_vulnerabilidades_por_site
# Importa as funções de construção de relatório e compilação
from ..report_generation.report_builder import terminar_relatorio_preprocessado
from ..report_generation.latex_compiler import compilar_latex
from ..report_generation.plot_generator import gerar_Grafico_Quantitativo_Vulnerabilidades_Por_Site, gerar_grafico_donut # AGORA IMPORTA gerar_grafico_donut

# Inicializa a configuração e o banco de dados
config = Config("config.json") # Configuração será carregada de config.json ou configDocker.json pelo main.py
db = Database() # Instância do banco de dados

reports_bp = Blueprint('reports', __name__, url_prefix='/reports')

@reports_bp.route('/getRelatoriosGerados/', methods=['GET'])
def getRelatoriosGerados():
    try:
        db_instance = Database()
        relatorios = db_instance.find("relatorios")
        relatorios_list = []
        for relatorio in relatorios:
            relatorios_list.append({
                "nome": relatorio["nome"],
                "id": str(relatorio["_id"])
            })
        db_instance.close()
        return jsonify(relatorios_list), 200
    except Exception as e:
        print(f"Erro ao obter relatórios gerados: {e}")
        traceback.print_exc() # Para depuração
        return jsonify({"error": str(e)}), 500

@reports_bp.route('/deleteRelatorio/<string:relatorio_id>', methods=['DELETE'])
def deleteRelatorio(relatorio_id):
    try:
        db_instance = Database()
        
        delete_result = db_instance.delete_one("relatorios", {"_id": db_instance.get_object_id(relatorio_id)})
        
        if delete_result.deleted_count == 0:
            db_instance.close()
            return jsonify({"message": "Relatório não encontrado no banco de dados."}), 404

        report_folder_path = Path(config.caminho_shared_relatorios) / relatorio_id
        
        if report_folder_path.exists() and report_folder_path.is_dir():
            shutil.rmtree(report_folder_path)
            print(f"DEBUG: Pasta do relatório excluída: {report_folder_path}")
        else:
            print(f"DEBUG: Pasta do relatório não encontrada ou não é um diretório: {report_folder_path}")

        db_instance.close()
        return jsonify({"message": "Relatório excluído com sucesso."}), 200

    except Exception as e:
        print(f"Erro ao excluir relatório {relatorio_id}: {str(e)}")
        traceback.print_exc() # Para depuração
        return jsonify({"error": f"Erro interno ao excluir relatório: {str(e)}"}), 500

@reports_bp.route('/deleteAllRelatorios/', methods=['DELETE'])
def deleteAllRelatorios():
    try:
        db_instance = Database()
        
        all_relatorios = db_instance.find("relatorios")
        
        delete_db_result = db_instance.delete_many("relatorios", {})
        
        deleted_folders_count = 0
        for relatorio in all_relatorios:
            relatorio_id = str(relatorio["_id"])
            report_folder_path = Path(config.caminho_shared_relatorios) / relatorio_id
            
            if report_folder_path.exists() and report_folder_path.is_dir():
                try:
                    shutil.rmtree(report_folder_path)
                    deleted_folders_count += 1
                    # A linha original tinha um erro na variável de exceção (folder_e)
                    # Corrigindo para um print mais genérico ou logar a exceção 'e'
                    # ou remover este catch interno se não houver um erro específico para lidar
                    print(f"DEBUG: Pasta {report_folder_path} excluída com sucesso.") 
                except Exception as folder_e: # Mantenho 'folder_e' para o caso de você querer usar a variável localmente
                    print(f"ATENÇÃO: Não foi possível excluir a pasta {report_folder_path}: {str(folder_e)}")
            else:
                print(f"DEBUG: Pasta {report_folder_path} não encontrada ou não é um diretório.")

        db_instance.close()
        return jsonify({
            "message": f"Todos os {delete_db_result.deleted_count} relatórios foram excluídos do banco de dados e {deleted_folders_count} pastas foram removidas do sistema de arquivos."
        }), 200

    except Exception as e:
        print(f"Erro ao excluir todos os relatórios: {str(e)}")
        traceback.print_exc() # Para depuração
        return jsonify({"error": f"Erro interno ao excluir todos os relatórios: {str(e)}"}), 500

@reports_bp.route('/gerarRelatorioDeLista/', methods=['POST'])
def gerarRelatorioDeLista():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        id_lista = data.get("idLista")
        nome_secretaria = data.get("nomeSecretaria")
        sigla_secretaria = data.get("siglaSecretaria")
        data_inicio = data.get("dataInicio")
        data_fim = data.get("dataFim")
        ano = data.get("ano")
        mes = data.get("mes")
        google_drive_link = data.get("linkGoogleDrive")

        db_instance = Database()

        try:
            objeto_id = ObjectId(id_lista)
        except Exception:
            db_instance.close()
            return jsonify({"error": "ID de lista inválido."}), 400
        
        lista_doc = db_instance.find_one("listas", {"_id": objeto_id})

        if not lista_doc:
            db_instance.close()
            return jsonify({"error": "Lista não encontrada."}), 404

        criado_por_vm_scan = lista_doc.get("scanStoryIdCriadoPor", "Não informado")

        novo_relatorio_id = db_instance.insert_one(
            "relatorios",
            {"nome": nome_secretaria, "id_lista": id_lista, "destino_relatorio_preprocessado" : None}
        ).inserted_id

        pasta_destino_relatorio_temp = Path(config.caminho_shared_relatorios) / str(novo_relatorio_id) / "relatorio_preprocessado"
        pasta_destino_relatorio_temp.mkdir(parents=True, exist_ok=True)
        
        pasta_scans_da_lista = lista_doc.get("pastas_scans_webapp")

        db_instance.update_one(
            "relatorios",
            {"_id": novo_relatorio_id},
            {"destino_relatorio_preprocessado": str(pasta_destino_relatorio_temp)}
        )

        # Processamento de WebApp Scans
        if pasta_scans_da_lista and os.path.exists(pasta_scans_da_lista) and len(os.listdir(pasta_scans_da_lista)) > 0:
            processar_relatorio_json(pasta_scans_da_lista, str(pasta_destino_relatorio_temp))
            output_csv_path = str(pasta_destino_relatorio_temp / "vulnerabilidades_agrupadas_por_site.csv")
            extrair_quantidades_vulnerabilidades_por_site(output_csv_path, pasta_scans_da_lista)
        else:
            print(f"Aviso: Não há scans WebApp na pasta {pasta_scans_da_lista} ou a pasta está vazia. Pulando processamento WebApp.")
            # Garante que arquivos essenciais para o LaTeX existam mesmo sem dados
            df_empty = pd.DataFrame(columns=['Site', 'Critical', 'High', 'Medium', 'Low', 'Total'])
            df_empty.to_csv(str(pasta_destino_relatorio_temp / "vulnerabilidades_agrupadas_por_site.csv"), index=False)
            Path(pasta_destino_relatorio_temp / "Sites_agrupados_por_vulnerabilidades.txt").touch()
            Path(pasta_destino_relatorio_temp / "(LATEX)Sites_agrupados_por_vulnerabilidades.txt").touch()

        # Processamento de Server Scans (VM)
        # Atenção: a variável `pasta_scans_da_lista` é usada para ambos os tipos de scans.
        # Certifique-se de que `historyid_scanservidor` e `id_scan` apontam para os dados corretos.
        if lista_doc.get("historyid_scanservidor") and lista_doc.get("id_scan"):
            processar_relatorio_csv(pasta_scans_da_lista, str(pasta_destino_relatorio_temp))
        else:
            print("Aviso: Não há scans de Servidores associados a esta lista. Pulando processamento de Servidores.")
            # Garante que arquivos essenciais para o LaTeX existam mesmo sem dados
            Path(pasta_destino_relatorio_temp / "Servidores_agrupados_por_vulnerabilidades.txt").touch()
            Path(pasta_destino_relatorio_temp / "(LATEX)Servidores_agrupados_por_vulnerabilidades.txt").touch()

        # Leitura dos totais para o relatório final (WebApp)
        webapp_report_txt_path = pasta_destino_relatorio_temp / "Sites_agrupados_por_vulnerabilidades.txt"
        webapp_risk_counts = {'Critical': '0', 'High': '0', 'Medium': '0', 'Low': '0'}
        total_sites = '0'
        total_vulnerabilidades_web = '0'
        if webapp_report_txt_path.exists():
            with open(webapp_report_txt_path, 'r', encoding='utf-8') as f:
                content = f.read()
                total_sites_match = re.search(r'Total de sites:\s*(\d+)', content)
                total_vulnerabilidades_web_match = re.search(r'Total de Vulnerabilidades:\s*(\d+)', content)
                critical_match = re.search(r'Critical:\s*(\d+)', content)
                high_match = re.search(r'High:\s*(\d+)', content)
                medium_match = re.search(r'Medium:\s*(\d+)', content)
                low_match = re.search(r'Low:\s*(\d+)', content)

                if total_sites_match: total_sites = total_sites_match.group(1)
                if total_vulnerabilidades_web_match: total_vulnerabilidades_web = total_vulnerabilidades_web_match.group(1)
                if critical_match: webapp_risk_counts['Critical'] = critical_match.group(1)
                if high_match: webapp_risk_counts['High'] = high_match.group(1)
                if medium_match: webapp_risk_counts['Medium'] = medium_match.group(1)
                if low_match: webapp_risk_counts['Low'] = low_match.group(1)
        else:
            print(f"Aviso: Arquivo de resumo WebApp '{webapp_report_txt_path}' não encontrado. Totais WebApp serão 0.")

        # Leitura dos totais para o relatório final (Servidores)
        servers_report_txt_path = pasta_destino_relatorio_temp / "Servidores_agrupados_por_vulnerabilidades.txt"
        servers_risk_counts = {'critical': '0', 'high': '0', 'medium': '0', 'low': '0'}
        total_vulnerabilidade_vm = '0'
        
        # Variável para armazenar o caminho do gráfico de donut de servidores
        graph_output_vm_donut = "" 
        
        if servers_report_txt_path.exists():
            with open(servers_report_txt_path, 'r', encoding='utf-8') as f:
                content = f.read()
                total_vulnerabilidade_vm_match = re.search(r'Total de Vulnerabilidades:\s*(\d+)', content)
                critical_match = re.search(r'Critical:\s*(\d+)', content)
                high_match = re.search(r'High:\s*(\d+)', content)
                medium_match = re.search(r'Medium:\s*(\d+)', content)
                low_match = re.search(r'Low:\s*(\d+)', content)

                if total_vulnerabilidade_vm_match: total_vulnerabilidade_vm = total_vulnerabilidade_vm_match.group(1)
                if critical_match: servers_risk_counts['critical'] = critical_match.group(1)
                if high_match: servers_risk_counts['high'] = high_match.group(1)
                if medium_match: servers_risk_counts['medium'] = medium_match.group(1)
                if low_match: servers_risk_counts['low'] = low_match.group(1)

            # Gerar o gráfico de donut para servidores
            vm_risk_counts_int = {k: int(v) for k, v in servers_risk_counts.items()}
            # Define o caminho de saída para o gráfico de donut de servidores
            pasta_final_latex = pasta_destino_relatorio_temp / "RelatorioPronto"
            graph_output_vm_donut = str(pasta_final_latex / "assets" / "images-vmscan" / "total-vulnerabilidades-vm-donut.png") # Nome sanitizado
            
            # Chama a função gerar_grafico_donut para criar e salvar a imagem
            if not gerar_grafico_donut(vm_risk_counts_int, graph_output_vm_donut):
                print(f"Aviso: Gráfico donut para servidores não foi gerado (sem dados ou erro). O arquivo {graph_output_vm_donut} pode não existir.")
                graph_output_vm_donut = "" # Limpa o caminho se o gráfico não foi gerado
            else:
                # O caminho retornado pela função plot_generator.py é absoluto, mas o LaTeX precisa relativo.
                # O caminho que `main.tex` espera é `assets/images-vmscan/...`.
                # O `graph_output_vm_donut` já é o caminho ABSOLUTO para o arquivo, mas o LaTeX precisa do RELATIVO
                # a partir do `RelatorioPronto`.
                graph_output_vm_donut = "assets/images-vmscan/total-vulnerabilidades-vm-donut.png" # Caminho relativo para o LaTeX
                
        else:
            print("Aviso: Arquivo de resumo Servidores não encontrado. Totais Servidores serão 0 e gráfico VM não será gerado.")
            
        caminho_final_main_tex = str(pasta_destino_relatorio_temp / "RelatorioPronto" / "main.tex")

        terminar_relatorio_preprocessado(
            nome_secretaria,
            sigla_secretaria,
            data_inicio,
            data_fim,
            ano,
            mes,
            str(pasta_destino_relatorio_temp), # Passa a pasta base dos pre-processados
            caminho_final_main_tex, # Caminho para o main.tex final
            google_drive_link,
            total_vulnerabilidades_web,
            total_vulnerabilidade_vm,
            webapp_risk_counts['Critical'],
            webapp_risk_counts['High'],
            webapp_risk_counts['Medium'],
            webapp_risk_counts['Low'],
            servers_risk_counts['critical'],
            servers_risk_counts['high'],
            servers_risk_counts['medium'],
            servers_risk_counts['low'],
            total_sites,
            criado_por_vm_scan, # NOVO: Passar o nome do criador do VM scan
            graph_output_vm_donut # NOVO: Passar o caminho do gráfico de donut de servidores
        )

        graph_output_webapp = str(pasta_destino_relatorio_temp / "RelatorioPronto" / "assets" / "images-was" / "vulnerabilidades-x-site.png") # Nome sanitizado
        gerar_Grafico_Quantitativo_Vulnerabilidades_Por_Site(
            str(pasta_destino_relatorio_temp / "vulnerabilidades_agrupadas_por_site.csv"),
            graph_output_webapp,
            "descendente"
        )
        
        # --- Alteração aqui: Definir pasta_final_latex corretamente antes de usá-la ---
        # Removido os.path.join pois pasta_destino_relatorio_temp já é um Path object
        # pasta_final_latex = str(pasta_destino_relatorio_temp / "RelatorioPronto")
        # compilar_latex(os.path.join(pasta_final_latex, "main.tex"), pasta_final_latex)

        # Correção da chamada para compilar_latex
        # A variável pasta_final_latex foi definida dentro do IF de servers_report_txt_path.exists()
        # Se esse IF for falso, pasta_final_latex não estaria definida para a chamada final.
        # Para evitar isso, ou defina-a fora do IF, ou use diretamente o caminho completo aqui.
        
        # Caminho final da pasta de saída do LaTeX
        final_latex_output_dir = str(pasta_destino_relatorio_temp / "RelatorioPronto")

        # Chama a função de compilação LaTeX
        compilar_latex(os.path.join(final_latex_output_dir, "main.tex"), final_latex_output_dir)

        db_instance.update_one("listas", {"_id": objeto_id}, {"relatorioGerado": True})
        db_instance.close()

        return str(novo_relatorio_id), 200

    except Exception as e:
        print(f"Erro ao gerar relatório de lista: {str(e)}")
        traceback.print_exc() # Para depuração
        if 'db_instance' in locals() and db_instance.client:
            db_instance.close()
        return jsonify({"error": f"Erro interno ao gerar relatório: {str(e)}"}), 500