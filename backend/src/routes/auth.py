# backend/src/routes/auth.py

from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from ..core.database import Database
from ..models.user import User
from bson.objectid import ObjectId
import logging
from ..core.logger import app_logger 

# Configura o logger para este módulo
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
CORS(auth_bp)

db_instance = Database()


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

        # NOVO: Registrar log de criação de usuário
        app_logger.log_action(
            action="USER_CREATED",
            user_login=login, # Ou de quem está logado e criando (se for admin)
            details={"new_user_id": str(result.inserted_id), "new_user_login": login, "new_user_profile": profile}
        )

        return jsonify({"message": "Usuário registrado com sucesso!", "user_id": str(result.inserted_id)}), 201
    except Exception as e:
        print(f"Erro ao registrar usuário: {e}")
        return jsonify({"error": "Erro interno ao registrar usuário."}), 500

@auth_bp.route('/users/<string:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados não fornecidos."}), 400

    try:
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

        # Buscar informações do usuário antes da atualização para o log
        old_user_data = db_instance.find_one("users", {"_id": ObjectId(user_id)})

        result = db_instance.update_one("users", {"_id": ObjectId(user_id)}, update_data)

        if result.modified_count == 0:
            return jsonify({"message": "Usuário não encontrado ou nenhum dado alterado."}), 404

        # NOVO: Registrar log de atualização de usuário
        updated_user_data = db_instance.find_one("users", {"_id": ObjectId(user_id)}) # Obter dados atualizados para o log
        app_logger.log_action(
            action="USER_UPDATED",
            user_login=updated_user_data.get('login', 'unknown'), # Login do usuário que foi atualizado
            details={
                "user_id": user_id,
                "old_data": {k: old_user_data.get(k) for k in update_data.keys()}, # Apenas campos que seriam atualizados
                "new_data": {k: updated_user_data.get(k) for k in update_data.keys()}
            }
        )
        return jsonify({"message": "Usuário atualizado com sucesso."}), 200
    except Exception as e:
        print(f"Erro ao atualizar usuário {user_id}: {e}")
        return jsonify({"error": "Erro interno ao atualizar usuário."}), 500

@auth_bp.route('/users/<string:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        # Buscar informações do usuário antes da exclusão para o log
        user_to_delete = db_instance.find_one("users", {"_id": ObjectId(user_id)})

        result = db_instance.delete_one("users", {"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            return jsonify({"message": "Usuário não encontrado."}), 404

        # NOVO: Registrar log de exclusão de usuário
        if user_to_delete:
            app_logger.log_action(
                action="USER_DELETED",
                user_login=user_to_delete.get('login', 'unknown'),
                details={"deleted_user_id": user_id, "deleted_user_login": user_to_delete.get('login')}
            )

        return jsonify({"message": "Usuário deletado com sucesso."}), 200
    except Exception as e:
        print(f"Erro ao deletar usuário: {e}")
        return jsonify({"error": "Erro interno ao deletar usuário."}), 500

@auth_bp.route('/logs', methods=['GET'])
def get_logs():
    # Em uma aplicação real, aqui você verificaria o token JWT e o perfil do usuário
    # para garantir que apenas administradores possam ver os logs.
    # user = get_jwt_identity() # Exemplo: Se estivesse usando flask_jwt_extended
    # if not user or user['profile'] != 'Administrator':
    #    return jsonify({"error": "Acesso não autorizado."}), 403

    db_instance = Database()
    try:
        # Você pode adicionar filtros aqui (ex: data, tipo de ação, login do usuário)
        # Exemplo de filtro: action_type = request.args.get('action')
        # query = {}
        # if action_type:
        #     query['action'] = action_type

        logs_data = db_instance.find("logs") # Busca todos os logs por enquanto

        logs_list = []
        for log in logs_data:
            logs_list.append({
                "id": str(log.get("_id")),
                "action": log.get("action"),
                "user_login": log.get("user_login"),
                "details": log.get("details"),
                "timestamp": log.get("timestamp").isoformat() if log.get("timestamp") else None # Formata a data para ISO 8601
            })
        
        # Opcional: Ordenar por timestamp descendente
        logs_list.sort(key=lambda x: x['timestamp'] if x['timestamp'] else '', reverse=True)

        return jsonify(logs_list), 200
    except Exception as e:
        print(f"Erro ao buscar logs: {e}")
        return jsonify({"error": "Erro interno ao buscar logs."}), 500
    finally:
        db_instance.close()