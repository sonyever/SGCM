
import React, { useState, useMemo, useRef } from 'react';
import { Search, ArrowDown, Users, TreeDeciduous, ZoomIn, ZoomOut, Maximize, Printer, Camera, User, AlertTriangle } from 'lucide-react';
import { GraveDisplay, Falecido } from '../types';

interface GenealogyTreeProps {
    graves: GraveDisplay[];
    onBack?: () => void;
}

interface FamilyNode {
    person: Falecido;
    graveLocation: string;
    relation: 'SELF' | 'FATHER' | 'MOTHER' | 'CHILD';
}

interface NodeCardProps {
    node: FamilyNode | undefined;
    role: string;
    onSelect: (person: Falecido) => void;
}

const NodeCard: React.FC<NodeCardProps> = ({ node, role, onSelect }) => {
    if (!node) return null;

    const isSelf = node.relation === 'SELF';
    const isUnknown = node.person.id < 0; // Check if it's a ghost node/placeholder
    
    return (
        <div className="flex flex-col items-center relative z-10 group">
            <button 
                onClick={() => !isUnknown && node.relation !== 'SELF' && onSelect(node.person)}
                disabled={isUnknown}
                className={`
                    w-64 p-4 rounded-xl shadow-sm transition-all relative overflow-hidden text-left border
                    ${isSelf 
                        ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white ring-4 ring-emerald-100 scale-110 shadow-xl border-emerald-500' 
                        : isUnknown 
                            ? 'bg-slate-50 border-dashed border-slate-300 opacity-60 cursor-default'
                            : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md cursor-pointer text-slate-800'
                    }
                `}
            >
                {/* Background Pattern */}
                {isSelf && <div className="absolute top-0 right-0 p-4 opacity-10"><TreeDeciduous size={64} /></div>}

                <div className="flex items-center gap-4 relative z-10">
                    {/* Photo Circle */}
                    <div className={`
                        w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2 overflow-hidden bg-slate-200
                        ${isSelf ? 'border-emerald-300' : 'border-slate-100'}
                    `}>
                        {node.person.foto ? (
                            <img src={node.person.foto} alt="Foto" className="w-full h-full object-cover" />
                        ) : (
                            <User size={24} className={isSelf ? 'text-emerald-800' : 'text-slate-400'} />
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isSelf ? 'text-emerald-200' : 'text-slate-400'}`}>
                            {node.relation === 'FATHER' ? 'Pai' : node.relation === 'MOTHER' ? 'Mãe' : node.relation === 'CHILD' ? 'Filho(a)' : 'Selecionado'}
                        </div>
                        <h4 className={`font-bold leading-tight truncate ${isSelf ? 'text-lg text-white' : 'text-sm text-slate-800'}`}>
                            {node.person.nome}
                        </h4>
                        {!isUnknown && (
                            <div className={`text-xs mt-1 flex items-center gap-1 ${isSelf ? 'text-emerald-100' : 'text-slate-500'}`}>
                                <span>
                                    {node.person.dataNascimento ? new Date(node.person.dataNascimento).getFullYear() : '?'}
                                </span>
                                <span>-</span>
                                <span>
                                    {node.person.dataObito ? new Date(node.person.dataObito).getFullYear() : '?'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {!isUnknown && (
                    <div className={`mt-3 pt-2 border-t text-[10px] font-medium flex justify-between ${isSelf ? 'border-emerald-500/50 text-emerald-100' : 'border-slate-100 text-slate-400'}`}>
                        <span>{node.graveLocation}</span>
                        {node.person.familia && <span>{node.person.familia}</span>}
                    </div>
                )}
            </button>
            
            {!isUnknown && !isSelf && (
                <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">
                    Clique para focar
                </div>
            )}
        </div>
    );
};

export const GenealogyTree: React.FC<GenealogyTreeProps> = ({ graves, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPerson, setSelectedPerson] = useState<Falecido | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    const treeContainerRef = useRef<HTMLDivElement>(null);

    // Filter graves that have deceased records
    const records = useMemo(() => {
        return graves.filter(g => g.falecido && g.status === 'OCUPADO');
    }, [graves]);

    // Search results
    const searchResults = useMemo(() => {
        if (!searchTerm || searchTerm.length < 2) return [];
        const lowerTerm = searchTerm.toLowerCase();
        return records.filter(r => 
            r.falecido!.nome.toLowerCase().includes(lowerTerm)
        );
    }, [searchTerm, records]);

    // Build Family Tree Data based on selected person
    const familyTreeData = useMemo(() => {
        if (!selectedPerson) return null;

        const tree: FamilyNode[] = [];
        
        // 1. Add Self
        const selfGrave = records.find(r => r.falecido?.id === selectedPerson.id);
        tree.push({
            person: selectedPerson,
            graveLocation: selfGrave ? `Q:${selfGrave.quadra} L:${selfGrave.lote} S:${selfGrave.sepultura}` : 'N/A',
            relation: 'SELF'
        });

        // 2. Find Parents in Database (By Name Matching)
        if (selectedPerson.nomePai) {
            const fatherRecord = records.find(r => r.falecido?.nome.toLowerCase() === selectedPerson.nomePai?.toLowerCase());
            // Create a node even if not found in database (Ghost Node)
            tree.push({
                person: fatherRecord?.falecido || { ...selectedPerson, id: -1, nome: selectedPerson.nomePai, dataNascimento: '', dataObito: '' } as any,
                graveLocation: fatherRecord ? `Q:${fatherRecord.quadra} L:${fatherRecord.lote} S:${fatherRecord.sepultura}` : 'Não Localizado',
                relation: 'FATHER'
            });
        } else {
             // Placeholder for layout balance
             tree.push({
                person: { id: -2, nome: 'Pai Desconhecido' } as any,
                graveLocation: '',
                relation: 'FATHER'
            });
        }

        if (selectedPerson.nomeMae) {
            const motherRecord = records.find(r => r.falecido?.nome.toLowerCase() === selectedPerson.nomeMae?.toLowerCase());
            tree.push({
                person: motherRecord?.falecido || { ...selectedPerson, id: -3, nome: selectedPerson.nomeMae, dataNascimento: '', dataObito: '' } as any,
                graveLocation: motherRecord ? `Q:${motherRecord.quadra} L:${motherRecord.lote} S:${motherRecord.sepultura}` : 'Não Localizado',
                relation: 'MOTHER'
            });
        } else {
            // Placeholder for layout balance
            tree.push({
               person: { id: -4, nome: 'Mãe Desconhecida' } as any,
               graveLocation: '',
               relation: 'MOTHER'
           });
       }

        // 3. Find Children in Database
        const childrenRecords = records.filter(r => {
            if (!r.falecido) return false;
            const fatherMatch = r.falecido.nomePai?.trim().toLowerCase() === selectedPerson.nome.trim().toLowerCase();
            const motherMatch = r.falecido.nomeMae?.trim().toLowerCase() === selectedPerson.nome.trim().toLowerCase();
            return fatherMatch || motherMatch;
        });

        childrenRecords.forEach(child => {
            if (child.falecido) {
                tree.push({
                    person: child.falecido,
                    graveLocation: `Q:${child.quadra} L:${child.lote} S:${child.sepultura}`,
                    relation: 'CHILD'
                });
            }
        });

        return {
            parents: tree.filter(n => n.relation === 'FATHER' || n.relation === 'MOTHER').sort((a, b) => a.relation === 'FATHER' ? -1 : 1), // Father left, Mother right
            self: tree.find(n => n.relation === 'SELF')!,
            children: tree.filter(n => n.relation === 'CHILD')
        };
    }, [selectedPerson, records]);

    const handleSelect = (falecido: Falecido) => {
        setSelectedPerson(falecido);
        setSearchTerm('');
        setZoomLevel(1);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleZoom = (delta: number) => {
        setZoomLevel(prev => Math.min(Math.max(0.5, prev + delta), 2));
    };

    return (
        <div className="h-full flex flex-col space-y-4 print:space-y-0 print:block">
             <div className="flex flex-col gap-4 print:hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <TreeDeciduous className="text-emerald-600" />
                            Árvore Genealógica <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">Beta</span>
                        </h2>
                        <p className="text-slate-500 text-sm">Visualize conexões familiares baseadas nos registros de sepultamento.</p>
                    </div>
                    <div className="flex gap-2">
                        {selectedPerson && (
                             <button onClick={handlePrint} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200" title="Imprimir Árvore">
                                <Printer size={20} />
                            </button>
                        )}
                        {onBack && (
                            <button onClick={onBack} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium shadow-sm">
                                Voltar
                            </button>
                        )}
                    </div>
                </div>

                {/* Beta Warning Banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 text-amber-800 shadow-sm">
                    <div className="p-2 bg-amber-100 rounded-full flex-shrink-0">
                        <AlertTriangle size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Funcionalidade em Fase Experimental (Beta)</h4>
                        <p className="text-xs mt-1 leading-relaxed opacity-90">
                            Esta ferramenta está em fase de testes e desenvolvimento. As conexões familiares são geradas automaticamente com base nos nomes registrados no sistema e podem conter inconsistências ou dados incompletos. A validação manual dos registros físicos ainda é a fonte oficial.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Area */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative z-50 print:hidden">
                <div className="relative max-w-xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder=", Busque pelo nome do falecido..."
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm shadow-inner"
                    />
                    
                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-64 overflow-y-auto divide-y divide-slate-50 animate-fade-in z-[60]">
                            {searchResults.map(record => (
                                <button
                                    key={record.id}
                                    onClick={() => handleSelect(record.falecido!)}
                                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors flex justify-between items-center group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                                            {record.falecido?.foto ? (
                                                <img src={record.falecido.foto} alt="" className="w-full h-full object-cover"/>
                                            ) : (
                                                <User className="w-full h-full p-1.5 text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm group-hover:text-emerald-800">{record.falecido!.nome}</p>
                                            <p className="text-xs text-slate-500">
                                                {record.falecido!.dataNascimento ? new Date(record.falecido!.dataNascimento).getFullYear() : '?'} - 
                                                {record.falecido!.dataObito ? new Date(record.falecido!.dataObito).getFullYear() : '?'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Visualizar</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tree Canvas */}
            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative print:border-none print:bg-white">
                
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none print:hidden" 
                     style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                </div>

                {familyTreeData ? (
                    <>
                        {/* Zoom Controls */}
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white rounded-lg shadow-md border border-slate-200 p-2 z-40 print:hidden">
                            <button onClick={() => handleZoom(0.1)} className="p-2 hover:bg-slate-100 rounded text-slate-600"><ZoomIn size={20}/></button>
                            <button onClick={() => setZoomLevel(1)} className="p-2 hover:bg-slate-100 rounded text-slate-600"><Maximize size={20}/></button>
                            <button onClick={() => handleZoom(-0.1)} className="p-2 hover:bg-slate-100 rounded text-slate-600"><ZoomOut size={20}/></button>
                        </div>

                        <div 
                            ref={treeContainerRef}
                            className="w-full h-full overflow-auto flex items-start justify-center p-12 transition-transform duration-200 ease-out"
                        >
                            <div 
                                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                                className="flex flex-col items-center gap-16"
                            >
                                
                                {/* LEVEL 1: PARENTS */}
                                <div className="flex gap-16 relative">
                                    {/* Line connecting parents */}
                                    <div className="absolute top-1/2 left-32 right-32 h-px bg-slate-300 -z-10"></div>
                                    
                                    {/* Line down to Self */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 h-24 w-px bg-slate-300 -z-10"></div>

                                    {familyTreeData.parents.map((parent, idx) => (
                                        <NodeCard key={idx} node={parent} role={parent.relation} onSelect={handleSelect} />
                                    ))}
                                </div>

                                {/* LEVEL 2: SELF */}
                                <div className="relative">
                                    <NodeCard node={familyTreeData.self} role="SELF" onSelect={handleSelect} />
                                    
                                    {/* Line down to Children */}
                                    {familyTreeData.children.length > 0 && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 h-16 w-px bg-slate-300"></div>
                                    )}
                                </div>

                                {/* LEVEL 3: CHILDREN */}
                                {familyTreeData.children.length > 0 ? (
                                    <div className="relative pt-8">
                                        {/* Horizontal bar spanning all children */}
                                        <div className="absolute top-0 left-32 right-32 h-4 border-t border-l border-r border-slate-300 rounded-t-xl -z-10"></div>
                                        
                                        {/* Middle vertical connector from horizontal bar to parent line */}
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-px bg-slate-300"></div>

                                        <div className="flex gap-8 items-start">
                                            {familyTreeData.children.map((child, idx) => (
                                                <div key={idx} className="flex flex-col items-center relative">
                                                    {/* Vertical line to node */}
                                                    <div className="h-8 w-px bg-slate-300 absolute -top-8 left-1/2 -translate-x-1/2"></div>
                                                    <NodeCard node={child} role="CHILD" onSelect={handleSelect} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm bg-slate-50/50">
                                        Nenhum descendente registrado.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-6">
                        <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                            <Users size={64} className="opacity-20 text-slate-500" />
                        </div>
                        <div className="text-center max-w-md space-y-2">
                            <h3 className="text-xl font-bold text-slate-600">Explore a Genealogia</h3>
                            <p className="text-sm">
                                Selecione um registro na barra de pesquisa acima para visualizar a árvore genealógica completa (Pais, Falecido e Filhos).
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body { background: white; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    .print\\:border-none { border: none !important; }
                    .print\\:bg-white { background: white !important; }
                }
            `}</style>
        </div>
    );
};
