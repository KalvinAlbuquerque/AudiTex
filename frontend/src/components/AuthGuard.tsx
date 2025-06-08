// frontend/src/components/AuthGuard.tsx
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx'; // Importa o hook useAuth

interface AuthGuardProps {
    children: ReactNode;
    allowedProfiles?: string[]; // Opcional: perfis permitidos para esta rota
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedProfiles }) => {
    const { user } = useAuth();

    if (!user) {
        // Se não houver usuário logado, redireciona para a página de login
        return <Navigate to="/login" replace />;
    }

    if (allowedProfiles && !allowedProfiles.includes(user.profile)) {
        // Se o usuário não tiver um perfil permitido para esta rota, redireciona para a home
        // ou uma página de "acesso negado"
        return <Navigate to="/home" replace />; // Ou para uma página de erro 403
    }

    return <>{children}</>; // Se o usuário está logado e tem o perfil certo, renderiza o conteúdo
};

export default AuthGuard;