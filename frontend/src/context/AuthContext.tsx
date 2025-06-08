// frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define a interface para os dados do usuário autenticado (adaptar conforme necessário)
interface AuthUser {
    login: string;
    name: string;
    email: string;
    profile: string;
    token: string; // O token JWT que será armazenado
}

// Define a interface para o contexto de autenticação
interface AuthContextType {
    user: AuthUser | null;
    login: (userData: AuthUser) => void;
    logout: () => void;
}

// Cria o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};

// Componente provedor de autenticação
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);

    // Efeito para carregar o estado do usuário do localStorage ao iniciar a aplicação
    useEffect(() => {
        const storedUser = localStorage.getItem('auditex_user');
        if (storedUser) {
            try {
                const parsedUser: AuthUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (e) {
                console.error("Erro ao fazer parse do usuário do localStorage", e);
                localStorage.removeItem('auditex_user'); // Limpa dados corrompidos
            }
        }
    }, []);

    const login = (userData: AuthUser) => {
        setUser(userData);
        localStorage.setItem('auditex_user', JSON.stringify(userData)); // Salva no localStorage
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('auditex_user'); // Remove do localStorage
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};