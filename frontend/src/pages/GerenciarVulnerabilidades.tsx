// frontend/src/pages/GerenciarVulnerabilidades.tsx
import React, { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ConfirmDeleteModal from '../pages/ConfirmDeleteModal'; // Certifique-se que o caminho está correto
import { vulnerabilitiesApi } from '../api/backendApi'; // Importar o vulnerabilitiesApi

function GerenciarVulnerabilidades() {
    const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedVulnerability, setSelectedVulnerability] = useState<any | null>(null);
    const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [vulnerabilityToDelete, setVulnerabilityToDelete] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'webapp' | 'servers'>('webapp'); // Controla a aba ativa

    // Estado para o formulário de descrição
    const [descriptionForm, setDescriptionForm] = useState({
        name: '',
        cvss: '',
        description: '',
        impact: '',
        recommendation: '',
    });

    useEffect(() => {
        fetchVulnerabilities(activeTab);
    }, [activeTab]); // Refetch quando a aba ativa muda

    const fetchVulnerabilities = async (type: 'webapp' | 'servers') => {
        setLoading(true);
        try {
            const data = await vulnerabilitiesApi.getVulnerabilities(type); // 'type' aqui é 'webapp' ou 'servers'
            setVulnerabilities(data);
        } catch (error) {
            console.error(`Erro ao buscar vulnerabilidades de ${type}:`, error);
            toast.error(`Erro ao buscar vulnerabilidades de ${type}.`);
        } finally {
            setLoading(false);
        }
    };

    const fetchVulnerabilityDescription = async (type: 'webapp' | 'servers', name: string) => {
        setLoading(true);
        try {
            const data = await vulnerabilitiesApi.getVulnerabilityDescriptions(type);
            const desc = data.find((d: any) => d.name === name);
            if (desc) {
                setDescriptionForm(desc);
            } else {
                setDescriptionForm({ name: name, cvss: '', description: '', impact: '', recommendation: '' });
            }
            setIsModalOpen(true);
        } catch (error) {
            console.error(`Erro ao buscar descrição da vulnerabilidade de ${type}:`, error);
            toast.error(`Erro ao buscar descrição da vulnerabilidade de ${type}.`);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectVulnerability = (vuln: any) => {
        setSelectedVulnerability(vuln);
    };

    const handleAddClick = () => {
        setFormMode('add');
        setDescriptionForm({ name: '', cvss: '', description: '', impact: '', recommendation: '' });
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        if (selectedVulnerability) {
            setFormMode('edit');
            fetchVulnerabilityDescription(activeTab, selectedVulnerability.name);
        } else {
            toast.warn('Selecione uma vulnerabilidade para editar.');
        }
    };

    const handleDeleteClick = () => {
        if (selectedVulnerability) {
            setVulnerabilityToDelete(selectedVulnerability);
            setShowDeleteModal(true);
        } else {
            toast.warn('Selecione uma vulnerabilidade para excluir.');
        }
    };

    const handleConfirmDelete = async () => {
        if (!vulnerabilityToDelete?._id) return;

        setLoading(true);
        try {
            const response = await vulnerabilitiesApi.deleteVulnerability(activeTab, vulnerabilityToDelete._id);
            toast.success(response.message || 'Vulnerabilidade excluída com sucesso!');
            setSelectedVulnerability(null);
            fetchVulnerabilities(activeTab); // Recarregar lista
        } catch (error: any) {
            console.error('Erro ao excluir vulnerabilidade:', error);
            toast.error(error.response?.data?.error || 'Erro ao excluir vulnerabilidade.');
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
            setVulnerabilityToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setVulnerabilityToDelete(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDescriptionForm(prev => ({ ...prev, [name]: value }));
    };

    const handleDescriptionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!descriptionForm.name || !descriptionForm.description || !descriptionForm.impact || !descriptionForm.recommendation) {
            toast.warn('Preencha todos os campos obrigatórios (Nome, Descrição, Impacto, Recomendação).');
            setLoading(false);
            return;
        }

        try {
            if (formMode === 'add') {
                await vulnerabilitiesApi.addVulnerability(activeTab, descriptionForm);
                toast.success('Vulnerabilidade adicionada com sucesso!');
            } else if (selectedVulnerability?._id) {
                await vulnerabilitiesApi.updateVulnerability(activeTab, selectedVulnerability._id, descriptionForm);
                toast.success('Vulnerabilidade atualizada com sucesso!');
            }
            setIsModalOpen(false);
            setSelectedVulnerability(null);
            fetchVulnerabilities(activeTab);
        } catch (error: any) {
            console.error('Erro ao salvar vulnerabilidade:', error);
            toast.error(error.response?.data?.error || 'Erro ao salvar vulnerabilidade.');
        } finally {
            setLoading(false);
        }
    };

    // Função para upload de imagem (CAUSADOR DO ERRO - COMENTADO/REMOVIDO)
    // Se você quiser implementar isso, precisará de uma rota no backend e uma função no backendApi.tsx
    // const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = event.target.files?.[0];
    //     if (!file) return;

    //     const formData = new FormData();
    //     formData.append('image', file);
    //     formData.append('vulnerabilityId', selectedVulnerability?._id || descriptionForm.name); // Associe ao ID ou nome da vulnerabilidade

    //     setLoading(true);
    //     try {
    //         // ESTA LINHA CAUSARIA O ERRO "Property 'uploadImage' does not exist"
    //         // Você precisaria adicionar vulnerabilitiesApi.uploadImage = async (formData: FormData) => {...} em backendApi.tsx
    //         // await vulnerabilitiesApi.uploadImage(formData); 
    //         // toast.success('Imagem carregada com sucesso!');
    //     } catch (error: any) {
    //         // console.error('Erro ao carregar imagem:', error);
    //         // toast.error(error.response?.data?.error || 'Erro ao carregar imagem.');
    //     } finally {
    //         // setLoading(false);
    //     }
    // };

    return (
        <div className="min-h-screen bg-white p-8 flex flex-col rounded-lg">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Vulnerabilidades</h1>

            {/* Abas de seleção */}
            <div className="mb-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('webapp')}
                        className={`${
                            activeTab === 'webapp'
                                ? 'border-[#007BB4] text-[#007BB4]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Vulnerabilidades WebApp
                    </button>
                    <button
                        onClick={() => setActiveTab('servers')}
                        className={`${
                            activeTab === 'servers'
                                ? 'border-[#007BB4] text-[#007BB4]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Vulnerabilidades de Servidores
                    </button>
                </nav>
            </div>

            <div className="flex justify-end space-x-4 mb-4">
                <button
                    className="px-6 py-2 rounded-lg text-white font-medium bg-green-600 hover:bg-green-700"
                    onClick={handleAddClick}
                    disabled={loading}
                >
                    Adicionar Vulnerabilidade
                </button>
                <button
                    className={`px-6 py-2 rounded-lg text-white font-medium ${
                        selectedVulnerability ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!selectedVulnerability || loading}
                    onClick={handleEditClick}
                >
                    Editar Vulnerabilidade
                </button>
                <button
                    className={`px-6 py-2 rounded-lg text-white font-medium ${
                        selectedVulnerability ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!selectedVulnerability || loading}
                    onClick={handleDeleteClick}
                >
                    Excluir Vulnerabilidade
                </button>
            </div>

            <div className="bg-gray-100 flex-1 rounded-lg p-4 overflow-y-auto">
                {loading && vulnerabilities.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <ClipLoader size={50} color={"#1a73e8"} />
                    </div>
                ) : vulnerabilities.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Nenhuma vulnerabilidade encontrada para {activeTab === 'webapp' ? 'WebApp' : 'Servidores'}.</p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {vulnerabilities.map(vuln => (
                            <li
                                key={vuln._id}
                                className={`p-3 rounded-lg cursor-pointer border border-gray-200 ${
                                    selectedVulnerability?._id === vuln._id
                                        ? 'bg-[#007BB4] text-white'
                                        : 'bg-white hover:bg-gray-200 text-black'
                                }`}
                                onClick={() => handleSelectVulnerability(vuln)}
                            >
                                <p className="font-semibold">{vuln.name}</p>
                                <p className="text-sm">CVSS: {vuln.cvss}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-1/2 max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                            {formMode === 'add' ? 'Adicionar Nova Vulnerabilidade' : 'Editar Vulnerabilidade'}
                        </h2>
                        <form onSubmit={handleDescriptionSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                                    Nome:
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={descriptionForm.name}
                                    onChange={handleFormChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                    disabled={loading || formMode === 'edit'} // Nome não editável para evitar inconsistências
                                />
                                {formMode === 'edit' && <p className="text-xs text-gray-500 mt-1">O nome da vulnerabilidade não pode ser alterado.</p>}
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cvss">
                                    CVSS:
                                </label>
                                <input
                                    type="text"
                                    id="cvss"
                                    name="cvss"
                                    value={descriptionForm.cvss}
                                    onChange={handleFormChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                                    Descrição:
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={descriptionForm.description}
                                    onChange={handleFormChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                                    required
                                    disabled={loading}
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="impact">
                                    Impacto:
                                </label>
                                <textarea
                                    id="impact"
                                    name="impact"
                                    value={descriptionForm.impact}
                                    onChange={handleFormChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                                    required
                                    disabled={loading}
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recommendation">
                                    Recomendação:
                                </label>
                                <textarea
                                    id="recommendation"
                                    name="recommendation"
                                    value={descriptionForm.recommendation}
                                    onChange={handleFormChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                                    required
                                    disabled={loading}
                                ></textarea>
                            </div>

                            {/* Campo de upload de imagem (CAUSADOR DO ERRO - COMENTADO/REMOVIDO) */}
                            {/* <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="imageUpload">
                                    Upload de Imagem (Opcional):
                                </label>
                                <input
                                    type="file"
                                    id="imageUpload"
                                    name="image"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                />
                            </div> */}


                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    className="px-6 py-2 rounded-lg text-black font-medium bg-gray-300 hover:bg-gray-400"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg text-white font-medium bg-[#007BB4] hover:bg-[#009BE2]"
                                    disabled={loading}
                                >
                                    {loading ? <ClipLoader size={20} color={"#fff"} /> : (formMode === 'add' ? 'Adicionar' : 'Salvar Alterações')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showDeleteModal && vulnerabilityToDelete && (
                <ConfirmDeleteModal
                    isOpen={showDeleteModal}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    message={`Tem certeza que deseja excluir a vulnerabilidade "${vulnerabilityToDelete.name}"? Esta ação é irreversível.`}
                />
            )}
            <ToastContainer />
        </div>
    );
}

export default GerenciarVulnerabilidades;