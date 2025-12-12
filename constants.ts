
import { Cemiterio, StatusSepultura, TipoSepultura, GraveDisplay, Coveiro, CargoFuncionario, SystemUser, ChatMessage } from './types';

export const APP_NAME = "SGC Madalena";
export const ACTION_PASSWORD = "admin123"; // Simulação de senha administrativa (min 6 chars)

export const MOCK_CEMITERIOS: Cemiterio[] = [
    {
        id: 1,
        nome: "Cemitério Municipal São José",
        endereco: "Rua da Saudade, s/n - Centro, Madalena - CE"
    },
    {
        id: 2,
        nome: "Cemitério Parque da Saudade",
        endereco: "Av. do Contorno, 500 - Alto da Boa Vista, Madalena - CE"
    }
];

export const MOCK_COVEIROS: Coveiro[] = [
    { id: 1, nome: "João da Silva", matricula: "COV-001", cargo: CargoFuncionario.COVEIRO },
    { id: 2, nome: "Antônio Ferreira", matricula: "COV-002", cargo: CargoFuncionario.COVEIRO }
];

export const MOCK_USERS: SystemUser[] = [
    { id: 1, username: 'admin', nome: 'Administrador Principal', role: 'ADMIN' },
    { id: 2, username: 'operador1', nome: 'João da Silva', role: 'PADRAO' },
    { id: 3, username: 'operador2', nome: 'Maria Oliveira', role: 'PADRAO' }
];

// Generate a grid of graves
const generateGravesForCemetery = (cemiterioId: number, startId: number): GraveDisplay[] => {
    const graves: GraveDisplay[] = [];
    // Cemiterio 1: Mais antigo, misto
    // Cemiterio 2: Novo, mais organizado (Padrao Parque)
    
    const rows = cemiterioId === 1 ? 6 : 5;
    const cols = cemiterioId === 1 ? 8 : 10;
    
    let count = startId;
    for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
            const rand = Math.random();
            let tipo = TipoSepultura.JAZIGO;
            let numGavetas = 1;

            if (cemiterioId === 1) {
                // Lógica antiga para o Cemitério 1
                if (rand < 0.15) { tipo = TipoSepultura.COVA; numGavetas = 1; }
                else if (rand < 0.30) { tipo = TipoSepultura.JAZIGO; numGavetas = 1; }
                else if (rand < 0.40) { tipo = TipoSepultura.JAZIGO; numGavetas = 2; }
                else if (rand < 0.50) { tipo = TipoSepultura.JAZIGO; numGavetas = 3; }
                else if (rand < 0.70) { tipo = TipoSepultura.JAZIGO; numGavetas = 6; }
                else if (rand < 0.85) { tipo = TipoSepultura.TUMULO; numGavetas = 2; }
                else { tipo = TipoSepultura.CAPELA; numGavetas = 3; }
            } else {
                // Cemitério 2 é majoritariamente gramado (Cova/Jazigo simples)
                if (rand < 0.6) { tipo = TipoSepultura.COVA; numGavetas = 1; }
                else { tipo = TipoSepultura.JAZIGO; numGavetas = 1; }
            }

            // Generate each gaveta for the lot
            for (let i = 1; i <= numGavetas; i++) {
                // Random Status Selection for each gaveta
                let status = StatusSepultura.LIVRE;
                const randStatus = Math.random();

                if (cemiterioId === 1) {
                    if (randStatus < 0.4) status = StatusSepultura.OCUPADO;
                    else if (randStatus < 0.55) status = StatusSepultura.LIVRE;
                    else if (randStatus < 0.65) status = StatusSepultura.CONSTRUIDO;
                    else if (randStatus < 0.75) status = StatusSepultura.RESERVADO;
                    else if (randStatus < 0.85) status = StatusSepultura.EXUMADO;
                    else if (randStatus < 0.95) status = StatusSepultura.EM_MANUTENCAO;
                    else status = StatusSepultura.DEMOLIDO;
                } else {
                    if (randStatus < 0.2) status = StatusSepultura.OCUPADO;
                    else if (randStatus < 0.3) status = StatusSepultura.RESERVADO;
                    else status = StatusSepultura.LIVRE;
                }

                // If multi-gaveta, ensure infrastructure status makes sense (if parent is built)
                // For simlification, treating status per gaveta individually for 'OCUPADO'/'LIVRE'
                // But 'CONSTRUIDO' usually applies to the whole lot. 
                // Let's randomize occupation mainly.

                const isOccupied = status === StatusSepultura.OCUPADO;
                
                // Mock image
                const mockPhotos = (isOccupied || status === StatusSepultura.CONSTRUIDO || tipo === TipoSepultura.CAPELA) && Math.random() > 0.7 
                    ? ['https://images.unsplash.com/photo-1595856417740-42b781b0a8f8?auto=format&fit=crop&q=80&w=300'] 
                    : [];

                // Identification: if 1 gaveta, use S{c}, if multi, use G{i}
                const sepulturaId = numGavetas > 1 ? `G${i}` : `S${c}`;

                graves.push({
                    id: count,
                    cemiterioId: cemiterioId,
                    alameda: cemiterioId === 1 ? "Principal" : "Ipês",
                    quadra: cemiterioId === 1 ? "A" : (r > 3 ? "B" : "A"), // Divide em quadras
                    lote: `L${(r - 1) * cols + c}`, // Unique Lote ID based on grid position
                    sepultura: sepulturaId,
                    tipoSepultura: tipo,
                    numGavetas: numGavetas,
                    status: status,
                    anexos: mockPhotos,
                    falecido: isOccupied ? {
                        id: count,
                        nome: `Falecido ${count}`,
                        dataNascimento: "1950-01-01",
                        dataObito: "2024-01-15",
                        causaObito: "Causas Naturais",
                        fichaAmarelaNro: `FA-${1000 + count}`,
                        orgaoEmissao: "SES-CE"
                    } : undefined
                });
                count++;
            }
        }
    }
    return graves;
};

