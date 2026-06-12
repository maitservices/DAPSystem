app.controller('ClientePjCtrl', ['$scope', '$http', '$rootScope', function($scope, $http, $rootScope) {
    // Altera o título da página (Topbar)
    $scope.$parent.pageTitle = "Catálogo > Cadastro Cliente PJ";

    // O estado inicial é edição verdadeira para poder preencher um novo registo
    $scope.isEditing = true; 
    
    // Objeto que armazena os dados
    $scope.cliente = {};

    // Função para habilitar os campos
    $scope.habilitarEdicao = function() {
        $scope.isEditing = true;
    };

    // Função para gravar os dados
    $scope.salvarDados = function() {
        if ($scope.clienteForm.$invalid) {
            alert("Por favor, preencha todos os campos obrigatórios (*).");
            return;
        }

        // LÓGICA DE INTEGRAÇÃO FUTURA COM SUPABASE EDGE FUNCTION
        /*
        const config = {
            headers: {
                'Authorization': 'Bearer SEU_FUTURO_JWT',
                'Content-Type': 'application/json'
            }
        };
        const payload = { action: 'SALVAR', dados: $scope.cliente };
        
        $http.post('https://seu-projeto-supabase.supabase.co/functions/v1/gerir-clientes-pj', payload, config)
            .then(function(response) {
                // Sucesso
                $scope.isEditing = false;
                $rootScope.mostrarMensagem("Processado com Sucesso.");
            })
            .catch(function(erro) {
                alert("Erro ao salvar: " + erro.data.message);
            });
        */

        // SIMULAÇÃO LOCAL (Mock) do processamento pedido
        console.log("Dados enviados para a API: ", $scope.cliente);
        
        // Bloqueia a edição após salvar (os dados mantêm-se no scope/ecrã)
        $scope.isEditing = false; 
        
        // Dispara a mensagem de sucesso na barra global
        $rootScope.mostrarMensagem("Processado com Sucesso.");
    };
}]);
