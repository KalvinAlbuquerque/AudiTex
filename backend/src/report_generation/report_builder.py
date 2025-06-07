import json
import re
import os
import shutil
from typing import List, Dict, Any
from pathlib import Path
from datetime import datetime, date
from babel.dates import format_date

# Importa as funções de utilidade e JSON do core
from ..core.json_utils import carregar_json_utf, _load_data_
from ..core.config import Config

# Inicializa a configuração
config = Config("config.json")

# =======================================================================
# FUNÇÕES DE CARREGAMENTO DE VULNERABILIDADES DE ARQUIVOS TXT DE RELATÓRIO
# Essas funções foram movidas para cá de json_parser.py e csv_parser.py
# =======================================================================
def carregar_vulnerabilidades_do_relatorio(caminho_arquivo: str) -> List[Dict[str, Any]]:
    """
    Carrega e extrai informações de vulnerabilidades a partir de um arquivo TXT de relatório de Web App.

    Parâmetros:
    - caminho_arquivo (str): O caminho completo do arquivo TXT contendo as vulnerabilidades.

    Retorno:
    - list: Uma lista de dicionários, onde cada dicionário contém os dados de uma vulnerabilidade.
    """
    vulnerabilities = []
    with open(caminho_arquivo, 'r', encoding="utf-8") as file:
        vulnerability = None
        total_affected_uris = None
        affected_uris = []
        for line in file:
            line = line.strip()
            match_vulnerability = re.match(r"^Vulnerabilidade:(.*)", line)
            if match_vulnerability:
                if vulnerability:
                    vulnerabilities.append({
                        "Vulnerabilidade": vulnerability,
                        "Total de URI Afetadas": total_affected_uris,
                        "URI Afetadas": affected_uris
                    })
                vulnerability = match_vulnerability.group(1).strip()
                affected_uris = []
                continue
            match_total_uris = re.match(r"^Total de URI Afetadas:(\d+)", line)
            if match_total_uris:
                total_affected_uris = int(match_total_uris.group(1))
                continue
            match_uris = re.match(r"^http(s)?://.*", line)
            if match_uris:
                affected_uris.append(line)
        if vulnerability:
            vulnerabilities.append({
                "Vulnerabilidade": vulnerability,
                "Total de URI Afetadas": total_affected_uris,
                "URI Afetadas": affected_uris
            })
    return vulnerabilities

def carregar_vulnerabilidades_do_relatorio_csv(caminho_arquivo: str) -> List[Dict[str, Any]]:
    """
    Carrega e extrai informações de vulnerabilidades e hosts afetados a partir de um arquivo TXT de relatório de Servidores.

    Parâmetros:
    - caminho_arquivo (str): O caminho completo do arquivo TXT contendo as vulnerabilidades.

    Retorno:
    - list: Uma lista de dicionários com dados de cada vulnerabilidade.
    """
    vulnerabilities = []
    with open(caminho_arquivo, 'r', encoding="utf-8") as file:
        vulnerability = None
        severity = None
        collecting_hosts = False
        affected_hosts = []
        for line in file:
            line = line.strip()
            match_vuln = re.match(r'^Vulnerabilidade:\s*(.+)', line)
            if match_vuln:
                if vulnerability:
                    vulnerabilities.append({
                        "Vulnerabilidade": vulnerability,
                        "Severidade": severity,
                        "Total de Hosts Afetados": len(affected_hosts),
                        "Hosts": affected_hosts
                    })
                vulnerability = match_vuln.group(1).strip()
                severity = None
                affected_hosts = []
                collecting_hosts = False
                continue
            match_sev = re.match(r'^Severidade:\s*(.+)', line)
            if match_sev:
                severity = match_sev.group(1).strip().lower()
                collecting_hosts = False
                continue
            if line.startswith("Hosts Afetados:"):
                collecting_hosts = True
                continue
            if collecting_hosts and line and not line.startswith("Vulnerabilidade:"):
                affected_hosts.append(line.strip())
        if vulnerability:
            vulnerabilities.append({
                "Vulnerabilidade": vulnerability,
                "Severidade": severity,
                "Total de Hosts Afetados": len(affected_hosts),
                "Hosts": affected_hosts
            })
    return vulnerabilities
# =======================================================================


