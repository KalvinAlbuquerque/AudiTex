# backend/src/models/user.py

from typing import Dict, Any
import bcrypt # Para hash de senhas

class User:
    def __init__(self, login: str, password: str, name: str, email: str, profile: str, _id: Any = None):
        self.login = login
        self.password = self._hash_password(password) # Armazena a senha como hash
        self.name = name
        self.email = email
        self.profile = profile # 'User' ou 'Administrator'
        self._id = _id # Para armazenar o ObjectId do MongoDB

    def _hash_password(self, password: str) -> str:
        """Gera o hash da senha usando bcrypt."""
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        return hashed.decode('utf-8')

    def check_password(self, password: str) -> bool:
        """Verifica se a senha fornecida corresponde ao hash armazenado."""
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))

    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto User em um dicionário, excluindo a senha para retorno seguro."""
        data = {
            "login": self.login,
            "name": self.name,
            "email": self.email,
            "profile": self.profile
        }
        if self._id:
            data["_id"] = str(self._id) # Converte ObjectId para string para JSON
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Cria um objeto User a partir de um dicionário (e.g., vindo do MongoDB)."""
        # Ao carregar do DB, a senha já estará em hash, então não chamamos _hash_password novamente
        user_obj = cls(
            login=data["login"],
            password=data["password"], # Assumimos que a senha aqui já é o hash
            name=data["name"],
            email=data["email"],
            profile=data["profile"],
            _id=data.get("_id")
        )
        # Se a senha não for um hash (e.g., uma nova senha para update), ela precisaria ser hashed.
        # Mas para o from_dict, é geralmente para carregar o estado atual do DB.
        return user_obj