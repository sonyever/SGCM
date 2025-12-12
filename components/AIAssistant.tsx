
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Loader, Bot, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { StatusSepultura, GraveDisplay, Cemiterio } from '../types';

interface AIAssistantProps {
    graves: GraveDisplay[];
    cemiterios: Cemiterio[];
}

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ graves, cemiterios }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'model',
            text: 'Olá! Sou seu assistente virtual do SGC Madalena. Posso ajudar com informações sobre sepulturas, ocupação, registros e muito mais. Como posso ajudar hoje?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Prepare context data for the AI using REAL data from props
    const getContextData = () => {
        const totalGraves = graves.length;
        const occupied = graves.filter(g => g.status === StatusSepultura.OCUPADO).length;
        const free = graves.filter(g => g.status === StatusSepultura.LIVRE).length;
        const exhumed = graves.filter(g => g.status === StatusSepultura.EXUMADO).length;
        
        // Simplify grave data to save tokens but provide meaningful context
        // We limit to the most recent burials or critical statuses if the list is too huge, 
        // but for this app size, we can probably send a good chunk or summary.
        const gravesSummary = graves.map(g => ({
            cemiterio_id: g.cemiterioId,
            loc: `Q:${g.quadra}-L:${g.lote}-S:${g.sepultura}`,
            status: g.status,
            falecido: g.falecido ? g.falecido.nome : 'N/A'
        }));

        const cemeteryList = cemiterios.map(c => `${c.id} - ${c.nome}`);

        return JSON.stringify({
            cemiterios_cadastrados: cemeteryList,
            estatisticas_gerais: { total: totalGraves, ocupadas: occupied, livres: free, exumadas: exhumed },
            lista_sepulturas: gravesSummary
        });
    };

    const apiKey = process.env.API_KEY || "AIzaSyAsK_EkUtYd2ObjBboUeJRpcistIZUzkEY";

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        // Try to trigger key selection if missing and supported
        if (!apiKey && (window as any).aistudio) {
            try {
                await (window as any).aistudio.openSelectKey();
            } catch (e) {
                console.error("Error selecting key:", e);
            }
        }

        if (!apiKey) {
             setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'user',
                text: input,
                timestamp: new Date()
            }]);
            
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'model',
                    text: "Por favor, configure a chave de API clicando no botão 'Conectar Chave API' acima para prosseguir.",
                    timestamp: new Date()
                }]);
            }, 500);
            setInput('');
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey });
            
            const systemInstruction = `
                Você é um Assistente Virtual Inteligente especializado no Sistema de Gestão de Cemitério Municipal de Madalena (SGC Madalena).
                Sua função é auxiliar administradores municipais com informações precisas e insights sobre a gestão dos cemitérios.
                
                DADOS DO SISTEMA (Contexto Atualizado em Tempo Real):
                ${getContextData()}

                DIRETRIZES:
                1. Responda de forma polida, profissional e direta (pt-BR).
                2. Use os dados fornecidos no contexto para responder perguntas sobre ocupação, nomes de falecidos, disponibilidade e localização.
                3. Se não souber a resposta com base nos dados, informe que a informação não consta no sistema atual.
                4. O formato das sepulturas é Quadra, Lote e Sepultura.
                5. Hoje é ${new Date().toLocaleDateString('pt-BR')}.
                6. Se perguntarem "quem está enterrado na sepultura X", procure na lista_sepulturas e responda.
                7. Se pedirem estatísticas, use o objeto estatisticas_gerais.
            `;

            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.7,
                },
                history: messages.map(m => ({
                    role: m.role,
                    parts: [{ text: m.text }]
                }))
            });

            const result = await chat.sendMessage({ message: userMessage.text });
            const responseText = result.text;

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseText,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);

        } catch (error: any) {
            console.error("Erro ao chamar Gemini:", error);
            
            if (error.toString().includes("Requested entity was not found") || error.message?.includes("Requested entity was not found")) {
                 if ((window as any).aistudio) {
                     // Reset key if invalid
                     await (window as any).aistudio.openSelectKey();
                 }
                 setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'model',
                    text: "A chave de API parece inválida ou expirada. Por favor, tente selecionar a chave novamente.",
                    timestamp: new Date()
                }]);
            } else {
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'model',
                    text: "Desculpe, ocorreu um erro ao processar sua solicitação. Verifique sua conexão.",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
                    <Bot size={24} className="text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Assistente Virtual Inteligente</h2>
                    <p className="text-indigo-600 font-medium flex items-center gap-1">
                        Powered by Google Gemini
                    </p>
                </div>
            </div>

            {/* Chat Container */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`
                                max-w-[80%] rounded-2xl p-4 shadow-sm relative
                                ${msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                }
                            `}>
                                <div className="flex items-center gap-2 mb-1 opacity-80 text-xs">
                                    {msg.role === 'user' ? <User size={12} /> : <Sparkles size={12} />}
                                    <span>{msg.role === 'user' ? 'Você' : 'SGC IA'}</span>
                                    <span>•</span>
                                    <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="whitespace-pre-wrap leading-relaxed">
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-3">
                                <Loader size={18} className="animate-spin text-indigo-600" />
                                <span className="text-slate-500 text-sm">Analisando dados...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    {!apiKey && (
                         <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col items-start gap-3">
                            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                                <AlertCircle size={18} />
                                Configuração Necessária
                            </div>
                            <p className="text-sm text-indigo-800">
                                Para utilizar o assistente inteligente, é necessário conectar sua chave de API (Google Gemini).
                            </p>
                            <button 
                                onClick={() => (window as any).aistudio?.openSelectKey()}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors flex items-center gap-2"
                            >
                                <Sparkles size={16} />
                                Conectar Chave API
                            </button>
                         </div>
                    )}
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Pergunte sobre sepultamentos, estatísticas ou disponibilidade..."
                                className="w-full pl-4 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none min-h-[56px] max-h-32 text-slate-700 placeholder:text-slate-400"
                                rows={1}
                            />
                        </div>
                        <button 
                            onClick={handleSendMessage}
                            disabled={isLoading || !input.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 flex-shrink-0"
                        >
                            {isLoading ? <Loader size={24} className="animate-spin" /> : <Send size={24} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
