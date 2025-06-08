# backend/src/core/logger.py

from ..core.database import Database
from ..models.log import Log
from typing import Dict, Any

class Logger:
    def __init__(self):
        self.db = Database() # Usa a instância da Database

    def log_action(self, action: str, user_login: str, details: Dict[str, Any]):
        """
        Registra uma ação do usuário no banco de dados.
        """
        try:
            new_log = Log(action=action, user_login=user_login, details=details)
            self.db.insert_one("logs", new_log.to_dict())
            print(f"Log registrado: Ação='{action}', Usuário='{user_login}', Detalhes={details}")
        except Exception as e:
            print(f"ERRO ao registrar log: {e}")
        finally:
            self.db.close() # Feche a conexão após a operação de log

# Instância global do logger para ser usada em outros módulos
app_logger = Logger()