app.controller('ClientePjCtrl', ['$scope', '$http', '$rootScope', function($scope, $http, $rootScope) {
    
    // Parâmetros Reais de Conexão com o Supabase
    const SUPABASE_URL = 'https://kjmyzaiucwwcpilfslbl.supabase.co'; 
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbXl6YWl1Y3d3Y3BpbGZzbGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzAzNDAsImV4cCI6MjA5Njg0NjM0MH0._bwZdWTek859ounKggqOQ1-Xl8LdbTsyTQ8ut8MBryc';
    const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/gerir-clientes-pj`;
    
    // Obtém a Identidade do Operador (Token)
    const JWT_TOKEN = localStorage.getItem('dap_token');

    // Configuração de Cabeçalho Blindado
    const httpConfig = {
        headers: {
            'Authorization': 'Bearer ' + JWT_TOKEN,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
        }
    };

    $scope.isEditing = true; 
    $scope.processando = false; // Flag para evitar duplos cliques
    $scope.cliente = {};

    $scope.habilitarEdicao = function() {
        $scope.isEditing = true;
    };

    $scope.salvarDados = function() {
        if ($scope.clienteForm.$invalid) {
            $rootScope.mostrarMensagem("Por favor, preencha todos os campos obrigatórios (*).");
            return;
        }

        $scope.processando = true; // Trava a tela

        const payload = { action: 'SALVAR', dados: $scope.cliente };
        
        $http.post(EDGE_FUNCTION_URL, payload, httpConfig)
            .then(function(response) {
                if (response.data.sucesso) {
                    // CRÍTICO: Atualiza o objeto na tela com o retorno do banco (que agora contém o 'id')
                    // Isso garante que o próximo 'Salvar' será um UPDATE e não um novo INSERT
                    $scope.cliente = response.data.dados; 
                    
                    $scope.isEditing = false;
                    $rootScope.mostrarMensagem("Empresa processada com sucesso!");
                }
            })
            .catch(function(erro) {
                var msg = erro.data && erro.data.erro ? erro.data.erro : "Falha na comunicação com a API.";
                alert("Erro ao salvar: " + msg);
            })
            .finally(function() {
                $scope.processando = false; // Libera a tela independentemente de erro ou sucesso
            });
    };
}]);
