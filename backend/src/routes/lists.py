# backend/src/routes/lists.py

from pathlib import Path
from flask import Blueprint, request, jsonify, current_app # Importa current_app
from ..core.database import Database
from bson.objectid import ObjectId
import json
import os
import shutil
import time

# Removido: from ..main import tenable_api # Não é mais necessário
# Removido: from ..main import config # Não é mais necessário
# from ..api.tenable import TenableApi # Removido se não for usado para tipagem ou outras coisas

# Removido inicialização local:
# config = Config("config.json")
# tenable_api = TenableApi()

lists_bp = Blueprint('lists', __name__, url_prefix='/lists')

@lists_bp.route('/getLists/', methods=['GET'])
def getLists():
    db_instance = Database()
    try:
        lists = db_instance.find("listas")
        lists_list = []
        for lista in lists:
            lists_list.append({
                "idLista": str(lista["_id"]),
                "nomeLista": lista["nomeLista"],
                "pastas_scans_webapp": lista.get("pastas_scans_webapp"),
                "pastas_scans_vm": lista.get("pastas_scans_vm"), # Corrigido para vm de servers
                "id_scan": lista.get("id_scan"),
                "historyid_scanservidor": lista.get("historyid_scanservidor"),
                "relatorioGerado": lista.get("relatorioGerado", False)
            })
        db_instance.close()
        return jsonify(lists_list), 200
    except Exception as e:
        print(f"Erro ao obter listas: {e}")
        return jsonify({"error": str(e)}), 500

@lists_bp.route('/createList/', methods=['POST'])
def createList():
    data = request.get_json()
    if not data or 'nomeLista' not in data:
        return jsonify({"error": "nomeLista é obrigatório."}), 400

    nome_lista = data['nomeLista']
    db_instance = Database()
    try:
        result = db_instance.insert_one("listas", {"nomeLista": nome_lista, "relatorioGerado": False})
        db_instance.close()
        return jsonify({"message": "Lista criada com sucesso!", "idLista": str(result.inserted_id)}), 201
    except Exception as e:
        print(f"Erro ao criar lista: {e}")
        db_instance.close()
        return jsonify({"error": str(e)}), 500

@lists_bp.route('/updateList/<string:id_lista>', methods=['PUT'])
def updateList(id_lista):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados não fornecidos."}), 400
    
    db_instance = Database()
    try:
        objeto_id = ObjectId(id_lista)
    except Exception:
        db_instance.close()
        return jsonify({"error": "ID de lista inválido."}), 400

    update_fields = {}
    if 'nomeLista' in data:
        update_fields['nomeLista'] = data['nomeLista']
    if 'pastas_scans_webapp' in data:
        update_fields['pastas_scans_webapp'] = data['pastas_scans_webapp']
    if 'pastas_scans_vm' in data: # Corrigido para vm
        update_fields['pastas_scans_vm'] = data['pastas_scans_vm']
    if 'id_scan' in data:
        update_fields['id_scan'] = data['id_scan']
    if 'historyid_scanservidor' in data:
        update_fields['historyid_scanservidor'] = data['historyid_scanservidor']
    
    if not update_fields:
        db_instance.close()
        return jsonify({"message": "Nenhum campo para atualizar."}), 200

    try:
        result = db_instance.update_one("listas", {"_id": objeto_id}, update_fields)
        if result.modified_count == 0:
            db_instance.close()
            return jsonify({"message": "Lista não encontrada ou nenhum dado alterado."}), 404
        db_instance.close()
        return jsonify({"message": "Lista atualizada com sucesso!"}), 200
    except Exception as e:
        print(f"Erro ao atualizar lista: {e}")
        db_instance.close()
        return jsonify({"error": str(e)}), 500

