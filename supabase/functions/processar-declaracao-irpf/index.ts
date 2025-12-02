import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= IRPF Data Extraction Utilities =============

interface ExtractedData {
  profile: ProfileData | null;
  declaracao: DeclaracaoData;
  rendimentos: RendimentoData[];
  bens_direitos: BemDireitoData[];
  dividas: DividaData[];
  resumo: {
    rendimentos_importados: number;
    bens_importados: number;
    dividas_importadas: number;
  };
}

interface ProfileData {
  nome_completo: string;
  cpf: string;
  data_nascimento?: string;
}

interface DeclaracaoData {
  ano: number;
  status: string;
  valor_pagar?: number;
  valor_restituir?: number;
}

interface RendimentoData {
  tipo: string;
  fonte_pagadora: string;
  cnpj?: string;
  valor: number;
  irrf?: number;
  decimo_terceiro?: number;
  contribuicao_previdenciaria?: number;
}

interface BemDireitoData {
  codigo?: string;
  categoria?: string;
  discriminacao: string;
  situacao_ano_anterior?: number;
  situacao_ano_atual: number;
}

interface DividaData {
  discriminacao: string;
  credor?: string;
  valor_ano_anterior?: number;
  valor_ano_atual: number;
}

// Clean currency value from Brazilian format
function limparValor(valorStr: string): number {
  if (!valorStr) return 0;
  const limpo = valorStr
    .replace(/R\$\s*/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')
    .trim();
  const valor = parseFloat(limpo);
  return isNaN(valor) ? 0 : valor;
}

// Extract CPF from text
function extrairCPF(text: string): string | null {
  const patterns = [
    /CPF[:\s]*(\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[-\s]?\d{2})/i,
    /(\d{3}\.\d{3}\.\d{3}-\d{2})/,
    /(\d{11})/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].replace(/\D/g, '');
    }
  }
  return null;
}

