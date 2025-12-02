import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= Interfaces =============

interface ExtractedData {
  profile: ProfileData | null;
  declaracao: DeclaracaoData;
  rendimentos: RendimentoData[];
  bens_imobilizados: BemImobilizadoData[];
  aplicacoes: AplicacaoData[];
  contas_bancarias: ContaBancariaData[];
  transacoes: TransacaoData[];
  bens_direitos: BemDireitoData[];
  dividas: DividaData[];
  resumo: {
    rendimentos_importados: number;
    bens_importados: number;
    aplicacoes_importadas: number;
    contas_importadas: number;
    transacoes_importadas: number;
    dividas_importadas: number;
  };
}

interface ProfileData {
  nome_completo: string;
  cpf: string;
  data_nascimento?: string;
  telefone?: string;
}

interface DeclaracaoData {
  ano: number;
  status: string;
  valor_pagar: number;
  valor_restituir: number;
}

interface RendimentoData {
  tipo: string;
  fonte_pagadora: string;
  cnpj?: string;
  valor: number;
  irrf: number;
  decimo_terceiro: number;
  contribuicao_previdenciaria: number;
  ano: number;
}

interface BemImobilizadoData {
  nome: string;
  categoria: string;
  valor_aquisicao: number;
  valor_atual: number;
  localizacao?: string;
  status: string;
  data_aquisicao: string;
}

interface AplicacaoData {
  nome: string;
  tipo: string;
  instituicao: string;
  valor_aplicado: number;
  valor_atual: number;
  data_aplicacao: string;
}

interface ContaBancariaData {
  banco: string;
  agencia: string;
  numero_conta: string;
  tipo_conta: string;
  saldo_atual: number;
  ativo: boolean;
}

interface TransacaoData {
  data: string;
  descricao: string;
  categoria: string;
  tipo: string;
  valor: number;
  conta: string;
  observacoes: string;
}

interface BemDireitoData {
  codigo?: string;
  categoria?: string;
  discriminacao: string;
  situacao_ano_anterior: number;
  situacao_ano_atual: number;
}

interface DividaData {
  discriminacao: string;
  credor?: string;
  valor_ano_anterior: number;
  valor_ano_atual: number;
}

// ============= Utility Functions =============

