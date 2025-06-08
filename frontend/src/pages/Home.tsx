// frontend/src/pages/Home.tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx'; // Import useAuth para verificar o perfil do usuário

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Obtém o usuário do contexto de autenticação

  return (
    <div
      className="min-h-screen bg-cover bg-center text-white flex flex-col justify-center items-center"
      style={{ backgroundImage: "url('/assets/fundo.png')" }}
    >
{/*       <div className="absolute top-4 left-4">
        <img
          src="/assets/logocogel.jpg"
          alt="COGEL Logo"
          className="w-38 h-auto"
        />
      </div> */}

      <div className="flex justify-center items-center h-full">
        <div className="flex space-x-12">
          {/* Botão Relatórios */}
          <div
            className="bg-white rounded-lg p-6 text-center text-black shadow-lg hover:scale-105 transition-transform
                       w-40 h-40 cursor-pointer flex flex-col items-center justify-center"
            onClick={() => navigate('/relatorios')}
          >
            <img
              src="/assets/icone-relatorios.png"
              alt="Relatórios"
              className="w-16 h-16 mx-auto mb-2"
            />
            <p className="text-lg font-medium">Relatórios</p>
          </div>

          {/* Botão Scans */}
          <div
            className="bg-white rounded-lg p-6 text-center text-black shadow-lg hover:scale-105 transition-transform
                       w-40 h-40 cursor-pointer flex flex-col items-center justify-center"
            onClick={() => navigate('/scans')}
          >
            <img
              src="/assets/icone-scan.png"
              alt="Scans"
              className="w-18 h-16 mx-auto mb-2"
            />
            <p className="text-lg font-medium">Scans</p>
          </div>

          {/* Botão Gerenciar Vulnerabilidades */}
          <div
            className="bg-white rounded-lg p-6 text-center text-black shadow-lg hover:scale-105 transition-transform
                       w-40 h-40 cursor-pointer flex flex-col items-center justify-center"
            onClick={() => navigate('/gerenciar-vulnerabilidades')}
          >
            <img
              src="/assets/icone-gerenciar-vulnerabilidades.png"
              alt="Gerenciar Vulnerabilidades"
              className="w-16 h-16 mx-auto mb-2"
            />
            <p className="text-lg font-medium">Gerenciar Vulnerabilidades</p>
          </div>

          {user?.profile === 'Administrator' && ( // Verifica se o usuário é administrador para exibir o botão
            <div
              className="bg-white rounded-lg p-6 text-center text-black shadow-lg hover:scale-105 transition-transform
                         w-40 h-40 cursor-pointer flex flex-col items-center justify-center"
              onClick={() => navigate('/gerenciar-usuarios')}
            >
              <img
                src="/assets/gerenciar_usuarios.png" // Garanta que este arquivo PNG/SVG está em `frontend/public/assets/`
                alt="Gerenciar Usuários"
                className="w-16 h-16 mx-auto mb-2"
              />
              <p className="text-lg font-medium">Gerenciar Usuários</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;