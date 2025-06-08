# backend/src/models/log.py

from datetime import datetime
from typing import Dict, Any

class Log:
    def __init__(self, action: str, user_login: str, details: Dict[str, Any], timestamp: datetime = None, _id: Any = None):
        self.action = action  # Ex: "USER_CREATED", "REPORT_GENERATED", "USER_DELETED"
        self.user_login = user_login # O login do usuário que realizou a ação
        self.details = details # Detalhes adicionais sobre a ação (ex: {'user_id': '...', 'report_id': '...'})
        self.timestamp = timestamp if timestamp else datetime.utcnow() # Horário da ação, em UTC
        self._id = _id # Para o ObjectId do MongoDB

    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto Log em um dicionário para ser salvo no MongoDB."""
        data = {
            "action": self.action,
            "user_login": self.user_login,
            "details": self.details,
            "timestamp": self.timestamp
        }
        if self._id:
            data["_id"] = str(self._id)
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Cria um objeto Log a partir de um dicionário (e.g., vindo do MongoDB)."""
        return cls(
            action=data["action"],
            user_login=data["user_login"],
            details=data["details"],
            timestamp=data.get("timestamp"),
            _id=data.get("_id")
        )