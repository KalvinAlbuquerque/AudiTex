# backend/src/routes/scans.py

import json
from pathlib import Path
import shutil
from flask import Blueprint, request, jsonify, current_app # Importa current_app
import os
import time
from ..core.database import Database # Mantém para uso local

# Removido: from ..main import tenable_api
# Removido: from ..main import config

# Removido inicialização local:
# config = Config("config.json")
# tenable_api = TenableApi()

scans_bp = Blueprint('scans', __name__, url_prefix='/scans')

@scans_bp.route('/getScansFromTenable', methods=['GET'])
def getScansFromTenable():
    try:
        tenable_api = current_app.extensions['tenable_api']
        scans = tenable_api.get_scans()
        return jsonify(scans), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print(f"Erro ao obter scans do Tenable: {e}")
        return jsonify({"error": "Erro ao obter scans do Tenable."}), 500

@scans_bp.route('/saveScanToDirectory', methods=['POST'])
def saveScanToDirectory():
    data = request.get_json()
    if not data or 'scanId' not in data or 'scanName' not in data:
        return jsonify({"error": "scanId e scanName são obrigatórios."}), 400

    scan_id = data['scanId']
    scan_name = data['scanName']
    scan_type = data.get('scanType')

    config = current_app.extensions['config']
    base_scan_path = Path(config.caminho_scans_base)
    
    if scan_type == 'was':
        scan_directory = base_scan_path / "WebAppScans" / scan_name
        json_file_path = scan_directory / f"{scan_name}.json"
    elif scan_type == 'vm':
        scan_directory = base_scan_path / "VMScans" / scan_name
        json_file_path = scan_directory / f"{scan_name}.json"
    else:
        return jsonify({"error": "scanType inválido. Use 'was' ou 'vm'."}), 400

    scan_directory.mkdir(parents=True, exist_ok=True)

    try:
        tenable_api = current_app.extensions['tenable_api']
        scan_details = tenable_api.get_scan_details(scan_id)

        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(scan_details, f, ensure_ascii=False, indent=4)
        
        if scan_type == 'vm' and 'history_id' in data:
            history_id = data['history_id']
            csv_content = tenable_api.export_scan_csv(scan_id, history_id)
            if csv_content:
                csv_file_path = scan_directory / "servidores_scan.csv"
                with open(csv_file_path, 'wb') as f:
                    f.write(csv_content)
                
        return jsonify({"message": f"Scan '{scan_name}' salvo com sucesso em {scan_directory}"}), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print(f"Erro ao salvar scan '{scan_name}': {e}")
        return jsonify({"error": f"Erro interno ao salvar scan: {e}"}), 500

@scans_bp.route('/getSavedScans/<string:scan_type>', methods=['GET'])
def getSavedScans(scan_type):
    config = current_app.extensions['config']
    if scan_type not in ['was', 'vm']:
        return jsonify({"error": "Tipo de scan inválido. Use 'was' ou 'vm'."}), 400

    base_scan_path = Path(config.caminho_scans_base)
    if scan_type == 'was':
        target_directory = base_scan_path / "WebAppScans"
    else: # vm
        target_directory = base_scan_path / "VMScans"

    if not target_directory.exists():
        return jsonify([]), 200

    saved_scans_list = []
    for scan_folder in target_directory.iterdir():
        if scan_folder.is_dir():
            scan_name = scan_folder.name
            json_file_path = scan_folder / f"{scan_name}.json"
            if json_file_path.exists():
                try:
                    with open(json_file_path, 'r', encoding='utf-8') as f:
                        scan_data = json.load(f)
                    
                    scan_id = scan_data.get('info', {}).get('uuid', '')
                    latest_history_id = None
                    if scan_data.get('history'):
                        latest_history_id = scan_data['history'][0]['history_id']

                    saved_scans_list.append({
                        "id": scan_id,
                        "name": scan_name,
                        "folder_path": str(scan_folder),
                        "history_id": latest_history_id
                    })
                except json.JSONDecodeError:
                    print(f"Erro ao decodificar JSON em {json_file_path}")
                except Exception as e:
                    print(f"Erro ao processar scan salvo {json_file_path}: {e}")
    return jsonify(saved_scans_list), 200


@scans_bp.route('/deleteScanFromDirectory/<string:scan_type>/<string:scan_name>', methods=['DELETE'])
def deleteScanFromDirectory(scan_type, scan_name):
    config = current_app.extensions['config']
    if scan_type not in ['was', 'vm']:
        return jsonify({"error": "Tipo de scan inválido. Use 'was' ou 'vm'."}), 400

    base_scan_path = Path(config.caminho_scans_base)
    if scan_type == 'was':
        scan_directory = base_scan_path / "WebAppScans" / scan_name
    else: # vm
        scan_directory = base_scan_path / "VMScans" / scan_name

    if not scan_directory.exists():
        return jsonify({"message": f"Pasta do scan '{scan_name}' não encontrada."}), 404
    
    try:
        shutil.rmtree(scan_directory)
        return jsonify({"message": f"Scan '{scan_name}' excluído com sucesso."}), 200
    except Exception as e:
        print(f"Erro ao excluir pasta do scan '{scan_name}': {e}")
        return jsonify({"error": f"Erro interno ao excluir scan: {e}"}), 500


@scans_bp.route('/getScanDetails/<string:scan_id>', methods=['GET'])
def getScanDetails(scan_id):
    try:
        tenable_api = current_app.extensions['tenable_api']
        scan_details = tenable_api.get_scan_details(scan_id)
        return jsonify(scan_details), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print(f"Erro ao obter detalhes do scan {scan_id} do Tenable: {e}")
        return jsonify({"error": "Erro ao obter detalhes do scan."}), 500

@scans_bp.route('/exportScanCsv/<string:scan_id>/<string:history_id>', methods=['GET'])
def exportScanCsv(scan_id, history_id):
    try:
        tenable_api = current_app.extensions['tenable_api']
        csv_content = tenable_api.export_scan_csv(scan_id, history_id)
        if csv_content:
            return jsonify({"csv_content": csv_content.decode('utf-8')}), 200
        else:
            return jsonify({"error": "Nenhum conteúdo CSV retornado."}), 404
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print(f"Erro ao exportar CSV do scan {scan_id}: {e}")
        return jsonify({"error": "Erro ao exportar CSV do scan."}), 500