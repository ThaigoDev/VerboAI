document.addEventListener('DOMContentLoaded', () => {
    // ======================================================
    // SUAS CONFIGURAÇÕES DO FIREBASE E CLOUDINARY
    // ======================================================
    const firebaseConfig = { apiKey: "AIzaSyCpQCr3T7Y_0xNVyVZEqEy7OCu-M9QHpF4", authDomain: "verbo-ai-5429f.firebaseapp.com", projectId: "verbo-ai-5429f", storageBucket: "verbo-ai-5429f.firebasestorage.app", messagingSenderId: "833449612290", appId: "1:833449612290:web:06cc74ac72ceedcf4c031b", measurementId: "G-Z001ZLPXP2" };
    const CLOUDINARY_CLOUD_NAME = 'dt7jg4zci';
    const CLOUDINARY_UPLOAD_PRESET = 'verbo_ai_preset';

    // Inicializa os serviços do Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.database();

    // --- Elementos do DOM ---
    const loadingSpinner = document.getElementById('loading-spinner');
    const settingsWrapper = document.getElementById('settings-wrapper');
    const settingsPanels = document.querySelectorAll('.settings-panel');
    
    // Elementos da Navegação (Desktop e Mobile)
    const desktopNavLinks = document.querySelectorAll('.settings-sidebar .nav-link');
    const mobileNavLinks = document.querySelectorAll('.mobile-bottom-nav .mobile-nav-link');
    const allNavLinks = [...desktopNavLinks, ...mobileNavLinks];
    
    // Elementos do Perfil na Navbar Superior
    const userDisplayName = document.getElementById('user-display-name');
    const userAvatarDesktop = document.getElementById('user-avatar-desktop');
    const logoutBtn = document.getElementById('logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

    // Elementos dos Formulários
    const profileForm = document.getElementById('profile-form');
    const profilePicInput = document.getElementById('profile-pic-input');
    const profilePicPreview = document.getElementById('profile-pic-preview');
    const displayNameInput = document.getElementById('displayName');
    const profileSuccessMsg = document.getElementById('profile-success');
    const profileSaveBtn = profileForm.querySelector('button');
    const brandForm = document.getElementById('brand-form');
    const brandDescriptionInput = document.getElementById('brandDescription');
    const brandSuccessMsg = document.getElementById('brand-success');
    const brandSaveBtn = brandForm.querySelector('button');

    let currentUserId = null;
    let newProfilePicFile = null;

    // --- LÓGICA DE NAVEGAÇÃO UNIFICADA ---
    const handleNavClick = (clickedLink) => {
        const targetId = clickedLink.getAttribute('data-target');
        
        // Atualiza o estado 'active' para todos os links correspondentes
        allNavLinks.forEach(link => {
            if (link.getAttribute('data-target') === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Mostra o painel correto
        settingsPanels.forEach(p => p.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
    };

    allNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            handleNavClick(e.currentTarget);
        });
    });

    // --- LÓGICA DE AUTENTICAÇÃO E DADOS ---
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            // Popula a navbar superior com dados do usuário
            userDisplayName.textContent = user.displayName || user.email;
            userAvatarDesktop.src = user.photoURL || '../placeholder-avatar.png';

            // Popula os campos do formulário
            displayNameInput.value = user.displayName || '';
            profilePicPreview.src = user.photoURL || '../placeholder-avatar.png';

            // Carrega dados da marca
            db.ref('brandProfiles/' + currentUserId).once('value').then(snapshot => {
                if (snapshot.exists()) {
                    brandDescriptionInput.value = snapshot.val().description || '';
                }
            }).finally(() => {
                loadingSpinner.style.display = 'none';
                settingsWrapper.classList.remove('hidden');
            });
        } else {
            // Se não houver usuário, redireciona para a página principal (que cuidará do login)
            window.location.href = '../index.html';
        }
    });

    // --- LÓGICA DE LOGOUT ---
    const handleLogout = () => auth.signOut();
    if(logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if(mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);
    
    // --- LÓGICA DE UPLOAD E SALVAMENTO (Sem alterações) ---
    profilePicInput.addEventListener('change', event => {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        newProfilePicFile = file;
        const reader = new FileReader();
        reader.onload = e => { profilePicPreview.src = e.target.result; };
        reader.readAsDataURL(file);
    });

    profileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        profileSaveBtn.disabled = true;
        profileSaveBtn.textContent = 'Salvando...';
        profileSuccessMsg.textContent = '';
        let photoUrlToUpdate = user.photoURL;

        try {
            if (newProfilePicFile) {
                profileSaveBtn.textContent = 'Enviando imagem...';
                const formData = new FormData();
                formData.append('file', newProfilePicFile);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                    method: 'POST', body: formData
                });
                if (!response.ok) throw new Error('Falha ao enviar a imagem.');
                const cloudinaryData = await response.json();
                photoUrlToUpdate = cloudinaryData.secure_url;
                newProfilePicFile = null;
            }

            profileSaveBtn.textContent = 'Atualizando perfil...';
            await user.updateProfile({
                displayName: displayNameInput.value,
                photoURL: photoUrlToUpdate
            });

            // ATUALIZA A NAVBAR SUPERIOR INSTANTANEAMENTE
            userDisplayName.textContent = displayNameInput.value;
            userAvatarDesktop.src = photoUrlToUpdate;

            profileSuccessMsg.textContent = 'Perfil salvo com sucesso!';
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            profileSuccessMsg.textContent = 'Erro ao salvar perfil.';
            profileSuccessMsg.style.color = '#f87171';
        } finally {
            profileSaveBtn.disabled = false;
            profileSaveBtn.textContent = 'Salvar Perfil';
            setTimeout(() => {
                profileSuccessMsg.textContent = '';
                profileSuccessMsg.style.color = 'var(--accent-color)';
            }, 4000);
        }
    });

    brandForm.addEventListener('submit', event => {
        event.preventDefault();
        if (!currentUserId) return;
        brandSaveBtn.disabled = true;
        brandSaveBtn.textContent = 'Salvando...';
        db.ref('brandProfiles/' + currentUserId).set({
            description: brandDescriptionInput.value
        }).then(() => {
            brandSuccessMsg.textContent = 'Identidade da marca salva!';
        }).catch(error => {
            brandSuccessMsg.textContent = 'Erro ao salvar identidade.';
        }).finally(() => {
            brandSaveBtn.disabled = false;
            brandSaveBtn.textContent = 'Salvar Identidade';
            setTimeout(() => brandSuccessMsg.textContent = '', 3000);
        });
    });

    document.getElementById('security-form').addEventListener('submit', e => {
        e.preventDefault();
        alert("Função de alterar senha ainda não implementada.");
    });
});