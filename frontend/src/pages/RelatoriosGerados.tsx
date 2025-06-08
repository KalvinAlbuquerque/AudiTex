import  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { reportsApi, ReportGenerated } from '../api/backendApi'; // Importa a interface ReportGenerated
import ConfirmDeleteModal from './ConfirmDeleteModal'; // Certifique-se do caminho correto
import MissingVulnerabilitiesModal from './MissingVulnerabilitiesModal'; // Certifique-se do caminho correto

function RelatoriosGerados() {
    const [relatorios, setRelatorios] = useState<ReportGenerated[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<string | null>(null);

    // Estados para o modal de vulnerabilidades ausentes
    const [showMissingVulnerabilitiesModal, setShowMissingVulnerabilitiesModal] = useState(false);
    const [currentReportIdForModal, setCurrentReportIdForModal] = useState<string>('');
    const [currentTypeForModal, setCurrentTypeForModal] = useState<'webapp' | 'servers'>('webapp');
    const [modalTitle, setModalTitle] = useState('');


    useEffect(() => {
        fetchRelatorios();
    }, []);

    const fetchRelatorios = async () => {
        setLoading(true);
        try {
            const data = await reportsApi.getGeneratedReports();
            setRelatorios(data);
        } catch (error) {
            console.error('Erro ao buscar relatórios gerados:', error);
            toast.error('Erro ao buscar relatórios gerados.');
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id: string) => {
        setReportToDelete(id);
        setShowDeleteModal(true);
    };

    const handleDeleteReport = async () => {
        if (!reportToDelete) return;

        setLoading(true);
        try {
            await reportsApi.deleteReport(reportToDelete);
            toast.success('Relatório excluído com sucesso!');
            fetchRelatorios(); // Atualiza a lista
        } catch (error) {
            console.error('Erro ao excluir relatório:', error);
            toast.error('Erro ao excluir relatório.');
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
            setReportToDelete(null);
        }
    };

    const handleDownloadPdf = async (reportId: string) => {
        setLoading(true);
        try {
            await reportsApi.downloadReportPdf(reportId);
            toast.success('Download do PDF iniciado!');
        } catch (error) {
            console.error('Erro ao baixar o PDF:', error);
            toast.error('Erro ao baixar o PDF.');
        } finally {
            setLoading(false);
        }
    };

    // Função para abrir o modal de vulnerabilidades ausentes
    const handleOpenMissingVulnerabilitiesModal = (reportId: string, type: 'webapp' | 'servers') => {
        setCurrentReportIdForModal(reportId);
        setCurrentTypeForModal(type);
        setModalTitle(`Vulnerabilidades Não Encontradas - ${type === 'webapp' ? 'Web Application' : 'Servers'}`);
        setShowMissingVulnerabilitiesModal(true);
    };

    const handleCloseMissingVulnerabilitiesModal = () => {
        setShowMissingVulnerabilitiesModal(false);
        setCurrentReportIdForModal(''); // Limpa o ID ao fechar
    };


    return (
        <div
            className="min-h-screen bg-cover bg-center flex flex-col items-center p-8"
            style={{ backgroundImage: "url('/assets/fundo.png')" }}
        >
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Relatórios Gerados</h1>

                <div className="mb-6 flex justify-end">
                    <Link
                        to="/gerar-relatorio"
                        className="bg-[#007BB4] text-white px-5 py-2 rounded-lg shadow-md hover:bg-[#009BE2] transition duration-300 ease-in-out flex items-center"
                    >
                        Gerar Novo Relatório
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <ClipLoader size={50} color={"#123abc"} />
                    </div>
                ) : relatorios.length === 0 ? (
                    <p className="text-gray-700 text-center">Nenhum relatório gerado ainda.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="py-3 px-4 border-b text-left text-gray-700">Nome da Lista</th>
                                    <th className="py-3 px-4 border-b text-left text-gray-700">Secretaria</th>
                                    <th className="py-3 px-4 border-b text-left text-gray-700">Data Geração</th>
                                    <th className="py-3 px-4 border-b text-left text-gray-700">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {relatorios.map((relatorio) => (
                                    <tr key={relatorio.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 border-b text-gray-800">{relatorio.nome}</td>
                                        <td className="py-3 px-4 border-b text-gray-800">{relatorio.sigla}</td>
                                        <td className="py-3 px-4 border-b text-gray-800">{new Date(relatorio.dataGeracao).toLocaleString()}</td>
                                        <td className="py-3 px-4 border-b">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleDownloadPdf(relatorio.id)}
                                                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition duration-200"
                                                    title="Baixar PDF"
                                                >
                                                    PDF
                                                </button>
                                                <button
                                                    onClick={() => handleOpenMissingVulnerabilitiesModal(relatorio.id, 'webapp')}
                                                    className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition duration-200"
                                                    title="Ver Vulnerabilidades WebApp Ausentes"
                                                >
                                                    WAS V.
                                                </button>
                                                <button
                                                    onClick={() => handleOpenMissingVulnerabilitiesModal(relatorio.id, 'servers')}
                                                    className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition duration-200"
                                                    title="Ver Vulnerabilidades Servers Ausentes"
                                                >
                                                    VM V.
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(relatorio.id)}
                                                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition duration-200"
                                                    title="Excluir Relatório"
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmDeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteReport}
                message="Tem certeza que deseja excluir este relatório? Esta ação é irreversível."
            />

            {/* Correção do Erro 3: Passando as novas props 'reportId' e 'type', e removendo 'vulnerabilities' */}
            <MissingVulnerabilitiesModal
                isOpen={showMissingVulnerabilitiesModal}
                onClose={handleCloseMissingVulnerabilitiesModal}
                title={modalTitle}
                reportId={currentReportIdForModal}
                type={currentTypeForModal}
            />

            <ToastContainer />
        </div>
    );
}

export default RelatoriosGerados;