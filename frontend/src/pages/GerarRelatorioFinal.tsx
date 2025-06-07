import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Manter useNavigate
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL; // Obtém a URL da API das variáveis de ambiente

function GerarRelatorioFinal() {
    const { relatorioId } = useParams<{ relatorioId: string }>();
    const navigate = useNavigate(); // Manter, pois é usado para navegação

    const [loading, setLoading] = useState(false);
    const [missingVulnerabilitiesSites, setMissingVulnerabilitiesSites] = useState<string[]>([]);
    const [missingVulnerabilitiesServers, setMissingVulnerabilitiesServers] = useState<string[]>([]);

    useEffect(() => {
        if (relatorioId) {
            fetchMissingVulnerabilities('sites');
            fetchMissingVulnerabilities('servers');
        }
    }, [relatorioId]);

    const fetchMissingVulnerabilities = async (type: 'sites' | 'servers') => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/reports/getRelatorioMissingVulnerabilities?relatorioId=${relatorioId}&type=${type}`);
            if (type === 'sites') {
                setMissingVulnerabilitiesSites(response.data.content);
            } else {
                setMissingVulnerabilitiesServers(response.data.content);
            }
        } catch (error: any) {
            console.error(`Erro ao buscar vulnerabilidades ausentes para ${type}:`, error);
            if (error.response && error.response.status === 404) {
                // Mensagem específica se o arquivo não for encontrado (pode ser normal se não houver ausentes)
                if (type === 'sites') setMissingVulnerabilitiesSites([]);
                else setMissingVulnerabilitiesServers([]);
                toast.info(`Nenhuma vulnerabilidade ausente encontrada para ${type}.`);
            } else {
                toast.error(`Erro ao buscar vulnerabilidades ausentes para ${type}.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => { // Manter, pois a função será chamada por um botão
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/reports/baixarRelatorioPdf`, {
                idRelatorio: relatorioId,
            }, {
                responseType: 'blob', // Importante para baixar arquivos
            });

            // Cria um link temporário para download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Relatorio_${relatorioId}.pdf`); // Nome do arquivo
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // Libera o URL do objeto

            toast.success('Download do PDF iniciado!');
        } catch (error: any) {
            console.error('Erro ao baixar o PDF:', error);
            if (error.response && error.response.status === 404) {
                toast.error('PDF do relatório não encontrado.');
            } else {
                toast.error('Erro ao baixar o PDF. Verifique os logs.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            <ToastContainer />
            <main className="flex-grow p-6 flex justify-center items-center">
                <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-4xl">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                        Relatório Gerado
                    </h2>

                    <p className="text-gray-700 mb-4 text-center">
                        Seu relatório foi gerado com sucesso! Você pode baixá-lo ou verificar as vulnerabilidades que não foram categorizadas.
                    </p>

                    <div className="text-center mb-8">
                        <button
                            onClick={downloadPDF}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-4"
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color={"#fff"} /> : 'Baixar Relatório PDF'}
                        </button>
                        <button
                            onClick={() => navigate('/relatorios-gerados')}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Voltar para Relatórios Gerados
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                Vulnerabilidades Web App Não Categorizadas
                            </h3>
                            {missingVulnerabilitiesSites.length > 0 ? (
                                <ul className="list-disc list-inside bg-gray-50 p-4 rounded-md h-64 overflow-y-auto">
                                    {missingVulnerabilitiesSites.map((vuln, index) => (
                                        <li key={index} className="text-gray-700">{vuln}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-600">Todas as vulnerabilidades de Web Apps foram categorizadas.</p>
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                Vulnerabilidades Servidores Não Categorizadas
                            </h3>
                            {missingVulnerabilitiesServers.length > 0 ? (
                                <ul className="list-disc list-inside bg-gray-50 p-4 rounded-md h-64 overflow-y-auto">
                                    {missingVulnerabilitiesServers.map((vuln, index) => (
                                        <li key={index} className="text-gray-700">{vuln}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-600">Todas as vulnerabilidades de Servidores foram categorizadas.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default GerarRelatorioFinal;