@lists_bp.route('/deleteList/<string:id_lista>', methods=['DELETE'])
def deleteList(id_lista):
    db_instance = Database()
    try:
        objeto_id = ObjectId(id_lista)
    except Exception:
        db_instance.close()
        return jsonify({"error": "ID de lista inválido."}), 400

    try:
        # Acessa config via current_app.extensions
        config = current_app.extensions['config']
        
        # Antes de deletar a lista, tenta deletar a pasta associada
        lista_doc = db_instance.find_one("listas", {"_id": objeto_id})
        if lista_doc:
            if lista_doc.get("pastas_scans_webapp"):
                webapp_folder_path = Path(lista_doc["pastas_scans_webapp"])
                if webapp_folder_path.exists() and webapp_folder_path.is_dir():
                    shutil.rmtree(webapp_folder_path)
                    print(f"DEBUG: Pasta de scans WebApp excluída: {webapp_folder_path}")
            
            if lista_doc.get("pastas_scans_vm"): # Corrigido para vm
                vm_folder_path = Path(lista_doc["pastas_scans_vm"])
                if vm_folder_path.exists() and vm_folder_path.is_dir():
                    shutil.rmtree(vm_folder_path)
                    print(f"DEBUG: Pasta de scans VM excluída: {vm_folder_path}")

            # Deleta os relatórios gerados a partir desta lista
            relatorios_gerados = db_instance.find("relatorios", {"id_lista": id_lista})
            for relatorio in relatorios_gerados:
                relatorio_id = str(relatorio["_id"])
                report_folder_path = Path(config.caminho_shared_relatorios) / relatorio_id
                if report_folder_path.exists() and report_folder_path.is_dir():
                    shutil.rmtree(report_folder_path)
                    print(f"DEBUG: Pasta do relatório associado excluída: {report_folder_path}")
            
            db_instance.delete_many("relatorios", {"id_lista": id_lista})
            print(f"DEBUG: Relatórios associados à lista {id_lista} excluídos.")


        result = db_instance.delete_one("listas", {"_id": objeto_id})
        if result.deleted_count == 0:
            db_instance.close()
            return jsonify({"message": "Lista não encontrada."}), 404
        db_instance.close()
        return jsonify({"message": "Lista deletada com sucesso!"}), 200
    except Exception as e:
        print(f"Erro ao deletar lista: {e}")
        db_instance.close()
        return jsonify({"error": str(e)}), 500

@lists_bp.route('/getFolders/<string:scan_type>', methods=['GET'])
def getFolders(scan_type):
    # Acessa config via current_app.extensions
    config = current_app.extensions['config']
    
    if scan_type == 'was':
        base_path = Path(config.caminho_scans_base) / "WebAppScans"
    elif scan_type == 'vm': # Corrigido para vm
        base_path = Path(config.caminho_scans_base) / "VMScans" # Corrigido para VMScans
    else:
        return jsonify({"error": "Tipo de scan inválido. Use 'was' ou 'vm'."}), 400

    if not base_path.exists():
        return jsonify([]), 200

    folders = []
    for item in base_path.iterdir():
        if item.is_dir():
            # Verifica se a pasta contém o arquivo JSON correspondente ao nome da pasta
            json_file = item / f"{item.name}.json"
            if json_file.exists():
                folders.append({
                    "name": item.name,
                    "path": str(item),
                    "is_empty": False
                })
            else:
                folders.append({
                    "name": item.name,
                    "path": str(item),
                    "is_empty": True # Sinaliza que a pasta pode estar vazia ou mal formada
                })
    return jsonify(folders), 200

@lists_bp.route('/getScanInfo/<string:scan_type>/<string:scan_name>', methods=['GET'])
def getScanInfo(scan_type, scan_name):
    # Acessa config via current_app.extensions
    config = current_app.extensions['config']
    # Acessa tenable_api via current_app.extensions
    tenable_api = current_app.extensions['tenable_api']

    if scan_type == 'was':
        base_path = Path(config.caminho_scans_base) / "WebAppScans"
    elif scan_type == 'vm': # Corrigido para vm
        base_path = Path(config.caminho_scans_base) / "VMScans" # Corrigido para VMScans
    else:
        return jsonify({"error": "Tipo de scan inválido. Use 'was' ou 'vm'."}), 400

    scan_folder_path = base_path / scan_name
    json_file_path = scan_folder_path / f"{scan_name}.json"

    if not json_file_path.exists():
        return jsonify({"error": "Arquivo JSON do scan não encontrado na pasta."}), 404

    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            scan_data = json.load(f)
        
        scan_id = scan_data.get('info', {}).get('uuid')
        history_id = None
        if scan_type == 'vm' and scan_data.get('history'): # Apenas VM scans tem history_id
            history_id = scan_data['history'][0]['history_id']
            
        # Opcional: buscar mais detalhes da API Tenable se necessário, mas evite chamadas desnecessárias.
        # tenable_details = tenable_api.get_scan_details(scan_id)
        
        return jsonify({
            "scan_id": scan_id,
            "history_id": history_id,
            "scan_name": scan_name,
            "folder_path": str(scan_folder_path),
            "scan_type": scan_type
        }), 200

    except Exception as e:
        print(f"Erro ao obter informações do scan '{scan_name}': {e}")
        return jsonify({"error": f"Erro interno ao obter informações do scan: {e}"}), 500