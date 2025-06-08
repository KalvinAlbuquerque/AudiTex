import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { listsApi, reportsApi } from '../api/backendApi';

function GerarRelatorio() {
    const { idLista } = useParams<{ idLista: string }>(); // idLista pode ser string | undefined
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
            const listas = await listsApi.getAllLists();
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

        if (!nomeSecretaria.trim() || !siglaSecretaria.trim() || !dataInicio.trim() || !dataFim.trim() || !ano.trim() || !mes.trim() || !linkGoogleDrive.trim()) {
            toast.warn('Por favor, preencha todos os campos obrigatórios.');
            setLoading(false);
            return;
        }

        // Antes de criar reportData, certifique-se de que idLista não é undefined.
        // Já que você está na rota /gerar-relatorio/:idLista, idLista sempre deve ser uma string.
        // Podemos usar a asserção não-nulo aqui.
        if (idLista === undefined) {
             toast.error('ID da lista não disponível.');
             setLoading(false);
             return;
        }

        try {
            const reportData = {
                idLista: idLista, // Usar idLista diretamente, após a verificação
                nomeSecretaria: nomeSecretaria,
                siglaSecretaria: siglaSecretaria,
                dataInicio: dataInicio,
                dataFim: dataFim,
                ano: ano,
                mes: mes,
                linkGoogleDrive: linkGoogleDrive,
            };

            const relatorioId = await reportsApi.generateReport(reportData);
            toast.success('Relatório gerado com sucesso!');
            navigate(`/gerar-relatorio-final/${relatorioId}`);
        } catch (error: any) {
            console.error('Erro ao gerar relatório:', error);
            toast.error(error.response?.data?.error || 'Erro ao gerar relatório. Verifique os logs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-cover bg-center flex"
            style={{ backgroundImage: "url('/assets/fundo.png')" }}
        >
            {/* Sidebar AZUL à esquerda (1/5 da largura da tela) */}
            <div className="w-1/5 bg-white-800 text-white flex items-center justify-center p-4">
                <Link to="/">
                    <img
                        src="/assets/logocogel.jpg"
                        alt="COGEL Logo"
                        className="w-32 h-auto"
                    />
                </Link>
            </div>

            {/* Conteúdo central (área BRANCA à direita, 4/5 da largura da tela) */}
            <div className="w-4/5 p-10 bg-white rounded-l-lg shadow-md">
                <h1 className="text-2xl font-bold text-black mb-8">
                    Gerar Relatório para Lista: {nomeListaAssociada}
                </h1>

                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-black mb-1">Nome da Secretaria</label>
                        <input
                            type="text"
                            name="nomeSecretaria"
                            value={nomeSecretaria}
                            onChange={(e) => setNomeSecretaria(e.target.value)}
                            className="w-full p-2 border rounded text-black"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-black mb-1">Sigla</label>
                        <input
                            type="text"
                            name="siglaSecretaria"
                            value={siglaSecretaria}
                            onChange={(e) => setSiglaSecretaria(e.target.value)}
                            className="w-full p-2 border rounded text-black"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-black mb-1">Data de Início</label>
                        <input
                            type="text"
                            name="dataInicio"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            placeholder="Exemplo: 01 de Janeiro de 2023"
                            className="w-full p-2 border rounded text-black"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-black mb-1">Mês de Conclusão</label>
                        <input
                            type="text"
                            name="mes"
                            value={mes}
                            onChange={(e) => setMes(e.target.value)}
                            placeholder="Exemplo: Junho"
                            className="w-full p-2 border rounded text-black"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-black mb-1">Data Final</label>
                        <input
                            type="text"
                            name="dataFim"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            placeholder="Exemplo: 30 de Junho de 2023"
                            className="w-full p-2 border rounded text-black"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-black mb-1">Ano de Conclusão</label>
                        <input
                            type="text"
                            name="ano"
                            value={ano}
                            onChange={(e) => setAno(e.target.value)}
                            placeholder="Exemplo: 2023"
                            className="w-full p-2 border rounded text-black"
                            required
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-black mb-1">Link da pasta do Google Drive</label>
                        <input
                            type="text"
                            name="linkGoogleDrive"
                            value={linkGoogleDrive}
                            onChange={(e) => setLinkGoogleDrive(e.target.value)}
                            className="w-full p-2 border rounded text-black"
                            placeholder="https://drive.google.com/..."
                            required
                        />
                    </div>

                    <div className="col-span-2 flex justify-end mt-4">
                        <button
                            type="submit"
                            className="bg-[#007BB4] text-white px-6 py-2 rounded hover:bg-[#009BE2] cursor-pointer"
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color={"#fff"} /> : 'Concluir'}
                        </button>
                    </div>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
}

export default GerarRelatorio;