import React from 'react';
import { Activity, UserMinus, Box, AlertCircle, Wrench, Trash2, Shovel, CheckCircle } from 'lucide-react';
import { DashboardStats, GraveDisplay, StatusSepultura, SystemNotice } from '../types';

interface DashboardProps {
    stats: DashboardStats;
    graves: GraveDisplay[];
    onNavigate: (tab: string) => void;
    notices: SystemNotice[];
    onResolveNotice?: (id: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, graves, onNavigate, notices, onResolveNotice }) => {
    // Calcular as 3 atividades mais recentes (ocupados)
    const recentActivity = graves
        .filter(g => g.status === StatusSepultura.OCUPADO && g.falecido)
        .sort((a, b) => {
            if (!a.falecido?.dataObito || !b.falecido?.dataObito) return 0;
            return new Date(b.falecido.dataObito).getTime() - new Date(a.falecido.dataObito).getTime();
        })
        .slice(0, 3);

    const getNoticeIcon = (type: string) => {
        switch (type) {
            case 'MANUTENCAO': return <Wrench className="text-yellow-600 flex-shrink-0" size={20} />;
            case 'LIMPEZA': return <Trash2 className="text-blue-600 flex-shrink-0" size={20} />;
            case 'EXUMACAO': return <Shovel className="text-purple-600 flex-shrink-0" size={20} />;
            default: return <AlertCircle className="text-slate-600 flex-shrink-0" size={20} />;
        }
    };

    const getNoticeStyle = (type: string) => {
        switch (type) {
            case 'MANUTENCAO': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'LIMPEZA': return 'bg-blue-50 border-blue-200 text-blue-800';
            case 'EXUMACAO': return 'bg-purple-50 border-purple-200 text-purple-800';
            default: return 'bg-slate-50 border-slate-200 text-slate-800';
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Sepulturas</p>
                            <p className="text-3xl font-bold text-slate-800 mt-2">{stats.totalSepulturas}</p>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Box size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-slate-500">
                        <span className="text-blue-600 font-medium">100%</span>
                        <span className="ml-2">Capacidade Cadastrada</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ocupadas</p>
                            <p className="text-3xl font-bold text-slate-800 mt-2">{stats.ocupadas}</p>
                        </div>
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                            <UserMinus size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-slate-500">
                        <span className="text-red-600 font-medium">{Math.round((stats.ocupadas / stats.totalSepulturas) * 100)}%</span>
                        <span className="ml-2">Taxa de Ocupação</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Disponíveis</p>
                            <p className="text-3xl font-bold text-slate-800 mt-2">{stats.livres}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Activity size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-slate-500">
                        <span className="text-emerald-600 font-medium">{Math.round((stats.livres / stats.totalSepulturas) * 100)}%</span>
                        <span className="ml-2">Disponibilidade</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Exumados</p>
                            <p className="text-3xl font-bold text-slate-800 mt-2">{stats.exumadas}</p>
                        </div>
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                            <AlertCircle size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-slate-500">
                        <span className="text-slate-900 font-medium">Ação Necessária</span>
                        <span className="ml-2">Verificar disponibilidade</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Sepultamentos Recentes</h3>
                    <div className="space-y-4">
                        {recentActivity.length > 0 ? recentActivity.map((grave) => (
                            <div key={grave.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                        <UserMinus size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{grave.falecido?.nome}</p>
                                        <p className="text-sm text-slate-500">Q: {grave.quadra} | L: {grave.lote} | S: {grave.sepultura}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-slate-600">{grave.falecido?.dataObito}</p>
                                    <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">Realizado</span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-slate-400 py-4">Nenhum sepultamento recente encontrado.</div>
                        )}
                    </div>
                    <button 
                        onClick={() => onNavigate('search')}
                        className="w-full mt-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                        Ver todos os registros
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Avisos do Sistema</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                        {notices.length > 0 ? (
                            notices.map((notice) => (
                                <div key={notice.id} className={`p-4 border rounded-lg flex gap-3 ${getNoticeStyle(notice.type)}`}>
                                    {getNoticeIcon(notice.type)}
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <h4 className="font-medium">{notice.title}</h4>
                                            <span className="text-xs opacity-70">{new Date(notice.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm mt-1 opacity-90">{notice.description}</p>
                                    </div>
                                    {onResolveNotice && (
                                        <button 
                                            onClick={() => onResolveNotice(notice.id)}
                                            className="opacity-70 hover:opacity-100 p-1 hover:bg-white/30 rounded transition-all self-start"
                                            title="Resolver"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-slate-400 py-8">
                                <AlertCircle className="mx-auto mb-2 opacity-50" />
                                Nenhuma notificação ou solicitação pendente.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};