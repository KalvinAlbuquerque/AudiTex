# backend/src/routes/vulnerabilities_manager.py

from flask import Blueprint, request, jsonify, current_app
from flask_cors import CORS
from ..core.json_utils import get_all_vulnerabilities, add_vulnerability, update_vulnerability, delete_vulnerability, _load_data_, salvar_json # Import necessary json utilities
from ..core.config import Config
import os # Needed for path joining

vulnerabilities_manager_bp = Blueprint('vulnerabilities_manager', __name__, url_prefix='/vulnerabilities')
CORS(vulnerabilities_manager_bp, supports_credentials=True) # Added supports_credentials=True

@vulnerabilities_manager_bp.route('/get/<string:vuln_type>', methods=['GET'])
def get_vulnerabilities(vuln_type):
    config = current_app.extensions['config']
    try:
        file_path = ""
        if vuln_type == 'webapp':
            file_path = os.path.join(config.caminho_report_templates_descriptions, "vulnerabilities_webapp.json")
        elif vuln_type == 'servers':
            file_path = os.path.join(config.caminho_report_templates_descriptions, "vulnerabilities_servers.json")
        else:
            return jsonify({"error": "Tipo de vulnerabilidade inválido."}), 400

        # Use json_utils to get all vulnerabilities from the file
        vulnerabilities = get_all_vulnerabilities(file_path) # This assumes get_all_vulnerabilities returns a list
        return jsonify(vulnerabilities), 200
    except Exception as e:
        print(f"Erro ao buscar vulnerabilidades de {vuln_type}: {e}")
        return jsonify({"error": "Erro interno ao buscar vulnerabilidades."}), 500

@vulnerabilities_manager_bp.route('/add/<string:vuln_type>', methods=['POST'])
def add_vulnerability(vuln_type):
    config = current_app.extensions['config']
    data = request.get_json()
    try:
        file_path = ""
        if vuln_type == 'webapp':
            file_path = os.path.join(config.caminho_report_templates_descriptions, "vulnerabilities_webapp.json")
        elif vuln_type == 'servers':
            file_path = os.path.join(config.caminho_report_templates_descriptions, "vulnerabilities_servers.json")
        else:
            return jsonify({"error": "Tipo de vulnerabilidade inválido."}), 400

        if not data or 'Vulnerabilidade' not in data: # Assuming 'Vulnerabilidade' is the key
            return jsonify({"error": "Dados da vulnerabilidade incompletos. 'Vulnerabilidade' é obrigatório."}), 400

        # Use json_utils to add vulnerability
        success, message = add_vulnerability(file_path, data)
        if success:
            return jsonify({"message": message}), 201
        else:
            return jsonify({"error": message}), 409 # Conflict if already exists

    except Exception as e:
        print(f"Erro ao adicionar vulnerabilidade de {vuln_type}: {e}")
        return jsonify({"error": "Erro interno ao adicionar vulnerabilidade."}), 500

@vulnerabilities_manager_bp.route('/update/<string:vuln_type>/<string:vuln_name>', methods=['PUT']) # Changed vuln_id to vuln_name
def update_vulnerability(vuln_type, vuln_name): # Changed vuln_id to vuln_name
    config = current_app.extensions['config']
    data = request.get_json()
    try:
        file_path = ""
        if vuln_type == 'webapp':
            file_path = os.path.join(config.caminho_report_templates_descriptions, "vulnerabilities_webapp.json")
        elif vuln_type == 'servers':
            file_path = os.path.join(config.caminho_report_templates_descriptions, "vulnerabilities_servers.json")
        else:
            return jsonify({"error": "Tipo de vulnerabilidade inválido."}), 400

        if not data:
            return jsonify({"error": "Dados para atualização não fornecidos."}), 400

        # Use json_utils to update vulnerability
        success, message = update_vulnerability(file_path, vuln_name, data) # Pass vuln_name as old_vuln_name
        if success:
            return jsonify({"message": message}), 200
        else:
            return jsonify({"error": message}), 404 # Not found or other update issue

    except Exception as e:
        print(f"Erro ao atualizar vulnerabilidade {vuln_name} de {vuln_type}: {e}")
        return jsonify({"error": "Erro interno ao atualizar vulnerabilidade."}), 500

