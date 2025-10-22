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
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em análise de declarações de IRPF brasileiras. Extraia TODOS os dados estruturados encontrados no documento. Retorne APENAS um JSON válido, sem markdown.`
          },
          {
            role: 'user',
            content: `Analise esta declaração de IRPF em PDF (base64) e extraia TODOS os dados encontrados.

IMPORTANTE: 
- Extraia TODOS os rendimentos listados, não deixe nenhum de fora
- Extraia TODOS os bens e direitos, incluindo veículos, imóveis, contas bancárias, aplicações
- Extraia TODAS as dívidas se houver
- Use os valores EXATOS que aparecem no documento
- Se não encontrar alguma informação, use valores vazios mas SEMPRE retorne o JSON completo

Arquivo em base64: ${base64.substring(0, 100000)}

Retorne um JSON com esta estrutura:
{
  "contribuinte": {
    "nome": "string (nome completo do contribuinte)",
    "cpf": "string (CPF com pontos e traço)"
  },
  "declaracao": {
    "ano": number (ano da declaração),
    "status": "Importada",
    "recibo": "string ou null (número do recibo se houver)"
  },
  "rendimentos": [
    {
      "fonte_pagadora": "string (nome da empresa)",
      "cnpj": "string (CNPJ formatado)",
      "tipo": "Salário" ou "Pró-labore" ou "Dividendos" ou "Outros",
      "valor": number (valor total recebido),
      "irrf": number (imposto retido na fonte),
      "contribuicao_previdenciaria": number,
      "decimo_terceiro": number
    }
  ],
  "bens_direitos": [
    {
      "codigo": "string (código do bem, ex: 02, 04, 06)",
      "discriminacao": "string (descrição completa do bem)",
      "situacao_ano_anterior": number (valor em 31/12 ano anterior),
      "situacao_ano_atual": number (valor em 31/12 ano atual),
      "categoria": "Imóvel" ou "Veículo" ou "Aplicação Financeira" ou "Outro"
    }
  ],
  "dividas": [
    {
      "discriminacao": "string (descrição da dívida)",
      "valor_ano_anterior": number,
      "valor_ano_atual": number,
      "credor": "string (nome do credor)"
    }
  ]
}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
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
    let bensCount = 0;
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

    // Insert bens e direitos
    if (extractedData.bens_direitos && extractedData.bens_direitos.length > 0) {
      const bensToInsert = extractedData.bens_direitos.map((b: any) => ({
        user_id: user.id,
        declaracao_id: declaracao.id,
        codigo: b.codigo,
        discriminacao: b.discriminacao,
        situacao_ano_anterior: b.situacao_ano_anterior || 0,
        situacao_ano_atual: b.situacao_ano_atual,
        categoria: b.categoria
      }));

      const { error: bensError } = await supabaseClient
        .from('bens_direitos_irpf')
        .insert(bensToInsert);

      if (!bensError) {
        bensCount = bensToInsert.length;
      } else {
        console.error('Bens insert error:', bensError);
      }
    }

    // Insert dívidas
    if (extractedData.dividas && extractedData.dividas.length > 0) {
      const dividasToInsert = extractedData.dividas.map((d: any) => ({
        user_id: user.id,
        declaracao_id: declaracao.id,
        discriminacao: d.discriminacao,
        valor_ano_anterior: d.valor_ano_anterior || 0,
        valor_ano_atual: d.valor_ano_atual,
        credor: d.credor
      }));

      const { error: dividasError } = await supabaseClient
        .from('dividas_irpf')
        .insert(dividasToInsert);

      if (!dividasError) {
        dividasCount = dividasToInsert.length;
      } else {
        console.error('Dividas insert error:', dividasError);
      }
    }

    console.log('Declaration processed successfully');
    console.log(`Inserted: ${rendimentosCount} rendimentos, ${bensCount} bens, ${dividasCount} dividas`);

    return new Response(JSON.stringify({
      success: true,
      declaracao_id: declaracao.id,
      dados_extraidos: {
        rendimentos: rendimentosCount,
        bens: bensCount,
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