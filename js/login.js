// Exemplo de como o Frontend fará o Login para obter o Token JWT
async function fazerLogin(email, password) {
    const supabaseUrl = 'SUA_URL_DO_SUPABASE';
    const supabaseAnonKey = 'SUA_CHAVE_ANONIMA_PUBLICA';

    // O Supabase tem uma API REST nativa para trocar credenciais por um Token
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    const data = await response.json();

    if (data.access_token) {
        console.log("Login feito! Este é o seu JWT Token:", data.access_token);
        // Salva o token no localStorage para enviar nas chamadas para a Edge Function de Clientes PJ
        localStorage.setItem('supabase_jwt', data.access_token);
    } else {
        console.error("Erro no login:", data.error_description);
    }
}
