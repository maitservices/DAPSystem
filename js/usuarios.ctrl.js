app.controller('UsuariosCtrl', ['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {
    $scope.$parent.pageTitle = "Configurações > Usuários";

    // URLs e Configurações da API
    const SUPABASE_URL = 'https://kjmyzaiucwwcpilfslbl.supabase.co'; 
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbXl6YWl1Y3d3Y3BpbGZzbGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzAzNDAsImV4cCI6MjA5Njg0NjM0MH0._bwZdWTek859ounKggqOQ1-Xl8LdbTsyTQ8ut8MBryc';
    const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/gerir-autenticacao`;
    
    // Obtém o token real do usuário salvo no login
    const JWT_TOKEN = localStorage.getItem('dap_token');

    // Configuração do cabeçalho com o Token Zero Trust
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
    $scope.listaPerfis = [];
    $scope.usuarioLogado = {}; 

    // ==========================================
    // INICIALIZAÇÃO: Buscar dados reais
    // ==========================================
    $scope.inicializar = function() {
        // 1. Descobre quem é o utilizador logado decodificando o JWT (básico) ou consultando a API
        // Em produção, isso pode vir do login e ficar no $rootScope.
        
        // 2. Carrega a lista de Perfis (Usando a API REST do Supabase direto, pois é só leitura pública/autenticada)
        $http.get(`${SUPABASE_URL}/rest/v1/perfis?select=*`, httpConfig).then(function(res) {
            $scope.listaPerfis = res.data;
        });

        // 3. Carrega a lista de Empresas (Para o combobox de Super Admins)
        $http.get(`${SUPABASE_URL}/rest/v1/clientes_pj?select=id,razao_social,cnpj`, httpConfig).then(function(res) {
            $scope.listaEmpresas = res.data;
        }).catch(function() { 
            // Se falhar por RLS, significa que o usuário não é Dono do Sistema, o que é seguro ignorar.
        });

        // 4. Carrega os Usuários chamando a Edge Function
        $scope.carregarUsuarios();
    };

    $scope.carregarUsuarios = function() {
        $http.post(EDGE_FUNCTION_URL, { action: 'LISTAR' }, httpConfig)
        .then(function(res) {
            if(res.data.sucesso) {
                $scope.usuarios = res.data.dados;
            }
        }).catch(function(err) {
            console.error("Erro ao carregar usuários:", err);
            $rootScope.mostrarMensagem("Erro de conexão com o servidor.");
        });
    };

    // ==========================================
    // CONTROLES DE INTERFACE E CRUD
    // ==========================================

    // Lógica para marcar/desmarcar checkboxes de múltiplos perfis
    $scope.togglePerfil = function(perfilId) {
        var idx = $scope.usuarioAtual.perfis.indexOf(perfilId);
        if (idx > -1) {
            $scope.usuarioAtual.perfis.splice(idx, 1); // Remove
        } else {
            $scope.usuarioAtual.perfis.push(perfilId); // Adiciona
        }
    };

    $scope.novoUsuario = function() {
        $scope.usuarioAtual = { enable: 'Y', perfis: [] }; 
        $scope.modoFormulario = true;
    };

    $scope.editarUsuario = function(user) {
        // Extrai apenas os IDs dos perfis a partir do retorno aninhado da API
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

    // Arranque
    $scope.inicializar();
}]);
