import React, { useState } from 'react';
import { Users, Edit2, Trash2, Search, Shield, User, Key, Save, X, UserCheck, Eye, EyeOff } from 'lucide-react';
import { SystemUser, UserRole } from '../types';
import { PasswordConfirmationModal } from './PasswordConfirmationModal';

interface UserManagementProps {
    users: SystemUser[];
    currentUserId: number;
    onUpdateUser: (updatedUser: SystemUser & { password?: string }) => Promise<boolean>;
    onDeleteUser: (userId: number) => Promise<boolean>;
    adminPassword?: string;
}

const validatePasswordFormat = (password: string): boolean => {
    const regex = /^[a-zA-Z0-9]{6,}$/;
    return regex.test(password);
};

export const UserManagement: React.FC<UserManagementProps> = ({ 
    users, 
    currentUserId, 
    onUpdateUser, 
    onDeleteUser,
    adminPassword 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
    const [editForm, setEditForm] = useState<{ nome: string; username: string; role: UserRole; password?: string }>({
        nome: '',
        username: '',
        role: 'PADRAO',
        password: ''
    });
    
    // Delete handling
    const [userToDelete, setUserToDelete] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // Password visibility
    const [showPassword, setShowPassword] = useState(false);

    const filteredUsers = users.filter(user => 
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditClick = (user: SystemUser) => {
        setEditingUser(user);
        setEditForm({
            nome: user.nome,
            username: user.username,
            role: user.role,
            password: '' // Reset password field
        });
        setShowPassword(false);
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        
        if (editForm.password && !validatePasswordFormat(editForm.password)) {
            alert("A nova senha deve ter no mínimo 6 caracteres alfanuméricos.");
            return;
        }

        const success = await onUpdateUser({
            id: editingUser.id,
            nome: editForm.nome,
            username: editForm.username,
            role: editForm.role,
            password: editForm.password || undefined
        });

        if (success) {
            alert("Usuário atualizado com sucesso!");
            setEditingUser(null);
        }
    };

    const handleDeleteClick = (userId: number) => {
        if (userId === currentUserId) {
            alert("Você não pode excluir seu próprio usuário.");
            return;
        }
        if (userId === 1) {
            alert("O Super Admin padrão não pode ser excluído.");
            return;
        }
        setUserToDelete(userId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            const success = await onDeleteUser(userToDelete);
            if (success) {
                alert("Usuário removido com sucesso!");
            }
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <PasswordConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Usuário"
                description="Esta ação removerá permanentemente o acesso deste usuário ao sistema."
                requiredPassword={adminPassword}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gerenciamento de Usuários</h2>
                    <p className="text-slate-500">Administre o acesso e permissões dos operadores do sistema.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                     <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                        <Users size={20} className="text-emerald-600"/>
                        Lista de Usuários
                    </h3>
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nome ou usuário..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Login de Acesso</th>
                                <th className="px-6 py-4">Função / Cargo</th>
                                <th className="px-6 py-4 text-right">Gerenciar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm ring-2 ring-white ${
                                                user.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                            }`}>
                                                {user.nome.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{user.nome}</p>
                                                <p className="text-xs text-slate-500 font-medium">ID: #{user.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600 font-mono bg-slate-100 px-3 py-1.5 rounded-md w-fit text-xs border border-slate-200">
                                            <User size={12}/> {user.username}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                                            user.role === 'ADMIN' 
                                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                            : user.role === 'PUBLIC'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                            {user.role === 'ADMIN' ? <Shield size={12} /> : <UserCheck size={12} />}
                                            {user.role === 'ADMIN' ? 'Administrador' : user.role === 'PUBLIC' ? 'Visitante' : 'Operador'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleEditClick(user)}
                                                className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100"
                                                title="Editar Dados"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            {user.id !== currentUserId && user.id !== 1 && (
                                                <button 
                                                    onClick={() => handleDeleteClick(user.id)}
                                                    className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                                                    title="Remover Acesso"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredUsers.length === 0 && (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Search size={32} className="opacity-20 text-slate-600" />
                            </div>
                            <p className="font-medium text-slate-500">Nenhum usuário encontrado</p>
                            <p className="text-sm">Tente buscar por outro termo.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* EDIT MODAL */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold flex items-center gap-2">
                                <Edit2 size={18} className="text-emerald-400" />
                                Editar Usuário
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        value={editForm.nome}
                                        onChange={(e) => setEditForm({...editForm, nome: e.target.value})}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário (Login)</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        value={editForm.username}
                                        onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Perfil de Acesso</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select 
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({...editForm, role: e.target.value as UserRole})}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                    >
                                        <option value="PADRAO">Operador Padrão</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4 mt-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Redefinir Senha (Opcional)</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        value={editForm.password}
                                        onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                                        placeholder="Nova senha (min 6 caracteres)"
                                        className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button 
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                className="px-4 py-2 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 transition-colors flex items-center gap-2"
                            >
                                <Save size={18} /> Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};