def gerar_relatorio_txt(output_file: str, risk_factor_counts: dict, common_vulnerabilities: dict, targets: List[str]):
    """
    Gera um relatório de texto com as vulnerabilidades de web apps e as informações coletadas.
    """
    try:
        with open(output_file, 'w', encoding='utf-8') as output:
            output.write("Resumo das Vulnerabilidades por Risk Factor (Web Apps):\n\n")
            output.write(f"Critical: {risk_factor_counts['Critical']}\n")
            output.write(f"High: {risk_factor_counts['High']}\n")
            output.write(f"Medium: {risk_factor_counts['Medium']}\n")
            output.write(f"Low: {risk_factor_counts['Low']}\n")
            total = sum(risk_factor_counts.values())
            output.write(f"Total de Vulnerabilidades: {total}\n\n")
            output.write("\nDomínios analisados:\n")
            output.write(f"\nTotal de sites: {len(targets)}\n")
            output.write("\n".join(targets))
            output.write("\n\nVulnerabilidades em comum, entre os sites/URI:\n\n")
            sorted_vulnerabilities = sorted(common_vulnerabilities.items(), key=lambda x: len(set(x[1])), reverse=True)
            for (name, plugin_id), uris in sorted_vulnerabilities: # 'plugin_id' ainda está aqui para iteração, mas não será impresso
                if len(uris) > 1:
                    unique_uris = sorted(list(set(uris)))
                    output.write(f"\nVulnerabilidade: {name}\n")
                    # REMOVIDO: output.write(f"Plugin ID: {plugin_id}\n")
                    output.write(f"Total de URI Afetadas: {len(unique_uris)}\n")
                    output.write(f"URI Afetadas:\n")
                    for url in unique_uris:
                        output.write(f"{url}\n")
        print(f"Relatório TXT para Web Apps gerado em: {output_file}")
    except Exception as e:
        print(f"Erro ao gerar relatório TXT para Web Apps: {e}")
                    
def gerar_relatorio_txt_csv(output_file: str, risk_factor_counts: dict, common_vulnerabilities: dict, targets: List[str]):
    """
    Gera um relatório de texto com as vulnerabilidades de servidores e as informações coletadas.
    """
    try:
        with open(output_file, 'w', encoding='utf-8') as output:
            output.write("Resumo das Vulnerabilidades por Risk Factor (Servidores):\n\n")
            output.write(f"Critical: {risk_factor_counts.get('critical', 0)}\n")
            output.write(f"High: {risk_factor_counts.get('high', 0)}\n")
            output.write(f"Medium: {risk_factor_counts.get('medium', 0)}\n")
            output.write(f"Low: {risk_factor_counts.get('low', 0)}\n")
            total = sum(risk_factor_counts.values())
            output.write(f"\nTotal de Vulnerabilidades: {total}\n\n")
            output.write("Hosts analisados:\n")
            output.write(f"Total de Hosts: {len(targets)}\n")
            output.write("\n".join(targets))
            output.write("\n\nVulnerabilidades em comum entre os Hosts:\n\n")
            sorted_vulnerabilities = sorted(
                common_vulnerabilities.items(),
                key=lambda item: len(item[1]['hosts']),
                reverse=True
            )
            for name, data in sorted_vulnerabilities:
                hosts_afetados = sorted(data['hosts'])
                riscos = sorted(data['risks'])
                output.write(f"\nVulnerabilidade: {name}\n")
                output.write(f"Severidade: {', '.join(riscos).capitalize()}\n")
                output.write(f"Total de Hosts Afetados: {len(hosts_afetados)}\n")
                output.write("Hosts Afetados:\n")
                for host in hosts_afetados:
                    output.write(f"{host}\n")
        print(f"Relatório TXT para Servidores gerado em: {output_file}")
    except Exception as e:
        print(f"Erro ao gerar relatório TXT para Servidores: {e}")

def carregar_descritivo_vulnerabilidades(caminho_arquivo: str) -> List[Dict[str, Any]]:
    """
    Carrega e organiza as informações de categorias e subcategorias de vulnerabilidades
    a partir de um arquivo JSON descritivo.
    """
    descritivo = []
    dados = _load_data_(caminho_arquivo)
    for categoria in dados.get("vulnerabilidades", []):
        categoria_nome = categoria["categoria"]
        categoria_descricao = categoria["descricao"]
        descritivo.append({
            "categoria": categoria_nome,
            "descricao": categoria_descricao
        })
        for subcategoria in categoria.get("subcategorias", []):
            descritivo.append({
                "categoria": categoria_nome,
                "subcategoria": subcategoria["subcategoria"],
                "descricao": subcategoria["descricao"]
            })
    return descritivo

