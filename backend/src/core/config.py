# backend/src/core/config.py

import json
import os
from dotenv import load_dotenv

class Config:
    _instance = None
    _inicializado = False

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(Config, cls).__new__(cls)
        return cls._instance

    def __init__(self, arquivo_config: str = None):
        # Initialize all attributes to a default value.
        # This ensures they always exist on the instance, preventing AttributeError.
        self._config_data = {}
        self._caminho_shared_relatorios = None
        self._caminho_shared_jsons = None
        self._caminho_report_templates_base = None
        self._caminho_report_templates_descriptions = None
        self._colecao_vulnerabilidades_webapp = "vulnerabilidades_webapp" # Default collection name
        self._colecao_vulnerabilidades_servers = "vulnerabilidades_servers" # Default collection name

        if not self._inicializado:
            # Only proceed with file loading and environment variable parsing if not already initialized
            if arquivo_config is None:
                # In your setup, config.json is always provided initially,
                # but this check can prevent errors if it were ever called without it.
                pass # You might want to raise an error here if arquivo_config is strictly required on first init

            config_json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', arquivo_config)

            try:
                with open(config_json_path, 'r', encoding='utf-8') as f:
                    self._config_data = json.load(f)
            except FileNotFoundError:
                raise FileNotFoundError(f"Arquivo de configuração não encontrado: {config_json_path}")
            except json.JSONDecodeError:
                raise ValueError(f"Arquivo de configuração inválido (JSON malformado): {config_json_path}")

            # Load environment variables first
            load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'credentials.env'))

            # Set attributes from config_data, preferring environment variables if present
            # Using .get() with a default ensures that if a key is missing in config.json,
            # it falls back to the default provided during initial attribute declaration or a safe empty string.
            self._caminho_shared_relatorios = os.getenv('CAMINHO_SHARED_RELATORIOS', self._config_data.get("caminho_shared_relatorios"))
            self._caminho_shared_jsons = os.getenv('CAMINHO_SHARED_JSONS', self._config_data.get("caminho_shared_jsons"))
            self._caminho_report_templates_base = os.getenv('CAMINHO_REPORT_TEMPLATES_BASE', self._config_data.get("caminho_report_templates_base"))
            self._caminho_report_templates_descriptions = os.getenv('CAMINHO_REPORT_TEMPLATES_DESCRIPTIONS', self._config_data.get("caminho_report_templates_descriptions"))

            # Set the collection names from config_data, falling back to safe defaults
            self._colecao_vulnerabilidades_webapp = self._config_data.get("colecao_vulnerabilidades_webapp", "vulnerabilidades_webapp")
            self._colecao_vulnerabilidades_servers = self._config_data.get("colecao_vulnerabilidades_servers", "vulnerabilidades_servers")

            self._inicializado = True

    @property
    def caminho_shared_relatorios(self) -> str:
        # Provide a safe fallback for properties if they end up being None
        return self._caminho_shared_relatorios if self._caminho_shared_relatorios is not None else ""

    @property
    def caminho_shared_jsons(self) -> str:
        return self._caminho_shared_jsons if self._caminho_shared_jsons is not None else ""

    @property
    def caminho_report_templates_base(self) -> str:
        return self._caminho_report_templates_base if self._caminho_report_templates_base is not None else ""

    @property
    def caminho_report_templates_descriptions(self) -> str:
        return self._caminho_report_templates_descriptions if self._caminho_report_templates_descriptions is not None else ""

    @property
    def colecao_vulnerabilidades_webapp(self) -> str:
        return self._colecao_vulnerabilidades_webapp

    @property
    def colecao_vulnerabilidades_servers(self) -> str:
        return self._colecao_vulnerabilidades_servers