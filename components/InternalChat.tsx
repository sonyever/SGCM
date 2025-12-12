
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, User, MessageSquare, Search, Circle, Camera } from 'lucide-react';
import { SystemUser, ChatMessage, UserRole } from '../types';

interface InternalChatProps {
    currentUserRole: UserRole;
    currentUserId: number;
    systemUsers: SystemUser[];
    messages: ChatMessage[];
    onSendMessage: (receiverId: number, content: string) => void;
}

export const InternalChat: React.FC<InternalChatProps> = ({ 
    currentUserRole, 
    currentUserId, 
    systemUsers, 
    messages, 
    onSendMessage 
}) => {
    const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
    const [inputMessage, setInputMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize selected contact
    useEffect(() => {
        if (currentUserRole !== 'ADMIN' && !selectedContactId) {
             const admin = systemUsers.find(u => u.role === 'ADMIN');
             if (admin) setSelectedContactId(admin.id);
             else setSelectedContactId(1); 
        }
    }, [currentUserRole, selectedContactId, systemUsers]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedContactId]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedContactId) return;

        onSendMessage(selectedContactId, inputMessage);
        setInputMessage('');
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && selectedContactId) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                onSendMessage(selectedContactId, base64);
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const isImageContent = (content: string) => {
        return content.startsWith('data:image');
    };

    const getLastMessage = (userId: number) => {
        return messages
            .filter(m => (m.senderId === userId && m.receiverId === currentUserId) || (m.senderId === currentUserId && m.receiverId === userId))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    };

    // Filter and Sort Contacts
    const contactsList = useMemo(() => {
        // 1. Get all known system users excluding self
        let contacts = systemUsers.filter(u => u.id !== currentUserId);

        // 2. Find conversation partners not in the systemUsers list (Dynamic/Ghost users)
        const messagePartners = new Set<number>();
        messages.forEach(m => {
            if (m.senderId === currentUserId) messagePartners.add(m.receiverId);
            if (m.receiverId === currentUserId) messagePartners.add(m.senderId);
        });

        messagePartners.forEach(partnerId => {
            if (partnerId !== currentUserId && !contacts.find(c => c.id === partnerId)) {
                contacts.push({
                    id: partnerId,
                    nome: `Usuário Desconhecido (${partnerId})`, // Fallback
                    username: `user${partnerId}`,
                    role: 'PADRAO'
                });
            }
        });

        // 3. Filter by search
        if (searchTerm) {
            contacts = contacts.filter(u => 
                u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.username.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 4. Sort by recent message
        return contacts.sort((a, b) => {
            const lastMsgA = getLastMessage(a.id);
            const lastMsgB = getLastMessage(b.id);
            
            const timeA = lastMsgA ? new Date(lastMsgA.timestamp).getTime() : 0;
            const timeB = lastMsgB ? new Date(lastMsgB.timestamp).getTime() : 0;
            
            if (timeA === 0 && timeB === 0) return a.nome.localeCompare(b.nome);
            return timeB - timeA;
        });
    }, [systemUsers, currentUserId, messages, searchTerm]);

    const currentChatMessages = useMemo(() => {
        return messages.filter(m => 
            (m.senderId === currentUserId && m.receiverId === selectedContactId) ||
            (m.senderId === selectedContactId && m.receiverId === currentUserId)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages, currentUserId, selectedContactId]);

    const selectedContact = contactsList.find(u => u.id === selectedContactId) || systemUsers.find(u => u.id === selectedContactId);

    const hasUnread = (userId: number) => {
        return messages.some(m => m.senderId === userId && m.receiverId === currentUserId && !m.isRead);
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Sidebar - Users List */}
            {currentUserRole === 'ADMIN' && (
                <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50 flex-shrink-0">
                    <div className="p-4 border-b border-slate-200 bg-white">
                        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <MessageSquare size={20} className="text-emerald-600"/> Conversas
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Buscar usuário..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {contactsList.length > 0 ? (
                            contactsList.map(user => {
                                const unread = hasUnread(user.id);
                                const isSelected = selectedContactId === user.id;
                                const lastMsg = getLastMessage(user.id);

                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedContactId(user.id)}
                                        className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-100 transition-colors flex items-center gap-3 ${isSelected ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : 'border-l-4 border-l-transparent'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${isSelected ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                                            {user.nome.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <span className={`text-sm font-bold truncate ${unread ? 'text-slate-900' : 'text-slate-700'}`}>
                                                    {user.nome}
                                                </span>
                                                {lastMsg && <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className={`text-xs truncate ${unread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                                                    {lastMsg ? (isImageContent(lastMsg.content) ? '📷 Imagem' : lastMsg.content) : <span className="italic text-slate-400">Nenhuma mensagem</span>}
                                                </p>
                                                {unread && <Circle size={8} className="fill-emerald-500 text-emerald-500 flex-shrink-0 ml-2" />}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="p-4 text-center text-slate-400 text-sm">
                                Nenhuma conversa encontrada.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedContactId ? (
                    <>
                        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                    {selectedContact?.nome.charAt(0).toUpperCase() || <User size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{selectedContact?.nome || 'Usuário Desconhecido'}</h3>
                                    <p className="text-xs text-slate-500 uppercase font-medium tracking-wide">
                                        {currentUserRole === 'ADMIN' ? (selectedContact?.role || 'USUÁRIO') : 'Suporte Administrativo'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                            {currentChatMessages.length > 0 ? (
                                currentChatMessages.map((msg) => {
                                    const isMe = msg.senderId === currentUserId;
                                    const isImg = isImageContent(msg.content);

                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm relative ${
                                                isMe 
                                                ? 'bg-emerald-600 text-white rounded-tr-none' 
                                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                            }`}>
                                                {isImg ? (
                                                    <div className="mb-1">
                                                        <img 
                                                            src={msg.content} 
                                                            alt="Imagem" 
                                                            className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                            onClick={() => {
                                                                const w = window.open("");
                                                                w?.document.write('<img src="' + msg.content + '" style="max-width:100%"/>');
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                )}
                                                <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-fade-in">
                                    <MessageSquare size={48} className="mb-2 opacity-20" />
                                    <p>Inicie a conversa.</p>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                                    title="Anexar Imagem"
                                >
                                    <Camera size={20} />
                                </button>
                                <input 
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept="image/*"
                                />

                                <input 
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    className="flex-1 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!inputMessage.trim()}
                                    className="bg-emerald-700 text-white p-3 rounded-lg hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                         <MessageSquare size={64} className="mb-4 opacity-20" />
                         <p className="text-lg font-medium text-slate-500">Selecione uma conversa para começar</p>
                    </div>
                )}
            </div>
        </div>
    );
};
