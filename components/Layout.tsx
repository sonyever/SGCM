

import React, { useMemo, useEffect, useState } from 'react';
import { 
    LayoutDashboard, 
    Map, 
    FileText, 
    Search, 
    BarChart, 
    LogOut, 
    Menu, 
    X,
    UserCircle,
    Bot,
    Home,
    MessageSquareText,
    TreeDeciduous,
    Users,
    Settings
} from 'lucide-react';
import { MENU_ITEMS, APP_NAME } from '../constants';
import { UserRole } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onLogout: () => void;
    userRole: UserRole;
    userName?: string;
    userPhoto?: string;
    onProfileClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLogout, userRole, userName, userPhoto, onProfileClick }) => {
    // Initialize based on screen width
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // Auto-open on desktop, auto-close on mobile
            if (!mobile) setIsSidebarOpen(true);
            else setIsSidebarOpen(false);
        };

        // Set initial state
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Home': return <Home size={20} />;
            case 'LayoutDashboard': return <LayoutDashboard size={20} />;
            case 'Map': return <Map size={20} />;
            case 'TreeDeciduous': return <TreeDeciduous size={20} />;
            case 'FileText': return <FileText size={20} />;
            case 'Search': return <Search size={20} />;
            case 'BarChart': return <BarChart size={20} />;
            case 'Bot': return <Bot size={20} />;
            case 'MessageSquareText': return <MessageSquareText size={20} />;
            case 'Users': return <Users size={20} />;
            default: return <LayoutDashboard size={20} />;
        }
    };

    const filteredMenuItems = useMemo(() => {
        if (userRole === 'PUBLIC') return MENU_ITEMS.filter(item => ['map', 'genealogy'].includes(item.id));
        if (userRole === 'ADMIN') return MENU_ITEMS;
        return MENU_ITEMS.filter(item => ['home', 'dashboard', 'map', 'genealogy', 'internal-chat', 'ai-assistant'].includes(item.id));
    }, [userRole]);

    const getUserRoleLabel = () => {
        if (userRole === 'ADMIN') return 'Admin';
        if (userRole === 'PUBLIC') return 'Visitante';
        return 'Operador';
    };

    const handleMenuClick = (id: string) => {
        onTabChange(id);
        if (isMobile) setIsSidebarOpen(false); // Close sidebar on mobile after selection
    };

    const isVisitor = userRole === 'PUBLIC';

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden relative">
            {/* Mobile Sidebar Overlay Backdrop */}
            {isMobile && isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-[65] backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`
                    bg-emerald-900 text-white flex flex-col shadow-xl z-[70] transition-all duration-300
                    ${isMobile ? 'fixed inset-y-0 left-0 h-full' : 'relative h-full'}
                    ${isSidebarOpen ? 'w-64 translate-x-0' : (isMobile ? '-translate-x-full w-64' : 'w-20 translate-x-0')}
                `}
            >
                <div className="h-16 flex items-center justify-center border-b border-emerald-800/50 bg-gradient-to-r from-emerald-950 to-emerald-900 flex-shrink-0 shadow-lg relative z-20">
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-3 font-bold text-lg text-amber-400 tracking-wide px-4">
                            <img 
                                src="https://www.madalena.ce.gov.br/link/link153.png" 
                                alt="Brasão" 
                                className="w-9 h-9 object-contain drop-shadow-lg filter brightness-110"
                            />
                            <span className="truncate font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm">{APP_NAME}</span>
                        </div>
                    ) : (
                        <img 
                            src="https://www.madalena.ce.gov.br/link/link153.png" 
                            alt="Brasão" 
                            className="w-10 h-10 object-contain drop-shadow-lg filter brightness-110"
                        />
                    )}
                </div>

                <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <ul className="space-y-1">
                        {filteredMenuItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    onClick={() => handleMenuClick(item.id)}
                                    className={`w-full flex items-center gap-4 px-6 py-3 transition-colors ${
                                        activeTab === item.id 
                                        ? 'bg-emerald-800 text-yellow-400 border-r-4 border-yellow-400' 
                                        : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                                    }`}
                                >
                                    <div className="min-w-[20px]">{getIcon(item.icon)}</div>
                                    <span className={`whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                                        {item.label}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t border-emerald-800 flex-shrink-0 bg-emerald-900">
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-4 px-2 py-2 text-emerald-200 hover:text-white transition-colors"
                    >
                        <LogOut size={20} />
                        <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
                {/* Header */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 sm:px-6 z-10 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 focus:outline-none"
                        >
                            {isSidebarOpen && !isMobile ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <h1 className="text-sm sm:text-xl font-semibold text-emerald-900 truncate max-w-[200px] sm:max-w-none">
                            Prefeitura Municipal de Madalena
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <div
                            onClick={!isVisitor ? onProfileClick : undefined}
                            className={`flex items-center gap-3 group focus:outline-none p-1.5 rounded-xl transition-all ${!isVisitor ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
                            title={!isVisitor ? "Gerenciar Perfil" : undefined}
                            role={!isVisitor ? "button" : undefined}
                            tabIndex={!isVisitor ? 0 : undefined}
                         >
                             <div className="flex flex-col items-end hidden sm:block text-right">
                                <span className={`text-sm font-bold text-slate-800 leading-tight ${!isVisitor ? 'group-hover:text-emerald-700' : ''} transition-colors`}>
                                    {userName || getUserRoleLabel()}
                                </span>
                                {!isVisitor && (
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide group-hover:text-emerald-600 transition-colors">
                                        {getUserRoleLabel()}
                                    </span>
                                )}
                            </div>
                            <div className={`w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm border border-emerald-200 relative overflow-hidden transition-all ${!isVisitor ? 'group-hover:ring-2 group-hover:ring-emerald-200 group-hover:shadow-md' : ''}`}>
                                 {userPhoto ? (
                                    <img src={userPhoto} alt="Perfil" className={`w-full h-full object-cover transition-transform duration-300 ${!isVisitor ? 'group-hover:scale-110 group-hover:opacity-20' : ''}`} />
                                 ) : userName ? (
                                    <span className={`font-bold text-sm transition-opacity duration-300 ${!isVisitor ? 'group-hover:opacity-0 scale-100 group-hover:scale-90' : ''}`}>
                                        {userName.charAt(0).toUpperCase()}
                                    </span>
                                 ) : (
                                    <UserCircle size={20} className={`transition-opacity duration-300 ${!isVisitor ? 'group-hover:opacity-0' : ''}`} />
                                 )}
                                 
                                 {/* Gear Icon Overlay */}
                                 {!isVisitor && (
                                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100 bg-emerald-100/50 backdrop-blur-[1px] text-emerald-800">
                                        <Settings size={18} />
                                     </div>
                                 )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-3 sm:p-6 relative">
                    <div className="max-w-7xl mx-auto min-h-full pb-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