// Extract name from text
function extrairNome(text: string): string | null {
  const patterns = [
    /NOME[:\s]+([A-ZÀ-Ú\s]+?)(?=\n|CPF|TITULO)/i,
    /DECLARANTE[:\s]+([A-ZÀ-Ú\s]+?)(?=\n|CPF)/i,
    /CONTRIBUINTE[:\s]+([A-ZÀ-Ú\s]+?)(?=\n|CPF)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

// Extract declaration year
function extrairAnoDeclaracao(text: string): number {
  const patterns = [
    /EXERC[IÍ]CIO[:\s]*(\d{4})/i,
    /ANO.CALEND[AÁ]RIO[:\s]*(\d{4})/i,
    /IRPF\s*(\d{4})/i,
    /DECLARA[CÇ][AÃ]O\s+DE\s+AJUSTE\s+ANUAL\s*[\-–]?\s*(\d{4})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  return new Date().getFullYear();
}

// Extract tax values (to pay or refund)
function extrairValoresImposto(text: string): { valorPagar: number; valorRestituir: number } {
  let valorPagar = 0;
  let valorRestituir = 0;
  
  const pagarMatch = text.match(/IMPOSTO\s+A\s+PAGAR[:\s]*([\d\.,]+)/i);
  if (pagarMatch) {
    valorPagar = limparValor(pagarMatch[1]);
  }
  
  const restituirMatch = text.match(/IMPOSTO\s+A\s+RESTITUIR[:\s]*([\d\.,]+)/i);
  if (restituirMatch) {
    valorRestituir = limparValor(restituirMatch[1]);
  }
  
  return { valorPagar, valorRestituir };
}

// Extract income (rendimentos)
function extrairRendimentos(text: string, ano: number): RendimentoData[] {
  const rendimentos: RendimentoData[] = [];
  
  // Pattern for "Rendimentos Tributáveis Recebidos de Pessoa Jurídica"
  const secaoRendimentos = text.match(/RENDIMENTOS\s+TRIBUT[AÁ]VEIS\s+RECEBIDOS\s+DE\s+PESSOA\s+JUR[IÍ]DICA([\s\S]*?)(?=RENDIMENTOS\s+ISENTOS|BENS\s+E\s+DIREITOS|DEDU[CÇ][OÕ]ES|$)/i);
  
  if (secaoRendimentos) {
    const secao = secaoRendimentos[1];
    
    // Pattern: CNPJ, Nome Fonte, Rendimentos, IRRF, etc.
    const pattern = /(\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\/\s]?\d{4}[-\s]?\d{2})[^\n]*\n[^\n]*?([A-ZÀ-Ú\s]+?)[\s\n]+(?:R\$\s*)?([\d\.,]+)(?:[\s\n]+(?:R\$\s*)?([\d\.,]+))?(?:[\s\n]+(?:R\$\s*)?([\d\.,]+))?/gi;
    
    let match;
    while ((match = pattern.exec(secao)) !== null) {
      const cnpj = match[1].replace(/\D/g, '');
      const fontePagadora = match[2].trim() || 'Fonte não identificada';
      const valor = limparValor(match[3]);
      const irrf = match[4] ? limparValor(match[4]) : 0;
      const contribuicao = match[5] ? limparValor(match[5]) : 0;
      
      if (valor > 0) {
        rendimentos.push({
          tipo: 'Rendimentos Tributáveis PJ',
          fonte_pagadora: fontePagadora,
          cnpj: cnpj,
          valor: valor,
          irrf: irrf,
          contribuicao_previdenciaria: contribuicao
        });
      }
    }
  }
  
  // Simpler fallback pattern
  if (rendimentos.length === 0) {
    const simplePattern = /(?:FONTE\s+PAGADORA|EMPRESA)[:\s]*([A-ZÀ-Ú\s]+?)[\n\s]+(?:CNPJ)?[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})?[\n\s]+(?:RENDIMENTOS|VALOR)[:\s]*R?\$?\s*([\d\.,]+)/gi;
    
    let match;
    while ((match = simplePattern.exec(text)) !== null) {
      const fontePagadora = match[1].trim();
      const cnpj = match[2] ? match[2].replace(/\D/g, '') : undefined;
      const valor = limparValor(match[3]);
      
      if (valor > 0) {
        rendimentos.push({
          tipo: 'Rendimentos Tributáveis',
          fonte_pagadora: fontePagadora,
          cnpj: cnpj,
          valor: valor
        });
      }
    }
  }
  
  // Set year for all rendimentos
  rendimentos.forEach(r => {
    (r as any).ano = ano;
  });
  
  return rendimentos;
}

// Extract assets (bens e direitos)
function extrairBensDireitos(text: string): BemDireitoData[] {
  const bens: BemDireitoData[] = [];
  
  // Find "Bens e Direitos" section
  const secaoBens = text.match(/BENS\s+E\s+DIREITOS([\s\S]*?)(?=D[IÍ]VIDAS\s+E\s+[OÔ]NUS|RENDIMENTOS|PAGAMENTOS|$)/i);
  
  if (secaoBens) {
    const secao = secaoBens[1];
    
    // Pattern: Código - Descrição - Valor Anterior - Valor Atual
    const pattern = /(?:C[OÓ]DIGO|GRUPO)?[:\s]*(\d{2})(?:\s*[-–]\s*)?([^\n]+?)(?:\n|$)[\s\S]*?(?:SITUA[CÇ][AÃ]O\s+EM\s+31\/12\/\d{4})?[:\s]*([\d\.,]+)?[\s\n]+(?:SITUA[CÇ][AÃ]O\s+EM\s+31\/12\/\d{4})?[:\s]*([\d\.,]+)/gi;
    
    let match;
    while ((match = pattern.exec(secao)) !== null) {
      const codigo = match[1];
      const discriminacao = match[2].trim();
      const valorAnterior = match[3] ? limparValor(match[3]) : 0;
      const valorAtual = limparValor(match[4]);
      
      if (discriminacao && valorAtual > 0) {
        bens.push({
          codigo: codigo,
          categoria: categorizarBem(codigo),
          discriminacao: discriminacao.substring(0, 500),
          situacao_ano_anterior: valorAnterior,
          situacao_ano_atual: valorAtual
        });
      }
    }
  }
  
  // Simpler fallback pattern for common assets
  if (bens.length === 0) {
    const fallbackPatterns = [
      /IM[OÓ]VEL[:\s]*([^\n]+)[\s\S]*?(?:VALOR|R\$)\s*([\d\.,]+)/gi,
      /VE[IÍ]CULO[:\s]*([^\n]+)[\s\S]*?(?:VALOR|R\$)\s*([\d\.,]+)/gi,
      /APLICA[CÇ][AÃ]O[:\s]*([^\n]+)[\s\S]*?(?:VALOR|R\$)\s*([\d\.,]+)/gi,
      /CONTA\s+(?:CORRENTE|POUPAN[CÇ]A)[:\s]*([^\n]+)[\s\S]*?(?:SALDO|VALOR|R\$)\s*([\d\.,]+)/gi
    ];
    
    for (const pattern of fallbackPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const discriminacao = match[1].trim();
        const valor = limparValor(match[2]);
        
        if (valor > 0) {
          bens.push({
            discriminacao: discriminacao.substring(0, 500),
            situacao_ano_atual: valor
          });
        }
      }
    }
  }
  
  return bens;
}

