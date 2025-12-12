import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { GraveMap } from './components/GraveMap';
import { RegistryForm, BurialFormData, CemeteryFormData, GraveFormData, EmployeeFormData } from './components/RegistryForm';
import { SearchModule } from './components/SearchModule';
import { InternalChat } from './components/InternalChat';
import { ReportsModule } from './components/ReportsModule';
import { Home } from './components/Home';
import { AIAssistant } from './components/AIAssistant';
import { LandingPage } from './components/LandingPage';
import { GenealogyTree } from './components/GenealogyTree';
import { UserManagement } from './components/UserManagement'; 
import { ACTION_PASSWORD } from './constants';
import { DashboardStats, StatusSepultura, GraveDisplay, Cemiterio, Funcionario, CargoFuncionario, TipoSepultura, UserRole, AuditLog, SystemNotice, SystemUser, ChatMessage } from './types';
import { supabase } from './supabase';
import { Database, UploadCloud, AlertTriangle, X, CheckCircle, Shield, User, Loader, Wifi, WifiOff, Settings, Save, Key, Camera, ShieldCheck, Eye, EyeOff } from 'lucide-react';

// --- LOCAL STORAGE KEYS ---
const STORAGE_KEYS = {
    GRAVES: 'sgc_data_graves_v2', // Changed key to reset mocks
    CEMETERIES: 'sgc_data_cemiterios_v2',
    EMPLOYEES: 'sgc_data_funcionarios_v2',
    USERS: 'sgc_data_users_v2',
    LOGS: 'sgc_data_audit_logs_v2',
    MESSAGES: 'sgc_data_messages_v2',
    OFFLINE_QUEUE: 'offlineQueue'
};

// Interface for Offline Queue Items
interface OfflineItem {
    table: string;
    action: 'INSERT' | 'UPDATE' | 'UPSERT' | 'DELETE';
    data: any;
    matchField?: string;
    matchValue?: any;
    timestamp: number;
}

// Password Validation Helper
const validatePasswordFormat = (password: string): boolean => {
    // Min 6 chars, Alphanumeric only (no symbols, no spaces)
    const regex = /^[a-zA-Z0-9]{6,}$/;
    return regex.test(password);
};

