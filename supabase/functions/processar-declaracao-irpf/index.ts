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

    // Use Lovable AI to extract and categorize data with improved prompt
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em extrair TODOS os dados financeiros de declarações de IRPF. Sua missão é NÃO DEIXAR NENHUM ITEM COM VALOR passar despercebido.

🎯 MISSÃO CRÍTICA:
- EXTRAIA 100% dos itens que possuem valores em reais
- TODO bem, aplicação, conta, dívida ou plano de previdência DEVE ser extraído
- Mesmo que faltem informações, capture o que existe e preencha campos obrigatórios com valores padrão sensatos

🚫 PROIBIÇÕES:
- NUNCA invente dados que não existem no PDF
- NUNCA ignore itens só porque faltam algumas informações
- NUNCA aproxime valores - use EXATAMENTE o que está escrito

📋 REGRAS DE CATEGORIZAÇÃO POR CÓDIGO (SEÇÃO BENS E DIREITOS):

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
            content: `TAREFA: Leia este PDF de declaração de IRPF e extraia TODOS os dados financeiros que você consegue VER.

⚠️ CRÍTICO: 
- NÃO PULE NENHUM ITEM que tenha valor em reais
- Se você encontrar 10 itens, deve retornar 10 itens
- Se você encontrar um VGBL de R$ 15.000, ELE DEVE APARECER no JSON de resposta
- É MELHOR extrair com informações parciais do que NÃO extrair

📄 PDF (base64): ${base64.substring(0, 200000)}

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

🎯 CHECKLIST FINAL ANTES DE RETORNAR:
□ Contei quantos itens têm valor no PDF?
□ Meu JSON tem o MESMO número de itens?
□ Todos os códigos 71-79 (previdência) foram extraídos?
□ Todas as contas (51-59) foram extraídas?
□ Se houver 5 aplicações no PDF, tenho 5 no JSON?

⚠️ SE ALGO NÃO BATER, REVISE O PDF E EXTRAIA NOVAMENTE!`
          }
        ],
        max_completion_tokens: 8000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Falha ao processar o PDF com IA. Por favor, tente novamente.',
        details: errorText 
      }), {
        status: 500,
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
      const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(jsonText);
      
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
      
      // Validação básica: verificar se dados estruturais fazem sentido
      const bensNomes = (extractedData.bens_imobilizados || []).map((b: any) => b.nome?.toUpperCase() || '');
      
      // Verificar apenas padrões claramente suspeitos
      const suspiciousVehicles = ['CARRO GENERICO', 'VEICULO EXEMPLO', 'AUTOMOVEL TESTE'];
      
      for (const bens of bensNomes) {
        for (const suspicious of suspiciousVehicles) {
          if (bens.includes(suspicious)) {
            console.error('Detected clearly fabricated data:', { bens, suspicious });
            return new Response(JSON.stringify({ 
              error: 'A IA não conseguiu extrair dados reais do PDF. Verifique se o arquivo está legível.' 
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
      
      // Validar se há dados reais extraídos
      const totalItems = 
        (extractedData.rendimentos?.length || 0) +
        (extractedData.bens_imobilizados?.length || 0) +
        (extractedData.aplicacoes?.length || 0) +
        (extractedData.previdencia?.length || 0) +
        (extractedData.contas_bancarias?.length || 0) +
        (extractedData.dividas?.length || 0);
      
      if (totalItems === 0 && !extractedData.contribuinte?.nome) {
        console.error('No data extracted from PDF');
        return new Response(JSON.stringify({ 
          error: 'Nenhum dado foi extraído do PDF. O arquivo pode estar corrompido, protegido por senha, ou em formato não suportado. Por favor, verifique o arquivo e tente novamente.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('Validation passed - Total items extracted:', totalItems);
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

      const { error: bensError } = await supabaseClient
        .from('bens_imobilizados')
        .insert(bensToInsert);

      if (!bensError) {
        bensImobilizadosCount = bensToInsert.length;
      } else {
        console.error('Bens imobilizados insert error:', bensError);
      }
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
    if (extractedData.dividas && extractedData.dividas.length > 0) {
      const dataContratacao = new Date().toISOString().split('T')[0];
      const dividasToInsert = extractedData.dividas
        .filter((d: any) => d.valor_original != null && d.valor_original > 0)
        .map((d: any) => ({
          user_id: user.id,
          nome: d.nome,
          tipo: d.tipo,
          credor: d.credor,
          valor_original: d.valor_original,
          saldo_devedor: d.saldo_devedor,
          valor_parcela: d.saldo_devedor,
          numero_parcelas: 1,
          parcelas_pagas: 0,
          data_contratacao: dataContratacao,
          status: 'Ativo'
        }));

      if (dividasToInsert.length > 0) {
        const { error: dividasError } = await supabaseClient
          .from('dividas')
          .insert(dividasToInsert);

        if (!dividasError) {
          dividasCount = dividasToInsert.length;
        } else {
          console.error('Dívidas insert error:', dividasError);
        }
      }
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