@vulnerabilities_manager_bp.route('/delete/<string:vuln_type>/<string:vuln_name>', methods=['DELETE']) # Changed vuln_id to vuln_name
def delete_vulnerability(vuln_type, vuln_name): # Changed vuln_id to vuln_name
    config = current_app.extensions['config']
    try:
        file_path = ""
        if vuln_type == 'webapp':
            file_path = os.path.join(config.caminho_report_templates_descriptions, "vulnerabilities_webapp.json")
        elif vuln_type == 'servers':
            file_path = os.path.join(config.caminho_report_templates_descriptions, "vulnerabilities_servers.json")
        else:
            return jsonify({"error": "Tipo de vulnerabilidade inválido."}), 400

        # Use json_utils to delete vulnerability
        success, message = delete_vulnerability(file_path, vuln_name)
        if success:
            return jsonify({"message": message}), 200
        else:
            return jsonify({"error": message}), 404 # Not found

    except Exception as e:
        print(f"Erro ao deletar vulnerabilidade {vuln_name} de {vuln_type}: {e}")
        return jsonify({"error": "Erro interno ao deletar vulnerabilidade."}), 500

@vulnerabilities_manager_bp.route('/descriptions/<string:vuln_type>', methods=['GET'])
def get_vulnerability_descriptions(vuln_type):
    config = current_app.extensions['config']
    try:
        file_path = ""
        if vuln_type == 'webapp':
            file_path = os.path.join(config.caminho_report_templates_descriptions, "descritivo_webapp.json")
        elif vuln_type == 'servers':
            file_path = os.path.join(config.caminho_report_templates_descriptions, "descritivo_servers.json")
        else:
            return jsonify({"error": "Tipo de vulnerabilidade inválido."}), 400

        # Use _load_data_ for descriptions, as it handles the "vulnerabilidades" key
        data = _load_data_(file_path)
        if isinstance(data, dict) and "vulnerabilidades" in data:
            return jsonify(data["vulnerabilidades"]), 200 # Return the list of categories/subcategories
        else:
            return jsonify([]), 200 # Return empty list if format is unexpected or file is empty

    except Exception as e:
        print(f"Erro ao buscar descrições de vulnerabilidades de {vuln_type}: {e}")
        return jsonify({"error": "Erro interno ao buscar descrições."}), 500

@vulnerabilities_manager_bp.route('/descriptions/<string:vuln_type>', methods=['PUT'])
def update_vulnerability_description(vuln_type):
    config = current_app.extensions['config']
    data = request.get_json()
    try:
        file_path = ""
        if vuln_type == 'webapp':
            file_path = os.path.join(config.caminho_report_templates_descriptions, "descritivo_webapp.json")
        elif vuln_type == 'servers':
            file_path = os.path.join(config.caminho_report_templates_descriptions, "descritivo_servers.json")
        else:
            return jsonify({"error": "Tipo de vulnerabilidade inválido."}), 400

        if not data or 'vulnerabilidades' not in data: # Expecting a dict with 'vulnerabilidades' key
            return jsonify({"error": "Dados de descrição incompletos. Esperado um dicionário com 'vulnerabilidades'."}), 400

        # Use json_utils.salvar_json to save the entire structure
        salvar_json(file_path, data)
        
        return jsonify({"message": "Descrição de vulnerabilidade atualizada com sucesso!"}), 200
    except Exception as e:
        print(f"Erro ao atualizar descrição de vulnerabilidade de {vuln_type}: {e}")
        return jsonify({"error": "Erro interno ao atualizar descrição de vulnerabilidade."}), 500