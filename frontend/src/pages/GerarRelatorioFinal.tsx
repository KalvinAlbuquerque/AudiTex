import  { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { reportsApi } from '../api/backendApi';
import MissingVulnerabilitiesModal from './MissingVulnerabilitiesModal';

function GerarRelatorioFinal() {
    const { idRelatorio } = useParams<{ idRelatorio: string }>();
    const [loading, setLoading] = useState(true);
    const [reportDetails, setReportDetails] = useState<any>(null);
    const [reportGenerated, setReportGenerated] = useState(false);

    // Estados para o modal de vulnerabilidades ausentes
    const [showMissingVulnerabilitiesModal, setShowMissingVulnerabilitiesModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [currentTypeForModal, setCurrentTypeForModal] = useState<'webapp' | 'servers'>('webapp'); // Novo estado


    useEffect(() => {
        if (idRelatorio) {
            fetchReportDetails();
        }
    }, [idRelatorio]);

    const fetchReportDetails = async () => {
        setLoading(true);
        try {
            const allReports = await reportsApi.getGeneratedReports();
            const report = allReports.find(r => r.id === idRelatorio);

            if (report) {
                setReportDetails(report);
                setReportGenerated(true);
            } else {
                toast.error('Relatório não encontrado.');
                setReportGenerated(false);
            }
        } catch (error) {
            console.error('Erro ao buscar detalhes do relatório:', error);
            toast.error('Erro ao buscar detalhes do relatório.');
            setReportGenerated(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!idRelatorio) {
            toast.warn('ID do relatório não disponível para download.');
            return;
        }
        setLoading(true);
        try {
            await reportsApi.downloadReportPdf(idRelatorio);
            toast.success('Download do PDF iniciado!');
        } catch (error) {
            console.error('Erro ao baixar o PDF:', error);
            toast.error('Erro ao baixar o PDF.');
        } finally {
            setLoading(false);
        }
    };

    // Ajuste aqui: esta função agora apenas configura os estados para abrir o modal
    const handleViewMissingVulnerabilities = async (type: 'webapp' | 'servers') => {
        if (!idRelatorio) {
            toast.warn('ID do relatório não disponível.');
            return;
        }
        // Não busca mais as vulnerabilidades aqui, o modal fará isso
        setCurrentTypeForModal(type);
        setModalTitle(`Vulnerabilidades Não Encontradas - ${type === 'webapp' ? 'Web Application' : 'Servers'}`);
        setShowMissingVulnerabilitiesModal(true);
    };

    const handleCloseModal = () => {
        setShowMissingVulnerabilitiesModal(false);
        // Não limpa mais as vulnerabilidades aqui, o modal gerencia seu próprio estado
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <ClipLoader size={50} color={"#123abc"} loading={loading} />
            </div>
        );
    }

    if (!reportGenerated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
                <p className="text-xl">Relatório não encontrado ou erro ao carregar.</p>
                <Link to="/relatorios-gerados" className="mt-4 text-[#007BB4] hover:underline">
                    Voltar para Relatórios Gerados
                </Link>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-8"
            style={{ backgroundImage: "url('/assets/fundo.png')" }}
        >
            <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-2xl w-full">
                <h1 className="text-3xl font-bold text-green-600 mb-4">Relatório Gerado com Sucesso!</h1>
                <p className="text-lg text-gray-700 mb-6">
                    O relatório para a lista "<strong>{reportDetails?.nome}</strong>" da secretaria "<strong>{reportDetails?.sigla}</strong>" foi gerado em "<strong>{new Date(reportDetails?.dataGeracao).toLocaleString()}</strong>".
                </p>

                <div className="flex flex-col space-y-4">
                    <button
                        onClick={handleDownloadPdf}
                        className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-600 transition duration-300 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? <ClipLoader size={20} color={"#fff"} /> : 'Baixar Relatório PDF'}
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </button>

                    <button
                        onClick={() => handleViewMissingVulnerabilities('webapp')}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition duration-300 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        Ver Vulnerabilidades WebApp Não Encontradas
                    </button>

                    <button
                        onClick={() => handleViewMissingVulnerabilities('servers')}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition duration-300 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        Ver Vulnerabilidades Servers Não Encontradas
                    </button>

                    <Link
                        to="/relatorios-gerados"
                        className="bg-gray-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-gray-600 transition duration-300 ease-in-out flex items-center justify-center"
                    >
                        Voltar para Relatórios Gerados
                    </Link>
                </div>
            </div>

            {/* Correção: Removida a prop 'vulnerabilities' e adicionadas 'reportId' e 'type' */}
            <MissingVulnerabilitiesModal
                isOpen={showMissingVulnerabilitiesModal}
                onClose={handleCloseModal}
                title={modalTitle}
                reportId={idRelatorio!} // Passa o idRelatorio para o modal
                type={currentTypeForModal} // Passa o tipo atual para o modal
            />

            <ToastContainer />
        </div>
    );
}

export default GerarRelatorioFinal;