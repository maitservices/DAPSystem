app.controller('UsuariosCtrl', ['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {
    const SUPABASE_URL = 'https://kjmyzaiucwwcpilfslbl.supabase.co'; 
    const JWT_TOKEN = localStorage.getItem('dap_token');
    
    // Config global das chamadas
    const httpConfig = {
        headers: {
            'Authorization': 'Bearer ' + JWT_TOKEN,
            'Content-Type': 'application/json'
        }
    };

    // Estados iniciais blindados
    $scope.modoFormulario = false;
    $scope.usuarioAtual = { perfis: [] };
    $scope.usuarios = [];
    $scope.listaEmpresas = [];
    $scope.listaPerfisOriginais = []; 
    $scope.listaPerfisFiltrados = []; 
    $scope.usuarioLogado = { nivel: 99, cliente_pj_id: null }; 

    $scope.inicializar = async function() {
        try {
            // 1. Carregar Perfis
            const resPerfis = await $http.post(`${SUPABASE_URL}/functions/v1/gerir-perfil`, {}, httpConfig);
            if (resPerfis.data && resPerfis.data.sucesso) {
                $scope.listaPerfisFiltrados = resPerfis.data.dados;
            } else {
                $scope.listaPerfisFiltrados = [];
            }

            // 2. Carregar Empresas
            const resEmpresas = await $http.post(`${SUPABASE_URL}/functions/v1/gerir-clientes-pj`, { action: 'LISTAR' }, httpConfig);
            if (resEmpresas.data && resEmpresas.data.sucesso) {
                $scope.listaEmpresas = resEmpresas.data.dados;
                if($scope.listaEmpresas.length==1){
                    $scope.usuarioLogado.cliente_pj_id=$scope.listaEmpresas[0].id;
                }
            } else {
                $scope.listaEmpresas = [];
            }

            // 3. Carrega Utilizadores
            $scope.carregarUsuarios();

        } catch (err) {
            console.error("Erro na inicialização:", err);
            // Recupera caso a API falhe, não deixando a tela travada
            $scope.listaEmpresas = [];
            $scope.listaPerfisFiltrados = [];
        }
    };

    $scope.carregarUsuarios = function() {
        $http.post(`${SUPABASE_URL}/functions/v1/gerir-autenticacao`, { action: 'LISTAR' }, httpConfig)
        .then(function(res) {
            if(res.data && res.data.sucesso) {
                $scope.usuarios = res.data.dados || [];
                
                if (res.data.callerContext) {
                    $scope.usuarioLogado = res.data.callerContext;
                }
            }
        }).catch(function(err) {
            console.error("Erro ao carregar usuários:", err);
            $scope.usuarios = [];
            $scope.usuarioLogado = { nivel: 99, cliente_pj_id: null };
            $rootScope.mostrarMensagem("Erro de comunicação ao listar usuários.");
        });
    };

    // ========================================================
    // AÇÃO: Preparar Escopo para Novo Usuário (Ajustado)
    // ========================================================
    $scope.novoUsuario = function() {
        // 1. Inicializa o objeto com o status Ativo ('Y') e array de perfis vazio
        $scope.usuarioAtual = { 
            enable: 'Y', 
            perfis: [] 
        }; 
        
        // 2. REGRA DE UX SELECIONADA: Se quem está operando possui um vínculo empresarial,
        // nós pré-selecionamos automaticamente a mesma empresa dele no formulário.
        // Removemos a barreira de nível para permitir que até o Super Admin desfrute do auto-complete
        // se ele tiver uma empresa padrão definida em seu perfil.
        if ($scope.usuarioLogado && $scope.usuarioLogado.cliente_pj_id) {
            $scope.usuarioAtual.cliente_pj_id = $scope.usuarioLogado.cliente_pj_id;
        } else {
            // Fallback explícito: Garante que inicia limpo se for um admin sem empresa
            $scope.usuarioAtual.cliente_pj_id = ""; 
        }

        // 3. Força a abertura da view do formulário (Destrói a tabela no DOM via ng-if)
        $scope.modoFormulario = true;

        // 4. GARANTIA DE MOTOR: Comunica ao AngularJS que o modelo foi alterado programaticamente.
        // Isso evita problemas de delay assíncrono e força o <select> a renderizar o texto da empresa na hora.
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };

    $scope.editarUsuario = function(user) {
        // LÓGICA DE NEGÓCIO ATUALIZADA: 1 Usuário = 1 Papel de Acesso
        // Extraímos com segurança apenas o ID do primeiro perfil (se existir).
        var perfilPrincipalId = (user.app_user_perfis && user.app_user_perfis.length > 0) 
            ? user.app_user_perfis[0].perfis.id 
            : null;

        $scope.usuarioAtual = angular.copy({
            id: user.id,
            email: user.login,
            enable: user.enable,
            cliente_pj_id: user.cliente_pj_id,
            // Inicializamos o array com o perfil único para que o ng-model="usuarioAtual.perfis[0]"
            // leia e preencha o <select> automaticamente no front-end.
            perfis: perfilPrincipalId ? [perfilPrincipalId] : []
        });
        
        $scope.modoFormulario = true;
    };

    $scope.voltarLista = function() {
        $scope.modoFormulario = false;
        $scope.usuarioAtual = { perfis: [] };
    };

    $scope.salvarUsuario = function() {
        // 🛡️ CORREÇÃO: Verificação segura para evitar o erro Cannot read properties of undefined
        // Se o formulário não estiver mapeado no scope, ignoramos a validação de forma segura.
        if ($scope.userForm && $scope.userForm.$invalid) {
            alert("Preencha os campos obrigatórios.");
            return;
        }

        //$scope.usuarioAtual.perfis.push(perfilId);

        var payload = {
            action: $scope.usuarioAtual.id ? 'ATUALIZAR' : 'CRIAR',
            dados: $scope.usuarioAtual
        };

        $http.post(`${SUPABASE_URL}/functions/v1/gerir-autenticacao`, payload, httpConfig)
            .then(function(res) {
                if(res.data && res.data.sucesso) {
                    $scope.voltarLista();
                    $scope.carregarUsuarios();
                    $rootScope.mostrarMensagem("Operação realizada com sucesso!");
                }
            })
            .catch(function(err) {
                alert("Erro: " + (err.data && err.data.erro ? err.data.erro : "Falha na comunicação com o servidor."));
            });
    };

    $scope.excluirUsuario = function(id) {
        if (confirm("Tem certeza que deseja excluir permanentemente este usuário?")) {
            $http.post(`${SUPABASE_URL}/functions/v1/gerir-autenticacao`, { action: 'EXCLUIR', dados: { id: id } }, httpConfig)
                .then(function(res) {
                    if (res.data && res.data.sucesso) {
                        $scope.carregarUsuarios();
                        $rootScope.mostrarMensagem("Usuário removido.");
                    }
                })
                .catch(function(err) {
                    alert("Erro ao excluir: " + (err.data && err.data.erro ? err.data.erro : "Falha na comunicação"));
                });
        }
    };

    // Inicia a cadeia de eventos
    $scope.inicializar();
}]);
