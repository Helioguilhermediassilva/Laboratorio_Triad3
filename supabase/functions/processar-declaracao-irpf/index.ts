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

    // Extract text from PDF using OCR-like simulation
    // In production, you would use a proper OCR service or PDF parsing library
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const text = new TextDecoder().decode(uint8Array);

    console.log('Extracted text length:', text.length);

    // Use Lovable AI to extract and categorize data
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
            content: `Você é um assistente especializado em extrair dados de declarações de IRPF brasileiras. Retorne APENAS um JSON válido com a estrutura especificada, sem markdown ou texto adicional.`
          },
          {
            role: 'user',
            content: `Analise o texto abaixo da declaração de IRPF e extraia os dados estruturados.

Texto da declaração:
${text.substring(0, 50000)}

Retorne um JSON com esta estrutura exata:
{
  "contribuinte": {
    "nome": "string",
    "cpf": "string"
  },
  "declaracao": {
    "ano": number,
    "status": "Importada",
    "recibo": "string ou null"
  },
  "rendimentos": [
    {
      "fonte_pagadora": "string",
      "cnpj": "string",
      "tipo": "Salário|Pró-labore|Dividendos|Outros",
      "valor": number,
      "irrf": number,
      "contribuicao_previdenciaria": number,
      "decimo_terceiro": number
    }
  ],
  "bens_direitos": [
    {
      "codigo": "string",
      "discriminacao": "string",
      "situacao_ano_anterior": number,
      "situacao_ano_atual": number,
      "categoria": "Imóvel|Veículo|Aplicação Financeira|Outro"
    }
  ],
  "dividas": [
    {
      "discriminacao": "string",
      "valor_ano_anterior": number,
      "valor_ano_atual": number,
      "credor": "string"
    }
  ]
}`
          }
        ],
        temperature: 0.1
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
    console.log('AI response:', JSON.stringify(aiResult));
    
    let extractedData;
    try {
      const content = aiResult.choices[0].message.content;
      // Remove markdown code blocks if present
      const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(jsonText);
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

      if (rendError) {
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

      if (bensError) {
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

      if (dividasError) {
        console.error('Dividas insert error:', dividasError);
      }
    }

    console.log('Declaration processed successfully');

    return new Response(JSON.stringify({
      success: true,
      declaracao_id: declaracao.id,
      dados_extraidos: {
        rendimentos: extractedData.rendimentos?.length || 0,
        bens: extractedData.bens_direitos?.length || 0,
        dividas: extractedData.dividas?.length || 0
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