import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const ano = formData.get('ano') as string;

    if (!file || !ano) {
      return new Response(JSON.stringify({ error: 'File and year are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing declaration for year:', ano);

    // Upload file to storage
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
      return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read file content as base64 for better AI processing
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to base64 safely for large files
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64 = btoa(binary);
    
    console.log('File size:', arrayBuffer.byteLength, 'bytes');
    
    // Log para debug - primeiros caracteres do PDF
    const pdfPreview = base64.substring(0, 500);
    console.log('PDF preview (first 500 base64 chars):', pdfPreview.substring(0, 100) + '...');
    console.log('Base64 length:', base64.length);

    // Use Lovable AI to extract and categorize data with improved prompt
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `VOCÊ É UM ROBÔ DE CÓPIA DE TEXTO. NÃO É UM CRIADOR.

════════════════════════════════════════
MISSÃO: COPIAR TEXTO DO PDF
════════════════════════════════════════

✅ ÚNICO TRABALHO PERMITIDO:
Ler o PDF e COPIAR exatamente o que está escrito.

❌ TRABALHOS PROIBIDOS:
• Inventar nomes
• Inventar endereços
• Inventar valores
• Inventar empresas
• Inventar qualquer coisa

════════════════════════════════════════
EXEMPLOS DE DADOS PROIBIDOS:
════════════════════════════════════════

❌ NUNCA retorne estes dados (são INVENÇÕES):
• Nome: "João da Silva", "Maria Santos", "José Pereira"
• Empresa: "Empresa Modelo LTDA", "Companhia Exemplo"
• Endereço: "Rua das Flores", "Rua Principal", "Avenida Central"
• Veículo: "Honda Civic 2021", "Fiat Uno 2020"
• Banco: "Banco Exemplo", "Banco X"

✅ SOMENTE retorne dados que você REALMENTE VÊ no PDF

════════════════════════════════════════
REGRA DE OURO:
════════════════════════════════════════

Para CADA palavra que você colocar na resposta, pergunte:
"Eu CONSIGO APONTAR onde isso está escrito no PDF?"

Se NÃO → REMOVA da resposta

════════════════════════════════════════
CATEGORIZAÇÃO POR CÓDIGO:
════════════════════════════════════════

🏠 IMÓVEIS (Código 01-09) → bens_imobilizados:
- 01 = Prédio residencial
- 02 = Terreno 
- 03 = Prédio comercial/industrial
- categoria: "Imóvel"

🚗 VEÍCULOS (Código 11-19) → bens_imobilizados:
- 11 = Carro, caminhonete
- 12 = Motocicleta
- categoria: "Veículo"

🚤 EMBARCAÇÕES/AERONAVES (Código 21-29) → bens_imobilizados:
- 21 = Aeronave, avião
- 22 = Embarcação, barco
- categoria: "Outro"

📈 AÇÕES E QUOTAS (Código 31-39) → aplicacoes:
- 31 = Ações (negociadas em bolsa)
- 32 = Quotas de fundos mútuos de ações
- 39 = Outras participações societárias
- tipo: "Ações"

💼 FUNDOS (Código 41-49) → aplicacoes:
- 41 = Fundos de investimento
- 42 = Fundos de investimento imobiliário
- 45 = Criptoativos (Bitcoin, Ethereum, etc.)
- 46 = Outros fundos
- tipo: "Fundo" (ou "Outro" para código 45)

💰 DEPÓSITOS (Código 51-59) → contas_bancarias:
- 51 = Conta corrente
- 52 = Conta poupança
- tipo_conta: "Corrente" ou "Poupança"

📊 APLICAÇÕES DE RENDA FIXA (Código 61-69) → aplicacoes:
- 61 = Caderneta de poupança
- 62 = Fundos de renda fixa
- 63 = Certificado de depósito bancário (CDB)
- 65 = Crédito de poupança/letras imobiliárias
- 66 = Letras de câmbio
- 67 = Títulos públicos
- tipo: "CDB", "LCI", "LCA", "Tesouro Direto", conforme o caso

🏦 PREVIDÊNCIA PRIVADA (Código 71-79) → previdencia:
- Código 71 = VGBL (Vida Gerador de Benefício Livre)
- Código 72 = PGBL (Plano Gerador de Benefício Livre)
- Código 73 = FAPI (Fundo de Aposentadoria Programada Individual)
- Código 74 = Outros planos de previdência
- Código 79 = Fundos de previdência complementar
- tipo: "VGBL", "PGBL", "FAPI" conforme o código
- ⚠️ ATENÇÃO: Se ver palavras como "VGBL", "PGBL", "FAPI", "Previdência", "Aposentadoria", "Seguradora" → é previdencia!

📑 OUTROS BENS (Código 81-99) → aplicacoes ou bens_imobilizados:
- 81 = Joias, obras de arte
- 82 = Outros bens móveis
- 91 = Créditos decorrentes de empréstimos
- 99 = Outros bens e direitos

💳 DÍVIDAS E ÔNUS REAIS (SEÇÃO SEPARADA) → dividas:
- 11 = Estabelecimento bancário do país
- 12 = Estabelecimento bancário do exterior
- 13 = Pessoas físicas
- 14 = Pessoas jurídicas
- 15 = Empréstimos de instituição financeira
- 16 = Financiamento de veículo
- 17 = Financiamento imobiliário

🔍 INSTRUÇÕES ESPECÍFICAS:

Para PREVIDÊNCIA:
- O valor em "Situação 31/12/20XX" = valor_acumulado
- Se não houver contribuição mensal explícita, use contribuicao_mensal: 0
- SEMPRE preencha: nome (descrição do plano), tipo (VGBL/PGBL/FAPI), instituicao (seguradora/banco)
- Exemplo de descrição: "71 - VGBL - BRADESCO VIDA E PREVIDÊNCIA" → nome: "VGBL BRADESCO", tipo: "VGBL", instituicao: "Bradesco"

Para CONTAS BANCÁRIAS:
- Se aparecer apenas "Conta corrente Banco X", está OK!
- banco: nome do banco
- agencia: se não tiver, use "0000"
- numero_conta: se não tiver, use "00000-0"
- tipo_conta: DEVE SER EXATAMENTE um destes valores: "Corrente" | "Poupança" | "Salário" | "Investimento"
- saldo_atual: valor em 31/12

Para APLICAÇÕES:
- Nome curto e descritivo
- tipo: DEVE SER EXATAMENTE um destes valores: "CDB" | "LCI" | "LCA" | "Tesouro Direto" | "Fundo" | "Ações" | "Outro"
  * Para poupança: use "Outro"
  * Para fundos de investimento: use "Fundo"
  * Para títulos do tesouro: use "Tesouro Direto"
  * Para ações na bolsa: use "Ações"
  * Se não souber classificar: use "Outro"
- instituicao: banco ou corretora
- valor_aplicado: valor de aquisição ou valor ano anterior
- valor_atual: valor em 31/12 do ano da declaração
- liquidez (opcional): DEVE SER EXATAMENTE: "Diária" | "Mensal" | "No Vencimento"
- rentabilidade_tipo (opcional): DEVE SER EXATAMENTE: "CDI" | "IPCA" | "Pré-fixado" | "Variável"

Para BENS IMOBILIZADOS:
- categoria: "Imóvel", "Veículo", ou "Outro"
- nome: descrição curta (ex: "Apartamento Rua X" ou "Honda Civic 2020")
- descricao: descrição completa do PDF
- valor_aquisicao: valor de aquisição
- valor_atual: valor em 31/12
- localizacao: endereço ou "Brasil" se não especificado

Para DÍVIDAS:
- nome: descrição da dívida
- tipo: "Financiamento Imobiliário", "Financiamento Veículo", "Empréstimo Pessoal", "Cartão de Crédito", "Outro"
- credor: nome do credor (banco, pessoa física, etc.)
- valor_original: valor total original (se disponível, senão use saldo_devedor)
- saldo_devedor: saldo em 31/12

✅ COMO PROCEDER:
1. Leia o PDF linha por linha na seção "BENS E DIREITOS"
2. Para CADA linha que contenha um CÓDIGO e um VALOR, extraia os dados
3. Categorize baseado no código usando as regras acima
4. Se faltar informação (ex: agência, conta), use valores padrão sensatos
5. Leia a seção "DÍVIDAS E ÔNUS REAIS" e extraia TODAS as dívidas

⚠️ VALIDAÇÃO FINAL:
Antes de retornar, pergunte:
- "Olhei TODOS os códigos 71, 72, 73 (previdência)?"
- "Olhei TODOS os códigos 51, 52 (contas)?"
- "Extraí TODAS as aplicações (códigos 31-49, 61-69)?"
- "Extraí TODOS os bens (códigos 01-29, 81-99)?"
- "Extraí TODAS as dívidas da seção específica?"

Se esqueceu algo, VOLTE e extraia!`
          },
          {
            role: 'user',
            content: `LEIA O PDF E COPIE OS DADOS EXATOS.

🔴 DADOS PROIBIDOS (são invenções da sua imaginação):
• "João da Silva", "Maria Santos" → INVENTADOS
• "Rua das Flores", "Avenida Central" → INVENTADOS  
• "Honda Civic 2021", "Fiat Uno" → INVENTADOS
• "Empresa Modelo LTDA" → INVENTADO

✅ SEU TRABALHO:
Copiar palavra por palavra o que REALMENTE está no PDF.

📄 PDF: ${base64.substring(0, 200000)}

📤 RETORNE JSON COM DADOS REAIS:

🎯 CHECKLIST DE EXTRAÇÃO:

1️⃣ SEÇÃO "BENS E DIREITOS" - Extraia TODOS os itens:
   □ Imóveis (códigos 01-09)
   □ Veículos (códigos 11-19)
   □ Ações e quotas (códigos 31-39)
   □ Fundos (códigos 41-49)
   □ Contas bancárias (códigos 51-59)
   □ Aplicações de renda fixa (códigos 61-69)
   □ ⭐ PREVIDÊNCIA PRIVADA (códigos 71-79) - CRÍTICO!
   □ Outros bens (códigos 81-99)

2️⃣ SEÇÃO "DÍVIDAS E ÔNUS REAIS" - Extraia TODAS as dívidas:
   □ Financiamentos imobiliários
   □ Financiamentos de veículos
   □ Empréstimos pessoais
   □ Outras dívidas

📤 FORMATO DE RETORNO (JSON puro, sem markdown):
{
  "contribuinte": {
    "nome": "NOME EXATO DO PDF",
    "cpf": "000.000.000-00"
  },
  "declaracao": {
    "ano": 2024,
    "status": "Importada",
    "recibo": "número do recibo se houver, senão null"
  },
  "rendimentos": [
    {
      "fonte_pagadora": "Nome da empresa",
      "cnpj": "00.000.000/0000-00",
      "tipo": "Salário | Pró-labore | Pensão | Outro",
      "valor": 0,
      "irrf": 0,
      "contribuicao_previdenciaria": 0,
      "decimo_terceiro": 0
    }
  ],
  "bens_imobilizados": [
    {
      "nome": "Descrição curta (ex: Apartamento Rua X ou Honda Civic)",
      "categoria": "Imóvel | Veículo | Outro",
      "descricao": "Descrição completa do PDF",
      "valor_aquisicao": 0,
      "valor_atual": 0,
      "localizacao": "Endereço completo ou Brasil"
    }
  ],
  "aplicacoes": [
    {
      "nome": "Nome da aplicação",
      "tipo": "CDB | LCI | LCA | Tesouro Direto | Fundo | Ações | Outro",
      "instituicao": "Nome do banco ou corretora",
      "valor_aplicado": 0,
      "valor_atual": 0,
      "liquidez": "Diária | Mensal | No Vencimento (opcional)",
      "rentabilidade_tipo": "CDI | IPCA | Pré-fixado | Variável (opcional)"
    }
  ],
  "previdencia": [
    {
      "nome": "Nome do plano (ex: VGBL Bradesco)",
      "tipo": "PGBL | VGBL | FAPI",
      "instituicao": "Nome da seguradora ou banco",
      "valor_acumulado": 0,
      "contribuicao_mensal": 0
    }
  ],
  "contas_bancarias": [
    {
      "banco": "Nome do banco",
      "agencia": "0000 (ou 0000 se não souber)",
      "numero_conta": "00000-0 (ou 00000-0 se não souber)",
      "tipo_conta": "Corrente | Poupança | Salário | Investimento",
      "saldo_atual": 0
    }
  ],
  "dividas": [
    {
      "nome": "Descrição da dívida",
      "tipo": "Financiamento Imobiliário | Financiamento Veículo | Empréstimo Pessoal | Cartão de Crédito | Outro",
      "credor": "Nome do credor",
      "valor_original": 0,
      "saldo_devedor": 0
    }
  ]
}

🔍 EXEMPLOS DE BOA EXTRAÇÃO:

EXEMPLO 1 - VGBL (código 71):
Se você vê: "71 - VGBL - BANCO DO BRASIL - R$ 15.000,00"
Retorne em previdencia:
{
  "nome": "VGBL Banco do Brasil",
  "tipo": "VGBL",
  "instituicao": "Banco do Brasil",
  "valor_acumulado": 15000,
  "contribuicao_mensal": 0
}

EXEMPLO 2 - Conta Corrente (código 51):
Se você vê: "51 - Conta Corrente - Banco Itaú - R$ 5.340,10"
Retorne em contas_bancarias:
{
  "banco": "Banco Itaú",
  "agencia": "0000",
  "numero_conta": "00000-0",
  "tipo_conta": "Corrente",
  "saldo_atual": 5340.10
}

EXEMPLO 3 - CDB (código 63):
Se você vê: "63 - CDB - Banco Bradesco - R$ 50.000,00"
Retorne em aplicacoes:
{
  "nome": "CDB Bradesco",
  "tipo": "CDB",
  "instituicao": "Banco Bradesco",
  "valor_aplicado": 50000,
  "valor_atual": 50000,
  "liquidez": "No Vencimento",
  "rentabilidade_tipo": "CDI"
}

EXEMPLO 4 - Poupança (código 61):
Se você vê: "61 - Caderneta de Poupança - Banco Santander - R$ 12.500,00"
Retorne em aplicacoes:
{
  "nome": "Poupança Santander",
  "tipo": "Outro",
  "instituicao": "Banco Santander",
  "valor_aplicado": 12500,
  "valor_atual": 12500,
  "liquidez": "Diária"
}

🛑 VALIDAÇÃO FINAL OBRIGATÓRIA - FAÇA ESTAS PERGUNTAS:

1. "Cada item que retornei EXISTE LITERALMENTE no PDF?"
   ❌ Se NÃO → REMOVA o item inventado
   
2. "Os valores são EXATAMENTE como estão no PDF?"
   ❌ Se NÃO → Corrija ou remova
   
3. "Eu inventei algum nome, banco ou instituição?"
   ❌ Se SIM → REMOVA o item
   
4. "Se não encontrei dados em uma categoria, retornei [] vazio?"
   ❌ Se NÃO → Corrija para []
   
5. "Tenho 100% de certeza de que NADA foi inventado?"
   ❌ Se NÃO → Revise e remova dados duvidosos

⚠️ LEMBRE-SE: É MELHOR retornar MENOS itens (só os reais) do que MAIS itens (com dados inventados)!

🔒 REQUISITOS CRÍTICOS PARA O JSON DE RETORNO:
1. O JSON deve ser VÁLIDO e bem formatado
2. TODAS as strings devem ter aspas duplas escapadas se necessário
3. NÃO inclua quebras de linha dentro de valores de string (use espaços)
4. NÃO coloque vírgula após o último elemento de arrays ou objetos
5. Retorne APENAS o JSON puro, sem blocos de código markdown (sem \`\`\`json)
6. Antes de retornar, VALIDE que o JSON pode ser parseado corretamente

FORMATO FINAL: Retorne apenas o objeto JSON começando com { e terminando com }, sem nenhum texto adicional antes ou depois.`
          }
        ],
        max_completion_tokens: 8000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      let userMessage = 'Falha ao processar o PDF com IA. Por favor, tente novamente.';
      
      // Provide specific error messages based on status code
      if (aiResponse.status === 402) {
        userMessage = '⚠️ Créditos insuficientes na Lovable AI. Por favor, adicione créditos em Settings → Workspace → Usage no painel da Lovable e tente novamente.';
      } else if (aiResponse.status === 429) {
        userMessage = 'Limite de requisições atingido. Por favor, aguarde alguns instantes e tente novamente.';
      } else if (aiResponse.status === 401) {
        userMessage = 'Erro de autenticação com a API. Por favor, contate o suporte.';
      }
      
      return new Response(JSON.stringify({ 
        error: userMessage,
        details: errorText 
      }), {
        status: aiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get response text first to handle empty responses
    const responseText = await aiResponse.text();
    console.log('AI response received, length:', responseText.length);
    
    if (!responseText || responseText.trim().length === 0) {
      console.error('Empty AI response');
      return new Response(JSON.stringify({ 
        error: 'A IA retornou uma resposta vazia. Por favor, tente novamente com um arquivo PDF diferente ou verifique se o arquivo não está corrompido.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let aiResult;
    try {
      aiResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Response text:', responseText.substring(0, 500));
      return new Response(JSON.stringify({ 
        error: 'Falha ao processar a resposta da IA. Por favor, tente novamente.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    let extractedData;
    try {
      const content = aiResult.choices[0].message.content;
      console.log('=== RAW AI CONTENT (first 1000 chars) ===');
      console.log(content.substring(0, 1000));
      console.log('=== END RAW CONTENT ===');
      
      // Remove markdown code blocks
      let jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // CRITICAL: Normalize ALL types of curly/smart quotes to straight quotes
      // This is a common issue with AI-generated JSON
      // Using comprehensive Unicode ranges for all quote variations
      jsonText = jsonText
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')  // All curly double quotes variants
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")  // All curly single quotes variants
        .replace(/[\u2026]/g, '...')   // Ellipsis
        .replace(/[\u2013\u2014]/g, '-'); // En-dash and em-dash
      
      // Try to fix common JSON issues before parsing
      // Remove any trailing commas before closing braces/brackets
      jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
      
      console.log('=== CLEANED JSON (first 1000 chars) ===');
      console.log(jsonText.substring(0, 1000));
      console.log('=== END CLEANED JSON ===');
      
      try {
        extractedData = JSON.parse(jsonText);
      } catch (firstParseError) {
        console.error('First parse attempt failed:', firstParseError);
        console.error('JSON text causing error (first 2000 chars):', jsonText.substring(0, 2000));
        
        // Try one more time with more aggressive cleaning
        // Remove all literal newlines within the JSON
        jsonText = jsonText.replace(/\n/g, ' ');
        // Remove multiple spaces
        jsonText = jsonText.replace(/\s+/g, ' ');
        
        console.log('=== ATTEMPTING SECOND PARSE (first 1000 chars) ===');
        console.log(jsonText.substring(0, 1000));
        
        extractedData = JSON.parse(jsonText); // This will throw if still invalid
      }
      
      // Log detalhado da extração
      console.log('=== DADOS EXTRAÍDOS PELA IA ===');
      console.log('Contribuinte:', extractedData.contribuinte?.nome || 'N/A');
      console.log('Rendimentos:', extractedData.rendimentos?.length || 0, 'itens');
      console.log('Bens Imobilizados:', extractedData.bens_imobilizados?.length || 0, 'itens');
      console.log('Aplicações:', extractedData.aplicacoes?.length || 0, 'itens');
      console.log('Previdência:', extractedData.previdencia?.length || 0, 'itens');
      console.log('Contas Bancárias:', extractedData.contas_bancarias?.length || 0, 'itens');
      console.log('Dívidas:', extractedData.dividas?.length || 0, 'itens');
      console.log('=== DETALHAMENTO PREVIDÊNCIA ===');
      if (extractedData.previdencia && extractedData.previdencia.length > 0) {
        extractedData.previdencia.forEach((p: any, index: number) => {
          console.log(`  ${index + 1}. ${p.nome} (${p.tipo}) - ${p.instituicao} - R$ ${p.valor_acumulado}`);
        });
      } else {
        console.log('  Nenhum plano de previdência extraído');
      }
      console.log('==============================');
      
      // ========================================
      // VALIDAÇÃO ANTI-ALUCINAÇÃO ULTRA RIGOROSA V4.0
      // ========================================
      
      // Verificar se o próprio contribuinte parece inventado
      const contribuinteNome = (extractedData.contribuinte?.nome || '').toUpperCase();
      const nomesGenericos = [
        'JOÃO', 'MARIA', 'JOSÉ', 'SILVA', 'SANTOS', 'PEREIRA',
        'EXEMPLO', 'MODELO', 'TESTE', 'FULANO', 'CICLANO'
      ];
      
      let nomeContribuinteSuspeito = false;
      if (contribuinteNome) {
        const palavrasNome = contribuinteNome.split(' ');
        const palavrasGenericas = palavrasNome.filter(p => nomesGenericos.includes(p));
        
        // Se o nome tem 2+ palavras genéricas E é curto (2-3 palavras), é suspeito
        if (palavrasGenericas.length >= 2 && palavrasNome.length <= 3) {
          nomeContribuinteSuspeito = true;
          console.warn('⚠️ Nome do contribuinte parece inventado:', contribuinteNome);
        }
      }
      
      const allNomes = [
        ...(extractedData.bens_imobilizados || []).map((b: any) => b.nome || ''),
        ...(extractedData.aplicacoes || []).map((a: any) => a.nome || ''),
        ...(extractedData.previdencia || []).map((p: any) => p.nome || ''),
        ...(extractedData.contas_bancarias || []).map((c: any) => c.banco || ''),
        ...(extractedData.dividas || []).map((d: any) => d.nome || '')
      ].map(n => n.toUpperCase());
      
      const allDescricoes = [
        ...(extractedData.bens_imobilizados || []).map((b: any) => (b.descricao || '') + ' ' + (b.localizacao || '')),
        ...(extractedData.aplicacoes || []).map((a: any) => a.instituicao || '')
      ].map(d => d.toUpperCase());
      
      // Adicionar fontes pagadoras à lista de verificação
      const allFontesPagadoras = (extractedData.rendimentos || [])
        .map((r: any) => r.fonte_pagadora || '')
        .map(f => f.toUpperCase());
      
      // LISTA ULTRA RIGOROSA de padrões inventados
      const suspiciousPatterns = [
        // Palavras de teste/exemplo
        'GENERICO', 'EXEMPLO', 'TESTE', 'PADRAO', 'DEFAULT', 'SAMPLE', 
        'PLACEHOLDER', 'A DEFINIR', 'INDEFINIDO', 'N/A', 'NAO INFORMADO',
        
        // Endereços fictícios comuns
        'RUA DAS FLORES', 'RUA DAS ROSAS', 'RUA PRINCIPAL', 'AVENIDA CENTRAL',
        'RUA A,', 'RUA B,', 'RUA C,', 'RUA EXEMPLO', 'CIDADE MODELO',
        'RUA 1,', 'RUA 2,', 'ENDERECO NAO INFORMADO',
        
        // Veículos genéricos sem detalhes
        'HONDA CIVIC 2020', 'HONDA CIVIC 2021', 'HONDA CIVIC 2022', 'HONDA CIVIC 2023',
        'FIAT UNO 20', 'VW GOL 20', 'FORD KA 20', 'CHEVROLET ONIX 20',
        'VEICULO SEM PLACA', 'CARRO NAO IDENTIFICADO',
        
        // Instituições fictícias
        'BANCO X', 'BANCO Y', 'INSTITUICAO Y', 'BANCO EXEMPLO',
        'CORRETORA X', 'FINANCEIRA EXEMPLO',
        
        // Empresas genéricas
        'EMPRESA MODELO', 'COMPANHIA EXEMPLO', 'EMPRESA EXEMPLO',
        'LTDA MODELO', 'EXEMPLO LTDA',
        
        // Contas/valores genéricos
        'AGENCIA 0001', 'AGENCIA 1234', 'CONTA 00000-', 'CONTA 12345-',
        'CONTA NAO INFORMADA', 'SEM NUMERO DE CONTA',
        
        // Nomes muito genéricos (sem contexto adicional)
        'APARTAMENTO RESIDENCIAL', 'CASA RESIDENCIAL', 'TERRENO URBANO',
        'IMOVEL NAO ESPECIFICADO', 'BEM NAO IDENTIFICADO'
      ];
      
      // Verificar nomes contra padrões suspeitos
      let suspiciousCount = 0;
      const suspiciousItems: string[] = [];
      
      // Verificar se o nome do contribuinte é suspeito
      if (nomeContribuinteSuspeito) {
        suspiciousCount++;
        suspiciousItems.push(`CONTRIBUINTE: "${contribuinteNome}" (nome parece inventado - combinação de palavras genéricas)`);
      }
      
      // Verificar fontes pagadoras suspeitas
      for (const fonte of allFontesPagadoras) {
        if (!fonte) continue;
        for (const pattern of suspiciousPatterns) {
          if (fonte.includes(pattern)) {
            suspiciousCount++;
            suspiciousItems.push(`FONTE PAGADORA: "${fonte}" (contém "${pattern}")`);
            console.warn('⚠️ Fonte pagadora suspeita detectada:', fonte, '→ pattern:', pattern);
          }
        }
      }
      
      // Verificar nomes suspeitos
      for (const nome of allNomes) {
        if (!nome) continue;
        for (const pattern of suspiciousPatterns) {
          if (nome.includes(pattern)) {
            suspiciousCount++;
            suspiciousItems.push(`NOME: "${nome}" (contém "${pattern}")`);
            console.warn('⚠️ Item suspeito detectado:', nome, '→ pattern:', pattern);
          }
        }
      }
      
      // Verificar descrições suspeitas
      for (const desc of allDescricoes) {
        if (!desc) continue;
        for (const pattern of suspiciousPatterns) {
          if (desc.includes(pattern)) {
            suspiciousCount++;
            suspiciousItems.push(`DESCRIÇÃO: "${desc.substring(0, 100)}" (contém "${pattern}")`);
            console.warn('⚠️ Descrição suspeita detectada:', desc.substring(0, 100), '→ pattern:', pattern);
          }
        }
      }
      
      // Validação adicional: verificar valores suspeitos muito redondos (múltiplos de 10000)
      const allValores = [
        ...(extractedData.bens_imobilizados || []).map((b: any) => b.valor_atual || 0),
        ...(extractedData.aplicacoes || []).map((a: any) => a.valor_atual || 0),
        ...(extractedData.previdencia || []).map((p: any) => p.valor_acumulado || 0)
      ];
      
      const valoresMuitoRedondos = allValores.filter(v => 
        v > 0 && v % 10000 === 0 && v >= 100000
      ).length;
      
      if (valoresMuitoRedondos >= 3) {
        suspiciousCount++;
        suspiciousItems.push(`VALORES SUSPEITOS: ${valoresMuitoRedondos} valores muito redondos (múltiplos de R$ 10.000) - possível invenção`);
        console.warn('⚠️ Muitos valores redondos detectados:', valoresMuitoRedondos);
      }
      
      // REJEITAR se houver QUALQUER item suspeito (política de tolerância zero)
      if (suspiciousCount > 0) {
        console.error('❌ DADOS INVENTADOS DETECTADOS - Total de itens suspeitos:', suspiciousCount);
        console.error('Itens problemáticos:');
        suspiciousItems.forEach((item, idx) => console.error(`  ${idx + 1}. ${item}`));
        
        return new Response(JSON.stringify({ 
          error: `❌ IMPORTAÇÃO REJEITADA: Detectados ${suspiciousCount} dado(s) que parecem ter sido INVENTADOS pela IA.

🔍 O sistema identificou:
${suspiciousItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

⚠️ A IA está retornando dados genéricos (como "João da Silva", "Rua das Flores", "Honda Civic 2021", "Empresa Modelo LTDA") ao invés de extrair os dados REAIS do seu PDF.

✅ Possíveis causas:
1. O PDF pode estar com problemas de codificação de texto
2. O arquivo pode ser uma imagem escaneada sem OCR legível
3. O PDF pode estar protegido ou corrompido
4. O formato do arquivo pode não ser compatível

💡 Sugestões:
1. Abra o PDF e tente copiar/colar algum texto - se não conseguir, o arquivo é uma imagem
2. Se for imagem, use um software de OCR antes de importar
3. Exporte novamente o PDF do programa da Receita Federal
4. Certifique-se de que o PDF contém texto selecionável

⚠️ Por segurança, NENHUM dado foi importado. É melhor não importar do que importar dados incorretos.`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Validar quantidade mínima de dados extraídos
      const totalItems = 
        (extractedData.rendimentos?.length || 0) +
        (extractedData.bens_imobilizados?.length || 0) +
        (extractedData.aplicacoes?.length || 0) +
        (extractedData.previdencia?.length || 0) +
        (extractedData.contas_bancarias?.length || 0) +
        (extractedData.dividas?.length || 0);
      
      console.log('📊 Total de itens extraídos:', totalItems);
      console.log('  - Rendimentos:', extractedData.rendimentos?.length || 0);
      console.log('  - Bens Imobilizados:', extractedData.bens_imobilizados?.length || 0);
      console.log('  - Aplicações:', extractedData.aplicacoes?.length || 0);
      console.log('  - Previdência:', extractedData.previdencia?.length || 0);
      console.log('  - Contas Bancárias:', extractedData.contas_bancarias?.length || 0);
      console.log('  - Dívidas:', extractedData.dividas?.length || 0);
      
      if (totalItems === 0 && !extractedData.contribuinte?.nome) {
        console.error('❌ Nenhum dado extraído do PDF');
        return new Response(JSON.stringify({ 
          error: 'Nenhum dado foi extraído do PDF. Possíveis causas:\n\n1. O PDF não é uma declaração de IRPF válida\n2. O arquivo está corrompido ou protegido por senha\n3. O PDF é uma imagem escaneada sem OCR\n4. O formato do arquivo não é suportado\n\nPor favor, verifique o arquivo e tente novamente.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('✅ Validação anti-alucinação passou - Total items extracted:', totalItems);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(JSON.stringify({ error: 'Failed to parse extracted data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert declaration
    const { data: declaracao, error: declError } = await supabaseClient
      .from('declaracoes_irpf')
      .insert({
        user_id: user.id,
        ano: parseInt(ano),
        status: extractedData.declaracao.status,
        recibo: extractedData.declaracao.recibo,
        arquivo_original: file.name,
        dados_brutos: extractedData
      })
      .select()
      .single();

    if (declError) {
      console.error('Declaration insert error:', declError);
      return new Response(JSON.stringify({ error: 'Failed to save declaration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let rendimentosCount = 0;
    let bensImobilizadosCount = 0;
    let aplicacoesCount = 0;
    let previdenciaCount = 0;
    let contasBancariasCount = 0;
    let dividasCount = 0;

    // Insert rendimentos
    if (extractedData.rendimentos && extractedData.rendimentos.length > 0) {
      const rendimentosToInsert = extractedData.rendimentos.map((r: any) => ({
        user_id: user.id,
        declaracao_id: declaracao.id,
        fonte_pagadora: r.fonte_pagadora,
        cnpj: r.cnpj,
        tipo: r.tipo,
        valor: r.valor,
        irrf: r.irrf || 0,
        contribuicao_previdenciaria: r.contribuicao_previdenciaria || 0,
        decimo_terceiro: r.decimo_terceiro || 0,
        ano: parseInt(ano)
      }));

      const { error: rendError } = await supabaseClient
        .from('rendimentos_irpf')
        .insert(rendimentosToInsert);

      if (!rendError) {
        rendimentosCount = rendimentosToInsert.length;
      } else {
        console.error('Rendimentos insert error:', rendError);
      }
    }

    // Insert bens imobilizados
    console.log('Bens imobilizados data from AI:', JSON.stringify(extractedData.bens_imobilizados || []));
    if (extractedData.bens_imobilizados && extractedData.bens_imobilizados.length > 0) {
      const dataAquisicao = new Date().toISOString().split('T')[0];
      const bensToInsert = extractedData.bens_imobilizados.map((b: any) => ({
        user_id: user.id,
        nome: b.nome,
        categoria: b.categoria,
        descricao: b.descricao,
        valor_aquisicao: b.valor_aquisicao,
        valor_atual: b.valor_atual,
        data_aquisicao: dataAquisicao,
        localizacao: b.localizacao || null,
        status: 'Ativo'
      }));

      console.log('Bens imobilizados to insert:', JSON.stringify(bensToInsert));

      const { error: bensError } = await supabaseClient
        .from('bens_imobilizados')
        .insert(bensToInsert);

      if (!bensError) {
        bensImobilizadosCount = bensToInsert.length;
        console.log('Successfully inserted assets:', bensImobilizadosCount);
      } else {
        console.error('Bens imobilizados insert error:', bensError);
      }
    } else {
      console.log('No assets data extracted from PDF');
    }

    // Insert aplicações com validação de tipos
    console.log('Aplicações data from AI:', JSON.stringify(extractedData.aplicacoes || []));
    if (extractedData.aplicacoes && extractedData.aplicacoes.length > 0) {
      const validTipos = ['CDB', 'LCI', 'LCA', 'Tesouro Direto', 'Fundo', 'Ações', 'Outro'];
      const validLiquidez = ['Diária', 'Mensal', 'No Vencimento'];
      const validRentabilidade = ['CDI', 'IPCA', 'Pré-fixado', 'Variável'];
      
      const dataAplicacao = new Date().toISOString().split('T')[0];
      
      const aplicacoesToInsert = extractedData.aplicacoes
        .filter((a: any) => {
          if (!validTipos.includes(a.tipo)) {
            console.log('Filtering out invalid investment type:', a.tipo, '- Application:', a.nome);
            return false;
          }
          return true;
        })
        .map((a: any) => {
          const record: any = {
            user_id: user.id,
            nome: a.nome,
            tipo: a.tipo,
            instituicao: a.instituicao,
            valor_aplicado: a.valor_aplicado,
            valor_atual: a.valor_atual,
            data_aplicacao: dataAplicacao
          };
          
          // Adicionar campos opcionais apenas se válidos
          if (a.liquidez && validLiquidez.includes(a.liquidez)) {
            record.liquidez = a.liquidez;
          }
          if (a.rentabilidade_tipo && validRentabilidade.includes(a.rentabilidade_tipo)) {
            record.rentabilidade_tipo = a.rentabilidade_tipo;
          }
          
          return record;
        });

      console.log('Aplicações to insert:', JSON.stringify(aplicacoesToInsert));

      if (aplicacoesToInsert.length > 0) {
        const { error: aplicacoesError } = await supabaseClient
          .from('aplicacoes')
          .insert(aplicacoesToInsert);

        if (!aplicacoesError) {
          aplicacoesCount = aplicacoesToInsert.length;
          console.log('Successfully inserted investments:', aplicacoesCount);
        } else {
          console.error('Aplicações insert error:', aplicacoesError);
        }
      } else {
        console.log('No valid investments to insert after filtering');
      }
    }

    // Insert previdência (apenas tipos válidos)
    console.log('Previdência data from AI:', JSON.stringify(extractedData.previdencia || []));
    if (extractedData.previdencia && extractedData.previdencia.length > 0) {
      const validTipos = ['PGBL', 'VGBL', 'FAPI'];
      const dataInicio = new Date().toISOString().split('T')[0];
      const previdenciaToInsert = extractedData.previdencia
        .filter((p: any) => {
          const isValid = validTipos.includes(p.tipo);
          if (!isValid) {
            console.log('Filtering out invalid pension type:', p.tipo);
          }
          return isValid;
        })
        .map((p: any) => ({
          user_id: user.id,
          nome: p.nome,
          tipo: p.tipo,
          instituicao: p.instituicao,
          valor_acumulado: p.valor_acumulado || 0,
          contribuicao_mensal: p.contribuicao_mensal || 0,
          data_inicio: dataInicio,
          ativo: true
        }));

      console.log('Previdência to insert:', JSON.stringify(previdenciaToInsert));
      
      if (previdenciaToInsert.length > 0) {
        const { error: previdenciaError } = await supabaseClient
          .from('planos_previdencia')
          .insert(previdenciaToInsert);

        if (!previdenciaError) {
          previdenciaCount = previdenciaToInsert.length;
          console.log('Successfully inserted pension plans:', previdenciaCount);
        } else {
          console.error('Previdência insert error:', previdenciaError);
        }
      } else {
        console.log('No valid pension plans to insert after filtering');
      }
    } else {
      console.log('No pension data extracted from PDF');
    }

    // Insert contas bancárias com validação de tipos
    console.log('Contas bancárias data from AI:', JSON.stringify(extractedData.contas_bancarias || []));
    if (extractedData.contas_bancarias && extractedData.contas_bancarias.length > 0) {
      const validTiposConta = ['Corrente', 'Poupança', 'Salário', 'Investimento'];
      
      const contasToInsert = extractedData.contas_bancarias
        .filter((c: any) => {
          if (!validTiposConta.includes(c.tipo_conta)) {
            console.log('Filtering out invalid account type:', c.tipo_conta, '- Bank:', c.banco);
            return false;
          }
          return true;
        })
        .map((c: any) => ({
          user_id: user.id,
          banco: c.banco,
          agencia: c.agencia || '0000',
          numero_conta: c.numero_conta || '00000-0',
          tipo_conta: c.tipo_conta,
          saldo_atual: c.saldo_atual,
          ativo: true
        }));

      console.log('Contas bancárias to insert:', JSON.stringify(contasToInsert));

      if (contasToInsert.length > 0) {
        const { error: contasError } = await supabaseClient
          .from('contas_bancarias')
          .insert(contasToInsert);

        if (!contasError) {
          contasBancariasCount = contasToInsert.length;
          console.log('Successfully inserted bank accounts:', contasBancariasCount);
        } else {
          console.error('Contas bancárias insert error:', contasError);
        }
      } else {
        console.log('No valid bank accounts to insert after filtering');
      }
    }

    // Insert dívidas (apenas com valor_original válido)
    console.log('Dívidas data from AI:', JSON.stringify(extractedData.dividas || []));
    if (extractedData.dividas && extractedData.dividas.length > 0) {
      const dataContratacao = new Date().toISOString().split('T')[0];
      const dividasToInsert = extractedData.dividas
        .filter((d: any) => {
          const hasValidData = d.valor_original != null && d.valor_original > 0;
          if (!hasValidData) {
            console.log('Filtering out invalid debt (missing valor_original):', d.nome);
          }
          return hasValidData;
        })
        .map((d: any) => ({
          user_id: user.id,
          nome: d.nome,
          tipo: d.tipo,
          credor: d.credor,
          valor_original: d.valor_original,
          saldo_devedor: d.saldo_devedor || d.valor_original,
          valor_parcela: d.saldo_devedor || d.valor_original,
          numero_parcelas: 1,
          parcelas_pagas: 0,
          data_contratacao: dataContratacao,
          status: 'Ativo'
        }));

      console.log('Dívidas to insert:', JSON.stringify(dividasToInsert));

      if (dividasToInsert.length > 0) {
        const { error: dividasError } = await supabaseClient
          .from('dividas')
          .insert(dividasToInsert);

        if (!dividasError) {
          dividasCount = dividasToInsert.length;
          console.log('Successfully inserted debts:', dividasCount);
        } else {
          console.error('Dívidas insert error:', dividasError);
        }
      } else {
        console.log('No valid debts to insert after filtering');
      }
    } else {
      console.log('No debt data extracted from PDF');
    }

    console.log('=== PROCESSAMENTO CONCLUÍDO ===');
    console.log('Declaration processed successfully');
    console.log(`RESUMO DE INSERÇÃO NO BANCO:`);
    console.log(`  - Rendimentos: ${rendimentosCount} itens`);
    console.log(`  - Bens Imobilizados: ${bensImobilizadosCount} itens`);
    console.log(`  - Aplicações: ${aplicacoesCount} itens`);
    console.log(`  - Previdência: ${previdenciaCount} itens`);
    console.log(`  - Contas Bancárias: ${contasBancariasCount} itens`);
    console.log(`  - Dívidas: ${dividasCount} itens`);
    console.log('==============================');

    return new Response(JSON.stringify({
      success: true,
      declaracao_id: declaracao.id,
      dados_extraidos: {
        rendimentos: rendimentosCount,
        bens_imobilizados: bensImobilizadosCount,
        aplicacoes: aplicacoesCount,
        previdencia: previdenciaCount,
        contas_bancarias: contasBancariasCount,
        dividas: dividasCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing declaration:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});