import  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Importa Link
import Select from 'react-select'; // Importa Select
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importa as funções de API e interfaces
import { scansApi, listsApi, ScanData, Folder } from '../api/backendApi';

// NOVO: Interface para o tipo de opção do react-select
interface SelectOption {
    value: string;
    label: string;
}

function PesquisarScanWAS() {
    // Manter a simulação de pastas até que o backend tenha um endpoint para buscar APENAS pastas.
    // O endpoint 'scansfromfolderofuser' busca scans DENTRO de uma pasta.
    const [pastasUsuario, setPastasUsuario] = useState<Folder[]>([]);
    const [usuarioSelecionado, setUsuarioSelecionado] = useState('');
    const [pastaSelecionada, setPastaSelecionada] = useState('');
    const [scans, setScans] = useState<ScanData[]>([]);
    const [scansSelecionados, setScansSelecionados] = useState<string[]>([]); // Armazena apenas os config_id
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // Para o modal de "Adicionar à Lista"
    const [nomeListaParaAdicionar, setNomeListaParaAdicionar] = useState(''); // Nome da lista no modal
    const [listasDisponiveis, setListasDisponiveis] = useState<SelectOption[]>([]);



    // Efeito para carregar as listas disponíveis ao montar
    useEffect(() => {
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
        
        // Simulação de pastas e usuário, pois o endpoint de backend para listar pastas não existe
        const mockFolders: Folder[] = [
            { id: '1', name: 'Pasta_Padrao_Admin' },
            { id: '2', name: 'Minhas_Apps_Web' },
        ];
        setPastasUsuario(mockFolders);
    }, []);

    const fetchScans = async () => {
        if (!usuarioSelecionado || !pastaSelecionada) {
            toast.warn('Por favor, selecione um usuário e uma pasta.');
            return;
        }
        setLoading(true);
        try {
            const fetchedScans = await scansApi.getWebAppScansFromFolder(usuarioSelecionado, pastaSelecionada);
            setScans(fetchedScans);
            setScansSelecionados([]); // Limpa a seleção ao buscar novos scans
            if (fetchedScans.length === 0) {
                toast.info('Nenhum scan encontrado nesta pasta para o usuário selecionado.');
            }
        } catch (error) {
            console.error('Erro ao buscar scans:', error);
            toast.error('Erro ao buscar scans.');
            setScans([]);
        } finally {
            setLoading(false);
        }
    };

    // CORREÇÃO: Tipagem de selectedOption
    const handleUsuarioChange = (selectedOption: SelectOption | null) => {
        setUsuarioSelecionado(selectedOption ? selectedOption.value : '');
        setPastaSelecionada(''); // Limpa a pasta ao mudar o usuário
        setScans([]); // Limpa scans ao mudar o usuário
        setScansSelecionados([]);
    };

    // CORREÇÃO: Tipagem de selectedOption
    const handlePastaChange = (selectedOption: SelectOption | null) => {
        setPastaSelecionada(selectedOption ? selectedOption.value : '');
    };

    const handleToggleScan = (config_id: string | undefined) => {
        if (!config_id) return;
        setScansSelecionados(prev =>
            prev.includes(config_id)
                ? prev.filter(id => id !== config_id)
                : [...prev, config_id]
        );
    };

    const openModal = () => {
        if (scansSelecionados.length === 0) {
            toast.warn('Selecione pelo menos um scan para adicionar à lista.');
            return;
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setNomeListaParaAdicionar('');
    };

    // CORREÇÃO: Tipagem de selectedOption
    const handleNomeListaChange = (selectedOption: SelectOption | null) => {
        setNomeListaParaAdicionar(selectedOption ? selectedOption.value : '');
    };

    const handleAddToList = async () => {
        if (!nomeListaParaAdicionar) {
            toast.warn("Por favor, selecione uma lista.");
            return;
        }

        setLoading(true);
        try {
            const selectedScansData = {
                items: scans.filter(scan => scan.config_id && scansSelecionados.includes(scan.config_id))
            };

            await listsApi.addWebAppScanToList(nomeListaParaAdicionar, selectedScansData);
            toast.success("Scans adicionados à lista com sucesso!");
            closeModal();
            setScansSelecionados([]); // Limpa a seleção
            // Opcional: recarregar os scans da pasta para refletir que foram adicionados (se a API souber disso)
            // fetchScans();
        } catch (error: any) {
            console.error("Erro ao adicionar à lista:", error);
            toast.error(error.response?.data?.error || "Erro desconhecido ao adicionar à lista.");
        } finally {
            setLoading(false);
        }
    };

    const usuariosOptions: SelectOption[] = [
        { value: 'admin@tenable.com', label: 'admin@tenable.com' },
    ];

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
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Pesquisar Scans - Web App</h1>

                <div className="flex flex-col space-y-4 max-w-sm">
                    <div>
                        <label className="block font-semibold mb-1 text-black">Usuário</label>
                        <Select<SelectOption> // Adicionado tipo genérico
                            options={usuariosOptions}
                            onChange={handleUsuarioChange}
                            value={usuariosOptions.find(option => option.value === usuarioSelecionado)}
                            placeholder="Selecione um usuário"
                            isClearable
                            isDisabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block font-semibold mb-1 text-black">Pasta</label>
                        <Select<SelectOption> // Adicionado tipo genérico
                            options={pastasUsuario.map(pasta => ({ value: pasta.name, label: pasta.name }))}
                            onChange={handlePastaChange}
                            value={pastasUsuario.map(pasta => ({ value: pasta.name, label: pasta.name })).find(option => option.value === pastaSelecionada)}
                            placeholder="Selecione uma pasta"
                            isClearable
                            isDisabled={loading || !usuarioSelecionado}
                        />
                    </div>

                    <button
                        onClick={fetchScans}
                        className="bg-[#007BB4] text-white px-4 py-2 rounded hover:bg-blue-600 w-fit cursor-pointer"
                        disabled={loading}
                    >
                        {loading ? <ClipLoader size={20} color={"#fff"} /> : "Pesquisar"}
                    </button>
                </div>

                <div className="flex flex-col items-end mt-6 space-y-2">
                    <button
                        onClick={openModal}
                        className="bg-[#007BB4] text-white px-4 py-2 rounded hover:bg-blue-600 text-sm cursor-pointer"
                        disabled={scans.length === 0 || loading}
                    >
                        + Adicionar Scans Selecionados à Lista ({scansSelecionados.length})
                    </button>
                    <span className="text-sm text-gray-700">
                        Total de scans encontrados: {scans.length}
                    </span>
                </div>

                <div className="flex-1 mt-4 h-80 bg-gray-100 rounded-lg overflow-y-auto "> {/* flex-1 para ocupar espaço */}
                    {loading && scans.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <ClipLoader size={50} color={"#1a73e8"} />
                        </div>
                    ) : scans.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-center text-gray-500">Nenhum scan encontrado.</p>
                        </div>
                    ) : (
                        <ul className="space-y-2 p-2">
                            {scans.map((scan) => (
                                <li key={scan.config_id || scan.name} className="p-3 bg-white rounded shadow-sm flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={scan.config_id ? scansSelecionados.includes(scan.config_id) : false}
                                        onChange={() => handleToggleScan(scan.config_id)}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded"
                                        disabled={loading}
                                    />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{scan.name}</h3>
                                        <p className="text-gray-600">{scan.description}</p>
                                        <p className="text-sm text-gray-500">Target: {scan.target}</p>
                                        <p className="text-sm text-gray-500">Criado em: {new Date(scan.created_at || '').toLocaleString()}</p>
                                        <p className="text-sm text-gray-500">Último Status: {scan.last_scan?.status}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-md w-1/3 max-w-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Adicionar Scans à Lista</h2>
                        <label className="block font-semibold mb-1 text-black">Selecione a Lista</label>
                        <Select<SelectOption> // Adicionado tipo genérico
                            options={listasDisponiveis}
                            onChange={handleNomeListaChange}
                            value={listasDisponiveis.find(option => option.value === nomeListaParaAdicionar)}
                            placeholder="Selecione uma lista"
                            isClearable
                            isDisabled={loading}
                            className="mb-4"
                        />
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={closeModal}
                                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddToList}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer"
                                disabled={loading || !nomeListaParaAdicionar}
                            >
                                {loading ? "Adicionando..." : "Adicionar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer />
        </div>
    );
}

export default PesquisarScanWAS;