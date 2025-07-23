document.addEventListener('DOMContentLoaded', () => {
    // ======================================================
    // COLE SUAS CONFIGURAÇÕES DO FIREBASE AQUI
    // ======================================================
    const firebaseConfig = {
        apiKey: "AIzaSyCpQCr3T7Y_0xNVyVZEqEy7OCu-M9QHpF4",
        authDomain: "verbo-ai-5429f.firebaseapp.com",
        projectId: "verbo-ai-5429f",
        storageBucket: "verbo-ai-5429f.firebasestorage.app",
        messagingSenderId: "833449612290",
        appId: "1:833449612290:web:06cc74ac72ceedcf4c031b",
        measurementId: "G-Z001ZLPXP2"
    };
    
    // ======================================================
    // COLE SUAS CREDENCIAIS DO CLOUDINARY AQUI
    // ======================================================
    const CLOUDINARY_CLOUD_NAME = 'dt7jg4zci';
    const CLOUDINARY_UPLOAD_PRESET = 'verbo_ai_preset'; // Ex: 'verbo_ai_preset'


    // Inicializa os serviços do Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.database();

    // --- Elementos do DOM ---
    const loadingSpinner = document.getElementById('loading-spinner');
    const settingsWrapper = document.getElementById('settings-wrapper');
    const navLinks = document.querySelectorAll('.nav-link');
    const settingsPanels = document.querySelectorAll('.settings-panel');
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
    let newProfilePicFile = null; // Variável para guardar o ARQUIVO da nova foto

    // --- Lógica de Navegação ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            settingsPanels.forEach(p => p.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(link.getAttribute('data-target')).classList.add('active');
        });
    });

    // --- Lógica de Autenticação e Dados ---
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            displayNameInput.value = user.displayName || '';
            profilePicPreview.src = user.photoURL || 'placeholder-avatar.png';

            const brandRef = db.ref('brandProfiles/' + currentUserId);
            brandRef.once('value').then(snapshot => {
                if (snapshot.exists()) {
                    brandDescriptionInput.value = snapshot.val().description || '';
                }
            }).finally(() => {
                loadingSpinner.style.display = 'none';
                settingsWrapper.classList.remove('hidden');
            });
        } else {
            window.location.href = 'index.html';
        }
    });
    
    // --- LÓGICA DE UPLOAD E SALVAMENTO (COM CLOUDINARY) ---

    // Preview da imagem e armazena o arquivo para o upload
    profilePicInput.addEventListener('change', event => {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        
        newProfilePicFile = file; // Guarda o objeto File

        const reader = new FileReader();
        reader.onload = e => {
            profilePicPreview.src = e.target.result; // Mostra o preview
        };
        reader.readAsDataURL(file);
    });

    // Salvar dados do perfil (agora com upload para o Cloudinary)
    profileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        profileSaveBtn.disabled = true;
        profileSaveBtn.textContent = 'Salvando...';
        profileSuccessMsg.textContent = '';

        let photoUrlToUpdate = user.photoURL; // Começa com a URL atual

        try {
            // Passo 1: Se uma nova foto foi selecionada, faz o upload para o Cloudinary
            if (newProfilePicFile) {
                profileSaveBtn.textContent = 'Enviando imagem...';
                
                const formData = new FormData();
                formData.append('file', newProfilePicFile);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Falha ao enviar a imagem para o Cloudinary.');
                }

                const cloudinaryData = await response.json();
                // Usamos a secure_url e podemos adicionar transformações!
                // Ex: "w_200,h_200,c_fill,r_max" para um avatar redondo de 200x200
                photoUrlToUpdate = cloudinaryData.secure_url; 
                newProfilePicFile = null; // Limpa o arquivo após o upload
            }

            // Passo 2: Atualiza o perfil do Firebase com os novos dados
            profileSaveBtn.textContent = 'Atualizando perfil...';
            await user.updateProfile({
                displayName: displayNameInput.value,
                photoURL: photoUrlToUpdate
            });

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
                profileSuccessMsg.style.color = '#a3e635';
            }, 4000);
        }
    });

    // Salvar dados da marca (sem alterações na lógica)
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

    // O formulário de segurança continua como exemplo
    document.getElementById('security-form').addEventListener('submit', e => {
        e.preventDefault();
        alert("Função de alterar senha ainda não implementada.");
    });
});