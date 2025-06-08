// frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthUser {
    login: string;
    name: string;
    email: string;
    profile: string;
    token: string;
}

interface AuthContextType {
    user: AuthUser | null;
    login: (userData: AuthUser) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};

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
    }, []); // Executa apenas uma vez no carregamento inicial

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