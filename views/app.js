// Definição do Módulo principal injetando o ngRoute
var app = angular.module('DapSystemApp', ['ngRoute']);

// Configuração das Rotas SPA
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/inicio', {
            template: '<h2 class="text-2xl font-bold">Bem-vindo ao DAP System</h2><p class="mt-2 text-gray-600">Selecione uma opção no menu lateral.</p>'
        })
        .when('/cliente-pj', {
            templateUrl: 'views/cliente-pj.html',
            controller: 'ClientePjCtrl'
        })
        .otherwise({
            redirectTo: '/inicio'
        });
}]);

// Controlador Global (TopBar e Menu Utilizador)
app.controller('MainCtrl', ['$scope', '$rootScope', '$timeout', function($scope, $rootScope, $timeout) {
    $scope.isUserMenuOpen = false;
    $scope.pageTitle = "Dashboard";

    $scope.toggleUserMenu = function() {
        $scope.isUserMenuOpen = !$scope.isUserMenuOpen;
    };

    // Listener para fechar o menu ao clicar fora seria ideal aqui num cenário avançado

    // Serviço simples para mostrar mensagens globais
    $rootScope.mostrarMensagem = function(mensagem) {
        $scope.mensagemGlobal = mensagem;
        $timeout(function() {
            $scope.mensagemGlobal = "";
        }, 4000); // Esconde após 4 segundos
    };
}]);