def gerar_conteudo_latex_para_vulnerabilidades(
    vulnerabilidades_do_relatorio_txt: List[Dict[str, Any]],
    vulnerabilidades_detalhes_json: List[Dict[str, Any]],
    descritivo_vulnerabilidades_json: Dict[str, Any],
    tipo_vulnerabilidade: str
) -> str:
    """
    Gera o conteúdo em LaTeX para as vulnerabilidades.
    """
    def padronizar(texto: str) -> str:
        return texto.strip().lower() if texto else ""

    conteudo = ""
    anexo_conteudo = ""
    categorias_agrupadas: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
    categorias_formatadas: Dict[str, str] = {}
    vulnerabilidades_sem_categoria: List[str] = []

    descritivo_list = descritivo_vulnerabilidades_json.get("vulnerabilidades", [])

    for v in vulnerabilidades_do_relatorio_txt:
        vulnerabilidade_nome = v["Vulnerabilidade"]
        dados_vuln = next(
            (vuln for vuln in vulnerabilidades_detalhes_json if vuln.get("Vulnerabilidade") == vulnerabilidade_nome),
            None
        )
        if dados_vuln:
            categoria_original = dados_vuln.get("Categoria", "Sem Categoria")
            subcategoria_original = dados_vuln.get("Subcategoria", "Outras")
            descricao = dados_vuln.get("Descrição", "Descrição não disponível.")
            solucao = dados_vuln.get("Solução", "Solução não disponível.")
            imagem = dados_vuln.get("Imagem", "")
            categoria_pad = padronizar(categoria_original)
            subcategoria_pad = padronizar(subcategoria_original)
            categorias_formatadas[categoria_pad] = categoria_original
            categorias_formatadas[subcategoria_pad] = subcategoria_original
            if categoria_pad not in categorias_agrupadas:
                categorias_agrupadas[categoria_pad] = {}
            if subcategoria_pad not in categorias_agrupadas[categoria_pad]:
                categorias_agrupadas[categoria_pad][subcategoria_pad] = []
            item_para_agrupar = {
                "Vulnerabilidade": vulnerabilidade_nome,
                "Descricao": descricao,
                "Solucao": solucao,
                "Imagem": imagem,
            }
            if tipo_vulnerabilidade == "webapp":
                item_para_agrupar["Total de URIs Afetadas"] = v.get("Total de URI Afetadas", 0)
                item_para_agrupar["URIs Afetadas"] = v.get("URI Afetadas", [])
            else:
                item_para_agrupar["Total de Hosts Afetados"] = v.get("Total de Hosts Afetados", 0)
                item_para_agrupar["Hosts Afetados"] = v.get("Hosts", [])
            categorias_agrupadas[categoria_pad][subcategoria_pad].append(item_para_agrupar)
        else:
            vulnerabilidades_sem_categoria.append(vulnerabilidade_nome)

    categorias_ordenadas = sorted(categorias_agrupadas.keys(), key=lambda x: categorias_formatadas.get(x, x))
    outras_criticas_key = padronizar("Outras Vulnerabilidades Críticas e Explorações")
    if outras_criticas_key in categorias_ordenadas:
        categorias_ordenadas.remove(outras_criticas_key)
        categorias_ordenadas.append(outras_criticas_key)

    for categoria_padronizada in categorias_ordenadas:
        categoria_formatada = categorias_formatadas.get(categoria_padronizada, categoria_padronizada)
        descricao_categoria = next(
            (item["descricao"] for item in descritivo_list
             if padronizar(item.get("categoria")) == categoria_padronizada and "subcategoria" not in item),
            "Descrição não disponível."
        )
        conteudo += f"%-------------- INÍCIO DA CATEGORIA {categoria_formatada} --------------\n"
        conteudo += f"\\subsection{{{categoria_formatada}}}\n{descricao_categoria}\n\n"

        subcategorias = categorias_agrupadas.get(categoria_padronizada, {})
        for subcategoria_padronizada in sorted(subcategorias.keys(), key=lambda x: categorias_formatadas.get(x, x)):
            subcategoria_formatada = categorias_formatadas.get(subcategoria_padronizada, subcategoria_padronizada)
            descricao_subcategoria = next(
                (item["descricao"] for item in descritivo_list
                 if padronizar(item.get("categoria")) == categoria_padronizada and
                    padronizar(item.get("subcategoria")) == subcategoria_padronizada),
                "Descrição não disponível."
            )
            conteudo += f"%-------------- INÍCIO DA SUBCATEGORIA {subcategoria_formatada} --------------\n"
            conteudo += f"\\subsubsection{{{subcategoria_formatada}}}\n{descricao_subcategoria}\n\n"
            conteudo += "\\begin{enumerate}\n"

            vulns_ordenadas = sorted(subcategorias[subcategoria_padronizada], key=lambda x: x['Vulnerabilidade'])
            for v in vulns_ordenadas:
                conteudo += f"%-------------- INÍCIO DA VULNERABILIDADE {v['Vulnerabilidade']} --------------\n"
                conteudo += f"\\item \\textbf{{\\texttt{{{v['Vulnerabilidade']}}}}}\n"
                if v["Imagem"]:
                    caminho_imagem_latex = v["Imagem"].replace(os.sep, '/')
                    conteudo += (
                        r"""
                        \begin{figure}[h!]
                        \centering
                        \includegraphics[width=0.8\textwidth]{""" + caminho_imagem_latex + r"""}
                        \end{figure}
                        \FloatBarrier
                        """
                    )
                conteudo += f"\\textbf{{Descrição:}} {v['Descricao']}\n\n"
                conteudo += f"\\textbf{{Solução:}} {v['Solucao']}\n\n"

                if tipo_vulnerabilidade == "webapp":
                    conteudo += f"\\textbf{{Total de URIs Afetadas:}} {v.get('Total de URIs Afetadas', 0)}\n\n"
                    instancias_afetadas = v.get("URIs Afetadas", [])
                    label_instancias = "URIs Afetadas"
                else:
                    conteudo += f"\\textbf{{Total de Hosts Afetados:}} {v.get('Total de Hosts Afetados', 0)}\n\n"
                    instancias_afetadas = v.get("Hosts Afetados", [])
                    label_instancias = "Hosts Afetados"

                if len(instancias_afetadas) > 10:
                    conteudo += f"\\textbf{{{label_instancias} (parcial):}}\n\\begin{{itemize}}\n"
                    for instancia in instancias_afetadas[:10]:
                        conteudo += f"    \\item \\url{{{instancia}}}\n"
                    conteudo += "\\end{itemize}\n"
                    conteudo += (
                        "A lista completa das instâncias que possuem esta vulnerabilidade pode ser "
                        f"encontrada no \\hyperref[anexoA]{{Anexo A}}.\\\\[0.5em]\n\n"
                    )

                    anexo_conteudo += f"%-------------- INÍCIO DO ANEXO PARA {v['Vulnerabilidade']} --------------\n"
                    anexo_conteudo += f"\\subsubsection*{{{v['Vulnerabilidade']}}}\n"
                    anexo_conteudo += "\\begin{multicols}{3}\n\\small\n\\begin{itemize}\n"
                    for instancia in instancias_afetadas:
                        anexo_conteudo += f"    \\item \\url{{{instancia}}}\n"
                    anexo_conteudo += "\\end{itemize}\n\\end{multicols}\n\n"
                else:
                    conteudo += f"\\textbf{{{label_instancias}:}}\n\\begin{{itemize}}\n"
                    for instancia in instancias_afetadas:
                        conteudo += f"    \\item \\url{{{instancia}}}\n"
                    conteudo += "\\end{itemize}\n\n"
                conteudo += f"%-------------- FIM DA VULNERABILIDADE {v['Vulnerabilidade']} --------------\n"

            conteudo += "\\end{enumerate}\n"
            conteudo += f"%-------------- FIM DA SUBCATEGORIA {subcategoria_formatada} --------------\n"

        conteudo += f"%-------------- FIM DA CATEGORIA {categoria_formatada} --------------\n"

    if vulnerabilidades_sem_categoria:
        conteudo += "%-------------- INÍCIO DAS VULNERABILIDADES SEM CATEGORIA --------------\n"
        conteudo += "\\section{Vulnerabilidades sem Categoria}\n\\begin{itemize}\n"
        for vuln_nome in vulnerabilidades_sem_categoria:
            conteudo += f"    \\item \\texttt{{{vuln_nome}}}\n"
        conteudo += "\\end{itemize}\n"
        conteudo += "%-------------- FIM DAS VULNERABILIDADES SEM CATEGORIA --------------\n"

    if anexo_conteudo:
        conteudo += "%-------------- INÍCIO DO ANEXO A --------------\n"
        conteudo += "\\section*{Anexo A}\n\\label{anexoA}\n"
        conteudo += anexo_conteudo
        conteudo += "%-------------- FIM DO ANEXO A --------------\n"

    return conteudo


