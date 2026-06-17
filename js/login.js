var app = angular.module('LoginApp', []);

app.controller('LoginCtrl', ['$scope', '$window', '$timeout', '$http', function($scope, $window, $timeout, $http) {
    
    // Parâmetros Homologados de Conexão com o Supabase
    const SUPABASE_URL = 'https://kjmyzaiucwwcpilfslbl.supabase.co'; 
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbXl6YWl1Y3d3Y3BpbGZzbGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzAzNDAsImV4cCI6MjA5Njg0NjM0MH0._bwZdWTek859ounKggqOQ1-Xl8LdbTsyTQ8ut8MBryc';
    
    // Estado do Formulário
    $scope.credenciais = { email: '', password: '' };
    $scope.processando = false;
    $scope.mensagemErro = "";
    $scope.botVerificado = false; 
    $scope.captchaToken = "";

    // Mapeamento Global para o Widget do Anti-Robô interagir com o ciclo do Angular
    $window.captchaVerificado = function(token) {
        $scope.$apply(function() {
            $scope.botVerificado = true;
            $scope.captchaToken = token;
            console.log("Validação anti-robô efetuada com sucesso.");
        });
    };

    /**
     * Limpa todos os campos e reseta estados de erro do formulário
     */
    $scope.limpar = function() {
        $scope.credenciais = { email: '', password: '' };
        $scope.mensagemErro = "";
        $scope.processando = false;
        
        // Reseta o estado do validador de robôs se ele já estiver carregado em tela
        $scope.botVerificado = false;
        $scope.captchaToken = "";
        if (typeof turnstile !== 'undefined') {
            turnstile.reset();
        }
    };

    /**
     * Envia as credenciais para o endpoint nativo do Supabase Auth GoTrue
     */
    $scope.autenticar = function() {
        if ($scope.loginForm.$invalid || !$scope.botVerificado) return;

        $scope.processando = true;
        $scope.mensagemErro = "";

        // Endpoint de geração de token por senha padrão OAuth2/GoTrue
        const authEndpoint = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;

        const requestConfig = {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
        };

        const payload = {
            email: $scope.credenciais.email,
            password: $scope.credenciais.password
            // No futuro, se configurado no Supabase, adicionamos o token do captcha aqui: options: { captchaToken: $scope.captchaToken }
        };

        $http.post(authEndpoint, payload, requestConfig)
            .then(function(response) {
                // Sucesso na Autenticação
                if (response.data && response.data.access_token) {
                    // Armazena o JWT real gerado pelo ecossistema
                    localStorage.setItem('dap_token', response.data.access_token);
                    
                    // Redirecionamento limpo para o Dashboard na view padrão de início
                    $window.location.href = 'index.html#!/inicio';
                } else {
                    $scope.tratarFalha("Resposta inválida do servidor.");
                }
            })
            .catch(function(error) {
                // Tratamento semântico de erros retornados pela API
                var erroDescricao = "Falha ao conectar com o servidor de autenticação.";
                if (error.data && error.data.error_description) {
                    erroDescricao = error.data.error_description;
                } else if (error.data && error.data.msg) {
                    erroDescricao = error.data.msg;
                }
                
                // Tradução amigável para mensagens padrão em inglês do Supabase
                if (erroDescricao.includes("Invalid login credentials")) {
                    erroDescricao = "E-mail ou senha incorretos. Verifique suas credenciais.";
                }

                $scope.tratarFalha(erroDescricao);
            });
    };

    /**
     * Centraliza a reversão do estado visual em caso de erro
     */
    $scope.tratarFalha = function(mensagem) {
        $scope.mensagemErro = mensagem;
        $scope.processando = false;
        $scope.botVerificado = false;
        
        // Força novo desafio contra bots por segurança
        if (typeof turnstile !== 'undefined') {
            turnstile.reset();
        }
    };

    /**
     * Redirecionamento lógico para a funcionalidade futura de recuperação
     */
    $scope.esqueciSenha = function() {
        alert("O módulo de recuperação de senha será integrado na próxima sprint.");
    };

}]);
