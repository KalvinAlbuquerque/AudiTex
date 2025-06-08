# backend/src/routes/vulnerabilities_manager.py

from flask import Blueprint, request, jsonify, current_app # Importa current_app
from ..core.database import Database
# Removido: from ..main import tenable_api # Não é mais necessário

# from ..core.config import Config # Removido se não houver uso local

# Removido inicialização local:
# config = Config("config.json") # Não é mais necessário

vulnerabilities_manager_bp = Blueprint('vulnerabilities_manager', __name__, url_prefix='/vulnerabilities')

@vulnerabilities_manager_bp.route('/get/<string:vuln_type>', methods=['GET'])
def get_vulnerabilities(vuln_type):
    # Acessa config via current_app.extensions
    config = current_app.extensions['config']
    db_instance = Database()
    try:
        if vuln_type == 'webapp':
            collection_name = config.colecao_vulnerabilidades_webapp
        elif vuln_type == 'servers':
            collection_name = config.colecao_vulnerabilidades_servers
        else:
            return jsonify({"error": "Tipo de vulnerabilidade inválido."}), 400
        
        vulnerabilities = db_instance.find(collection_name)
        # ... (restante do código) ...
        return jsonify(list(vulnerabilities)), 200
    except Exception as e:
        print(f"Erro ao buscar vulnerabilidades de {vuln_type}: {e}")
        return jsonify({"error": "Erro interno ao buscar vulnerabilidades."}), 500
    finally:
        db_instance.close()

@vulnerabilities_manager_bp.route('/add/<string:vuln_type>', methods=['POST'])
def add_vulnerability(vuln_type):
    # Acessa config via current_app.extensions
    config = current_app.extensions['config']
    db_instance = Database()
    data = request.get_json()
    try:
        if vuln_type == 'webapp':
            collection_name = config.colecao_vulnerabilidades_webapp
        elif vuln_type == 'servers':
            collection_name = config.colecao_vulnerabilidades_servers
        else:
            return jsonify({"error": "Tipo de vulnerabilidade inválido."}), 400
        
        # ... (restante do código) ...
        return jsonify({"message": "Vulnerabilidade adicionada com sucesso!"}), 201
    except Exception as e:
        print(f"Erro ao adicionar vulnerabilidade de {vuln_type}: {e}")
        return jsonify({"error": "Erro interno ao adicionar vulnerabilidade."}), 500
    finally:
        db_instance.close()

@vulnerabilities_manager_bp.route('/update/<string:vuln_type>/<string:vuln_id>', methods=['PUT'])
def update_vulnerability(vuln_type, vuln_id):
    # Acessa config via current_app.extensions
    config = current_app.extensions['config']
    db_instance = Database()
    data = request.get_json()
    try:
        if vuln_type == 'webapp':
            collection_name = config.colecao_vulnerabilidades_webapp
        elif vuln_type == 'servers':
            collection_name = config.colecao_vulnerabilidades_servers
        else:
            return jsonify({"error": "Tipo de vulnerabilidade inválido."}), 400

        # ... (restante do código) ...
        return jsonify({"message": "Vulnerabilidade atualizada com sucesso!"}), 200
    except Exception as e:
        print(f"Erro ao atualizar vulnerabilidade {vuln_id} de {vuln_type}: {e}")
        return jsonify({"error": "Erro interno ao atualizar vulnerabilidade."}), 500
    finally:
        db_instance.close()

@vulnerabilities_manager_bp.route('/delete/<string:vuln_type>/<string:vuln_id>', methods=['DELETE'])
def delete_vulnerability(vuln_type, vuln_id):
    # Acessa config via current_app.extensions
    config = current_app.extensions['config']
    db_instance = Database()
    try:
        if vuln_type == 'webapp':
            collection_name = config.colecao_vulnerabilidades_webapp
        elif vuln_type == 'servers':
            collection_name = config.colecao_vulnerabilidades_servers
        else:
            return jsonify({"error": "Tipo de vulnerabilidade inválido."}), 400
        
        # ... (restante do código) ...
        return jsonify({"message": "Vulnerabilidade deletada com sucesso!"}), 200
    except Exception as e:
        print(f"Erro ao deletar vulnerabilidade {vuln_id} de {vuln_type}: {e}")
        return jsonify({"error": "Erro interno ao deletar vulnerabilidade."}), 500
    finally:
        db_instance.close()

@vulnerabilities_manager_bp.route('/descriptions/<string:vuln_type>', methods=['GET'])
def get_vulnerability_descriptions(vuln_type):
    # Acessa config via current_app.extensions
    config = current_app.extensions['config']
    # Acessa tenable_api via current_app.extensions, se precisar aqui.
    # tenable_api = current_app.extensions['tenable_api'] 
    db_instance = Database() # Mantém para uso local
    try:
        if vuln_type == 'webapp':
            collection_name = config.colecao_descritivo_webapp
        elif vuln_type == 'servers':
            collection_name = config.colecao_descritivo_servers
        else:
            return jsonify({"error": "Tipo de vulnerabilidade inválido."}), 400
        
        descriptions = db_instance.find(collection_name)
        # ... (restante do código) ...
        return jsonify(list(descriptions)), 200
    except Exception as e:
        print(f"Erro ao buscar descrições de vulnerabilidades de {vuln_type}: {e}")
        return jsonify({"error": "Erro interno ao buscar descrições."}), 500
    finally:
        db_instance.close()

@vulnerabilities_manager_bp.route('/descriptions/<string:vuln_type>', methods=['PUT'])
def update_vulnerability_description(vuln_type):
    # Acessa config via current_app.extensions
    config = current_app.extensions['config']
    db_instance = Database()
    data = request.get_json()
    try:
        if vuln_type == 'webapp':
            collection_name = config.colecao_descritivo_webapp
        elif vuln_type == 'servers':
            collection_name = config.colecao_descritivo_servers
        else:
            return jsonify({"error": "Tipo de vulnerabilidade inválido."}), 400
        
        # ... (restante do código) ...
        return jsonify({"message": "Descrição de vulnerabilidade atualizada com sucesso!"}), 200
    except Exception as e:
        print(f"Erro ao atualizar descrição de vulnerabilidade de {vuln_type}: {e}")
        return jsonify({"error": "Erro interno ao atualizar descrição de vulnerabilidade."}), 500
    finally:
        db_instance.close()