def montar_conteudo_latex(
    caminho_saida_latex_temp: str,
    caminho_relatorio_txt_webapp: str,
    caminho_dados_vulnerabilidades_webapp_json: str,
    caminho_descritivo_webapp_json: str
):
    """
    Monta o conteúdo LaTeX para o relatório de vulnerabilidades de Web Apps.
    """
    try:
        vulnerabilidades_do_txt = carregar_vulnerabilidades_do_relatorio(caminho_relatorio_txt_webapp)
        vulnerabilidades_dados_json = carregar_json_utf(caminho_dados_vulnerabilidades_webapp_json)
        descritivo_json = carregar_json_utf(caminho_descritivo_webapp_json)

        conteudo_latex_final = gerar_conteudo_latex_para_vulnerabilidades(
            vulnerabilidades_do_txt,
            vulnerabilidades_dados_json,
            descritivo_json,
            "webapp"
        )

        with open(caminho_saida_latex_temp, 'w', encoding='utf-8') as file:
            file.write(conteudo_latex_final)
        print(f"Conteúdo LaTeX para Web Apps gerado em: {caminho_saida_latex_temp}")
    except Exception as e:
        print(f"Erro ao montar conteúdo LaTeX para Web Apps: {e}")

def montar_conteudo_latex_csv(
    caminho_saida_latex_temp: str,
    caminho_relatorio_txt_servers: str,
    caminho_dados_vulnerabilidades_servers_json: str,
    caminho_descritivo_servers_json: str
):
    """
    Monta o conteúdo LaTeX para o relatório de vulnerabilidades de Servidores (CSV).
    """
    try:
        vulnerabilidades_do_txt_csv = carregar_vulnerabilidades_do_relatorio_csv(caminho_relatorio_txt_servers)
        vulnerabilidades_dados_json = carregar_json_utf(caminho_dados_vulnerabilidades_servers_json)
        descritivo_json = carregar_json_utf(caminho_descritivo_servers_json)

        conteudo_latex_final = gerar_conteudo_latex_para_vulnerabilidades(
            vulnerabilidades_do_txt_csv,
            vulnerabilidades_dados_json,
            descritivo_json,
            "servers"
        )

        with open(caminho_saida_latex_temp, 'w', encoding='utf-8') as file:
            file.write(conteudo_latex_final)
        print(f"Conteúdo LaTeX para Servidores gerado em: {caminho_saida_latex_temp}")
    except Exception as e:
        print(f"Erro ao montar conteúdo LaTeX para Servidores: {e}")


