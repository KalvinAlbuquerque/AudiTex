# backend/src/main.py

from flask import Flask, current_app # Importa current_app
from flask_cors import CORS
from .core.config import Config
from .core.database import Database
from .api.tenable import TenableApi
from .models.user import User
from .models.settings import SystemSettings
import os
import time

from .routes.scans import scans_bp
from .routes.lists import lists_bp
from .routes.reports import reports_bp
from .routes.vulnerabilities_manager import vulnerabilities_manager_bp
from .routes.auth import auth_bp
from .routes.settings import settings_bp

# Config será inicializada aqui, mas anexada ao app.extensions
config = Config("config.json")

# A instância de tenable_api será inicializada dentro do app_context e anexada
# Removido: global tenable_api # Não é mais necessário

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"], supports_credentials=True)
app.register_blueprint(scans_bp)
app.register_blueprint(lists_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(vulnerabilities_manager_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(settings_bp)

images_folder_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..',
    'shared_data',
    'report_templates',
    'base_report',
    'assets'
)

app.static_folder = images_folder_path
app.static_url_path = '/backend_assets'

# --- NOVO: Lógica para criar usuário admin da APLICAÇÃO na coleção 'users', se vazia ---
def create_default_admin_user_if_not_exists():
    db_instance = Database()
    try:
        admin_login = "admin"
        admin_password = "admin"

        existing_user = db_instance.find_one("users", {"login": admin_login})
        if not existing_user:
            print("Criando usuário administrador padrão da aplicação...")

            new_admin_user = User(
                login=admin_login,
                password=admin_password,
                name=os.getenv("DEFAULT_ADMIN_NAME", "Administrador Teste"),
                email=os.getenv("DEFAULT_ADMIN_EMAIL", "admin@example.com"),
                profile="Administrator"
            )

            db_instance.insert_one("users", {
                "login": new_admin_user.login,
                "password": new_admin_user.password,
                "name": new_admin_user.name,
                "email": new_admin_user.email,
                "profile": new_admin_user.profile
            })
            print(f"Usuário administrador da aplicação '{new_admin_user.login}' criado com sucesso na coleção 'users'.")
            print(f"SENHA SALVA PARA '{new_admin_user.login}': {new_admin_user.password} (sem hash, apenas para debug!)")
        else:
            print(f"Usuário '{admin_login}' já existe, não será recriado.")
    except Exception as e:
        print(f"Erro ao tentar criar usuário administrador padrão da aplicação: {e}")
    finally:
        db_instance.close()

def ensure_logs_collection_exists():
    db_instance = Database()
    try:
        db_instance.db.create_collection('logs')
        print("Coleção 'logs' assegurada.")
    except Exception as e:
        print(f"Erro ao assegurar coleção 'logs': {e}")
    finally:
        db_instance.close()

def ensure_settings_collection_and_default_tenable_config():
    db_instance = Database()
    try:
        db_instance.db.create_collection('settings')
        print("Coleção 'settings' assegurada.")

        existing_settings = db_instance.find_one("settings", {})
        if not existing_settings:
            default_settings = SystemSettings(tenable_api_key=None, tenable_access_key=None)
            db_instance.insert_one("settings", default_settings.to_dict())
            print("Documento de configurações padrão inserido na coleção 'settings'.")
        else:
            print("Documento de configurações já existe na coleção 'settings'.")
    except Exception as e:
        print(f"Erro ao assegurar coleção 'settings' ou inserir configurações padrão: {e}")
    finally:
        db_instance.close()

# Executa a configuração inicial do banco de dados da aplicação quando o Flask inicia
with app.app_context():
    create_default_admin_user_if_not_exists()
    ensure_logs_collection_exists()
    ensure_settings_collection_and_default_tenable_config()

    # Anexa as instâncias globais ao app.extensions
    app.extensions['config'] = config # Anexa a instância de Config
    app.extensions['tenable_api'] = TenableApi(Database()) # Anexa a instância de TenableApi

if __name__ == "__main__":
    print(app.url_map)
    app.run(debug=True, host='0.0.0.0', port=5000)