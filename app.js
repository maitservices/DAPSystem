var app = angular.module('DapSystemApp', ['ngRoute']);

// ==========================================
// 1. DIRETIVAS CUSTOMIZADAS (Seu código intacto)
// ==========================================
app.directive('cnpjMask', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
            ctrl.$parsers.push(function(value) {
                if (!value) return '';
                var clean = value.replace(/[^0-9]/g, '');
                var formatted = clean;
                if (clean.length > 2) formatted = clean.replace(/^(\d{2})(\d)/, '$1.$2');
                if (clean.length > 5) formatted = formatted.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                if (clean.length > 8) formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4');
                if (clean.length > 12) formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
                if (clean.length >= 14) formatted = formatted.substring(0, 18);
                if (formatted !== value) {
                    ctrl.$setViewValue(formatted);
                    ctrl.$render();
                }
                return formatted;
            });
        }
    };
});

// ==========================================
// 2. SEGURANÇA REATIVA: Interceptor HTTP
// ==========================================
// Ouve TODAS as respostas da API. Se qualquer módulo devolver 401 (Expirado/Inválido), expulsa o utilizador.
app.factory('AuthInterceptor', ['$q', '$window', function($q, $window) {
    return {
        responseError: function(rejection) {
            if (rejection.status === 401 || rejection.status === 403) {
                console.warn("Acesso negado pela API. Sessão inválida ou expirada.");
                localStorage.removeItem('dap_token');
                $window.location.href = 'login.html';
            }
            return $q.reject(rejection);
        }
    };
}]);

// ==========================================
// 3. CONFIGURAÇÕES: Rotas e Interceptores
// ==========================================
app.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
    
    // Ativa o Interceptor de Segurança
    $httpProvider.interceptors.push('AuthInterceptor');

    $routeProvider
        .when('/inicio', {
            template: '<div class="bg-white p-8 rounded-lg shadow-sm border border-gray-200"><h2 class="text-2xl font-bold text-gray-800">Visão Geral</h2><p class="mt-2 text-gray-600">Bem-vindo ao DAP System. Utilize o menu lateral para navegar pelos módulos disponíveis para o seu perfil.</p></div>',
            title: 'Início'
        })
        .when('/cliente-pj', { 
            templateUrl: 'views/cliente-pj.html', 
            controller: 'ClientePjCtrl',
            title: 'Administração > Empresa'
        })
        .when('/usuarios', { 
            templateUrl: 'views/usuarios.html', 
            controller: 'UsuariosCtrl',
            title: 'Sistema > Usuários'
        })
        .when('/venda-simples', { 
            templateUrl: 'views/venda-simples.html', 
            controller: 'VendaSimplesCtrl',
            title: 'Vendas > Vendas Simples'
        })
        .otherwise({ redirectTo: '/inicio' });
}]);

// ==========================================
// 4. SEGURANÇA PROATIVA E EVENTOS GLOBAIS (Run Block)
// ==========================================
// O bloco 'run' executa antes da aplicação desenhar o ecrã. Movido o listener do Breadcrumb para cá.
app.run(['$rootScope', '$window', function($rootScope, $window) {
    
    // A. Guarda de Rotas: Valida o Token antes de trocar de página no menu
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        const token = localStorage.getItem('dap_token');
        
        if (!token) {
            $window.location.href = 'login.html';
            return;
        }

        try {
            // Verifica a data de expiração (exp) dentro do JWT
            const payload = JSON.parse(atob(token.split('.')[1]));
            const tempoAtualEmSegundos = Math.floor(Date.now() / 1000);
            
            if (payload.exp && tempoAtualEmSegundos >= payload.exp) {
                console.warn("Sessão expirada por tempo. Por favor, faça login novamente.");
                localStorage.removeItem('dap_token');
                $window.location.href = 'login.html';
                event.preventDefault(); // Trava a tentativa de abrir a página
            }
        } catch (e) {
            localStorage.removeItem('dap_token');
            $window.location.href = 'login.html';
        }
    });

    // B. Caminho de Pão (Breadcrumbs): Atualiza o título dinamicamente após a rota carregar com sucesso
    $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
        if (current.$$route && current.$$route.title) {
            $rootScope.pageTitle = current.$$route.title;
        } else {
            $rootScope.pageTitle = "Dashboard";
        }
    });
}]);

// ==========================================
// 5. CONTROLADOR GLOBAL (Regras de Interface)
// ==========================================
app.controller('MainCtrl', ['$scope', '$rootScope', '$timeout', '$http', '$window', function($scope, $rootScope, $timeout, $http, $window) {
    
    const SUPABASE_URL = 'https://kjmyzaiucwwcpilfslbl.supabase.co'; 
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbXl6YWl1Y3d3Y3BpbGZzbGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzAzNDAsImV4cCI6MjA5Njg0NjM0MH0._bwZdWTek859ounKggqOQ1-Xl8LdbTsyTQ8ut8MBryc';
    
    $scope.isUserMenuOpen = false;
    $scope.menusDinamicos = [];
    $scope.usuarioLogado = "Carregando...";

    const token = localStorage.getItem('dap_token');

    // Decodifica apenas para UI (A segurança pesada agora está no app.run)
    try {
        if (token) {
            const payloadBase64 = token.split('.')[1];
            const payloadDecoded = JSON.parse(atob(payloadBase64));
            $scope.usuarioLogado = payloadDecoded.email;
        }
    } catch (e) {
        $scope.usuarioLogado = "Operador";
    }

    const httpConfig = {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
        }
    };

    $scope.carregarMenus = function() {
        if (!token) return; // Trava a execução se não houver token (evita erros no console)
        
        $http.post(`${SUPABASE_URL}/functions/v1/gerir-menus`, {}, httpConfig)
            .then(function(response) {
                if(response.data.sucesso) {
                    $scope.menusDinamicos = response.data.arvore;
                }
            })
            .catch(function(error) {
                // Apenas exibe no log. Se for erro de sessão (401), o Interceptor Global já terá forçado o logout.
                console.error("Erro ao carregar permissões:", error);
            });
    };

    $scope.toggleMenuLateral = function(menu) {
        if (!menu.rota) {
            menu.isOpen = !menu.isOpen;
        }
    };

    $scope.toggleUserMenu = function() {
        $scope.isUserMenuOpen = !$scope.isUserMenuOpen;
    };

    $scope.logout = function() {
        localStorage.removeItem('dap_token');
        $window.location.href = 'login.html';
    };

    $rootScope.mostrarMensagem = function(mensagem) {
        $scope.mensagemGlobal = mensagem;
        $timeout(function() { $scope.mensagemGlobal = ""; }, 4000);
    };

    // Inicializa a interface global
    $scope.carregarMenus();
}]);