def copiar_relatorio_exemplo(caminho_relatorio_exemplo: str, caminho_saida: str):
    """
    Copia a estrutura base do template LaTeX para a pasta de geração do relatório.
    """
    try:
        src = Path(caminho_relatorio_exemplo)
        dst = Path(caminho_saida)
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
        print(f"Estrutura base do relatório copiada de '{src}' para '{dst}'")

        # --- NOVO: Verificação explícita do arquivo preambulo.tex após a cópia ---
        copied_preambulo_path = dst / "preambulo.tex"
        if copied_preambulo_path.exists():
            print(f"DEBUG: 'preambulo.tex' foi copiado com sucesso para: {copied_preambulo_path}")
        else:
            print(f"ERRO: 'preambulo.tex' NÃO foi encontrado em: {copied_preambulo_path} APÓS a cópia.")
        # --- FIM NOVO ---

    except Exception as e:
        print(f"Erro ao copiar a estrutura de exemplo do relatório: {e}")


def substituir_placeholders(conteudo: str, substituicoes_globais: Dict[str, str]) -> str:
    """
    Substitui placeholders [CHAVE] no conteúdo LaTeX por valores fornecidos.
    """
    for alvo, novo in substituicoes_globais.items():
        conteudo = conteudo.replace(f'[{alvo}]', novo)
    return conteudo

