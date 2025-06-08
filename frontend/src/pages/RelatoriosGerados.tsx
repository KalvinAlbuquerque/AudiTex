// frontend/src/pages/RelatoriosGerados.tsx
import  { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ConfirmDeleteModal from '../pages/ConfirmDeleteModal';
import MissingVulnerabilitiesModal from '../pages/MissingVulnerabilitiesModal'; // Certifique-se de que está importado
import { reportsApi, ReportGenerated } from '../api/backendApi'; // Importe ReportGenerated

function RelatoriosGerados() {
    const [reports, setReports] = useState<ReportGenerated[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reportToDeleteId, setReportToDeleteId] = useState<string | null>(null);
    const [reportToDeleteName, setReportToDeleteName] = useState<string | null>(null);

    const [showMissingVulnerabilitiesModal, setShowMissingVulnerabilitiesModal] = useState(false);
    const [selectedReportIdForModal, setSelectedReportIdForModal] = useState<string | null>(null);
    const [missingVulnerabilitiesType, setMissingVulnerabilitiesType] = useState<'webapp' | 'servers' | null>(null);


    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await reportsApi.getGeneratedReports();
            setReports(data);
        } catch (error) {
            console.error('Erro ao buscar relatórios:', error);
            toast.error('Erro ao buscar relatórios gerados.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async (reportId: string) => {
        setLoading(true);
        try {
            await reportsApi.downloadReportPdf(reportId);
            toast.success('Download iniciado!');
        } catch (error: any) {
            console.error('Erro ao baixar relatório:', error);
            toast.error(error.response?.data?.error || 'Erro ao baixar relatório.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (reportId: string, reportName: string) => {
        setReportToDeleteId(reportId);
        setReportToDeleteName(reportName);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!reportToDeleteId) return;

        setLoading(true);
        try {
            const response = await reportsApi.deleteReport(reportToDeleteId);
            toast.success(response.message || 'Relatório excluído com sucesso!');
            fetchReports(); // Recarregar a lista
        } catch (error: any) {
            console.error('Erro ao excluir relatório:', error);
            toast.error(error.response?.data?.error || 'Erro ao excluir relatório.');
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
            setReportToDeleteId(null);
            setReportToDeleteName(null);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setReportToDeleteId(null);
        setReportToDeleteName(null);
    };

    const handleShowMissingVulnerabilities = (reportId: string, type: 'webapp' | 'servers') => {
        setSelectedReportIdForModal(reportId);
        setMissingVulnerabilitiesType(type);
        setShowMissingVulnerabilitiesModal(true);
    };

    return (
        <div className="min-h-screen bg-white p-8 flex flex-col rounded-lg">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Relatórios Gerados</h1>

            <div className="flex justify-end mb-4">
                <button
                    onClick={() => handleDeleteClick(reports.map(r => r.id).join(','), "todos")} // Apenas como exemplo, se fosse para apagar todos
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 cursor-pointer"
                    disabled={reports.length === 0 || loading}
                >
                    Excluir Todos os Relatórios
                </button>
            </div>

            {loading && reports.length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full">
                    <ClipLoader size={50} color={"#1a73e8"} />
                </div>
            ) : reports.length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full">
                    <p className="text-gray-500 text-center">Nenhum relatório gerado encontrado.</p>
                </div>
            ) : (
                <div className="bg-gray-100 flex-1 rounded-lg p-4 overflow-y-auto">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                        <thead>
                            <tr className="bg-[#007BB4] text-white">
                                <th className="py-2 px-4 text-left">Nome da Secretaria</th>
                                <th className="py-2 px-4 text-left">Sigla</th>
                                <th className="py-2 px-4 text-left">Data de Geração</th>
                                <th className="py-2 px-4 text-left">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr key={report.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-2 px-4 text-gray-800">{report.nome}</td>
                                    <td className="py-2 px-4 text-gray-800">{report.sigla || 'N/A'}</td>
                                    <td className="py-2 px-4 text-gray-800">
                                        {report.dataGeracao ? new Date(report.dataGeracao).toLocaleString('pt-BR') : 'N/A'}
                                    </td>
                                    <td className="py-2 px-4 text-gray-800">
                                        <button
                                            onClick={() => handleDownloadReport(report.id)}
                                            className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 mr-2"
                                        >
                                            Download PDF
                                        </button>
                                        <button
                                            onClick={() => handleShowMissingVulnerabilities(report.id, 'webapp')} 
                                            className="bg-purple-500 text-white px-3 py-1 rounded-lg hover:bg-purple-600 mr-2"
                                        >
                                            Ver Vulns WebApp Ausentes
                                        </button>
                                        <button
                                            onClick={() => handleShowMissingVulnerabilities(report.id, 'servers')}
                                            className="bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600"
                                        >
                                            Ver Vulns Servidores Ausentes
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(report.id, report.nome)}
                                            className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 ml-2"
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showDeleteModal && reportToDeleteId && (
                <ConfirmDeleteModal
                    isOpen={showDeleteModal}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    message={`Tem certeza que deseja excluir o relatório "${reportToDeleteName}"? Esta ação é irreversível.`}
                />
            )}

            {showMissingVulnerabilitiesModal && selectedReportIdForModal && missingVulnerabilitiesType && (
                <MissingVulnerabilitiesModal
                    isOpen={showMissingVulnerabilitiesModal}
                    onClose={() => setShowMissingVulnerabilitiesModal(false)}
                    reportId={selectedReportIdForModal}
                    type={missingVulnerabilitiesType}
                />
            )}
            <ToastContainer />
        </div>
    );
}

export default RelatoriosGerados;