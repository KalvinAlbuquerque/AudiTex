// frontend/src/App.tsx
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import './index.css';

// Importa todos os componentes de página
import Home from './pages/Home';
import CriarLista from './pages/CriarLista';
import ListaDeScans from './pages/ListaDeScans';
import EditarLista from './pages/EditarLista';
import GerarRelatorio from './pages/GerarRelatorio';
import GerarRelatorioFinal from './pages/GerarRelatorioFinal';
import Relatorios from './pages/Relatorios';
import RelatoriosGerados from './pages/RelatoriosGerados';
import Scans from './pages/Scans';
import PesquisarScanWAS from './pages/PesquisarScanWAS';
import PesquisarScanVM from './pages/PesquisarScanVM';
import GerenciarVulnerabilidades from './pages/GerenciarVulnerabilidades';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import Login from './pages/Login';

import AuthGuard from './components/AuthGuard.tsx';
import Layout from './components/Layout.tsx'; // NOVO: Importe o componente Layout
import { useAuth } from './context/AuthContext.tsx';

function App() {
    const { user } = useAuth();

    return (
        <Router>
            <Routes>
                {/* Rotas públicas (não exigem autenticação) */}
                <Route
                    path="/"
                    element={user ? <Navigate to="/home" replace /> : <Login />}
                />
                <Route path="/login" element={<Login />} />

                {/* Rotas protegidas (exigem autenticação e usam o Layout) */}
                {/* Aqui, o AuthGuard envolve o Layout, que por sua vez envolve o componente da página */}
                <Route path="/home" element={<AuthGuard><Layout><Home /></Layout></AuthGuard>} />
                <Route path="/criar-lista" element={<AuthGuard><Layout><CriarLista /></Layout></AuthGuard>} />
                <Route path="/lista-de-scans" element={<AuthGuard><Layout><ListaDeScans /></Layout></AuthGuard>} />
                <Route path="/editar-lista/:idLista" element={<AuthGuard><Layout><EditarLista /></Layout></AuthGuard>} />
                <Route path="/gerar-relatorio/:idLista" element={<AuthGuard><Layout><GerarRelatorio /></Layout></AuthGuard>} />
                <Route path="/gerar-relatorio-final/:relatorioId" element={<AuthGuard><Layout><GerarRelatorioFinal /></Layout></AuthGuard>} />
                <Route path="/relatorios" element={<AuthGuard><Layout><Relatorios /></Layout></AuthGuard>} />
                <Route path="/relatorios-gerados" element={<AuthGuard><Layout><RelatoriosGerados /></Layout></AuthGuard>} />
                <Route path="/scans" element={<AuthGuard><Layout><Scans /></Layout></AuthGuard>} />
                <Route path="/pesquisar-scan-was" element={<AuthGuard><Layout><PesquisarScanWAS /></Layout></AuthGuard>} />
                <Route path="/pesquisar-scan-vm" element={<AuthGuard><Layout><PesquisarScanVM /></Layout></AuthGuard>} />
                <Route
                    path="/gerenciar-vulnerabilidades"
                    element={<AuthGuard allowedProfiles={['Administrator']}><Layout><GerenciarVulnerabilidades /></Layout></AuthGuard>}
                />
                <Route
                    path="/gerenciar-usuarios"
                    element={<AuthGuard allowedProfiles={['Administrator']}><Layout><GerenciarUsuarios /></Layout></AuthGuard>}
                />
            </Routes>
        </Router>
    );
}

export default App;