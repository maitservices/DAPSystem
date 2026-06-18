app.controller('UsuariosCtrl', ['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {
    
    const SUPABASE_URL = 'https://kjmyzaiucwwcpilfslbl.supabase.co'; 
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbXl6YWl1Y3d3Y3BpbGZzbGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzAzNDAsImV4cCI6MjA5Njg0NjM0MH0._bwZdWTek859ounKggqOQ1-Xl8LdbTsyTQ8ut8MBryc';
    const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/gerir-autenticacao`;
    
    const JWT_TOKEN = localStorage.getItem('dap_token');

    const httpConfig = {
        headers: {
            'Authorization': 'Bearer ' + JWT_TOKEN,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
        }
    };

    $scope.modoFormulario = false;
    $scope.usuarioAtual = { perfis: [] };
    $scope.usuarios = [];
    $scope.listaEmpresas = [];
    
    $scope.listaPerfisOriginais = []; 
    $scope.listaPerfisFiltrados = []; 
    
    // 🛡️ PROTEÇÃO 1: Garante que o objeto existe na memória desde o milissegundo zero,
    // evitando que a tela quebre antes mesmo da API responder.
    $scope.usuarioLogado = { nivel: 99, cliente_pj_id: null }; 

    $scope.inicializar = function() {
       // 1. Carregar Perfis Seguros (Isso define o Nível do usuário)
            const resPerfis = await $http.post(`${SUPABASE_URL}/functions/v1/gerir-perfil`, {}, httpConfig);
            $scope.listaPerfisFiltrados = resPerfis?.data.dados|| [];

            // 2. Carregar Empresas (Apenas se for Super Admin - o backend validará isso)
            const resEmpresas = await $http.post(`${SUPABASE_URL}/functions/v1/gerir-clientes-pj`, { action: 'LISTAR' }, httpConfig);
            if(resEmpresas.data.sucesso) $scope.listaEmpresas = resEmpresas?.data.dados || [];
        
            $scope.carregarUsuarios(); 
        }).catch(function(err) {
            console.error("Erro ao carregar os perfis do banco:", err);
        });
    };

    $scope.carregarUsuarios = function() {
        $http.post(EDGE_FUNCTION_URL, { action: 'LISTAR' }, httpConfig)
        .then(function(res) {
            if(res.data.sucesso) {
                $scope.usuarios = res.data.dados;
                
                // 🛡️ PROTEÇÃO 2: Só atualiza os dados do logado se a API realmente os enviou
                if (res.data.callerContext) {
                    $scope.usuarioLogado = res.data.callerContext;
                }

                // Filtragem segura (agora é impossível dar erro de 'undefined')
                $scope.listaPerfisFiltrados = $scope.listaPerfisOriginais.filter(function(perfil) {
                    return perfil.nivel > $scope.usuarioLogado.nivel;
                });
            }
        }).catch(function(err) {
            console.error("Erro ao carregar usuários:", err);
            $rootScope.mostrarMensagem("Erro de conexão com o servidor de usuários.");
            
            // 🛡️ PROTEÇÃO 3: Recuo defensivo em caso de Erro 400 da API
            $scope.usuarioLogado = { nivel: 99, cliente_pj_id: null };
            $scope.listaPerfisFiltrados = [];
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

        $http.post(EDGE_FUNCTION_URL, payload, httpConfig)
            .then(function(res) {
                if(res.data.sucesso) {
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
            $http.post(EDGE_FUNCTION_URL, { action: 'EXCLUIR', dados: { id: id } }, httpConfig)
                .then(function(res) {
                    $scope.carregarUsuarios();
                    $rootScope.mostrarMensagem("Usuário removido.");
                })
                .catch(function(err) {
                    alert("Erro ao excluir: " + (err.data && err.data.erro ? err.data.erro : "Falha na comunicação"));
                });
        }
    };

    $scope.inicializar();
}]);
