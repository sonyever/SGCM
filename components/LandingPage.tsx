

import React from 'react';
import { Building2, Search, Map, Phone, Clock, ArrowRight, ShieldCheck, Mail, MapPin, TreeDeciduous } from 'lucide-react';
import { APP_NAME } from '../constants';

interface LandingPageProps {
    onEnterAdmin: () => void;
    onViewMap: () => void;
    onViewGenealogy: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterAdmin, onViewMap, onViewGenealogy }) => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
            {/* Header / Navbar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img 
                            src="https://www.madalena.ce.gov.br/link/link153.png" 
                            alt="Brasão de Madalena" 
                            className="h-12 w-auto object-contain"
                        />
                        <div className="hidden md:block">
                            <h1 className="text-lg font-bold text-slate-800 leading-tight">Prefeitura Municipal de Madalena</h1>
                            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Gestão de Cemitérios</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onEnterAdmin}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-800 text-white rounded-lg hover:bg-emerald-900 transition-all font-medium text-sm shadow-lg shadow-emerald-900/20"
                    >
                        <ShieldCheck size={18} />
                        <span className="hidden sm:inline">Acesso Administrativo</span>
                        <span className="sm:hidden">Admin</span>
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative bg-emerald-900 py-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518131393661-d779698d2483?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-emerald-900/90 to-transparent"></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/50 border border-emerald-700 text-emerald-100 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Sistema Online
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                            Consulta Pública e <br/>
                            <span className="text-emerald-400">Gestão Transparente</span>
                        </h2>
                        <p className="text-lg text-emerald-100 max-w-xl leading-relaxed">
                            Bem-vindo ao portal oficial do SGC Madalena. Aqui você encontra informações sobre os cemitérios municipais, consulta de sepultamentos e orientações sobre serviços fúnebres.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <button 
                                onClick={onViewMap}
                                className="px-8 py-4 bg-white text-emerald-900 rounded-xl font-bold hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-xl"
                            >
                                <Search size={20} />
                                Consultar Sepultamentos
                            </button>
                            <a 
                                href="#services"
                                className="px-8 py-4 bg-emerald-800/50 text-white border border-emerald-700 rounded-xl font-bold hover:bg-emerald-800 transition-colors flex items-center gap-2 backdrop-blur-sm"
                            >
                                <Building2 size={20} />
                                Nossos Serviços
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Information Cards */}
            <section id="services" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h3 className="text-3xl font-bold text-slate-800 mb-4">Serviços e Informações</h3>
                        <p className="text-slate-500">
                            A Secretaria de Infraestrutura disponibiliza canais de atendimento e informações claras para a população.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Card 1 */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                            <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                                <Map size={28} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-3">Mapa dos Cemitérios</h4>
                            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                Localização detalhada das quadras, lotes e sepulturas dos cemitérios municipais.
                            </p>
                            <button onClick={onViewMap} className="text-emerald-700 font-bold text-xs flex items-center gap-2 hover:gap-3 transition-all">
                                Ver localizações <ArrowRight size={14} />
                            </button>
                        </div>

                         {/* Card New: Genealogy */}
                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1">
                                <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">NOVO</span>
                            </div>
                            <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                                <TreeDeciduous size={28} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-3">Árvore Genealógica</h4>
                            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                Consulte a ancestralidade e conexões familiares com base nos registros públicos.
                            </p>
                            <button onClick={onViewGenealogy} className="text-purple-700 font-bold text-xs flex items-center gap-2 hover:gap-3 transition-all">
                                Consultar Família <ArrowRight size={14} />
                            </button>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                                <Clock size={28} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-3">Horários</h4>
                            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                Visitação e administração.
                            </p>
                            <ul className="space-y-2 text-xs text-slate-600">
                                <li className="flex justify-between"><span>Visita:</span> <strong>06:00 - 18:00</strong></li>
                                <li className="flex justify-between"><span>Admin:</span> <strong>07:30 - 13:30</strong></li>
                            </ul>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                            <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
                                <Phone size={28} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-3">Plantão</h4>
                            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                Informações urgentes e sepultamentos.
                            </p>
                            <div className="space-y-3">
                                <div className="bg-amber-50 p-2 rounded-lg text-amber-800 font-bold text-center text-sm">
                                    (88) 99443-8580
                                </div>
                                <a 
                                    href="https://wa.me/5588994438580" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg text-center transition-colors shadow-sm flex items-center justify-center gap-2 text-xs"
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                    WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                             <img 
                                src="https://www.madalena.ce.gov.br/link/link153.png" 
                                alt="Brasão" 
                                className="h-10 w-auto opacity-80 grayscale hover:grayscale-0 transition-all"
                            />
                            <span className="font-bold text-white text-lg">Prefeitura de Madalena</span>
                        </div>
                        <p className="text-sm leading-relaxed opacity-70 max-w-md">
                            Sistema de Gestão de Cemitérios Municipais (SGC). Desenvolvido para modernizar e facilitar o acesso à informação pública e gestão eficiente dos espaços públicos.
                        </p>
                    </div>
                    
                    <div>
                        <h5 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Contato</h5>
                        <ul className="space-y-3 text-sm opacity-70">
                            <li className="flex items-center gap-2"><MapPin size={16}/> Rua Augusto Máximo Vieira, 80</li>
                            <li className="flex items-center gap-2"><Mail size={16}/> gabineteprefmadalena@gmail.com</li>
                            <li className="flex items-center gap-2"><Phone size={16}/>  (88) 99443-8580</li>
                        </ul>
                    </div>

                    <div>
                        <h5 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Acesso Restrito</h5>
                        <p className="text-xs mb-4 opacity-60">Área exclusiva para servidores municipais autorizados.</p>
                        <button 
                            onClick={onEnterAdmin}
                            className="w-full py-2 border border-slate-700 rounded text-sm hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                        >
                            Login Administrativo
                        </button>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 pt-8 mt-8 border-t border-slate-800 text-xs text-center opacity-40">
                    © 2025 Tércio Informática. Todos os Direitos Reservados.
                </div>
            </footer>
        </div>
    );
};
