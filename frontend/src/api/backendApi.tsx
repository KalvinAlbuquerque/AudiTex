import axios from 'axios';

// Obtém a URL base da API das variáveis de ambiente definidas no .env
const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

if (!API_URL) {
    console.error('VITE_REACT_APP_API_URL não está definido nas variáveis de ambiente.');
    // Considere lançar um erro ou usar um fallback se a API_URL for crítica.
}

// Configuração da instância Axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Tipos de Dados (Interface) ---
// Define as interfaces para os dados que a API retorna ou espera.
// Adicione mais interfaces conforme necessário para outras entidades.

export interface Lista {
    idLista: string;
    nomeLista: string;
    relatorioGerado?: boolean; // Adicionado para a lista de relatórios
}

export interface ScanData {
    config_id?: string; // ID do scan no Tenable.WAS
    name: string;
    target?: string;
    description?: string; // Adicionado: Descrição da vulnerabilidade/scan
    created_at?: string; // Adicionado: Data de criação do scan
    last_scan?: {
        scan_id?: string; // Changed to optional as it might be missing
        uuid?: string; // UUID do último scan (history_id no VM)
        status?: string; // Adicionado: Status do último scan
    };
    owner_id?: string;
    owner?: { name: string }; // Para scans VM, o owner pode ter nome
    id?: string; // Para scans VM, pode ser o id do scan
    last_modification_date?: string; // Para scans VM, usado como ID numérico temporário
}

export interface Folder {
    id: string;
    name: string;
}

export interface ReportGenerated {
    id: string;
    nome: string;
}

// --- Funções de API para Listas ---
export const listsApi = {
    // ESTA É A LINHA CRÍTICA: DEVE TER '/lists/' (em inglês)
    getAllLists: async (): Promise<Lista[]> => {
        const response = await api.get('/lists/getTodasAsListas/'); 
        return response.data;
    },

    createList: async (nomeLista: string): Promise<{ message: string; idLista: string }> => {
        const response = await api.post('/lists/criarLista/', { nomeLista });
        return response.data;
    },

    editListName: async (id: string, novoNome: string): Promise<{ message: string }> => {
        const response = await api.post('/lists/editarNomeLista/', { id, novoNome });
        return response.data;
    },

    deleteList: async (idLista: string): Promise<{ message: string }> => {
        const response = await api.post('/lists/excluirLista/', { idLista });
        return response.data;
    },

    getWebAppScansFromList: async (nomeLista: string): Promise<string[]> => {
        const response = await api.post('/lists/getScansDeLista/', { nomeLista });
        return response.data;
    },

    addWebAppScanToList: async (nomeLista: string, scans: { items: ScanData[] }): Promise<{ message: string }> => {
        const response = await api.post('/lists/adicionarWAPPScanALista/', { nomeLista, scans });
        return response.data;
    },

    clearWebAppScansFromList: async (nomeLista: string): Promise<{ message: string }> => {
        const response = await api.post('/lists/limparScansDeLista/', { nomeLista });
        return response.data;
    },

    getVMScanFromList: async (nomeLista: string): Promise<[string, string] | null> => {
        try {
            const response = await api.post('/lists/getVMScansDeLista/', { nomeLista });
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    addVMScanToList: async (nomeLista: string, idScan: string, nomeScan: string, criadoPor: string, idNmr: string): Promise<{ message: string }> => {
        const response = await api.post('/lists/adicionarVMScanALista/', { nomeLista, idScan, nomeScan, criadoPor, idNmr });
        return response.data;
    },

    clearVMScanFromList: async (nomeLista: string): Promise<{ message: string }> => {
        const response = await api.post('/lists/limparVMScansDeLista/', { nomeLista });
        return response.data;
    },
};

// --- Funções de API para Scans (Tenable) ---
export const scansApi = {
    getWebAppScansFromFolder: async (nomeUsuario: string, nomePasta: string): Promise<ScanData[]> => {
        const response = await api.post('/scans/webapp/scansfromfolderofuser/', { nomeUsuario, nomePasta });
        return response.data.items;
    },

    downloadWebAppScans: async (scans: { items: ScanData[] }, usuario: string, nomePasta: string): Promise<{ message: string }> => {
        const response = await api.post('/scans/webapp/downloadscans/', { scans, usuario, nomePasta });
        return response.data;
    },

    getVMScanByName: async (name: string): Promise<ScanData | null> => {
        try {
            const response = await api.post('/scans/vm/getScanByName/', { name });
            return response.data;
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    downloadVMScan: async (nomeListaId: string, idScan: string, historyId: string): Promise<{ message: string }> => {
        const response = await api.post('/scans/vm/downloadscans/', { nomeListaId, idScan, historyId });
        return response.data;
    },
};

// --- Funções de API para Relatórios ---
export const reportsApi = {
    getGeneratedReports: async (): Promise<ReportGenerated[]> => {
        const response = await api.get('/reports/getRelatoriosGerados/');
        return response.data;
    },

    deleteReport: async (relatorio_id: string): Promise<{ message: string }> => {
        const response = await api.delete(`/reports/deleteRelatorio/${relatorio_id}`);
        return response.data;
    },

    deleteAllReports: async (): Promise<{ message: string }> => {
        const response = await api.delete('/reports/deleteAllRelatorios/');
        return response.data;
    },

    generateReportForList: async (reportData: any): Promise<string> => {
        const response = await api.post('/reports/gerarRelatorioDeLista/', reportData);
        return response.data;
    },

    getMissingVulnerabilities: async (relatorioId: string, type: 'sites' | 'servers'): Promise<string[]> => {
        const response = await api.get(`/reports/getRelatorioMissingVulnerabilities?relatorioId=${relatorioId}&type=${type}`);
        return response.data.content;
    },

    downloadReportPdf: async (idRelatorio: string): Promise<Blob> => {
        const response = await api.post('/reports/baixarRelatorioPdf/', { idRelatorio }, { responseType: 'blob' });
        return response.data;
    },
};

// --- Funções de API para Gerenciamento de Vulnerabilidades ---
export const vulnerabilitiesApi = {
    getAllVulnerabilities: async (type: 'sites' | 'servers'): Promise<any[]> => {
        const response = await api.get(`/vulnerabilities/getVulnerabilidades/?type=${type}`);
        return response.data;
    },

    addVulnerability: async (type: 'sites' | 'servers', data: any): Promise<{ message: string }> => {
        const response = await api.post('/vulnerabilities/addVulnerabilidade/', { type, data });
        return response.data;
    },

    updateVulnerability: async (type: 'sites' | 'servers', oldName: string, data: any): Promise<{ message: string }> => {
        const response = await api.put('/vulnerabilities/updateVulnerabilidade/', { type, oldName, data });
        return response.data;
    },

    deleteVulnerability: async (type: 'sites' | 'servers', name: string): Promise<{ message: string }> => {
        const response = await api.delete('/vulnerabilities/deleteVulnerabilidade/', { data: { type, name } });
        return response.data;
    },

    uploadImage: async (formData: FormData): Promise<{ message: string; imagePath: string }> => {
        const response = await api.post('/vulnerabilities/uploadImage/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getDescriptiveVulnerabilities: async (type: 'sites' | 'servers'): Promise<any[]> => {
        const response = await api.get(`/vulnerabilities/getDescritivos/?type=${type}`);
        return response.data;
    },
};