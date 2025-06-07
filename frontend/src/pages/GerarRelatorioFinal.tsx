import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { reportsApi } from '../api/backendApi'; // Importar reportsApi

function GerarRelatorioFinal() {
    const { relatorioId } = useParams<{ relatorioId: string }>();
    const [loading, setLoading] = useState(false);
    const [missingVulnerabilities, setMissingVulnerabilities] = useState<{ sites: string[]; servers: string[] } | null>(null);

    useEffect(() => {
        if (relatorioId) {
            fetchMissingVulnerabilities();
        }
    }, [relatorioId]);

    const fetchMissingVulnerabilities = async () => {
        setLoading(true);
        try {
            // Chamadas para obter vulnerabilidades ausentes (sites)
            const missingSites = await reportsApi.getMissingVulnerabilities(relatorioId!, 'sites');
            // Chamadas para obter vulnerabilidades ausentes (servers)
            const missingServers = await reportsApi.getMissingVulnerabilities(relatorioId!, 'servers');
            
            setMissingVulnerabilities({ sites: missingSites, servers: missingServers });

            if (missingSites.length > 0 || missingServers.length > 0) {
                toast.warn('Foram encontradas vulnerabilidades não descritas. Verifique a seção de vulnerabilidades ausentes.');
            } else {
                toast.success('Relatório gerado e todas as vulnerabilidades foram categorizadas.');
            }
        } catch (error) {
            console.error('Erro ao buscar vulnerabilidades ausentes:', error);
            toast.error('Erro ao buscar vulnerabilidades ausentes.');
        } finally {
            setLoading(false);
        }
    };

    // NOVO: Função para lidar com o download do PDF
    const handleDownloadPdf = async () => {
        if (!relatorioId) {
            toast.error('ID do relatório não disponível para download.');
            return;
        }
        setLoading(true);
        try {
            const pdfBlob = await reportsApi.downloadReportPdf(relatorioId); // Chama a API para baixar o PDF
            const url = window.URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Relatorio_Auditoria_${relatorioId}.pdf`; // Nome do arquivo
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Download do relatório PDF iniciado!');
        } catch (error) {
            console.error('Erro ao baixar PDF:', error);
            toast.error('Erro ao baixar o relatório PDF.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Status do Relatório</h1>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <ClipLoader size={50} color={"#1a73e8"} />
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg p-6 mb-8 max-w-2xl mx-auto">
                    <p className="text-lg text-gray-700 text-center mb-4">
                        Processo de geração do relatório concluído para o ID: <span className="font-semibold">{relatorioId}</span>
                    </p>

                    {/* Botão de Download do PDF */}
                    <div className="text-center mb-6">
                        <button
                            onClick={handleDownloadPdf}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition"
                            disabled={loading}
                        >
                            Baixar Relatório PDF
                        </button>
                    </div>

                    {missingVulnerabilities && (
                        <>
                            {missingVulnerabilities.sites.length > 0 && (
                                <div className="mb-4">
                                    <h2 className="text-xl font-semibold text-red-600 mb-2">Vulnerabilidades WebApp Ausentes:</h2>
                                    <ul className="list-disc list-inside text-gray-700">
                                        {missingVulnerabilities.sites.map((vuln, index) => (
                                            <li key={`site-missing-${index}`}>{vuln}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {missingVulnerabilities.servers.length > 0 && (
                                <div className="mb-4">
                                    <h2 className="text-xl font-semibold text-red-600 mb-2">Vulnerabilidades Servidor Ausentes:</h2>
                                    <ul className="list-disc list-inside text-gray-700">
                                        {missingVulnerabilities.servers.map((vuln, index) => (
                                            <li key={`server-missing-${index}`}>{vuln}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {missingVulnerabilities.sites.length === 0 && missingVulnerabilities.servers.length === 0 && (
                                <p className="text-green-600 text-center text-lg">
                                    Todas as vulnerabilidades foram categorizadas e descritas!
                                </p>
                            )}
                        </>
                    )}
                </div>
            )}
            <ToastContainer />
        </div>
    );
}

export default GerarRelatorioFinal;