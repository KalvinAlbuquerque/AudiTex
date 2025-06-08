// frontend/src/components/Header.tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx'; // NOVO: Importa useAuth
import { toast } from 'react-toastify'; // Para mensagens de logout

function Header() {
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // NOVO: Obtém user e logout do contexto

    const handleLogout = () => {
        logout(); // Limpa o estado de autenticação
        toast.info('Você foi desconectado.');
        navigate('/login'); // Redireciona para a tela de login
    };

    return (
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-md">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {/* Logotipo/Nome da Aplicação */}
                    <img src="/assets/logo.png" alt="Logo Auditex" className="h-10 w-auto cursor-pointer" onClick={() => navigate('/')} />
                    <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>
                        Auditex
                    </h1>
                </div>
                <nav>
                    <ul className="flex space-x-6 text-lg">
                        {user ? ( // NOVO: Só mostra os links se o usuário estiver logado
                            <>
                                <li>
                                    <button
                                        onClick={() => navigate('/lista-de-scans')}
                                        className="hover:text-blue-200 transition duration-300 ease-in-out"
                                    >
                                        Listas de Scans
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => navigate('/scans')}
                                        className="hover:text-blue-200 transition duration-300 ease-in-out"
                                    >
                                        Scans
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => navigate('/relatorios')}
                                        className="hover:text-blue-200 transition duration-300 ease-in-out"
                                    >
                                        Relatórios
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => navigate('/gerenciar-vulnerabilidades')}
                                        className="hover:text-blue-200 transition duration-300 ease-in-out"
                                    >
                                        Gerenciar Vulnerabilidades
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={handleLogout} 
                                        className="hover:text-red-300 transition duration-300 ease-in-out bg-red-500 px-3 py-1 rounded"
                                    >
                                        Logout ({user.login}) {/* Mostra o login do usuário */}
                                    </button>
                                </li>
                            </>
                        ) : (
                            // Opcional: Botões de Login/Registro se não estiver logado
                            <>
                                <li>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="hover:text-blue-200 transition duration-300 ease-in-out"
                                    >
                                        Login
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="hover:text-blue-200 transition duration-300 ease-in-out"
                                    >
                                        Register
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    );
}

export default Header;