import re
from flask import Blueprint, request, jsonify, send_file
from flask_cors import CORS, cross_origin
import os
from pathlib import Path
import shutil
from bson.objectid import ObjectId
import pandas as pd

# Importa a classe Config
from ..core.config import Config
# Importa o Database
from ..core.database import Database
# Importa as funções de processamento de dados
from ..data_processing.vulnerability_analyzer import processar_relatorio_csv, processar_relatorio_json, extrair_quantidades_vulnerabilidades_por_site
# Importa as funções de construção de relatório e compilação
from ..report_generation.report_builder import terminar_relatorio_preprocessado
from ..report_generation.latex_compiler import compilar_latex
from ..report_generation.plot_generator import gerar_Grafico_Quantitativo_Vulnerabilidades_Por_Site

# Inicializa a configuração e o banco de dados
config = Config("config.json")
db = Database() # Instância do banco de dados

reports_bp = Blueprint('reports', __name__, url_prefix='/reports')
#CORS(reports_bp, origins=["http://localhost:3000", "http://127.0.0.1:3000"]) # Adicione CORS para este blueprint AQUI

@reports_bp.route('/getRelatoriosGerados/', methods=['GET'])
#@cross_origin(origins=["http://localhost:5173", "http://127.0.0.1:5173"])
def getRelatoriosGerados():
    try:
        # A instância db já é globalmente acessível, mas recriar a conexão para cada requisição
        # é uma prática comum em Flask para evitar problemas de threading se a instância não for bem gerida.
        # No entanto, se for um singleton, a instância `db` global já serve.
        # Por simplicidade e consistência com o que já existe:
        db_instance = Database() # Cria uma nova instância da classe Database para a requisição
        relatorios = db_instance.find("relatorios")
        relatorios_list = []
        for relatorio in relatorios:
            relatorios_list.append({
                "nome": relatorio["nome"],
                "id": str(relatorio["_id"])
            })
        db_instance.close() # Fecha a conexão após o uso
        return jsonify(relatorios_list), 200
    except Exception as e:
        print(f"Erro ao obter relatórios gerados: {e}")
        return jsonify({"error": str(e)}), 500 # Alterado de 520 para 500 (Internal Server Error)

@reports_bp.route('/deleteRelatorio/<string:relatorio_id>', methods=['DELETE'])
#@cross_origin(origins=["http://localhost:5173", "http://127.0.0.1:5173"])
def deleteRelatorio(relatorio_id):
    try:
        db_instance = Database() # Cria uma nova instância da classe Database para a requisição
        
        delete_result = db_instance.delete_one("relatorios", {"_id": db_instance.get_object_id(relatorio_id)})
        
        if delete_result.deleted_count == 0:
            db_instance.close()
            return jsonify({"message": "Relatório não encontrado no banco de dados."}), 404

        # Caminho para a pasta do relatório gerado
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
        return jsonify({"error": f"Erro interno ao excluir relatório: {str(e)}"}), 500

@reports_bp.route('/deleteAllRelatorios/', methods=['DELETE'])
#@cross_origin(origins=["http://localhost:5173", "http://127.0.0.1:5173"])
def deleteAllRelatorios():
    try:
        db_instance = Database() # Cria uma nova instância da classe Database para a requisição
        
        # 1. Recuperar todos os relatórios para obter seus IDs (necessário para excluir as pastas)
        all_relatorios = db_instance.find("relatorios")
        
        # 2. Excluir todos os documentos do banco de dados
        delete_db_result = db_instance.delete_many("relatorios", {})
        
        # 3. Excluir todas as pastas de relatórios do sistema de arquivos
        deleted_folders_count = 0
        for relatorio in all_relatorios:
            relatorio_id = str(relatorio["_id"])
            report_folder_path = Path(config.caminho_shared_relatorios) / relatorio_id
            
            if report_folder_path.exists() and report_folder_path.is_dir():
                try:
                    shutil.rmtree(report_folder_path)
                    deleted_folders_count += 1
                    print(f"DEBUG: Pasta do relatório excluída: {report_folder_path}")
                except Exception as folder_e:
                    print(f"ATENÇÃO: Não foi possível excluir a pasta {report_folder_path}: {str(folder_e)}")
            else:
                print(f"DEBUG: Pasta {report_folder_path} não encontrada ou não é um diretório.")

        db_instance.close()
        return jsonify({
            "message": f"Todos os {delete_db_result.deleted_count} relatórios foram excluídos do banco de dados e {deleted_folders_count} pastas foram removidas do sistema de arquivos."
        }), 200

    except Exception as e:
        print(f"Erro ao excluir todos os relatórios: {str(e)}")
        return jsonify({"error": f"Erro interno ao excluir todos os relatórios: {str(e)}"}), 500

