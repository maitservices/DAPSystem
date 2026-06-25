app.controller('VendaSimplesCtrl', ['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {
    
    const SUPABASE_URL = 'https://kjmyzaiucwwcpilfslbl.supabase.co'; 
    const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/vendas_manager`;
    const JWT_TOKEN = localStorage.getItem('dap_token');

    const httpConfig = {
        headers: {
            'Authorization': 'Bearer ' + JWT_TOKEN,
            'Content-Type': 'application/json'
        }
    };

    // Variáveis de Estado
    $scope.vendas = [];
    $scope.usuarioLogado = { nivel: 99 }; // Fallback inicial seguro
    
    // Controles do Modal
    $scope.showModal = false;
    $scope.modoVisualizacao = false;
    $scope.vendaAtual = {};

    // Filtros de Busca
    $scope.filtros = {
        descricao: '',
        data_inicio: '',
        data_fim: ''
    };

    // ========================================================
    // AÇÃO: Listar Vendas (Atende à Regra 1)
    // ========================================================
    $scope.listarVendas = function() {
        var payload = {
            action: 'LISTAR',
            filtros: $scope.filtros
        };

        $http.post(EDGE_FUNCTION_URL, payload, httpConfig)
            .then(function(res) {
                if (res.data && res.data.sucesso) {
                    $scope.vendas = res.data.dados || [];
                    
                    // Recebe o contexto de autorização da Edge Function
                    // Nível <= 1 atende à Regra 2 (Administradores)
                    if (res.data.callerContext) {
                        $scope.usuarioLogado = res.data.callerContext;
                    }
                }
            })
            .catch(function(err) {
                console.error("Erro ao carregar vendas:", err);
                $rootScope.mostrarMensagem("Erro ao carregar a listagem de vendas.");
                $scope.vendas = [];
            });
    };

    // ========================================================
    // CONTROLES DO MODAL (Atende à Regra 3)
    // ========================================================
    $scope.abrirModalNova = function() {
        // Regra 5: Dados automáticos (data, cliente_pj_id, etc.) NÃO são preenchidos no front.
        $scope.vendaAtual = {};
        $scope.modoVisualizacao = false;
        $scope.showModal = true;
    };

    $scope.abrirModalEditar = function(venda) {
        $scope.vendaAtual = angular.copy(venda);
        $scope.modoVisualizacao = false;
        $scope.showModal = true;
    };

    $scope.abrirModalVisualizar = function(venda) {
        $scope.vendaAtual = angular.copy(venda);
        $scope.modoVisualizacao = true; // Trava os campos
        $scope.showModal = true;
    };

    $scope.fecharModal = function() {
        $scope.showModal = false;
        $scope.vendaAtual = {};
    };

    // ========================================================
    // AÇÃO: Salvar Venda (Atende à Regra 4)
    // ========================================================
    $scope.salvarVenda = function() {
        if ($scope.vendaForm && $scope.vendaForm.$invalid) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        var payload = {
            action: 'SALVAR',
            dados: $scope.vendaAtual
        };

        $http.post(EDGE_FUNCTION_URL, payload, httpConfig)
            .then(function(res) {
                if(res.data && res.data.sucesso) {
                    $scope.fecharModal();
                    $scope.listarVendas(); // Atualiza a lista automaticamente
                    $rootScope.mostrarMensagem("Venda registrada com sucesso!");
                }
            })
            .catch(function(err) {
                alert("Erro ao gravar: " + (err.data && err.data.erro ? err.data.erro : "Falha na comunicação."));
            });
    };

    // Inicializa a tela disparando a primeira busca
    $scope.listarVendas();
}]);
