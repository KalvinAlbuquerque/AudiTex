from collections import defaultdict
import os
import pandas as pd
# Importa _load_data do json_utils.py (no mesmo nível ou de core)
from .json_utils import _load_data 

# CSV_PATH será removido daqui, pois a criação/adição de linhas CSV
# será gerenciada no módulo de processamento de dados, que terá acesso à Config
# CSV_PATH = "data/relatórios_prontos/vulnerabilidades_agrupadas_por_site.csv" 
# Remover essa linha

def formatar_uri(target: str, uri: str) -> str:
    """
    Formata a URI com o domínio do alvo e a URI específica.

    Parâmetros:
    - target (str): O domínio do alvo.
    - uri (str): A URI específica da vulnerabilidade.

    Retorna:
    - str: URI formatada.
    """
    return f"{target}{uri}"

def limpar_protocolos_url(target: str) -> str:
    """
    Limpa o nome do site para remover 'http://', 'https://' e outros elementos.
    
    Parâmetros:
    - target (str): URL do site.
    
    Retorno:
    - str: Nome do site limpo.
    """
    # A verificação '.saude' pode ser específica e talvez deva ser configurável
    # ou tratada de forma mais genérica, mas mantemos por enquanto.
    return target.replace('http://', '').replace('https://', '').split('.saude')[0]    

def contar_riscos(findings: list) -> dict:
    """
    Conta a quantidade de vulnerabilidades para cada nível de risco.

    Parâmetros:
    - findings (list): Lista de vulnerabilidades encontradas no arquivo JSON.

    Retorno:
    - dict: Contagem de vulnerabilidades por nível de risco.
    """
    risk_factor_counts = {'High': 0, 'Critical': 0, 'Low': 0, 'Medium': 0}

    for finding in findings:
        risk_factor = finding.get('risk_factor', 'Não disponível')
        if "info" not in risk_factor:
            if risk_factor.lower() == 'high':
                risk_factor_counts['High'] += 1
            elif risk_factor.lower() == 'critical':
                risk_factor_counts['Critical'] += 1
            elif risk_factor.lower() == 'low':
                risk_factor_counts['Low'] += 1
            elif risk_factor.lower() == 'medium':
                risk_factor_counts['Medium'] += 1

    return risk_factor_counts


def verificar_e_salvar_vulnerabilidades_ausentes(
    vulnerabilidades_identificadas: dict, # Pode ser defaultdict ou dict normal
    caminho_json_descricoes: str,
    caminho_diretorio_txt: str,
    nome_arquivo_txt: str
) -> tuple[bool, str, list[str]]:
    """
    Verifica quais vulnerabilidades identificadas não possuem descrição no JSON
    de descrições e salva as ausentes em um arquivo TXT.
    Lida com defaultdicts (chaves como (nome, id)) ou dicionários simples (chaves como nome).

    Args:
        vulnerabilidades_identificadas (dict): Um dicionário de vulnerabilidades,
            onde as chaves podem ser (nome_vulnerabilidade, id_vulnerabilidade) ou
            apenas nome_vulnerabilidade (string).
        caminho_json_descricoes (str): O caminho completo para o arquivo JSON
            que contém as descrições das vulnerabilidades.
        caminho_diretorio_txt (str): O caminho do diretório onde o arquivo TXT será salvo.
        nome_arquivo_txt (str): O nome do arquivo TXT.

    Returns:
        tuple[bool, str, list[str]]: Uma tupla (True, mensagem de sucesso, lista_de_ausentes)
        ou (False, mensagem de erro, lista_de_ausentes).
    """
    # Usando _load_data do core.json_utils
    vulnerabilidades_json_data = _load_data(caminho_json_descricoes)
    
    # Se o _load_data_ foi usado para carregar o JSON descritivo, ele retorna um dict
    # com a chave "vulnerabilidades", então precisamos ajustar como acessamos os dados.
    if isinstance(vulnerabilidades_json_data, dict) and "vulnerabilidades" in vulnerabilidades_json_data:
        vulnerabilidades_json = vulnerabilidades_json_data["vulnerabilidades"]
    else:
        vulnerabilidades_json = vulnerabilidades_json_data # Se já for a lista direta
        
    vulnerabilidades_nomes_json = {
        vuln.get('Vulnerabilidade') for vuln in vulnerabilidades_json if vuln.get('Vulnerabilidade')
    }

    vulnerabilidades_nao_encontradas = []

    for chave_vuln_identificada in vulnerabilidades_identificadas.keys():
        vuln_nome = ""
        if isinstance(chave_vuln_identificada, tuple) and len(chave_vuln_identificada) >= 1:
            vuln_nome = chave_vuln_identificada[0] # Pega o nome da tupla (nome, id)
        elif isinstance(chave_vuln_identificada, str):
            vuln_nome = chave_vuln_identificada # A chave já é o nome
        else:
            print(f"Aviso: Tipo de chave inesperado encontrado: {type(chave_vuln_identificada)}. Pulando.")
            continue

        if vuln_nome and vuln_nome not in vulnerabilidades_nomes_json:
            if vuln_nome not in vulnerabilidades_nao_encontradas:
                vulnerabilidades_nao_encontradas.append(vuln_nome)

    if not vulnerabilidades_nao_encontradas:
        return True, "Todas as vulnerabilidades identificadas foram encontradas no JSON de descrições.", []

    try:
        os.makedirs(caminho_diretorio_txt, exist_ok=True)
    except OSError as e:
        return False, f"Erro ao criar o diretório '{caminho_diretorio_txt}': {e}", vulnerabilidades_nao_encontradas

    caminho_completo_txt = os.path.join(caminho_diretorio_txt, nome_arquivo_txt)

    try:
        with open(caminho_completo_txt, 'w', encoding='utf-8') as f:
            for vuln_nome in vulnerabilidades_nao_encontradas:
                f.write(vuln_nome + '\n')
        return True, f"Vulnerabilidades não encontradas salvas em: {caminho_completo_txt}", vulnerabilidades_nao_encontradas
    except IOError as e:
        return False, f"Erro de I/O ao salvar o arquivo TXT: {e}", vulnerabilidades_nao_encontradas
    except Exception as e:
        return False, f"Erro inesperado ao salvar TXT: {e}", vulnerabilidades_nao_encontradas

# --- Funções auxiliares (para o seu backend/app.py) ---
def extrair_nomes_vulnerabilidades_identificadas(vulnerabilidades_agrupadas: defaultdict) -> list[str]:
    """
    Extrai uma lista única de nomes de vulnerabilidades a partir do defaultdict.
    """
    nomes_unicos = set()
    for (vuln_nome, vuln_id) in vulnerabilidades_agrupadas.keys():
        nomes_unicos.add(vuln_nome)
    return list(nomes_unicos)