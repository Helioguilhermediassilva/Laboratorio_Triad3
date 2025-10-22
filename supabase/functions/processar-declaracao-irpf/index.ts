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
            content: `Você é um especialista em análise de declarações de IRPF brasileiras. Sua missão é extrair TODOS os dados estruturados do PDF da declaração com MÁXIMA PRECISÃO, incluindo:

- TODOS os rendimentos com valores exatos
- TODOS os bens e direitos, categorizando corretamente
- TODAS as aplicações financeiras (ações, fundos, títulos)
- TODOS os planos de previdência (PGBL, VGBL)
- TODAS as contas bancárias com saldos
- TODAS as dívidas e ônus reais

REGRAS CRÍTICAS:
1. Use APENAS os valores permitidos para cada campo tipo
2. Extraia valores EXATOS do PDF, sem arredondamentos
3. Categorize corretamente cada item
4. Não invente ou omita dados
5. Retorne APENAS JSON válido, sem markdown ou comentários`
          },
          {
            role: 'user',
            content: `Analise minuciosamente esta declaração de IRPF em PDF (base64) e extraia TODOS os dados financeiros, categorizando-os nas estruturas corretas.

VALORES PERMITIDOS POR CATEGORIA (use EXATAMENTE estes valores):

📊 APLICAÇÕES - tipo deve ser EXATAMENTE um destes:
  - "CDB"
  - "LCI" 
  - "LCA"
  - "Tesouro Direto"
  - "Fundo"
  - "Ações" (para ações individuais)
  - "Outro" (para FII, ETF, etc)

🏦 CONTAS BANCÁRIAS - tipo_conta deve ser EXATAMENTE um destes:
  - "Corrente"
  - "Poupança"
  - "Salário"
  - "Investimento"

💳 DÍVIDAS - tipo deve ser EXATAMENTE um destes:
  - "Financiamento Imobiliário"
  - "Financiamento Veículo"
  - "Empréstimo Pessoal"
  - "Cartão de Crédito"
  - "Outro"

🏠 PREVIDÊNCIA - tipo deve ser EXATAMENTE um destes:
  - "PGBL"
  - "VGBL"
  - "FAPI"

INSTRUÇÕES DE EXTRAÇÃO:
- Bens e Direitos código 01-09 → bens_imobilizados (Imóveis)
- Bens e Direitos código 11-19 → bens_imobilizados (Veículos)
- Bens e Direitos código 31-49 → aplicacoes (ações, fundos, títulos)
- Bens e Direitos código 51-69 → contas_bancarias
- Bens e Direitos código 71-72 → previdencia
- Dívidas e Ônus → dividas

Arquivo PDF em base64: ${base64.substring(0, 150000)}

Retorne APENAS este JSON (sem \`\`\`json):
{
  "contribuinte": {
    "nome": "string do PDF",
    "cpf": "string do PDF"
  },
  "declaracao": {
    "ano": number,
    "status": "Importada",
    "recibo": "número do recibo ou null"
  },
  "rendimentos": [
    {
      "fonte_pagadora": "nome completo",
      "cnpj": "XX.XXX.XXX/XXXX-XX ou vazio",
      "tipo": "Salário ou Pró-labore ou Dividendos ou Outros",
      "valor": valor_numero,
      "irrf": valor_numero,
      "contribuicao_previdenciaria": valor_numero,
      "decimo_terceiro": valor_numero
    }
  ],
  "bens_imobilizados": [
    {
      "nome": "nome descritivo do bem",
      "categoria": "Imóvel ou Veículo ou Outro",
      "descricao": "descrição detalhada do PDF",
      "valor_aquisicao": valor_ano_anterior,
      "valor_atual": valor_ano_declaracao,
      "localizacao": "endereço completo ou localização"
    }
  ],
  "aplicacoes": [
    {
      "nome": "nome/ticker da aplicação",
      "tipo": "USE VALORES PERMITIDOS ACIMA",
      "instituicao": "nome da corretora/banco",
      "valor_aplicado": valor_ano_anterior,
      "valor_atual": valor_ano_declaracao
    }
  ],
  "previdencia": [
    {
      "nome": "nome do plano",
      "tipo": "PGBL ou VGBL ou FAPI",
      "instituicao": "seguradora/banco",
      "valor_acumulado": valor_atual,
      "contribuicao_mensal": estimativa_mensal
    }
  ],
  "contas_bancarias": [
    {
      "banco": "nome do banco",
      "agencia": "número agência",
      "numero_conta": "número conta",
      "tipo_conta": "USE VALORES PERMITIDOS ACIMA",
      "saldo_atual": saldo_declarado
    }
  ],
  "dividas": [
    {
      "nome": "descrição da dívida",
      "tipo": "USE VALORES PERMITIDOS ACIMA",
      "credor": "nome do credor",
      "valor_original": valor_original_contratado,
      "saldo_devedor": saldo_atual_devido
    }
  ]
}`
          }
        ],
        max_completion_tokens: 8000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to process with AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await aiResponse.json();
    console.log('AI response received');
    
    let extractedData;
    try {
      const content = aiResult.choices[0].message.content;
      const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(jsonText);
      console.log('Extracted data:', JSON.stringify(extractedData, null, 2));
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

    // Insert aplicações
    if (extractedData.aplicacoes && extractedData.aplicacoes.length > 0) {
      const dataAplicacao = new Date().toISOString().split('T')[0];
      const aplicacoesToInsert = extractedData.aplicacoes.map((a: any) => ({
        user_id: user.id,
        nome: a.nome,
        tipo: a.tipo,
        instituicao: a.instituicao,
        valor_aplicado: a.valor_aplicado,
        valor_atual: a.valor_atual,
        data_aplicacao: dataAplicacao
      }));

      const { error: aplicacoesError } = await supabaseClient
        .from('aplicacoes')
        .insert(aplicacoesToInsert);

      if (!aplicacoesError) {
        aplicacoesCount = aplicacoesToInsert.length;
      } else {
        console.error('Aplicações insert error:', aplicacoesError);
      }
    }

    // Insert previdência
    if (extractedData.previdencia && extractedData.previdencia.length > 0) {
      const dataInicio = new Date().toISOString().split('T')[0];
      const previdenciaToInsert = extractedData.previdencia.map((p: any) => ({
        user_id: user.id,
        nome: p.nome,
        tipo: p.tipo,
        instituicao: p.instituicao,
        valor_acumulado: p.valor_acumulado,
        contribuicao_mensal: p.contribuicao_mensal || 0,
        data_inicio: dataInicio,
        ativo: true
      }));

      const { error: previdenciaError } = await supabaseClient
        .from('planos_previdencia')
        .insert(previdenciaToInsert);

      if (!previdenciaError) {
        previdenciaCount = previdenciaToInsert.length;
      } else {
        console.error('Previdência insert error:', previdenciaError);
      }
    }

    // Insert contas bancárias
    if (extractedData.contas_bancarias && extractedData.contas_bancarias.length > 0) {
      const contasToInsert = extractedData.contas_bancarias.map((c: any) => ({
        user_id: user.id,
        banco: c.banco,
        agencia: c.agencia,
        numero_conta: c.numero_conta,
        tipo_conta: c.tipo_conta,
        saldo_atual: c.saldo_atual,
        ativo: true
      }));

      const { error: contasError } = await supabaseClient
        .from('contas_bancarias')
        .insert(contasToInsert);

      if (!contasError) {
        contasBancariasCount = contasToInsert.length;
      } else {
        console.error('Contas bancárias insert error:', contasError);
      }
    }

    // Insert dívidas
    if (extractedData.dividas && extractedData.dividas.length > 0) {
      const dataContratacao = new Date().toISOString().split('T')[0];
      const dividasToInsert = extractedData.dividas.map((d: any) => ({
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

      const { error: dividasError } = await supabaseClient
        .from('dividas')
        .insert(dividasToInsert);

      if (!dividasError) {
        dividasCount = dividasToInsert.length;
      } else {
        console.error('Dívidas insert error:', dividasError);
      }
    }

    console.log('Declaration processed successfully');
    console.log(`Inserted: ${rendimentosCount} rendimentos, ${bensImobilizadosCount} bens imobilizados, ${aplicacoesCount} aplicações, ${previdenciaCount} previdência, ${contasBancariasCount} contas, ${dividasCount} dívidas`);

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