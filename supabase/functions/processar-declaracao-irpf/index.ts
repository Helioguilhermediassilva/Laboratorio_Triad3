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

    // Upload file to storage first
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

    // Create declaration record with 'Processando' status
    const { data: declaracao, error: declError } = await supabaseClient
      .from('declaracoes_irpf')
      .insert({
        user_id: user.id,
        ano: parseInt(ano),
        status: 'Processando',
        arquivo_original: file.name,
      })
      .select()
      .single();

    if (declError) {
      console.error('Declaration insert error:', declError);
      return new Response(JSON.stringify({ error: 'Failed to create declaration record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Start background processing with proper error tracking
    const processDeclaration = async () => {
      let currentStep = 'inicio';
      try {
        currentStep = 'reading-file';
        console.log('🚀 Starting background processing for declaration:', declaracao.id);

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
        
        console.log('📄 File size:', arrayBuffer.byteLength, 'bytes');
        console.log('📄 Base64 length:', base64.length);
        
        currentStep = 'calling-ai';

        // Call Lovable AI with simplified prompt
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        console.log('🤖 Calling AI API...');
        
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
            content: `Você é um assistente da plataforma financeira TRIAD.

Fluxo do sistema:
- O usuário está na tela "Imposto de Renda" da TRIAD.
- Ele escolhe um PDF da declaração de IRPF e informa o ano-base (ex.: ${ano}).
- O sistema faz OCR do PDF e envia PARA VOCÊ o TEXTO BRUTO dessa declaração.

Sua tarefa é:
1. Ler TODO o texto da declaração de IRPF.
2. Identificar TODOS os itens patrimoniais, financeiros e de rendimento que tenham VALORES EM REAIS.
3. Para cada item encontrado, criar um registro e classificá-lo em UMA das categorias TRIAD:
   - "imobilizado"         → imóveis, veículos, bens físicos duráveis, participações societárias.
   - "aplicacoes"          → CDB, LCI, LCA, fundos, Tesouro, ações, ETFs, aplicações em bancos etc.
   - "previdencias"        → PGBL, VGBL, planos de previdência privada.
   - "contas_bancarias"    → contas correntes, poupança, contas de pagamento.
   - "dividas"             → financiamentos, empréstimos, dívidas e ônus reais.
   - "rendimentos"         → salários, pró-labore, rendimentos isentos, tributáveis, exclusivos.

REGRA IMPORTANTE:
- SEMPRE que houver um valor monetário em reais associado a um bem, conta, aplicação, previdência, dívida ou rendimento, esse item DEVE aparecer no JSON de saída.
- Considere valor em reais qualquer número no formato brasileiro de dinheiro, por exemplo:
  - "R$ 10.000,00"
  - "10.000,00"
  - "250.000,00"
- Se houver mais de um valor para o mesmo item (ano anterior e ano-base), use preferencialmente o valor em 31/12 do ano-base como "valor_principal", e guarde o ano anterior em "valor_ano_anterior" se conseguir.

Saída:
Você deve responder APENAS com um JSON válido, no seguinte formato:

{
  "ano_base": ${ano},
  "itens": [
    {
      "categoria_triade": "imobilizado | aplicacoes | previdencias | contas_bancarias | dividas | rendimentos",
      "origem_irpf": "bens_direitos | dividas_onus | rendimentos | resumo | outro",
      "descricao_resumida": "texto curto explicando o item",
      "texto_original": "trecho relevante copiado da declaração",
      "instituicao": "nome do banco, empresa, plano, fonte pagadora ou null",
      "codigo_irpf": "codigo da ficha de bens/direitos ou outro codigo, se existir; senão null",
      "valor_principal": 0.0,
      "valor_ano_anterior": 0.0,
      "moeda": "BRL"
    }
  ]
}

Instruções de preenchimento:
- "ano_base": use o ano-base informado (${ano}).
- "categoria_triade": escolha UMA categoria para cada item, com base na descrição.
- "origem_irpf": indique de qual parte da declaração você deduziu o item:
  - "bens_direitos" para itens da ficha de bens e direitos.
  - "dividas_onus" para dívidas e ônus reais.
  - "rendimentos" para rendimentos tributáveis/isentos/exclusivos.
  - "resumo" se o valor vier do resumo da declaração.
  - "outro" se vier de outra seção.
- "descricao_resumida": crie um nome curto e claro (ex.: "Honda HRV Touring 2022/2023", "Poupança BB ag 7150 c/c 5258-2", "VGBL Banco do Brasil", "Salário Unicooper").
- "texto_original": copie o trecho mais relevante do texto da declaração referente àquele item (útil para auditoria humana).
- "instituicao": se houver banco, corretora, empresa, plano de previdência ou fonte pagadora, preencha; caso contrário, use null.
- "codigo_irpf": preencha com o código da linha em Bens e Direitos (por exemplo, 01, 04, 06, 99) ou outro código da declaração, se conseguir identificar; caso contrário, use null.
- "valor_principal": use, sempre que possível, o valor em 31/12 do ano-base. Se essa informação não estiver clara, use o valor monetário mais relevante associado ao item.
- "valor_ano_anterior": se a declaração trouxer valor em 31/12 do ano anterior para o mesmo item, preencha aqui; caso contrário, use null.
- "moeda": sempre "BRL".

Regras finais:
- NÃO invente valores numéricos. Só use valores que apareçam no texto.
- NÃO escreva NENHUM comentário fora do JSON.
- Se não encontrar nenhum item em determinada categoria, apenas não crie itens com aquela categoria (não é necessário separar por lista).
- Esforce-se para capturar o MÁXIMO de itens com valor em reais: patrimônio, contas, investimentos, previdência, dívidas e rendimentos.`
          },
          {
            role: 'user',
            content: `PDF IRPF ${ano} (base64):\n${base64}`
          }
        ],
            max_completion_tokens: 16000,
            temperature: 0.1
          }),
        });

        currentStep = 'processing-ai-response';
        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('❌ AI API error:', aiResponse.status, errorText);
          
          // Update declaration with error status
          await supabaseClient
            .from('declaracoes_irpf')
            .update({ status: 'Erro no processamento' })
            .eq('id', declaracao.id);
          
          return;
        }

        const responseText = await aiResponse.text();
        console.log('✅ AI response received, length:', responseText.length);
        
        currentStep = 'validating-response';
        
        if (!responseText || responseText.trim().length === 0) {
          console.error('❌ Empty AI response');
          await supabaseClient
            .from('declaracoes_irpf')
            .update({ status: 'Erro: Resposta vazia da IA' })
            .eq('id', declaracao.id);
          return;
        }

        currentStep = 'parsing-ai-result';
        let aiResult;
        try {
          aiResult = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Failed to parse AI response as JSON:', parseError);
          console.error('Response text:', responseText.substring(0, 500));
          await supabaseClient
            .from('declaracoes_irpf')
            .update({ status: 'Erro ao processar resposta' })
            .eq('id', declaracao.id);
          return;
        }
    
        currentStep = 'extracting-data';
        let extractedData;
        try {
          const content = aiResult.choices[0].message.content;
          console.log('🔍 === RAW AI CONTENT ===');
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
          console.log('Declaração:', extractedData.declaracao_irpf ? 'OK' : 'MISSING');
          console.log('Rendimentos:', extractedData.rendimentos_irpf?.length || 0, 'itens');
          console.log('Bens e Direitos:', extractedData.bens_direitos_irpf?.length || 0, 'itens');
          console.log('Dívidas IRPF:', extractedData.dividas_irpf?.length || 0, 'itens');
          console.log('Imobilizado:', extractedData.bens_imobilizados?.length || 0, 'itens');
          console.log('Aplicações:', extractedData.aplicacoes?.length || 0, 'itens');
          console.log('Previdências:', extractedData.planos_previdencia?.length || 0, 'itens');
          console.log('Contas Bancárias:', extractedData.contas_bancarias?.length || 0, 'itens');
          console.log('Dívidas:', extractedData.dividas?.length || 0, 'itens');
          
          // Validate minimum data
          const totalItems = 
            (extractedData.rendimentos_irpf?.length || 0) +
            (extractedData.bens_direitos_irpf?.length || 0) +
            (extractedData.dividas_irpf?.length || 0) +
            (extractedData.bens_imobilizados?.length || 0) +
            (extractedData.aplicacoes?.length || 0) +
            (extractedData.planos_previdencia?.length || 0) +
            (extractedData.contas_bancarias?.length || 0) +
            (extractedData.dividas?.length || 0);
          
          currentStep = 'validating-extracted-data';
          if (totalItems === 0) {
            console.error('❌ Nenhum dado extraído do PDF');
            await supabaseClient
              .from('declaracoes_irpf')
              .update({ status: 'Erro: Nenhum dado encontrado' })
              .eq('id', declaracao.id);
            return;
          }
          
          console.log('✅ Total de itens extraídos:', totalItems);
        } catch (parseError) {
          console.error('❌ Failed to parse AI response:', parseError);
          await supabaseClient
            .from('declaracoes_irpf')
            .update({ status: 'Erro ao processar dados' })
            .eq('id', declaracao.id);
          return;
        }

        // Update declaration with extracted data
        currentStep = 'updating-declaration';
        console.log('💾 Updating declaration record...');
        const declaracaoData = extractedData.declaracao_irpf || {};
        const { error: updateError } = await supabaseClient
          .from('declaracoes_irpf')
          .update({
            status: 'Importada',
            recibo: declaracaoData.recibo || null,
            prazo_limite: declaracaoData.prazo_limite || null,
            valor_pagar: declaracaoData.valor_pagar || 0,
            valor_restituir: declaracaoData.valor_restituir || 0,
            dados_brutos: declaracaoData.dados_brutos || extractedData
          })
          .eq('id', declaracao.id);

        if (updateError) {
          console.error('❌ Declaration update error:', updateError);
          return;
        }

        let rendimentosCount = 0;
        let bensDireitosCount = 0;
        let dividasIrpfCount = 0;
        let bensImobilizadosCount = 0;
        let aplicacoesCount = 0;
        let previdenciaCount = 0;
        let contasBancariasCount = 0;
        let dividasCount = 0;

        const dataAtual = new Date().toISOString().split('T')[0];

        // Insert rendimentos_irpf
        currentStep = 'inserting-rendimentos';
        console.log('💰 Inserting rendimentos...');
        if (extractedData.rendimentos_irpf && extractedData.rendimentos_irpf.length > 0) {
          const rendimentosToInsert = extractedData.rendimentos_irpf.map((r: any) => ({
            user_id: user.id,
            declaracao_id: declaracao.id,
            fonte_pagadora: r.fonte_pagadora || 'Não informada',
            cnpj: r.cnpj || null,
            tipo: r.tipo || 'Outro',
            valor: r.valor || 0,
            irrf: r.irrf || 0,
            contribuicao_previdenciaria: r.contribuicao_previdenciaria || 0,
            decimo_terceiro: r.decimo_terceiro || 0,
            ano: parseInt(ano)
          }));

          const { error: rendimentosError } = await supabaseClient
            .from('rendimentos_irpf')
            .insert(rendimentosToInsert);

          if (!rendimentosError) {
            rendimentosCount = rendimentosToInsert.length;
          } else {
            console.error('Rendimentos insert error:', rendimentosError);
          }
        }

        // Insert bens_direitos_irpf
        currentStep = 'inserting-bens-direitos';
        console.log('🏠 Inserting bens e direitos...');
        if (extractedData.bens_direitos_irpf && extractedData.bens_direitos_irpf.length > 0) {
          const bensDireitosToInsert = extractedData.bens_direitos_irpf.map((b: any) => ({
            user_id: user.id,
            declaracao_id: declaracao.id,
            codigo: b.codigo || '99',
            categoria: b.categoria || 'Outro',
            discriminacao: b.discriminacao || '',
            situacao_ano_anterior: b.situacao_ano_anterior || 0,
            situacao_ano_atual: b.situacao_ano_atual || 0
          }));

          const { error: bensDireitosError } = await supabaseClient
            .from('bens_direitos_irpf')
            .insert(bensDireitosToInsert);

          if (!bensDireitosError) {
            bensDireitosCount = bensDireitosToInsert.length;
          } else {
            console.error('Bens e Direitos insert error:', bensDireitosError);
          }
        }

        // Insert dividas_irpf
        currentStep = 'inserting-dividas-irpf';
        console.log('💳 Inserting dívidas IRPF...');
        if (extractedData.dividas_irpf && extractedData.dividas_irpf.length > 0) {
          const dividasIrpfToInsert = extractedData.dividas_irpf.map((d: any) => ({
            user_id: user.id,
            declaracao_id: declaracao.id,
            credor: d.credor || 'Não informado',
            discriminacao: d.discriminacao || '',
            valor_ano_anterior: d.valor_ano_anterior || 0,
            valor_ano_atual: d.valor_ano_atual || 0
          }));

          const { error: dividasIrpfError } = await supabaseClient
            .from('dividas_irpf')
            .insert(dividasIrpfToInsert);

          if (!dividasIrpfError) {
            dividasIrpfCount = dividasIrpfToInsert.length;
          } else {
            console.error('Dívidas IRPF insert error:', dividasIrpfError);
          }
        }

        // Insert bens imobilizados
        currentStep = 'inserting-bens-imobilizados';
        console.log('🏢 Inserting bens imobilizados...');
        if (extractedData.bens_imobilizados && extractedData.bens_imobilizados.length > 0) {
          const bensToInsert = extractedData.bens_imobilizados.map((b: any) => ({
            user_id: user.id,
            nome: (b.nome || 'Sem nome').substring(0, 100),
            categoria: b.categoria || 'Outro',
            descricao: b.descricao || b.nome || '',
            valor_aquisicao: b.valor_aquisicao || b.valor_atual || 0,
            valor_atual: b.valor_atual || 0,
            data_aquisicao: b.data_aquisicao || dataAtual,
            localizacao: b.localizacao || 'Brasil',
            status: b.status || 'Ativo'
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
        currentStep = 'inserting-aplicacoes';
        console.log('📈 Inserting aplicações...');
        if (extractedData.aplicacoes && extractedData.aplicacoes.length > 0) {
          const aplicacoesToInsert = extractedData.aplicacoes.map((a: any) => ({
            user_id: user.id,
            nome: (a.nome || 'Aplicação').substring(0, 100),
            tipo: a.tipo || 'Outro',
            instituicao: a.instituicao || 'Não informada',
            valor_aplicado: a.valor_aplicado || a.valor_atual || 0,
            valor_atual: a.valor_atual || 0,
            data_aplicacao: a.data_aplicacao || dataAtual,
            data_vencimento: a.data_vencimento || null,
            taxa_rentabilidade: a.taxa_rentabilidade || null,
            rentabilidade_tipo: a.rentabilidade_tipo || null,
            liquidez: a.liquidez || null
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
        currentStep = 'inserting-previdencia';
        console.log('🏦 Inserting planos previdência...');
        if (extractedData.planos_previdencia && extractedData.planos_previdencia.length > 0) {
          const previdenciaToInsert = extractedData.planos_previdencia.map((p: any) => ({
            user_id: user.id,
            nome: (p.nome || 'Plano de Previdência').substring(0, 100),
            tipo: p.tipo || 'VGBL',
            instituicao: p.instituicao || 'Não informada',
            valor_acumulado: p.valor_acumulado || 0,
            contribuicao_mensal: p.contribuicao_mensal || 0,
            data_inicio: p.data_inicio || dataAtual,
            idade_resgate: p.idade_resgate || null,
            taxa_administracao: p.taxa_administracao || null,
            rentabilidade_acumulada: p.rentabilidade_acumulada || null,
            ativo: p.ativo !== false
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
        currentStep = 'inserting-contas-bancarias';
        console.log('🏧 Inserting contas bancárias...');
        if (extractedData.contas_bancarias && extractedData.contas_bancarias.length > 0) {
          const contasToInsert = extractedData.contas_bancarias.map((c: any) => ({
            user_id: user.id,
            banco: (c.banco || 'Banco não informado').substring(0, 100),
            agencia: c.agencia || '0000',
            numero_conta: c.numero_conta || '00000-0',
            tipo_conta: c.tipo_conta || 'Corrente',
            saldo_atual: c.saldo_atual || 0,
            limite_credito: c.limite_credito || 0,
            ativo: c.ativo !== false
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
        currentStep = 'inserting-dividas';
        console.log('💸 Inserting dívidas...');
        if (extractedData.dividas && extractedData.dividas.length > 0) {
          const dividasToInsert = extractedData.dividas.map((d: any) => ({
            user_id: user.id,
            nome: (d.nome || 'Dívida').substring(0, 100),
            tipo: d.tipo || 'Outro',
            credor: d.credor || 'Não informado',
            valor_original: d.valor_original || d.saldo_devedor || 0,
            saldo_devedor: d.saldo_devedor || 0,
            valor_parcela: d.valor_parcela || 0,
            numero_parcelas: d.numero_parcelas || 1,
            parcelas_pagas: d.parcelas_pagas || 0,
            taxa_juros: d.taxa_juros || null,
            data_contratacao: d.data_contratacao || dataAtual,
            data_vencimento: d.data_vencimento || null,
            status: d.status || 'Ativo'
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

        currentStep = 'completed';
        console.log('🎉 === PROCESSAMENTO CONCLUÍDO ===');
        console.log(`RESUMO DE INSERÇÃO:`);
        console.log(`  - Rendimentos IRPF: ${rendimentosCount}`);
        console.log(`  - Bens e Direitos IRPF: ${bensDireitosCount}`);
        console.log(`  - Dívidas IRPF: ${dividasIrpfCount}`);
        console.log(`  - Bens Imobilizados: ${bensImobilizadosCount}`);
        console.log(`  - Aplicações: ${aplicacoesCount}`);
        console.log(`  - Previdência: ${previdenciaCount}`);
        console.log(`  - Contas Bancárias: ${contasBancariasCount}`);
        console.log(`  - Dívidas: ${dividasCount}`);
        console.log('==============================');
      } catch (error) {
        console.error(`❌ Background processing error at step [${currentStep}]:`, error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        await supabaseClient
          .from('declaracoes_irpf')
          .update({ 
            status: `Erro (${currentStep}): ${error.message?.substring(0, 200) || 'Erro desconhecido'}` 
          })
          .eq('id', declaracao.id);
      }
    };

    // Start background processing using EdgeRuntime.waitUntil to ensure completion
    EdgeRuntime.waitUntil(processDeclaration());

    // Return immediate response
    return new Response(JSON.stringify({
      success: true,
      declaracao_id: declaracao.id,
      status: 'Processando',
      message: 'Declaração enviada para processamento. Aguarde alguns instantes e atualize a página.'
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
