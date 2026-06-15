-- 1. Adicionar a coluna de relacionamento (Pode ser nula para os donos do sistema)
ALTER TABLE public.app_user 
ADD COLUMN cliente_pj_id UUID REFERENCES public.clientes_pj(id) ON DELETE SET NULL;

-- 2. Remover a política antiga de visualização que permitia ver apenas o próprio perfil
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.app_user;

-- 3. Nova Política Zero Trust (Multi-Tenant) para SELECT (Leitura)
-- Regra: Pode ler se for o seu próprio usuário, OU se ambos pertencerem à mesma empresa, 
-- OU se quem está lendo for dono do sistema (cliente_pj_id IS NULL)
CREATE POLICY "Isolamento de Tenant - Leitura de Usuarios" 
ON public.app_user FOR SELECT 
USING (
  id = auth.uid() 
  OR 
  cliente_pj_id = (SELECT cliente_pj_id FROM public.app_user WHERE id = auth.uid())
  OR 
  (SELECT cliente_pj_id FROM public.app_user WHERE id = auth.uid()) IS NULL
);

-- 4. Atualizar o Trigger para inserir o usuário já com o vínculo de empresa (opcional, será útil na Edge Function)
-- Esta etapa garante que a Edge Function possa enviar o cliente_pj_id no meta-dado durante a criação.
