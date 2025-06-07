import subprocess
import os

def compilar_latex(caminho_arquivo_tex: str, pasta_saida: str):
    """
    Compila um arquivo LaTeX para PDF usando pdflatex.

    Parâmetros:
    - caminho_arquivo_tex (str): Caminho completo para o arquivo .tex principal (ex: 'main.tex').
    - pasta_saida (str): Diretório onde o PDF e arquivos auxiliares serão gerados.
    """
    try:
        # Garante que a pasta de saída exista
        if not os.path.exists(pasta_saida):
            os.makedirs(pasta_saida, exist_ok=True)
            
        # Use pdflatex diretamente (assumindo que o PATH foi configurado na instalação do MiKTeX ou TeX Live)
        # Executa duas vezes para garantir que referências cruzadas e sumário sejam atualizados
        for _ in range(2): 
            result = subprocess.run(
                [
                    'pdflatex',
                    '-interaction=nonstopmode', # Não pausa para erros
                    '-output-directory', pasta_saida, # Define o diretório de saída
                    caminho_arquivo_tex # O arquivo .tex a ser compilado
                ],
                check=True, # Levanta uma exceção se o comando retornar um código de erro
                capture_output=True, # Captura stdout e stderr
                text=True # Decodifica stdout/stderr como texto
            )
            print(f"✅ Compilação LaTeX bem-sucedida. Saída: {result.stdout}")
            if result.stderr:
                print(f"⚠️ Erros/Avisos da compilação LaTeX: {result.stderr}")
                
    except FileNotFoundError:
        print("❌ Erro: 'pdflatex' não encontrado. Verifique se o MiKTeX/TeX Live está instalado e no PATH do ambiente do contêiner.")
    except subprocess.CalledProcessError as e:
        print("❌ Erro ao compilar o PDF:")
        print(f"Comando executado: {e.cmd}")
        print(f"Código de retorno: {e.returncode}")
        print(f"Saída padrão: {e.stdout}")
        print(f"Saída de erro: {e.stderr}")
        print("Verifique os logs acima para detalhes do erro de compilação LaTeX.")
    except Exception as e:
        print(f"❌ Ocorreu um erro inesperado durante a compilação LaTeX: {e}")