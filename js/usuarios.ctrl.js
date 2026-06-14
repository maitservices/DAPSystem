app.controller('UsuariosCtrl', ['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {
    // Título no Topbar
    $scope.$parent.pageTitle = "Configurações > Usuários";

    // Controle de estado da tela
    $scope.modoFormulario = false;
    $scope.usuarioAtual = {};
    
    // Dados simulados para testar no GitHub Pages
    $scope.usuarios = [
        { id: '1a2b3c', login: 'admin@dapsystem.com', enable: 'Y', created_at: new Date().toISOString() },
        { id: '4d5e6f', login: 'operador@dapsystem.com', enable: 'N', created_at: new Date().toISOString() }
    ];

    // ==========================================
    // FUNÇÕES DE INTEGRAÇÃO (Preparadas para API)
    // ==========================================

    $scope.carregarUsuarios = function() {
        // Lógica futura API:
        /*
        $http.post('URL_DA_EDGE_FUNCTION', { action: 'LISTAR' }).then(function(res) {
            $scope.usuarios = res.data.dados;
        });
        */
    };

    // ==========================================
    // CONTROLES DE INTERFACE E CRUD (MOCK LOCAL)
    // ==========================================

    $scope.novoUsuario = function() {
        $scope.usuarioAtual = { enable: 'Y' }; // Reseta o form com status padrão 'Y'
        $scope.modoFormulario = true;
    };

    $scope.editarUsuario = function(user) {
        // Faz uma cópia para não alterar a tabela antes de salvar
        $scope.usuarioAtual = angular.copy({
            id: user.id,
            email: user.login, // Na edição, o login é mapeado para o campo email
            enable: user.enable
        });
        $scope.modoFormulario = true;
    };

    $scope.voltarLista = function() {
        $scope.modoFormulario = false;
        $scope.usuarioAtual = {};
    };

    $scope.salvarUsuario = function() {
        if ($scope.usuarioAtual.id) {
            // ATUALIZAR STATUS (Mock)
            var index = $scope.usuarios.findIndex(u => u.id === $scope.usuarioAtual.id);
            if(index !== -1) {
                $scope.usuarios[index].enable = $scope.usuarioAtual.enable;
            }
            $rootScope.mostrarMensagem("Status atualizado com sucesso!");
        } else {
            // CRIAR NOVO (Mock)
            var novoMock = {
                id: Math.random().toString(36).substr(2, 9), // ID falso
                login: $scope.usuarioAtual.email,
                enable: $scope.usuarioAtual.enable,
                created_at: new Date().toISOString()
            };
            $scope.usuarios.unshift(novoMock); // Adiciona no topo da lista
            $rootScope.mostrarMensagem("Usuário criado com sucesso!");
        }

        // Simulação API Edge Function (Futuro):
        /*
        var action = $scope.usuarioAtual.id ? 'ATUALIZAR' : 'CRIAR';
        $http.post('URL_DA_EDGE_FUNCTION', { action: action, dados: $scope.usuarioAtual })
            .then(function() {
                $scope.carregarUsuarios();
                $rootScope.mostrarMensagem("Processado com Sucesso.");
            });
        */

        $scope.voltarLista();
    };

    $scope.excluirUsuario = function(id) {
        if (confirm("Tem a certeza que deseja excluir este usuário permanentemente?")) {
            // EXCLUIR (Mock)
            $scope.usuarios = $scope.usuarios.filter(u => u.id !== id);
            $rootScope.mostrarMensagem("Usuário excluído.");

            // Simulação API:
            /*
            $http.post('URL_DA_EDGE_FUNCTION', { action: 'EXCLUIR', dados: { id: id } })
                .then(function() { $scope.carregarUsuarios(); });
            */
        }
    };

    // Inicialização
    $scope.carregarUsuarios();
}]);