function limparValor(valorStr: string): number {
  if (!valorStr) return 0;
  const limpo = valorStr
    .replace(/R\$\s*/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')
    .trim();
  const valor = parseFloat(limpo);
  return isNaN(valor) ? 0 : valor;
}

function formatarData(dataStr: string): string {
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const match = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return new Date().toISOString().split('T')[0];
}

const BANCO_CODES: Record<string, string> = {
  '001': 'Banco do Brasil',
  '104': 'Caixa Econômica Federal',
  '033': 'Banco Santander',
  '237': 'Banco Bradesco',
  '341': 'Banco Itaú',
  '356': 'Banco Real',
  '389': 'Banco Mercantil',
  '422': 'Banco Safra',
  '453': 'Banco Rural',
  '633': 'Banco Rendimento',
  '745': 'Banco Citibank',
};

function inferirTipoAplicacao(discriminacao: string): string {
  const upper = discriminacao.toUpperCase();
  if (upper.includes('POUPAN')) return 'Poupança';
  if (upper.includes('CDB')) return 'CDB';
  if (upper.includes('LCI')) return 'LCI';
  if (upper.includes('LCA')) return 'LCA';
  if (upper.includes('TESOURO') || upper.includes('SELIC')) return 'Tesouro Direto';
  if (upper.includes('FUNDO') || upper.includes('FI ')) return 'Fundo';
  if (upper.includes('RENDA FIXA') || upper.includes('APLICAC')) return 'Renda Fixa';
  if (upper.includes('ACAO') || upper.includes('AÇÕES')) return 'Ações';
  if (upper.includes('CRIPTO') || upper.includes('BITCOIN')) return 'Criptoativos';
  return 'Outro';
}

function extrairInstituicao(discriminacao: string): string {
  const upper = discriminacao.toUpperCase();
  if (upper.includes('BANCO DO BRASIL') || upper.includes('BB ') || upper.includes(' BB')) return 'Banco do Brasil';
  if (upper.includes('CAIXA') || upper.includes('CEF')) return 'Caixa Econômica Federal';
  if (upper.includes('ITAU') || upper.includes('ITAÚ')) return 'Banco Itaú';
  if (upper.includes('BRADESCO')) return 'Banco Bradesco';
  if (upper.includes('SANTANDER')) return 'Banco Santander';
  if (upper.includes('NUBANK')) return 'Nubank';
  if (upper.includes('INTER')) return 'Banco Inter';
  if (upper.includes('XP')) return 'XP Investimentos';
  if (upper.includes('BTG')) return 'BTG Pactual';
  if (upper.includes('RICO')) return 'Rico';
  if (upper.includes('CLEAR')) return 'Clear';
  return 'Não identificado';
}

// ============= Extraction Functions =============

function extrairCPF(text: string): string | null {
  const pattern = /CPF[:\s]*(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/i;
  const match = text.match(pattern);
  if (match) {
    return match[1].replace(/\D/g, '');
  }
  return null;
}

function extrairNome(text: string): string | null {
  const pattern = /Nome[:\s]*\n\s*([A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\s]+)/i;
  const match = text.match(pattern);
  if (match) {
    return match[1].trim();
  }
  return null;
}

function extrairDataNascimento(text: string): string | null {
  const pattern = /Data de Nascimento[:\s]*\n?\s*(\d{2}\/\d{2}\/\d{4})/i;
  const match = text.match(pattern);
  if (match) {
    return formatarData(match[1]);
  }
  return null;
}

function extrairTelefone(text: string): string | null {
  const pattern = /(?:DDD\/Telefone|Telefone)[:\s]*\n?\s*\(?(\d{2})\)?\s*(\d{4,5})-?(\d{4})/i;
  const match = text.match(pattern);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return null;
}

function extrairAnoCalendario(text: string, anoFornecido: number): number {
  // Pattern específico para ANO-CALENDÁRIO conforme especificação
  const patterns = [
    /ANO[- ]?CALEND[AÁ]RIO\s*(\d{4})/i,
    /EXERC[IÍ]CIO\s+(\d{4})\s*ANO/i,
    /ano[- ]?calend[aá]rio[:\s]*(\d{4})/i,
    /calend[aá]rio\s+(\d{4})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const ano = parseInt(match[1]);
      console.log(`✅ Ano extraído do PDF: ${ano}`);
      return ano;
    }
  }
  
  console.log(`⚠️ Ano não encontrado no PDF, usando ano fornecido: ${anoFornecido}`);
  return anoFornecido;
}

function extrairValorRestituir(text: string): number {
  const pattern = /IMPOSTO\s+A\s+RESTITUIR\s+([\d.,]+)/i;
  const match = text.match(pattern);
  if (match) {
    return limparValor(match[1]);
  }
  return 0;
}

function extrairValorPagar(text: string): number {
  const pattern = /(?:SALDO\s+DE\s+)?IMPOSTO\s+A\s+PAGAR\s+([\d.,]+)/i;
  const match = text.match(pattern);
  if (match) {
    return limparValor(match[1]);
  }
  return 0;
}

function extrairStatusDeclaracao(text: string): string {
  if (text.toUpperCase().includes('RETIFICADORA')) {
    return 'Retificadora';
  }
  return 'Original';
}

function extrairRendimentosPJ(text: string, ano: number): RendimentoData[] {
  const rendimentos: RendimentoData[] = [];
  
  // Buscar seção de rendimentos tributáveis de PJ
  const secaoMatch = text.match(/RENDIMENTOS\s+TRIBUT[AÁ]VEIS\s+RECEBIDOS\s+DE\s+PJ([\s\S]*?)(?=RENDIMENTOS\s+TRIBUT[AÁ]VEIS\s+RECEBIDOS\s+DE\s+PF|RENDIMENTOS\s+ISENTOS|BENS\s+E\s+DIREITOS|$)/i);
  
  if (secaoMatch) {
    const secao = secaoMatch[1];
    
    // Padrão: CNPJ, Nome da fonte, valores
    const pattern = /(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})[^\n]*?([A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\s\-]+?)\s+([\d.,]+)\s+([\d.,]+)?\s*([\d.,]+)?/gi;
    
    let match;
    while ((match = pattern.exec(secao)) !== null) {
      const cnpj = match[1].replace(/\D/g, '');
      const fontePagadora = match[2].trim();
      const valor = limparValor(match[3]);
      const contribuicao = match[4] ? limparValor(match[4]) : 0;
      const irrf = match[5] ? limparValor(match[5]) : 0;
      
      if (valor > 0 && fontePagadora.length > 2) {
        rendimentos.push({
          tipo: 'Tributável PJ',
          fonte_pagadora: fontePagadora,
          cnpj,
          valor,
          irrf,
          decimo_terceiro: 0,
          contribuicao_previdenciaria: contribuicao,
          ano
        });
      }
    }
  }
  
  return rendimentos;
}

