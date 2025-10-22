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
            content: `Você é um leitor de PDF especializado em declarações de IRPF. Sua ÚNICA função é extrair texto que você VÊ no PDF.

🚫 PROIBIÇÕES ABSOLUTAS:
- NUNCA invente, estime ou gere dados de exemplo
- NUNCA use informações genéricas ou de memória
- NUNCA coloque marcas/modelos de veículos que não estejam ESCRITOS no PDF
- NUNCA aproxime valores - use EXATAMENTE o que está escrito
- Se não conseguir ler algo com 100% de certeza, retorne array vazio []

✅ O QUE FAZER:
- Leia APENAS o texto visível no PDF
- Copie valores EXATAMENTE como aparecem
- Se encontrar "HONDA CIVIC 2020", escreva exatamente isso
- Se encontrar "R$ 230.000,00", converta para 230000
- Se o PDF estiver ilegível ou não houver dados, retorne arrays vazios

📋 CATEGORIZAÇÃO AUTOMÁTICA - ATENÇÃO ESPECIAL PARA PREVIDÊNCIA:
Ao encontrar um bem/direito no PDF, verifique o CÓDIGO e categorize:
- Código 01-09 = IMÓVEIS → bens_imobilizados (categoria: "Imóvel")
- Código 11-19 = VEÍCULOS → bens_imobilizados (categoria: "Veículo")
- Código 21-29 = EMBARCAÇÕES/AERONAVES → bens_imobilizados (categoria: "Outro")
- Código 31-39 = AÇÕES/QUOTAS → aplicacoes (tipo: "Ações")
- Código 41-49 = FUNDOS/CLUBES → aplicacoes (tipo: "Fundo")
- Código 45 = CRIPTOMOEDAS → aplicacoes (tipo: "Outro")
- Código 51-59 = DEPÓSITOS → contas_bancarias
- Código 61-69 = TÍTULOS/CDB/RDB → aplicacoes (tipo: "CDB")

🎯 ATENÇÃO ESPECIAL - PREVIDÊNCIA PRIVADA:
- Código 71 = VGBL (Vida Gerador de Benefício Livre) → previdencia (tipo: "VGBL")
- Código 72 = PGBL (Plano Gerador de Benefício Livre) → previdencia (tipo: "PGBL")
- Código 73 = FAPI (Fundo de Aposentadoria Programada Individual) → previdencia (tipo: "FAPI")
- Código 74 = Outros planos de previdência → previdencia (tipo: "VGBL")

⚠️ IMPORTANTE PARA PREVIDÊNCIA:
- Se você VER "VGBL", "PGBL", "FAPI" ou termos como "Previdência", "Plano de Aposentadoria" no PDF, SEMPRE categorize como previdencia
- O valor na coluna "Situação em 31/12/XXXX" é o valor_acumulado
- Se não houver contribuição mensal explícita, use 0 (zero)
- Sempre preencha: nome (descrição do plano), tipo (VGBL/PGBL/FAPI), instituicao (seguradora/banco)

🔍 VALIDAÇÃO DE QUALIDADE:
Antes de retornar, pergunte-se:
- "Eu realmente VI este texto no PDF?"
- "Este é um dado específico ou genérico?"
- "Este valor/nome está EXATAMENTE como aparece no documento?"

Se a resposta for NÃO para qualquer pergunta, remova o item.`

          },
          {
            role: 'user',
            content: `TAREFA: Leia este PDF de declaração de IRPF e extraia APENAS o texto que você consegue VER e LER claramente.

⚠️ CRITICAL: Se você não conseguir ler o PDF ou os dados parecerem ilegíveis, retorne TODOS os arrays vazios. É melhor não retornar nada do que inventar dados.

📄 PDF (base64): ${base64.substring(0, 200000)}

EXEMPLO DE BOA EXTRAÇÃO (baseado no que está NO PDF):
Se você VÊ no PDF:
"Bem: HONDA CIVIC 2020 - Código 11
Situação 31/12/2022: 230.000,00
Situação 31/12/2023: 230.000,00"

Você retorna:
{
  "nome": "HONDA CIVIC 2020",
  "categoria": "Veículo",
  "descricao": "HONDA CIVIC 2020",
  "valor_aquisicao": 230000,
  "valor_atual": 230000,
  "localizacao": "Brasil"
}

EXEMPLO DE MÁ EXTRAÇÃO (NUNCA FAÇA ISSO):
Se você NÃO vê marca/modelo no PDF, NÃO invente "Ford KA" ou "Fiat Uno"!
Se você NÃO vê um valor, NÃO invente "25400" ou "120000"!

📤 FORMATO DE RETORNO (JSON puro, sem markdown):
{
  "contribuinte": {
    "nome": "NOME COMPLETO DO PDF",
    "cpf": "000.000.000-00"
  },
  "declaracao": {
    "ano": 2024,
    "status": "Importada",
    "recibo": "número do recibo ou null"
  },
  "rendimentos": [],
  "bens_imobilizados": [
    {
      "nome": "descrição curta do bem",
      "categoria": "Imóvel | Veículo | Outro",
      "descricao": "descrição completa do PDF",
      "valor_aquisicao": 0,
      "valor_atual": 0,
      "localizacao": "endereço ou localização"
    }
  ],
  "aplicacoes": [
    {
      "nome": "nome da aplicação",
      "tipo": "CDB | LCI | LCA | Tesouro Direto | Fundo | Ações | Outro",
      "instituicao": "banco/corretora",
      "valor_aplicado": 0,
      "valor_atual": 0
    }
  ],
  "previdencia": [
    {
      "nome": "nome do plano",
      "tipo": "PGBL | VGBL | FAPI",
      "instituicao": "seguradora",
      "valor_acumulado": 0,
      "contribuicao_mensal": 0
    }
  ],
  "contas_bancarias": [
    {
      "banco": "nome banco",
      "agencia": "0000",
      "numero_conta": "00000-0",
      "tipo_conta": "Corrente | Poupança | Salário | Investimento",
      "saldo_atual": 0
    }
  ],
  "dividas": [
    {
      "nome": "descrição",
      "tipo": "Financiamento Imobiliário | Financiamento Veículo | Empréstimo Pessoal | Cartão de Crédito | Outro",
      "credor": "nome credor",
      "valor_original": 0,
      "saldo_devedor": 0
    }
  ]
}

🔍 LEMBRE-SE: Você está LENDO um PDF, não gerando dados de exemplo. Se não conseguir ler, retorne arrays vazios!`

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
      console.log('Extracted data:', JSON.stringify(extractedData, null, 2));
      
      // Validação básica: verificar se dados estruturais fazem sentido
      // Removemos validações muito restritivas que podem bloquear PDFs legítimos
      const bensNomes = (extractedData.bens_imobilizados || []).map((b: any) => b.nome?.toUpperCase() || '');
      
      // Verificar apenas padrões claramente suspeitos (veículos genéricos muito comuns que indicam dados inventados)
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
      
      // Validar se há dados reais extraídos (não arrays vazios em tudo)
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
      
      console.log('Validation passed - Real data detected:', { 
        contribuinte: extractedData.contribuinte?.nome,
        totalItems 
      });
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