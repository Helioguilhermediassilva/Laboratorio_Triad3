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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar todas as transações disponíveis
    const { data: transacoes, error: transacoesError } = await supabase
      .from('transacoes')
      .select('*')
      .order('data', { ascending: false })
      .limit(100);

    if (transacoesError) {
      console.error("Error fetching transactions:", transacoesError);
      throw transacoesError;
    }

    // Se não houver transações, usar dados de exemplo consolidados de todo o sistema
    // Patrimônio Total conforme Dashboard: R$ 2.8M
    const dadosTransacoes = transacoes && transacoes.length > 0 ? transacoes : [
      // Imobilizado - R$ 1.2M (conforme Dashboard)
      {
        id: "imob1",
        data: "2020-03-15",
        descricao: "Apartamento Centro - Rua das Flores, 123",
        categoria: "Patrimônio",
        tipo: "entrada",
        valor: 450000,
        conta: "Imobilizado"
      },
      {
        id: "imob2",
        data: "2022-01-10",
        descricao: "Honda Civic 2022",
        categoria: "Patrimônio",
        tipo: "entrada",
        valor: 125000,
        conta: "Imobilizado"
      },
      {
        id: "imob3",
        data: "2019-07-20",
        descricao: "Casa de Praia - Guarujá",
        categoria: "Patrimônio",
        tipo: "entrada",
        valor: 600000,
        conta: "Imobilizado"
      },
      {
        id: "imob4",
        data: "2023-05-12",
        descricao: "Equipamentos e Móveis",
        categoria: "Patrimônio",
        tipo: "entrada",
        valor: 25000,
        conta: "Imobilizado"
      },
      // Aplicações/Liquidez - R$ 485.2K (conforme Dashboard)
      {
        id: "apl1",
        data: "2024-01-15",
        descricao: "PETR4 - 1000 ações",
        categoria: "Investimentos",
        tipo: "entrada",
        valor: 35840,
        conta: "XP Investimentos"
      },
      {
        id: "apl2",
        data: "2023-11-20",
        descricao: "VALE3 - 850 ações",
        categoria: "Investimentos",
        tipo: "entrada",
        valor: 42650,
        conta: "Rico Investimentos"
      },
      {
        id: "apl3",
        data: "2024-02-10",
        descricao: "HGLG11 - 120 cotas",
        categoria: "Investimentos",
        tipo: "entrada",
        valor: 12480,
        conta: "Inter Investimentos"
      },
      {
        id: "apl4",
        data: "2023-09-15",
        descricao: "ITUB4 - 500 ações",
        categoria: "Investimentos",
        tipo: "entrada",
        valor: 28750,
        conta: "XP Investimentos"
      },
      {
        id: "apl5",
        data: "2024-03-10",
        descricao: "BBDC4 - 800 ações",
        categoria: "Investimentos",
        tipo: "entrada",
        valor: 19880,
        conta: "Rico Investimentos"
      },
      {
        id: "apl6",
        data: "2024-01-20",
        descricao: "MXRF11 - 80 cotas",
        categoria: "Investimentos",
        tipo: "entrada",
        valor: 8640,
        conta: "Inter Investimentos"
      },
      {
        id: "apl7",
        data: "2024-02-15",
        descricao: "Tesouro Direto - IPCA+ 2035",
        categoria: "Investimentos",
        tipo: "entrada",
        valor: 85000,
        conta: "Tesouro Direto"
      },
      {
        id: "apl8",
        data: "2023-12-10",
        descricao: "CDB Banco Inter - 120% CDI",
        categoria: "Investimentos",
        tipo: "entrada",
        valor: 120000,
        conta: "Banco Inter"
      },
      {
        id: "apl9",
        data: "2024-01-05",
        descricao: "Fundos Imobiliários - Diversos",
        categoria: "Investimentos",
        tipo: "entrada",
        valor: 95000,
        conta: "XP Investimentos"
      },
      {
        id: "apl10",
        data: "2023-11-01",
        descricao: "LCI/LCA - Carteira",
        categoria: "Investimentos",
        tipo: "entrada",
        valor: 36960,
        conta: "Banco do Brasil"
      },
      // Negócios/Receita Mensal - R$ 18.5K mensal (R$ 222K anual)
      {
        id: "neg1",
        data: "2024-01-01",
        descricao: "Receitas Anuais de Negócios",
        categoria: "Negócios",
        tipo: "entrada",
        valor: 222000,
        conta: "Rendimentos Anuais"
      },
      {
        id: "rend1",
        data: "2024-01-15",
        descricao: "Salário Mensal",
        categoria: "Salário",
        tipo: "entrada",
        valor: 8500,
        conta: "Conta Corrente Itaú"
      },
      {
        id: "rend2",
        data: "2024-01-19",
        descricao: "Freelance - Projetos",
        categoria: "Negócios",
        tipo: "entrada",
        valor: 3500,
        conta: "Conta Corrente Nubank"
      },
      {
        id: "rend3",
        data: "2024-01-17",
        descricao: "Dividendos - Carteira de Ações",
        categoria: "Investimentos",
        tipo: "entrada",
        valor: 2800,
        conta: "Conta XP"
      },
      {
        id: "rend4",
        data: "2024-01-22",
        descricao: "Aluguel Recebido - Imóvel Comercial",
        categoria: "Patrimônio",
        tipo: "entrada",
        valor: 3700,
        conta: "Conta Corrente Itaú"
      },
      // Dívidas
      {
        id: "div1",
        data: "2024-01-15",
        descricao: "Financiamento Imobiliário - Saldo Devedor",
        categoria: "Dívida",
        tipo: "saida",
        valor: 287500,
        conta: "Banco do Brasil"
      },
      {
        id: "div2",
        data: "2024-01-10",
        descricao: "Financiamento Veicular - Saldo Devedor",
        categoria: "Dívida",
        tipo: "saida",
        valor: 45600,
        conta: "Santander"
      },
      // Despesas
      {
        id: "desp1",
        data: "2024-01-16",
        descricao: "Despesas Mensais Fixas",
        categoria: "Moradia",
        tipo: "saida",
        valor: 5000,
        conta: "Diversas Contas"
      }
    ];

    console.log(`Analyzing ${dadosTransacoes.length} transactions from Triad3 system...`);

    // Calcular totais por categoria baseado no conceito Triad3
    const totais = {
      liquidez: 0,
      imobilizado: 0,
      negocios: 0,
      total: 0
    };

    const categoriasPorTipo = {
      liquidez: ['Investimentos', 'Conta Corrente', 'Poupança', 'Outros'],
      imobilizado: ['Moradia', 'Transporte', 'Patrimônio'],
      negocios: ['Salário', 'Freelance', 'Negócios', 'Empresa']
    };

    dadosTransacoes?.forEach((t: any) => {
      const valor = parseFloat(t.valor);
      if (t.tipo === 'entrada') {
        totais.total += valor;
        
        // Classificar por tipo Triad3
        if (categoriasPorTipo.liquidez.includes(t.categoria)) {
          totais.liquidez += valor;
        } else if (categoriasPorTipo.imobilizado.includes(t.categoria)) {
          totais.imobilizado += valor;
        } else if (categoriasPorTipo.negocios.includes(t.categoria)) {
          totais.negocios += valor;
        }
      }
    });

    // Calcular patrimônio líquido (descontando dívidas)
    const totalDividas = dadosTransacoes
      ?.filter((t: any) => t.categoria === 'Dívida' && t.tipo === 'saida')
      .reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
    
    const patrimonioLiquido = totais.total - totalDividas;

    // Calcular percentuais
    const percentuais = {
      liquidez: totais.total > 0 ? (totais.liquidez / totais.total * 100).toFixed(2) : 0,
      imobilizado: totais.total > 0 ? (totais.imobilizado / totais.total * 100).toFixed(2) : 0,
      negocios: totais.total > 0 ? (totais.negocios / totais.total * 100).toFixed(2) : 0
    };

    // Preparar prompt para análise com IA
    const prompt = `Você é um consultor financeiro especializado no conceito Triad3 de gestão patrimonial.

CONCEITO TRIAD3:
O patrimônio ideal deve estar dividido em:
- 33% em LIQUIDEZ (investimentos líquidos, ações, FIIs, conta corrente, poupança)
- 33% em IMOBILIZADO (imóveis, veículos, bens duráveis, equipamentos)
- 33% em NEGÓCIOS (empresas, participações societárias, rendimentos de negócios, renda ativa)

DADOS PATRIMONIAIS ATUAIS:
Patrimônio Bruto Total: R$ ${totais.total.toFixed(2)}
Total de Dívidas: R$ ${totalDividas.toFixed(2)}
Patrimônio Líquido: R$ ${patrimonioLiquido.toFixed(2)}

Distribuição Atual:
- Liquidez (Investimentos): R$ ${totais.liquidez.toFixed(2)} (${percentuais.liquidez}%)
- Imobilizado (Bens): R$ ${totais.imobilizado.toFixed(2)} (${percentuais.imobilizado}%)
- Negócios (Rendimentos): R$ ${totais.negocios.toFixed(2)} (${percentuais.negocios}%)

Total de ${dadosTransacoes?.length || 0} transações analisadas incluindo:
- ${dadosTransacoes?.filter((t: any) => t.categoria === 'Patrimônio').length || 0} bens imobilizados
- ${dadosTransacoes?.filter((t: any) => t.categoria === 'Investimentos').length || 0} aplicações financeiras
- ${dadosTransacoes?.filter((t: any) => t.categoria === 'Dívida').length || 0} dívidas em aberto
${dadosTransacoes && dadosTransacoes.length > 0 && !transacoes?.length ? '\n(Análise baseada em dados de exemplo do sistema)' : ''}

TAREFA:
Analise a distribuição patrimonial atual e forneça:

1. **Diagnóstico Executivo**: 
   - Avalie se a distribuição está alinhada com o conceito Triad3 (33-33-33)
   - Identifique pontos fortes e fracos da distribuição atual

2. **Pontos Críticos de Atenção**: 
   - Identifique desequilíbrios significativos e seus riscos
   - Analise o impacto das dívidas no patrimônio líquido
   - Avalie a diversificação dos investimentos
   - Considere riscos de concentração em categorias específicas

3. **Recomendações Estratégicas**: Forneça 4-6 ações práticas e específicas para:
   - Melhorar o equilíbrio patrimonial conforme o conceito Triad3
   - Otimizar a gestão das dívidas existentes
   - Aumentar participação em áreas deficitárias
   - Maximizar retorno dos ativos existentes
   - Proteger e preservar o patrimônio

4. **Análise de Liquidez e Risco**: 
   - Avalie a capacidade de honrar compromissos financeiros
   - Analise a proporção patrimônio/dívida
   - Identifique riscos de liquidez e concentração
   - Considere reservas de emergência

5. **Plano de Ação 6 Meses**: 
   - Sugira 3-5 objetivos tangíveis e mensuráveis
   - Priorize ações de acordo com o impacto no equilíbrio Triad3
   - Estabeleça metas realistas de acordo com o perfil atual

Forneça uma análise profissional, clara, acionável e personalizada para o perfil patrimonial apresentado.

---
**Equipe de Consultoria Financeira Triad3**`;

    console.log("Calling Lovable AI for analysis...");

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
            content: 'Você é um consultor financeiro expert em planejamento patrimonial e no conceito Triad3. Forneça análises profissionais, práticas e acionáveis.' 
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

    console.log("Analysis completed successfully");

    return new Response(
      JSON.stringify({
        analise,
        dados: {
          totais,
          percentuais,
          dividas: totalDividas,
          patrimonioLiquido,
          ideal: {
            liquidez: 33,
            imobilizado: 33,
            negocios: 33
          },
          desvios: {
            liquidez: (parseFloat(percentuais.liquidez.toString()) - 33).toFixed(2),
            imobilizado: (parseFloat(percentuais.imobilizado.toString()) - 33).toFixed(2),
            negocios: (parseFloat(percentuais.negocios.toString()) - 33).toFixed(2)
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
