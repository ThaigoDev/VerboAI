// ATENÇÃO: Insira aqui as suas credenciais do Firebase
const firebaseConfig = { apiKey: "AIzaSyCpQCr3T7Y_0xNVyVZEqEy7OCu-M9QHpF4", authDomain: "verbo-ai-5429f.firebaseapp.com", projectId: "verbo-ai-5429f", storageBucket: "verbo-ai-5429f.firebasestorage.app", messagingSenderId: "833449612290", appId: "1:833449612290:web:06cc74ac72ceedcf4c031b", measurementId: "G-Z001ZLPXP2" };
// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// --- ELEMENTOS DA PÁGINA ---
const loginContainer = document.getElementById('login-container');
const appContent = document.getElementById('app-content');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// Elementos do perfil do usuário
const userDisplayName = document.getElementById('user-display-name');
const userAvatarDesktop = document.getElementById('user-avatar-desktop');
const mobileAvatarContainer = document.getElementById('user-avatar-mobile-container');

// Botões de Logout
const logoutBtn = document.getElementById('logout-btn');
const mobileLogoutBtn = document.getElementById('mobile-logout-btn');


// --- FUNÇÕES ---

// Função de Logout
const handleLogout = () => {
    auth.signOut().catch(error => console.error('Erro ao sair:', error));
};

// Função para atualizar a UI com os dados do usuário
const updateProfileUI = (name, avatarUrl) => {
    if (userDisplayName) {
        userDisplayName.textContent = name;
    }
    if (userAvatarDesktop) {
        userAvatarDesktop.src = avatarUrl;
    }
    if (mobileAvatarContainer) {
        const icon = mobileAvatarContainer.querySelector('i');
        if (icon) icon.style.opacity = '0';
        let img = mobileAvatarContainer.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            mobileAvatarContainer.appendChild(img);
        }
        img.src = avatarUrl;
        setTimeout(() => img.style.opacity = '1', 50);
    }
};


// --- EVENT LISTENERS ---

if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    loginError.textContent = '';

    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            console.error('Erro de login:', error.message);
            loginError.textContent = 'Email ou senha inválidos. Tente novamente.';
        });
});

// --- GERENCIAMENTO DE ESTADO DA AUTENTICAÇÃO ---
auth.onAuthStateChanged(user => {
    if (user) {
        loginContainer.classList.add('hidden');
        appContent.classList.remove('hidden');

        const userRef = database.ref('users/' + user.uid);
        userRef.once('value').then(snapshot => {
            const placeholderAvatar = 'placeholder-avatar.png';
            let name = user.email; 
            let avatarUrl = user.photoURL || placeholderAvatar;

            if (snapshot.exists()) {
                const userData = snapshot.val();
                name = userData.name || name;
                avatarUrl = userData.avatarUrl || avatarUrl;
            }
            
            updateProfileUI(name, avatarUrl);

        }).catch(error => {
            console.error("Erro ao buscar dados do perfil:", error);
            updateProfileUI(user.email, user.photoURL || 'placeholder-avatar.png');
        });

    } else {
        loginContainer.classList.remove('hidden');
        appContent.classList.add('hidden');
    }
});