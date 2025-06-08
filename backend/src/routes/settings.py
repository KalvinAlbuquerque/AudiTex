# backend/src/routes/settings.py

from flask import Blueprint, request, jsonify
from flask_cors import CORS
from ..core.database import Database
from ..models.settings import SystemSettings
from ..core.logger import app_logger # Importa app_logger
from datetime import datetime # Para timestamp

settings_bp = Blueprint('settings', __name__, url_prefix='/settings')
CORS(settings_bp)

@settings_bp.route('/tenable', methods=['GET'])
def get_tenable_settings():
    # TODO: Implementar autorização de administrador aqui (ex: verificar token JWT e perfil)
    # Por enquanto, está acessível, mas em produção, ISSO DEVE SER SEGURO.
    # user_from_token = get_jwt_identity() # Se estiver usando flask_jwt_extended
    # if not user_from_token or user_from_token['profile'] != 'Administrator':
    #    return jsonify({"error": "Acesso não autorizado. Apenas administradores."}), 403

    db_instance = Database()
    try:
        settings_doc = db_instance.find_one("settings", {})
        if settings_doc:
            settings = SystemSettings.from_dict(settings_doc)
            # POR SEGURANÇA: NUNCA retorne as chaves reais para o frontend!
            # Retorne apenas um status ou uma versão mascarada.
            return jsonify({
                "configured": settings.tenable_api_key is not None and settings.tenable_access_key is not None,
                "last_updated": settings_doc.get("last_updated").isoformat() if settings_doc.get("last_updated") else None # Formata a data
            }), 200
        else:
            return jsonify({"configured": False, "message": "Nenhum documento de configurações encontrado."}), 200
    except Exception as e:
        app_logger.log_action(action="GET_TENABLE_SETTINGS_ERROR", user_login="unknown", details={"error": str(e)})
        return jsonify({"error": "Erro ao buscar configurações Tenable."}), 500
    finally:
        db_instance.close()

@settings_bp.route('/tenable', methods=['PUT'])
def update_tenable_settings():
    # TODO: Implementar autorização de administrador aqui (ex: verificar token JWT e perfil)
    # Por enquanto, está acessível, mas em produção, ISSO DEVE SER SEGURO.
    # user_from_token = get_jwt_identity() # Se estiver usando flask_jwt_extended
    # if not user_from_token or user_from_token['profile'] != 'Administrator':
    #    return jsonify({"error": "Acesso não autorizado. Apenas administradores."}), 403

    data = request.get_json()
    api_key = data.get('tenable_api_key')
    access_key = data.get('tenable_access_key')

    if not api_key or not access_key:
        return jsonify({"error": "Chave de API e Chave de Acesso Tenable são obrigatórias."}), 400

    db_instance = Database()
    try:
        # Encontra o documento de configurações existente ou cria um novo
        existing_settings = db_instance.find_one("settings", {})
        current_time = datetime.utcnow()
        
        if existing_settings:
            db_instance.update_one(
                "settings",
                {"_id": existing_settings["_id"]},
                {"$set": {"tenable_api_key": api_key, "tenable_access_key": access_key, "last_updated": current_time}}
            )
            message = "Configurações Tenable atualizadas com sucesso."
            log_action = "TENABLE_SETTINGS_UPDATED"
        else:
            new_settings_data = {
                "tenable_api_key": api_key,
                "tenable_access_key": access_key,
                "last_updated": current_time
            }
            db_instance.insert_one("settings", new_settings_data)
            message = "Configurações Tenable salvas com sucesso."
            log_action = "TENABLE_SETTINGS_CREATED"
        
        app_logger.log_action(
            action=log_action,
            user_login="admin_placeholder", # TODO: Obter login do usuário administrador real do JWT
            details={"message": message, "updated_by": "admin_placeholder"}
        )
        
        return jsonify({"message": message}), 200
    except Exception as e:
        app_logger.log_action(action="UPDATE_TENABLE_SETTINGS_ERROR", user_login="admin_placeholder", details={"error": str(e), "data": data})
        return jsonify({"error": "Erro ao salvar configurações Tenable."}), 500
    finally:
        db_instance.close()