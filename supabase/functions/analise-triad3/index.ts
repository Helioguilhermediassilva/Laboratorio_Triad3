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

    // Se não houver transações, usar dados de exemplo
    const dadosTransacoes = transacoes && transacoes.length > 0 ? transacoes : [
      {
        id: "1",
        data: "2024-01-15",
        descricao: "Salário - Empresa XYZ",
        categoria: "Salário",
        tipo: "entrada",
        valor: 8500,
        conta: "Conta Corrente Itaú"
      },
      {
        id: "2",
        data: "2024-01-16",
        descricao: "Aluguel Apartamento",
        categoria: "Moradia",
        tipo: "saida",
        valor: 2200,
        conta: "Conta Corrente Itaú"
      },
      {
        id: "3",
        data: "2024-01-17",
        descricao: "Dividendos PETR4",
        categoria: "Investimentos",
        tipo: "entrada",
        valor: 450,
        conta: "Conta Corrente XP"
      },
      {
        id: "4",
        data: "2024-01-18",
        descricao: "Supermercado Extra",
        categoria: "Alimentação",
        tipo: "saida",
        valor: 380,
        conta: "Cartão de Crédito"
      },
      {
        id: "5",
        data: "2024-01-19",
        descricao: "Freelance - Design",
        categoria: "Freelance",
        tipo: "entrada",
        valor: 1200,
        conta: "Conta Corrente Nubank"
      },
      {
        id: "6",
        data: "2024-01-20",
        descricao: "Participação Quality Carvão",
        categoria: "Negócios",
        tipo: "entrada",
        valor: 15000,
        conta: "Conta Empresarial"
      },
      {
        id: "7",
        data: "2024-01-21",
        descricao: "Investimento em Fundos",
        categoria: "Investimentos",
        tipo: "entrada",
        valor: 12000,
        conta: "Conta XP Investimentos"
      },
      {
        id: "8",
        data: "2024-01-22",
        descricao: "Imóvel - Aluguel Recebido",
        categoria: "Patrimônio",
        tipo: "entrada",
        valor: 3500,
        conta: "Conta Corrente Itaú"
      }
    ];

    console.log(`Analyzing ${dadosTransacoes.length} transactions...`);

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
- 33% em LIQUIDEZ (investimentos líquidos, conta corrente, poupança)
- 33% em IMOBILIZADO (imóveis, veículos, bens duráveis)
- 33% em NEGÓCIOS (empresas, participações societárias, rendimentos de negócios)

DADOS DO CLIENTE:
Total de Patrimônio: R$ ${totais.total.toFixed(2)}

Distribuição Atual:
- Liquidez: R$ ${totais.liquidez.toFixed(2)} (${percentuais.liquidez}%)
- Imobilizado: R$ ${totais.imobilizado.toFixed(2)} (${percentuais.imobilizado}%)
- Negócios: R$ ${totais.negocios.toFixed(2)} (${percentuais.negocios}%)

Últimas ${dadosTransacoes?.length || 0} transações analisadas.
${dadosTransacoes && dadosTransacoes.length > 0 && !transacoes?.length ? '\n(Análise baseada em dados de exemplo - adicione suas transações reais no Livro Caixa)' : ''}

TAREFA:
Analise a distribuição patrimonial atual e forneça:

1. **Diagnóstico**: Avalie se a distribuição está alinhada com o conceito Triad3 (33-33-33)

2. **Pontos de Atenção**: Identifique desequilíbrios significativos e seus riscos

3. **Recomendações Específicas**: Forneça 3-5 ações práticas para melhorar o equilíbrio patrimonial

4. **Padrões de Gastos**: Analise tendências nas transações recentes

5. **Metas de Curto Prazo**: Sugira objetivos para os próximos 3-6 meses

Forneça uma análise profissional, clara e acionável, considerando o perfil empresarial do cliente.`;

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
