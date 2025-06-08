// frontend/src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios'; // Importa axios
import { useAuth } from '../context/AuthContext.tsx'; // Importa o hook useAuth

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000'; // Fallback para dev

function Login() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login: authLogin } = useAuth(); // Obtém a função login do contexto

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                login,
                password,
            });

            // Chama a função login do contexto para salvar o usuário e o token
            authLogin({
                login: response.data.user.login,
                name: response.data.user.name,
                email: response.data.user.email,
                profile: response.data.user.profile,
                token: response.data.token, // Salva o token aqui
            });

            toast.success(response.data.message || 'Login bem-sucedido!');
            navigate('/home'); // Redireciona para a página Home após o login
        } catch (error: any) {
            console.error('Erro de login:', error);
            toast.error(error.response?.data?.error || 'Erro ao fazer login. Credenciais inválidas ou erro no servidor.');
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
                    <h1 className="text-2xl font-bold text-black mb-8 text-center">Login</h1>
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
                        <button
                            type="submit"
                            className="bg-[#007BB4] text-white px-6 py-2 rounded hover:bg-[#009BE2] cursor-pointer mt-4"
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color={"#fff"} /> : 'Entrar'}
                        </button>
                    </form>

                </div>
            </div>
            <ToastContainer />
        </div>
    );
}

export default Login;