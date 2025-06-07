import os
import time
from httpx import Client

class TenableApi():

    _instance = None
    _initialized = False # Adicionado para controlar a inicialização do singleton

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TenableApi, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized: # Verifica se já foi inicializado
            return

        # Busca as chaves da API diretamente das variáveis de ambiente
        self.secret_key = os.getenv("TENABLE_SECRET_KEY") # Renomeado para TENABLE_SECRET_KEY para clareza
        self.access_key = os.getenv("TENABLE_ACCESS_KEY") # Renomeado para TENABLE_ACCESS_KEY para clareza

        if not self.secret_key or not self.access_key:
            # Pode-se levantar um erro ou logar um aviso mais robusto
            print("AVISO: Chaves da API Tenable (TENABLE_SECRET_KEY, TENABLE_ACCESS_KEY) não configuradas nas variáveis de ambiente.")
            # Você pode adicionar um raise Exception aqui se quiser que a aplicação pare
            # raise ValueError("As chaves da API Tenable não estão configuradas.")

        self.headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
            "X-ApiKeys": f"accessKey={self.access_key}; secretKey={self.secret_key}",
        }

        # É importante criar uma nova instância de Client por instância de TenableApi (ou gerenciar bem).
        # Aqui, mantemos como estava, vinculando ao self.
        self.client = Client(base_url="https://cloud.tenable.com", verify=False, headers=self.headers)
        self._initialized = True # Marca como inicializado

    def get_user_id_from_username(self, user_name: str) -> str | None:
        """
        Obtém o ID do usuário (UUID) a partir do nome de usuário.
        """
        url = "/users"
        users_json = self.client.get(url).json()["users"]
        for user in users_json:
            if user["user_name"] == user_name:
                return user["uuid"]
        return None

    def get_all_web_app_scans_from_username(self, user_name: str) -> dict:
        """
        Obtém todos os scans de aplicação web para um dado nome de usuário.
        """
        user_id = self.get_user_id_from_username(user_name)
        if not user_id:
            return {} # Retorna dicionário vazio se o usuário não for encontrado

        total_scans_response = self.client.post("/was/v2/configs/search").json()
        total_scans = total_scans_response["pagination"]["total"]
        
        itens_per_request = 200 # Limite de itens por requisição

        webb_app_scans: dict = {"items": [], "pagination": total_scans_response["pagination"]} # Estrutura de retorno mais próxima da API Tenable

        for offset in range(0, total_scans, itens_per_request):
            limit = min(itens_per_request, total_scans - offset)
            scans_batch = self.client.post(f"/was/v2/configs/search?limit={limit}&offset={offset}").json()["items"]

            for scan in scans_batch:
                if scan["owner_id"] == user_id:
                    webb_app_scans["items"].append(scan)
        
        return webb_app_scans
    
    def get_web_app_scans_from_folder_of_user(self, folder_name: str, user_name: str) -> dict:
        """
        Obtém os scans de aplicação web de uma pasta específica para um dado usuário.
        """
        url = "/was/v2/configs/search"

        headers_impersonate = self.headers.copy() # Copia os headers base
        headers_impersonate['X-Impersonate'] = f"username={user_name}"

        params = {"limit" : 200}
        payload = {
            "field": "folder_name",
            "operator": "match",
            "value": folder_name,
        }

        # Primeira requisição
        scans = self.client.post(url, headers=headers_impersonate, json=payload, params=params).json()

        # Paginação para obter todos os resultados se houver mais de 200
        current_offset = 200
        total_items = scans['pagination']['total']

        while total_items > current_offset:
            params['offset'] = current_offset
            response_batch = self.client.post(url, headers=headers_impersonate, json=payload, params=params).json()
            if 'items' in response_batch:
                scans['items'].extend(response_batch['items'])
            current_offset += 200
        
        return scans

    def get_web_app_folders_from_username(self, user_name: str) -> dict:
        """
        Obtém as pastas de aplicação web para um dado nome de usuário.
        """
        url = "/was/v2/folders"
        headers_impersonate = self.headers.copy()
        headers_impersonate['X-Impersonate'] = f"username={user_name}"
        
        response = self.client.get(url=url, headers=headers_impersonate).json()
        return response
    
    def get_web_app_scans_from_targetname_and_username(self, target_name: str, user_name: str) -> dict:
        """
        Obtém os scans de aplicação web que contêm um nome de target específico
        para um dado usuário.
        """
        all_scans_from_username: dict = self.get_all_web_app_scans_from_username(user_name)
        result = {"items": [], "pagination": all_scans_from_username.get("pagination", {"total": 0, "offset": 0, "limit": 0})}

        if 'items' in all_scans_from_username:
            for scan_data in all_scans_from_username["items"]:
                if target_name in scan_data.get("target", ""):
                    result["items"].append(scan_data)
        
        result["pagination"]["total"] = len(result["items"]) # Atualiza o total para a nova lista filtrada
        return result
    
    def download_scans_results_json(self, target_dir: str, scans_data: dict) -> None:
        """
        Baixa os resultados dos scans de aplicação web em formato JSON.
        `scans_data` agora é o dicionário completo retornado pela API (com 'items' e 'pagination').
        """
        scans_list = scans_data.get("items", []) # Pega a lista de scans de dentro do dicionário

        for data in scans_list:
            scan_id = data.get("last_scan", {}).get("scan_id")
            if not scan_id:
                print(f"Aviso: Scan sem 'scan_id' na última varredura, pulando: {data.get('config_id', 'N/A')}")
                continue

            url_report_request = f"/was/v2/scans/{scan_id}/report"
            url_report_download = f"/was/v2/scans/{scan_id}/report"

            # 1. Inicia a geração do relatório
            response_initiate = self.client.put(url_report_request)
            if response_initiate.status_code != 200:
                print(f"Erro ao iniciar geração do relatório para scan ID {scan_id}: {response_initiate.text}")
                continue

            # 2. Polling para verificar o status
            status = "pending"
            while status not in ["ready", "error"]:
                time.sleep(5) # Espera 5 segundos antes de verificar novamente
                response_status = self.client.get(url_report_request)
                if response_status.status_code == 200:
                    status = response_status.json().get("status", "pending")
                else:
                    print(f"Erro ao verificar status do relatório para scan ID {scan_id}: {response_status.text}")
                    status = "error" # Força saída do loop
            
            if status == "error":
                print(f"Geração de relatório falhou para scan ID {scan_id}.")
                continue

            # 3. Baixa o relatório
            response_download = self.client.get(url_report_download)

            if response_download.status_code == 200:
                file_path = os.path.join(target_dir, f"{scan_id}.json")
                with open(file_path, "w", encoding="utf-8") as file:
                    file.write(response_download.text)
                print(f"Relatório do scan {scan_id} baixado com sucesso para {file_path}")
            else:
                print(f"Erro ao baixar relatório para scan ID {scan_id}: {response_download.text}")

    def get_vmscans_from_name(self, name: str) -> dict | None:
        """
        Obtém os detalhes de um scan de Vulnerability Management (VM) pelo nome.
        """
        url = "/scans"
        scans_json = self.client.get(url).json()["scans"]
        for scan in scans_json:
            if scan["name"] == name:
                return scan
        return None
    
    def download_vmscans_csv(self, target_dir: str, scan_id: str, history_id: str) -> None:
        """
        Baixa o resultado de um scan de Vulnerability Management (VM) em formato CSV.
        """
        url_export_request = f"/scans/{scan_id}/export?history_id={history_id}"

        headers_csv = self.headers.copy() # Copia os headers base
        # O Tenable Cloud API usa 'accept: application/json' mesmo para export CSV,
        # e o 'format: csv' vai no payload.
        
        payload = {
            "chapters": "vulnerabilities", # Geralmente queremos o capítulo de vulnerabilidades
            "format": "csv"
        }

        # 1. Solicita a exportação
        response_export_initiate = self.client.post(url_export_request, json=payload).json()
        
        file_export_id = response_export_initiate.get("file")
        if not file_export_id:
            print(f"Erro: Não foi possível obter o ID do arquivo para exportação do scan VM {scan_id}, history {history_id}.")
            return

        # 2. Polling para verificar o status da exportação
        status_url = f"/scans/{scan_id}/export/{file_export_id}/status"
        status = "pending"
        while status != "ready":
            response_status = self.client.get(status_url).json()
            status = response_status.get("status")
            if status == "error":
                print(f"Exportação do scan VM {scan_id}, history {history_id} falhou.")
                return
            time.sleep(5) # Espera 5 segundos

        # 3. Baixa o arquivo CSV
        download_url = f"/scans/{scan_id}/export/{file_export_id}/download"
        response_download = self.client.get(download_url)

        if response_download.status_code == 200:
            file_path = os.path.join(target_dir, "servidores_scan.csv")
            with open(file_path, "w", encoding="utf-8") as file:
                file.write(response_download.text)
            print(f"Scan VM {scan_id} baixado com sucesso para {file_path}")
        else:
            print(f"Erro ao baixar scan VM {scan_id}: {response_download.text}")