document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(user => {
        // Só inicializa a lógica da página se o usuário estiver logado
        if (user) {
            initializeContentPro(user);
        }
    });
});

function initializeContentPro(user) {
    const form = document.getElementById('contentProForm');
    if (!form) return;

    // --- LÓGICA PARA CAMPOS CONDICIONAIS ---
    const nomeAutorField = document.getElementById('nomeAutorField');
    const assinaturaRadios = document.querySelectorAll('input[name="assinatura"]');
    
    function toggleNomeAutorField() {
        const isAutorChecked = document.getElementById('assinaturaAutor')?.checked;
        if (nomeAutorField) {
            nomeAutorField.style.display = isAutorChecked ? 'block' : 'none';
            if (!isAutorChecked) {
                nomeAutorField.querySelector('input').value = '';
            }
        }
    }
    assinaturaRadios.forEach(radio => radio.addEventListener('change', toggleNomeAutorField));
    toggleNomeAutorField();

    // --- LÓGICA DE ENVIO DO FORMULÁRIO ---
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const submitBtn = form.querySelector('.submit-btn');
        const loadingState = document.getElementById('loadingState');
        const resultState = document.getElementById('resultState');
        const errorState = document.getElementById('errorState');
        const copyContent = document.getElementById('copyContent');

        resultState.style.display = 'none';
        errorState.style.display = 'none';
        loadingState.style.display = 'block';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Consultando identidade...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            // --- NOVO: BUSCAR DADOS DA MARCA E DO USUÁRIO ---
            let brandName = user.displayName || user.email;
            let brandIdentity = '';

            const userRef = firebase.database().ref('users/' + user.uid);
            const userSnapshot = await userRef.once('value');
            if (userSnapshot.exists()) {
                brandName = userSnapshot.val().name || brandName;
            }

            const brandRef = firebase.database().ref('brandProfiles/' + user.uid);
            const brandSnapshot = await brandRef.once('value');
            if (brandSnapshot.exists()) {
                brandIdentity = brandSnapshot.val().description || '';
            }
            // --- FIM DA BUSCA DE DADOS ---

            submitBtn.textContent = 'Gerando...';
            
            // MODIFICADO: Passa os dados buscados para a função de prompt
            const prompt = createGenericPrompt(data, brandName, brandIdentity);
            console.log("Prompt enviado:", prompt);

            // ATENÇÃO: Substitua pela URL do seu backend
            const response = await fetch('https://create-caption-app.onrender.com/gerar-copy-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
            
            const responseData = await response.json();
            if (responseData && responseData.copy) {
                copyContent.innerText = responseData.copy;
                resultState.style.display = 'block';
            } else {
                throw new Error('Formato de resposta da API inválido.');
            }
        } catch (error) {
            console.error('Erro ao chamar a API:', error);
            if (errorState) {
                errorState.innerHTML = `<p>Ocorreu um erro: ${error.message}</p>`;
                errorState.style.display = 'block';
            }
        } finally {
            loadingState.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gerar Conteúdo';
        }
    });

    // --- FUNÇÃO DE COPIAR ---
    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
        copyButton.addEventListener('click', (event) => {
            const content = document.getElementById('copyContent').innerText;
            const btn = event.currentTarget;
            navigator.clipboard.writeText(content).then(() => {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✅ Copiado!';
                btn.style.backgroundColor = '#22c55e';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.backgroundColor = '';
                }, 2000);
            }).catch(err => {
                console.error('Erro ao copiar:', err);
                alert('Não foi possível copiar o texto.');
            });
        });
    }
}

// MODIFICADO: Função agora aceita nome e identidade da marca
function createGenericPrompt(data, brandName, brandIdentity) {
    let prompt = `Crie um conteúdo profissional para a marca "${brandName}" com base nas seguintes informações:\n\n`;

    if (brandIdentity) {
        prompt += `**Contexto e Identidade da Marca (use isso como base principal para o tom de voz e estilo):**\n${brandIdentity}\n\n`;
    }

    prompt += `**Detalhes específicos para este conteúdo:**\n`;
    prompt += `**Tema Central:** ${data.temaCentral}\n`;
    prompt += `**Objetivo do Conteúdo:** ${data.objetivoConteudo}\n`;
    if (data.palavrasChave) {
        prompt += `**Palavras-chave para SEO:** ${data.palavrasChave}\n`;
    }
    prompt += `**Estrutura Desejada:** ${data.estruturaDesejada}\n`;
    prompt += `**Público-alvo:** ${data.publicoAlvo}\n`;
    prompt += `**Tom da Comunicação:** ${data.tomComunicacao}\n`;
    prompt += `**Informações Obrigatórias:** ${data.infoObrigatorias}\n`;
    prompt += `**Assinatura:** ${data.assinatura}`;
    if (data.assinatura === 'Nome de autor específico' && data.nomeAutor) {
        prompt += ` - ${data.nomeAutor}`;
    }
    prompt += `\n\n**Instrução:** O texto deve ser informativo, bem estruturado, com credibilidade e otimizado para os objetivos definidos. Siga a estrutura desejada rigorosamente e incorpore a identidade da marca em todo o conteúdo.`;

    return prompt;
}