function extrairRendimentosPF(text: string, ano: number): RendimentoData[] {
  const rendimentos: RendimentoData[] = [];
  
  // Buscar seção de rendimentos de PF / Trabalho autônomo
  const secaoMatch = text.match(/(?:TRABALHO\s+N[AÃ]O\s+ASSALARIADO|RENDIMENTOS\s+TRIBUT[AÁ]VEIS\s+RECEBIDOS\s+DE\s+PF)([\s\S]*?)(?=RENDIMENTOS\s+ISENTOS|BENS\s+E\s+DIREITOS|PAGAMENTOS|$)/i);
  
  if (secaoMatch) {
    // Tentar extrair total anual
    const totalMatch = secaoMatch[1].match(/TOTAL\s+(?:ANUAL)?\s*([\d.,]+)/i);
    if (totalMatch) {
      const valor = limparValor(totalMatch[1]);
      if (valor > 0) {
        rendimentos.push({
          tipo: 'Tributável PF',
          fonte_pagadora: 'Trabalho Autônomo',
          valor,
          irrf: 0,
          decimo_terceiro: 0,
          contribuicao_previdenciaria: 0,
          ano
        });
      }
    }
  }
  
  return rendimentos;
}

function extrairRendimentosExclusivos(text: string, ano: number): RendimentoData[] {
  const rendimentos: RendimentoData[] = [];
  
  const secaoMatch = text.match(/RENDIMENTOS\s+SUJEITOS\s+[AÀ]\s+TRIBUTA[CÇ][AÃ]O\s+EXCLUSIVA([\s\S]*?)(?=BENS\s+E\s+DIREITOS|PAGAMENTOS|$)/i);
  
  if (secaoMatch) {
    const secao = secaoMatch[1];
    
    // Padrão para aplicações financeiras
    const pattern = /([A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\s\-]+?(?:RENDA\s+FIXA|CDB|FUNDO|APLICAC)[^\n]*?)\s+([\d.,]+)/gi;
    
    let match;
    while ((match = pattern.exec(secao)) !== null) {
      const fonte = match[1].trim();
      const valor = limparValor(match[2]);
      
      if (valor > 0) {
        rendimentos.push({
          tipo: 'Exclusivo',
          fonte_pagadora: fonte,
          valor,
          irrf: 0,
          decimo_terceiro: 0,
          contribuicao_previdenciaria: 0,
          ano
        });
      }
    }
  }
  
  return rendimentos;
}

function extrairBensImobilizados(text: string, ano: number): BemImobilizadoData[] {
  const bens: BemImobilizadoData[] = [];
  
  // Buscar seção de Bens e Direitos
  const secaoMatch = text.match(/BENS\s+E\s+DIREITOS([\s\S]*?)(?=D[IÍ]VIDAS|PAGAMENTOS|INFORMA[CÇ][OÕ]ES|$)/i);
  
  if (secaoMatch) {
    const secao = secaoMatch[1];
    
    // Grupo 01 - Imóveis
    const patternImovel = /01\s+(0[1-9]|1[0-6])\s+([^\n]+?(?:CASA|APARTAMENTO|TERRENO|IM[OÓ]VEL|LOTE|SALA|GALPÃO)[^\n]*?)(?:\n.*?)?(\d+[\d.,]*)\s+(\d+[\d.,]*)/gi;
    
    let match;
    while ((match = patternImovel.exec(secao)) !== null) {
      const discriminacao = match[2].trim();
      const valorAnterior = limparValor(match[3]);
      const valorAtual = limparValor(match[4]);
      
      if (valorAtual > 0) {
        // Extrair localização se mencionada
        const locMatch = discriminacao.match(/(?:RUA|AV|AVENIDA|ALAMEDA)\s+[^\d][\w\s,]+/i);
        
        bens.push({
          nome: discriminacao.substring(0, 100),
          categoria: 'Imóvel',
          valor_aquisicao: valorAnterior || valorAtual,
          valor_atual: valorAtual,
          localizacao: locMatch ? locMatch[0].trim() : undefined,
          status: valorAtual > 0 ? 'Ativo' : 'Vendido',
          data_aquisicao: `${ano}-01-01`
        });
      }
    }
    
    // Grupo 02 - Veículos
    const patternVeiculo = /02\s+01\s+([^\n]+?(?:VE[IÍ]CULO|CARRO|MOTO|AUTOM[OÓ]VEL|HONDA|TOYOTA|FIAT|VOLKSWAGEN|CHEVROLET|FORD|HYUNDAI|RENAULT|JEEP|BMW|MERCEDES)[^\n]*?)(?:\n.*?)?(\d+[\d.,]*)\s+(\d+[\d.,]*)/gi;
    
    while ((match = patternVeiculo.exec(secao)) !== null) {
      const discriminacao = match[1].trim();
      const valorAnterior = limparValor(match[2]);
      const valorAtual = limparValor(match[3]);
      
      if (valorAtual > 0) {
        // Extrair placa se mencionada
        const placaMatch = discriminacao.match(/PLACA[:\s]*([A-Z]{3}[\s-]?\d[A-Z\d]\d{2})/i);
        
        bens.push({
          nome: discriminacao.substring(0, 100),
          categoria: 'Veículo',
          valor_aquisicao: valorAnterior || valorAtual,
          valor_atual: valorAtual,
          localizacao: placaMatch ? `Placa: ${placaMatch[1]}` : undefined,
          status: valorAtual > 0 ? 'Ativo' : 'Vendido',
          data_aquisicao: `${ano}-01-01`
        });
      }
    }
  }
  
  return bens;
}

