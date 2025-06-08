// frontend/src/pages/VerLogs.tsx
import  { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { logsApi, LogData } from '../api/backendApi';

function VerLogs() {
    const [logs, setLogs] = useState<LogData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await logsApi.getAllLogs();
            setLogs(data);
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
            toast.error('Erro ao buscar logs.');
        } finally {
            setLoading(false);
        }
    };

    // Função para formatar a data (opcional, pode ser feito no backend também)
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    return (
        // Container principal da página, com fundo branco e arredondamento
        <div className="min-h-screen bg-white p-8 flex flex-col rounded-lg">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Logs</h1>

            <div className="flex-1 bg-gray-100 rounded-lg p-4 overflow-y-auto">
                {loading && logs.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <ClipLoader size={50} color={"#1a73e8"} />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Nenhum log encontrado.</p>
                    </div>
                ) : (
                    <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                        <thead className="bg-[#007BB4] text-white">
                            <tr>
                                <th className="py-2 px-4 text-left">Ação</th>
                                <th className="py-2 px-4 text-left">Usuário</th>
                                <th className="py-2 px-4 text-left">Detalhes</th>
                                <th className="py-2 px-4 text-left">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-2 px-4 text-gray-800">{log.action}</td>
                                    <td className="py-2 px-4 text-gray-800">{log.user_login}</td>
                                    <td className="py-2 px-4 text-gray-800 break-words max-w-xs text-sm">
                                        <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                                    </td>
                                    <td className="py-2 px-4 text-gray-800 text-sm">{formatTimestamp(log.timestamp)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <ToastContainer />
        </div>
    );
}

export default VerLogs;