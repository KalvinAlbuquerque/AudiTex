import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { scansApi, listsApi, ScanData } from '../api/backendApi'; // Certifique-se de que ScanData está atualizada

interface SelectOption {
    value: string;
    label: string;
}

function PesquisarScanWAS() {
    const [scanName, setScanName] = useState('');
    const [foundScan, setFoundScan] = useState<ScanData | null>(null);
    const [loading, setLoading] = useState(false);
    const [listaSelecionada, setListaSelecionada] = useState('');
    const [listasDisponiveis, setListasDisponiveis] = useState<SelectOption[]>([]);

    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchListas = async () => {
            try {
                const listas = await listsApi.getAllLists();
                const options: SelectOption[] = listas.map(lista => ({ value: lista.nomeLista, label: lista.nomeLista }));
                setListasDisponiveis(options);
            } catch (error) {
                console.error('Erro ao buscar listas disponíveis:', error);
                toast.error('Erro ao buscar listas disponíveis.');
            }
        };
        fetchListas();
    }, []);

    const handleSearchScan = async () => {
        if (!scanName.trim()) {
            toast.warn('Por favor, digite o nome do scan WebApp.');
            return;
        }
        setLoading(true);
        try {
            // Buscando todos os scans Tenable e filtrando por nome no frontend
            const allTenableScans = await scansApi.getScansFromTenable();
            const found = allTenableScans.find(scan => scan.name.toLowerCase() === scanName.trim().toLowerCase() && scan.type === 'was'); // Assegura que é um scan WAS
            
            // Se encontrou, busca os detalhes completos do scan usando o ID
            let fullScanDetails: ScanData | null = null;
            if (found) {
                fullScanDetails = await listsApi.getScanDetails(found.id); // found.id é o ID numérico do scan
            }

            setFoundScan(fullScanDetails);

            if (!fullScanDetails) {
                toast.info('Nenhum scan WebApp encontrado com este nome no Tenable.');
            }
        } catch (error) {
            console.error('Erro ao buscar scan WebApp:', error);
            toast.error('Erro ao buscar scan WebApp.');
            setFoundScan(null);
        } finally {
            setLoading(false);
        }
    };

    const handleListaChange = (selectedOption: SelectOption | null) => {
        setListaSelecionada(selectedOption ? selectedOption.value : '');
    };

    const handleDownloadScan = async () => {
        if (!foundScan) {
            toast.warn('Nenhum scan selecionado para download.');
            return;
        }
        if (!listaSelecionada) {
            toast.warn('Selecione uma lista para associar o scan WebApp.');
            return;
        }

        setLoading(true);
        try {
            const listas = await listsApi.getAllLists();
            const listaEncontrada = listas.find(lista => lista.nomeLista === listaSelecionada);

            if (!listaEncontrada) {
                toast.error('Lista selecionada não encontrada.');
                setLoading(false);
                return;
            }

            // O ID do scan WebApp é o 'config_id' ou 'id' dependendo de como a API do Tenable o retorna
            // Vamos usar o 'id' aqui, que deve ser o ID numérico do scan.
            const wasScanId = foundScan.id; // ID numérico do scan
            const wasConfigId = foundScan.config_id; // ID da configuração do scan WAS (geralmente é o UUID)
            const wasScanName = foundScan.name;
            const wasScanOwner = foundScan.owner?.name || 'N/A';


            if (!wasScanId || !wasConfigId) {
                toast.error('Dados de ID do scan ou Config ID incompletos. Verifique os detalhes do scan.');
                setLoading(false);
                return;
            }

            // Chama a API do backend para baixar o CSV do scan WAS
            // O backend espera o ID numérico do scan e o config_id (UUID)
            // Assumindo que scansApi.downloadWASScan existe e recebe (listaId, scanIdNumerico, configId)
            // (Se downloadWASScan não existir, ele também precisará ser adicionado em backendApi.tsx e no backend)
            await scansApi.downloadWASScan(
                listaEncontrada.idLista!, // ID da lista
                wasScanId!, // ID numérico do scan WAS
                wasConfigId! // Config ID do scan WAS (UUID)
            );

            // Adiciona ou atualiza as informações do scan WebApp na lista no banco de dados
            // CORREÇÃO: Passando todos os 4 argumentos esperados
            await listsApi.addWebAppScanToList(
                listaEncontrada.nomeLista, // nomeLista
                wasScanId!,                // idScan (usando o id numérico como o id do scan aqui)
                wasScanName,               // nomeScan
                wasScanOwner               // criadoPor
            );

            toast.success('Scan WebApp baixado e associado à lista com sucesso!');
            setFoundScan(null);
            setScanName('');
            navigate(`/editar-lista/${listaEncontrada.idLista}`);
        } catch (error) {
            console.error('Erro ao baixar ou associar scan WebApp:', error);
            toast.error('Erro ao baixar ou associar scan WebApp.');
        } finally {
            setLoading(false);
        }
    };

    // Função auxiliar para formatar timestamp
    const formatTimestamp = (timestamp?: number) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp * 1000); // Tenable retorna Unix timestamp em segundos
        return date.toLocaleString(); // Formata para data e hora local
    };

    return (
        <div
            className="min-h-screen bg-cover bg-center flex"
            style={{ backgroundImage: "url('/assets/fundo.png')" }}
        >
            <div
                className="w-1/5 #15688f text-white flex flex-col items-center justify-center p-4 shadow-lg min-h-screen"
            >
                <Link to="/">
                    <img
                        src="/assets/logocogel.jpg"
                        alt="COGEL Logo"
                        className="w-32 h-auto"
                    />
                </Link>
            </div>

            <div className="w-4/5 p-8 bg-white rounded-l-lg shadow-md min-h-screen flex flex-col">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">
                    Pesquisar Scans - Web Application
                </h1>

                <div className="flex flex-col space-y-2 max-w-md mx-auto mt-10 w-full">
                    <label className="block font-semibold text-black">Nome do Scan</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded text-black"
                        placeholder="Digite o nome do scan"
                        value={scanName}
                        onChange={(e) => setScanName(e.target.value)}
                    />
                    <div className="flex justify-center">
                        <button
                            onClick={handleSearchScan}
                            className="bg-[#007BB4] text-white px-6 py-2 rounded hover:bg-blue-600 cursor-pointer"
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color={"#fff"} /> : "Pesquisar"}
                        </button>
                    </div>
                </div>

                {foundScan && (
                    <div className="mt-6 bg-gray-100 rounded-lg overflow-y-auto p-4 flex-1" style={{minHeight: '200px'}}>
                        <div className="space-y-2 text-gray-800">
                            <p><strong>Nome do Scan:</strong> {foundScan.name}</p>
                            <p><strong>ID (Numérico):</strong> {foundScan.id || 'N/A'}</p>
                            <p><strong>Config ID:</strong> {foundScan.config_id || 'N/A'}</p>
                            <p><strong>Proprietário:</strong> {foundScan.owner?.name || 'N/A'}</p>
                            <p><strong>Criado em:</strong> {formatTimestamp(foundScan.created_at)}</p>
                            <p><strong>Descrição:</strong> {foundScan.description || 'N/A'}</p>
                            <p><strong>Alvo:</strong> {foundScan.target || 'N/A'}</p>
                            <p><strong>Último Scan Status:</strong> {foundScan.last_scan?.status || 'N/A'}</p>


                            <div className="mt-4">
                                <label htmlFor="listaSelecionada" className="block text-gray-700 text-sm font-bold mb-2">
                                    Associar a uma Lista Existente:
                                </label>
                                <Select<SelectOption>
                                    id="listaSelecionada"
                                    options={listasDisponiveis}
                                    onChange={handleListaChange}
                                    value={listasDisponiveis.find(option => option.value === listaSelecionada)}
                                    placeholder="Selecione uma lista"
                                    isClearable
                                    isDisabled={loading}
                                />
                            </div>

                            <div className="text-center mt-6">
                                <button
                                    onClick={handleDownloadScan}
                                    className="bg-[#007BB4] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading || !listaSelecionada}
                                >
                                    {loading ? <ClipLoader size={20} color={"#fff"} /> : 'Baixar e Associar Scan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {!loading && !foundScan && (
                    <div className="mt-4 h-[400px] bg-gray-100 rounded-lg overflow-y-auto p-4 flex-1">
                        <div className="flex items-center justify-center h-full">
                            <p className="text-center text-gray-500">Nenhum scan encontrado.</p>
                        </div>
                    </div>
                )}
            </div>
            <ToastContainer />
        </div>
    );
}

export default PesquisarScanWAS;