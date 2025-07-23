document.addEventListener('DOMContentLoaded', () => {

    // ******************************************************
    // COLE A CONFIGURAÇÃO DO SEU FIREBASE AQUI
    // ******************************************************
 const firebaseConfig = {
  apiKey: "AIzaSyCpQCr3T7Y_0xNVyVZEqEy7OCu-M9QHpF4",
  authDomain: "verbo-ai-5429f.firebaseapp.com",
  projectId: "verbo-ai-5429f",
  storageBucket: "verbo-ai-5429f.firebasestorage.app",
  messagingSenderId: "833449612290",
  appId: "1:833449612290:web:06cc74ac72ceedcf4c031b",
  measurementId: "G-Z001ZLPXP2"
};
    // Inicializa o Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

    // Referências aos elementos do DOM
    const loginContainer = document.getElementById('login-container');
    const appContent = document.getElementById('app-content');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const loginError = document.getElementById('login-error');
    const userEmailSpan = document.getElementById('user-email');
    const userAvatar = document.getElementById('user-avatar');


    // Listener principal: verifica se o usuário está logado ou não
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário está logado
            loginContainer.classList.add('hidden');
            appContent.classList.remove('hidden');
            userEmailSpan.textContent = user.email; // Mostra o e-mail do usuário
            
            // Atualiza o avatar do usuário
            if(user.photoURL) {
                userAvatar.src = user.photoURL;
            } else {
                userAvatar.src = 'placeholder-avatar.png'; // Imagem padrão
            }
            
            // Inicia os scripts do app (como o parallax)
            if (typeof requestTick === 'function') {
                window.addEventListener('scroll', requestTick, { passive: true });
            }

        } else {
            // Usuário está deslogado
            loginContainer.classList.remove('hidden');
            appContent.classList.add('hidden');
        }
    });

    // Processar o formulário de login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = loginForm.email.value;
        const password = loginForm.password.value;
        loginError.textContent = ''; // Limpa erros antigos

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Sucesso! O onAuthStateChanged vai cuidar de mostrar o app.
                loginForm.reset();
            })
            .catch((error) => {
                // Mostra um erro amigável para o usuário
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    loginError.textContent = 'E-mail ou senha inválidos. Tente novamente.';
                } else {
                    loginError.textContent = 'Ocorreu um erro. Tente novamente mais tarde.';
                }
            });
    });

    // Processar o clique no botão de logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });

});