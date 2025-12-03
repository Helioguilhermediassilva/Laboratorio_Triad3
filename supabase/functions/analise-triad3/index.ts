import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Obter token do usuário do header Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Não autorizado. Faça login para continuar.");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Extrair o token JWT do header
    const token = authHeader.replace('Bearer ', '');
    
    // Criar cliente com service role para verificar o token
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar usuário autenticado usando o token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      throw new Error("Usuário não autenticado");
    }

    console.log(`Fetching real data for user: ${user.id}`);

    // Buscar dados REAIS de todas as tabelas do usuário
    const [
      imobilizadoRes,
      aplicacoesRes,
      previdenciaRes,
      contasRes,
      dividasRes
    ] = await Promise.all([
      supabase.from('bens_imobilizados').select('*').eq('user_id', user.id),
      supabase.from('aplicacoes').select('*').eq('user_id', user.id),
      supabase.from('planos_previdencia').select('*').eq('user_id', user.id),
      supabase.from('contas_bancarias').select('*').eq('user_id', user.id),
      supabase.from('dividas').select('*').eq('user_id', user.id)
    ]);

    // Calcular totais reais
    const totalImobilizado = (imobilizadoRes.data || []).reduce((sum, item) => sum + Number(item.valor_atual || 0), 0);
    const totalAplicacoes = (aplicacoesRes.data || []).reduce((sum, item) => sum + Number(item.valor_atual || 0), 0);
    const totalPrevidencia = (previdenciaRes.data || []).reduce((sum, item) => sum + Number(item.valor_acumulado || 0), 0);
    const totalContasBancarias = (contasRes.data || []).reduce((sum, item) => sum + Number(item.saldo_atual || 0), 0);
    const totalDividas = (dividasRes.data || []).reduce((sum, item) => sum + Number(item.saldo_devedor || 0), 0);

    // Liquidez = Aplicações + Previdência + Contas Bancárias
    const totalLiquidez = totalAplicacoes + totalPrevidencia + totalContasBancarias;
    
    // Patrimônio total (ativos)
    const patrimonioTotal = totalImobilizado + totalLiquidez;
    
    // Patrimônio líquido
    const patrimonioLiquido = patrimonioTotal - totalDividas;

    // Log dos dados encontrados
    console.log("Dados reais encontrados:");
    console.log(`- Imobilizado: R$ ${totalImobilizado.toFixed(2)} (${imobilizadoRes.data?.length || 0} bens)`);
    console.log(`- Aplicações: R$ ${totalAplicacoes.toFixed(2)} (${aplicacoesRes.data?.length || 0} aplicações)`);
    console.log(`- Previdência: R$ ${totalPrevidencia.toFixed(2)} (${previdenciaRes.data?.length || 0} planos)`);
    console.log(`- Contas Bancárias: R$ ${totalContasBancarias.toFixed(2)} (${contasRes.data?.length || 0} contas)`);
    console.log(`- Dívidas: R$ ${totalDividas.toFixed(2)} (${dividasRes.data?.length || 0} dívidas)`);
    console.log(`- Patrimônio Total: R$ ${patrimonioTotal.toFixed(2)}`);
    console.log(`- Patrimônio Líquido: R$ ${patrimonioLiquido.toFixed(2)}`);

    // Verificar se há dados cadastrados
    const temDados = patrimonioTotal > 0 || totalDividas > 0;
    
    if (!temDados) {
      return new Response(
        JSON.stringify({ 
          error: "Você ainda não possui dados cadastrados. Adicione bens imobilizados, aplicações, contas bancárias ou dívidas para gerar uma análise." 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular totais no conceito Triad3
    // Liquidez (33%): Aplicações + Contas + Previdência
    // Imobilizado (34%): Bens imobilizados
    // Negócios (33%): Como não temos tabela de negócios, consideramos 0
    const totais = {
      liquidez: totalLiquidez,
      imobilizado: totalImobilizado,
      negocios: 0, // Sem tabela específica de negócios
      total: patrimonioTotal
    };

    // Calcular percentuais
    const percentuais = {
      liquidez: patrimonioTotal > 0 ? (totais.liquidez / patrimonioTotal * 100).toFixed(2) : "0.00",
      imobilizado: patrimonioTotal > 0 ? (totais.imobilizado / patrimonioTotal * 100).toFixed(2) : "0.00",
      negocios: "0.00"
    };

    // Preparar detalhes para a IA
    const detalhesImobilizado = (imobilizadoRes.data || []).map(b => 
      `- ${b.nome} (${b.categoria}): R$ ${Number(b.valor_atual).toLocaleString('pt-BR')}`
    ).join('\n');

    const detalhesAplicacoes = (aplicacoesRes.data || []).map(a => 
      `- ${a.nome} (${a.tipo}): R$ ${Number(a.valor_atual).toLocaleString('pt-BR')} em ${a.instituicao}`
    ).join('\n');

    const detalhesPrevidencia = (previdenciaRes.data || []).map(p => 
      `- ${p.nome} (${p.tipo}): R$ ${Number(p.valor_acumulado).toLocaleString('pt-BR')} em ${p.instituicao}`
    ).join('\n');

    const detalhesContas = (contasRes.data || []).map(c => 
      `- ${c.banco} (${c.tipo_conta}): R$ ${Number(c.saldo_atual).toLocaleString('pt-BR')}`
    ).join('\n');

    const detalhesDividas = (dividasRes.data || []).map(d => 
      `- ${d.nome} (${d.tipo}): Saldo devedor R$ ${Number(d.saldo_devedor).toLocaleString('pt-BR')} - ${d.parcelas_pagas}/${d.numero_parcelas} parcelas pagas - Credor: ${d.credor}`
    ).join('\n');

    // Preparar prompt para análise com IA
    const prompt = `Você é um consultor financeiro especializado no conceito Triad3 de gestão patrimonial.

CONCEITO TRIAD3:
O patrimônio ideal deve estar dividido em:
- 33% em LIQUIDEZ (investimentos líquidos, aplicações financeiras, contas bancárias, previdência)
- 34% em IMOBILIZADO (imóveis, veículos, bens duráveis, equipamentos)
- 33% em NEGÓCIOS (empresas, participações societárias, negócios próprios)

=== DADOS PATRIMONIAIS REAIS DO USUÁRIO ===

RESUMO PATRIMONIAL:
- Patrimônio Bruto Total: R$ ${patrimonioTotal.toLocaleString('pt-BR')}
- Total de Dívidas: R$ ${totalDividas.toLocaleString('pt-BR')}
- Patrimônio Líquido: R$ ${patrimonioLiquido.toLocaleString('pt-BR')}

DISTRIBUIÇÃO ATUAL:
- Liquidez: R$ ${totais.liquidez.toLocaleString('pt-BR')} (${percentuais.liquidez}% do patrimônio)
  • Aplicações: R$ ${totalAplicacoes.toLocaleString('pt-BR')}
  • Previdência: R$ ${totalPrevidencia.toLocaleString('pt-BR')}
  • Contas Bancárias: R$ ${totalContasBancarias.toLocaleString('pt-BR')}
- Imobilizado: R$ ${totais.imobilizado.toLocaleString('pt-BR')} (${percentuais.imobilizado}% do patrimônio)
- Negócios: R$ 0,00 (0% do patrimônio - sem dados cadastrados)

DETALHAMENTO DOS BENS IMOBILIZADOS (${imobilizadoRes.data?.length || 0} itens):
${detalhesImobilizado || 'Nenhum bem imobilizado cadastrado'}

DETALHAMENTO DAS APLICAÇÕES FINANCEIRAS (${aplicacoesRes.data?.length || 0} aplicações):
${detalhesAplicacoes || 'Nenhuma aplicação cadastrada'}

DETALHAMENTO DOS PLANOS DE PREVIDÊNCIA (${previdenciaRes.data?.length || 0} planos):
${detalhesPrevidencia || 'Nenhum plano cadastrado'}

DETALHAMENTO DAS CONTAS BANCÁRIAS (${contasRes.data?.length || 0} contas):
${detalhesContas || 'Nenhuma conta cadastrada'}

DETALHAMENTO DAS DÍVIDAS (${dividasRes.data?.length || 0} dívidas):
${detalhesDividas || 'Nenhuma dívida cadastrada'}

=== TAREFA ===

Analise APENAS os dados REAIS apresentados acima. NÃO INVENTE valores ou bens que não foram listados.

Forneça:

1. **Diagnóstico Executivo**: 
   - Avalie se a distribuição atual está alinhada com o conceito Triad3
   - Identifique pontos fortes e fracos baseados nos dados REAIS

2. **Análise de Liquidez**: 
   - Avalie a proporção entre ativos líquidos e imobilizados
   - Analise a diversificação das aplicações (se houver)
   - Comente sobre a reserva de emergência

3. **Análise de Dívidas**: 
   - Analise o comprometimento do patrimônio com dívidas
   - Avalie a relação dívida/patrimônio
   - Identifique riscos de endividamento

4. **Recomendações Específicas**: 
   - Forneça 3-5 ações práticas e específicas baseadas nos dados REAIS
   - Priorize ações de acordo com o impacto no equilíbrio patrimonial
   - Considere a situação atual de dívidas

5. **Plano de Ação**: 
   - Sugira 2-3 objetivos tangíveis para os próximos 6 meses
   - Metas realistas de acordo com o perfil REAL apresentado

IMPORTANTE: Baseie sua análise EXCLUSIVAMENTE nos dados fornecidos. Não mencione valores ou bens que não estejam listados acima.`;

    console.log("Calling Lovable AI for analysis with real user data...");

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
            content: 'Você é um consultor financeiro expert em planejamento patrimonial e no conceito Triad3. Forneça análises profissionais baseadas APENAS nos dados REAIS fornecidos. NUNCA invente valores, bens ou informações que não foram apresentados pelo usuário.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace Lovable." }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status} ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const analise = aiData.choices[0].message.content;

    console.log("Analysis completed successfully with real user data");

    return new Response(
      JSON.stringify({
        analise,
        dados: {
          totais: {
            ...totais,
            aplicacoes: totalAplicacoes,
            previdencia: totalPrevidencia,
            contasBancarias: totalContasBancarias
          },
          percentuais,
          dividas: totalDividas,
          patrimonioLiquido,
          ideal: {
            liquidez: 33,
            imobilizado: 34,
            negocios: 33
          },
          desvios: {
            liquidez: (parseFloat(percentuais.liquidez) - 33).toFixed(2),
            imobilizado: (parseFloat(percentuais.imobilizado) - 34).toFixed(2),
            negocios: (0 - 33).toFixed(2)
          },
          quantidades: {
            imobilizado: imobilizadoRes.data?.length || 0,
            aplicacoes: aplicacoesRes.data?.length || 0,
            previdencia: previdenciaRes.data?.length || 0,
            contas: contasRes.data?.length || 0,
            dividas: dividasRes.data?.length || 0
          }
        },
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in analise-triad3 function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar análise' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
