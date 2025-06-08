// frontend/src/api/backendApi.tsx

import axios from 'axios';

// Cria uma instância do Axios com a base URL do backend
const api = axios.create({
    baseURL: import.meta.env.REACT_APP_API_URL || 'http://localhost:5000',
    withCredentials: true, // Importante para permitir o envio de cookies de sessão/credenciais
});

// Interceptor para adicionar o token JWT (se você implementar JWT futuramente)
// api.interceptors.request.use(
//     (config) => {
//         const user = localStorage.getItem('auditex_user');
//         if (user) {
//             const parsedUser = JSON.parse(user);
//             if (parsedUser.token) {
//                 config.headers.Authorization = `Bearer ${parsedUser.token}`;
//             }
//         }
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );


// --- Interfaces de Dados ---
export interface ListData {
    idLista?: string;
    nomeLista: string;
    pastas_scans_webapp?: string;
    pastas_scans_vm?: string; // Alterado para vm de servers
    id_scan?: string;
    historyid_scanservidor?: string; // history_id
    relatorioGerado?: boolean;
}

export interface ScanData {
    id: string;
    name: string;
    folder_path: string;
    history_id?: string; // Opcional, para VM scans
}

export interface Folder {
    name: string;
    path: string;
    is_empty: boolean;
}

export interface ReportGenerated {
    nome: string;
    id: string;
    sigla: string; // Adicionado para relatorios gerados
    dataGeracao: string; // Adicionado para relatorios gerados
}

// Interface para dados do usuário
export interface UserData {
    _id?: string; // Opcional, pois é gerado pelo MongoDB
    login: string;
    password?: string; // Opcional para leitura, mas necessário para registro
    name: string;
    email: string;
    profile: 'User' | 'Administrator';
}

// Interface para dados de Log
export interface LogData {
    id: string;
    action: string;
    user_login: string;
    details: any;
    timestamp: string; // Formato ISO string
}

// Interface para os filtros de log
export interface LogFilters {
    user_login?: string;
    action?: string;
    start_date?: string; // YYYY-MM-DD
    end_date?: string;   // YYYY-MM-DD
}

// Interface para as configurações do Tenable
export interface TenableConfigStatus {
    configured: boolean;
    last_updated?: string; // Data da última atualização (opcional)
}


// --- Objetos de API para cada funcionalidade ---

export const listsApi = {
    getAllLists: async (): Promise<ListData[]> => {
        const response = await api.get('/lists/getLists/');
        return response.data;
    },
    createList: async (nomeLista: string): Promise<{ message: string; idLista: string }> => {
        const response = await api.post('/lists/createList/', { nomeLista });
        return response.data;
    },
    updateList: async (idLista: string, nomeLista: string, pastas_scans_webapp?: string, pastas_scans_vm?: string, id_scan?: string, historyid_scanservidor?: string): Promise<{ message: string }> => {
        const response = await api.put(`/lists/updateList/${idLista}`, { nomeLista, pastas_scans_webapp, pastas_scans_vm, id_scan, historyid_scanservidor });
        return response.data;
    },
    deleteList: async (idLista: string): Promise<{ message: string }> => {
        const response = await api.delete(`/lists/deleteList/${idLista}`);
        return response.data;
    },
    getFolders: async (scanType: 'was' | 'vm'): Promise<Folder[]> => {
        const response = await api.get(`/lists/getFolders/${scanType}`);
        return response.data;
    },
    getScanDetails: async (scanId: string): Promise<any> => { // Adicionado para buscar detalhes do scan
        const response = await api.get(`/scans/getScanDetails/${scanId}`);
        return response.data;
    },
    exportScanCsv: async (scanId: string, historyId: string): Promise<string> => { // Adicionado para exportar CSV
        const response = await api.get(`/scans/exportScanCsv/${scanId}/${historyId}`);
        return response.data.csv_content;
    },
};

export const scansApi = {
    getScansFromTenable: async (): Promise<any[]> => {
        const response = await api.get('/scans/getScansFromTenable');
        return response.data.scans; // Assuming the backend returns an object with a 'scans' key
    },
    getSavedScans: async (scanType: 'was' | 'vm'): Promise<ScanData[]> => {
        const response = await api.get(`/scans/getSavedScans/${scanType}`);
        return response.data;
    },
    saveScanToDirectory: async (scanId: string, scanName: string, scanType: 'was' | 'vm', history_id?: string): Promise<{ message: string }> => {
        const response = await api.post('/scans/saveScanToDirectory', { scanId, scanName, scanType, history_id });
        return response.data;
    },
    deleteScanFromDirectory: async (scanType: 'was' | 'vm', scanName: string): Promise<{ message: string }> => {
        const response = await api.delete(`/scans/deleteScanFromDirectory/${scanType}/${scanName}`);
        return response.data;
    },
};

