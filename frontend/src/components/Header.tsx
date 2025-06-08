// frontend/src/components/Header.tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { toast } from 'react-toastify';

// Não precisamos mais da prop isTransparent aqui se o background for sempre a imagem
// interface HeaderProps {
//     isTransparent?: boolean;
// }

// function Header({ isTransparent = false }: HeaderProps) {
function Header() { // Removendo a prop isTransparent
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        toast.info('Você foi desconectado.');
        navigate('/login');
    };

    // A classe do cabeçalho agora sempre terá a imagem de fundo
    // As classes de texto serão sempre brancas, já que o fundo é a imagem escura
    const headerClasses = "bg-cover bg-center p-4 flex items-center justify-between z-10 relative";
    const textColorClass = 'text-white';
    const linkHoverClass = 'hover:text-gray-300';

    return (
        <header
            className={headerClasses}
            style={{ backgroundImage: "url('/assets/fundo.png')" }} // Aplica a imagem de fundo aqui
        >
            <div className="flex items-center space-x-4">
                {/* Logo da COGEL */}
                <img
                    src="/assets/logocogel.jpg"
                    alt="COGEL Logo"
                    className="h-12 w-auto cursor-pointer"
                    onClick={() => navigate('/home')}
                />
                <h1 className={`text-2xl font-bold ${textColorClass} cursor-pointer`} onClick={() => navigate('/home')}>
                    AUDITEX
                </h1>
            </div>
            <nav>
                <ul className="flex space-x-6 text-lg">
                    {user ? (
                        <>
                            <li>
                                <button
                                    onClick={() => navigate('/lista-de-scans')}
                                    className={`${textColorClass} ${linkHoverClass} transition duration-300 ease-in-out`}
                                >
                                    Listas de Scans
                                </button>
                            </li>
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
                            {user.profile === 'Administrator' && (
                                <>
                                    <li>
                                        <button
                                            onClick={() => navigate('/gerenciar-vulnerabilidades')}
                                            className={`${textColorClass} ${linkHoverClass} transition duration-300 ease-in-out`}
                                        >
                                            Gerenciar Vulnerabilidades
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => navigate('/gerenciar-usuarios')}
                                            className={`${textColorClass} ${linkHoverClass} transition duration-300 ease-in-out`}
                                        >
                                            Gerenciar Usuários
                                        </button>
                                    </li>
                                    <li> 
                                        <button
                                            onClick={() => navigate('/ver-logs')}
                                            className={`${textColorClass} ${linkHoverClass} transition duration-300 ease-in-out`}
                                        >
                                            Ver Logs
                                        </button>
                                    </li>
                                </>
                            )}
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="bg-[#007BB4] text-white px-4 py-2 rounded hover:bg-gray-300 transition duration-300 ease-in-out"                                >
                                    Logout ({user.login})
                                </button>
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