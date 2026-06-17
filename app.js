var app = angular.module('DapSystemApp', ['ngRoute']);

// Diretiva Customizada para Máscara de CNPJ
app.directive('cnpjMask', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
            ctrl.$parsers.push(function(value) {
                if (!value) return '';
                
                // Remove tudo o que não for número (Impede a digitação de letras)
                var clean = value.replace(/[^0-9]/g, '');
                var formatted = clean;

                // Aplica as pontuações à medida que o tamanho aumenta
                if (clean.length > 2) formatted = clean.replace(/^(\d{2})(\d)/, '$1.$2');
                if (clean.length > 5) formatted = formatted.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                if (clean.length > 8) formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4');
                if (clean.length > 12) formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
                
                // Trava no limite máximo de 14 números (18 caracteres com a máscara)
                if (clean.length >= 14) formatted = formatted.substring(0, 18);

                // Se a visualização estiver diferente do que calculamos, atualiza a tela
                if (formatted !== value) {
                    ctrl.$setViewValue(formatted);
                    ctrl.$render();
                }

                // Salva o valor formatado no banco de dados (ng-model)
                return formatted;
            });
        }
    };
});

// Configuração das Rotas SPA (Agora com os títulos embutidos)
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/inicio', {
            template: '<div class="bg-white p-8 rounded-lg shadow-sm border border-gray-200"><h2 class="text-2xl font-bold text-gray-800">Visão Geral</h2><p class="mt-2 text-gray-600">Bem-vindo ao DAP System. Utilize o menu lateral para navegar pelos módulos disponíveis para o seu perfil.</p></div>',
            title: 'Início'
        })
        .when('/cliente-pj', { 
            templateUrl: 'views/cliente-pj.html', 
            controller: 'ClientePjCtrl',
            title: 'Administração > Empresa' // <- Título definido na rota
        })
        .when('/usuarios', { 
            templateUrl: 'views/usuarios.html', 
            controller: 'UsuariosCtrl',
            title: 'Sistema > Usuários'      // <- Título definido na rota
        })
        .otherwise({ redirectTo: '/inicio' });
}]);

// Dentro do seu MainCtrl (Logo no início dele), adicione o listener:
app.controller('MainCtrl', ['$scope', '$rootScope', '$timeout', '$http', '$window', function($scope, $rootScope, $timeout, $http, $window) {
    
    // Escuta toda vez que uma rota muda com sucesso para atualizar o título global
    $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
        if (current.$$route && current.$$route.title) {
            $rootScope.pageTitle = current.$$route.title;
        } else {
            $rootScope.pageTitle = "Dashboard";
        }
    });
    // Configurações de Ambiente (Utilizando as suas chaves)
    const SUPABASE_URL = 'https://kjmyzaiucwwcpilfslbl.supabase.co'; 
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbXl6YWl1Y3d3Y3BpbGZzbGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzAzNDAsImV4cCI6MjA5Njg0NjM0MH0._bwZdWTek859ounKggqOQ1-Xl8LdbTsyTQ8ut8MBryc';
    
    $scope.isUserMenuOpen = false;
    $scope.pageTitle = "Dashboard";
    $scope.menusDinamicos = [];
    $scope.usuarioLogado = "Carregando...";

    // 1. Validação de Sessão Local
    const token = localStorage.getItem('dap_token');
    if (!token) {
        $window.location.href = 'login.html'; // Expulsa se não tiver token
        return;
    }

    // Decodifica o JWT localmente apenas para extrair o e-mail (UI/UX)
    try {
        const payloadBase64 = token.split('.')[1];
        const payloadDecoded = JSON.parse(atob(payloadBase64));
        $scope.usuarioLogado = payloadDecoded.email;
    } catch (e) {
        $scope.usuarioLogado = "Operador";
    }

    // Configuração do Cabeçalho Zero Trust
    const httpConfig = {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
        }
    };

    // 2. Busca a Árvore de Menus Segura
    $scope.carregarMenus = function() {
        $http.post(`${SUPABASE_URL}/functions/v1/gerir-menus`, {}, httpConfig)
            .then(function(response) {
                if(response.data.sucesso) {
                    $scope.menusDinamicos = response.data.arvore;
                }
            })
            .catch(function(error) {
                console.error("Erro ao carregar permissões:", error);
                if(error.status === 401) $scope.logout(); // Token expirado ou inválido
            });
    };

    // 3. Controles da Interface (Menu Lateral)
    $scope.toggleMenuLateral = function(menu) {
        // Se for um menu pai (sem rota direta), faz o efeito sanfona (accordion)
        if (!menu.rota) {
            menu.isOpen = !menu.isOpen;
        }
    };

    // 4. Controles do Usuário
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