export const reportsApi = {
    generateReport: async (reportData: {
        idLista: string;
        nomeSecretaria: string;
        siglaSecretaria: string;
        dataInicio: string;
        dataFim: string;
        ano: string;
        mes: string;
        linkGoogleDrive: string;
    }): Promise<string> => {
        const response = await api.post('/reports/gerarRelatorioDeLista/', reportData);
        return response.data; // Deve retornar o ID do relatório
    },
    getGeneratedReports: async (): Promise<ReportGenerated[]> => {
        const response = await api.get('/reports/getRelatoriosGerados/');
        return response.data;
    },
    downloadReportPdf: async (reportId: string): Promise<void> => {
        const response = await api.post('/reports/baixarRelatorioPdf/', { idRelatorio: reportId }, { responseType: 'blob' });
        // CORRIGIDO: Passa response.data diretamente, pois já é um Blob
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Relatorio_Auditoria_${reportId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url); // Importante para liberar recursos
    },
    deleteReport: async (reportId: string): Promise<{ message: string }> => {
        const response = await api.delete(`/reports/deleteRelatorio/${reportId}`);
        return response.data;
    },
    deleteAllReports: async (): Promise<{ message: string }> => {
        const response = await api.delete('/reports/deleteAllRelatorios/');
        return response.data;
    },
    // MODIFICADO: o tipo agora é 'webapp' | 'servers'
    getMissingVulnerabilities: async (relatorioId: string, type: 'webapp' | 'servers'): Promise<{ content: string[] }> => {
        const response = await api.get(`/reports/getRelatorioMissingVulnerabilities/?relatorioId=${relatorioId}&type=${type}`);
        return response.data;
    }
};

export const vulnerabilitiesApi = {
    getVulnerabilities: async (type: 'webapp' | 'servers'): Promise<any[]> => {
        const response = await api.get(`/vulnerabilities/get/${type}`);
        return response.data;
    },
    addVulnerability: async (type: 'webapp' | 'servers', data: any): Promise<{ message: string }> => {
        const response = await api.post(`/vulnerabilities/add/${type}`, data);
        return response.data;
    },
    updateVulnerability: async (type: 'webapp' | 'servers', vulnerabilityId: string, data: any): Promise<{ message: string }> => {
        const response = await api.put(`/vulnerabilities/update/${type}/${vulnerabilityId}`, data);
        return response.data;
    },
    deleteVulnerability: async (type: 'webapp' | 'servers', vulnerabilityId: string): Promise<{ message: string }> => {
        const response = await api.delete(`/vulnerabilities/delete/${type}/${vulnerabilityId}`);
        return response.data;
    },
    getVulnerabilityDescriptions: async (type: 'webapp' | 'servers'): Promise<any> => {
        const response = await api.get(`/vulnerabilities/descriptions/${type}`);
        return response.data;
    },
    updateVulnerabilityDescription: async (type: 'webapp' | 'servers', data: any): Promise<{ message: string }> => {
        const response = await api.put(`/vulnerabilities/descriptions/${type}`, data);
        return response.data;
    },
};

// Objeto de API para gerenciamento de usuários
export const userManagementApi = {
    getAllUsers: async (): Promise<UserData[]> => {
        const response = await api.get('/auth/users');
        return response.data;
    },

    addUser: async (userData: UserData): Promise<{ message: string; user_id: string }> => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    updateUser: async (userId: string, userData: Partial<UserData>): Promise<{ message: string }> => {
        const response = await api.put(`/auth/users/${userId}`, userData);
        return response.data;
    },

    deleteUser: async (userId: string): Promise<{ message: string }> => {
        const response = await api.delete(`/auth/users/${userId}`);
        return response.data;
    },
};

// Objeto de API para logs
export const logsApi = {
    getAllLogs: async (filters?: LogFilters): Promise<LogData[]> => {
        let url = '/auth/logs';
        if (filters) {
            const params = new URLSearchParams();
            if (filters.user_login) params.append('user_login', filters.user_login);
            if (filters.action) params.append('action', filters.action);
            if (filters.start_date) params.append('start_date', filters.start_date);
            if (filters.end_date) params.append('end_date', filters.end_date);
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
        }
        const response = await api.get(url);
        return response.data;
    },
};

// NOVO: Objeto de API para configurações
export const settingsApi = {
    getTenableConfigStatus: async (): Promise<TenableConfigStatus> => {
        const response = await api.get('/settings/tenable');
        return response.data;
    },
    updateTenableConfig: async (tenable_api_key: string, tenable_access_key: string): Promise<{ message: string }> => {
        const response = await api.put('/settings/tenable', { tenable_api_key, tenable_access_key });
        return response.data;
    },
};