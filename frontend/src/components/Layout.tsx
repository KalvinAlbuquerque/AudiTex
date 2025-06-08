// frontend/src/components/Layout.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header'; // Removido Footer para simplificar, se não estiver usando.
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/home';

  // Apenas a Home terá a imagem de fundo no Layout.
  // As outras páginas terão seu próprio fundo definido em seus componentes.
  const mainBgStyle = isHomePage ? { backgroundImage: "url('/assets/fundo.png')" } : {};
  const mainBgClasses = isHomePage ? 'bg-cover bg-center' : '';


  return (
    <div className="flex flex-col min-h-screen">
      {/* O Header agora SEMPRE terá a imagem de fundo, não precisa de prop 'isTransparent' */}
      <Header />
      
      {/* O conteúdo principal da página */}
      <main
        className={`flex-grow ${mainBgClasses}`}
        style={mainBgStyle}
      >
        {children}
      </main>
      {/* Se você tiver um componente Footer e quiser mantê-lo aqui:
      <Footer />
      */}
      <ToastContainer />
    </div>
  );
};

export default Layout;