// Categorize asset by code
function categorizarBem(codigo: string): string {
  const categorias: Record<string, string> = {
    '01': 'Imóveis',
    '02': 'Veículos',
    '03': 'Aeronaves e Embarcações',
    '04': 'Aplicações e Investimentos',
    '05': 'Créditos',
    '06': 'Depósitos à Vista',
    '07': 'Fundos',
    '08': 'Criptoativos',
    '09': 'Ações',
    '10': 'Outros Bens'
  };
  
  return categorias[codigo] || 'Outros';
}

// Extract debts (dívidas e ônus)
function extrairDividas(text: string): DividaData[] {
  const dividas: DividaData[] = [];
  
  // Find "Dívidas e Ônus" section
  const secaoDividas = text.match(/D[IÍ]VIDAS\s+E\s+[OÔ]NUS([\s\S]*?)(?=RENDIMENTOS|BENS|PAGAMENTOS|INFORMA[CÇ][OÕ]ES|$)/i);
  
  if (secaoDividas) {
    const secao = secaoDividas[1];
    
    // Pattern: Discriminação - Credor - Valores
    const pattern = /(?:DISCRIMINA[CÇ][AÃ]O|DESCRI[CÇ][AÃ]O)[:\s]*([^\n]+)[\s\S]*?(?:CREDOR)?[:\s]*([A-ZÀ-Ú\s]+)?[\s\S]*?(?:SITUA[CÇ][AÃ]O|VALOR)[:\s]*([\d\.,]+)?[\s\n]+([\d\.,]+)?/gi;
    
    let match;
    while ((match = pattern.exec(secao)) !== null) {
      const discriminacao = match[1].trim();
      const credor = match[2] ? match[2].trim() : undefined;
      const valorAnterior = match[3] ? limparValor(match[3]) : 0;
      const valorAtual = match[4] ? limparValor(match[4]) : valorAnterior;
      
      if (discriminacao && valorAtual > 0) {
        dividas.push({
          discriminacao: discriminacao.substring(0, 500),
          credor: credor,
          valor_ano_anterior: valorAnterior,
          valor_ano_atual: valorAtual
        });
      }
    }
  }
  
  return dividas;
}

