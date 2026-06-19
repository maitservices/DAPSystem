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
            const resPerfis = await $http.post(`${SUPABASE_URL}/functions/v1/gerir-perfis`, {}, httpConfig);
            if (resPerfis.data && resPerfis.data.sucesso) {
                $scope.listaPerfisFiltrados = resPerfis.data.dados;
            } else {
                $scope.listaPerfisFiltrados = [];
            }

            // 2. Carregar Empresas
            const resEmpresas = await $http.post(`${SUPABASE_URL}/functions/v1/gerir-clientes-pj`, { action: 'LISTAR' }, httpConfig);
            if (resEmpresas.data && resEmpresas.data.sucesso) {
                $scope.listaEmpresas = resEmpresas.data.dados;
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

    $scope.togglePerfil = function(perfilId) {
        var idx = $scope.usuarioAtual.perfis.indexOf(perfilId);
        if (idx > -1) {
            $scope.usuarioAtual.perfis.splice(idx, 1);
        } else {
            $scope.usuarioAtual.perfis.push(perfilId);
        }
    };

    $scope.novoUsuario = function() {
        $scope.usuarioAtual = { enable: 'Y', perfis: [] }; 
        
        // Bloqueio seguro para PJs
        if ($scope.usuarioLogado.nivel !== 0 && $scope.usuarioLogado.cliente_pj_id) {
            $scope.usuarioAtual.cliente_pj_id = $scope.usuarioLogado.cliente_pj_id;
        }

        $scope.modoFormulario = true;
    };

    $scope.editarUsuario = function(user) {
        var perfisIds = user.app_user_perfis ? user.app_user_perfis.map(p => p.perfis.id) : [];

        $scope.usuarioAtual = angular.copy({
            id: user.id,
            email: user.login,
            enable: user.enable,
            cliente_pj_id: user.cliente_pj_id,
            perfis: perfisIds
        });
        
        $scope.modoFormulario = true;
    };

    $scope.voltarLista = function() {
        $scope.modoFormulario = false;
        $scope.usuarioAtual = { perfis: [] };
    };

    $scope.salvarUsuario = function() {
        if ($scope.userForm.$invalid) {
            alert("Preencha os campos obrigatórios.");
            return;
        }

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
                alert("Erro: " + (err.data && err.data.erro ? err.data.erro : "Falha na comunicação"));
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
