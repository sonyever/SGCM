import React, { useState, useMemo } from 'react';
import { Search, Filter, Printer, X, Calendar, User, MapPin } from 'lucide-react';
import { GraveDisplay, AuditLog } from '../types';

interface SearchModuleProps {
    graves: GraveDisplay[];
    auditLogs: AuditLog[];
    onViewDetails: (grave: GraveDisplay) => void;
}

export const SearchModule: React.FC<SearchModuleProps> = ({ graves, auditLogs, onViewDetails }) => {
    // Estados dos filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Transform raw grave data into searchable records
    const records = useMemo(() => {
        return graves
            .filter(g => g.falecido) // Só mostra registros com falecidos (sepultados ou exumados com histórico)
            .map(g => {
                // Find the operator who performed the action (Burial) based on audit logs
                // We look for a log that mentions the deceased name
                const log = auditLogs.find(l => l.details.includes(g.falecido!.nome));
                const operador = log ? log.performedBy : 'Sistema/Legado';

                return {
                    id: g.id,
                    nome: g.falecido!.nome,
                    dataObito: g.falecido!.dataObito,
                    local: `Q: ${g.quadra} - L: ${g.lote} - S: ${g.sepultura}`,
                    responsavel: g.responsavel ? g.responsavel.nome : 'N/A',
                    status: g.status,
                    ficha: g.falecido!.fichaAmarelaNro,
                    operador: operador
                };
            });
    }, [graves, auditLogs]);

    // Lógica de Filtragem
    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            // Filtro por Texto (Nome ou Ficha)
            const matchesTerm = 
                record.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.ficha.includes(searchTerm) ||
                record.responsavel.toLowerCase().includes(searchTerm.toLowerCase());

            // Filtro por Status
            const matchesStatus = statusFilter === '' || record.status === statusFilter;

            // Filtro por Data (Período)
            let matchesDate = true;
            
            // Correção automática se datas estiverem invertidas
            let effectiveStart = dateStart;
            let effectiveEnd = dateEnd;
            if (dateStart && dateEnd && new Date(dateStart) > new Date(dateEnd)) {
                effectiveStart = dateEnd;
                effectiveEnd = dateStart;
            }

            if (effectiveStart && effectiveEnd) {
                const recordDate = new Date(record.dataObito);
                const start = new Date(effectiveStart);
                const end = new Date(effectiveEnd);
                matchesDate = recordDate >= start && recordDate <= end;
            } else if (effectiveStart) {
                const recordDate = new Date(record.dataObito);
                const start = new Date(effectiveStart);
                matchesDate = recordDate >= start;
            } else if (effectiveEnd) {
                const recordDate = new Date(record.dataObito);
                const end = new Date(effectiveEnd);
                matchesDate = recordDate <= end;
            }

            return matchesTerm && matchesStatus && matchesDate;
        });
    }, [searchTerm, statusFilter, dateStart, dateEnd, records]);

    const clearFilters = () => {
        setSearchTerm('');
        setDateStart('');
        setDateEnd('');
        setStatusFilter('');
    };

    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'OCUPADO': return 'bg-red-100 text-red-700';
            case 'EXUMADO': return 'bg-yellow-100 text-yellow-700';
            case 'RESERVADO': return 'bg-blue-100 text-blue-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const handleDetailClick = (recordId: number) => {
        const fullGrave = graves.find(g => g.id === recordId);
        if (fullGrave) {
            onViewDetails(fullGrave);
        }
    };

    const handleExportReport = () => {
        if (filteredRecords.length === 0) {
            alert("Não há dados para exportar com os filtros atuais.");
            return;
        }

        const content = `
        <html>
        <head>
            <title>Relatório de Registros - SGC Madalena</title>
            <style>
                @page { size: A4 landscape; margin: 15mm; }
                body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 12px; color: #111; -webkit-print-color-adjust: exact; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                .logo-container { margin-bottom: 10px; }
                .logo { height: 60px; object-fit: contain; }
                .org-name { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
                .doc-title { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
                .meta { font-size: 10px; color: #555; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ccc; padding: 8px 6px; text-align: left; vertical-align: middle; }
                th { background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; font-size: 10px; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                
                .status { font-weight: bold; font-size: 10px; text-transform: uppercase; }
                
                .footer { position: fixed; bottom: 0; left: 0; right: 0; font-size: 10px; text-align: right; border-top: 1px solid #ccc; padding-top: 5px; background: white; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo-container">
                    <img src="https://www.madalena.ce.gov.br/link/link153.png" alt="Brasão" class="logo" />
                </div>
                <div class="org-name">Prefeitura Municipal de Madalena</div>
                <div class="doc-title">Relatório de Registros de Óbito</div>
                <div class="meta">
                    Gerado em: ${new Date().toLocaleString('pt-BR')} | SGC Madalena<br/>
                    Filtros: ${statusFilter || 'Todos os Status'} | Busca: ${searchTerm || 'Nenhuma'}
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 25%">Nome do Falecido / Ficha</th>
                        <th style="width: 10%">Data Óbito</th>
                        <th style="width: 20%">Localização</th>
                        <th style="width: 20%">Responsável</th>
                        <th style="width: 15%">Operador</th>
                        <th style="width: 10%">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredRecords.map(r => `
                        <tr>
                            <td>
                                <strong>${r.nome}</strong><br/>
                                <span style="font-size: 9px; color: #666;">Ficha: ${r.ficha}</span>
                            </td>
                            <td>${formatDate(r.dataObito)}</td>
                            <td>${r.local}</td>
                            <td>${r.responsavel}</td>
                            <td>${r.operador}</td>
                            <td><span class="status">${r.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">
                Página 1 de 1 - SGC Madalena
            </div>
            
            <script>window.print();</script>
        </body>
        </html>
        `;

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(content);
            win.document.close();
        } else {
            alert("Por favor, permita pop-ups para visualizar o relatório de impressão.");
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Consulta de Registros</h2>
                    <p className="text-slate-500">Busque por falecidos, responsáveis ou localização</p>
                </div>
                <button 
                    onClick={handleExportReport}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                    <Printer size={16} /> Exportar Relatório
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                {/* Barra de Busca Principal */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Buscar por nome, responsável ou nº ficha..."
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2 rounded-lg border font-medium flex items-center gap-2 transition-all ${showFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
                        >
                            <Filter size={18} /> Filtros Avançados
                        </button>
                    </div>

                    {/* Painel de Filtros Avançados */}
                    {showFilters && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Início (Óbito)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="date" 
                                        value={dateStart}
                                        onChange={(e) => setDateStart(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Fim (Óbito)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="date" 
                                        value={dateEnd}
                                        onChange={(e) => setDateEnd(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                                    <select 
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded border border-slate-300 focus:ring-1 focus:ring-emerald-500 outline-none text-sm appearance-none bg-white"
                                    >
                                        <option value="">Todos</option>
                                        <option value="OCUPADO">Ocupado (Sepultado)</option>
                                        <option value="EXUMADO">Exumado</option>
                                        <option value="RESERVADO">Reservado</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button 
                                    onClick={clearFilters}
                                    className="w-full px-4 py-2 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <X size={16} /> Limpar Filtros
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabela de Resultados */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 rounded-tl-lg">Nome do Falecido</th>
                                <th className="px-4 py-3">Data Óbito</th>
                                <th className="px-4 py-3">Localização</th>
                                <th className="px-4 py-3">Responsável</th>
                                <th className="px-4 py-3">Operador</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 rounded-tr-lg text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {record.nome}
                                            <span className="block text-xs text-slate-400 font-normal">Ficha: {record.ficha}</span>
                                        </td>
                                        <td className="px-4 py-3">{formatDate(record.dataObito)}</td>
                                        <td className="px-4 py-3 flex items-center gap-1">
                                            <MapPin size={14} className="text-slate-400" />
                                            {record.local}
                                        </td>
                                        <td className="px-4 py-3">{record.responsavel}</td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <User size={12} /> {record.operador}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusStyle(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button 
                                                onClick={() => handleDetailClick(record.id)}
                                                className="text-emerald-700 hover:text-emerald-900 font-medium text-xs border border-emerald-200 px-3 py-1 rounded hover:bg-emerald-50 transition-colors"
                                            >
                                                Ver Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={32} className="opacity-50" />
                                            <p>Nenhum registro encontrado com os filtros selecionados.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="mt-4 flex justify-between items-center text-sm text-slate-500">
                    <span>Mostrando {filteredRecords.length} de {records.length} registros</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>Anterior</button>
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>Próximo</button>
                    </div>
                </div>
            </div>
        </div>
    );
};