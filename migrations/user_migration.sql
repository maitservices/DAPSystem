-- 1. Criação da tabela app_user no esquema público
CREATE TABLE public.app_user (
    -- O ID deve ser exatamente o mesmo ID gerado pelo Supabase Auth
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    login TEXT UNIQUE NOT NULL,
    -- Usando 'Y' ou 'N' conforme solicitado para controle de acesso
    enable CHAR(1) DEFAULT 'Y' CHECK (enable IN ('Y', 'N')), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS (Row Level Security) - Zero Trust
ALTER TABLE public.app_user ENABLE ROW LEVEL SECURITY;

-- 3. Criar Política: O usuário logado só pode ver os seus próprios dados de perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.app_user FOR SELECT 
USING ( auth.uid() = id );

-- 4. Função que será disparada pelo Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Insere na app_user o ID gerado pelo Auth e usa o email como login inicial
  INSERT INTO public.app_user (id, login, enable)
  VALUES (new.id, new.email, 'Y');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger: Dispara a função acima sempre que um usuário é inserido em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