@reports_bp.route('/gerarRelatorioDeLista/', methods=['POST'])
#@cross_origin(origins=["http://localhost:5173", "http://127.0.0.1:5173"])
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

        db_instance = Database() # Cria nova instância de DB para esta requisição

        # Validar ObjectId
        try:
            objeto_id = ObjectId(id_lista)
        except Exception:
            db_instance.close()
            return jsonify({"error": "ID de lista inválido."}), 400
        
        lista_doc = db_instance.find_one("listas", {"_id": objeto_id})

        if not lista_doc:
            db_instance.close()
            return jsonify({"error": "Lista não encontrada."}), 404

        # Cria um novo registro para o relatório gerado
        novo_relatorio_id = db_instance.insert_one(
            "relatorios",
            {"nome": nome_secretaria, "id_lista": id_lista, "destino_relatorio_preprocessado" : None}
        ).inserted_id

        # =====================================================================
        # Definir caminhos para os arquivos temporários e finais do relatório
        # =====================================================================
        # Esta é a pasta raiz para os arquivos gerados para ESTE relatório específico
        pasta_destino_relatorio_temp = Path(config.caminho_shared_relatorios) / str(novo_relatorio_id) / "relatorio_preprocessado"
        pasta_destino_relatorio_temp.mkdir(parents=True, exist_ok=True)
        
        # A pasta de scans baixados para esta lista
        pasta_scans_da_lista = lista_doc.get("pastas_scans_webapp")

        # Atualiza o documento do relatório com o caminho de destino
        db_instance.update_one(
            "relatorios",
            {"_id": novo_relatorio_id},
            {"destino_relatorio_preprocessado": str(pasta_destino_relatorio_temp)}
        )

        # =====================================================================
        # Processamento de Scans WebApp (JSON)
        # =====================================================================
        # Se a pasta de scans webapp existir e não estiver vazia
        if pasta_scans_da_lista and os.path.exists(pasta_scans_da_lista) and len(os.listdir(pasta_scans_da_lista)) > 0:
            processar_relatorio_json(pasta_scans_da_lista, str(pasta_destino_relatorio_temp))
            # Extrair quantidades para o gráfico CSV
            output_csv_path = str(pasta_destino_relatorio_temp / "vulnerabilidades_agrupadas_por_site.csv")
            extrair_quantidades_vulnerabilidades_por_site(output_csv_path, pasta_scans_da_lista)
        else:
            print(f"Aviso: Não há scans WebApp na pasta {pasta_scans_da_lista} ou a pasta está vazia. Pulando processamento WebApp.")
            # Criar CSV vazio ou com cabeçalho para evitar erros no gráfico
            df_empty = pd.DataFrame(columns=['Site', 'Critical', 'High', 'Medium', 'Low', 'Total'])
            df_empty.to_csv(str(pasta_destino_relatorio_temp / "vulnerabilidades_agrupadas_por_site.csv"), index=False)
            
            # Criar arquivos TXT e LaTeX de WebApp vazios para evitar erros de arquivo não encontrado
            Path(pasta_destino_relatorio_temp / "Sites_agrupados_por_vulnerabilidades.txt").touch()
            Path(pasta_destino_relatorio_temp / "(LATEX)Sites_agrupados_por_vulnerabilidades.txt").touch()

        # =====================================================================
        # Processamento de Scans Servidores (CSV)
        # =====================================================================
        # Verifica se há um VM scan associado a esta lista
        if lista_doc.get("historyid_scanservidor") and lista_doc.get("id_scan"):
            # O `pasta_scans_da_lista` contém o CSV do VM scan também
            processar_relatorio_csv(pasta_scans_da_lista, str(pasta_destino_relatorio_temp))
        else:
            print("Aviso: Não há scans de Servidores associados a esta lista. Pulando processamento de Servidores.")
            # Criar arquivos TXT e LaTeX de Servidores vazios
            Path(pasta_destino_relatorio_temp / "Servidores_agrupados_por_vulnerabilidades.txt").touch()
            Path(pasta_destino_relatorio_temp / "(LATEX)Servidores_agrupados_por_vulnerabilidades.txt").touch()

        # =====================================================================
        # Leitura dos totais para o relatório final
        # =====================================================================
        # WebApp totals (do TXT gerado pelo processar_relatorio_json)
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

        # Servers totals (do TXT gerado pelo processar_relatorio_csv)
        servers_report_txt_path = pasta_destino_relatorio_temp / "Servidores_agrupados_por_vulnerabilidades.txt"
        servers_risk_counts = {'critical': '0', 'high': '0', 'medium': '0', 'low': '0'}
        total_vulnerabilidade_vm = '0'
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
        else:
            print(f"Aviso: Arquivo de resumo Servidores '{servers_report_txt_path}' não encontrado. Totais Servidores serão 0.")


        # =====================================================================
        # Finalizar Relatório LaTeX (Chama o report_builder.py)
        # =====================================================================
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
            total_sites
        )

        # =====================================================================
        # Gerar Gráficos (Chama o plot_generator.py)
        # =====================================================================
        # Gráfico de vulnerabilidades por site (Web App)
        graph_output_webapp = str(pasta_destino_relatorio_temp / "RelatorioPronto" / "assets" / "images-was" / "Vulnerabilidades_x_site.png")
        gerar_Grafico_Quantitativo_Vulnerabilidades_Por_Site(
            str(pasta_destino_relatorio_temp / "vulnerabilidades_agrupadas_por_site.csv"),
            graph_output_webapp,
            "descendente"
        )
        # Note: O gráfico total de vulnerabilidades (donut) está no report_builder.py,
        # e é gerado de forma diferente lá. Verifique se ele é gerado corretamente.
        # O gráfico 'Total_Vulnerabilidades.png' para WebApp e VM, gerado por gerar_grafico() no report_builder.py,
        # é chamado dentro do terminar_relatorio_preprocessado, que já é chamado aqui.
        # As imagens devem ser geradas lá.

        # =====================================================================
        # Compilação LaTeX (Chama o latex_compiler.py)
        # =====================================================================
        pasta_final_latex = str(pasta_destino_relatorio_temp / "RelatorioPronto")
        compilar_latex(os.path.join(pasta_final_latex, "main.tex"), pasta_final_latex)

        # =====================================================================
        # Copiar PDF final para a pasta de downloads do frontend
        # =====================================================================
        pasta_front_downloads = Path("../front-end/downloads") / str(novo_relatorio_id)
        pasta_front_downloads.mkdir(parents=True, exist_ok=True)
        
        shutil.copy(
            Path(pasta_final_latex) / "main.pdf",
            pasta_front_downloads / "main.pdf"
        )
        print(f"PDF final copiado para {pasta_front_downloads}/main.pdf")

        db_instance.update_one("listas", {"_id": objeto_id}, {"relatorioGerado": True})
        db_instance.close()

        return str(novo_relatorio_id), 200

    except Exception as e:
        print(f"Erro ao gerar relatório de lista: {str(e)}")
        # Garante que a conexão com o DB seja fechada em caso de erro
        if 'db_instance' in locals() and db_instance.client:
            db_instance.close()
        return jsonify({"error": f"Erro interno ao gerar relatório: {str(e)}"}), 500

