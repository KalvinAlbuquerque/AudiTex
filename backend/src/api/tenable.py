# backend/src/api/tenable.py

import requests
import json
import os
import time
from ..core.database import Database # Importa Database
from ..models.settings import SystemSettings # Importa o modelo SystemSettings

class TenableApi:
    _instance = None # Para implementar o padrão Singleton (garantir uma única instância)

    def __new__(cls, db_instance: Database):
        if cls._instance is None:
            cls._instance = super(TenableApi, cls).__new__(cls)
            cls._instance.db = db_instance # Armazena a instância do banco de dados
            cls._instance._load_credentials_from_db() # Carrega credenciais na criação
            cls._instance.initialized = True # Garante que só inicialize uma vez
        return cls._instance

    # O método __init__ é chamado sempre, mas a lógica de inicialização real fica em __new__ para o Singleton
    def __init__(self, db_instance: Database):
        if not hasattr(self, 'initialized'): # Evita re-inicialização se __new__ já o fez
            self.db = db_instance
            self._load_credentials_from_db()
            self.initialized = True

    def _load_credentials_from_db(self):
        """Carrega as chaves da API Tenable do banco de dados."""
        db_temp_instance = Database() # Crie uma nova instância temporária para evitar problemas de conexão fechada
        try:
            settings_doc = db_temp_instance.find_one("settings", {}) # Assume que há apenas um documento de configurações
            if settings_doc:
                settings = SystemSettings.from_dict(settings_doc)
                self.api_key = settings.tenable_api_key
                self.access_key = settings.tenable_access_key
                print("Tenable API credentials carregados do banco de dados.")
            else:
                self.api_key = None
                self.access_key = None
                print("Tenable API credentials não encontrados no banco de dados.")
        except Exception as e:
            print(f"Erro ao carregar credenciais da API Tenable do DB: {e}")
            self.api_key = None
            self.access_key = None
        finally:
            db_temp_instance.close() # Feche a conexão temporária

    def _get_headers(self):
        # Tenta recarregar as credenciais se elas não estiverem definidas (útil após atualização no DB)
        if not self.api_key or not self.access_key:
            self._load_credentials_from_db() # Tenta recarregar

        if not self.api_key or not self.access_key:
            raise ValueError("As credenciais da API Tenable não estão configuradas.")

        return {
            "X-ApiKeys": f"accessKey={self.access_key};secretKey={self.api_key}",
            "Content-Type": "application/json"
        }

    def _make_request(self, method, url, data=None):
        headers = self._get_headers()
        try:
            response = requests.request(method, url, headers=headers, json=data)
            response.raise_for_status() # Lança um HTTPError para respostas de erro (4xx ou 5xx)
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Erro na requisição da API Tenable: {e}")
            raise

    def get_scans(self):
        url = "https://cloud.tenable.com/scans" # Ou a URL configurada do Tenable
        return self._make_request("GET", url)