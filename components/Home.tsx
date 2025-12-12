
import React, { useState } from 'react';
import { User, Building2, Phone, Mail, MapPin, Clock, Facebook, Youtube, Instagram, Globe, X, Send, AlertTriangle } from 'lucide-react';
import { APP_NAME } from '../constants';
import { SystemNotice } from '../types';

interface HomeProps {
    onAddNotice: (notice: Omit<SystemNotice, 'id' | 'date' | 'isRead'>) => void;
}

export const Home: React.FC<HomeProps> = ({ onAddNotice }) => {
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [serviceForm, setServiceForm] = useState({
        type: 'MANUTENCAO',
        description: ''
    });

    const handleServiceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddNotice({
            type: serviceForm.type as any,
            title: serviceForm.type === 'MANUTENCAO' ? 'Solicitação de Manutenção' : 
                   serviceForm.type === 'LIMPEZA' ? 'Solicitação de Limpeza' : 'Solicitação de Exumação',
            description: serviceForm.description
        });
        alert("Solicitação enviada com sucesso! O administrador será notificado.");
        setIsServiceModalOpen(false);
        setServiceForm({ type: 'MANUTENCAO', description: '' });
    };

    return (
        <div className="flex flex-col min-h-full space-y-6 animate-fade-in relative">
            {/* Main Hero / Banner Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                
                {/* Top Banner with Logos */}
                <div className="bg-slate-50 border-b border-slate-200 p-8 md:p-12 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
                        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="url(#grid-pattern)" />
                        </svg>
                        <defs>
                            <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 relative z-10">
                        {/* City Branding */}
                        <div className="flex items-center gap-6">
                            <img 
                                src="https://www.madalena.ce.gov.br/link/link153.png" 
                                alt="Brasão de Madalena" 
                                className="w-24 h-24 md:w-32 md:h-32 drop-shadow-md object-contain"
                            />
                            
                            <div className="flex flex-col">
                                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
                                    Madalena
                                </h1>
                                <span className="text-emerald-600 font-bold text-lg tracking-widest uppercase">Prefeitura</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Welcome & Quick Actions Area */}
                <div className="flex-1 p-8 md:p-12 bg-white">
                    <h2 className="text-2xl font-bold text-emerald-900 mb-2">Bem-vindo ao {APP_NAME}</h2>
                    <p className="text-slate-500 max-w-2xl mb-8">
                        Sistema Integrado de Gestão de Cemitérios Municipais. Utilize o menu lateral para navegar entre o Mapa Digital, Registros de Óbito e Relatórios Gerenciais.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 hover:shadow-md transition-shadow">
                             <div className="w-10 h-10 bg-emerald-200 rounded-lg flex items-center justify-center text-emerald-800 mb-4">
                                <Globe size={20} />
                             </div>
                             <h3 className="font-bold text-emerald-900 mb-1">Acesso à Informação</h3>
                             <p className="text-sm text-emerald-700">Consulte dados públicos sobre sepultamentos e regulamentação municipal.</p>
                         </div>
                         <button 
                             onClick={() => setIsServiceModalOpen(true)}
                             className="bg-blue-50 p-6 rounded-xl border border-blue-100 hover:shadow-md transition-shadow text-left"
                         >
                             <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center text-blue-800 mb-4">
                                <Building2 size={20} />
                             </div>
                             <h3 className="font-bold text-blue-900 mb-1">Serviços Urbanos</h3>
                             <p className="text-sm text-blue-700">Solicitações de manutenção, limpeza e exumações.</p>
                         </button>
                         <a 
                             href="https://www.madalena.ce.gov.br/ouvidoria"
                             target="_blank"
                             rel="noopener noreferrer"
                             className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 hover:shadow-md transition-shadow block"
                         >
                             <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center text-yellow-800 mb-4">
                                <Phone size={20} />
                             </div>
                             <h3 className="font-bold text-yellow-900 mb-1">Ouvidoria</h3>
                             <p className="text-sm text-yellow-700">Canal direto para dúvidas, sugestões e reclamações.</p>
                         </a>
                    </div>
                </div>

                {/* Footer Style - Green Section */}
                <div className="bg-[#007038] text-white p-8 md:p-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {/* Institucional */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold border-b border-white/20 pb-2 mb-2">Institucional</h3>
                            <div className="space-y-3 text-sm font-light">
                                <div className="flex items-start gap-3">
                                    <User size={18} className="mt-0.5 opacity-80" />
                                    <div>
                                        <span className="block text-xs opacity-70 uppercase font-bold">Prefeito</span>
                                        Prefeito Crispiano Barros Uchoa
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Building2 size={18} className="mt-0.5 opacity-80" />
                                    <div>
                                        <span className="block text-xs opacity-70 uppercase font-bold">CNPJ</span>
                                        10.508.935/0001-37
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contatos */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold border-b border-white/20 pb-2 mb-2">Contatos</h3>
                            <div className="space-y-3 text-sm font-light">
                                <div className="flex items-start gap-3">
                                    <Phone size={18} className="mt-0.5 opacity-80" />
                                    <div>
                                        <span className="block text-xs opacity-70 uppercase font-bold">Telefone</span>
                                        (88) 9.9461-5404
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail size={18} className="mt-0.5 opacity-80" />
                                    <div>
                                        <span className="block text-xs opacity-70 uppercase font-bold">Email</span>
                                        gabineteprefmadalena@gmail.com
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Endereço e Horário */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold border-b border-white/20 pb-2 mb-2">Endereço e horário</h3>
                            <div className="space-y-3 text-sm font-light">
                                <div className="flex items-start gap-3">
                                    <MapPin size={18} className="mt-0.5 opacity-80" />
                                    <div>
                                        <span className="block text-xs opacity-70 uppercase font-bold">Localização</span>
                                        Rua Augusto Máximo Vieira, 80 - Centro, 63.860-000
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock size={18} className="mt-0.5 opacity-80" />
                                    <div>
                                        <span className="block text-xs opacity-70 uppercase font-bold">Funcionamento</span>
                                        Segunda à Sexta-feira, das 7h30 às 13h30
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Bottom / Socials */}
                    <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-80">
                        <div className="flex gap-4">
                            <a href="https://webmail-seguro.com.br/madalena.ce.gov.br/" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity"><Mail size={16} /></a>
                            <a href="https://www.facebook.com/prefeiturademadalena" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity"><Facebook size={16} /></a>
                            <a href="https://www.youtube.com/channel/UC2qEEMkFbiWljmSh5-W-KCw" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity"><Youtube size={16} /></a>
                            <a href="https://www.instagram.com/prefeituramadalena/" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity"><Instagram size={16} /></a>
                        </div>
                        <div>
                            © 2025 Tércio Informática. Todos os Direitos Reservados.
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Request Modal */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
                        <div className="bg-blue-600 p-4 rounded-t-xl flex justify-between items-center text-white">
                            <h3 className="font-bold flex items-center gap-2">
                                <Building2 size={20} /> Solicitar Serviço Urbano
                            </h3>
                            <button onClick={() => setIsServiceModalOpen(false)} className="hover:bg-blue-700 p-1 rounded">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleServiceSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Serviço</label>
                                <select 
                                    value={serviceForm.type}
                                    onChange={(e) => setServiceForm({...serviceForm, type: e.target.value})}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="MANUTENCAO">Manutenção (Drenagem, Estrutura)</option>
                                    <option value="LIMPEZA">Limpeza e Capina</option>
                                    <option value="EXUMACAO">Solicitação de Exumação</option>
                                    <option value="OUTROS">Outros</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição e Localização</label>
                                <textarea 
                                    required
                                    value={serviceForm.description}
                                    onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                                    placeholder="Descreva o problema e a localização exata (Ex: Quadra B, Lote 15, problema de infiltração)..."
                                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                                />
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 text-sm text-blue-800">
                                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                <p>Esta solicitação será enviada para o painel administrativo para análise.</p>
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <Send size={18} /> Enviar Solicitação
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
