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
    
    // Agora mantemos o histórico original e uma lista filtrada para os checkboxes
    $scope.listaPerfisOriginais = []; 
    $scope.listaPerfisFiltrados = []; 
    
    $scope.usuarioLogado = {}; 

    $scope.inicializar = function() {
        
        // 1. Carrega a lista de Empresas (Pode rodar em paralelo)
        $http.get(`${SUPABASE_URL}/rest/v1/clientes_pj?select=id,razao_social,cnpj`, httpConfig).then(function(res) {
            $scope.listaEmpresas = res.data;
        }).catch(function() {}); 

        // 2. Carrega a lista de Perfis primeiro...
        $http.get(`${SUPABASE_URL}/rest/v1/perfis?select=*`, httpConfig).then(function(res) {
            $scope.listaPerfisOriginais = res.data;
            
            // 3. CRÍTICO: Só chama os usuários DEPOIS que os perfis já estão na memória!
            // Isso resolve a "Condição de Corrida".
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
                
                // CRÍTICO: Garante que nunca é 'undefined', protegendo o filtro de causar um TypeError no Javascript
                $scope.usuarioLogado = res.data.callerContext || { nivel: 99, cliente_pj_id: null };

                // Dinamismo: Monta os Checkboxes apenas com papéis inferiores ao do usuário logado
                $scope.listaPerfisFiltrados = $scope.listaPerfisOriginais.filter(function(perfil) {
                    return perfil.nivel > $scope.usuarioLogado.nivel;
                });
            }
        }).catch(function(err) {
            // Garante inicialização vazia e segura em caso de erro 400
            $scope.usuarioLogado = { nivel: 99, cliente_pj_id: null };
            $scope.listaPerfisFiltrados = [];
            
            // Exibe o log para auditoria
            console.error("Erro detalhado do servidor:", err.data ? err.data.erro : err);
            $rootScope.mostrarMensagem("Erro de conexão com o servidor. Acesso restrito.");
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
        
        // Se o criador tiver empresa, tranca o select na empresa dele.
        // Se for nulo (Super Admin), deixamos o campo livre (undefined)
        if ($scope.usuarioLogado.cliente_pj_id !== null) {
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
                alert("Erro: " + (err.data.erro || "Falha na comunicação"));
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
                    alert("Erro ao excluir: " + (err.data.erro || "Falha na comunicação"));
                });
        }
    };

    $scope.inicializar();
}]);
