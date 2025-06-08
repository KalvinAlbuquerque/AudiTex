// frontend/src/pages/Register.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios'; // Importa axios

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000'; // Fallback para dev

function Register() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profile, setProfile] = useState('User'); // Default profile
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/register`, {
                login,
                password,
                name,
                email,
                profile,
            });
            toast.success(response.data.message || 'Registro bem-sucedido! Você pode fazer login agora.');
            navigate('/login'); // Redireciona para a tela de login após o registro
        } catch (error: any) {
            console.error('Erro de registro:', error);
            if (error.response?.status === 409) {
                toast.error('Nome de usuário já existe. Por favor, escolha outro.');
            } else {
                toast.error(error.response?.data?.error || 'Erro ao registrar. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-cover bg-center flex"
            style={{ backgroundImage: "url('/assets/fundo.png')" }}
        >
            {/* Sidebar AZUL à esquerda com a cor #15688f */}
            <div
                className="w-1/5 text-white flex flex-col items-center justify-center p-4 shadow-lg min-h-screen"
            >
                <Link to="/">
                    <img
                        src="/assets/logocogel.jpg"
                        alt="COGEL Logo"
                        className="w-32 h-auto"
                    />
                </Link>
            </div>

            {/* Formulário central (área BRANCA à direita, 4/5 da largura da tela) */}
            <div className="w-4/5 flex items-center justify-center p-8">
                <div className="bg-white rounded-lg shadow-md p-10 w-full max-w-md">
                    <h1 className="text-2xl font-bold text-black mb-8 text-center">Registrar Nova Conta</h1>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-black mb-1">Login</label>
                            <input
                                type="text"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                className="w-full p-2 border rounded text-black"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-black mb-1">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border rounded text-black"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-black mb-1">Nome Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2 border rounded text-black"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-black mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 border rounded text-black"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-black mb-1">Perfil</label>
                            <select
                                value={profile}
                                onChange={(e) => setProfile(e.target.value)}
                                className="w-full p-2 border rounded text-black"
                                disabled={loading}
                            >
                                <option value="User">Usuário</option>
                                <option value="Administrator">Administrador</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="bg-[#007BB4] text-white px-6 py-2 rounded hover:bg-[#009BE2] cursor-pointer mt-4"
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color={"#fff"} /> : 'Registrar'}
                        </button>
                    </form>
                    <p className="text-center text-gray-600 mt-4">
                        Já tem uma conta? <Link to="/login" className="text-[#007BB4] hover:underline">Faça login</Link>
                    </p>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}

export default Register;