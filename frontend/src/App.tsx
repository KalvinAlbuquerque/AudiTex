// frontend/src/App.tsx
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import Login from './pages/Login';
import Register from './pages/Register';

import AuthGuard from './components/AuthGuard.tsx'; // NOVO: Importa AuthGuard

function App() {
    return (
        <Router>
            <Routes>
                {/* Rotas públicas (não exigem autenticação) */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Rotas protegidas (exigem autenticação) */}
                {/* Envolva cada rota restrita com AuthGuard */}
                <Route path="/home" element={<AuthGuard><Home /></AuthGuard>} />
                <Route path="/criar-lista" element={<AuthGuard><CriarLista /></AuthGuard>} />
                <Route path="/lista-de-scans" element={<AuthGuard><ListaDeScans /></AuthGuard>} />
                <Route path="/editar-lista/:idLista" element={<AuthGuard><EditarLista /></AuthGuard>} />
                <Route path="/gerar-relatorio/:idLista" element={<AuthGuard><GerarRelatorio /></AuthGuard>} />
                <Route path="/gerar-relatorio-final/:relatorioId" element={<AuthGuard><GerarRelatorioFinal /></AuthGuard>} />
                <Route path="/relatorios" element={<AuthGuard><Relatorios /></AuthGuard>} />
                <Route path="/relatorios-gerados" element={<AuthGuard><RelatoriosGerados /></AuthGuard>} />
                <Route path="/scans" element={<AuthGuard><Scans /></AuthGuard>} />
                <Route path="/pesquisar-scan-was" element={<AuthGuard><PesquisarScanWAS /></AuthGuard>} />
                <Route path="/pesquisar-scan-vm" element={<AuthGuard><PesquisarScanVM /></AuthGuard>} />
                {/* Exemplo de rota com permissão de perfil (apenas administradores podem acessar) */}
                <Route 
                    path="/gerenciar-vulnerabilidades" 
                    element={<AuthGuard allowedProfiles={['Administrator']}><GerenciarVulnerabilidades /></AuthGuard>} 
                />
            </Routes>
        </Router>
    );
}

export default App;