// Helper for Lazy Initialization
const getInitialData = <T,>(key: string, fallback: T): T => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
        console.error(`Error parsing data for ${key}`, e);
        return fallback;
    }
};

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginRole, setLoginRole] = useState<UserRole>('PADRAO'); 
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('ADMIN'); 
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [sessionPassword, setSessionPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Login States
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [usingSupabase, setUsingSupabase] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const superAdmin: SystemUser = { id: 1, username: 'admin', nome: 'Administrador', role: 'ADMIN', password: 'admin123', foto: '' };

  // Main Data States - USING EMPTY ARRAYS AS FALLBACK TO FORCE REAL DATA USAGE
  const [graves, setGraves] = useState<GraveDisplay[]>(() => getInitialData(STORAGE_KEYS.GRAVES, []));
  const [cemiterios, setCemiterios] = useState<Cemiterio[]>(() => getInitialData(STORAGE_KEYS.CEMETERIES, []));
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(() => getInitialData(STORAGE_KEYS.EMPLOYEES, []));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getInitialData(STORAGE_KEYS.LOGS, []));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => getInitialData(STORAGE_KEYS.MESSAGES, []));
  
  // Special init for Users to ensure Admin exists
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
      const savedUsers = getInitialData<SystemUser[]>(STORAGE_KEYS.USERS, []);
      if (!savedUsers.some(u => u.id === 1)) {
          return [superAdmin, ...savedUsers];
      }
      return savedUsers;
  });
  
  const [notices, setNotices] = useState<SystemNotice[]>([]);

  const [registryInitialData, setRegistryInitialData] = useState<Partial<BurialFormData> | null>(null);
  const [mapInitialSelectedGrave, setMapInitialSelectedGrave] = useState<GraveDisplay | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
      nome: '',
      username: '',
      password: '',
      confirmPassword: '',
      currentPassword: '',
      foto: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE EFFECT HOOKS ---
  
  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.GRAVES, JSON.stringify(graves));
  }, [graves]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.CEMETERIES, JSON.stringify(cemiterios));
  }, [cemiterios]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(funcionarios));
  }, [funcionarios]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(systemUsers));
  }, [systemUsers]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(chatMessages));
  }, [chatMessages]);


  // --- INITIALIZATION LOGIC ---
  useEffect(() => {
    const initSystem = async () => {
        // Data is already loaded via Lazy Init in useState
        setTimeout(() => setIsLoading(false), 500); 

        // 2. Network Handling
        if (navigator.onLine) {
            setIsOnline(true);
            setIsSyncing(true);
            try {
                // Critical Order: Sync Queue First -> Then Fetch Remote
                await syncOfflineData(); 
                await fetchRemoteData();
            } finally {
                setIsSyncing(false);
            }
        }
    };

    initSystem();

    const handleOnline = async () => {
        setIsOnline(true);
        setIsSyncing(true);
        console.log("Conexão restaurada. Sincronizando...");
        await syncOfflineData();
        await fetchRemoteData();
        setIsSyncing(false);
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update profile form when modal opens
  useEffect(() => {
    if (isProfileOpen) {
        const user = systemUsers.find(u => u.id === currentUserId);
        setProfileForm({
            nome: user ? user.nome : currentUsername,
            username: user ? user.username : '',
            password: '',
            confirmPassword: '',
            currentPassword: '',
            foto: user?.foto || ''
        });
        setProfileError(null);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setShowCurrentPassword(false);
    }
  }, [isProfileOpen, currentUserId, currentUsername, systemUsers]);

  // --- DIAGNOSTIC HELPER ---
  const analyzeDataConflicts = (context: string, localData: any[], remoteData: any[]) => {
      // Logic retained for debugging
      // console.log(`Syncing ${context}...`);
  };

  // --- DATA LOADING FUNCTIONS ---

  const fetchRemoteData = async () => {
    try {
        // Attempt to fetch from Supabase
        const { data: cemiteriosData, error } = await supabase.from('cemiterios').select('*');
        
        if (!error) {
            setUsingSupabase(true);
            // Only update if remote data exists, otherwise keep local (which might have new offline entries)
            if (cemiteriosData && cemiteriosData.length > 0) {
                // Merge strategy: Prefer remote, but keep local-only entries if IDs don't conflict
                // For simplicity in this demo, we assume remote is truth if available
                setCemiterios(cemiteriosData);
            }
                
            const { data: funcData } = await supabase.from('funcionarios').select('*');
            if (funcData && funcData.length > 0) setFuncionarios(funcData);
            
            const { data: graveData } = await supabase.from('sepulturas').select('*');
            if (graveData && graveData.length > 0) setGraves(graveData);
            
            const { data: logData } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
            if (logData && logData.length > 0) setAuditLogs(logData);
            
            const { data: userData } = await supabase.from('usuarios').select('*');
            if (userData && userData.length > 0) {
                    const adminInDb = userData.find(u => u.id === 1);
                    let mergedUsers = [...userData];
                    if (!adminInDb) {
                        mergedUsers = [superAdmin, ...userData];
                    }
                    setSystemUsers(mergedUsers);
            }

            const { data: msgData } = await supabase.from('messages').select('*');
            if (msgData && msgData.length > 0) {
                    const formattedMsgs = msgData.map(m => ({
                        id: m.id,
                        senderId: m.sender_id,
                        receiverId: m.receiver_id,
                        content: m.content,
                        timestamp: m.timestamp,
                        isRead: m.is_read
                    }));
                    setChatMessages(formattedMsgs);
            }
        }
    } catch (err) {
        console.warn("Could not sync with Supabase. Staying on local data.", err);
        setUsingSupabase(false);
    }
  };

  // --- OFFLINE SYNC LOGIC ---
  const saveToOfflineQueue = (item: OfflineItem) => {
      const queueRaw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      const queue: OfflineItem[] = queueRaw ? JSON.parse(queueRaw) : [];
      queue.push(item);
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  };

  const syncOfflineData = async () => {
      const queueRaw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (!queueRaw) return;

      const queue: OfflineItem[] = JSON.parse(queueRaw);
      if (queue.length === 0) return;

      const newQueue: OfflineItem[] = [];

      for (const item of queue) {
          try {
              let error = null;
              if (item.action === 'INSERT') {
                  const { error: e } = await supabase.from(item.table).insert(item.data);
                  error = e;
              } else if (item.action === 'UPSERT') {
                  const { error: e } = await supabase.from(item.table).upsert(item.data);
                  error = e;
              } else if (item.action === 'UPDATE') {
                  const { error: e } = await supabase.from(item.table).update(item.data).eq(item.matchField!, item.matchValue);
                  error = e;
              } else if (item.action === 'DELETE') {
                  const { error: e } = await supabase.from(item.table).delete().eq(item.matchField!, item.matchValue);
                  error = e;
              }

              if (error) {
                  // If duplicate key error, we consider it synced or ignore
                  if(!error.message.includes('duplicate key')) {
                      newQueue.push(item);
                  }
              }
          } catch (e) {
              newQueue.push(item);
          }
      }
      
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(newQueue));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    // Validation
    if (loginRole === 'ADMIN' && sessionPassword) {
        if (!validatePasswordFormat(sessionPassword)) {
            setLoginError("Formato de senha inválido. Use no mínimo 6 caracteres alfanuméricos.");
            setIsLoggingIn(false);
            return;
        }
    }

    // UX Delay simulation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const finalUsername = currentUsername.trim();

    // Buscar usuário na lista (inclui Super Admin injetado)
    const userFound = systemUsers.find(u => 
        u.username.toLowerCase() === finalUsername.toLowerCase() || 
        u.nome.toLowerCase() === finalUsername.toLowerCase()
    );

    if (!userFound) {
        setLoginError("Usuário não encontrado.");
        setIsLoggingIn(false);
        return;
    }

    // Validação de Role para aba de Administrador
    if (loginRole === 'ADMIN' && userFound.role !== 'ADMIN') {
        setLoginError("Acesso negado. Este usuário não é administrador.");
        setIsLoggingIn(false);
        return;
    }

    // Validação de Senha
    if ((userFound as any).password && (userFound as any).password !== sessionPassword) {
            setLoginError("Senha incorreta.");
            setIsLoggingIn(false);
            return;
    }

    // Sucesso
    setCurrentUserId(userFound.id);
    setCurrentUsername(userFound.nome);
    setIsAuthenticated(true);
    setCurrentUserRole(userFound.role);
    setActiveTab('dashboard'); // Explicitly set to dashboard to ensure a valid view
    
    setSessionPassword(''); 
    setIsLoggingIn(false);
  };

  const handlePublicAccess = () => {
    setIsAuthenticated(true);
    setCurrentUserRole('PUBLIC');
    setLoginRole('PUBLIC' as any);
    setActiveTab('map');
    setShowLanding(false);
    setCurrentUsername('Visitante');
    setCurrentUserId(0);
  };

  const handlePublicGenealogy = () => {
    setIsAuthenticated(true);
    setCurrentUserRole('PUBLIC');
    setLoginRole('PUBLIC' as any);
    setActiveTab('genealogy');
    setShowLanding(false);
    setCurrentUsername('Visitante');
    setCurrentUserId(0);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowLanding(true); // Return to landing page
    setCurrentUserRole('PADRAO');
    setSessionPassword('');
    setActiveTab('home');
    setLoginRole('PADRAO');
    setCurrentUsername('');
    setCurrentUserId(0);
    setLoginError(null);
  };

  const handleSendMessage = async (receiverId: number, content: string) => {
      const newMessage: ChatMessage = {
          id: Date.now(),
          senderId: currentUserId,
          receiverId: receiverId,
          content: content,
          timestamp: new Date().toISOString(),
          isRead: false
      };
      
      setChatMessages(prev => [...prev, newMessage]);

      if (usingSupabase || !isOnline) {
          try {
             const { error } = await supabase.from('messages').insert({
                sender_id: currentUserId,
                receiver_id: receiverId,
                content: content,
                timestamp: newMessage.timestamp,
                is_read: false
             });
             if (error) throw error;
          } catch (e) {
              saveToOfflineQueue({
                  table: 'messages',
                  action: 'INSERT',
                  data: {
                    sender_id: currentUserId,
                    receiver_id: receiverId,
                    content: content,
                    timestamp: newMessage.timestamp,
                    is_read: false
                 },
                 timestamp: Date.now()
              });
          }
      }
  };

  // User Management Handlers
  const handleUpdateUser = async (updatedUser: SystemUser & { password?: string }): Promise<boolean> => {
      const updatedList = systemUsers.map(u => u.id === updatedUser.id ? { 
          ...u, 
          nome: updatedUser.nome, 
          username: updatedUser.username, 
          role: updatedUser.role,
          foto: updatedUser.foto,
          password: updatedUser.password || (u as any).password // Update password in local state
      } : u);
      setSystemUsers(updatedList);
      
      const newLog: AuditLog = {
        id: Date.now(),
        action: 'EDICAO_USUARIO',
        targetId: updatedUser.username,
        details: `Usuário ${updatedUser.username} atualizado.`,
        performedBy: currentUsername,
        timestamp: new Date().toISOString()
      };
      setAuditLogs(prev => [newLog, ...prev]);

      if (usingSupabase || !isOnline) {
          const updatePayload: any = {
              username: updatedUser.username,
              nome: updatedUser.nome,
              role: updatedUser.role,
          };
          if (updatedUser.password) updatePayload.password = updatedUser.password;
          if (updatedUser.foto) updatePayload.foto = updatedUser.foto;

          try {
              // Special handling for Super Admin (ID 1)
              if (updatedUser.id === 1) {
                  updatePayload.id = 1;
                  const { error } = await supabase.from('usuarios').upsert(updatePayload);
                  if (error) throw error;
              } else {
                  const { error } = await supabase.from('usuarios').update(updatePayload).eq('id', updatedUser.id);
                  if (error) throw error;
              }
              
              await supabase.from('audit_logs').insert(newLog);
          } catch (e) {
              saveToOfflineQueue({
                  table: 'usuarios',
                  action: updatedUser.id === 1 ? 'UPSERT' : 'UPDATE', // Use UPSERT for Admin
                  matchField: updatedUser.id === 1 ? undefined : 'id',
                  matchValue: updatedUser.id === 1 ? undefined : updatedUser.id,
                  data: updatedUser.id === 1 ? { ...updatePayload, id: 1 } : updatePayload,
                  timestamp: Date.now()
              });
               saveToOfflineQueue({
                  table: 'audit_logs',
                  action: 'INSERT',
                  data: newLog,
                  timestamp: Date.now()
              });
          }
      }
      return true;
  };

  const handleDeleteUser = async (userId: number): Promise<boolean> => {
      const userToDelete = systemUsers.find(u => u.id === userId);
      const updatedList = systemUsers.filter(u => u.id !== userId);
      setSystemUsers(updatedList);

      const newLog: AuditLog = {
        id: Date.now(),
        action: 'EXCLUSAO_USUARIO',
        targetId: userToDelete?.username || String(userId),
        details: `Usuário ${userToDelete?.username} removido do sistema.`,
        performedBy: currentUsername,
        timestamp: new Date().toISOString()
      };
      setAuditLogs(prev => [newLog, ...prev]);

      if (usingSupabase || !isOnline) {
          try {
              const { error } = await supabase.from('usuarios').delete().eq('id', userId);
              if (error) throw error;
              await supabase.from('audit_logs').insert(newLog);
          } catch (e) {
              saveToOfflineQueue({
                  table: 'usuarios',
                  action: 'DELETE',
                  matchField: 'id',
                  matchValue: userId,
                  data: null,
                  timestamp: Date.now()
              });
              saveToOfflineQueue({
                  table: 'audit_logs',
                  action: 'INSERT',
                  data: newLog,
                  timestamp: Date.now()
              });
          }
      }
      return true;
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setProfileForm(prev => ({ ...prev, foto: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveProfile = async () => {
    setProfileError(null);
    if (currentUserId === 0) {
        setProfileError("Visitantes não possuem perfil editável.");
        return;
    }

    // Validation
    if (profileForm.password) {
        if (!validatePasswordFormat(profileForm.password)) {
            setProfileError("A nova senha deve ter no mínimo 6 caracteres alfanuméricos.");
            return;
        }
        if (profileForm.password !== profileForm.confirmPassword) {
            setProfileError("A nova senha e a confirmação não coincidem.");
            return;
        }
    }

    if (!profileForm.currentPassword) {
        setProfileError("Por favor, informe sua senha atual para confirmar as alterações.");
        return;
    }

    setIsSavingProfile(true);

    // Simulate network delay for UX
    await new Promise(resolve => setTimeout(resolve, 800));

    // Basic verification logic for current password
    const userToUpdate = systemUsers.find(u => u.id === currentUserId);
    const storedPassword = (userToUpdate as any)?.password;
    
    let isPasswordCorrect = false;
    
    if (currentUserRole === 'ADMIN' && currentUserId === 1) {
         // Fallback for Admin: if no password stored yet, check ACTION_PASSWORD
         const validPassword = storedPassword || ACTION_PASSWORD;
         if (profileForm.currentPassword === validPassword) {
             isPasswordCorrect = true;
         }
    } else {
        if (storedPassword && storedPassword === profileForm.currentPassword) {
            isPasswordCorrect = true;
        }
    }

    if (!isPasswordCorrect) {
        setProfileError("Senha atual incorreta.");
        setIsSavingProfile(false);
        return;
    }
    
    // Safety check for user existence
    if (!userToUpdate && !(currentUserRole === 'ADMIN' && currentUserId === 1)) {
        setProfileError("Erro ao localizar usuário no sistema.");
        setIsSavingProfile(false);
        return;
    }
    
    const success = await handleUpdateUser({
        id: currentUserId,
        nome: profileForm.nome,
        username: profileForm.username,
        role: userToUpdate ? userToUpdate.role : 'ADMIN',
        foto: profileForm.foto,
        password: profileForm.password || undefined
    });

    setIsSavingProfile(false);

    if (success) {
        if (currentUserRole === 'ADMIN' && currentUserId === 1) {
             setCurrentUsername(profileForm.nome);
        }
        setIsProfileOpen(false);
        // Can add a toast notification here later
    } else {
        setProfileError("Erro ao salvar alterações. Tente novamente.");
    }
  };

  const handleRegistryBurial = async (data: BurialFormData): Promise<boolean> => {
    // ... (Logica existente)
    const graveIndex = graves.findIndex(g => 
        g.cemiterioId === Number(data.cemiterioId) && 
        g.quadra === data.quadra && 
        g.lote === data.lote && 
        g.sepultura === data.sepultura
    );

    if (graveIndex === -1) {
        alert("Sepultura não encontrada. Verifique os dados de localização.");
        return false;
    }

    const currentGrave = graves[graveIndex];
    const isEdit = currentGrave.status === StatusSepultura.OCUPADO;

    if (isEdit && currentUserRole !== 'ADMIN') {
        alert("Atenção: Apenas Administradores podem alterar registros existentes.");
        return false;
    }

    const updatedGrave: GraveDisplay = {
        ...currentGrave,
        status: StatusSepultura.OCUPADO,
        falecido: {
            id: isEdit && currentGrave.falecido ? currentGrave.falecido.id : Date.now(),
            nome: data.nome,
            dataNascimento: data.dataNascimento,
            dataObito: data.dataObito,
            causaObito: data.causaObito,
            fichaAmarelaNro: data.fichaAmarela,
            orgaoEmissao: data.orgaoEmissao,
            horaObito: data.horaObito,
            naturalidade: data.naturalidade,
            nomePai: data.nomePai,
            nomeMae: data.nomeMae,
            familia: data.familia, 
            foto: data.foto, 
            sexo: data.sexo,
            racaCor: data.racaCor,
            estadoCivil: data.estadoCivil,
            escolaridade: data.escolaridade,
            ocupacaoHabitual: data.ocupacao,
            enderecoResidencial: data.enderecoResidencial,
            numeroResidencial: data.numeroResidencial,
            bairroResidencial: data.bairroResidencial,
            municipioResidencial: data.municipioResidencial,
            cepResidencial: data.cepResidencial,
            localOcorrencia: data.localOcorrencia,
            enderecoOcorrencia: data.enderecoOcorrencia,
            municipioOcorrencia: data.municipioOcorrencia,
            causasAntecedentes: data.causasAntecedentes,
            nomeMedico: data.nomeMedico,
            crmMedico: data.crmMedico,
            tipoAtestado: data.tipoAtestado,
            telefoneMedico: data.telefoneMedico
        },
        responsavel: {
            id: isEdit && currentGrave.responsavel ? currentGrave.responsavel.id : Date.now(),
            nome: data.responsavelNome,
            documento: data.responsavelDoc,
            telefone: data.responsavelTel,
            endereco: data.enderecoResidencial || '', 
            testemunha1: data.testemunha1,
            testemunha2: data.testemunha2
        },
        sepultamento: {
            id: isEdit && currentGrave.sepultamento ? currentGrave.sepultamento.id : Date.now(),
            falecidoId: isEdit && currentGrave.falecido ? currentGrave.falecido.id : Date.now(),
            localizacaoId: currentGrave.id,
            responsavelId: isEdit && currentGrave.responsavel ? currentGrave.responsavel.id : Date.now(),
            coveiroId: Number(data.coveiroId),
            dataSepultamento: new Date().toISOString().split('T')[0],
            autorizacaoNro: data.autorizacao,
            controleNro: isEdit && currentGrave.sepultamento ? currentGrave.sepultamento.controleNro : `CTR-${Date.now()}`
        }
    };

    const newGraves = [...graves];
    newGraves[graveIndex] = updatedGrave;
    setGraves(newGraves);

    const actionType = isEdit ? 'EDICAO_REGISTRO' : 'SEPULTAMENTO';
    const logDetails = isEdit 
        ? `Edição de dados cadastrais de ${data.nome} (Aut: ${data.autorizacao})` 
        : `Sepultamento realizado: ${data.nome} (Aut: ${data.autorizacao})`;

    const newLog: AuditLog = {
        id: Date.now(),
        action: actionType,
        targetId: data.sepultura,
        details: logDetails,
        performedBy: currentUsername,
        timestamp: new Date().toISOString()
    };
    setAuditLogs([newLog, ...auditLogs]);

    if (usingSupabase || !isOnline) {
        try {
            const { error } = await supabase.from('sepulturas').upsert(updatedGrave);
            if (error) throw error;
            await supabase.from('audit_logs').insert(newLog);
        } catch (e) {
             saveToOfflineQueue({
                  table: 'sepulturas',
                  action: 'UPSERT',
                  data: updatedGrave,
                  timestamp: Date.now()
              });
               saveToOfflineQueue({
                  table: 'audit_logs',
                  action: 'INSERT',
                  data: newLog,
                  timestamp: Date.now()
              });
        }
    }

    return true;
  };

  const handleDeleteBurial = async (data: BurialFormData): Promise<boolean> => {
    // ... (Lógica existente)
    if (currentUserRole !== 'ADMIN') {
        alert("Atenção: Apenas Administradores podem excluir registros.");
        return false;
    }

    const graveIndex = graves.findIndex(g => 
        g.cemiterioId === Number(data.cemiterioId) && 
        g.quadra === data.quadra && 
        g.lote === data.lote && 
        g.sepultura === data.sepultura
    );

    if (graveIndex === -1) {
        alert("Sepultura não encontrada.");
        return false;
    }

    const currentGrave = graves[graveIndex];

    const updatedGrave: GraveDisplay = {
        ...currentGrave,
        status: StatusSepultura.LIVRE,
        falecido: undefined, 
        responsavel: undefined,
        sepultamento: undefined
    };

    const newGraves = [...graves];
    newGraves[graveIndex] = updatedGrave;
    setGraves(newGraves);

    const newLog: AuditLog = {
        id: Date.now(),
        action: 'EXCLUSAO_REGISTRO',
        targetId: data.sepultura,
        details: `Exclusão do registro de sepultamento de: ${data.nome}`,
        performedBy: currentUsername,
        timestamp: new Date().toISOString()
    };
    setAuditLogs([newLog, ...auditLogs]);

    if (usingSupabase || !isOnline) {
        try {
            const { error } = await supabase.from('sepulturas').upsert(updatedGrave);
            if (error) throw error;
            await supabase.from('audit_logs').insert(newLog);
        } catch (e) {
            saveToOfflineQueue({
                table: 'sepulturas',
                action: 'UPSERT',
                data: updatedGrave,
                timestamp: Date.now()
            });
            saveToOfflineQueue({
                table: 'audit_logs',
                action: 'INSERT',
                data: newLog,
                timestamp: Date.now()
            });
        }
    }

    return true;
  };

  const handleAddGrave = async (data: GraveFormData): Promise<boolean> => {
    // ... (Lógica existente)
    const startId = graves.length > 0 ? Math.max(...graves.map(g => g.id)) + 1 : 1;
    const newGravesList: GraveDisplay[] = [];

    const coords = (data.latitude && data.longitude) ? {
        lat: parseFloat(data.latitude.replace(',', '.')),
        lng: parseFloat(data.longitude.replace(',', '.'))
    } : undefined;

    if (data.numGavetas > 1) {
        for (let i = 1; i <= data.numGavetas; i++) {
             newGravesList.push({
                id: startId + i - 1,
                cemiterioId: Number(data.cemiterioId),
                alameda: 'Nova Alameda',
                quadra: data.quadra,
                lote: data.lote,
                sepultura: `G${i}`,
                tipoSepultura: data.tipo,
                numGavetas: data.numGavetas,
                status: StatusSepultura.LIVRE,
                nomeFamilia: data.nomeFamilia,
                coordenadas: coords
            });
        }
    } else {
         newGravesList.push({
            id: startId,
            cemiterioId: Number(data.cemiterioId),
            alameda: 'Nova Alameda',
            quadra: data.quadra,
            lote: data.lote,
            sepultura: data.sepultura || 'S1',
            tipoSepultura: data.tipo,
            numGavetas: 1,
            status: StatusSepultura.LIVRE,
            nomeFamilia: data.nomeFamilia,
            coordenadas: coords
        });
    }
    
    setGraves(prev => [...prev, ...newGravesList]);

    const newLog: AuditLog = {
        id: Date.now(),
        action: 'CADASTRO_SEPULTURA',
        targetId: `${data.quadra}-${data.lote}`,
        details: `Cadastro de sepultura(s). Q:${data.quadra} L:${data.lote} (${data.numGavetas} gavetas)`,
        performedBy: currentUsername,
        timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);

    if (usingSupabase || !isOnline) {
        try {
            // Alterado para UPSERT para evitar erros de ID duplicado se o estado local estiver desatualizado
            const { error } = await supabase.from('sepulturas').upsert(newGravesList);
            if (error) throw error;
            await supabase.from('audit_logs').insert(newLog);
        } catch (e: any) {
             console.error("Erro ao salvar sepultura:", e.message || e);
             saveToOfflineQueue({
                table: 'sepulturas',
                action: 'UPSERT',
                data: newGravesList,
                timestamp: Date.now()
            });
            saveToOfflineQueue({
                table: 'audit_logs',
                action: 'INSERT',
                data: newLog,
                timestamp: Date.now()
            });
        }
    }
    return true;
  };

  const handleAddEmployee = async (data: EmployeeFormData): Promise<boolean> => {
    // ... (Lógica existente)
    const newId = Math.max(...funcionarios.map(f => f.id), 0) + 1;
    const newFunc: Funcionario = {
        id: newId,
        nome: data.nome,
        cargo: data.cargo,
        matricula: data.matricula
    };
    setFuncionarios([...funcionarios, newFunc]);
    if (usingSupabase || !isOnline) {
        try {
            // Alterado para UPSERT
            const { error } = await supabase.from('funcionarios').upsert(newFunc);
            if (error) throw error;
        } catch (e: any) {
            console.error("Erro ao salvar funcionário:", e.message || e);
            saveToOfflineQueue({
                table: 'funcionarios',
                action: 'UPSERT', // Alterado para UPSERT na fila offline também
                data: newFunc,
                timestamp: Date.now()
            });
        }
    }
    return true;
  };

  const handleAddCemetery = async (data: CemeteryFormData): Promise<boolean> => {
    // ... (Lógica existente)
    try {
        const newId = Math.max(...cemiterios.map(c => c.id), 0) + 1;
        const lat = parseFloat(data.latitude.replace(',', '.'));
        const lng = parseFloat(data.longitude.replace(',', '.'));

        const newCemiterio: Cemiterio = {
            id: newId,
            nome: data.nome,
            endereco: data.endereco,
            cep: data.cep,
            telefone: data.telefone,
            latitude: isNaN(lat) ? 0 : lat,
            longitude: isNaN(lng) ? 0 : lng,
            responsavel: data.responsavelNome
        };
        
        setCemiterios(prev => [...prev, newCemiterio]);
        
        const newLog: AuditLog = {
            id: Date.now(),
            action: 'CADASTRO_CEMITERIO',
            targetId: data.nome,
            details: `Novo cemitério cadastrado. Responsável: ${data.responsavelNome}`,
            performedBy: currentUsername,
            timestamp: new Date().toISOString()
        };
        setAuditLogs(prev => [newLog, ...prev]);

        // FIX: Always try to sync if online, or queue if offline.
        if (isOnline) {
            try {
                // Alterado para UPSERT
                const { error } = await supabase.from('cemiterios').upsert(newCemiterio);
                if (error) throw error;
                await supabase.from('audit_logs').insert(newLog);
            } catch (e: any) {
                console.error("Erro ao salvar cemitério no banco:", e.message || e);
                saveToOfflineQueue({
                    table: 'cemiterios',
                    action: 'UPSERT',
                    data: newCemiterio,
                    timestamp: Date.now()
                });
                saveToOfflineQueue({
                    table: 'audit_logs',
                    action: 'INSERT',
                    data: newLog,
                    timestamp: Date.now()
                });
            }
        } else {
             saveToOfflineQueue({
                table: 'cemiterios',
                action: 'UPSERT',
                data: newCemiterio,
                timestamp: Date.now()
            });
            saveToOfflineQueue({
                table: 'audit_logs',
                action: 'INSERT',
                data: newLog,
                timestamp: Date.now()
            });
        }

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
  };

  const handleAddUser = async (data: any): Promise<boolean> => {
      // ... (Lógica existente)
      const newLog: AuditLog = {
        id: Date.now(),
        action: 'CADASTRO_USUARIO',
        targetId: data.username,
        details: `Novo usuário cadastrado. Perfil: ${data.role}`,
        performedBy: currentUsername,
        timestamp: new Date().toISOString()
      };
      setAuditLogs([newLog, ...auditLogs]);

      const newUser: SystemUser = {
          id: Date.now(),
          username: data.username,
          role: data.role,
          nome: data.nome || data.username
      };

      setSystemUsers(prev => [...prev, newUser]);

      if (usingSupabase || !isOnline) {
          try {
              // Alterado para UPSERT
              const { error } = await supabase.from('usuarios').upsert({
                  username: data.username,
                  password: data.password,
                  role: data.role,
                  nome: data.nome || data.username
              });
              if (error) throw error;
              await supabase.from('audit_logs').insert(newLog);
          } catch (e: any) {
               console.error("Erro ao salvar usuário:", e.message || e);
               saveToOfflineQueue({
                  table: 'usuarios',
                  action: 'UPSERT', // Alterado para UPSERT
                  data: {
                      username: data.username,
                      password: data.password,
                      role: data.role,
                      nome: data.nome || data.username
                  },
                  timestamp: Date.now()
              });
              saveToOfflineQueue({
                  table: 'audit_logs',
                  action: 'INSERT',
                  data: newLog,
                  timestamp: Date.now()
              });
          }
      }
      return true;
  };

  const handleAddNotice = (notice: Omit<SystemNotice, 'id' | 'date' | 'isRead'>) => {
      // ... (Lógica existente)
      const newNotice: SystemNotice = {
          id: Date.now(),
          ...notice,
          description: `${notice.description} (Solicitado por: ${currentUsername})`,
          date: new Date().toISOString(),
          isRead: false
      };
      setNotices([newNotice, ...notices]);
  };

  const handleResolveNotice = (id: number) => {
      setNotices(prev => prev.filter(n => n.id !== id));
  };

  const navigateToMap = (grave: GraveDisplay) => {
    setMapInitialSelectedGrave(grave);
    setActiveTab('map');
  };

  const renderContent = () => {
    switch (activeTab) {
        case 'home':
            return <Home onAddNotice={handleAddNotice} />;
        case 'dashboard':
            return (
                <Dashboard 
                    stats={{
                        totalSepulturas: graves.length,
                        ocupadas: graves.filter(g => g.status === StatusSepultura.OCUPADO).length,
                        livres: graves.filter(g => g.status === StatusSepultura.LIVRE).length,
                        exumadas: graves.filter(g => g.status === StatusSepultura.EXUMADO).length,
                        sepultamentosEsteMes: 12
                    }}
                    graves={graves}
                    onNavigate={setActiveTab}
                    notices={notices}
                    onResolveNotice={currentUserRole === 'ADMIN' ? handleResolveNotice : undefined}
                />
            );
        case 'map':
            return (
                <GraveMap 
                    graves={graves} 
                    cemiterios={cemiterios}
                    coveiros={funcionarios}
                    onGraveUpdate={async (updatedGrave, logAction, logDetails) => {
                        setGraves(graves.map(g => g.id === updatedGrave.id ? updatedGrave : g));
                        if(usingSupabase || !isOnline) {
                            try {
                                const { error } = await supabase.from('sepulturas').upsert(updatedGrave);
                                if (error) throw error;
                            } catch (e) {
                                saveToOfflineQueue({
                                    table: 'sepulturas',
                                    action: 'UPSERT',
                                    data: updatedGrave,
                                    timestamp: Date.now()
                                });
                            }
                        }

                        if (logAction) {
                            const newLog: AuditLog = {
                                id: Date.now(),
                                action: logAction,
                                targetId: updatedGrave.sepultura,
                                details: logDetails || '',
                                performedBy: currentUsername,
                                timestamp: new Date().toISOString()
                            };
                            setAuditLogs([newLog, ...auditLogs]);
                            if (usingSupabase || !isOnline) {
                                try {
                                    const { error } = await supabase.from('audit_logs').insert(newLog);
                                    if(error) throw error;
                                } catch (e) {
                                    saveToOfflineQueue({
                                        table: 'audit_logs',
                                        action: 'INSERT',
                                        data: newLog,
                                        timestamp: Date.now()
                                    });
                                }
                            }
                        }
                    }}
                    onRegistryBurial={handleRegistryBurial}
                    onDeleteBurial={handleDeleteBurial}
                    systemUsers={systemUsers}
                    initialSelectedGrave={mapInitialSelectedGrave}
                    currentUserRole={currentUserRole}
                    currentSessionPassword={sessionPassword}
                    auditLogs={auditLogs}
                />
            );
        case 'genealogy':
             return (
                 <GenealogyTree graves={graves} onBack={() => {
                 }} />
             );
        case 'registry':
            return (
                <RegistryForm 
                    cemiterios={cemiterios}
                    funcionarios={funcionarios}
                    systemUsers={systemUsers}
                    onRegistryBurial={handleRegistryBurial}
                    onDeleteBurial={handleDeleteBurial}
                    onAddGrave={handleAddGrave}
                    onAddEmployee={handleAddEmployee}
                    onAddCemetery={handleAddCemetery}
                    onAddUser={handleAddUser}
                    initialData={registryInitialData}
                    currentUserRole={currentUserRole}
                    currentSessionPassword={sessionPassword}
                />
            );
        case 'search':
            return (
                <SearchModule 
                    graves={graves}
                    auditLogs={auditLogs}
                    onViewDetails={navigateToMap}
                />
            );
        case 'users-management':
            return (
                <UserManagement 
                    users={systemUsers}
                    currentUserId={currentUserId}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                    adminPassword={ACTION_PASSWORD}
                />
            );
        case 'internal-chat':
            return (
                <InternalChat 
                    currentUserRole={currentUserRole}
                    currentUserId={currentUserId}
                    systemUsers={systemUsers}
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                />
            );
        case 'ai-assistant':
            return (
                <AIAssistant 
                    graves={graves}
                    cemiterios={cemiterios}
                />
            );
        case 'reports':
            return <ReportsModule graves={graves} cemiterios={cemiterios} funcionarios={funcionarios} />;
        default:
            return <Home onAddNotice={handleAddNotice} />;
    }
  };

  const currentUser = systemUsers.find(u => u.id === currentUserId) || superAdmin;

  if (isLoading) {
      return (
          <div className="min-h-screen bg-emerald-900 flex flex-col items-center justify-center p-4">
              <div className="relative mb-6">
                 <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-20 rounded-full"></div>
                 <img 
                    src="https://www.madalena.ce.gov.br/link/link153.png" 
                    alt="Brasão" 
                    className="w-24 h-24 object-contain relative z-10 drop-shadow-xl animate-pulse"
                 />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">SGC Madalena</h2>
              <div className="flex items-center gap-2 text-emerald-200 text-sm">
                  <Loader className="animate-spin" size={16} />
                  Inicializando sistema...
              </div>
          </div>
      );
  }

  if (showLanding && !isAuthenticated) {
    return (
        <LandingPage 
            onEnterAdmin={() => setShowLanding(false)} 
            onViewMap={handlePublicAccess} 
            onViewGenealogy={handlePublicGenealogy}
        />
    );
  }

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative">
             <button 
                onClick={() => setShowLanding(true)}
                className="absolute top-4 left-4 flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium bg-white/50 backdrop-blur-sm p-2 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:bg-white hover:text-slate-800"
             >
                <X size={18} /> Cancelar / Voltar
             </button>

            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-fade-in border border-slate-200">
                <div className="flex justify-center mb-6">
                    <img 
                        src="https://www.madalena.ce.gov.br/link/link153.png" 
                        alt="Brasão de Madalena" 
                        className="h-24 w-auto object-contain drop-shadow-md"
                    />
                </div>
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-1">SGC Madalena</h2>
                <p className="text-center text-slate-500 mb-6 font-medium text-sm uppercase tracking-wide">Área Administrativa Restrita</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                        <button
                            type="button"
                            onClick={() => {
                                setLoginRole('PADRAO');
                                setCurrentUsername('');
                                setSessionPassword('');
                                setLoginError(null);
                            }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                loginRole === 'PADRAO' 
                                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Usuário Padrão
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLoginRole('ADMIN');
                                setCurrentUsername(''); // Changed from 'Administrador'
                                setSessionPassword('');
                                setLoginError(null);
                            }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                loginRole === 'ADMIN' 
                                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Administrador
                        </button>
                    </div>

                    {loginError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fade-in">
                            <AlertTriangle size={16} className="flex-shrink-0" />
                            {loginError}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário / Nome</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                value={currentUsername}
                                onChange={(e) => {
                                    setCurrentUsername(e.target.value);
                                    if(loginError) setLoginError(null);
                                }}
                                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${loginError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-emerald-500'} outline-none focus:ring-2 transition-all text-sm`}
                                placeholder={loginRole === 'ADMIN' ? "Usuário Admin" : "Digite seu nome"}
                                readOnly={false}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type={showLoginPassword ? "text" : "password"} 
                                value={sessionPassword}
                                onChange={(e) => {
                                    setSessionPassword(e.target.value);
                                    if(loginError) setLoginError(null);
                                }}
                                className={`w-full pl-10 pr-10 py-3 rounded-lg border ${loginError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-emerald-500'} outline-none focus:ring-2 transition-all text-sm`}
                                placeholder={loginRole === 'ADMIN' ? "Senha Admin (admin123)" : "Senha de Acesso"}
                                required={loginRole === 'ADMIN'}
                            />
                            {loginRole === 'ADMIN' && (
                                <button
                                    type="button"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            )}
                        </div>
                    </div>
                    <button 
                        type="submit"
                        disabled={isLoggingIn || (loginRole === 'ADMIN' && !sessionPassword)}
                        className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-800/70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                    >
                        {isLoggingIn ? (
                            <>
                                <Loader size={20} className="animate-spin text-emerald-200" />
                                <span className="text-emerald-100 text-sm">Verificando...</span>
                            </>
                        ) : (
                            "Entrar no Sistema"
                        )}
                    </button>
                </form>
                <div className="mt-6 text-center border-t border-slate-100 pt-4">
                    {!isOnline ? (
                        <p className="text-xs text-amber-600 flex items-center justify-center gap-1 font-medium bg-amber-50 py-1 rounded">
                            <WifiOff size={12}/> Modo Offline Ativo
                        </p>
                    ) : (
                         <div className="flex flex-col items-center gap-1">
                             <p className="text-xs text-emerald-600 flex items-center justify-center gap-1 font-medium">
                                <Wifi size={12}/> Conectado ao Servidor
                            </p>
                            {isSyncing && <p className="text-[10px] text-slate-400 flex items-center gap-1"><Loader size={10} className="animate-spin"/> Sincronizando dados...</p>}
                         </div>
                    )}
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-2">
                    © 2025 Tércio Informática. Acesso Monitorado.
                </p>
            </div>
        </div>
    );
  }

  // --- RETURN FOR AUTHENTICATED STATE ---
  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      userRole={currentUserRole}
      userName={currentUsername}
      userPhoto={currentUser?.foto}
      onProfileClick={() => setIsProfileOpen(true)}
    >
      {renderContent()}

      {/* MODAL DE PERFIL */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
                <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold flex items-center gap-2">
                        <Settings size={18} className="text-emerald-400" />
                        Meu Perfil
                    </h3>
                    <button onClick={() => setIsProfileOpen(false)} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Foto */}
                    <div className="flex justify-center mb-6 relative">
                        <div className="w-24 h-24 rounded-full border-4 border-emerald-100 overflow-hidden shadow-sm bg-slate-100 flex items-center justify-center group">
                            {profileForm.foto ? (
                                <img src={profileForm.foto} alt="Perfil" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-slate-300">
                                    {profileForm.nome?.charAt(0).toUpperCase()}
                                </span>
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleProfilePhotoChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*"
                                disabled={isSavingProfile}
                            />
                        </div>
                    </div>

                    {profileError && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-bold flex items-center gap-2 mb-4 border border-red-200">
                            <AlertTriangle size={16} />
                            {profileError}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                value={profileForm.nome}
                                onChange={(e) => setProfileForm({...profileForm, nome: e.target.value})}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
                                disabled={isSavingProfile || (currentUserRole === 'ADMIN' && currentUserId === 1)} // Super admin name might be fixed or not
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário (Login)</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                value={profileForm.username}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                                disabled
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 mt-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alterar Senha</label>
                        <div className="space-y-3">
                             <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type={showNewPassword ? "text" : "password"} 
                                    value={profileForm.password}
                                    onChange={(e) => setProfileForm({...profileForm, password: e.target.value})}
                                    placeholder="Nova senha (opcional)"
                                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                                    disabled={isSavingProfile}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {profileForm.password && (
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        value={profileForm.confirmPassword}
                                        onChange={(e) => setProfileForm({...profileForm, confirmPassword: e.target.value})}
                                        placeholder="Confirme a nova senha"
                                        className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                                        disabled={isSavingProfile}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mt-4">
                        <label className="block text-xs font-bold text-amber-700 uppercase mb-1">Confirmação de Segurança</label>
                         <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
                            <input 
                                type={showCurrentPassword ? "text" : "password"} 
                                value={profileForm.currentPassword}
                                onChange={(e) => setProfileForm({...profileForm, currentPassword: e.target.value})}
                                placeholder="Digite sua senha atual para salvar"
                                className="w-full pl-10 pr-10 py-2 rounded-lg border border-amber-200 bg-white outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100"
                                disabled={isSavingProfile}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-700 focus:outline-none"
                            >
                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsProfileOpen(false)}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                        disabled={isSavingProfile}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="px-4 py-2 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSavingProfile ? (
                            <>
                                <Loader size={18} className="animate-spin" /> Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={18} /> Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
    </Layout>
  );
}