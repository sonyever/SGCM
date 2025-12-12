

// Enums for Status control
export enum StatusSepultura {
    LIVRE = 'LIVRE',
    OCUPADO = 'OCUPADO',
    RESERVADO = 'RESERVADO',
    EXUMADO = 'EXUMADO',
    CONSTRUIDO = 'CONSTRUÍDO',
    EM_MANUTENCAO = 'EM MANUTENÇÃO',
    DEMOLIDO = 'DEMOLIDO'
}

export enum TipoSepultura {
    TUMULO = 'TÚMULO',
    CAPELA = 'CAPELA TUMULAR',
    JAZIGO = 'JAZIGO',
    COVA = 'COVA (TERRA)',
    OSSUARIO = 'OSSUÁRIO'
}

export enum CargoFuncionario {
    COVEIRO = 'COVEIRO',
    SERVICOS_GERAIS = 'SERVIÇOS GERAIS',
    ADMINISTRATIVO = 'ADMINISTRATIVO',
    VIGIA = 'VIGIA'
}

export type UserRole = 'ADMIN' | 'PADRAO' | 'PUBLIC';

export interface SystemUser {
    id: number;
    username: string;
    nome: string;
    role: UserRole;
    foto?: string; // Foto de perfil
    password?: string; // Opcional para verificação em memória
}

// Entities based on PRD Section 4
export interface Cemiterio {
    id: number;
    nome: string;
    endereco: string;
    cep?: string;        // Added field
    telefone?: string;   // Added field
    latitude?: number;
    longitude?: number;
    responsavel?: string; // Nome do responsável pelo cemitério
}

export interface Localizacao {
    id: number;
    cemiterioId: number;
    alameda: string;
    quadra: string;
    lote: string;
    sepultura: string;
    tipoSepultura: TipoSepultura;
    numGavetas?: number; // Added field for capacity
    status: StatusSepultura;
    nomeFamilia?: string; // Added field for Family Name display on map
    coordenadas?: { lat: number; lng: number }; // RF 2.1.5
    anexos?: string[]; // RF 2.1.6 - URLs or Base64 strings of photos
    // Root level dates for external reading requirements
    dataNascimento?: string; 
    dataObito?: string;
}

export interface Falecido {
    id: number;
    nome: string;
    dataNascimento: string;
    dataObito: string;
    causaObito: string;
    fichaAmarelaNro: string;
    orgaoEmissao: string;
    
    // Novos campos adicionados (Opcionais para não quebrar legado)
    foto?: string; // Base64 or URL
    horaObito?: string;
    naturalidade?: string;
    nomePai?: string;
    nomeMae?: string;
    sexo?: string; // 'M' | 'F'
    racaCor?: string;
    estadoCivil?: string;
    escolaridade?: string;
    ocupacaoHabitual?: string;
    
    // Residência
    enderecoResidencial?: string;
    numeroResidencial?: string; // Added
    bairroResidencial?: string; // Added
    municipioResidencial?: string;
    cepResidencial?: string;

    // Ocorrência
    localOcorrencia?: string; // Estabelecimento
    enderecoOcorrencia?: string;
    municipioOcorrencia?: string;
    
    // Causas Extras
    causasAntecedentes?: string;

    // Médico
    nomeMedico?: string;
    crmMedico?: string;
    tipoAtestado?: string;
    telefoneMedico?: string;

    // Outros
    familia?: string; // Added
}

export interface Responsavel {
    id: number;
    nome: string;
    documento: string; // CPF/RG
    telefone: string;
    endereco: string;
    // Campos novos para testemunhas
    testemunha1?: string;
    testemunha2?: string;
}

export interface Funcionario {
    id: number;
    nome: string;
    cargo: CargoFuncionario;
    matricula: string;
}

// Mantido para compatibilidade com código existente
export interface Coveiro extends Funcionario {} 

export interface Sepultamento {
    id: number;
    falecidoId: number;
    localizacaoId: number;
    responsavelId: number;
    coveiroId: number;
    dataSepultamento: string;
    autorizacaoNro: string;
    controleNro: string; // Internal control number
}

// Combined type for UI display
export interface GraveDisplay extends Localizacao {
    falecido?: Falecido; // If occupied
    responsavel?: Responsavel;
    sepultamento?: Sepultamento;
}

// Stats Interface
export interface DashboardStats {
    totalSepulturas: number;
    ocupadas: number;
    livres: number;
    exumadas: number;
    sepultamentosEsteMes: number;
}

export interface AuditLog {
    id: number;
    action: string;
    targetId: string;
    details: string;
    performedBy: string; // "Admin" or "User"
    timestamp: string;
}

export interface SystemNotice {
    id: number;
    type: 'MANUTENCAO' | 'LIMPEZA' | 'EXUMACAO' | 'OUTROS';
    title: string;
    description: string;
    date: string;
    isRead: boolean;
}

// Chat Types
export interface ChatMessage {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    timestamp: string;
    isRead: boolean;
}