@reports_bp.route('/getRelatorioMissingVulnerabilities/', methods=['GET'])
#@cross_origin(origins=["http://localhost:5173", "http://127.0.0.1:5173"])
def get_report_missing_vulnerabilities():
    try:
        relatorio_id = request.args.get('relatorioId')
        report_type = request.args.get('type') 

        if not relatorio_id or not report_type:
            return jsonify({"error": "Parâmetros 'relatorioId' e 'type' são obrigatórios."}), 400

        # O arquivo TXT está na pasta relatorio_preprocessado dentro da pasta do relatório
        caminho_base_preprocessado = Path(config.caminho_shared_relatorios) / str(relatorio_id) / "relatorio_preprocessado"
        
        file_name = ""
        if report_type == "sites":
            file_name = "vulnerabilidades_sites_ausentes.txt" 
        elif report_type == "servers":
            file_name = "vulnerabilidades_servidores_ausentes.txt"
        else:
            return jsonify({"error": "Tipo de relatório inválido. Use 'sites' ou 'servers'."}), 400

        caminho_completo_txt = caminho_base_preprocessado / file_name

        if os.path.exists(caminho_completo_txt) and os.path.isfile(caminho_completo_txt):
            with open(caminho_completo_txt, 'r', encoding='utf-8') as f:
                content = f.read()
            return jsonify({"content": content.splitlines()}), 200
        else:
            return jsonify({"message": f"Arquivo de vulnerabilidades ausentes não encontrado para o tipo '{report_type}' no caminho: {caminho_completo_txt}"}), 404

    except Exception as e:
        print(f"Erro interno ao buscar vulnerabilidades ausentes: {str(e)}")
        return jsonify({"error": f"Erro interno ao buscar vulnerabilidades ausentes: {str(e)}"}), 500

@reports_bp.route('/baixarRelatorioPdf/', methods=['POST'])
#@cross_origin(origins=["http://localhost:5173", "127.0.0.1"])
def baixar_relatorio_pdf():
    try:
        data = request.get_json()

        id_relatorio = data.get("idRelatorio")

        if not id_relatorio:
            return jsonify({"error": "ID do relatório não fornecido."}), 400

        # Caminho do PDF dentro da nova estrutura
        # /app/shared_data/generated_reports/<id_relatorio>/relatorio_preprocessado/RelatorioPronto/main.pdf
        caminho_pdf_destino = Path(config.caminho_shared_relatorios) / id_relatorio / "relatorio_preprocessado" / "RelatorioPronto" / "main.pdf"
        
        if not caminho_pdf_destino.exists():
            print(f"PDF não encontrado: {caminho_pdf_destino}")
            return jsonify({"error": "PDF do relatório não encontrado."}), 404

        # Tentar enviar o arquivo
        return send_file(
            str(caminho_pdf_destino),
            as_attachment=True,
            download_name=f"Relatorio_{id_relatorio}.pdf", # Pode usar o nome da secretaria aqui se quiser
            mimetype="application/pdf"
        )

    except Exception as e:
        print(f"Erro interno ao baixar relatório PDF: {str(e)}")
        return jsonify({"error": f"Erro interno: {str(e)}"}), 500