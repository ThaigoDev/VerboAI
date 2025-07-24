const firebaseConfig = { apiKey: "AIzaSyCpQCr3T7Y_0xNVyVZEqEy7OCu-M9QHpF4", authDomain: "verbo-ai-5429f.firebaseapp.com", projectId: "verbo-ai-5429f", storageBucket: "verbo-ai-5429f.firebasestorage.app", messagingSenderId: "833449612290", appId: "1:833449612290:web:06cc74ac72ceedcf4c031b", measurementId: "G-Z001ZLPXP2" };
// Inicializa o Firebase (se já não tiver sido inicializado)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

/**
 * Função para atualizar a UI do perfil.
 * Ela verifica internamente se os elementos existem na página.
 * @param {string} name - Nome a ser exibido.
 * @param {string} avatarUrl - URL do avatar.
 */
const updateProfileUI = (name, avatarUrl) => {
    const userDisplayName = document.getElementById('user-display-name');
    const userAvatarDesktop = document.getElementById('user-avatar-desktop');
    const mobileAvatarContainer = document.getElementById('user-avatar-mobile-container');
    
    // Define um avatar padrão caso a URL seja nula ou inválida
    const placeholder = '../placeholder-avatar.png';
    const finalAvatarUrl = avatarUrl || placeholder;

    if (userDisplayName) userDisplayName.textContent = name;
    if (userAvatarDesktop) userAvatarDesktop.src = finalAvatarUrl;

    if (mobileAvatarContainer) {
        const icon = mobileAvatarContainer.querySelector('i');
        if (icon) icon.style.opacity = '0';
        
        let img = mobileAvatarContainer.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            mobileAvatarContainer.appendChild(img);
        }
        img.src = finalAvatarUrl;
        setTimeout(() => img.style.opacity = '1', 50);
    }
};

/**
 * Função para configurar os botões de logout.
 * Só é chamada quando o usuário está logado.
 */
const setupLogoutButtons = () => {
    const logoutBtn = document.getElementById('logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    const handleLogout = () => auth.signOut().catch(error => console.error('Erro ao sair:', error));

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);
};

// --- Ponto Central: Gerencia o estado da autenticação ---
auth.onAuthStateChanged(user => {
    const loginContainer = document.getElementById('login-container');
    const appContent = document.getElementById('app-content');

    if (user) {
        // --- USUÁRIO ESTÁ LOGADO ---

        // 1. Esconde o login e mostra o conteúdo do app
        if (loginContainer) loginContainer.classList.add('hidden');
        if (appContent) appContent.classList.remove('hidden');
        
        // 2. Configura os botões de logout
        setupLogoutButtons();

        // 3. Busca os dados do perfil no Realtime Database e atualiza a UI
        const userRef = database.ref('users/' + user.uid);
        userRef.once('value').then(snapshot => {
            let name = user.email; // Fallback para o email
            let avatarUrl = user.photoURL; // Fallback para a foto do Auth

            if (snapshot.exists()) {
                const userData = snapshot.val();
                name = userData.name || name; // Prioriza nome do banco de dados
                avatarUrl = userData.avatarUrl || avatarUrl; // Prioriza avatar do banco de dados
            }
            updateProfileUI(name, avatarUrl);
        }).catch(error => {
            console.error("Erro ao buscar dados do perfil:", error);
            // Em caso de erro, usa os dados de fallback do Auth
            updateProfileUI(user.email, user.photoURL);
        });

    } else {
        // --- USUÁRIO ESTÁ DESLOGADO ---

        // 1. Mostra o login e esconde o conteúdo do app
        if (loginContainer) loginContainer.classList.remove('hidden');
        if (appContent) appContent.classList.add('hidden');

        // 2. Configura o formulário de login (só se ele existir na página)
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const loginError = document.getElementById('login-error');
                if (loginError) loginError.textContent = '';

                auth.signInWithEmailAndPassword(email, password)
                    .catch(error => {
                        console.error('Erro de login:', error.message);
                        if (loginError) loginError.textContent = 'Email ou senha inválidos.';
                    });
            });
        }
        
        // 3. Se estiver em uma página interna, redireciona para o login
        const isLoginPage = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html');
        if (!isLoginPage) {
            window.location.href = '../index.html';
        }
    }
});