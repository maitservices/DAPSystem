-- 1. Tabela de Perfis (Papéis disponíveis no sistema)
CREATE TABLE public.perfis (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT
);

-- Inserindo os papéis base solicitados
INSERT INTO public.perfis (nome) VALUES 
('Vendedor'), ('Marketplace'), ('Administrador'), ('Financeiro'), 
('Mecanica'), ('Operacional'), ('Super Administrador');

-- 2. Tabela de Relacionamento (Muitos-para-Muitos)
CREATE TABLE public.app_user_perfis (
    user_id UUID REFERENCES public.app_user(id) ON DELETE CASCADE,
    perfil_id INTEGER REFERENCES public.perfis(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, perfil_id)
);

-- 3. Atualização do Trigger: Lendo o cliente_pj_id do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  v_cliente_pj_id UUID;
BEGIN
  -- Tenta extrair o cliente_pj_id do meta-dado (se existir e não for vazio)
  IF new.raw_user_meta_data->>'cliente_pj_id' IS NOT NULL AND new.raw_user_meta_data->>'cliente_pj_id' != '' THEN
    v_cliente_pj_id := (new.raw_user_meta_data->>'cliente_pj_id')::uuid;
  ELSE
    v_cliente_pj_id := NULL;
  END IF;

  INSERT INTO public.app_user (id, login, enable, cliente_pj_id)
  VALUES (new.id, new.email, 'Y', v_cliente_pj_id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
