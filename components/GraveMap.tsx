
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GraveDisplay, StatusSepultura, TipoSepultura, Cemiterio, Funcionario, CargoFuncionario, UserRole, AuditLog, SystemUser } from '../types';
import { PasswordConfirmationModal } from './PasswordConfirmationModal';
import { ACTION_PASSWORD } from '../constants';
import { RegistryForm, BurialFormData } from './RegistryForm';
import { 
    X, User, Calendar, FileText, Camera, Image as ImageIcon, Trash2, 
    Upload, History, ArrowDown, ArrowUp, UserCheck, Filter,
    Home, Layers, Leaf, Landmark, Hammer, Ban, Box, AlertTriangle, MapPin, UserMinus, FileCheck, Lock, Printer, Archive, Info, ShieldAlert, CheckCircle, Construction, UserPlus, Shovel, ClipboardList, ArrowRight, Gavel, Paperclip
} from 'lucide-react';

interface GraveMapProps {
    graves: GraveDisplay[];
    cemiterios: Cemiterio[];
    coveiros: Funcionario[];
    onGraveUpdate: (grave: GraveDisplay, logAction?: string, logDetails?: string) => void;
    onRegistryBurial: (data: BurialFormData) => Promise<boolean>;
    onDeleteBurial: (data: BurialFormData) => Promise<boolean>;
    systemUsers?: SystemUser[];
    initialSelectedGrave?: GraveDisplay | null;
    currentUserRole?: UserRole; // Default to ADMIN if not passed
    currentSessionPassword?: string;
    auditLogs?: AuditLog[];
}

