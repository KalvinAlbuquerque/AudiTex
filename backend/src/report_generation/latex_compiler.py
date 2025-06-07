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

        # First pass to generate .aux and .toc files
        print(f"Executando primeira passada do pdflatex em {diretorio_saida}...")
        result = subprocess.run(
            command,
            capture_output=True,
            encoding='latin-1',
            check=False,
            cwd=diretorio_saida
        )
        print("\n--- SAÍDA DO PDFLATEX (PRIMEIRA PASSADA - STDOUT) ---")
        print(result.stdout)
        if result.stderr:
            print("\n--- SAÍDA DO PDFLATEX (PRIMEIRA PASSADA - STDERR) ---")
            print(result.stderr)
        print("--- FIM SAÍDA DO PDFLATEX (PRIMEIRA PASSADA) ---\n")

        if result.returncode != 0:
            print("❌ Erro fatal na primeira passada do pdflatex.")
            raise RuntimeError(f"Erro na compilação LaTeX (primeira passada). Código de retorno: {result.returncode}. "
                               f"Verifique os logs acima para detalhes.")

        # Second pass to resolve cross-references like table of contents
        print(f"Executando segunda passada do pdflatex em {diretorio_saida}...")
        result = subprocess.run(
            command,
            capture_output=True,
            encoding='latin-1',
            check=False,
            cwd=diretorio_saida
        )
        print("\n--- SAÍDA DO PDFLATEX (SEGUNDA PASSADA - STDOUT) ---")
        print(result.stdout)
        if result.stderr:
            print("\n--- SAÍDA DO PDFLATEX (SEGUNDA PASSADA - STDERR) ---")
            print(result.stderr)
        print("--- FIM SAÍDA DO PDFLATEX (SEGUNDA PASSADA) ---\n")

        if result.returncode != 0:
            print("❌ Erro fatal na segunda passada do pdflatex.")
            raise RuntimeError(f"Erro na compilação LaTeX (segunda passada). Código de retorno: {result.returncode}. "
                               f"Verifique os logs acima para detalhes.")
        else:
            pdf_path = Path(diretorio_saida) / main_tex_filename.replace('.tex', '.pdf')
            if not pdf_path.exists():
                print(f"AVISO: pdflatex retornou 0, mas o PDF '{pdf_path.name}' NÃO foi encontrado em '{diretorio_saida}'.")
                print("Isso pode indicar um problema de permissão ou compilação inválida.")
            else:
                print(f"PDF compilado com sucesso em: {pdf_path}")

    except FileNotFoundError as fnf_e:
        print(f"Erro de arquivo não encontrado durante a compilação LaTeX (verificação Python): {fnf_e}")
        sys.stderr.flush()
        raise
    except Exception as e:
        print(f"Erro inesperado durante a compilação LaTeX: {e}")
        sys.stderr.flush()
        raise