function extrairAplicacoes(text: string, ano: number): AplicacaoData[] {
  const aplicacoes: AplicacaoData[] = [];
  
  const secaoMatch = text.match(/BENS\s+E\s+DIREITOS([\s\S]*?)(?=D[IÍ]VIDAS|PAGAMENTOS|INFORMA[CÇ][OÕ]ES|$)/i);
  
  if (secaoMatch) {
    const secao = secaoMatch[1];
    
    // Grupo 04 - Aplicações (Renda Fixa, CDB, etc.)
    const pattern04 = /04\s+(0[1-9])\s+([^\n]+?)(?:\n.*?)?(\d+[\d.,]*)\s+(\d+[\d.,]*)/gi;
    
    let match;
    while ((match = pattern04.exec(secao)) !== null) {
      const discriminacao = match[2].trim();
      const valorAnterior = limparValor(match[3]);
      const valorAtual = limparValor(match[4]);
      
      if (valorAtual > 0) {
        aplicacoes.push({
          nome: discriminacao.substring(0, 100),
          tipo: inferirTipoAplicacao(discriminacao),
          instituicao: extrairInstituicao(discriminacao),
          valor_aplicado: valorAnterior || valorAtual,
          valor_atual: valorAtual,
          data_aplicacao: `${ano}-01-01`
        });
      }
    }
    
    // Grupo 07 - Fundos
    const pattern07 = /07\s+(0[1-9])\s+([^\n]+?)(?:\n.*?)?(\d+[\d.,]*)\s+(\d+[\d.,]*)/gi;
    
    while ((match = pattern07.exec(secao)) !== null) {
      const discriminacao = match[2].trim();
      const valorAnterior = limparValor(match[3]);
      const valorAtual = limparValor(match[4]);
      
      if (valorAtual > 0) {
        aplicacoes.push({
          nome: discriminacao.substring(0, 100),
          tipo: 'Fundo',
          instituicao: extrairInstituicao(discriminacao),
          valor_aplicado: valorAnterior || valorAtual,
          valor_atual: valorAtual,
          data_aplicacao: `${ano}-01-01`
        });
      }
    }
    
    // Poupança (Grupo 04, código específico ou menção na descrição)
    const patternPoupanca = /(?:04\s+01|POUPAN[CÇ]A)\s+([^\n]+?)(?:\n.*?)?(\d+[\d.,]*)\s+(\d+[\d.,]*)/gi;
    
    while ((match = patternPoupanca.exec(secao)) !== null) {
      const discriminacao = match[1].trim();
      const valorAnterior = limparValor(match[2]);
      const valorAtual = limparValor(match[3]);
      
      if (valorAtual > 0 && discriminacao.toUpperCase().includes('POUPAN')) {
        aplicacoes.push({
          nome: discriminacao.substring(0, 100),
          tipo: 'Poupança',
          instituicao: extrairInstituicao(discriminacao),
          valor_aplicado: valorAnterior || valorAtual,
          valor_atual: valorAtual,
          data_aplicacao: `${ano}-01-01`
        });
      }
    }
  }
  
  return aplicacoes;
}