def terminar_relatorio_preprocessado(
    nome_secretaria: str,
    sigla_secretaria: str,
    inicio_data: str,
    fim_data: str,
    ano_conclusao: str,
    mes_conclusao: str,
    caminho_relatorio_preprocessado: str,
    caminho_saida_relatorio_final_latex: str,
    google_drive_link: str,
    total_vulnerabilidades_web: str,
    total_vulnerabilidade_vm: str,
    total_vulnerabilidades_criticas_web: str,
    total_vulnerabilidades_alta_web: str,
    total_vulnerabilidades_media_web: str,
    total_vulnerabilidades_baixa_web: str,
    total_vulnerabilidades_criticas_servidores: str,
    total_vulnerabilidades_alta_servidores: str,
    total_vulnerabilidades_media_servidores: str,
    total_vulnerabilidades_baixa_servidores: str,
    total_sites: str,
    criado_por_vm_scan: str # <--- NOVO: Adicione este parâmetro
):
    """
    Finaliza o relatório LaTeX, inserindo os conteúdos preprocessados e placeholders.
    """
    caminho_relatorio_pronto = os.path.join(caminho_relatorio_preprocessado, "RelatorioPronto")

    copiar_relatorio_exemplo(
        os.path.join(config.caminho_report_templates_base),
        caminho_relatorio_pronto
    )

    with open(os.path.join(caminho_relatorio_pronto, 'main.tex'), 'r', encoding='utf-8') as f:
        latex_code = f.read()

    relatorio_sites_conteudo = []
    caminho_sites_vulnerabilidades_latex = os.path.join(caminho_relatorio_preprocessado, "(LATEX)Sites_agrupados_por_vulnerabilidades.txt")
    if os.path.exists(caminho_sites_vulnerabilidades_latex):
        with open(caminho_sites_vulnerabilidades_latex, "r", encoding='utf-8') as file:
            relatorio_sites_conteudo = file.readlines()
    else:
        print(f"Aviso: Arquivo '{caminho_sites_vulnerabilidades_latex}' não encontrado.")
    relatorio_sites_final = ''.join(relatorio_sites_conteudo)

    relatorio_servidores_conteudo = []
    caminho_servidores_vulnerabilidades_latex = os.path.join(caminho_relatorio_preprocessado, "(LATEX)Servidores_agrupados_por_vulnerabilidades.txt")
    if os.path.exists(caminho_servidores_vulnerabilidades_latex):
        with open(caminho_servidores_vulnerabilidades_latex, "r", encoding='utf-8') as file:
            relatorio_servidores_conteudo = file.readlines()
    else:
        print(f"Aviso: Arquivo '{caminho_servidores_vulnerabilidades_latex}' não encontrado.")
    relatorio_servidores_final = ''.join(relatorio_servidores_conteudo)

    total_vulnerabilidades_combinado = int(total_vulnerabilidades_web) + int(total_vulnerabilidade_vm)

    substituicoes_globais = {
        'NOME SECRETARIA': nome_secretaria,
        'SIGLA': sigla_secretaria,
        'INICIO DATA': inicio_data,
        'FIM DATA': fim_data,
        'MES CONCLUSAO': mes_conclusao,
        'ANO CONCLUSAO': ano_conclusao,
        'GOOGLE DRIVE LINK': google_drive_link,
        'RELATORIO GERADO': relatorio_sites_final,
        'RELATORIO SERVIDORES': relatorio_servidores_final,
        'TOTAL VULNERABILIDADES': str(total_vulnerabilidades_combinado),
        'TOTAL VULNERABILIDADES WEB': total_vulnerabilidades_web,
        'TOTAL VULNERABILIDADES VM': total_vulnerabilidade_vm,
        'TOTAL VULNERABILIDADES WAS CRITICA': total_vulnerabilidades_criticas_web,
        'TOTAL VULNERABILIDADES WAS ALTA': total_vulnerabilidades_alta_web,
        'TOTAL VULNERABILIDADES WAS MEDIA': total_vulnerabilidades_media_web,
        'TOTAL VULNERABILIDADES WAS BAIXA': total_vulnerabilidades_baixa_web,
        'TOTAL VULNERABILIDADES SERVIDORES CRITICA': total_vulnerabilidades_criticas_servidores,
        'TOTAL VULNERABILIDADES SERVIDORES ALTA': total_vulnerabilidades_alta_servidores,
        'TOTAL VULNERABILIDADES SERVIDORES MEDIA': total_vulnerabilidades_media_servidores,
        'TOTAL VULNERABILIDADES SERVIDORES BAIXA': total_vulnerabilidades_baixa_servidores,
        'TOTAL_SITES': total_sites,
        'CRIADO_POR_VM_SCAN': criado_por_vm_scan, # <--- NOVO: Adicione este placeholder
    }

    latex_editado = substituir_placeholders(
        conteudo=latex_code,
        substituicoes_globais=substituicoes_globais
    )

    with open(os.path.join(caminho_relatorio_pronto, "main.tex"), "w", encoding="utf-8") as f:
        f.write(latex_editado)
    print(f"Relatório LaTeX final (main.tex) salvo em: {os.path.join(caminho_relatorio_pronto, 'main.tex')}")