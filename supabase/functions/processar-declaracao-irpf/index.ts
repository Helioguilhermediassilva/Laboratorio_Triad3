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
            content: `Você é um especialista em leitura de declarações de IRPF brasileiras em PDF. 

⚠️ REGRAS ABSOLUTAS - VIOLAÇÃO RESULTA EM ERRO:
1. EXTRAIA APENAS dados que você LÊ EXPLICITAMENTE no PDF
2. Se não conseguir ler ou identificar algo com 100% de certeza, retorne array vazio []
3. NUNCA, sob NENHUMA circunstância, invente, estime ou gere dados de exemplo
4. NUNCA use nomes genéricos como "Ford KA", "Fiat Uno", "Honda Civic" a menos que estejam EXATAMENTE assim no PDF
5. Se o PDF estiver ilegível, corrompido ou você não conseguir extrair dados confiáveis, retorne arrays vazios para TODAS as categorias

VALIDAÇÃO DE QUALIDADE:
- Se você não vê o texto exato "Honda" ou "Ford" no PDF, NÃO escreva "Honda" ou "Ford"
- Se você não vê um valor exato, NÃO invente um valor aproximado
- Se não vê uma marca/modelo específico de veículo, deixe no array vazio
- Valores devem ser EXATAMENTE como aparecem no PDF

TIPOS PERMITIDOS (use EXATAMENTE):
- planos_previdencia.tipo: "PGBL", "VGBL" ou "FAPI"
- dividas.tipo: "Financiamento Imobiliário", "Financiamento Veículo", "Empréstimo Pessoal", "Cartão de Crédito", "Outro"
- aplicacoes.tipo: "CDB", "LCI", "LCA", "Tesouro Direto", "Fundo", "Ações", "Outro"
- contas_bancarias.tipo_conta: "Corrente", "Poupança", "Salário", "Investimento"
- rendimentos.tipo: "Trabalho Assalariado", "Trabalho Autônomo", "Aluguel", "Pensão", "Aposentadoria", "Outros"

CAMPOS OBRIGATÓRIOS:
- dividas: valor_original é OBRIGATÓRIO. Se não souber, NÃO inclua o item
- Todos os valores numéricos devem ser numbers, não strings`
          },
          {
            role: 'user',
            content: `Analise este PDF de declaração de IRPF e extraia APENAS os dados que você consegue LER com 100% de certeza.

⚠️ IMPORTANTE: 
- Se não conseguir ler algo claramente, retorne array vazio []
- NÃO invente marcas de veículos (ex: se não vê "Honda" escrito, não escreva "Honda")
- NÃO estime valores (use apenas valores que você LÊ no PDF)
- Se o PDF estiver ilegível, retorne todos os arrays vazios

MAPEAMENTO DE CÓDIGOS (use estes códigos para categorizar):
- Código 01-09: bens_imobilizados categoria "Imóvel"
- Código 11-19: bens_imobilizados categoria "Veículo" 
- Código 31-49: aplicacoes (ações, fundos, títulos)
- Código 51-69: contas_bancarias
- Código 71-72: previdencia

PDF em base64: ${base64.substring(0, 200000)}

Retorne APENAS JSON válido (sem markdown):
{
  "contribuinte": { "nome": "NOME EXATO DO PDF", "cpf": "CPF DO PDF" },
  "declaracao": { "ano": 2024, "status": "Importada", "recibo": "numero ou null" },
  "rendimentos": [ /* apenas se conseguir ler claramente */ ],
  "bens_imobilizados": [ /* nome, categoria, descricao, valor_aquisicao, valor_atual, localizacao */ ],
  "aplicacoes": [ /* nome, tipo, instituicao, valor_aplicado, valor_atual */ ],
  "previdencia": [ /* nome, tipo (PGBL/VGBL/FAPI), instituicao, valor_acumulado, contribuicao_mensal */ ],
  "contas_bancarias": [ /* banco, agencia, numero_conta, tipo_conta, saldo_atual */ ],
  "dividas": [ /* nome, tipo, credor, valor_original (obrigatório), saldo_devedor */ ]
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
      
      // Validar se não são dados mockados/genéricos
      const mockIndicators = [
        'JOÃO DA SILVA', 'MARIA DA SILVA', 'EMPRESA MODELO', 'EXEMPLO',
        'FORD KA', 'FIAT UNO', 'VW GOL 1.0' // Marcas/modelos genéricos suspeitos
      ];
      const contribuinte = extractedData.contribuinte?.nome?.toUpperCase() || '';
      const bensNomes = extractedData.bens_imobilizados?.map((b: any) => b.nome?.toUpperCase()) || [];
      
      for (const mockName of mockIndicators) {
        if (contribuinte.includes(mockName) || bensNomes.some((nome: string) => nome?.includes(mockName))) {
          console.error('Detected mock/generic data in extraction:', { contribuinte, bensNomes });
          return new Response(JSON.stringify({ 
            error: 'A IA não conseguiu extrair dados reais do PDF. O documento pode estar ilegível, corrompido ou em formato não suportado. Por favor, verifique se o arquivo é um PDF válido da Receita Federal e tente novamente.' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
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

    // Insert previdência (apenas tipos válidos)
    if (extractedData.previdencia && extractedData.previdencia.length > 0) {
      const validTipos = ['PGBL', 'VGBL', 'FAPI'];
      const dataInicio = new Date().toISOString().split('T')[0];
      const previdenciaToInsert = extractedData.previdencia
        .filter((p: any) => validTipos.includes(p.tipo))
        .map((p: any) => ({
          user_id: user.id,
          nome: p.nome,
          tipo: p.tipo,
          instituicao: p.instituicao,
          valor_acumulado: p.valor_acumulado,
          contribuicao_mensal: p.contribuicao_mensal || 0,
          data_inicio: dataInicio,
          ativo: true
        }));

      if (previdenciaToInsert.length > 0) {
        const { error: previdenciaError } = await supabaseClient
          .from('planos_previdencia')
          .insert(previdenciaToInsert);

        if (!previdenciaError) {
          previdenciaCount = previdenciaToInsert.length;
        } else {
          console.error('Previdência insert error:', previdenciaError);
        }
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