function extrairContasBancarias(text: string): ContaBancariaData[] {
  const contas: ContaBancariaData[] = [];
  
  const secaoMatch = text.match(/BENS\s+E\s+DIREITOS([\s\S]*?)(?=D[IÍ]VIDAS|PAGAMENTOS|INFORMA[CÇ][OÕ]ES|$)/i);
  
  if (secaoMatch) {
    const secao = secaoMatch[1];
    
    // Grupo 06 - Depósitos à vista (Conta Corrente)
    const pattern = /06\s+01\s+([^\n]+?)(?:\n.*?)?(\d+[\d.,]*)\s+(\d+[\d.,]*)/gi;
    
    let match;
    while ((match = pattern.exec(secao)) !== null) {
      const discriminacao = match[1].trim();
      const saldoAtual = limparValor(match[3]);
      
      // Extrair banco, agência e conta
      const bancoMatch = discriminacao.match(/(\d{3})\s*[-–]\s*([A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\s]+)/i);
      const agenciaMatch = discriminacao.match(/AG[EÊ]NCIA[:\s]*(\d+)/i);
      const contaMatch = discriminacao.match(/(?:CONTA|C\/C)[:\s]*(\d+[-]?\d*)/i);
      
      const codigoBanco = bancoMatch ? bancoMatch[1] : '001';
      const nomeBanco = BANCO_CODES[codigoBanco] || (bancoMatch ? bancoMatch[2].trim() : 'Não identificado');
      
      contas.push({
        banco: nomeBanco,
        agencia: agenciaMatch ? agenciaMatch[1] : '',
        numero_conta: contaMatch ? contaMatch[1] : discriminacao.match(/\d{5,}/)?.[0] || '',
        tipo_conta: 'Conta Corrente',
        saldo_atual: saldoAtual,
        ativo: true
      });
    }
  }
  
  return contas;
}

function extrairTransacoesLivroCaixa(text: string, ano: number): TransacaoData[] {
  const transacoes: TransacaoData[] = [];
  
  // Buscar valor do livro caixa nas deduções
  const pattern = /LIVRO\s+CAIXA\s+([\d.,]+)/i;
  const match = text.match(pattern);
  
  if (match) {
    const valor = limparValor(match[1]);
    if (valor > 0) {
      transacoes.push({
        data: `${ano}-12-31`,
        descricao: 'Despesas Livro Caixa - Atividade Profissional',
        categoria: 'Despesas Profissionais',
        tipo: 'Despesa',
        valor,
        conta: 'Geral',
        observacoes: `Dedução IRPF ${ano}`
      });
    }
  }
  
  return transacoes;
}

function extrairBensDireitos(text: string): BemDireitoData[] {
  const bens: BemDireitoData[] = [];
  
  const secaoMatch = text.match(/BENS\s+E\s+DIREITOS([\s\S]*?)(?=D[IÍ]VIDAS|PAGAMENTOS|INFORMA[CÇ][OÕ]ES|$)/i);
  
  if (secaoMatch) {
    const secao = secaoMatch[1];
    
    // Padrão genérico: Grupo Código Discriminação ValorAnterior ValorAtual
    const pattern = /(\d{2})\s+(\d{2})\s+([^\n]+?)(?:\n.*?)?(\d+[\d.,]*)\s+(\d+[\d.,]*)/gi;
    
    let match;
    while ((match = pattern.exec(secao)) !== null) {
      const grupo = match[1];
      const codigo = match[2];
      const discriminacao = match[3].trim();
      const valorAnterior = limparValor(match[4]);
      const valorAtual = limparValor(match[5]);
      
      if (valorAtual > 0 && discriminacao.length > 3) {
        bens.push({
          codigo: `${grupo}${codigo}`,
          categoria: categorizarBem(grupo),
          discriminacao: discriminacao.substring(0, 500),
          situacao_ano_anterior: valorAnterior,
          situacao_ano_atual: valorAtual
        });
      }
    }
  }
  
  return bens;
}

function categorizarBem(grupo: string): string {
  const categorias: Record<string, string> = {
    '01': 'Imóveis',
    '02': 'Veículos',
    '03': 'Participações Societárias',
    '04': 'Aplicações e Investimentos',
    '05': 'Créditos',
    '06': 'Depósitos',
    '07': 'Fundos',
    '08': 'Criptoativos',
    '09': 'Outros Bens',
    '10': 'Direitos',
    '99': 'Outros'
  };
  return categorias[grupo] || 'Outros';
}

