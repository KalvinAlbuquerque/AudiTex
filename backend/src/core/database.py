# backend/src/core/database.py
from pymongo import MongoClient
from typing import Any, Dict, List
from bson.objectid import ObjectId
import os # NOVO: Importa o módulo os

class Database:
    def __init__(self, db_name: str = "mydatabase"):
        # NOVO: Obtém as credenciais do MongoDB das variáveis de ambiente
        #mongo_user = os.getenv("MONGO_APP_USER", "app_user") # Usuário padrão se a variável não for definida
        #mongo_password = os.getenv("MONGO_APP_PASSWORD", "app_password_dev") # Senha padrão se a variável não for definida
        mongo_user = "admin"
        mongo_password = "admin"
        mongo_host = os.getenv("MONGO_HOST", "mongodb") # Garante que o host padrão é 'mongodb'
        mongo_port = os.getenv("MONGO_PORT", "27017") # Porta padrão

        # Conecta usando as credenciais
        #self.client = MongoClient("mongodb://mongodb:27017/") # LINHA ANTIGA
        self.client = MongoClient(
            f"mongodb://{mongo_user}:{mongo_password}@{mongo_host}:{mongo_port}/{db_name}?authSource=admin"
        )
        self.db = self.client[db_name]

    def insert_one(self, collection_name: str, data: Dict[str, Any]):
        return self.db[collection_name].insert_one(data)

    def insert_many(self, collection_name: str, data_list: List[Dict[str, Any]]):
        return self.db[collection_name].insert_many(data_list)

    def find_one(self, collection_name: str, query: Dict[str, Any]):
        return self.db[collection_name].find_one(query)

    def find(self, collection_name: str, query: Dict[str, Any] = {}):
        return list(self.db[collection_name].find(query))

    def update_one(self, collection_name: str, query: Dict[str, Any], update: Dict[str, Any]):
        return self.db[collection_name].update_one(query, {"$set": update})

    def delete_one(self, collection_name: str, query: Dict[str, Any]):
        return self.db[collection_name].delete_one(query)

    def delete_many(self, collection_name: str, query: Dict[str, Any]):
        return self.db[collection_name].delete_many(query)

    def count_documents(self, collection_name: str, query: Dict[str, Any] = {}):
        return self.db[collection_name].count_documents(query)

    def close(self):
        self.client.close()

    def get_object_id(self, id_string: str) -> ObjectId:
        """Converte uma string de ID em um ObjectId do MongoDB."""
        return ObjectId(id_string)