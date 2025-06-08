import React, { useState, useEffect } from 'react'; // Adicionado useEffect
import { ClipLoader } from 'react-spinners'; // Para mostrar loading no modal
import { toast } from 'react-toastify'; // Para toasts dentro do modal
import { reportsApi } from '../api/backendApi'; // Para chamar a API de relatórios

// Correção: Adicionado 'reportId' e 'type' à interface
interface MissingVulnerabilitiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    reportId: string; // NOVO: ID do relatório para buscar as vulnerabilidades
    type: 'webapp' | 'servers'; // NOVO: Tipo de vulnerabilidade a ser buscada
    // vulnerabilities: string[]; // Não precisamos mais passar como prop, o modal buscará
}

const MissingVulnerabilitiesModal: React.FC<MissingVulnerabilitiesModalProps> = ({ isOpen, onClose, title, reportId, type }) => {
    const [loading, setLoading] = useState(false);
    const [vulnerabilities, setVulnerabilities] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen && reportId && type) {
            fetchMissingVulnerabilities();
        }
    }, [isOpen, reportId, type]); // Dependências do useEffect

    const fetchMissingVulnerabilities = async () => {
        setLoading(true);
        try {
            const result = await reportsApi.getMissingVulnerabilities(reportId, type);
            setVulnerabilities(result.content);
        } catch (error) {
            console.error(`Erro ao buscar vulnerabilidades ausentes para ${type}:`, error);
            toast.error(`Erro ao buscar vulnerabilidades ausentes para ${type}.`);
            setVulnerabilities([]); // Limpa em caso de erro
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <ClipLoader size={40} color={"#123abc"} />
                    </div>
                ) : vulnerabilities.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-700 max-h-60 overflow-y-auto">
                        {vulnerabilities.map((vuln, index) => (
                            <li key={index} className="mb-1">{vuln}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-700">Nenhuma vulnerabilidade não encontrada.</p>
                )}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300 ease-in-out"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MissingVulnerabilitiesModal;