function extrairDividas(text: string): DividaData[] {
  const dividas: DividaData[] = [];
  
  const secaoMatch = text.match(/D[IÍ]VIDAS\s+E\s+[OÔ]NUS\s+REAIS([\s\S]*?)(?=INFORMA[CÇ][OÕ]ES|RESUMO|$)/i);
  
  if (secaoMatch) {
    const secao = secaoMatch[1];
    
    const pattern = /(\d{2})\s+([^\n]+?)(?:\n.*?)?(\d+[\d.,]*)\s+(\d+[\d.,]*)/gi;
    
    let match;
    while ((match = pattern.exec(secao)) !== null) {
      const discriminacao = match[2].trim();
      const valorAnterior = limparValor(match[3]);
      const valorAtual = limparValor(match[4]);
      
      if (valorAtual > 0) {
        dividas.push({
          discriminacao: discriminacao.substring(0, 500),
          valor_ano_anterior: valorAnterior,
          valor_ano_atual: valorAtual
        });
      }
    }
  }
  
  return dividas;
}

// ============= Main Extraction Function =============

function extrairDadosPDF(text: string, anoFornecido: number): ExtractedData {
  console.log('📄 Iniciando extração de dados do PDF...');
  console.log('📝 Tamanho do texto:', text.length);
  
  // Extrair ano da declaração (ANO-CALENDÁRIO)
  const ano = extrairAnoCalendario(text, anoFornecido);
  console.log(`📅 Ano da declaração: ${ano}`);
  
  // Extrair dados do perfil
  const cpf = extrairCPF(text);
  const nome = extrairNome(text);
  const dataNasc = extrairDataNascimento(text);
  const telefone = extrairTelefone(text);
  
  const profile: ProfileData | null = (cpf || nome) ? {
    nome_completo: nome || '',
    cpf: cpf || '',
    data_nascimento: dataNasc || undefined,
    telefone: telefone || undefined
  } : null;
  
  // Extrair dados da declaração
  const valorRestituir = extrairValorRestituir(text);
  const valorPagar = extrairValorPagar(text);
  const status = extrairStatusDeclaracao(text);
  
  // Extrair rendimentos
  const rendimentosPJ = extrairRendimentosPJ(text, ano);
  const rendimentosPF = extrairRendimentosPF(text, ano);
  const rendimentosExclusivos = extrairRendimentosExclusivos(text, ano);
  const rendimentos = [...rendimentosPJ, ...rendimentosPF, ...rendimentosExclusivos];
  
  // Extrair bens e patrimônio
  const bensImobilizados = extrairBensImobilizados(text, ano);
  const aplicacoes = extrairAplicacoes(text, ano);
  const contasBancarias = extrairContasBancarias(text);
  const transacoes = extrairTransacoesLivroCaixa(text, ano);
  const bensDireitos = extrairBensDireitos(text);
  const dividas = extrairDividas(text);
  
  console.log('✅ Extração concluída:', {
    profile: profile ? 'encontrado' : 'não encontrado',
    ano,
    rendimentos: rendimentos.length,
    bens_imobilizados: bensImobilizados.length,
    aplicacoes: aplicacoes.length,
    contas_bancarias: contasBancarias.length,
    transacoes: transacoes.length,
    bens_direitos: bensDireitos.length,
    dividas: dividas.length
  });
  
  return {
    profile,
    declaracao: {
      ano,
      status: status === 'Retificadora' ? 'Retificadora' : 'Processada',
      valor_pagar: valorPagar,
      valor_restituir: valorRestituir
    },
    rendimentos,
    bens_imobilizados: bensImobilizados,
    aplicacoes,
    contas_bancarias: contasBancarias,
    transacoes,
    bens_direitos: bensDireitos,
    dividas,
    resumo: {
      rendimentos_importados: rendimentos.length,
      bens_importados: bensImobilizados.length,
      aplicacoes_importadas: aplicacoes.length,
      contas_importadas: contasBancarias.length,
      transacoes_importadas: transacoes.length,
      dividas_importadas: dividas.length
    }
  };
}

// ============= PDF Text Extraction =============

