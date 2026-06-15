var app = angular.module('LoginApp', []);

app.controller('LoginCtrl', ['$scope', '$timeout', function($scope, $timeout) {
    
    $scope.credenciais = { email: '', password: '' };
    $scope.mostrarSenha = false;
    $scope.processando = false;
    
    // Objeto para gerir o estado visual da força da senha
    $scope.forcaSenha = {
        pontuacao: 0,
        percentual: 0,
        corClasses: 'bg-red-500',
        textoCor: 'text-red-500',
        mensagem: 'Muito fraca'
    };

    // Função avaliadora de segurança da senha
    $scope.avaliarForcaSenha = function() {
        var pw = $scope.credenciais.password;
        var pontuacao = 0;

        if (!pw) {
            $scope.forcaSenha.percentual = 0;
            return;
        }

        // Regras de negócio para pontuação (Máx 4)
        if (pw.length >= 8) pontuacao++; // Comprimento
        if (/[A-Z]/.test(pw)) pontuacao++; // Maiúscula
        if (/[0-9]/.test(pw)) pontuacao++; // Número
        if (/[^A-Za-z0-9]/.test(pw)) pontuacao++; // Símbolo Especial

        $scope.forcaSenha.pontuacao = pontuacao;

        // Mapeamento de Pontuação para UI (Tailwind)
        switch(pontuacao) {
            case 0:
            case 1:
                $scope.forcaSenha.percentual = 25;
                $scope.forcaSenha.corClasses = 'bg-red-500';
                $scope.forcaSenha.textoCor = 'text-red-500';
                $scope.forcaSenha.mensagem = 'Fraca';
                break;
            case 2:
                $scope.forcaSenha.percentual = 50;
                $scope.forcaSenha.corClasses = 'bg-yellow-500';
                $scope.forcaSenha.textoCor = 'text-yellow-600';
                $scope.forcaSenha.mensagem = 'Razoável';
                break;
            case 3:
                $scope.forcaSenha.percentual = 75;
                $scope.forcaSenha.corClasses = 'bg-blue-500';
                $scope.forcaSenha.textoCor = 'text-blue-600';
                $scope.forcaSenha.mensagem = 'Boa';
                break;
            case 4:
                $scope.forcaSenha.percentual = 100;
                $scope.forcaSenha.corClasses = 'bg-green-500';
                $scope.forcaSenha.textoCor = 'text-green-600';
                $scope.forcaSenha.mensagem = 'Forte!';
                break;
        }
    };

    $scope.autenticar = function() {
        if ($scope.loginForm.$invalid) return;

        $scope.processando = true;

        // Aqui, futuramente, ocorrerá o POST para o Supabase Auth com o token Anti-Bot
        // e se validado com sucesso, armazenamos o JWT e redirecionamos para o index.html
        
        $timeout(function() {
            // Mock de redirecionamento em caso de sucesso
            window.location.href = "index.html#!/inicio";
        }, 1500);
    };

}]);
