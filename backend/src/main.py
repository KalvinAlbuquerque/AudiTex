# backend/src/main.py

from flask import Flask
from flask_cors import CORS
from .core.config import Config
from .core.database import Database
from .api.tenable import TenableApi
from .models.user import User
import os
import time

from .routes.scans import scans_bp
from .routes.lists import lists_bp
from .routes.reports import reports_bp
from .routes.vulnerabilities_manager import vulnerabilities_manager_bp
from .routes.auth import auth_bp

config = Config("config.json")
tenable_api = TenableApi()
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"], supports_credentials=True)
app.register_blueprint(scans_bp)
app.register_blueprint(lists_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(vulnerabilities_manager_bp)
app.register_blueprint(auth_bp)

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
    # HARDCODED PARA DEBUG - ESTE CÓDIGO FORÇA UMA CONSISTÊNCIA NO USUÁRIO 'admin'
    # Ele DELETA e RECria o usuário 'admin' a cada inicialização do Flask.
    # NÃO USAR EM PRODUÇÃO!
    
    db_instance = Database()
    try:
        admin_login = "admin"
        admin_password = "admin" # Senha hardcoded

        # Sempre tenta deletar o usuário existente para garantir um estado limpo
        existing_user = db_instance.find_one("users", {"login": admin_login})
        if existing_user:
            db_instance.delete_one("users", {"login": admin_login})
            print(f"Usuário existente '{admin_login}' deletado para recriação.")

        print("Criando/Recriando usuário administrador padrão da aplicação...")
        
        new_admin_user = User(
            login=admin_login,
            password=admin_password, # A senha 'admin' será hasheada AQUI
            name=os.getenv("DEFAULT_ADMIN_NAME", "Administrador Teste"), # Pega do env ou default
            email=os.getenv("DEFAULT_ADMIN_EMAIL", "admin@example.com"), # Pega do env ou default
            profile="Administrator"
        )
        
        db_instance.insert_one("users", {
            "login": new_admin_user.login,
            "password": new_admin_user.password, # O hash gerado será salvo AQUI
            "name": new_admin_user.name,
            "email": new_admin_user.email,
            "profile": new_admin_user.profile
        })
        print(f"Usuário administrador da aplicação '{new_admin_user.login}' criado com sucesso na coleção 'users'.")
        print(f"HASH DA SENHA SALVA PARA '{new_admin_user.login}': {new_admin_user.password}") # IMPRIME o hash que acabou de ser salvo
    except Exception as e:
        print(f"Erro ao tentar criar/recriar usuário administrador padrão da aplicação: {e}")
    finally:
        db_instance.close()

# Executa a configuração inicial do banco de dados da aplicação quando o Flask inicia
with app.app_context():
    create_default_admin_user_if_not_exists()
# --- FIM DO NOVO BLOCO ---

if __name__ == "__main__":
    print(app.url_map)
    app.run(debug=True, host='0.0.0.0', port=5000)