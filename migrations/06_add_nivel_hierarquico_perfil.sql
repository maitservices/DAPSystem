-- 1. Adiciona a coluna de Nível (Peso Hierárquico)
ALTER TABLE public.perfis ADD COLUMN nivel INTEGER DEFAULT 99;

-- 2. Define a hierarquia dos papéis (Quanto menor, mais poder tem)
UPDATE public.perfis SET nivel = 0 WHERE nome = 'Super Administrador';
UPDATE public.perfis SET nivel = 10 WHERE nome = 'Administrador';
UPDATE public.perfis SET nivel = 20 WHERE nome = 'Financeiro';
UPDATE public.perfis SET nivel = 30 WHERE nome = 'Vendedor';
UPDATE public.perfis SET nivel = 30 WHERE nome = 'Marketplace';
UPDATE public.perfis SET nivel = 40 WHERE nome = 'Mecanica';
UPDATE public.perfis SET nivel = 50 WHERE nome = 'Operacional';
