import subprocess
import os
from pathlib import Path
import sys

def compilar_latex(caminho_main_tex: str, diretorio_saida: str):
    """
    Compila um arquivo LaTeX (.tex) para gerar um PDF.

    Args:
        caminho_main_tex (str): O caminho completo para o arquivo main.tex.
        diretorio_saida (str): O diretório onde o PDF e outros arquivos de saída serão gerados.
    """
    try:
        # Garante que o diretório de saída existe
        Path(diretorio_saida).mkdir(parents=True, exist_ok=True)

        # Extrai o nome do arquivo main.tex sem o diretório
        main_tex_filename = Path(caminho_main_tex).name

        # Verifica se preambulo.tex existe no diretório de saída (para depuração)
        preambulo_path = Path(diretorio_saida) / "preambulo.tex"
        if not preambulo_path.exists():
            raise FileNotFoundError(f"Arquivo '{preambulo_path}' não encontrado no diretório de saída. "
                                    f"Verifique se foi copiado corretamente do template.")

        # Comando para compilar o LaTeX
        command = [
            'pdflatex',
            '-interaction=nonstopmode', # Não pausa para erros
            '-output-directory', diretorio_saida, # Define o diretório de saída para onde o PDF irá
            main_tex_filename # Apenas o nome do arquivo, já que CWD será o diretório dele
        ]

        # Executa o comando, ESPECIFICANDO O DIRETÓRIO DE TRABALHO E A CODIFICAÇÃO
        result = subprocess.run(
            command,
            capture_output=True,
            # ATENÇÃO: Alterado text=True para encoding='latin-1' para resolver UnicodeDecodeError
            encoding='latin-1', # Usar latin-1 para a saída do LaTeX
            check=False,
            cwd=diretorio_saida # Define o diretório de trabalho
        )

        # Verifica o código de retorno
        if result.returncode != 0:
            print("❌ Erro ao compilar o PDF:")
            print(f"Comando executado: {' '.join(command)}")
            print(f"Código de retorno: {result.returncode}")
            print(f"Saída padrão (stdout): {result.stdout}")
            sys.stdout.flush()
            print(f"Saída de erro (stderr): {result.stderr}")
            sys.stderr.flush()
            raise RuntimeError(f"Erro na compilação LaTeX. Código de retorno: {result.returncode}. "
                               f"Verifique os logs acima para detalhes do erro de compilação LaTeX.")
        else:
            print(f"PDF compilado com sucesso em: {Path(diretorio_saida) / main_tex_filename.replace('.tex', '.pdf')}")

    except FileNotFoundError as fnf_e:
        print(f"Erro de arquivo não encontrado durante a compilação LaTeX (verificação Python): {fnf_e}")
        sys.stderr.flush()
        raise
    except Exception as e:
        print(f"Erro inesperado durante a compilação LaTeX: {e}")
        sys.stderr.flush()
        raise