async function extractTextFromPDF(fileBuffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(fileBuffer);
  let text = '';
  
  const header = new TextDecoder().decode(bytes.slice(0, 8));
  if (!header.includes('%PDF')) {
    throw new Error('Arquivo não é um PDF válido');
  }
  
  const fullContent = new TextDecoder('latin1').decode(bytes);
  
  // Extract text from stream objects
  const streamPattern = /stream\s*([\s\S]*?)\s*endstream/gi;
  let match;
  
  while ((match = streamPattern.exec(fullContent)) !== null) {
    const streamContent = match[1];
    const readable = streamContent.replace(/[^\x20-\x7E\xA0-\xFF\n\r]/g, ' ');
    text += readable + '\n';
  }
  
  // Extract text from parentheses (PDF text objects)
  const textPattern = /\(([^)]+)\)/g;
  while ((match = textPattern.exec(fullContent)) !== null) {
    const content = match[1];
    if (content.length > 2 && /[A-Za-z]/.test(content)) {
      text += content + ' ';
    }
  }
  
  // Extract TJ operator text
  const tjPattern = /\[([^\]]+)\]\s*TJ/gi;
  while ((match = tjPattern.exec(fullContent)) !== null) {
    const parts = match[1].match(/\(([^)]+)\)/g);
    if (parts) {
      for (const part of parts) {
        text += part.slice(1, -1) + ' ';
      }
    }
  }
  
  // Clean up
  text = text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFFÀ-ÿ\n]/g, '')
    .trim();
  
  console.log('📝 Preview do texto extraído (primeiros 2000 chars):', text.substring(0, 2000));
  
  return text;
}

