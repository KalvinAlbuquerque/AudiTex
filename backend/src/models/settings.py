# backend/src/models/settings.py
from typing import Dict, Any

class SystemSettings:
    def __init__(self, tenable_api_key: str = None, tenable_access_key: str = None, _id: Any = None):
        self.tenable_api_key = tenable_api_key
        self.tenable_access_key = tenable_access_key
        self._id = _id # Para o ObjectId do MongoDB

    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto SystemSettings para um dicionário para salvar no banco de dados."""
        data = {
            "tenable_api_key": self.tenable_api_key,
            "tenable_access_key": self.tenable_access_key,
        }
        if self._id:
            data["_id"] = str(self._id)
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Cria um objeto SystemSettings a partir de um dicionário (ex: vindo do MongoDB)."""
        return cls(
            tenable_api_key=data.get("tenable_api_key"),
            tenable_access_key=data.get("tenable_access_key"),
            _id=data.get("_id")
        )