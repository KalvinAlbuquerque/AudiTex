# backend/src/routes/auth.py

from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from ..core.database import Database
from ..models.user import User
from bson.objectid import ObjectId

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
CORS(auth_bp) # Habilita CORS para o blueprint de autenticação

db_instance = Database() # Instância global do banco de dados

@auth_bp.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    login = data.get('login')
    password = data.get('password')
    name = data.get('name')
    email = data.get('email')
    profile = data.get('profile', 'User') # Padrão para 'User' se não for especificado

    if not all([login, password, name, email]):
        return jsonify({"error": "Todos os campos (login, password, name, email) são obrigatórios."}), 400

    if profile not in ['User', 'Administrator']:
        return jsonify({"error": "Perfil inválido. Use 'User' ou 'Administrator'."}), 400

    try:
        # Verifica se o login já existe
        existing_user = db_instance.find_one("users", {"login": login})
        if existing_user:
            return jsonify({"error": "Nome de usuário já existe."}), 409

        new_user = User(login=login, password=password, name=name, email=email, profile=profile)
        
        # Insere o usuário no MongoDB
        result = db_instance.insert_one("users", {
            "login": new_user.login,
            "password": new_user.password, # Já está com hash
            "name": new_user.name,
            "email": new_user.email,
            "profile": new_user.profile
        })

        return jsonify({"message": "Usuário registrado com sucesso!", "user_id": str(result.inserted_id)}), 201
    except Exception as e:
        print(f"Erro ao registrar usuário: {e}")
        return jsonify({"error": "Erro interno ao registrar usuário."}), 500

# backend/src/routes/auth.py

from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from ..core.database import Database
from ..models.user import User
from bson.objectid import ObjectId
import logging # NOVO: Importa logging

# Configura o logger para este módulo (pode ser configurado globalmente em main.py se preferir)
logging.basicConfig(level=logging.INFO) # Define o nível de log para INFO (ou DEBUG para mais detalhes)
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
CORS(auth_bp)

db_instance = Database()

@auth_bp.route('/register', methods=['POST'])
def register_user():
    # ... (código existente da rota register_user) ...
    pass # Mantém o corpo da função se ele já estiver lá

@auth_bp.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    login = data.get('login')
    password = data.get('password')

    # --- NOVOS LOGS DE DEBUG ---
    logger.info(f"Tentativa de login recebida para login: '{login}' (tipo: {type(login)})")
    # ATENÇÃO: Nunca logue senhas em produção! Apenas para depuração.
    logger.info(f"Senha recebida (CUIDADO EM PROD!): '{password}' (tipo: {type(password)})")
    # --- FIM DOS NOVOS LOGS DE DEBUG ---

    if not all([login, password]):
        logger.warning(f"Campos ausentes na tentativa de login para '{login}'")
        return jsonify({"error": "Login e senha são obrigatórios."}), 400

    try:
        user_data = db_instance.find_one("users", {"login": login})

        if not user_data:
            logger.info(f"Usuário '{login}' NÃO encontrado no banco de dados.")
            return jsonify({"error": "Login ou senha inválidos."}), 401

        user = User.from_dict(user_data)
        logger.info(f"Usuário '{login}' encontrado no DB. Hash armazenado: '{user.password}'")

        # --- NOVO LOG DE DEBUG DA COMPARAÇÃO ---
        is_password_correct = user.check_password(password)
        logger.info(f"Resultado de check_password para '{login}': {is_password_correct}")
        # --- FIM DO NOVO LOG ---

        if is_password_correct:
            logger.info(f"Login bem-sucedido para '{login}'.")
            return jsonify({
                "message": "Login bem-sucedido!",
                "user": user.to_dict(),
                "token": "fake-jwt-token"
            }), 200
        else:
            logger.info(f"Senha incorreta para o usuário '{login}'.")
            return jsonify({"error": "Login ou senha inválidos."}), 401
    except Exception as e:
        logger.exception(f"Erro interno inesperado ao fazer login para '{login}'.") # Usa exception para incluir traceback
        return jsonify({"error": "Erro interno ao fazer login."}), 500


# Rota para obter todos os usuários (apenas para administradores, por exemplo)
@auth_bp.route('/users', methods=['GET'])
def get_all_users():
    # Em uma aplicação real, você teria uma verificação de token JWT e perfil aqui
    # Ex: if current_user.profile != 'Administrator': return jsonify({"error": "Não autorizado"}), 403
    try:
        users_data = db_instance.find("users")
        users_list = [User.from_dict(u).to_dict() for u in users_data]
        return jsonify(users_list), 200
    except Exception as e:
        print(f"Erro ao buscar usuários: {e}")
        return jsonify({"error": "Erro interno ao buscar usuários."}), 500

# Rota para deletar um usuário (apenas para administradores)
@auth_bp.route('/users/<string:user_id>', methods=['DELETE'])
def delete_user(user_id):
    # Em uma aplicação real, você teria uma verificação de token JWT e perfil aqui
    # Ex: if current_user.profile != 'Administrator': return jsonify({"error": "Não autorizado"}), 403
    try:
        result = db_instance.delete_one("users", {"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            return jsonify({"message": "Usuário não encontrado."}), 404
        return jsonify({"message": "Usuário deletado com sucesso."}), 200
    except Exception as e:
        print(f"Erro ao deletar usuário: {e}")
        return jsonify({"error": "Erro interno ao deletar usuário."}), 500