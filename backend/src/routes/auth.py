# backend/src/routes/auth.py

from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from ..core.database import Database
from ..models.user import User
from bson.objectid import ObjectId
import logging

# Configura o logger para este módulo
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
CORS(auth_bp)

db_instance = Database()

@auth_bp.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    login = data.get('login')
    password = data.get('password')
    name = data.get('name')
    email = data.get('email')
    profile = data.get('profile', 'User')

    if not all([login, password, name, email]):
        return jsonify({"error": "Todos os campos (login, password, name, email) são obrigatórios."}), 400

    if profile not in ['User', 'Administrator']:
        return jsonify({"error": "Perfil inválido. Use 'User' ou 'Administrator'."}), 400

    try:
        existing_user = db_instance.find_one("users", {"login": login})
        if existing_user:
            return jsonify({"error": "Nome de usuário já existe."}), 409

        new_user = User(login=login, password=password, name=name, email=email, profile=profile)

        result = db_instance.insert_one("users", {
            "login": new_user.login,
            "password": new_user.password,
            "name": new_user.name,
            "email": new_user.email,
            "profile": new_user.profile
        })

        return jsonify({"message": "Usuário registrado com sucesso!", "user_id": str(result.inserted_id)}), 201
    except Exception as e:
        print(f"Erro ao registrar usuário: {e}")
        return jsonify({"error": "Erro interno ao registrar usuário."}), 500

# Remove the duplicate @auth_bp.route('/login', methods=['POST']) and its content
# that was present after the first complete register_user function.
# The `login_user` function definition below is correct and should remain.

@auth_bp.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    login = data.get('login')
    password = data.get('password')

    logger.info(f"Tentativa de login recebida para login: '{login}' (tipo: {type(login)})")
    logger.info(f"Senha recebida (CUIDADO EM PROD!): '{password}' (tipo: {type(password)})")

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

        is_password_correct = user.check_password(password)
        logger.info(f"Resultado de check_password para '{login}': {is_password_correct}")

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
        logger.exception(f"Erro interno inesperado ao fazer login para '{login}'.")
        return jsonify({"error": "Erro interno ao fazer login."}), 500


@auth_bp.route('/users', methods=['GET'])
def get_all_users():
    try:
        users_data = db_instance.find("users")
        users_list = [User.from_dict(u).to_dict() for u in users_data]
        return jsonify(users_list), 200
    except Exception as e:
        print(f"Erro ao buscar usuários: {e}")
        return jsonify({"error": "Erro interno ao buscar usuários."}), 500

@auth_bp.route('/users/<string:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        result = db_instance.delete_one("users", {"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            return jsonify({"message": "Usuário não encontrado."}), 404
        return jsonify({"message": "Usuário deletado com sucesso."}), 200
    except Exception as e:
        print(f"Erro ao deletar usuário: {e}")
        return jsonify({"error": "Erro interno ao deletar usuário."}), 500
    
@auth_bp.route('/users/<string:user_id>', methods=['PUT']) # NOVO: Rota para atualizar usuário
def update_user(user_id):
    # Em uma aplicação real, aqui você verificaria o token JWT e o perfil do usuário
    # para garantir que apenas administradores possam atualizar outros usuários,
    # e que um usuário não-admin não possa escalar privilégios.
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados não fornecidos."}), 400

    try:
        # Apenas os campos 'name', 'email', 'profile' podem ser atualizados por esta rota.
        # A senha não deve ser atualizada aqui (teria uma rota separada ou processo de redefinição).
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'email' in data:
            update_data['email'] = data['email']
        if 'profile' in data:
            if data['profile'] not in ['User', 'Administrator']:
                return jsonify({"error": "Perfil inválido. Use 'User' ou 'Administrator'."}), 400
            update_data['profile'] = data['profile']

        if not update_data:
            return jsonify({"message": "Nenhum dado válido para atualização fornecido."}), 200

        result = db_instance.update_one("users", {"_id": ObjectId(user_id)}, update_data)
        if result.modified_count == 0:
            return jsonify({"message": "Usuário não encontrado ou nenhum dado alterado."}), 404
        return jsonify({"message": "Usuário atualizado com sucesso."}), 200
    except Exception as e:
        print(f"Erro ao atualizar usuário {user_id}: {e}")
        return jsonify({"error": "Erro interno ao atualizar usuário."}), 500