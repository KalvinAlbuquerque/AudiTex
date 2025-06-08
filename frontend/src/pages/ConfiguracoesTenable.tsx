// frontend/src/pages/ConfiguracoesTenable.tsx
import React, { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { settingsApi } from '../api/backendApi'; // Importar o settingsApi

function ConfiguracoesTenable() {
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState(''); // Estado para a Secret Key
    const [accessKey, setAccessKey] = useState(''); // Estado para a Access Key
    const [isConfigured, setIsConfigured] = useState(false); // Estado para o status de configuração
    const [lastUpdated, setLastUpdated] = useState<string | null>(null); // Data da última atualização

    // Efeito para carregar o status da configuração Tenable ao montar o componente
    useEffect(() => {
        fetchTenableConfigStatus();
    }, []);

    const fetchTenableConfigStatus = async () => {
        setLoading(true);
        try {
            const status = await settingsApi.getTenableConfigStatus();
            setIsConfigured(status.configured);
            if (status.last_updated) {
                // Formata a data para um formato legível
                setLastUpdated(new Date(status.last_updated).toLocaleString('pt-BR'));
            } else {
                setLastUpdated(null);
            }
        } catch (error) {
            console.error('Erro ao buscar status de configuração Tenable:', error);
            toast.error('Erro ao carregar status da configuração Tenable.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Previne o comportamento padrão de recarregar a página
        setLoading(true);

        if (!apiKey.trim() || !accessKey.trim()) {
            toast.warn('Por favor, preencha ambas as chaves.');
            setLoading(false);
            return;
        }

        try {
            const response = await settingsApi.updateTenableConfig(apiKey, accessKey);
            toast.success(response.message);
            setApiKey(''); // Limpa os campos após salvar com sucesso
            setAccessKey('');
            fetchTenableConfigStatus(); // Atualiza o status da configuração
        } catch (error: any) {
            console.error('Erro ao salvar configurações Tenable:', error);
            toast.error(error.response?.data?.error || 'Erro ao salvar configurações Tenable.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white p-8 flex flex-col rounded-lg"> {/* Contêiner principal com fundo branco e arredondamento */}
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações Tenable</h1>

            <div className="flex-1 bg-gray-100 rounded-lg p-6 shadow-md"> {/* Área de conteúdo dos filtros, com fundo cinza claro, arredondada e sombra */}
                {loading && !isConfigured && !lastUpdated ? ( // Mostrar loader apenas se carregando e não tiver status anterior
                    <div className="flex justify-center items-center h-full">
                        <ClipLoader size={50} color={"#1a73e8"} />
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <p className="text-lg text-gray-700">
                                Status da Configuração Tenable:{" "}
                                <span className={`font-semibold ${isConfigured ? 'text-green-600' : 'text-red-600'}`}>
                                    {isConfigured ? 'Configurado' : 'Não Configurado'}
                                </span>
                            </p>
                            {lastUpdated && (
                                <p className="text-sm text-gray-500 mt-1">Última atualização: {lastUpdated}</p>
                            )}
                            {!isConfigured && ( // Mensagem de aviso se não configurado
                                <p className="text-red-500 mt-2">Por favor, insira as chaves de API Tenable para o sistema funcionar corretamente.</p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4"> {/* Formulário para as chaves */}
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tenableApiKey">
                                    Tenable API Key (Secret Key):
                                </label>
                                <input
                                    type="password" 
                                    id="tenableApiKey"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                    disabled={loading}
                                    placeholder="Insira a Tenable API Secret Key"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tenableAccessKey">
                                    Tenable Access Key:
                                </label>
                                <input
                                    type="password" 
                                    id="tenableAccessKey"
                                    value={accessKey}
                                    onChange={(e) => setAccessKey(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                    disabled={loading}
                                    placeholder="Insira a Tenable Access Key"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-[#007BB4] text-white px-6 py-2 rounded-lg hover:bg-[#009BE2] transition cursor-pointer"
                                disabled={loading}
                            >
                                {loading ? <ClipLoader size={20} color={"#fff"} /> : 'Salvar Configurações'}
                            </button>
                        </form>
                    </>
                )}
            </div>
            <ToastContainer /> {/* Componente para exibir toasts */}
        </div>
    );
}

export default ConfiguracoesTenable;