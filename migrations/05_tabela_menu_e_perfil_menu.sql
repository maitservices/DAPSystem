-- 1. Tabela de Menus (Módulos do Sistema)
CREATE TABLE public.menus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    rota TEXT,                 -- Caminho no AngularJS (Ex: '#!/produtos'). Nulo se for só um agrupador (Ex: Estoque)
    icone TEXT,                -- Código do ícone ou Emoji (Ex: '📦', 'fa-box')
    ordem INTEGER DEFAULT 0,   -- Define quem aparece primeiro (0, 1, 2...) na renderização
    parent_id UUID REFERENCES public.menus(id) ON DELETE CASCADE, -- Auto-relacionamento (O Segredo da Árvore)
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Relacionamento (Muitos-para-Muitos: Perfis <-> Menus)
CREATE TABLE public.perfil_menus (
    perfil_id INTEGER REFERENCES public.perfis(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES public.menus(id) ON DELETE CASCADE,
    PRIMARY KEY (perfil_id, menu_id)
);

-- 3. Blindagem de Segurança Zero Trust (RLS)
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_menus ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Leitura
-- Qualquer usuário logado pode LER o dicionário de menus (a lógica de ocultar será da nossa Edge Function)
CREATE POLICY "Leitura global de menus para autenticados" 
ON public.menus FOR SELECT 
USING (auth.role() = 'authenticated');

-- Qualquer usuário logado pode LER os relacionamentos para montar sua própria tela
CREATE POLICY "Leitura de regras de perfil para autenticados" 
ON public.perfil_menus FOR SELECT 
USING (auth.role() = 'authenticated');

-- Nota: Não criamos políticas de INSERT/UPDATE/DELETE públicas porque o gerenciamento
-- dessas tabelas será feito exclusivamente pela nossa Edge Function via SERVICE_ROLE.