// ============= Main Handler =============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Não autorizado. Faça login novamente.' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('👤 Usuário autenticado:', user.id);

    // Parse JSON body (pdfText already extracted on client side)
    const body = await req.json();
    const { pdfText, ano: anoFornecido, fileName } = body;

    if (!pdfText || typeof pdfText !== 'string') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Texto do PDF é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!anoFornecido) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Ano da declaração é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📁 Processando declaração - Ano fornecido:', anoFornecido, 'Nome arquivo:', fileName || 'não informado');
    console.log('📝 Texto recebido, tamanho:', pdfText.length);
    console.log('📝 Preview do texto (primeiros 2000 chars):', pdfText.substring(0, 2000));

    // Extrair dados usando o ano fornecido como fallback
    const extractedData = extrairDadosPDF(pdfText, anoFornecido);

    // Criar registro da declaração
    const { data: declaracao, error: declError } = await supabaseClient
      .from('declaracoes_irpf')
      .insert({
        user_id: user.id,
        ano: extractedData.declaracao.ano,
        status: extractedData.declaracao.status,
        arquivo_original: fileName || 'declaracao-irpf.pdf',
        valor_pagar: extractedData.declaracao.valor_pagar,
        valor_restituir: extractedData.declaracao.valor_restituir,
        dados_brutos: { text_length: pdfText.length, extracted: true }
      })
      .select()
      .single();

    if (declError) {
      console.error('Erro ao criar declaração:', declError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Falha ao criar registro da declaração' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Declaração criada:', declaracao.id, 'Ano:', extractedData.declaracao.ano);

    // Inserir rendimentos
    if (extractedData.rendimentos.length > 0) {
      const rendimentosToInsert = extractedData.rendimentos.map(r => ({
        user_id: user.id,
        declaracao_id: declaracao.id,
        tipo: r.tipo,
        fonte_pagadora: r.fonte_pagadora,
        cnpj: r.cnpj || null,
        valor: r.valor,
        irrf: r.irrf,
        decimo_terceiro: r.decimo_terceiro,
        contribuicao_previdenciaria: r.contribuicao_previdenciaria,
        ano: extractedData.declaracao.ano
      }));

      const { error: rendError } = await supabaseClient
        .from('rendimentos_irpf')
        .insert(rendimentosToInsert);

      if (rendError) {
        console.error('Erro ao inserir rendimentos:', rendError);
      } else {
        console.log('✅ Rendimentos inseridos:', rendimentosToInsert.length);
      }
    }

    // Inserir bens imobilizados
    if (extractedData.bens_imobilizados.length > 0) {
      const bensToInsert = extractedData.bens_imobilizados.map(b => ({
        user_id: user.id,
        nome: b.nome,
        categoria: b.categoria,
        valor_aquisicao: b.valor_aquisicao,
        valor_atual: b.valor_atual,
        data_aquisicao: b.data_aquisicao,
        localizacao: b.localizacao || null,
        status: b.status
      }));

      const { error: bensError } = await supabaseClient
        .from('bens_imobilizados')
        .insert(bensToInsert);

      if (bensError) {
        console.error('Erro ao inserir bens imobilizados:', bensError);
      } else {
        console.log('✅ Bens imobilizados inseridos:', bensToInsert.length);
      }
    }

    // Inserir aplicações
    if (extractedData.aplicacoes.length > 0) {
      const aplicacoesToInsert = extractedData.aplicacoes.map(a => ({
        user_id: user.id,
        nome: a.nome,
        tipo: a.tipo,
        instituicao: a.instituicao,
        valor_aplicado: a.valor_aplicado,
        valor_atual: a.valor_atual,
        data_aplicacao: a.data_aplicacao
      }));

      const { error: aplError } = await supabaseClient
        .from('aplicacoes')
        .insert(aplicacoesToInsert);

      if (aplError) {
        console.error('Erro ao inserir aplicações:', aplError);
      } else {
        console.log('✅ Aplicações inseridas:', aplicacoesToInsert.length);
      }
    }

    // Inserir contas bancárias
    if (extractedData.contas_bancarias.length > 0) {
      const contasToInsert = extractedData.contas_bancarias.map(c => ({
        user_id: user.id,
        banco: c.banco,
        agencia: c.agencia || '',
        numero_conta: c.numero_conta,
        tipo_conta: c.tipo_conta,
        saldo_atual: c.saldo_atual,
        ativo: c.ativo
      }));

      const { error: contasError } = await supabaseClient
        .from('contas_bancarias')
        .insert(contasToInsert);

      if (contasError) {
        console.error('Erro ao inserir contas bancárias:', contasError);
      } else {
        console.log('✅ Contas bancárias inseridas:', contasToInsert.length);
      }
    }

    // Inserir transações (livro caixa)
    if (extractedData.transacoes.length > 0) {
      const transacoesToInsert = extractedData.transacoes.map(t => ({
        user_id: user.id,
        data: t.data,
        descricao: t.descricao,
        categoria: t.categoria,
        tipo: t.tipo,
        valor: t.valor,
        conta: t.conta,
        observacoes: t.observacoes
      }));

      const { error: transError } = await supabaseClient
        .from('transacoes')
        .insert(transacoesToInsert);

      if (transError) {
        console.error('Erro ao inserir transações:', transError);
      } else {
        console.log('✅ Transações inseridas:', transacoesToInsert.length);
      }
    }

    // Inserir bens e direitos (tabela IRPF)
    if (extractedData.bens_direitos.length > 0) {
      const bensDireitosToInsert = extractedData.bens_direitos.map(b => ({
        user_id: user.id,
        declaracao_id: declaracao.id,
        codigo: b.codigo || null,
        categoria: b.categoria || 'Outros',
        discriminacao: b.discriminacao,
        situacao_ano_anterior: b.situacao_ano_anterior,
        situacao_ano_atual: b.situacao_ano_atual
      }));

      const { error: bdError } = await supabaseClient
        .from('bens_direitos_irpf')
        .insert(bensDireitosToInsert);

      if (bdError) {
        console.error('Erro ao inserir bens/direitos IRPF:', bdError);
      } else {
        console.log('✅ Bens/direitos IRPF inseridos:', bensDireitosToInsert.length);
      }
    }

    // Inserir dívidas
    if (extractedData.dividas.length > 0) {
      const dividasToInsert = extractedData.dividas.map(d => ({
        user_id: user.id,
        declaracao_id: declaracao.id,
        discriminacao: d.discriminacao,
        credor: d.credor || null,
        valor_ano_anterior: d.valor_ano_anterior,
        valor_ano_atual: d.valor_ano_atual
      }));

      const { error: divError } = await supabaseClient
        .from('dividas_irpf')
        .insert(dividasToInsert);

      if (divError) {
        console.error('Erro ao inserir dívidas:', divError);
      } else {
        console.log('✅ Dívidas inseridas:', dividasToInsert.length);
      }
    }

    // Atualizar perfil se encontrou CPF
    if (extractedData.profile?.cpf) {
      const { data: existingProfile } = await supabaseClient
        .from('profiles')
        .select('cpf, nome_completo')
        .eq('id', user.id)
        .single();

      if (existingProfile && !existingProfile.cpf) {
        const { data: encryptedCpf } = await supabaseClient.rpc('encrypt_cpf', {
          cpf_plain: extractedData.profile.cpf
        });

        if (encryptedCpf) {
          const updateData: any = { cpf: encryptedCpf };
          if (!existingProfile.nome_completo && extractedData.profile.nome_completo) {
            updateData.nome_completo = extractedData.profile.nome_completo;
          }
          if (extractedData.profile.telefone) {
            updateData.telefone = extractedData.profile.telefone;
          }
          if (extractedData.profile.data_nascimento) {
            updateData.data_nascimento = extractedData.profile.data_nascimento;
          }

          await supabaseClient
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);
          
          console.log('✅ Perfil atualizado');
        }
      }
    }

    console.log('🎉 Importação concluída com sucesso!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Declaração importada e processada com sucesso!',
        declaracao_id: declaracao.id,
        ano: extractedData.declaracao.ano,
        resumo: extractedData.resumo
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro ao processar declaração:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar declaração' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
