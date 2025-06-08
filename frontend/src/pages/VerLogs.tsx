// frontend/src/pages/VerLogs.tsx
import React, { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { logsApi, LogData, LogFilters } from '../api/backendApi'; // Importar LogFilters

// Lista de ações possíveis (deve ser a mesma do backend)
const POSSIBLE_LOG_ACTIONS = [
    "USER_CREATED",
    "USER_UPDATED",
    "USER_DELETED",
    "REPORT_GENERATED",
    "REPORT_DELETED",
    "ALL_REPORTS_DELETED",
    "REPORT_DOWNLOADED",
    "TENABLE_SETTINGS_UPDATED",
    "TENABLE_SETTINGS_CREATED",
    "GET_TENABLE_SETTINGS_ERROR",
];

function VerLogs() {
    const [logs, setLogs] = useState<LogData[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<LogFilters>({}); // Estado para os filtros

    // Efeito para buscar logs quando os filtros mudam
    useEffect(() => {
        fetchLogs(filters);
    }, [filters]); // Re-fetch logs sempre que filters mudam

    const fetchLogs = async (currentFilters: LogFilters) => {
        setLoading(true);
        try {
            const data = await logsApi.getAllLogs(currentFilters); // Passa os filtros
            setLogs(data);
        } catch (error: any) {
            console.error('Erro ao buscar logs:', error);
            toast.error(error.response?.data?.error || 'Erro ao buscar logs.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => {
            if (value === "") { // Remove o filtro se o valor estiver vazio
                const newFilters = { ...prev };
                delete newFilters[name as keyof LogFilters];
                return newFilters;
            }
            return { ...prev, [name]: value };
        });
    };

    // Função para formatar a data
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
        <div className="min-h-screen bg-white p-8 flex flex-col rounded-lg">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Logs</h1>

            {/* Seção de Filtros */}
            <div className="bg-gray-100 p-6 rounded-lg shadow-inner mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtrar Logs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Filtro por Usuário */}
                    <div>
                        <label htmlFor="user_login" className="block text-gray-700 text-sm font-bold mb-2">Usuário:</label>
                        <input
                            type="text"
                            id="user_login"
                            name="user_login"
                            value={filters.user_login || ''}
                            onChange={handleFilterChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Nome de usuário"
                        />
                    </div>

                    {/* Filtro por Ação */}
                    <div>
                        <label htmlFor="action" className="block text-gray-700 text-sm font-bold mb-2">Ação:</label>
                        <select
                            id="action"
                            name="action"
                            value={filters.action || ''}
                            onChange={handleFilterChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                            <option value="">Todas as Ações</option>
                            {POSSIBLE_LOG_ACTIONS.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por Data Início */}
                    <div>
                        <label htmlFor="start_date" className="block text-gray-700 text-sm font-bold mb-2">Data Início:</label>
                        <input
                            type="date"
                            id="start_date"
                            name="start_date"
                            value={filters.start_date || ''}
                            onChange={handleFilterChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>

                    {/* Filtro por Data Fim */}
                    <div>
                        <label htmlFor="end_date" className="block text-gray-700 text-sm font-bold mb-2">Data Fim:</label>
                        <input
                            type="date"
                            id="end_date"
                            name="end_date"
                            value={filters.end_date || ''}
                            onChange={handleFilterChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                </div>
            </div>

            {/* Tabela de Logs */}
            <div className="flex-1 bg-gray-100 rounded-lg p-4 overflow-y-auto">
                {loading && logs.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <ClipLoader size={50} color={"#1a73e8"} />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Nenhum log encontrado com os filtros aplicados.</p>
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