// Main extraction function
function extrairDadosPDF(text: string, anoFornecido: number): ExtractedData {
  console.log('📄 Starting PDF data extraction...');
  console.log('Text length:', text.length);
  
  // Extract profile data
  const cpf = extrairCPF(text);
  const nome = extrairNome(text);
  const profile: ProfileData | null = (cpf || nome) ? {
    nome_completo: nome || '',
    cpf: cpf || ''
  } : null;
  
  // Extract declaration year and tax values
  const ano = extrairAnoDeclaracao(text) || anoFornecido;
  const { valorPagar, valorRestituir } = extrairValoresImposto(text);
  
  // Extract financial data
  const rendimentos = extrairRendimentos(text, ano);
  const bens_direitos = extrairBensDireitos(text);
  const dividas = extrairDividas(text);
  
  console.log('✅ Extraction complete:', {
    profile: profile ? 'found' : 'not found',
    ano,
    rendimentos: rendimentos.length,
    bens_direitos: bens_direitos.length,
    dividas: dividas.length
  });
  
  return {
    profile,
    declaracao: {
      ano,
      status: 'Processada',
      valor_pagar: valorPagar,
      valor_restituir: valorRestituir
    },
    rendimentos,
    bens_direitos,
    dividas,
    resumo: {
      rendimentos_importados: rendimentos.length,
      bens_importados: bens_direitos.length,
      dividas_importadas: dividas.length
    }
  };
}

