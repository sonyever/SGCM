import React, { useState } from 'react';
import { Lock, AlertTriangle, X } from 'lucide-react';
import { ACTION_PASSWORD } from '../constants';

interface PasswordConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    requiredPassword?: string;
}

export const PasswordConfirmationModal: React.FC<PasswordConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmação de Segurança",
    description = "Esta ação altera permanentemente a base de dados. Digite a senha para continuar.",
    requiredPassword
}) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const targetPassword = requiredPassword !== undefined ? requiredPassword : ACTION_PASSWORD;

        if (password === targetPassword) {
            onConfirm();
            setPassword('');
            setError(null);
            onClose();
        } else {
            setError("Senha incorreta. Tente novamente.");
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2 font-bold">
                        <Lock size={18} className="text-yellow-400" />
                        {title}
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {description}
                    </p>

                    {error && (
                        <div className="bg-red-50 text-red-700 text-xs p-3 rounded flex items-center gap-2">
                            <AlertTriangle size={14} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-slate-500 font-mono text-center tracking-widest"
                            placeholder="••••"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-2 text-white bg-slate-800 hover:bg-slate-900 rounded-lg font-medium text-sm transition-colors shadow-sm"
                        >
                            Confirmar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
