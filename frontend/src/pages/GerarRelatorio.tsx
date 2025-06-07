import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios'; // Não precisamos mais de axios diretamente
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importa as funções de API e interfaces do novo módulo
import { listsApi, reportsApi } from '../api/backendApi';

function GerarRelatorio() {
    const { idLista } = useParams<{ idLista: string }>();
    const navigate = useNavigate();

    const [nomeSecretaria, setNomeSecretaria] = useState('');
    const [siglaSecretaria, setSiglaSecretaria] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [ano, setAno] = useState('');
    const [mes, setMes] = useState('');
    const [linkGoogleDrive, setLinkGoogleDrive] = useState('');
    const [loading, setLoading] = useState(false);
    const [nomeListaAssociada, setNomeListaAssociada] = useState('');

    useEffect(() => {
        if (idLista) {
            fetchNomeListaAssociada(idLista);
        }
    }, [idLista]);

    const fetchNomeListaAssociada = async (id: string) => {
        try {
            const listas = await listsApi.getAllLists(); // Usa listsApi
            const lista = listas.find(l => l.idLista === id);
            if (lista) {
                setNomeListaAssociada(lista.nomeLista);
            } else {
                toast.error('Lista associada não encontrada.');
                navigate('/lista-de-scans');
            }
        } catch (error) {
            console.error('Erro ao buscar nome da lista associada:', error);
            toast.error('Erro ao buscar nome da lista associada.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!nomeSecretaria || !siglaSecretaria || !dataInicio || !dataFim || !ano || !mes) {
            toast.warn('Por favor, preencha todos os campos obrigatórios.');
            setLoading(false);
            return;
        }

        try {
            const reportData = {
                idLista: idLista,
                nomeSecretaria: nomeSecretaria,
                siglaSecretaria: siglaSecretaria,
                dataInicio: dataInicio,
                dataFim: dataFim,
                ano: ano,
                mes: mes,
                linkGoogleDrive: linkGoogleDrive,
            };

            const relatorioId = await reportsApi.generateReportForList(reportData); // Usa reportsApi
            toast.success('Relatório gerado com sucesso!');
            navigate(`/gerar-relatorio-final/${relatorioId}`); // Redireciona para a página final do relatório
        } catch (error: any) {
            console.error('Erro ao gerar relatório:', error);
            toast.error(error.response?.data?.error || 'Erro ao gerar relatório. Verifique os logs.');
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
                        Gerar Relatório para Lista: {nomeListaAssociada}
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="nomeSecretaria" className="block text-gray-700 text-sm font-bold mb-2">
                                Nome da Secretaria:
                            </label>
                            <input
                                type="text"
                                id="nomeSecretaria"
                                name="nomeSecretaria"
                                value={nomeSecretaria}
                                onChange={(e) => setNomeSecretaria(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="siglaSecretaria" className="block text-gray-700 text-sm font-bold mb-2">
                                Sigla da Secretaria:
                            </label>
                            <input
                                type="text"
                                id="siglaSecretaria"
                                name="siglaSecretaria"
                                value={siglaSecretaria}
                                onChange={(e) => setSiglaSecretaria(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="dataInicio" className="block text-gray-700 text-sm font-bold mb-2">
                                Data de Início da Auditoria:
                            </label>
                            <input
                                type="date"
                                id="dataInicio"
                                name="dataInicio"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="dataFim" className="block text-gray-700 text-sm font-bold mb-2">
                                Data de Fim da Auditoria:
                            </label>
                            <input
                                type="date"
                                id="dataFim"
                                name="dataFim"
                                value={dataFim}
                                onChange={(e) => setDataFim(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="mes" className="block text-gray-700 text-sm font-bold mb-2">
                                Mês da Conclusão (por extenso):
                            </label>
                            <input
                                type="text"
                                id="mes"
                                name="mes"
                                value={mes}
                                onChange={(e) => setMes(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Ex: Junho"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="ano" className="block text-gray-700 text-sm font-bold mb-2">
                                Ano da Conclusão:
                            </label>
                            <input
                                type="number"
                                id="ano"
                                name="ano"
                                value={ano}
                                onChange={(e) => setAno(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Ex: 2024"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="linkGoogleDrive" className="block text-gray-700 text-sm font-bold mb-2">
                                Link do Google Drive (opcional):
                            </label>
                            <input
                                type="url"
                                id="linkGoogleDrive"
                                name="linkGoogleDrive"
                                value={linkGoogleDrive}
                                onChange={(e) => setLinkGoogleDrive(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="https://drive.google.com/..."
                                disabled={loading}
                            />
                        </div>
                        <div className="md:col-span-2 text-center">
                            <button
                                type="submit"
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                disabled={loading}
                            >
                                {loading ? <ClipLoader size={20} color={"#fff"} /> : 'Gerar Relatório'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default GerarRelatorio;