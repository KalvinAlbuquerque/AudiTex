// frontend/src/pages/MissingVulnerabilitiesModal.tsx
import  { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify'; // ADICIONAR ToastContainer AQUI
import 'react-toastify/dist/ReactToastify.css';

import { reportsApi } from '../api/backendApi';

interface MissingVulnerabilitiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportId: string;
    type: 'webapp' | 'servers';
}

function MissingVulnerabilitiesModal({ isOpen, onClose, reportId, type }: MissingVulnerabilitiesModalProps) {
    const [loading, setLoading] = useState(false);
    const [vulnerabilities, setVulnerabilities] = useState<string[]>([]);
    const [title, setTitle] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchMissingVulnerabilities();
            setTitle(type === 'webapp' ? 'Vulnerabilidades WebApp Ausentes' : 'Vulnerabilidades de Servidores Ausentes');
        }
    }, [isOpen, reportId, type]);

    const fetchMissingVulnerabilities = async () => {
        setLoading(true);
        try {
            const data = await reportsApi.getMissingVulnerabilities(reportId, type);
            setVulnerabilities(data.content);
        } catch (error: any) {
            console.error('Erro ao buscar vulnerabilidades ausentes:', error);
            toast.error(error.response?.data?.error || 'Erro ao buscar vulnerabilidades ausentes.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-3/4 max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{title}</h2>
                <div className="mb-4 text-gray-600 text-sm">
                    <p>Esta lista mostra vulnerabilidades esperadas que não foram encontradas no relatório.</p>
                </div>

                <div className="bg-gray-100 rounded-lg p-4 h-64 overflow-y-auto mb-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <ClipLoader size={50} color={"#1a73e8"} />
                        </div>
                    ) : vulnerabilities.length === 0 ? (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-gray-500">Nenhuma vulnerabilidade ausente encontrada para este tipo.</p>
                        </div>
                    ) : (
                        <ul className="list-disc pl-5 space-y-1 text-gray-800">
                            {vulnerabilities.map((vuln, index) => (
                                <li key={index}>{vuln}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-300 text-black px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                    >
                        Fechar
                    </button>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}

export default MissingVulnerabilitiesModal;