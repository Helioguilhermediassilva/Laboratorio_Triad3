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
            content: `Você é um assistente de extração de dados da plataforma financeira TRIAD.

Fluxo:
- O usuário está na tela "Imposto de Renda" da TRIAD.
- Ele clica em "Importar Declaração", escolhe um PDF do IRPF e informa o ano-base (ex.: ${ano}).
- O sistema faz OCR do PDF e envia PARA VOCÊ o texto completo da declaração de IRPF.

Sua tarefa:
Ler TODO o texto da declaração e devolver um JSON pronto para ser gravado nas tabelas do banco de dados da TRIAD, com a seguinte estrutura:

- declaracoes_irpf
- rendimentos_irpf
- bens_direitos_irpf
- dividas_irpf
- bens_imobilizados
- aplicacoes
- planos_previdencia
- contas_bancarias
- dividas

Você NÃO grava nada; apenas monta os objetos para que o backend da TRIAD persista.

IMPORTANTE:
- Sempre que houver um item patrimonial ou financeiro com valor em reais, ele DEVE ser incluído em alguma das estruturas.
- Use os títulos e seções da declaração oficial de IRPF (ex.: "RENDIMENTOS TRIBUTÁVEIS RECEBIDOS DE PESSOA JURÍDICA PELO TITULAR", "DECLARAÇÃO DE BENS E DIREITOS", "DÍVIDAS E ÔNUS REAIS", "RESUMO") para identificar onde cada informação se encaixa.

--------------------------------
MAPEAMENTO PARA AS TABELAS TRIAD
--------------------------------

1) declaracoes_irpf
Tabela: declaracoes_irpf
Campos: id, user_id, ano, status, prazo_limite, valor_pagar, valor_restituir, arquivo_original, recibo, dados_brutos

Regras:
- Preencha um objeto com:
  - "user_id": use o valor que vier na entrada (parâmetro externo, não invente).
  - "ano": o ano-base da declaração (por ex.: ${ano}).
  - "status": use "importada" (ou outro valor informado na entrada).
  - "valor_pagar": se no RESUMO houver "SALDO DE IMPOSTO A PAGAR", use esse valor. Se estiver 0, use 0.
  - "valor_restituir": se no RESUMO houver "IMPOSTO A RESTITUIR", use esse valor. Se não houver, use 0.
  - "recibo": se houver número de recibo da declaração anterior ou atual, copie o valor textual.
  - "arquivo_original": deixe como null ou um placeholder, pois o backend vai preencher com o caminho do PDF.
  - "prazo_limite": deixe null (o backend pode calcular).
  - "dados_brutos": coloque TODO o texto da declaração em uma string (texto bruto).

2) rendimentos_irpf
Tabela: rendimentos_irpf
Campos: id, user_id, declaracao_id, fonte_pagadora, cnpj, tipo, valor, irrf, contribuicao_previdenciaria, decimo_terceiro, ano

Fonte: seções de rendimentos:
- "RENDIMENTOS TRIBUTÁVEIS RECEBIDOS DE PESSOA JURÍDICA PELO TITULAR"
- "RENDIMENTOS TRIBUTÁVEIS RECEBIDOS DE PESSOA FÍSICA E DO EXTERIOR PELO TITULAR"
- "RENDIMENTOS ISENTOS E NÃO TRIBUTÁVEIS"
- "RENDIMENTOS SUJEITOS À TRIBUTAÇÃO EXCLUSIVA / DEFINITIVA"
etc.

Regras:
- Crie um item em "rendimentos_irpf" para cada linha de fonte pagadora ou categoria de rendimento.
- "user_id": copiar o user_id da entrada.
- "declaracao_id": deixe null (o backend vai associar).
- "fonte_pagadora": nome da fonte (ex.: "UNICOOPER COOPERATIVA DE MEDICOS").
- "cnpj": CNPJ informado logo abaixo da fonte, quando houver.
- "tipo": texto curto indicando o tipo, por ex.:
  - "PJ_titular"
  - "PF_exterior_titular"
  - "isento"
  - "tributacao_exclusiva"
- "valor": valor principal do rendimento (por ex., coluna "REND. RECEBIDOS DE PESSOA JURÍDICA").
- "irrf": coluna "IMPOSTO RETIDO NA FONTE" quando existir.
- "contribuicao_previdenciaria": coluna "CONTR. PREVID. OFICIAL" quando existir.
- "decimo_terceiro": se estiver explícito em coluna específica, use esse valor; caso contrário, null.
- "ano": ano-base da declaração (ex.: ${ano}).

3) bens_direitos_irpf
Tabela: bens_direitos_irpf
Campos: id, user_id, declaracao_id, codigo, categoria, discriminacao, situacao_ano_anterior, situacao_ano_atual

Fonte: seção "DECLARAÇÃO DE BENS E DIREITOS".

Regras:
- Para cada linha de bem/direito:
  - "codigo": código do bem na declaração (ex.: 01, 04, 06, 07, 99).
  - "categoria": texto do grupo ou descrição resumida (ex.: "veículo", "poupança", "aplicações", "VGBL").
  - "discriminacao": copie o texto completo da coluna de discriminação (ex.: "AQUISICAO VEICULO HONDA HRV TOURING 2022/2023 PLACA RVP 3J46").
  - "situacao_ano_anterior": valor de 31/12 do ano anterior.
  - "situacao_ano_atual": valor de 31/12 do ano-base.
- "user_id": copiar da entrada.
- "declaracao_id": deixe null (o backend fará o vínculo).

4) dividas_irpf
Tabela: dividas_irpf
Campos: id, user_id, declaracao_id, credor, discriminacao, valor_ano_anterior, valor_ano_atual

Fonte: seção "DÍVIDAS E ÔNUS REAIS".

Regras:
- Se a declaração indicar "Sem Informações", retorne lista vazia.
- Senão, crie um item para cada dívida:
  - "credor": nome do credor.
  - "discriminacao": texto completo da linha.
  - "valor_ano_anterior": valor em 31/12 do ano anterior.
  - "valor_ano_atual": valor em 31/12 do ano-base.
- "user_id" e "declaracao_id" como nos itens anteriores.

5) Normalização para as tabelas patrimoniais da TRIAD
A partir de "bens_direitos_irpf" e "dividas_irpf", você deve CLASSIFICAR os itens nas tabelas:

5.1) bens_imobilizados
Tabela: bens_imobilizados
Campos: id, user_id, nome, categoria, descricao, valor_aquisicao, valor_atual, data_aquisicao, localizacao, status

Regra:
- Inclua aqui imóveis, veículos e outros bens duráveis.
- Use a "discriminacao" e o "codigo" para decidir:
  - Veículos (ex.: códigos típicos de veículos, descrição com "veículo", "carro", "moto", "HONDA HRV").
  - Imóveis (consultório, casa, apartamento, terreno etc.).
- "nome": um título curto (ex.: "Honda HRV Touring 2022/2023").
- "categoria": "veiculo", "imovel" etc.
- "descricao": texto completo de discriminação.
- "valor_aquisicao": se não houver valor de aquisição explícito, use o valor do ano anterior ou atual (o que fizer mais sentido).
- "valor_atual": valor da situação em 31/12 do ano-base.
- "data_aquisicao", "localizacao", "status": se não houver dados, use null ou um valor genérico como "ativo" para status.

5.2) aplicacoes
Tabela: aplicacoes
Campos: id, user_id, nome, tipo, instituicao, valor_aplicado, valor_atual, data_aplicacao, data_vencimento, taxa_rentabilidade, rentabilidade_tipo, liquidez

Regra:
- Inclua aqui CDB, fundos, aplicações em banco, renda fixa etc.
- Use seções de "Rendimentos de aplicações financeiras" + bens e direitos com descrições como "APLICACOES JUNTO AO BANCO DO BRASIL", "APLICACOES BANCO SANTANDER", "CDB" etc.
- "nome": um nome curto para a aplicação.
- "tipo": "renda_fixa", "poupanca", "fundo" etc, se conseguir inferir.
- "instituicao": nome do banco ou corretora.
- "valor_aplicado": use o valor do ano anterior, se fizer sentido.
- "valor_atual": valor na situação em 31/12 do ano-base.
- Outros campos podem ser null se não houver informações.

5.3) planos_previdencia
Tabela: planos_previdencia
Campos: id, user_id, nome, tipo, instituicao, valor_acumulado, contribuicao_mensal, data_inicio, idade_resgate, taxa_administracao, rentabilidade_acumulada, ativo

Regra:
- Inclua aqui planos como PGBL, VGBL.
- Identifique-os em "Bens e Direitos" (ex.: "VGBL BANCO BRASIL").
- "valor_acumulado": situação em 31/12 do ano-base.
- Campos sem informação explícita podem ser null.
- "ativo": true, a menos que o texto indique o contrário.

5.4) contas_bancarias
Tabela: contas_bancarias
Campos: id, user_id, banco, agencia, numero_conta, tipo_conta, saldo_atual, limite_credito, ativo

Regra:
- Inclua contas correntes e poupanças.
- Use "DECLARAÇÃO DE BENS E DIREITOS" quando a discriminação for "POUPANCA BANCO BRASIL", "CONTA CORRENTE BANCO BRASIL" etc.
- Procure por "Banco:", "Agência:", "Conta:" no texto da discriminação para preencher agência e número.
- "saldo_atual": situação em 31/12 do ano-base.
- "tipo_conta": "corrente" ou "poupanca" quando possível.
- "ativo": true.

5.5) dividas
Tabela: dividas
Campos: id, user_id, nome, tipo, credor, valor_original, saldo_devedor, valor_parcela, numero_parcelas, parcelas_pagas, taxa_juros, data_contratacao, data_vencimento, status

Regra:
- A partir de "dividas_irpf", crie registros aqui.
- "nome": um título curto da dívida.
- "tipo": "financiamento", "emprestimo" etc, se conseguir inferir.
- "credor": nome do credor.
- "saldo_devedor": valor em 31/12 do ano-base.
- Demais campos podem ser null se não houver indicações.

--------------------------------
FORMATO FINAL DE SAÍDA
--------------------------------

Retorne APENAS um JSON válido, no formato:

{
  "declaracao_irpf": { ... },
  "rendimentos_irpf": [ ... ],
  "bens_direitos_irpf": [ ... ],
  "dividas_irpf": [ ... ],
  "bens_imobilizados": [ ... ],
  "aplicacoes": [ ... ],
  "planos_previdencia": [ ... ],
  "contas_bancarias": [ ... ],
  "dividas": [ ... ]
}

Regras finais:
- Não escreva NENHUM texto fora do JSON.
- Se alguma lista não tiver itens, retorne-a como [].
- Nunca invente valores numéricos; use apenas os que aparecerem na declaração. Se não houver, use null.
- Utilize os valores monetários em reais da declaração (em especial os saldos em 31/12) sempre que possível.`
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