// Data to support Genealogy Tree visualization
const familyGraves: GraveDisplay[] = [
    {
        id: 9001, cemiterioId: 1, alameda: 'Principal', quadra: 'A', lote: '1', sepultura: 'S1', tipoSepultura: TipoSepultura.JAZIGO, numGavetas: 1, status: StatusSepultura.OCUPADO, nomeFamilia: 'Silva',
        falecido: { id: 9001, nome: 'tercio', dataNascimento: '1980-01-01', dataObito: '2050-01-01', causaObito: 'Natural', fichaAmarelaNro: '001', orgaoEmissao: 'SSP', familia: 'Silva', foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' }
    },
    {
        id: 9002, cemiterioId: 1, alameda: 'Principal', quadra: 'A', lote: '1', sepultura: 'G3', tipoSepultura: TipoSepultura.JAZIGO, numGavetas: 3, status: StatusSepultura.OCUPADO, nomeFamilia: 'Silva',
        falecido: { id: 9002, nome: 'pc', nomePai: 'tercio', dataNascimento: '2025-01-01', dataObito: '2025-12-31', causaObito: 'Natural', fichaAmarelaNro: '002', orgaoEmissao: 'SSP', familia: 'Silva', foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }
    },
    {
        id: 9003, cemiterioId: 1, alameda: 'Principal', quadra: 'A', lote: '1', sepultura: 'G2', tipoSepultura: TipoSepultura.JAZIGO, numGavetas: 3, status: StatusSepultura.OCUPADO, nomeFamilia: 'Silva',
        falecido: { id: 9003, nome: 'madalena', nomePai: 'pc', dataNascimento: '2025-01-01', dataObito: '2025-12-31', causaObito: 'Natural', fichaAmarelaNro: '003', orgaoEmissao: 'SSP', familia: 'Silva' }
    }
];

export const generateMockGraves = (): GraveDisplay[] => {
    const cemetery1 = generateGravesForCemetery(1, 1);
    const cemetery2 = generateGravesForCemetery(2, 5000); // IDs start higher for cemetery 2
    return [...cemetery1, ...cemetery2, ...familyGraves];
};

export const MOCK_GRAVES = generateMockGraves();

export const MOCK_MESSAGES: ChatMessage[] = [
    { id: 1, senderId: 2, receiverId: 1, content: "Olá Admin, preciso de ajuda com um registro.", timestamp: new Date(Date.now() - 86400000).toISOString(), isRead: true },
    { id: 2, senderId: 1, receiverId: 2, content: "Olá João. Qual a dúvida?", timestamp: new Date(Date.now() - 86000000).toISOString(), isRead: true },
    { id: 3, senderId: 3, receiverId: 1, content: "Solicitei uma exumação na Quadra B.", timestamp: new Date(Date.now() - 3600000).toISOString(), isRead: false },
];

export const MENU_ITEMS = [
    { id: 'home', label: 'Início', icon: 'Home' },
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'map', label: 'Mapa Digital', icon: 'Map' },
    { id: 'genealogy', label: 'Árvore Genealógica', icon: 'TreeDeciduous' },
    { id: 'registry', label: 'Registros', icon: 'FileText' },
    { id: 'search', label: 'Consultas', icon: 'Search' },
    { id: 'users-management', label: 'Usuários', icon: 'Users' },
    { id: 'ai-assistant', label: 'Assistente IA', icon: 'Bot' },
    { id: 'internal-chat', label: 'Chat Interno', icon: 'MessageSquareText' },
    { id: 'reports', label: 'Relatórios', icon: 'BarChart' },
];
