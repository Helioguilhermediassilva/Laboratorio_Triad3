-- Limpar todos os dados financeiros do usuário helio@nowgo.com.br
-- User ID: 553ce2b3-5826-4749-b690-167b3da92efa

-- Delete bens imobilizados
DELETE FROM bens_imobilizados 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';

-- Delete aplicações
DELETE FROM aplicacoes 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';

-- Delete planos de previdência
DELETE FROM planos_previdencia 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';

-- Delete contas bancárias
DELETE FROM contas_bancarias 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';

-- Delete dívidas
DELETE FROM dividas 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';

-- Delete transações
DELETE FROM transacoes 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';

-- Delete metas financeiras
DELETE FROM metas_financeiras 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';

-- Delete orçamentos
DELETE FROM orcamentos 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';

-- Delete lembretes
DELETE FROM lembretes 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';

-- Delete testamentos
DELETE FROM testamentos 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';

-- Delete rendimentos IRPF
DELETE FROM rendimentos_irpf 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';

-- Delete bens e direitos IRPF
DELETE FROM bens_direitos_irpf 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';

-- Delete dívidas IRPF
DELETE FROM dividas_irpf 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';

-- Delete declarações IRPF
DELETE FROM declaracoes_irpf 
WHERE user_id = '553ce2b3-5826-4749-b690-167b3da92efa';