export const GraveMap: React.FC<GraveMapProps> = ({ 
    graves, 
    cemiterios, 
    coveiros, 
    onGraveUpdate, 
    onRegistryBurial,
    onDeleteBurial,
    systemUsers = [],
    initialSelectedGrave,
    currentUserRole = 'ADMIN',
    currentSessionPassword,
    auditLogs = []
}) => {
    const [selectedCemiterioId, setSelectedCemiterioId] = useState<number>(cemiterios.length > 0 ? cemiterios[0].id : 1);
    const [selectedGrave, setSelectedGrave] = useState<GraveDisplay | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [showLegend, setShowLegend] = useState(false); // Default closed on mobile

    // Admin Edit Mode
    const [isEditMode, setIsEditMode] = useState(false);

    // Form states
    const [isExhumationModalOpen, setIsExhumationModalOpen] = useState(false);
    const [isConstructionModalOpen, setIsConstructionModalOpen] = useState(false);
    
    // Registry Modal State
    const [isRegistryModalOpen, setIsRegistryModalOpen] = useState(false);
    const [registryInitialData, setRegistryInitialData] = useState<Partial<BurialFormData> | null>(null);

    const [exhumationForm, setExhumationForm] = useState({
        dataExumacao: new Date().toISOString().split('T')[0],
        horaExumacao: '',
        numeroProcesso: '',
        motivo: 'TRANSFERENCIA', // TRANSFERENCIA, OSSUARIO, JUDICIAL, CREMACAO
        destino: '', // Ex: Ossuário Geral, Cemitério X
        solicitanteNome: '',
        solicitanteDoc: '',
        solicitanteContato: '',
        grauParentesco: '',
        coveiroId: '',
        observacoes: '',
        anexoJudicial: '' // Base64 string for the file
    });

    const [constructionForm, setConstructionForm] = useState({
        responsavelNome: '',
        responsavelRg: '',
        responsavelCpf: '',
        responsavelEndereco: '',
        dimensoes: '2,00m x 2,60m',
        descricao: '',
        numeroAutorizacao: '',
        observacao: '',
        nomeCemiterio: ''
    });

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<'SAVE_EDIT' | 'EXHUMATION' | 'REMOVE_BURIAL' | 'RESERVE' | 'DEMOLISH' | 'MAINTENANCE' | 'FREE_SPOT' | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const structureFileInputRef = useRef<HTMLInputElement>(null);
    const judicialFileInputRef = useRef<HTMLInputElement>(null);

    // ... (Existing effects and grouping logic remains same)
    useEffect(() => {
        if (initialSelectedGrave) {
            setSelectedCemiterioId(initialSelectedGrave.cemiterioId);
            setSelectedGrave(initialSelectedGrave);
        }
    }, [initialSelectedGrave]);

    useEffect(() => {
        if (isConstructionModalOpen) {
            // Generate auth number regardless of selected grave
            const currentYear = new Date().getFullYear();
            const randomSeq = Math.floor(Math.random() * 900) + 100;
            
            // Get cemetery name
            const selectedCem = cemiterios.find(c => c.id === Number(selectedCemiterioId));

            setConstructionForm(prev => {
                const newData = {
                    ...prev,
                    numeroAutorizacao: `${randomSeq}/${currentYear}-OBRAS`,
                    nomeCemiterio: selectedCem ? selectedCem.nome : ''
                };
                
                // If a grave is selected, pre-fill data
                if (selectedGrave) {
                    const desc = selectedGrave.numGavetas && selectedGrave.numGavetas > 1 
                        ? `${selectedGrave.tipoSepultura} (${selectedGrave.numGavetas} GAVETAS)` 
                        : selectedGrave.tipoSepultura;
                    
                    newData.descricao = desc;
                    newData.responsavelNome = selectedGrave.responsavel?.nome || '';
                    newData.responsavelCpf = selectedGrave.responsavel?.documento || '';
                    newData.responsavelEndereco = selectedGrave.responsavel?.endereco || '';
                }
                
                return newData;
            });
        }
    }, [isConstructionModalOpen, selectedGrave, selectedCemiterioId, cemiterios]);

    const filteredGraves = useMemo(() => {
        return graves.filter(g => {
            const matchesCemiterio = g.cemiterioId === Number(selectedCemiterioId);
            const matchesStatus = filterStatus === 'ALL' || g.status === filterStatus;
            const matchesType = filterType === 'ALL' || g.tipoSepultura === filterType;
            return matchesCemiterio && matchesStatus && matchesType;
        });
    }, [graves, selectedCemiterioId, filterStatus, filterType]);

    const groupedLotes = useMemo(() => {
        const groups: Record<string, GraveDisplay[]> = {};
        filteredGraves.forEach(g => {
            const key = `${g.quadra}-${g.lote}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(g);
        });
        return Object.values(groups).sort((a, b) => {
            if (a[0].quadra !== b[0].quadra) return a[0].quadra.localeCompare(b[0].quadra);
            const loteA = parseInt(a[0].lote.replace(/\D/g, '')) || 0;
            const loteB = parseInt(b[0].lote.replace(/\D/g, '')) || 0;
            return loteA - loteB;
        });
    }, [filteredGraves]);

    const getStatusClasses = (status: StatusSepultura, isMini = false) => {
        const base = isMini ? '' : 'hover:scale-105 transition-transform';
        switch (status) {
            case StatusSepultura.LIVRE: return `bg-emerald-500 hover:bg-emerald-600 text-white ${base}`;
            case StatusSepultura.OCUPADO: return `bg-red-500 hover:bg-red-600 text-white ${base}`;
            case StatusSepultura.EXUMADO: return `bg-yellow-400 hover:bg-yellow-500 text-yellow-950 ${base}`; 
            case StatusSepultura.RESERVADO: return `bg-blue-400 hover:bg-blue-500 text-white ${base}`;
            case StatusSepultura.CONSTRUIDO: return `bg-cyan-600 hover:bg-cyan-700 text-white ${base}`;
            case StatusSepultura.EM_MANUTENCAO: return `bg-orange-400 hover:bg-orange-500 text-white ${base}`;
            case StatusSepultura.DEMOLIDO: return `bg-slate-800 hover:bg-slate-900 text-white ${base}`;
            default: return `bg-gray-300 text-slate-600 ${base}`;
        }
    };

    const getTypeIcon = (tipo: TipoSepultura) => {
        switch (tipo) {
            case TipoSepultura.CAPELA: return <Home size={14} />;
            case TipoSepultura.TUMULO: return <Landmark size={14} />;
            case TipoSepultura.COVA: return <Leaf size={14} />;
            case TipoSepultura.JAZIGO: return <Layers size={14} />;
            case TipoSepultura.OSSUARIO: return <Archive size={14} />;
            default: return <Box size={14} />;
        }
    };

    // Prepare data for registry modal
    const handleOpenRegistry = (grave: GraveDisplay) => {
        const initialForm: Partial<BurialFormData> = {
            cemiterioId: grave.cemiterioId.toString(),
            quadra: grave.quadra,
            lote: grave.lote,
            sepultura: grave.sepultura,
        };

        if (grave.status === StatusSepultura.OCUPADO && grave.falecido) {
            initialForm.nome = grave.falecido.nome;
            initialForm.dataNascimento = grave.falecido.dataNascimento;
            initialForm.dataObito = grave.falecido.dataObito;
            initialForm.fichaAmarela = grave.falecido.fichaAmarelaNro;
            initialForm.orgaoEmissao = grave.falecido.orgaoEmissao;
            initialForm.causaObito = grave.falecido.causaObito;
            initialForm.foto = grave.falecido.foto; // Pass foto if exists
            
            if (grave.responsavel) {
                initialForm.responsavelNome = grave.responsavel.nome;
                initialForm.responsavelDoc = grave.responsavel.documento;
                initialForm.responsavelTel = grave.responsavel.telefone;
            }

            if (grave.sepultamento) {
                initialForm.coveiroId = grave.sepultamento.coveiroId.toString();
                initialForm.autorizacao = grave.sepultamento.autorizacaoNro;
            }
        }

        setRegistryInitialData(initialForm);
        setSelectedGrave(null); // Close the detail modal
        setIsRegistryModalOpen(true); // Open the registry modal
    };

    // Actions
    const openExhumationForm = () => {
        if (currentUserRole !== 'ADMIN') {
            alert("Apenas Administradores podem realizar exumações.");
            return;
        }
        // Pre-fill if possible
        setExhumationForm(prev => ({
            ...prev,
            solicitanteNome: selectedGrave?.responsavel?.nome || '',
            solicitanteDoc: selectedGrave?.responsavel?.documento || '',
            solicitanteContato: selectedGrave?.responsavel?.telefone || ''
        }));
        setIsExhumationModalOpen(true);
    };

    const handleJudicialFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setExhumationForm(prev => ({
                    ...prev,
                    anexoJudicial: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExhumationSubmit = () => {
        if (!exhumationForm.dataExumacao || !exhumationForm.coveiroId || !exhumationForm.motivo) {
            alert("Preencha os campos obrigatórios (Data, Motivo, Coveiro).");
            return;
        }
        
        if (exhumationForm.motivo === 'JUDICIAL' && !exhumationForm.anexoJudicial) {
            if(!confirm("Motivo Judicial selecionado mas nenhum documento foi anexado. Deseja continuar mesmo assim?")) {
                return;
            }
        }

        setPendingAction('EXHUMATION');
        setIsPasswordModalOpen(true);
    };

    const initiateSaveEdit = () => {
        if (currentUserRole !== 'ADMIN') {
            alert("Apenas Administradores podem editar registros.");
            return;
        }
        setPendingAction('SAVE_EDIT');
        setIsPasswordModalOpen(true);
    };

    const initiateAction = (action: typeof pendingAction) => {
        if (currentUserRole !== 'ADMIN') {
            alert("Apenas Administradores podem realizar esta ação.");
            return;
        }
        setPendingAction(action);
        setIsPasswordModalOpen(true);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && selectedGrave && selectedGrave.falecido) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedGrave({
                    ...selectedGrave,
                    falecido: {
                        ...selectedGrave.falecido!,
                        foto: reader.result as string
                    }
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStructurePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && selectedGrave) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newPhoto = reader.result as string;
                const currentAnexos = selectedGrave.anexos || [];
                setSelectedGrave({
                    ...selectedGrave,
                    anexos: [...currentAnexos, newPhoto]
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveStructurePhoto = (index: number) => {
        if (selectedGrave && selectedGrave.anexos) {
            const newAnexos = [...selectedGrave.anexos];
            newAnexos.splice(index, 1);
            setSelectedGrave({
                ...selectedGrave,
                anexos: newAnexos
            });
        }
    };

    const handleActionConfirmed = () => {
        // ... (Existing implementation)
        if (!selectedGrave) return;
        
        let updatedGrave: GraveDisplay | null = null;
        let logAction = '';
        let logDetail = '';

        if (pendingAction === 'EXHUMATION') {
            updatedGrave = { ...selectedGrave, status: StatusSepultura.EXUMADO };
            logAction = 'EXUMACAO';
            logDetail = `Exumação: ${selectedGrave.falecido?.nome}. Motivo: ${exhumationForm.motivo}. Destino: ${exhumationForm.destino}. Proc: ${exhumationForm.numeroProcesso}`;
            if (exhumationForm.anexoJudicial) {
                logDetail += " (Ordem Judicial Anexada)";
            }
            setIsExhumationModalOpen(false);
        } else if (pendingAction === 'SAVE_EDIT') {
            updatedGrave = selectedGrave;
            logAction = 'EDICAO_SEPULTURA';
            logDetail = `Dados da sepultura ${selectedGrave.sepultura} atualizados manualmente`;
            setSelectedGrave(null); // Close modal on save
        } else if (pendingAction === 'REMOVE_BURIAL') {
            updatedGrave = { 
                ...selectedGrave, 
                status: StatusSepultura.LIVRE,
                falecido: undefined,
                responsavel: undefined,
                sepultamento: undefined
            };
            logAction = 'REMOCAO_SEPULTAMENTO';
            logDetail = `Sepultamento removido manualmente da sepultura ${selectedGrave.sepultura}`;
        } else if (pendingAction === 'RESERVE') {
            updatedGrave = { ...selectedGrave, status: StatusSepultura.RESERVADO };
            logAction = 'RESERVA_SEPULTURA';
            logDetail = `Status alterado para RESERVADO na sepultura ${selectedGrave.sepultura}`;
        } else if (pendingAction === 'DEMOLISH') {
            updatedGrave = { ...selectedGrave, status: StatusSepultura.DEMOLIDO };
            logAction = 'DEMOLICAO_SEPULTURA';
            logDetail = `Sepultura ${selectedGrave.sepultura} marcada como DEMOLIDA`;
        } else if (pendingAction === 'MAINTENANCE') {
            updatedGrave = { ...selectedGrave, status: StatusSepultura.EM_MANUTENCAO };
            logAction = 'INICIO_MANUTENCAO';
            logDetail = `Status alterado para EM MANUTENÇÃO na sepultura ${selectedGrave.sepultura}`;
        } else if (pendingAction === 'FREE_SPOT') {
            updatedGrave = { 
                ...selectedGrave, 
                status: StatusSepultura.LIVRE,
                // Keep history/structures but mark as free to use
            };
            logAction = 'LIBERACAO_SEPULTURA';
            logDetail = `Sepultura ${selectedGrave.sepultura} liberada (Status alterado para LIVRE)`;
        }

        if (updatedGrave) {
            onGraveUpdate(updatedGrave, logAction, logDetail);
            if (pendingAction !== 'SAVE_EDIT') setSelectedGrave(null); 
            setIsEditMode(false);
            if(pendingAction === 'SAVE_EDIT') alert("Alterações salvas e registradas no log.");
            else alert("Ação realizada com sucesso.");
        }
        setPendingAction(null);
    };

    const printExhumationGuide = () => {
         // ... (Existing implementation)
        const content = `
        <html>
        <head>
            <title>Guia de Exumação</title>
            <style>
                @page { size: A4; margin: 20mm; }
                body { font-family: "Times New Roman", serif; padding: 0; max-width: 800px; margin: 0 auto; color: #000; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                .logo-img { height: 70px; object-fit: contain; }
                .logo { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-top: 5px; }
                .subtitle { font-size: 12px; font-weight: bold; }
                .doc-title { text-align: center; font-size: 18px; font-weight: bold; text-transform: uppercase; border: 1px solid #000; padding: 10px; margin: 20px 0; background: #f0f0f0; }
                .section { margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; }
                .section-title { font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #ccc; margin-bottom: 10px; font-size: 12px; background: #eee; padding: 2px 5px; }
                .row { display: flex; margin-bottom: 8px; font-size: 14px; }
                .label { font-weight: bold; width: 140px; }
                .value { flex: 1; border-bottom: 1px dotted #999; }
                .signatures { margin-top: 50px; display: flex; justify-content: space-between; gap: 20px; }
                .sig-line { text-align: center; border-top: 1px solid #000; padding-top: 5px; flex: 1; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="https://www.madalena.ce.gov.br/link/link153.png" alt="Brasão" class="logo-img" />
                <div class="logo">Prefeitura Municipal de Madalena</div>
                <div class="subtitle">Secretaria de Infraestrutura e Serviços Públicos</div>
            </div>

            <div class="doc-title">Guia de Autorização de Exumação</div>

            <div class="section">
                <div class="section-title">Dados do Falecido</div>
                <div class="row"><span class="label">Nome:</span><span class="value">${selectedGrave?.falecido?.nome}</span></div>
                <div class="row"><span class="label">Data Sepultamento:</span><span class="value">${selectedGrave?.sepultamento?.dataSepultamento ? new Date(selectedGrave.sepultamento.dataSepultamento).toLocaleDateString() : 'N/A'}</span></div>
                <div class="row"><span class="label">Localização:</span><span class="value">Quadra ${selectedGrave?.quadra}, Lote ${selectedGrave?.lote}, Sepultura ${selectedGrave?.sepultura}</span></div>
            </div>

            <div class="section">
                <div class="section-title">Detalhes da Exumação</div>
                <div class="row"><span class="label">Data Prevista:</span><span class="value">${new Date(exhumationForm.dataExumacao).toLocaleDateString()} às ${exhumationForm.horaExumacao}</span></div>
                <div class="row"><span class="label">Motivo:</span><span class="value">${exhumationForm.motivo}</span></div>
                <div class="row"><span class="label">Destino:</span><span class="value">${exhumationForm.destino}</span></div>
                <div class="row"><span class="label">Nº Processo/Aut:</span><span class="value">${exhumationForm.numeroProcesso || 'N/A'}</span></div>
                ${exhumationForm.motivo === 'JUDICIAL' ? `
                <div class="row" style="margin-top: 10px; background: #f9f9f9; padding: 5px;">
                    <span class="label" style="width: auto; margin-right: 10px;">[ x ] ORDEM JUDICIAL ANEXADA AO PROCESSO</span>
                </div>
                ` : ''}
            </div>

            <div class="section">
                <div class="section-title">Responsável / Solicitante</div>
                <div class="row"><span class="label">Nome:</span><span class="value">${exhumationForm.solicitanteNome}</span></div>
                <div class="row"><span class="label">Documento:</span><span class="value">${exhumationForm.solicitanteDoc}</span></div>
                <div class="row"><span class="label">Parentesco:</span><span class="value">${exhumationForm.grauParentesco}</span></div>
            </div>

             <div class="signatures">
                <div class="sig-line">Responsável (Solicitante)</div>
                <div class="sig-line">Administrador do Cemitério</div>
                <div class="sig-line">Autoridade Sanitária/Judicial</div>
            </div>

            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
        `;

        const win = window.open('', '_blank');
        win?.document.write(content);
        win?.document.close();
    };

    const printConstructionAuth = () => {
         // ... (Existing implementation)
        const content = `
        <html>
        <head>
            <title>Autorização de Construção - ${constructionForm.numeroAutorizacao}</title>
            <style>
                @page { size: A4; margin: 20mm; }
                body { font-family: "Times New Roman", Times, serif; padding: 0; max-width: 800px; margin: 0 auto; color: #000; line-height: 1.5; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                .logo-img { height: 80px; margin-bottom: 10px; object-fit: contain; }
                .logo { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                .subtitle { font-size: 14px; font-weight: bold; margin-top: 5px; }
                .auth-box { text-align: center; margin: 30px 0; }
                .auth-title { font-size: 20px; font-weight: bold; text-transform: uppercase; border: 1px solid #000; padding: 10px 20px; display: inline-block; }
                .auth-number { font-size: 16px; font-weight: bold; margin-top: 10px; }
                .content { font-size: 16px; line-height: 2.2; text-align: justify; margin-bottom: 30px; text-indent: 40px; }
                .observation-box { margin-top: 20px; border: 1px dashed #666; padding: 15px; background-color: #f9f9f9; font-size: 14px; }
                .observation-label { font-weight: bold; text-decoration: underline; margin-bottom: 5px; display: block; }
                .date { text-align: right; margin-top: 60px; font-size: 16px; }
                .signatures { margin-top: 80px; display: flex; justify-content: space-between; gap: 40px; }
                .signature-line { text-align: center; border-top: 1px solid #000; padding-top: 10px; flex: 1; font-size: 14px; }
                @media print { body { -webkit-print-color-adjust: exact; } }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="https://www.madalena.ce.gov.br/link/link153.png" alt="Brasão" class="logo-img" />
                <div class="logo">Prefeitura Municipal de Madalena</div>
                <div class="subtitle">Secretaria de Infraestrutura e Serviços Públicos</div>
            </div>

            <div class="auth-box">
                <div class="auth-title">Autorização de Construção de Túmulo</div>
                <div class="auth-number">Nº ${constructionForm.numeroAutorizacao}</div>
            </div>

            <div class="content">
                Autorizo o(a) Sr(a). <strong>${constructionForm.responsavelNome.toUpperCase()}</strong>, 
                portador(a) do RG nº ${constructionForm.responsavelRg} e CPF nº ${constructionForm.responsavelCpf}, 
                residente e domiciliado(a) na ${constructionForm.responsavelEndereco}, neste município, 
                a proceder com a construção de um túmulo medindo <strong>${constructionForm.dimensoes}</strong> 
                (Tipo: ${constructionForm.descricao.toUpperCase()}), no <strong>${constructionForm.nomeCemiterio}</strong>.
            </div>

            ${constructionForm.observacao ? `
            <div class="observation-box">
                <span class="observation-label">OBSERVAÇÕES:</span>
                ${constructionForm.observacao}
            </div>
            ` : ''}

            <div class="date">
                Madalena - CE, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </div>

            <div class="signatures">
                <div class="signature-line">
                    <strong>Responsável Autorizado</strong><br>
                    CPF: ${constructionForm.responsavelCpf}
                </div>
                <div class="signature-line">
                    <strong>Secretário(a) de Infraestrutura</strong><br>
                    Prefeitura de Madalena
                </div>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() { window.close(); };
                };
            </script>
        </body>
        </html>
        `;
        
        setIsConstructionModalOpen(false);
        const win = window.open('', '_blank');
        win?.document.write(content);
        win?.document.close();
    };

    // Filter relevant logs for the selected grave
    const graveLogs = useMemo(() => {
        if (!selectedGrave) return [];
        return auditLogs.filter(log => 
            log.targetId === selectedGrave.sepultura || 
            log.targetId === selectedGrave.lote ||
            (selectedGrave.falecido && log.details.includes(selectedGrave.falecido.nome))
        );
    }, [selectedGrave, auditLogs]);

    const getRequiredPassword = () => {
        if (currentUserRole === 'ADMIN') return ACTION_PASSWORD;
        return currentSessionPassword;
    };

    const getModalDescription = () => {
        if (pendingAction === 'REMOVE_BURIAL') return "ATENÇÃO: Você está removendo o registro de sepultamento desta sepultura. O histórico será mantido, mas a vaga ficará LIVRE.";
        if (pendingAction === 'DEMOLISH') return "ATENÇÃO: Esta ação marcará a sepultura como DEMOLIDA.";
        if (pendingAction === 'FREE_SPOT') return "ATENÇÃO: Esta ação liberará a sepultura para novos sepultamentos (Status LIVRE).";
        if (currentUserRole === 'ADMIN') return "Digite a senha administrativa para confirmar a ação.";
        return "Digite sua senha de login para confirmar a ação.";
    };
    
    // Classes for Exhumation Form
    const FormLabel = "block text-[10px] font-bold text-slate-500 uppercase mb-1";
    const FormInput = "w-full border border-slate-300 p-2.5 rounded text-sm outline-none focus:border-red-500";

    return (
        <div className="h-full flex flex-col space-y-4">
             <PasswordConfirmationModal 
                isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onConfirm={handleActionConfirmed}
                title={pendingAction === 'EXHUMATION' ? 'Confirmar Exumação' : 'Confirmar Ação'}
                requiredPassword={getRequiredPassword()}
                description={getModalDescription()}
            />

            {/* REGISTRY MODAL (Embedded) */}
            {isRegistryModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b bg-emerald-50">
                            <h3 className="font-bold text-lg text-emerald-900 flex items-center gap-2">
                                <FileText size={20}/> Registro de Sepultamento
                            </h3>
                            <button 
                                onClick={() => setIsRegistryModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-emerald-100"
                            >
                                <X size={24}/>
                            </button>
                        </div>
                        <div className="p-4 sm:p-6">
                            <RegistryForm 
                                cemiterios={cemiterios}
                                funcionarios={coveiros}
                                systemUsers={systemUsers}
                                onRegistryBurial={async (data) => {
                                    const success = await onRegistryBurial(data);
                                    if(success) setIsRegistryModalOpen(false);
                                    return success;
                                }}
                                onDeleteBurial={async (data) => {
                                    const success = await onDeleteBurial(data);
                                    if(success) setIsRegistryModalOpen(false);
                                    return success;
                                }}
                                onAddGrave={async () => true}
                                onAddEmployee={async () => true}
                                onAddCemetery={async () => true}
                                initialData={registryInitialData}
                                currentUserRole={currentUserRole}
                                currentSessionPassword={currentSessionPassword}
                                embeddedMode={true}
                                onCancel={() => setIsRegistryModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
                <div className="space-y-2 w-full xl:w-auto">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Mapa Digital</h2>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative w-full sm:w-auto">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 z-10" size={18} />
                            <select 
                                value={selectedCemiterioId} onChange={(e) => setSelectedCemiterioId(Number(e.target.value))}
                                className="w-full sm:w-auto sm:min-w-[350px] pl-10 pr-12 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-bold outline-none text-sm sm:text-base cursor-pointer hover:bg-emerald-100 transition-colors shadow-sm"
                            >
                                {cemiterios.map(cem => <option key={cem.id} value={cem.id}>{cem.nome}</option>)}
                            </select>
                        </div>
                        {currentUserRole !== 'PUBLIC' && (
                            <button 
                                onClick={() => setIsConstructionModalOpen(true)}
                                className="px-4 py-2 bg-slate-700 text-white hover:bg-slate-800 font-medium rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
                                title="Gerar Autorização de Construção"
                            >
                                <Hammer size={18} /> Construção
                            </button>
                        )}
                    </div>
                </div>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full xl:w-auto">
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-50 p-2 text-sm rounded border border-slate-200 outline-none focus:border-emerald-500 w-full sm:w-auto">
                        <option value="ALL">Todos os Status</option>
                        {Object.values(StatusSepultura).map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <button 
                        onClick={() => setShowLegend(!showLegend)}
                        className={`p-2 rounded border transition-colors flex items-center justify-center gap-2 text-sm w-full sm:w-auto ${showLegend ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}
                    >
                        <Info size={16} /> Legenda
                    </button>
                </div>
            </div>

            {/* LEGEND BAR */}
            {showLegend && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm animate-fade-in text-sm">
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status (Cores)</h4>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Livre</div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-3 h-3 rounded-full bg-red-500"></span> Ocupado</div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-3 h-3 rounded-full bg-blue-400"></span> Reservado</div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-3 h-3 rounded-full bg-yellow-400"></span> Exumado</div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-3 h-3 rounded-full bg-cyan-600"></span> Construído</div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-3 h-3 rounded-full bg-orange-400"></span> Manutenção</div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-3 h-3 rounded-full bg-slate-700"></span> Demolido</div>
                            </div>
                        </div>
                        <div className="w-px bg-slate-100 hidden sm:block"></div>
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipos (Ícones)</h4>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><Leaf size={14} className="text-slate-400"/> Cova</div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><Layers size={14} className="text-slate-400"/> Jazigo</div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><Landmark size={14} className="text-slate-400"/> Túmulo</div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><Home size={14} className="text-slate-400"/> Capela</div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600"><Archive size={14} className="text-slate-400"/> Ossuário</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* GRID DISPLAY */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 overflow-hidden flex flex-col min-h-[400px]">
                <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 min-w-[600px] pb-4">
                        {groupedLotes.map((group) => {
                            const parentGrave = group[0];
                            const isMulti = group.length > 1;

                            if (!isMulti) {
                                return (
                                    <button key={parentGrave.id} onClick={() => setSelectedGrave(parentGrave)} className={`aspect-square rounded-lg shadow-sm flex flex-col items-center justify-center p-2 relative ${getStatusClasses(parentGrave.status)}`}>
                                        <span className="text-[10px] uppercase font-bold opacity-70 absolute top-1 left-2">{parentGrave.lote}</span>
                                        
                                        {/* Type Icon (Always Visible) */}
                                        <div className="absolute top-1.5 right-1.5 opacity-80" title={parentGrave.tipoSepultura}>
                                            {getTypeIcon(parentGrave.tipoSepultura)}
                                        </div>

                                        {/* Display Photo if Available */}
                                        {parentGrave.falecido?.foto ? (
                                            <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden mb-1 bg-slate-200 mt-3">
                                                <img src={parentGrave.falecido.foto} alt="Falecido" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="mt-5"></div>
                                        )}

                                        <span className="font-bold text-lg leading-none">{parentGrave.sepultura.replace('S','')}</span>
                                        
                                        {parentGrave.nomeFamilia && (
                                            <span className="text-[9px] font-semibold mt-1 text-center leading-tight opacity-90 truncate w-full px-1 max-w-full">
                                                {parentGrave.nomeFamilia}
                                            </span>
                                        )}
                                        
                                        {/* Occupied Indicator (Bottom Right) */}
                                        {parentGrave.status === StatusSepultura.OCUPADO && (
                                            <div className="absolute bottom-1 right-1 opacity-60">
                                                <UserMinus size={10} />
                                            </div>
                                        )}
                                    </button>
                                );
                            }
                            return (
                                <div key={parentGrave.lote} className="aspect-square bg-slate-100 rounded-lg shadow-sm border-2 border-slate-300 p-2 flex flex-col relative">
                                    <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-slate-600 uppercase">{parentGrave.lote}</span>{getTypeIcon(parentGrave.tipoSepultura)}</div>
                                    <div className={`flex-1 grid gap-1 ${group.length > 3 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        {group.map(gaveta => (
                                            <button key={gaveta.id} onClick={() => setSelectedGrave(gaveta)} className={`rounded flex flex-col items-center justify-center p-1 text-[10px] font-bold ${getStatusClasses(gaveta.status, true)}`}>
                                                {gaveta.falecido?.foto ? (
                                                    <div className="w-4 h-4 rounded-full border border-white overflow-hidden mb-0.5 bg-slate-200">
                                                        <img src={gaveta.falecido.foto} alt="F" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : null}
                                                <span>{gaveta.sepultura}</span>
                                                {gaveta.nomeFamilia && (
                                                    <span className="text-[8px] font-normal opacity-90 truncate w-full px-0.5 max-w-full text-center">
                                                        {gaveta.nomeFamilia}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* MODAL DETALHES SEPULTURA */}
            {selectedGrave && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="bg-emerald-900 px-6 py-4 flex justify-between items-center text-white sticky top-0 z-10">
                            <h3 className="text-lg font-bold">Detalhes da Sepultura</h3>
                            <button onClick={() => { setSelectedGrave(null); setIsEditMode(false); }} className="hover:bg-emerald-800 p-1 rounded"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Actions Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div className="text-sm font-bold text-slate-500">
                                    Status: <span className="text-emerald-700">{selectedGrave.status}</span>
                                </div>
                                {currentUserRole === 'ADMIN' && (
                                    <button 
                                        onClick={() => setIsEditMode(!isEditMode)} 
                                        className={`px-3 py-1 rounded text-xs font-bold border w-full sm:w-auto ${isEditMode ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'}`}
                                    >
                                        {isEditMode ? 'Modo Edição Ativo' : 'Habilitar Edição'}
                                    </button>
                                )}
                            </div>

                            {/* Grave Data Fields */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Quadra</label>
                                        {isEditMode ? 
                                            <input className="w-full border p-1 text-sm rounded" value={selectedGrave.quadra} onChange={e => setSelectedGrave({...selectedGrave, quadra: e.target.value})} /> : 
                                            <p className="font-bold">{selectedGrave.quadra}</p>
                                        }
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Lote</label>
                                        {isEditMode ? 
                                            <input className="w-full border p-1 text-sm rounded" value={selectedGrave.lote} onChange={e => setSelectedGrave({...selectedGrave, lote: e.target.value})} /> : 
                                            <p className="font-bold">{selectedGrave.lote}</p>
                                        }
                                    </div>
                                    <div className="col-span-2">
                                         <label className="text-xs font-bold text-slate-400 uppercase">Tipo</label>
                                         {isEditMode ? (
                                             <select className="w-full border p-1 text-sm rounded" value={selectedGrave.tipoSepultura} onChange={e => setSelectedGrave({...selectedGrave, tipoSepultura: e.target.value as TipoSepultura})}>
                                                {Object.values(TipoSepultura).map(t => <option key={t} value={t}>{t}</option>)}
                                             </select>
                                         ) : <p className="font-bold">{selectedGrave.tipoSepultura} {selectedGrave.numGavetas && selectedGrave.numGavetas > 1 ? `(${selectedGrave.numGavetas} Gavetas)` : ''}</p>}
                                    </div>
                                    {selectedGrave.nomeFamilia && (
                                        <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                                             <label className="text-xs font-bold text-slate-400 uppercase">Família</label>
                                             <p className="font-bold text-emerald-800">{selectedGrave.nomeFamilia}</p>
                                        </div>
                                    )}
                                    <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                                         <label className="text-xs font-bold text-slate-400 uppercase">Coordenadas</label>
                                         {isEditMode ? (
                                             <div className="flex gap-2">
                                                 <input className="w-full border p-1 text-sm rounded" placeholder="Lat" value={selectedGrave.coordenadas?.lat || ''} onChange={e => setSelectedGrave({...selectedGrave, coordenadas: { ...selectedGrave.coordenadas, lat: parseFloat(e.target.value) || 0, lng: selectedGrave.coordenadas?.lng || 0 }})} />
                                                 <input className="w-full border p-1 text-sm rounded" placeholder="Lng" value={selectedGrave.coordenadas?.lng || ''} onChange={e => setSelectedGrave({...selectedGrave, coordenadas: { ...selectedGrave.coordenadas, lng: parseFloat(e.target.value) || 0, lat: selectedGrave.coordenadas?.lat || 0 }})} />
                                             </div>
                                         ) : (
                                             <div className="flex items-center gap-2">
                                                 <p className="font-bold text-sm">
                                                     {selectedGrave.coordenadas ? `${selectedGrave.coordenadas.lat}, ${selectedGrave.coordenadas.lng}` : 'Não registradas'}
                                                 </p>
                                                 {selectedGrave.coordenadas && (
                                                     <a 
                                                         href={`https://www.google.com/maps/search/?api=1&query=${selectedGrave.coordenadas.lat},${selectedGrave.coordenadas.lng}`}
                                                         target="_blank"
                                                         rel="noopener noreferrer"
                                                         className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                                                     >
                                                         <MapPin size={12} /> Ver no Mapa
                                                     </a>
                                                 )}
                                             </div>
                                         )}
                                    </div>
                                </div>

                                {/* Action Button: Registrar Sepultamento - Moved inside details card */}
                                {(selectedGrave.status === StatusSepultura.LIVRE || selectedGrave.status === StatusSepultura.RESERVADO || selectedGrave.status === StatusSepultura.EXUMADO) && currentUserRole !== 'PUBLIC' && (
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <button 
                                            onClick={() => handleOpenRegistry(selectedGrave)}
                                            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
                                        >
                                            <UserPlus size={20} />
                                            Registrar Sepultamento
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Estrutura / Fotos */}
                            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                                <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                    <ImageIcon size={16}/> Fotos da Estrutura
                                </h4>
                                
                                {selectedGrave.anexos && selectedGrave.anexos.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {selectedGrave.anexos.map((photo, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                                                <img src={photo} alt={`Estrutura ${idx}`} className="w-full h-full object-cover" />
                                                {isEditMode && (
                                                    <button 
                                                        onClick={() => handleRemoveStructurePhoto(idx)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Nenhuma foto registrada.</p>
                                )}

                                {isEditMode && (
                                    <div>
                                        <button 
                                            onClick={() => structureFileInputRef.current?.click()}
                                            className="text-xs flex items-center gap-2 text-emerald-700 font-bold hover:bg-emerald-50 px-3 py-2 rounded border border-emerald-200 transition-colors w-full justify-center"
                                        >
                                            <Camera size={14} /> Adicionar Foto
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={structureFileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleStructurePhotoUpload}
                                        />
                                    </div>
                                )}
                            </div>

                             {/* Administrative Actions (Edit Mode Only - Business Rules) */}
                             {isEditMode && currentUserRole === 'ADMIN' && (
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-3">
                                    <h4 className="text-xs font-bold text-amber-800 flex items-center gap-2"><ShieldAlert size={14}/> Ações Administrativas</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {/* (Existing admin actions blocks) */}
                                        {/* Status: LIVRE */}
                                        {selectedGrave.status === StatusSepultura.LIVRE && (
                                            <>
                                                <button onClick={() => handleOpenRegistry(selectedGrave)} className="py-2 bg-emerald-100 text-emerald-700 font-bold rounded text-xs border border-emerald-200 hover:bg-emerald-200">
                                                    Registrar Sepultamento
                                                </button>
                                                <button onClick={() => initiateAction('RESERVE')} className="py-2 bg-blue-100 text-blue-700 font-bold rounded text-xs border border-blue-200 hover:bg-blue-200">
                                                    Reservar
                                                </button>
                                                <button onClick={() => initiateAction('MAINTENANCE')} className="py-2 bg-orange-100 text-orange-700 font-bold rounded text-xs border border-orange-200 hover:bg-orange-200">
                                                    Manutenção
                                                </button>
                                                <button onClick={() => initiateAction('DEMOLISH')} className="py-2 bg-slate-200 text-slate-700 font-bold rounded text-xs border border-slate-300 hover:bg-slate-300">
                                                    Demolir
                                                </button>
                                            </>
                                        )}

                                        {/* Status: OCUPADO */}
                                        {selectedGrave.status === StatusSepultura.OCUPADO && (
                                            <>
                                                <button onClick={() => initiateAction('REMOVE_BURIAL')} className="col-span-2 py-2 bg-red-100 text-red-700 font-bold rounded text-xs border border-red-200 hover:bg-red-200">
                                                    Remover Sepultamento
                                                </button>
                                                <button onClick={() => initiateAction('MAINTENANCE')} className="py-2 bg-orange-100 text-orange-700 font-bold rounded text-xs border border-orange-200 hover:bg-orange-200">
                                                    Manutenção
                                                </button>
                                                <div className="col-span-1 text-[10px] text-red-500 flex items-center justify-center border border-red-100 bg-white rounded">
                                                    <Ban size={10} className="mr-1"/> Demolição Proibida
                                                </div>
                                            </>
                                        )}
                                        {/* Status: RESERVADO */}
                                        {selectedGrave.status === StatusSepultura.RESERVADO && (
                                            <>
                                                <button onClick={() => handleOpenRegistry(selectedGrave)} className="py-2 bg-emerald-100 text-emerald-700 font-bold rounded text-xs border border-emerald-200 hover:bg-emerald-200">
                                                    Ocupar (Sepultar)
                                                </button>
                                                <button onClick={() => initiateAction('FREE_SPOT')} className="py-2 bg-slate-100 text-slate-700 font-bold rounded text-xs border border-slate-200 hover:bg-slate-200">
                                                    Liberar (Tornar Livre)
                                                </button>
                                                <button onClick={() => initiateAction('MAINTENANCE')} className="py-2 bg-orange-100 text-orange-700 font-bold rounded text-xs border border-orange-200 hover:bg-orange-200">
                                                    Manutenção
                                                </button>
                                            </>
                                        )}

                                        {/* Status: CONSTRUIDO */}
                                        {selectedGrave.status === StatusSepultura.CONSTRUIDO && (
                                            <>
                                                <button onClick={() => initiateAction('FREE_SPOT')} className="col-span-2 py-2 bg-emerald-100 text-emerald-700 font-bold rounded text-xs border border-emerald-200 hover:bg-emerald-200">
                                                    <CheckCircle size={14} className="inline mr-1"/> Aprovar / Liberar para Uso
                                                </button>
                                                <button onClick={() => initiateAction('MAINTENANCE')} className="py-2 bg-orange-100 text-orange-700 font-bold rounded text-xs border border-orange-200 hover:bg-orange-200">
                                                    Manutenção
                                                </button>
                                            </>
                                        )}

                                         {/* Status: EXUMADO */}
                                         {selectedGrave.status === StatusSepultura.EXUMADO && (
                                            <>
                                                <button onClick={() => initiateAction('FREE_SPOT')} className="py-2 bg-emerald-100 text-emerald-700 font-bold rounded text-xs border border-emerald-200 hover:bg-emerald-200">
                                                    Liberar (Tornar Livre)
                                                </button>
                                                <button onClick={() => initiateAction('MAINTENANCE')} className="py-2 bg-orange-100 text-orange-700 font-bold rounded text-xs border border-orange-200 hover:bg-orange-200">
                                                    Manutenção
                                                </button>
                                                <button onClick={() => handleOpenRegistry(selectedGrave)} className="col-span-2 py-2 bg-blue-50 text-blue-600 font-bold rounded text-xs border border-blue-100 hover:bg-blue-100">
                                                    Novo Sepultamento
                                                </button>
                                                <button onClick={() => initiateAction('DEMOLISH')} className="py-2 bg-slate-200 text-slate-700 font-bold rounded text-xs border border-slate-300 hover:bg-slate-300">
                                                    Demolir
                                                </button>
                                            </>
                                        )}
                                        
                                        {/* Status: EM MANUTENCAO */}
                                        {selectedGrave.status === StatusSepultura.EM_MANUTENCAO && (
                                            <button onClick={() => initiateAction('FREE_SPOT')} className="col-span-2 py-2 bg-emerald-100 text-emerald-700 font-bold rounded text-xs border border-emerald-200 hover:bg-emerald-200">
                                                <CheckCircle size={14} className="inline mr-1"/> Finalizar Manutenção (Liberar)
                                            </button>
                                        )}

                                    </div>
                                    <p className="text-[10px] text-amber-700/70 italic">* Estas ações geram registros no histórico.</p>
                                </div>
                             )}

                            {/* Occupant Info */}
                            {selectedGrave.falecido ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-800 border-b border-emerald-100 pb-2">
                                        <User size={18} /> <h4 className="font-bold">Ocupante</h4>
                                    </div>
                                    
                                    {/* Photo Display in Details Modal */}
                                    <div className="flex justify-center mb-4 relative">
                                        <div className="w-24 h-24 rounded-full border-4 border-emerald-100 overflow-hidden shadow-sm bg-slate-100 flex items-center justify-center">
                                            {selectedGrave.falecido.foto ? (
                                                <img src={selectedGrave.falecido.foto} alt={selectedGrave.falecido.nome} className="w-full h-full object-cover" />
                                            ) : (
                                                 <User size={40} className="text-slate-300" />
                                            )}
                                        </div>
                                        
                                        {/* Edit Photo Button */}
                                        {isEditMode && (
                                            <>
                                                <button 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute bottom-0 translate-x-8 bg-white text-emerald-700 p-2 rounded-full shadow-lg border border-slate-200 hover:bg-emerald-50 transition-colors z-10"
                                                    title="Alterar Foto"
                                                >
                                                    <Camera size={16} />
                                                </button>
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={handlePhotoChange}
                                                />
                                            </>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="col-span-2">
                                            <label className="text-slate-500 block text-xs uppercase font-bold">Nome</label>
                                            {isEditMode ? <input className="w-full border p-1 rounded" value={selectedGrave.falecido.nome} onChange={e => setSelectedGrave({...selectedGrave, falecido: {...selectedGrave.falecido!, nome: e.target.value}})} /> : <p className="font-medium text-lg">{selectedGrave.falecido.nome}</p>}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500 text-sm">
                                    Local disponível.
                                </div>
                            )}

                             {/* Audit Logs (History) */}
                             {currentUserRole === 'ADMIN' && (
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2"><History size={16}/> Histórico de Alterações (Admin)</h4>
                                    <div className="bg-slate-50 rounded p-2 max-h-32 overflow-y-auto text-xs space-y-2">
                                        {graveLogs.length > 0 ? graveLogs.map((log, i) => (
                                            <div key={i} className="border-b border-slate-200 pb-1 last:border-0">
                                                <p className="font-bold text-slate-700">{log.action} <span className="font-normal text-slate-400">- {new Date(log.timestamp).toLocaleDateString()}</span></p>
                                                <p className="text-slate-500">{log.details}</p>
                                                <p className="text-slate-400 italic">Por: {log.performedBy}</p>
                                            </div>
                                        )) : <p className="text-slate-400 italic">Nenhuma alteração registrada.</p>}
                                    </div>
                                </div>
                             )}
                        </div>

                        {/* Footer Actions */}
                        <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row justify-end items-center gap-3 border-t border-slate-200 mt-auto">
                            <div className="flex gap-2 w-full sm:w-auto">
                                {currentUserRole === 'ADMIN' && (
                                    <>
                                        {selectedGrave.status === StatusSepultura.OCUPADO && (
                                            <button onClick={openExhumationForm} className="px-4 py-2 text-red-600 hover:bg-red-50 font-medium rounded text-sm border border-red-200 flex items-center justify-center gap-2 w-full sm:w-auto">
                                                <Shovel size={16} /> Exumar
                                            </button>
                                        )}
                                        {isEditMode && <button onClick={initiateSaveEdit} className="px-4 py-2 bg-emerald-700 text-white font-medium rounded text-sm w-full sm:w-auto">Salvar Alterações</button>}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL AUTORIZAÇÃO DE CONSTRUÇÃO */}
            {isConstructionModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* ... (Existing Construction Modal Content) ... */}
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="font-bold text-lg sm:text-xl text-slate-800 flex items-center gap-2">
                                <img 
                                    src="https://www.madalena.ce.gov.br/link/link153.png" 
                                    alt="Brasão" 
                                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                                />
                                Autorização de Construção
                            </h3>
                            <button onClick={() => setIsConstructionModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 mb-4 border border-yellow-200">
                                Preencha os dados do responsável e da obra para gerar a guia de autorização oficial.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Autorizado(a)</label>
                                    <input 
                                        className="w-full border border-slate-300 p-2.5 rounded outline-none focus:border-emerald-500"
                                        value={constructionForm.responsavelNome}
                                        onChange={e => setConstructionForm({...constructionForm, responsavelNome: e.target.value})}
                                        placeholder="Ex: Francisco Fabio Rodrigues"
                                    />
                                </div>
                                {/* ... Other Inputs ... */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RG</label>
                                    <input 
                                        className="w-full border border-slate-300 p-2.5 rounded outline-none focus:border-emerald-500"
                                        value={constructionForm.responsavelRg}
                                        onChange={e => setConstructionForm({...constructionForm, responsavelRg: e.target.value})}
                                        placeholder="0000000000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF</label>
                                    <input 
                                        className="w-full border border-slate-300 p-2.5 rounded outline-none focus:border-emerald-500"
                                        value={constructionForm.responsavelCpf}
                                        onChange={e => setConstructionForm({...constructionForm, responsavelCpf: e.target.value})}
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço Completo</label>
                                    <input 
                                        className="w-full border border-slate-300 p-2.5 rounded outline-none focus:border-emerald-500"
                                        value={constructionForm.responsavelEndereco}
                                        onChange={e => setConstructionForm({...constructionForm, responsavelEndereco: e.target.value})}
                                        placeholder="Rua, Número, Bairro, Cidade"
                                    />
                                </div>
                                {/* ... Dimensions and Description ... */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dimensões da Obra</label>
                                    <input 
                                        className="w-full border border-slate-300 p-2.5 rounded outline-none focus:border-emerald-500"
                                        value={constructionForm.dimensoes}
                                        onChange={e => setConstructionForm({...constructionForm, dimensoes: e.target.value})}
                                        placeholder="2,00m x 2,60m"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição / Tipo</label>
                                    <input 
                                        className="w-full border border-slate-300 p-2.5 rounded outline-none focus:border-emerald-500"
                                        value={constructionForm.descricao}
                                        onChange={e => setConstructionForm({...constructionForm, descricao: e.target.value})}
                                        placeholder="DUAS GAVETAS"
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações Adicionais (Opcional)</label>
                                    <textarea 
                                        className="w-full border border-slate-300 p-2.5 rounded outline-none focus:border-emerald-500 h-20 resize-none"
                                        value={constructionForm.observacao}
                                        onChange={e => setConstructionForm({...constructionForm, observacao: e.target.value})}
                                        placeholder="Detalhes extras..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                            <button 
                                onClick={() => setIsConstructionModalOpen(false)}
                                className="px-6 py-2.5 bg-slate-100 text-slate-600 font-medium rounded hover:bg-slate-200 transition-colors w-full sm:w-auto"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={printConstructionAuth}
                                className="px-6 py-2.5 bg-emerald-700 text-white font-bold rounded hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 w-full sm:w-auto"
                            >
                                <Printer size={18} />
                                {currentUserRole === 'ADMIN' ? 'Aprovar e Imprimir' : 'Gerar Solicitação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAILED EXHUMATION FORM MODAL */}
            {isExhumationModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
                        <div className="bg-red-800 px-6 py-4 flex justify-between items-center text-white sticky top-0 z-10">
                            <h3 className="text-lg font-bold flex items-center gap-2"><Shovel size={20}/> Registrar Exumação</h3>
                            <button onClick={() => setIsExhumationModalOpen(false)} className="hover:bg-red-700 p-1 rounded"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm border border-red-200 flex items-start gap-2">
                                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                <div>
                                    <strong>Atenção:</strong> Este processo registrará a remoção dos restos mortais e liberará a sepultura para novos usos.
                                </div>
                            </div>

                            {/* Section 1: Procedimento */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm border-b pb-1">
                                    <ClipboardList size={16}/> Dados do Procedimento
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={FormLabel}>Data Exumação</label>
                                        <input type="date" className={FormInput} value={exhumationForm.dataExumacao} onChange={e => setExhumationForm({...exhumationForm, dataExumacao: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className={FormLabel}>Hora</label>
                                        <input type="time" className={FormInput} value={exhumationForm.horaExumacao} onChange={e => setExhumationForm({...exhumationForm, horaExumacao: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className={FormLabel}>Nº Processo / Autorização</label>
                                        <input className={FormInput} placeholder="Ex: PROC-2025/999" value={exhumationForm.numeroProcesso} onChange={e => setExhumationForm({...exhumationForm, numeroProcesso: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className={FormLabel}>Motivo</label>
                                        <select className={FormInput} value={exhumationForm.motivo} onChange={e => setExhumationForm({...exhumationForm, motivo: e.target.value})}>
                                            <option value="TRANSFERENCIA">Transferência de Local</option>
                                            <option value="OSSUARIO">Transferência para Ossuário</option>
                                            <option value="JUDICIAL">Ordem Judicial / Perícia</option>
                                            <option value="CREMACAO">Cremação</option>
                                        </select>
                                    </div>
                                    {/* CONDITIONAL JUDICIAL ATTACHMENT */}
                                    {exhumationForm.motivo === 'JUDICIAL' && (
                                        <div className="col-span-1 md:col-span-2 bg-blue-50 p-3 rounded border border-blue-100">
                                            <label className="block text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-1">
                                                <Gavel size={14}/> Anexar Ordem Judicial (Obrigatório)
                                            </label>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                <button 
                                                    onClick={() => judicialFileInputRef.current?.click()}
                                                    className="px-3 py-2 bg-white border border-blue-200 text-blue-700 rounded text-sm font-medium hover:bg-blue-50 flex items-center gap-2 w-full sm:w-auto justify-center"
                                                >
                                                    <Paperclip size={14} /> 
                                                    {exhumationForm.anexoJudicial ? 'Documento Anexado (Clique para alterar)' : 'Selecionar Arquivo'}
                                                </button>
                                                {exhumationForm.anexoJudicial && <CheckCircle size={16} className="text-green-600 hidden sm:block" />}
                                                <input 
                                                    type="file" 
                                                    ref={judicialFileInputRef} 
                                                    className="hidden" 
                                                    accept=".pdf,image/*"
                                                    onChange={handleJudicialFileChange}
                                                />
                                            </div>
                                            <p className="text-[10px] text-blue-600 mt-1">Formatos aceitos: PDF ou Imagem da ordem.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 2: Solicitante */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm border-b pb-1">
                                    <User size={16}/> Solicitante / Responsável
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className={FormLabel}>Nome Completo</label>
                                        <input className={FormInput} value={exhumationForm.solicitanteNome} onChange={e => setExhumationForm({...exhumationForm, solicitanteNome: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className={FormLabel}>CPF / RG</label>
                                        <input className={FormInput} value={exhumationForm.solicitanteDoc} onChange={e => setExhumationForm({...exhumationForm, solicitanteDoc: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className={FormLabel}>Grau de Parentesco</label>
                                        <input className={FormInput} placeholder="Ex: Filho(a)" value={exhumationForm.grauParentesco} onChange={e => setExhumationForm({...exhumationForm, grauParentesco: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Destino */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm border-b pb-1">
                                    <ArrowRight size={16}/> Destino dos Restos Mortais
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className={FormLabel}>Local de Destino</label>
                                        <input className={FormInput} placeholder="Ex: Ossuário Geral" value={exhumationForm.destino} onChange={e => setExhumationForm({...exhumationForm, destino: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className={FormLabel}>Coveiro Responsável</label>
                                        <select className={FormInput} value={exhumationForm.coveiroId} onChange={e => setExhumationForm({...exhumationForm, coveiroId: e.target.value})}>
                                            <option value="">Selecione...</option>
                                            {coveiros.filter(c => c.cargo === CargoFuncionario.COVEIRO).map(c => (
                                                <option key={c.id} value={c.id}>{c.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={FormLabel}>Observações Adicionais</label>
                                        <textarea className="w-full border border-slate-300 p-2.5 rounded text-sm outline-none focus:border-red-500 h-20 resize-none" value={exhumationForm.observacoes} onChange={e => setExhumationForm({...exhumationForm, observacoes: e.target.value})}></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row justify-end items-center gap-3 border-t border-slate-200">
                            <button onClick={printExhumationGuide} className="w-full sm:w-auto px-4 py-2 bg-white text-slate-700 font-medium rounded text-sm border border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2">
                                <Printer size={16}/> Imprimir Guia
                            </button>
                            <button onClick={() => setIsExhumationModalOpen(false)} className="w-full sm:w-auto px-4 py-2 bg-white text-slate-600 font-medium rounded text-sm border border-slate-300 hover:bg-slate-50">Cancelar</button>
                            <button onClick={handleExhumationSubmit} className="w-full sm:w-auto px-6 py-2 bg-red-700 text-white font-bold rounded text-sm hover:bg-red-800 shadow-lg shadow-red-900/20 flex items-center justify-center gap-2">
                                <Lock size={16}/> Confirmar Exumação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
