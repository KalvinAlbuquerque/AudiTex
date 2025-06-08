import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importa as funções de API e interfaces
import { scansApi, listsApi, ScanData } from '../api/backendApi';

// Interface para o tipo de opção do react-select
interface SelectOption {
    value: string;
    label: string;
}

function PesquisarScanVM() {
    const [scanName, setScanName] = useState('');
    const [foundScan, setFoundScan] = useState<ScanData | null>(null);
    const [loading, setLoading] = useState(false);
    const [listaSelecionada, setListaSelecionada] = useState(''); // Para associar a uma lista existente
    const [listasDisponiveis, setListasDisponiveis] = useState<SelectOption[]>([]); // Opções para o Select de listas

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
            toast.warn('Por favor, digite o nome do scan VM.');
            return;
        }
        setLoading(true);
        try {
            // CORREÇÃO AQUI: Chamar getSavedScans e filtrar no frontend
            const savedScans = await scansApi.getSavedScans('vm'); // Pega todos os scans VM salvos
            const found = savedScans.find(scan => scan.name.toLowerCase() === scanName.trim().toLowerCase()); // Encontra pelo nome
            
            setFoundScan(found || null); // Define o scan encontrado ou null
            
            if (!found) {
                toast.info('Nenhum scan VM encontrado com este nome.');
            }
        } catch (error) {
            console.error('Erro ao buscar scan VM:', error);
            toast.error('Erro ao buscar scan VM.');
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
            toast.warn('Selecione uma lista para associar o scan VM.');
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

            const vmScanNumericId: string | undefined = foundScan.id;
            let vmScanUuid: string | undefined = foundScan.uuid;

            if (!vmScanUuid && foundScan.history && foundScan.history.length > 0) {
                const latestHistory = foundScan.history.reduce((prev: any, current: any) => {
                    const prevDate = new Date(prev.last_modification_date || 0).getTime();
                    const currentDate = new Date(current.last_modification_date || 0).getTime();
                    return (prevDate > currentDate) ? prev : current;
                }, foundScan.history[0]);
                vmScanUuid = latestHistory.uuid;
            }
            
            // Log para depuração
            console.log("DEBUG - vmScanNumericId (ID numérico do scan):", vmScanNumericId);
            console.log("DEBUG - vmScanUuid (UUID do scan ou histórico):", vmScanUuid);

            // Verificação final dos IDs antes de usar
            if (!vmScanNumericId || !vmScanUuid) {
                toast.error('Dados de ID do scan ou History ID incompletos. Verifique se o scan possui um UUID principal e um histórico.');
                setLoading(false);
                return;
            }

            // Chama a API do backend para baixar o CSV
            await scansApi.downloadVMScan(
                listaEncontrada.idLista!,
                vmScanNumericId!, // Asserção não-nula
                vmScanUuid! // Asserção não-nula
            );

            // Adiciona ou atualiza as informações do scan VM na lista no banco de dados
            await listsApi.addVMScanToList(
                listaEncontrada.nomeLista,
                vmScanUuid!, // Asserção não-nula
                foundScan.name,
                foundScan.owner?.name || 'N/A',
                vmScanNumericId! // Asserção não-nula
            );

            toast.success('Scan VM baixado e associado à lista com sucesso!');
            setFoundScan(null);
            setScanName('');
            navigate(`/editar-lista/${listaEncontrada.idLista}`);
        } catch (error) {
            console.error('Erro ao baixar ou associar scan VM:', error);
            toast.error('Erro ao baixar ou associar scan VM.');
        } finally {
            setLoading(false);
        }
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
                    Pesquisar Scans - Vulnerability Management
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
                            {/* Adicionado log para UUID principal do scan se existir */}
                            {foundScan.uuid && (
                                <p><strong>UUID (Principal do Scan):</strong> {foundScan.uuid}</p>
                            )}
                            {/* Adicionado log para histórico de VM */}
                            {foundScan.history && foundScan.history.length > 0 && (
                                <p><strong>Último Histórico VM (UUID):</strong> {foundScan.history[foundScan.history.length - 1].uuid || 'N/A'}</p>
                            )}
                            <p><strong>Proprietário:</strong> {foundScan.owner?.name || 'N/A'}</p>

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

export default PesquisarScanVM;