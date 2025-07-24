document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(user => {
        // Só inicializa a lógica da página se o usuário estiver logado
        if (user) {
            initializeCaptionGenerator(user);
        }
    });
});

function initializeCaptionGenerator(user) {
    const captionForm = document.getElementById('captionForm');
    if (!captionForm) return;

    captionForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        const error = document.getElementById('error');
        
        result.style.display = 'none';
        error.style.display = 'none';
        loading.style.display = 'block';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Consultando identidade...';
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        try {
            // --- NOVO: BUSCAR DADOS DA MARCA E DO USUÁRIO ---
            let brandName = user.displayName || user.email; // Fallback
            let brandIdentity = '';

            // Busca o nome do usuário/marca na coleção 'users'
            const userRef = firebase.database().ref('users/' + user.uid);
            const userSnapshot = await userRef.once('value');
            if (userSnapshot.exists()) {
                brandName = userSnapshot.val().name || brandName;
            }
            
            // Busca a identidade da marca na coleção 'brandProfiles'
            const brandRef = firebase.database().ref('brandProfiles/' + user.uid);
            const brandSnapshot = await brandRef.once('value');
            if (brandSnapshot.exists()) {
                brandIdentity = brandSnapshot.val().description || '';
            }
            // --- FIM DA BUSCA DE DADOS ---

            submitBtn.textContent = 'Gerando...';
            
            // MODIFICADO: Passa os dados buscados para a função de prompt
            const prompt = createGenericPrompt(data, brandName, brandIdentity);
            
            // ATENÇÃO: Substitua pela URL do seu backend
            const response = await fetch('https://create-caption-app.onrender.com/gerar-legenda/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            
            if (!response.ok) {
                throw new Error(`Erro na resposta da API: ${response.status}`);
            }
            
            const responseData = await response.json();
            
            if (responseData && responseData.legenda) {
                document.getElementById('resultContent').innerText = responseData.legenda;
                result.style.display = 'block';
            } else {
                throw new Error('Formato de resposta da API inválido.');
            }
            
        } catch (err) {
            console.error('Erro:', err);
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = `Erro ao gerar legenda: ${err.message}. Verifique sua conexão e tente novamente.`;
            errorDiv.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gerar Legenda Criativa';
            loading.style.display = 'none';
        }
    });

    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
        copyButton.addEventListener('click', copyToClipboard);
    }
}

// MODIFICADO: Função agora recebe nome e identidade da marca
function createGenericPrompt(data, brandName, brandIdentity) {
    let prompt = `Crie uma legenda criativa e autêntica para a marca "${brandName}" sobre o tema: "${data.tema}".\n\n`;

    if (brandIdentity) {
        prompt += `**Contexto e Identidade da Marca (use isso como base principal para o tom de voz e estilo):**\n${brandIdentity}\n\n`;
    }

    prompt += `**Detalhes específicos para esta legenda:**\n`;
    prompt += `**Objetivo da Postagem:** ${data.objetivo}\n`;
    prompt += `**Tom/Emoção Desejado:** ${data.tom}\n`;
    prompt += `**Público-alvo Principal:** ${data.publico}\n`;

    if (data.palavrasChave) {
        prompt += `**Palavras-chave para Incluir:** ${data.palavrasChave}\n`;
    }
    if (data.evitar) {
        prompt += `**Palavras/Expressões a Evitar:** ${data.evitar}\n`;
    }
    if (data.observacoes) {
        prompt += `**Observações Adicionais:** ${data.observacoes}\n`;
    }

    prompt += `\n**Instruções de Estrutura:**
- Comece com um título curto e impactante em caixa alta.
- Desenvolva o corpo da legenda de forma criativa e direta, alinhada ao tom solicitado e à identidade da marca.
- Use emojis de forma estratégica para adicionar apelo visual.
- Inclua uma Chamada para Ação (CTA) clara e relevante no final.
- Sugira de 3 a 5 hashtags pertinentes ao tema e ao negócio.

Seja criativo e evite clichês. A legenda deve ter a personalidade da marca.`;

    return prompt;
}

function copyToClipboard(event) {
    const content = document.getElementById('resultContent').innerText;
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
        alert('Erro ao copiar. Tente selecionar o texto manualmente.');
    });
}