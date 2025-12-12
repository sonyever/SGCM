
import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, BarChart, Download, Filter, Map, Layers, TrendingUp, TrendingDown, Calendar, ArrowRight, Activity, Users, Award, Briefcase, AlertTriangle, MapPin, Printer, FileText } from 'lucide-react';
import { GraveDisplay, StatusSepultura, TipoSepultura, Cemiterio, Funcionario, CargoFuncionario } from '../types';

interface ReportsModuleProps {
    graves: GraveDisplay[];
    cemiterios: Cemiterio[];
    funcionarios: Funcionario[];
}

interface TypeStats {
    total: number;
    ocupados: number;
}

type ReportType = 'OCUPACAO' | 'MOVIMENTACAO' | 'PRODUTIVIDADE';

export const ReportsModule: React.FC<ReportsModuleProps> = ({ graves, cemiterios, funcionarios }) => {
    const [activeReport, setActiveReport] = useState<ReportType>('OCUPACAO');
    
    // Estado do Cemitério (Filtro Global do Relatório)
    const [selectedCemiterioId, setSelectedCemiterioId] = useState<number | 'ALL'>('ALL');

    // Estados Ocupação
    const [selectedQuadra, setSelectedQuadra] = useState<string>('TODAS');

    // Estados Movimentação e Produtividade
    const [dateStart, setDateStart] = useState<string>('2023-01-01');
    const [dateEnd, setDateEnd] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dateError, setDateError] = useState<string | null>(null);

    // Resetar filtro de quadra ao mudar cemitério
    useEffect(() => {
        setSelectedQuadra('TODAS');
    }, [selectedCemiterioId]);

    // --- FILTRAGEM BASE POR CEMITÉRIO ---
    const gravesByCemetery = useMemo(() => {
        if (selectedCemiterioId === 'ALL') return graves;
        return graves.filter(g => g.cemiterioId === Number(selectedCemiterioId));
    }, [graves, selectedCemiterioId]);

    // --- LÓGICA DE VALIDAÇÃO DE DATA ---
    const handleDateUpdate = () => {
        if (new Date(dateStart) > new Date(dateEnd)) {
            setDateError("A Data Inicial não pode ser maior que a Data Final.");
            return;
        }
        setDateError(null);
    };

    // --- LÓGICA DE OCUPAÇÃO (RF 2.4.2) ---
    const quadras = useMemo(() => {
        const uniqueQuadras = Array.from(new Set(gravesByCemetery.map(g => g.quadra)));
        return uniqueQuadras.sort();
    }, [gravesByCemetery]);

    const filteredGraves = useMemo(() => {
        if (selectedQuadra === 'TODAS') return gravesByCemetery;
        return gravesByCemetery.filter(g => g.quadra === selectedQuadra);
    }, [gravesByCemetery, selectedQuadra]);

    const statsOcupacao = useMemo(() => {
        const total = filteredGraves.length;
        const ocupados = filteredGraves.filter(g => g.status === StatusSepultura.OCUPADO).length;
        const livres = filteredGraves.filter(g => g.status === StatusSepultura.LIVRE).length;
        const exumados = filteredGraves.filter(g => g.status === StatusSepultura.EXUMADO).length;
        const reservados = filteredGraves.filter(g => g.status === StatusSepultura.RESERVADO).length;
        
        const construidos = filteredGraves.filter(g => g.status === StatusSepultura.CONSTRUIDO).length;
        const emManutencao = filteredGraves.filter(g => g.status === StatusSepultura.EM_MANUTENCAO).length;
        const demolidos = filteredGraves.filter(g => g.status === StatusSepultura.DEMOLIDO).length;

        return {
            total,
            ocupados,
            livres,
            exumados,
            reservados,
            construidos,
            emManutencao,
            demolidos,
            outros: exumados + reservados + construidos + emManutencao + demolidos,
            taxaOcupacao: total > 0 ? (ocupados / total) * 100 : 0
        };
    }, [filteredGraves]);

    const byType = useMemo(() => {
        const groups: Record<string, TypeStats> = {};
        Object.values(TipoSepultura).forEach(tipo => {
            groups[tipo] = { total: 0, ocupados: 0 };
        });
        filteredGraves.forEach(g => {
            if (!groups[g.tipoSepultura]) groups[g.tipoSepultura] = { total: 0, ocupados: 0 };
            groups[g.tipoSepultura].total++;
            if (g.status === StatusSepultura.OCUPADO) groups[g.tipoSepultura].ocupados++;
        });
        return groups;
    }, [filteredGraves]);

    // --- LÓGICA DE MOVIMENTAÇÃO (RF 2.4.1) ---
    const movementEvents = useMemo(() => {
        // Generate burial events from grave data
        const burials = gravesByCemetery
            .filter(g => g.sepultamento && g.falecido)
            .map(g => ({
                id: `BURIAL-${g.sepultamento!.id}`,
                type: 'SEPULTAMENTO',
                date: g.sepultamento!.dataSepultamento,
                falecido: g.falecido!.nome,
                local: `Q:${g.quadra} L:${g.lote} S:${g.sepultura}`,
                coveiroId: g.sepultamento?.coveiroId,
                graveData: g // Store full object for document regeneration
            }));

        // Mock exhumations (since we don't strictly track exhumation dates in this simple model yet)
        const exhumations = gravesByCemetery
            .filter(g => g.status === StatusSepultura.EXUMADO)
            .map((g, index) => ({
                id: `EXHUM-${g.id}`,
                type: 'EXUMACAO',
                date: '2023-11-15', // Mock date
                falecido: 'Registro Antigo',
                local: `Q:${g.quadra} L:${g.lote} S:${g.sepultura}`,
                coveiroId: null,
                graveData: g
            }));

        const allEvents = [...burials, ...exhumations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Filter by date range
        const start = new Date(dateStart);
        const end = new Date(dateEnd);
        return allEvents.filter(e => {
            const d = new Date(e.date);
            return d >= start && d <= end;
        });
    }, [gravesByCemetery, dateStart, dateEnd]);

    // --- LÓGICA DE PRODUTIVIDADE (RF 2.4.3) ---
    const statsProdutividade = useMemo(() => {
        // Filter only employees with role COVEIRO
        const coveiros = funcionarios.filter(f => f.cargo === CargoFuncionario.COVEIRO);
        
        return coveiros.map(coveiro => {
            // Count burials associated with this coveiro in the current filtered list
            const burialsCount = movementEvents.filter(e => e.type === 'SEPULTAMENTO' && e.coveiroId === coveiro.id).length;
            
            // Mock maintenance/exhumation counts for demo purposes since they aren't fully linked yet
            const maintenanceCount = Math.floor(Math.random() * 5); 
            const exhumationCount = Math.floor(Math.random() * 2);

            return {
                id: coveiro.id,
                nome: coveiro.nome,
                matricula: coveiro.matricula,
                sepultamentos: burialsCount,
                exumacoes: exhumationCount,
                manutencoes: maintenanceCount,
                total: burialsCount + exhumationCount + maintenanceCount
            };
        }).sort((a, b) => b.total - a.total);
    }, [funcionarios, movementEvents]);


    // --- FUNÇÕES DE IMPRESSÃO ---

    const getReportHeader = (title: string, subtitle: string) => `
        <div class="header">
            <img src="https://www.madalena.ce.gov.br/link/link153.png" alt="Brasão" class="logo-img" />
            <div class="title">${title}</div>
            <div class="subtitle">Prefeitura Municipal de Madalena - SGC</div>
            <div class="meta">
                ${subtitle}<br/>
                Gerado em: ${new Date().toLocaleString('pt-BR')}
            </div>
        </div>
    `;

    const getReportStyles = () => `
        <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: "Helvetica Neue", Arial, sans-serif; color: #111; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-img { height: 80px; margin-bottom: 10px; object-fit: contain; }
            .title { font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 5px 0; }
            .subtitle { font-size: 14px; color: #444; margin-bottom: 5px; }
            .meta { font-size: 10px; color: #666; margin-top: 5px; }
            
            .summary-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; background: #f9f9f9; }
            .summary-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .stat-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
            .stat-label { font-weight: 500; }
            .stat-value { font-weight: bold; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            
            .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
    `;

    const printOccupationReport = () => {
        const cemiterioNome = selectedCemiterioId === 'ALL' 
            ? 'Todos os Cemitérios' 
            : cemiterios.find(c => c.id === Number(selectedCemiterioId))?.nome || 'Cemitério Desconhecido';

        const content = `
        <html>
        <head>
            <title>Relatório de Ocupação - SGC Madalena</title>
            ${getReportStyles()}
        </head>
        <body>
            ${getReportHeader('Relatório de Ocupação', `Cemitério: ${cemiterioNome} | Quadra: ${selectedQuadra}`)}

            <div class="summary-box">
                <div class="summary-title">Resumo Geral</div>
                <div class="stat-row"><span class="stat-label">Total de Sepulturas:</span><span class="stat-value">${statsOcupacao.total}</span></div>
                <div class="stat-row"><span class="stat-label">Ocupadas:</span><span class="stat-value">${statsOcupacao.ocupados} (${statsOcupacao.taxaOcupacao.toFixed(1)}%)</span></div>
                <div class="stat-row"><span class="stat-label">Disponíveis (Livres):</span><span class="stat-value">${statsOcupacao.livres}</span></div>
                <div class="stat-row"><span class="stat-label">Reservadas:</span><span class="stat-value">${statsOcupacao.reservados}</span></div>
                <div class="stat-row"><span class="stat-label">Outros (Exumado/Manutenção):</span><span class="stat-value">${statsOcupacao.outros}</span></div>
            </div>

            <div class="summary-title" style="margin-top: 20px;">Detalhamento por Tipo</div>
            <table>
                <thead>
                    <tr>
                        <th>Tipo de Sepultura</th>
                        <th>Total Cadastrado</th>
                        <th>Ocupados</th>
                        <th>Disponibilidade</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(byType).map(([tipo, data]) => {
                        const d = data as TypeStats;
                        return `
                        <tr>
                            <td>${tipo}</td>
                            <td>${d.total}</td>
                            <td>${d.ocupados}</td>
                            <td>${d.total - d.ocupados}</td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>

            <div class="footer">
                SGC Madalena - Sistema Integrado de Gestão de Cemitérios
            </div>
            <script>window.print();</script>
        </body>
        </html>
        `;
        const win = window.open('', '_blank');
        win?.document.write(content);
        win?.document.close();
    };

    const printMovementReport = () => {
        const cemiterioNome = selectedCemiterioId === 'ALL' 
            ? 'Todos os Cemitérios' 
            : cemiterios.find(c => c.id === Number(selectedCemiterioId))?.nome || 'Cemitério Desconhecido';

        const content = `
        <html>
        <head>
            <title>Relatório de Movimentação - SGC Madalena</title>
            ${getReportStyles()}
        </head>
        <body>
            ${getReportHeader('Relatório de Movimentação', `Período: ${new Date(dateStart).toLocaleDateString()} a ${new Date(dateEnd).toLocaleDateString()} | ${cemiterioNome}`)}

            <div class="summary-box">
                <div class="summary-title">Resumo do Período</div>
                <div class="stat-row"><span class="stat-label">Total de Movimentações:</span><span class="stat-value">${movementEvents.length}</span></div>
                <div class="stat-row"><span class="stat-label">Sepultamentos:</span><span class="stat-value">${movementEvents.filter(e => e.type === 'SEPULTAMENTO').length}</span></div>
                <div class="stat-row"><span class="stat-label">Exumações:</span><span class="stat-value">${movementEvents.filter(e => e.type === 'EXUMACAO').length}</span></div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>Falecido / Alvo</th>
                        <th>Localização</th>
                    </tr>
                </thead>
                <tbody>
                    ${movementEvents.map(event => `
                        <tr>
                            <td>${new Date(event.date).toLocaleDateString()}</td>
                            <td><strong>${event.type}</strong></td>
                            <td>${event.falecido}</td>
                            <td>${event.local}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">
                SGC Madalena - Sistema Integrado de Gestão de Cemitérios
            </div>
            <script>window.print();</script>
        </body>
        </html>
        `;
        const win = window.open('', '_blank');
        win?.document.write(content);
        win?.document.close();
    };

    const reprintBurialGuide = (grave: GraveDisplay) => {
        if (!grave.falecido || !grave.sepultamento) {
            alert("Dados incompletos para gerar o documento.");
            return;
        }

        const data = {
            ...grave.falecido,
            // Map flat structure for the template
            familia: grave.falecido.familia || grave.nomeFamilia || '',
            responsavelNome: grave.responsavel?.nome || '',
            responsavelDoc: grave.responsavel?.documento || '',
            testemunha1: grave.responsavel?.testemunha1 || '',
            testemunha2: grave.responsavel?.testemunha2 || '',
            quadra: grave.quadra,
            lote: grave.lote,
            sepultura: grave.sepultura,
            autorizacao: grave.sepultamento.autorizacaoNro,
            cemiterioNome: cemiterios.find(c => c.id === grave.cemiterioId)?.nome || ''
        };

        const content = `
        <html>
        <head>
            <title>Guia de Sepultamento - ${data.autorizacao}</title>
            <style>
                @page { size: A4; margin: 10mm; }
                body { font-family: "Arial", sans-serif; color: #000; line-height: 1.1; font-size: 10px; }
                .container { width: 100%; border: 1px solid #000; }
                .header { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; text-align: center; }
                .logo { height: 60px; object-fit: contain; }
                .header-text { flex: 1; }
                .header-title { font-size: 10px; margin-bottom: 2px; }
                .header-hmmt { font-size: 16px; font-weight: bold; margin: 2px 0; color: #555; }
                .header-sub { font-size: 8px; }
                .title-box { background: #ddd; text-align: center; font-weight: bold; font-size: 12px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 3px 0; }
                .section-header { background: #eee; text-align: left; font-weight: bold; font-size: 9px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 5px; margin-top: 0; }
                .row { display: flex; width: 100%; border-bottom: 1px solid #000; }
                .col { border-right: 1px solid #000; padding: 2px 4px; display: flex; flex-direction: column; justify-content: center; }
                .col:last-child { border-right: none; }
                .label { font-size: 6px; font-weight: bold; margin-bottom: 1px; color: #444; }
                .value { font-size: 10px; font-weight: bold; text-transform: uppercase; min-height: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .signatures { margin-top: 30px; display: flex; justify-content: space-around; }
                .sig-line { border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; font-size: 8px; }
                .date-loc { margin-top: 20px; text-align: center; font-size: 11px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://www.madalena.ce.gov.br/link/link153.png" alt="Brasão" class="logo" />
                    <div class="header-text">
                        <div class="header-title">PREFEITURA MUNICIPAL DE MADALENA</div>
                        <div class="header-title">SECRETARIA MUNICIPAL DE SAÚDE</div>
                        <div class="header-hmmt">HMMT</div>
                        <div class="header-sub">HOSPITAL E MATERNIDADE MÃE TOTONHA</div>
                    </div>
                    <div style="width: 60px;"></div>
                </div>

                <div class="title-box">GUIA PARA SEPULTAMENTO Nº ${data.autorizacao} (2ª VIA)</div>
                
                <div class="section-header">1. IDENTIFICAÇÃO DO FALECIDO</div>
                <div class="row">
                    <div class="col" style="width: 25%"><span class="label">NÚMERO DA D.O.:</span><span class="value">${data.fichaAmarelaNro || ''}</span></div>
                    <div class="col" style="width: 25%"><span class="label">DATA DO ÓBITO:</span><span class="value">${data.dataObito ? new Date(data.dataObito).toLocaleDateString() : ''}</span></div>
                    <div class="col" style="width: 15%"><span class="label">HORA:</span><span class="value">${data.horaObito || ''}</span></div>
                    <div class="col" style="width: 35%"><span class="label">NATURALIDADE:</span><span class="value">${data.naturalidade || ''}</span></div>
                </div>
                <div class="row"><div class="col" style="width: 100%"><span class="label">NOME DO FALECIDO:</span><span class="value">${data.nome}</span></div></div>
                <div class="row"><div class="col" style="width: 100%"><span class="label">NOME DA FAMÍLIA:</span><span class="value">${data.familia || ''}</span></div></div>
                <div class="row"><div class="col" style="width: 100%"><span class="label">NOME DO PAI:</span><span class="value">${data.nomePai || ''}</span></div></div>
                <div class="row"><div class="col" style="width: 100%"><span class="label">NOME DA MÃE:</span><span class="value">${data.nomeMae || ''}</span></div></div>
                <div class="row">
                    <div class="col" style="width: 20%"><span class="label">DATA NASC.:</span><span class="value">${data.dataNascimento ? new Date(data.dataNascimento).toLocaleDateString() : ''}</span></div>
                    <div class="col" style="width: 15%"><span class="label">SEXO:</span><span class="value">${data.sexo || ''}</span></div>
                    <div class="col" style="width: 20%"><span class="label">RAÇA/COR:</span><span class="value">${data.racaCor || ''}</span></div>
                    <div class="col" style="width: 20%"><span class="label">EST. CIVIL:</span><span class="value">${data.estadoCivil || ''}</span></div>
                    <div class="col" style="width: 25%"><span class="label">ESCOLARIDADE:</span><span class="value">${data.escolaridade || ''}</span></div>
                </div>
                <div class="row"><div class="col" style="width: 100%"><span class="label">OCUPAÇÃO HABITUAL:</span><span class="value">${data.ocupacaoHabitual || ''}</span></div></div>

                <div class="section-header">2. RESIDÊNCIA DO FALECIDO</div>
                <div class="row">
                    <div class="col" style="width: 70%"><span class="label">LOGRADOURO:</span><span class="value">${data.enderecoResidencial || ''}</span></div>
                    <div class="col" style="width: 10%"><span class="label">Nº:</span><span class="value">${data.numeroResidencial || ''}</span></div>
                    <div class="col" style="width: 20%"><span class="label">BAIRRO:</span><span class="value">${data.bairroResidencial || ''}</span></div>
                </div>
                <div class="row">
                    <div class="col" style="width: 80%"><span class="label">MUNICÍPIO DE RESIDÊNCIA:</span><span class="value">${data.municipioResidencial || ''}</span></div>
                    <div class="col" style="width: 20%"><span class="label">CEP:</span><span class="value">${data.cepResidencial || ''}</span></div>
                </div>

                <div class="section-header">3. OCORRÊNCIA DO ÓBITO</div>
                <div class="row"><div class="col" style="width: 100%"><span class="label">LOCAL DE OCORRÊNCIA (ESTABELECIMENTO):</span><span class="value">${data.localOcorrencia || ''}</span></div></div>
                <div class="row">
                    <div class="col" style="width: 60%"><span class="label">ENDEREÇO DA OCORRÊNCIA:</span><span class="value">${data.enderecoOcorrencia || ''}</span></div>
                    <div class="col" style="width: 40%"><span class="label">MUNICÍPIO:</span><span class="value">${data.municipioOcorrencia || ''}</span></div>
                </div>

                <div class="section-header">4. CONDIÇÕES E CAUSAS DO ÓBITO</div>
                <div class="row"><div class="col" style="width: 100%"><span class="label">CAUSA DA MORTE:</span><span class="value">${data.causaObito || ''}</span></div></div>
                <div class="row"><div class="col" style="width: 100%"><span class="label">CAUSAS ANTECEDENTES:</span><span class="value">${data.causasAntecedentes || ''}</span></div></div>

                <div class="section-header">5. MÉDICO / ATESTADO</div>
                <div class="row">
                    <div class="col" style="width: 50%"><span class="label">NOME DO MÉDICO:</span><span class="value">${data.nomeMedico || ''}</span></div>
                    <div class="col" style="width: 15%"><span class="label">CRM:</span><span class="value">${data.crmMedico || ''}</span></div>
                    <div class="col" style="width: 35%"><span class="label">TIPO ATESTADO:</span><span class="value">${data.tipoAtestado || ''}</span></div>
                </div>

                <div class="section-header">6. RESPONSÁVEIS</div>
                <div class="row">
                    <div class="col" style="width: 60%"><span class="label">DECLARANTE (NOME):</span><span class="value">${data.responsavelNome}</span></div>
                     <div class="col" style="width: 40%"><span class="label">DOC. IDENTIDADE:</span><span class="value">${data.responsavelDoc}</span></div>
                </div>

                <div class="section-header">7. DADOS DO SEPULTAMENTO</div>
                <div class="row">
                    <div class="col" style="width: 100%">
                        <span class="label">LOCAL:</span>
                        <span class="value">${data.cemiterioNome} (Q:${data.quadra} L:${data.lote} S:${data.sepultura})</span>
                    </div>
                </div>

                <div class="date-loc">Madalena-CE, ${new Date().toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'})}.</div>
                <div class="signatures">
                    <div class="sig-line">ASSINATURA DO DECLARANTE</div>
                    <div class="sig-line">RESPONSÁVEL PELO SISTEMA (SGC)</div>
                </div>
            </div>
            <script>window.print();</script>
        </body>
        </html>
        `;

        const win = window.open('', '_blank');
        win?.document.write(content);
        win?.document.close();
    };

    const printProductivityReport = () => {
        const content = `
        <html>
        <head>
            <title>Relatório de Produtividade - SGC Madalena</title>
            ${getReportStyles()}
        </head>
        <body>
            ${getReportHeader('Relatório de Produtividade', `Período Base: ${new Date(dateStart).toLocaleDateString()} a ${new Date(dateEnd).toLocaleDateString()}`)}

            <div class="summary-box">
                <div class="summary-title">Resumo da Equipe</div>
                <div class="stat-row"><span class="stat-label">Total de Funcionários (Coveiros):</span><span class="stat-value">${statsProdutividade.length}</span></div>
                <div class="stat-row"><span class="stat-label">Total de Serviços Realizados:</span><span class="stat-value">${statsProdutividade.reduce((acc, curr) => acc + curr.total, 0)}</span></div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Nome do Funcionário</th>
                        <th>Matrícula</th>
                        <th>Sepultamentos</th>
                        <th>Exumações</th>
                        <th>Manutenções</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${statsProdutividade.map(stat => `
                        <tr>
                            <td>${stat.nome}</td>
                            <td>${stat.matricula}</td>
                            <td>${stat.sepultamentos}</td>
                            <td>${stat.exumacoes}</td>
                            <td>${stat.manutencoes}</td>
                            <td><strong>${stat.total}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">
                SGC Madalena - Sistema Integrado de Gestão de Cemitérios
            </div>
            <script>window.print();</script>
        </body>
        </html>
        `;
        const win = window.open('', '_blank');
        win?.document.write(content);
        win?.document.close();
    };

    // --- FUNÇÃO DE EXPORTAR CSV MOVIMENTAÇÃO ---
    const handleExportMovementCSV = () => {
        if (movementEvents.length === 0) {
            alert("Não há dados para exportar neste período.");
            return;
        }

        // CSV Header
        const headers = ["Data", "Tipo", "Falecido/Alvo", "Localização", "ID Evento"];
        
        // CSV Rows
        const rows = movementEvents.map(event => {
            const date = new Date(event.date).toLocaleDateString('pt-BR');
            // Escape quotes in content
            const type = event.type;
            const name = `"${event.falecido.replace(/"/g, '""')}"`;
            const local = `"${event.local.replace(/"/g, '""')}"`;
            const id = event.id;
            
            return `${date},${type},${name},${local},${id}`;
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `relatorio_movimentacao_${dateStart}_${dateEnd}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Relatórios Gerenciais</h2>

            {/* TAB NAVIGATION */}
            <div className="flex border-b border-slate-200">
                <button onClick={() => setActiveReport('OCUPACAO')} className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeReport === 'OCUPACAO' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    <PieChart size={18} /> Ocupação
                </button>
                <button onClick={() => setActiveReport('MOVIMENTACAO')} className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeReport === 'MOVIMENTACAO' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    <Activity size={18} /> Movimentação
                </button>
                <button onClick={() => setActiveReport('PRODUTIVIDADE')} className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeReport === 'PRODUTIVIDADE' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    <Briefcase size={18} /> Produtividade
                </button>
            </div>

            {/* GLOBAL FILTERS */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                    <Filter size={18} /> Filtros:
                </div>
                <select 
                    value={selectedCemiterioId} 
                    onChange={(e) => setSelectedCemiterioId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 outline-none focus:border-emerald-500"
                >
                    <option value="ALL">Todos os Cemitérios</option>
                    {cemiterios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>

                {activeReport === 'OCUPACAO' && (
                    <select 
                        value={selectedQuadra}
                        onChange={(e) => setSelectedQuadra(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 outline-none focus:border-emerald-500"
                    >
                        <option value="TODAS">Todas as Quadras</option>
                        {quadras.map(q => <option key={q} value={q}>Quadra {q}</option>)}
                    </select>
                )}

                {(activeReport === 'MOVIMENTACAO' || activeReport === 'PRODUTIVIDADE') && (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <input 
                                type="date" 
                                value={dateStart} 
                                onChange={(e) => setDateStart(e.target.value)}
                                onBlur={handleDateUpdate}
                                className="pl-3 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-emerald-500"
                            />
                        </div>
                        <ArrowRight size={16} className="text-slate-400" />
                        <div className="relative">
                            <input 
                                type="date" 
                                value={dateEnd} 
                                onChange={(e) => setDateEnd(e.target.value)}
                                onBlur={handleDateUpdate}
                                className="pl-3 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {dateError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertTriangle size={16} /> {dateError}
                </div>
            )}

            {/* REPORT CONTENT */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                
                {activeReport === 'OCUPACAO' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Relatório de Ocupação e Disponibilidade</h3>
                            <button onClick={printOccupationReport} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm">
                                <Printer size={16} /> Imprimir / PDF
                            </button>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-xs font-bold text-slate-500 uppercase">Total Geral</p>
                                <p className="text-2xl font-bold text-slate-800">{statsOcupacao.total}</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                <p className="text-xs font-bold text-red-600 uppercase">Ocupados</p>
                                <p className="text-2xl font-bold text-red-700">{statsOcupacao.ocupados}</p>
                                <p className="text-xs text-red-500">{statsOcupacao.taxaOcupacao.toFixed(1)}% Taxa</p>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                <p className="text-xs font-bold text-emerald-600 uppercase">Livres</p>
                                <p className="text-2xl font-bold text-emerald-700">{statsOcupacao.livres}</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs font-bold text-blue-600 uppercase">Reservados</p>
                                <p className="text-2xl font-bold text-blue-700">{statsOcupacao.reservados}</p>
                            </div>
                        </div>

                        {/* Breakdown Chart Simulation */}
                        <div className="mt-6">
                            <h4 className="font-bold text-slate-700 mb-4">Detalhamento por Tipo de Sepultura</h4>
                            <div className="space-y-4">
                                {Object.entries(byType).map(([tipo, data]) => {
                                    const d = data as TypeStats;
                                    return (
                                    <div key={tipo} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-slate-700">{tipo}</span>
                                            <span className="text-slate-500">{d.ocupados} / {d.total} ocupados</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-emerald-600 rounded-full" 
                                                style={{ width: `${d.total > 0 ? (d.ocupados / d.total) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                )})}
                            </div>
                        </div>
                    </div>
                )}

                {activeReport === 'MOVIMENTACAO' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Histórico de Movimentações</h3>
                            <div className="flex items-center gap-3">
                                <div className="text-sm text-slate-500 hidden md:block">
                                    Período: {new Date(dateStart).toLocaleDateString()} a {new Date(dateEnd).toLocaleDateString()}
                                </div>
                                <button 
                                    onClick={printMovementReport}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm"
                                >
                                    <Printer size={16} /> Imprimir / PDF
                                </button>
                                <button 
                                    onClick={handleExportMovementCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                                >
                                    <Download size={16} /> Exportar CSV
                                </button>
                            </div>
                        </div>

                        {movementEvents.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                                        <tr>
                                            <th className="p-3">Data</th>
                                            <th className="p-3">Tipo</th>
                                            <th className="p-3">Falecido / Alvo</th>
                                            <th className="p-3">Localização</th>
                                            <th className="p-3 text-center">Documento</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {movementEvents.map((event) => (
                                            <tr key={event.id} className="hover:bg-slate-50">
                                                <td className="p-3 font-mono text-slate-600">{new Date(event.date).toLocaleDateString()}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${event.type === 'SEPULTAMENTO' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {event.type}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-medium">{event.falecido}</td>
                                                <td className="p-3 text-slate-500 text-xs">{event.local}</td>
                                                <td className="p-3 text-center">
                                                    {event.type === 'SEPULTAMENTO' && (
                                                        <button 
                                                            onClick={() => reprintBurialGuide(event.graveData)}
                                                            className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded transition-colors inline-flex items-center justify-center"
                                                            title="Ver Guia de Sepultamento"
                                                        >
                                                            <FileText size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Nenhuma movimentação encontrada no período selecionado.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeReport === 'PRODUTIVIDADE' && (
                    <div className="space-y-6">
                         <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Produtividade da Equipe (Coveiros)</h3>
                            <button 
                                onClick={printProductivityReport}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm"
                            >
                                <Printer size={16} /> Imprimir / PDF
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {statsProdutividade.map((stat) => (
                                <div key={stat.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <Award size={60} />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-lg">
                                            {stat.nome.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{stat.nome}</h4>
                                            <p className="text-xs text-slate-500">Matrícula: {stat.matricula}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                                            <span className="text-slate-600 flex items-center gap-2"><ArrowRight size={14}/> Sepultamentos</span>
                                            <span className="font-bold text-slate-900">{stat.sepultamentos}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                                            <span className="text-slate-600 flex items-center gap-2"><ArrowRight size={14}/> Exumações</span>
                                            <span className="font-bold text-slate-900">{stat.exumacoes}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600 flex items-center gap-2"><ArrowRight size={14}/> Manutenções</span>
                                            <span className="font-bold text-slate-900">{stat.manutencoes}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-xs font-bold text-emerald-600 uppercase">Total de Serviços</span>
                                        <span className="text-xl font-bold text-emerald-700">{stat.total}</span>
                                    </div>
                                </div>
                            ))}
                            {statsProdutividade.length === 0 && (
                                <div className="col-span-3 text-center py-10 text-slate-400">
                                    Nenhum dado de produtividade disponível para o filtro atual.
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