// Simple PDF text extraction using basic parsing
async function extractTextFromPDF(fileBuffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(fileBuffer);
  let text = '';
  
  // Check if it's a valid PDF
  const header = new TextDecoder().decode(bytes.slice(0, 8));
  if (!header.includes('%PDF')) {
    throw new Error('Arquivo não é um PDF válido');
  }
  
  // Convert to string and extract readable text
  const fullContent = new TextDecoder('latin1').decode(bytes);
  
  // Extract text between stream/endstream markers
  const streamPattern = /stream\s*([\s\S]*?)\s*endstream/gi;
  let match;
  
  while ((match = streamPattern.exec(fullContent)) !== null) {
    const streamContent = match[1];
    // Extract readable ASCII text
    const readable = streamContent.replace(/[^\x20-\x7E\xA0-\xFF\n\r]/g, ' ');
    text += readable + '\n';
  }
  
  // Also extract text from content objects
  const textPattern = /\(([^)]+)\)/g;
  while ((match = textPattern.exec(fullContent)) !== null) {
    const content = match[1];
    if (content.length > 2 && /[A-Za-z]/.test(content)) {
      text += content + ' ';
    }
  }
  
  // Extract Tj/TJ text operators
  const tjPattern = /\[([^\]]+)\]\s*TJ/gi;
  while ((match = tjPattern.exec(fullContent)) !== null) {
    const parts = match[1].match(/\(([^)]+)\)/g);
    if (parts) {
      for (const part of parts) {
        text += part.slice(1, -1) + ' ';
      }
    }
  }
  
  // Clean up text
  text = text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFFÀ-ÿ\n]/g, '')
    .trim();
  
  console.log('📝 Extracted text preview (first 1000 chars):', text.substring(0, 1000));
  
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

    // Authenticate user
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

    console.log('👤 User authenticated:', user.id);

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const ano = formData.get('ano') as string;

    if (!file) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Arquivo é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ano) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Ano da declaração é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Apenas arquivos PDF são aceitos' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📁 Processing file:', file.name, 'Year:', ano);

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    
    // Extract text from PDF
    let pdfText = '';
    try {
      pdfText = await extractTextFromPDF(fileBuffer);
      console.log('📝 Text extracted, length:', pdfText.length);
    } catch (extractError) {
      console.error('PDF extraction error:', extractError);
      // Continue with basic import if extraction fails
    }

    // Extract data from PDF text
    const extractedData = extrairDadosPDF(pdfText, parseInt(ano));

    // Upload original file to storage
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabaseClient.storage
      .from('declaracoes-irpf')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Continue even if upload fails
    }

    // Create declaration record
    const { data: declaracao, error: declError } = await supabaseClient
      .from('declaracoes_irpf')
      .insert({
        user_id: user.id,
        ano: extractedData.declaracao.ano,
        status: extractedData.declaracao.status,
        arquivo_original: file.name,
        valor_pagar: extractedData.declaracao.valor_pagar || 0,
        valor_restituir: extractedData.declaracao.valor_restituir || 0,
        dados_brutos: { text_length: pdfText.length, extracted: true }
      })
      .select()
      .single();

    if (declError) {
      console.error('Declaration insert error:', declError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Falha ao criar registro da declaração' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Declaration created:', declaracao.id);

    // Insert rendimentos
    if (extractedData.rendimentos.length > 0) {
      const rendimentosToInsert = extractedData.rendimentos.map(r => ({
        user_id: user.id,
        declaracao_id: declaracao.id,
        tipo: r.tipo,
        fonte_pagadora: r.fonte_pagadora,
        cnpj: r.cnpj || null,
        valor: r.valor,
        irrf: r.irrf || 0,
        decimo_terceiro: r.decimo_terceiro || 0,
        contribuicao_previdenciaria: r.contribuicao_previdenciaria || 0,
        ano: extractedData.declaracao.ano
      }));

      const { error: rendError } = await supabaseClient
        .from('rendimentos_irpf')
        .insert(rendimentosToInsert);

      if (rendError) {
        console.error('Rendimentos insert error:', rendError);
      } else {
        console.log('✅ Rendimentos inserted:', rendimentosToInsert.length);
      }
    }

    // Insert bens e direitos
    if (extractedData.bens_direitos.length > 0) {
      const bensToInsert = extractedData.bens_direitos.map(b => ({
        user_id: user.id,
        declaracao_id: declaracao.id,
        codigo: b.codigo || null,
        categoria: b.categoria || 'Outros',
        discriminacao: b.discriminacao,
        situacao_ano_anterior: b.situacao_ano_anterior || 0,
        situacao_ano_atual: b.situacao_ano_atual
      }));

      const { error: bensError } = await supabaseClient
        .from('bens_direitos_irpf')
        .insert(bensToInsert);

      if (bensError) {
        console.error('Bens insert error:', bensError);
      } else {
        console.log('✅ Bens inserted:', bensToInsert.length);
      }
    }

    // Insert dívidas
    if (extractedData.dividas.length > 0) {
      const dividasToInsert = extractedData.dividas.map(d => ({
        user_id: user.id,
        declaracao_id: declaracao.id,
        discriminacao: d.discriminacao,
        credor: d.credor || null,
        valor_ano_anterior: d.valor_ano_anterior || 0,
        valor_ano_atual: d.valor_ano_atual
      }));

      const { error: dividasError } = await supabaseClient
        .from('dividas_irpf')
        .insert(dividasToInsert);

      if (dividasError) {
        console.error('Dívidas insert error:', dividasError);
      } else {
        console.log('✅ Dívidas inserted:', dividasToInsert.length);
      }
    }

    // Update profile if we found CPF (only if not already set)
    if (extractedData.profile?.cpf) {
      const { data: existingProfile } = await supabaseClient
        .from('profiles')
        .select('cpf, nome_completo')
        .eq('id', user.id)
        .single();

      if (existingProfile && !existingProfile.cpf) {
        // Use the encrypt_cpf function for security
        const { error: profileError } = await supabaseClient.rpc('encrypt_cpf', {
          cpf_plain: extractedData.profile.cpf
        }).then(async ({ data: encryptedCpf }) => {
          if (encryptedCpf) {
            return await supabaseClient
              .from('profiles')
              .update({ 
                cpf: encryptedCpf,
                nome_completo: existingProfile.nome_completo || extractedData.profile?.nome_completo 
              })
              .eq('id', user.id);
          }
          return { error: null };
        });

        if (profileError) {
          console.error('Profile update error:', profileError);
        } else {
          console.log('✅ Profile updated with CPF');
        }
      }
    }

    console.log('🎉 Import completed successfully');

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Declaração importada e processada com sucesso!',
        declaracao_id: declaracao.id,
        resumo: extractedData.resumo
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing declaration:', error);
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
