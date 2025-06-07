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
    print("DENTRO DA FUNÇÃO COMPILAR LATEXXXXXXXXXXXXXX")
    try:
        print("DENTRO DA FUNÇÃO COMPILAR LATEXXXXXXXXXXXXXX2")

        Path(diretorio_saida).mkdir(parents=True, exist_ok=True)

        main_tex_filename = Path(caminho_main_tex).name

        preambulo_path = Path(diretorio_saida) / "preambulo.tex"
        if not preambulo_path.exists():
            raise FileNotFoundError(f"Arquivo '{preambulo_path}' não encontrado no diretório de saída. "
                                    f"Verifique se foi copiado corretamente do template.")

        command = [
            'pdflatex',
            '-interaction=nonstopmode',
            '-output-directory', diretorio_saida,
            main_tex_filename
        ]

        result = subprocess.run(
            command,
            capture_output=True,
            encoding='latin-1',
            check=False,
            cwd=diretorio_saida
        )

        # --- MODIFICAÇÃO TEMPORÁRIA: SEMPRE IMPRIMA A SAÍDA ---
        print("\n--- SAÍDA DO PDFLATEX (STDOUT) ---")
        print(result.stdout)
        print("--- FIM SAÍDA DO PDFLATEX (STDOUT) ---\n")

        if result.stderr:
            print("\n--- SAÍDA DO PDFLATEX (STDERR) ---")
            print(result.stderr)
            print("--- FIM SAÍDA DO PDFLATEX (STDERR) ---\n")
        # --- FIM MODIFICAÇÃO TEMPORÁRIA ---

        if result.returncode != 0:
            print("❌ Erro fatal ao compilar o PDF. Código de retorno não-zero.")
            raise RuntimeError(f"Erro na compilação LaTeX. Código de retorno: {result.returncode}. "
                               f"Verifique os logs acima para detalhes do erro de compilação LaTeX.")
        else:
            print(f"PDF compilado (retorno 0) em: {Path(diretorio_saida) / main_tex_filename.replace('.tex', '.pdf')}")
            # Verificação se o PDF foi realmente criado
            if not (Path(diretorio_saida) / main_tex_filename.replace('.tex', '.pdf')).exists():
                print(f"AVISO: pdflatex retornou 0, mas o PDF '{main_tex_filename.replace('.tex', '.pdf')}' NÃO foi encontrado em '{diretorio_saida}'.")
                print("Isso pode indicar um problema de permissão ou compilação inválida.")

    except FileNotFoundError as fnf_e:
        print(f"Erro de arquivo não encontrado durante a compilação LaTeX (verificação Python): {fnf_e}")
        sys.stderr.flush()
        raise
    except Exception as e:
        print(f"Erro inesperado durante a compilação LaTeX: {e}")
        sys.stderr.flush()
        raise