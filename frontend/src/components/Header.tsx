// frontend/src/components/Header.tsx
import  { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { toast } from 'react-toastify';

// Remove a prop isTransparent, pois o header terá um estilo fixo
// interface HeaderProps {
//     isTransparent?: boolean;
// }

// function Header({ isTransparent = false }: HeaderProps) {
function Header() { // Não recebe mais a prop isTransparent
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        toast.info('Você foi desconectado.');
        navigate('/login');
    };

    // Estilo de fundo para o cabeçalho (sempre fundo.png)
    const headerBgStyle = {
        backgroundImage: "url('/assets/fundo.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };
    const textColorClass = 'text-white'; // Texto sempre branco
    const linkHoverClass = 'hover:text-gray-300'; // Hover em tons de cinza claro

    return (
        <header
            className="p-4 flex items-center justify-between z-10 relative" // Remova `absolute top-0 left-0 right-0` se estava
            style={headerBgStyle} // Aplica a imagem de fundo aqui
        >
            <div className="flex items-center space-x-4">
                <img
                    src="/assets/logocogel.jpg"
                    alt="COGEL Logo"
                    className="h-12 w-auto cursor-pointer"
                    onClick={() => navigate('/home')}
                />
                <h1 className={`text-2xl font-bold ${textColorClass} cursor-pointer`} onClick={() => navigate('/home')}>
                    Auditex
                </h1>
            </div>
            <nav>
                <ul className="flex space-x-6 text-lg">
                    {user ? (
                        <>
                            <li>
                                <button
                                    onClick={() => navigate('/scans')}
                                    className={`${textColorClass} ${linkHoverClass} transition duration-300 ease-in-out`}
                                >
                                    Scans
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate('/relatorios')}
                                    className={`${textColorClass} ${linkHoverClass} transition duration-300 ease-in-out`}
                                >
                                    Relatórios
                                </button>
                            </li>

                            {/* Menu suspenso para Configurações e Logout */}
                            <li className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className={`${textColorClass} ${linkHoverClass} transition duration-300 ease-in-out flex items-center`}
                                >
                                    Configurações
                                    <svg className={`ml-1 w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                                
                                {isMenuOpen && (
                                    <ul className="absolute left-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-20">
                                        {user.profile === 'Administrator' && (
                                            <>
                                                <li>
                                                    <button
                                                        onClick={() => { navigate('/gerenciar-usuarios'); setIsMenuOpen(false); }}
                                                        className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700"
                                                    >
                                                        Gerenciar Usuários
                                                    </button>
                                                </li>
                                                <li>
                                                    <button
                                                        onClick={() => { navigate('/ver-logs'); setIsMenuOpen(false); }}
                                                        className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700"
                                                    >
                                                        Ver Logs
                                                    </button>
                                                </li>
                                                <li>
                                                    <button
                                                        onClick={() => { navigate('/configuracoes-tenable'); setIsMenuOpen(false); }}
                                                        className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700"
                                                    >
                                                        Config. Tenable
                                                    </button>
                                                </li>
                                                <li>
                                                    <button
                                                        onClick={() => { navigate('/gerenciar-vulnerabilidades'); setIsMenuOpen(false); }}
                                                        className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700"
                                                    >
                                                        Gerenciar Vulnerabilidades
                                                    </button>
                                                </li>
                                            </>
                                        )}
                                        <li>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-b-md mt-1"
                                            >
                                                Logout ({user.login})
                                            </button>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <button
                                    onClick={() => navigate('/login')}
                                    className={`${textColorClass} ${linkHoverClass} transition duration-300 ease-in-out`}
                                >
                                    Login
                                </button>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
        </header>
    );
}

export default Header;