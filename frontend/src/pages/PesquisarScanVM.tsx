import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importa Link
import Select from 'react-select'; // Importa Select
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importa as funções de API e interfaces
import { scansApi, listsApi, ScanData } from '../api/backendApi';

// NOVO: Interface para o tipo de opção do react-select (se não estiver já globalmente definido)
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

    // Hook para carregar as listas disponíveis ao montar o componente
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
            const scan = await scansApi.getVMScanByName(scanName.trim());
            setFoundScan(scan);
            if (!scan) {
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

    // CORREÇÃO: Tipagem de selectedOption
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
            // Primeiro, precisamos obter o ID da lista selecionada para usar como nome da pasta
            const listas = await listsApi.getAllLists();
            const listaEncontrada = listas.find(lista => lista.nomeLista === listaSelecionada);

            if (!listaEncontrada) {
                toast.error('Lista selecionada não encontrada.');
                setLoading(false);
                return;
            }

            // `id` é o scan_id numérico, `last_scan.scan_id` (se existir) também é o scan_id numérico
            // `last_scan.uuid` (se existir) é o history_id (UUID)
            const idScan = foundScan.id || foundScan.last_scan?.scan_id; // ID numérico do scan na Tenable
            const historyId = foundScan.last_scan?.uuid; // UUID do histórico do scan (necessário para download)

            if (!idScan || !historyId) {
                toast.error('Dados de ID do scan ou History ID incompletos.');
                setLoading(false);
                return;
            }

            // Chama a API do backend para baixar o CSV
            await scansApi.downloadVMScan(
                listaEncontrada.idLista, // nomeListaId é na verdade o ID da lista para a pasta
                idScan,
                historyId
            );

            // Adiciona ou atualiza as informações do scan VM na lista no banco de dados
            await listsApi.addVMScanToList(
                listaEncontrada.nomeLista,
                historyId, // Passa o UUID como idScan
                foundScan.name,
                foundScan.owner?.name || 'N/A', // Nome do criador
                idScan // Passa o ID numérico como idNmr
            );

            toast.success('Scan VM baixado e associado à lista com sucesso!');
            setFoundScan(null); // Limpa o scan encontrado
            setScanName(''); // Limpa o campo de busca
            navigate(`/editar-lista/${listaEncontrada.idLista}`); // Redireciona para a página de edição da lista
        } catch (error) {
            console.error('Erro ao baixar ou associar scan VM:', error);
            toast.error('Erro ao baixar ou associar scan VM.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // Container principal: tela cheia, fundo com imagem, e display flex para dividir em colunas.
        <div
            className="min-h-screen bg-cover bg-center flex"
            style={{ backgroundImage: "url('/assets/fundo.png')" }}
        >
            {/* Sidebar AZUL à esquerda com a cor #15688f */}
            <div
                className="w-1/5 #15688f text-white flex flex-col items-center justify-center p-4 shadow-lg min-h-screen"
            >
                <Link to="/">
                    <img
                        src="/assets/logocogel.jpg" // Caminho da nova logo da COGEL
                        alt="COGEL Logo"
                        className="w-32 h-auto"
                    />
                </Link>
            </div>

            {/* Conteúdo central (área BRANCA à direita, 4/5 da largura da tela) */}
            <div className="w-4/5 p-8 bg-white rounded-l-lg shadow-md min-h-screen flex flex-col"> {/* flex-col para empilhar elementos */}
                <h1 className="text-2xl font-bold mb-6 text-gray-800">
                    Pesquisar Scans - Vulnerability Management
                </h1>

                <div className="flex flex-col space-y-2 max-w-md mx-auto mt-10 w-full"> {/* Adicionado w-full para centralizar input */}
                    <label className="block font-semibold text-black">Nome do Scan</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded text-black" // Adicionado text-black
                        placeholder="Digite o nome do scan"
                        value={scanName}
                        onChange={(e) => setScanName(e.target.value)}
                    />
                    <div className="flex justify-center">
                        <button
                            onClick={handleSearchScan}
                            className="bg-[#007BB4] text-white px-6 py-2 rounded hover:bg-blue-600 cursor-pointer" // Corrigido para blue-500
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color={"#fff"} /> : "Pesquisar"}
                        </button>
                    </div>
                </div>

                {foundScan && (
                    <div className="mt-6 bg-gray-100 rounded-lg overflow-y-auto p-4 flex-1" style={{minHeight: '200px'}}> {/* flex-1 para ocupar espaço */}
                        <div className="space-y-2 text-gray-800">
                            <p><strong>Nome do Scan:</strong> {foundScan.name}</p>
                            <p><strong>ID:</strong> {foundScan.id || 'N/A'}</p>
                            <p><strong>Último Scan ID:</strong> {foundScan.last_scan?.scan_id || 'N/A'}</p>
                            <p><strong>Último Scan UUID (History ID):</strong> {foundScan.last_scan?.uuid || 'N/A'}</p>
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
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading || !listaSelecionada}
                                >
                                    {loading ? <ClipLoader size={20} color={"#fff"} /> : 'Baixar e Associar Scan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {!loading && !foundScan && (
                    <div className="mt-4 h-[400px] bg-gray-100 rounded-lg overflow-y-auto p-4 flex-1"> {/* Flex-1 e min-height para manter tamanho */}
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