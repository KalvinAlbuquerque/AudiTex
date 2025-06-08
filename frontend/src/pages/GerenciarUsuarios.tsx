// frontend/src/pages/GerenciarUsuarios.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ConfirmDeleteModal from '../pages/ConfirmDeleteModal';
import { userManagementApi, UserData } from '../api/backendApi';

function GerenciarUsuarios() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
    const [formData, setFormData] = useState<UserData>({
        login: '',
        password: '',
        name: '',
        email: '',
        profile: 'User',
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await userManagementApi.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            toast.error('Erro ao buscar usuários.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectUser = (user: UserData) => {
        setSelectedUser(user);
    };

    const handleAddClick = () => {
        setFormMode('add');
        setFormData({
            login: '',
            password: '',
            name: '',
            email: '',
            profile: 'User',
        });
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        if (selectedUser) {
            setFormMode('edit');
            setFormData({ ...selectedUser, password: '' }); // Não preenche a senha ao editar
            setIsModalOpen(true);
        } else {
            toast.warn('Selecione um usuário para editar.');
        }
    };

    const handleDeleteClick = () => {
        if (selectedUser) {
            setUserToDelete(selectedUser);
            setShowDeleteModal(true);
        } else {
            toast.warn('Selecione um usuário para excluir.');
        }
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete?._id) return;

        setLoading(true);
        try {
            const response = await userManagementApi.deleteUser(userToDelete._id);
            toast.success(response.message || 'Usuário excluído com sucesso!');
            setSelectedUser(null);
            fetchUsers(); // Recarregar lista
        } catch (error: any) {
            console.error('Erro ao excluir usuário:', error);
            toast.error(error.response?.data?.error || 'Erro ao excluir usuário.');
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
            setUserToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setUserToDelete(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.login || !formData.name || !formData.email || !formData.profile || (formMode === 'add' && !formData.password)) {
            toast.warn('Preencha todos os campos obrigatórios.');
            setLoading(false);
            return;
        }

        try {
            if (formMode === 'add') {
                const { _id, ...dataToSend } = formData; // Remove _id ao adicionar
                await userManagementApi.addUser(dataToSend);
                toast.success('Usuário adicionado com sucesso!');
            } else if (selectedUser?._id) {
                const { login, password, ...dataToUpdate } = formData; // Não permite mudar login/senha na edição por esta rota
                await userManagementApi.updateUser(selectedUser._id, dataToUpdate);
                toast.success('Usuário atualizado com sucesso!');
            }
            setIsModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error: any) {
            console.error('Erro ao salvar usuário:', error);
            toast.error(error.response?.data?.error || 'Erro ao salvar usuário.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cover bg-center flex" style={{ backgroundImage: "url('/assets/fundo.png')" }}>
            <div className="w-1/5 #15688f text-white flex flex-col items-center justify-center p-4 shadow-lg min-h-screen">
                <Link to="/">
                    <img src="/assets/logocogel.jpg" alt="COGEL Logo" className="w-32 h-auto" />
                </Link>
            </div>

            <div className="w-4/5 p-8 bg-white rounded-l-lg shadow-md min-h-screen flex flex-col">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Usuários</h1>

                <div className="flex justify-end space-x-4 mb-4">
                    <button
                        className="px-6 py-2 rounded text-white font-medium bg-green-600 hover:bg-green-700"
                        onClick={handleAddClick}
                        disabled={loading}
                    >
                        Adicionar Usuário
                    </button>
                    <button
                        className={`px-6 py-2 rounded text-white font-medium ${
                            selectedUser ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!selectedUser || loading}
                        onClick={handleEditClick}
                    >
                        Editar Usuário
                    </button>
                    <button
                        className={`px-6 py-2 rounded text-white font-medium ${
                            selectedUser ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!selectedUser || loading}
                        onClick={handleDeleteClick}
                    >
                        Excluir Usuário
                    </button>
                </div>

                <div className="bg-gray-100 h-96 overflow-y-auto rounded-md p-4 mb-6">
                    {loading && users.length === 0 ? (
                        <div className="flex justify-center items-center h-full">
                            <ClipLoader size={50} color={"#1a73e8"} />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">Nenhum usuário encontrado.</p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {users.map(user => (
                                <li
                                    key={user._id}
                                    className={`p-3 rounded cursor-pointer border border-gray-200 ${
                                        selectedUser?._id === user._id
                                            ? 'bg-[#007BB4] text-white'
                                            : 'bg-white hover:bg-gray-200 text-black'
                                    }`}
                                    onClick={() => handleSelectUser(user)}
                                >
                                    <p className="font-semibold">{user.name} ({user.login})</p>
                                    <p className="text-sm">Email: {user.email} | Perfil: {user.profile}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-1/2 max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                            {formMode === 'add' ? 'Adicionar Novo Usuário' : 'Editar Usuário'}
                        </h2>
                        <form onSubmit={handleFormSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="login">
                                    Login:
                                </label>
                                <input
                                    type="text"
                                    id="login"
                                    name="login"
                                    value={formData.login}
                                    onChange={handleFormChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                    disabled={formMode === 'edit' || loading} // Login não editável
                                />
                                {formMode === 'edit' && <p className="text-xs text-gray-500 mt-1">O login não pode ser alterado diretamente.</p>}
                            </div>
                            {formMode === 'add' && (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                                        Senha:
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleFormChange}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            )}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                                    Nome Completo:
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                                    Email:
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleFormChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="profile">
                                    Perfil:
                                </label>
                                <select
                                    id="profile"
                                    name="profile"
                                    value={formData.profile}
                                    onChange={handleFormChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                    disabled={loading}
                                >
                                    <option value="User">User</option>
                                    <option value="Administrator">Administrator</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    className="px-6 py-2 rounded text-black font-medium bg-gray-300 hover:bg-gray-400"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded text-white font-medium bg-[#007BB4] hover:bg-[#009BE2]"
                                    disabled={loading}
                                >
                                    {loading ? <ClipLoader size={20} color={"#fff"} /> : (formMode === 'add' ? 'Adicionar' : 'Salvar Alterações')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showDeleteModal && userToDelete && (
                <ConfirmDeleteModal
                    isOpen={showDeleteModal}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    message={`Tem certeza que deseja excluir o usuário "${userToDelete.name}" (${userToDelete.login})? Esta ação é irreversível.`}
                />
            )}
            <ToastContainer />
        </div>
    );
}

export default GerenciarUsuarios;