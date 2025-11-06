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

    // Read file content as base64
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64 = btoa(binary);
    
    console.log('File size:', arrayBuffer.byteLength, 'bytes');
    console.log('Base64 length:', base64.length);

    // Call Lovable AI with simplified prompt
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
            content: `Você é um assistente da plataforma financeira TRIAD.

Fluxo do sistema:
- O usuário está na tela "Imposto de Renda" da TRIAD.
- Ele clica em "Importar Declaração", escolhe um arquivo PDF da declaração de IRPF e informa o ano da declaração.
- O sistema faz OCR do PDF e envia PARA VOCÊ o texto completo extraído da declaração.

Sua tarefa:
1. Ler o texto da declaração de IRPF.
2. Identificar todos os ITENS FINANCEIROS relevantes do usuário.
3. Classificar cada item em UMA das categorias da TRIAD:
   - imobilizado
   - aplicacoes
   - previdencias
   - contas_bancarias
   - dividas
4. Retornar um JSON simples, pronto para ser gravado na sessão do usuário e no banco de dados da TRIAD.

Regras de classificação (resumidas):
- "contas_bancarias": contas correntes, contas poupança, depósitos em banco.
- "aplicacoes": CDB, LCI, LCA, Tesouro Direto, fundos, ações, ETFs e outros investimentos.
- "previdencias": PGBL, VGBL, planos de previdência privada.
- "imobilizado": imóveis (casa, apartamento, terreno), veículos, máquinas, bens duráveis, participações societárias.
- "dividas": financiamentos, empréstimos, dívidas em geral (Dívidas e Ônus Reais).

Se tiver dúvida, escolha a categoria mais provável.

Formato de saída (OBRIGATÓRIO):
- Responda APENAS com um JSON válido, no formato:

{
  "ano_base": ${ano},
  "imobilizado": [
    { "descricao": "", "valor": 0 }
  ],
  "aplicacoes": [
    { "descricao": "", "valor": 0 }
  ],
  "previdencias": [
    { "descricao": "", "valor": 0 }
  ],
  "contas_bancarias": [
    { "descricao": "", "valor": 0 }
  ],
  "dividas": [
    { "descricao": "", "valor": 0 }
  ]
}

Regras finais:
- Use o ano ${ano} da declaração.
- Se não encontrar itens em alguma categoria, retorne lista vazia [].
- "descricao" deve ser um resumo curto do item na declaração.
- "valor" deve ser, sempre que possível, o saldo em 31/12 do ano-base.
- Não escreva NENHUM texto fora do JSON.`
          },
          {
            role: 'user',
            content: `Analise a declaração de IRPF abaixo e extraia todos os itens financeiros.

PDF DA DECLARAÇÃO (BASE64):
${base64}

Lembre-se: retorne APENAS o JSON no formato especificado, sem nenhum texto adicional.`
          }
        ],
        max_completion_tokens: 8000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      let userMessage = 'Falha ao processar o PDF com IA. Por favor, tente novamente.';
      
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

    const responseText = await aiResponse.text();
    console.log('AI response received, length:', responseText.length);
    
    if (!responseText || responseText.trim().length === 0) {
      console.error('Empty AI response');
      return new Response(JSON.stringify({ 
        error: 'A IA retornou uma resposta vazia. Por favor, tente novamente.' 
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
        error: 'Falha ao processar a resposta da IA.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    let extractedData;
    try {
      const content = aiResult.choices[0].message.content;
      console.log('=== RAW AI CONTENT ===');
      console.log(content.substring(0, 1000));
      console.log('=== END RAW CONTENT ===');
      
      // Clean JSON
      let jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      jsonText = jsonText
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
        .replace(/[\u2026]/g, '...')
        .replace(/[\u2013\u2014]/g, '-');
      
      console.log('=== CLEANED JSON ===');
      console.log(jsonText.substring(0, 1000));
      console.log('=== END CLEANED JSON ===');
      
      try {
        extractedData = JSON.parse(jsonText);
      } catch (firstError) {
        // Second try with more cleaning
        jsonText = jsonText.replace(/\n/g, ' ').replace(/\s+/g, ' ');
        extractedData = JSON.parse(jsonText);
      }
      
      console.log('=== EXTRACTED DATA ===');
      console.log('Ano base:', extractedData.ano_base);
      console.log('Imobilizado:', extractedData.imobilizado?.length || 0, 'itens');
      console.log('Aplicações:', extractedData.aplicacoes?.length || 0, 'itens');
      console.log('Previdências:', extractedData.previdencias?.length || 0, 'itens');
      console.log('Contas Bancárias:', extractedData.contas_bancarias?.length || 0, 'itens');
      console.log('Dívidas:', extractedData.dividas?.length || 0, 'itens');
      
      // Validate minimum data
      const totalItems = 
        (extractedData.imobilizado?.length || 0) +
        (extractedData.aplicacoes?.length || 0) +
        (extractedData.previdencias?.length || 0) +
        (extractedData.contas_bancarias?.length || 0) +
        (extractedData.dividas?.length || 0);
      
      if (totalItems === 0) {
        console.error('❌ Nenhum dado extraído do PDF');
        return new Response(JSON.stringify({ 
          error: 'Nenhum dado foi extraído do PDF. Possíveis causas:\n\n1. O PDF não é uma declaração de IRPF válida\n2. O arquivo está corrompido ou protegido por senha\n3. O PDF é uma imagem escaneada sem OCR\n4. O formato do arquivo não é suportado\n\nPor favor, verifique o arquivo e tente novamente.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('✅ Total de itens extraídos:', totalItems);
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
        status: 'Importada',
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

    let bensImobilizadosCount = 0;
    let aplicacoesCount = 0;
    let previdenciaCount = 0;
    let contasBancariasCount = 0;
    let dividasCount = 0;

    const dataAtual = new Date().toISOString().split('T')[0];

    // Insert bens imobilizados
    if (extractedData.imobilizado && extractedData.imobilizado.length > 0) {
      const bensToInsert = extractedData.imobilizado.map((b: any) => ({
        user_id: user.id,
        nome: b.descricao.substring(0, 100),
        categoria: 'Outro',
        descricao: b.descricao,
        valor_aquisicao: b.valor || 0,
        valor_atual: b.valor || 0,
        data_aquisicao: dataAtual,
        localizacao: 'Brasil',
        status: 'Ativo'
      }));

      const { error: bensError } = await supabaseClient
        .from('bens_imobilizados')
        .insert(bensToInsert);

      if (!bensError) {
        bensImobilizadosCount = bensToInsert.length;
      } else {
        console.error('Bens insert error:', bensError);
      }
    }

    // Insert aplicações
    if (extractedData.aplicacoes && extractedData.aplicacoes.length > 0) {
      const aplicacoesToInsert = extractedData.aplicacoes.map((a: any) => ({
        user_id: user.id,
        nome: a.descricao.substring(0, 100),
        tipo: 'Outro',
        instituicao: 'Não informada',
        valor_aplicado: a.valor || 0,
        valor_atual: a.valor || 0,
        data_aplicacao: dataAtual
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
    if (extractedData.previdencias && extractedData.previdencias.length > 0) {
      const previdenciaToInsert = extractedData.previdencias.map((p: any) => ({
        user_id: user.id,
        nome: p.descricao.substring(0, 100),
        tipo: 'VGBL',
        instituicao: 'Não informada',
        valor_acumulado: p.valor || 0,
        contribuicao_mensal: 0,
        data_inicio: dataAtual,
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
        banco: c.descricao.substring(0, 100),
        agencia: '0000',
        numero_conta: '00000-0',
        tipo_conta: 'Corrente',
        saldo_atual: c.valor || 0,
        ativo: true
      }));

      const { error: contasError } = await supabaseClient
        .from('contas_bancarias')
        .insert(contasToInsert);

      if (!contasError) {
        contasBancariasCount = contasToInsert.length;
      } else {
        console.error('Contas insert error:', contasError);
      }
    }

    // Insert dívidas
    if (extractedData.dividas && extractedData.dividas.length > 0) {
      const dividasToInsert = extractedData.dividas.map((d: any) => ({
        user_id: user.id,
        nome: d.descricao.substring(0, 100),
        tipo: 'Outro',
        credor: 'Não informado',
        valor_original: d.valor || 0,
        saldo_devedor: d.valor || 0,
        valor_parcela: d.valor || 0,
        numero_parcelas: 1,
        parcelas_pagas: 0,
        data_contratacao: dataAtual,
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

    console.log('=== PROCESSAMENTO CONCLUÍDO ===');
    console.log(`RESUMO DE INSERÇÃO:`);
    console.log(`  - Bens Imobilizados: ${bensImobilizadosCount}`);
    console.log(`  - Aplicações: ${aplicacoesCount}`);
    console.log(`  - Previdência: ${previdenciaCount}`);
    console.log(`  - Contas Bancárias: ${contasBancariasCount}`);
    console.log(`  - Dívidas: ${dividasCount}`);
    console.log('==============================');

    return new Response(JSON.stringify({
      success: true,
      declaracao_id: declaracao.id,
      dados_extraidos: {
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
