// Espera o DOM carregar e o Firebase verificar o estado do usuário
document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(user => {
        // Só executa o código da página se o usuário estiver logado
        if (user) {
            // MODIFICADO: Passa o objeto 'user' para a função de inicialização
            initializeScriptGenerator(user);
        }
    });
});

// MODIFICADO: A função agora recebe o objeto 'user'
function initializeScriptGenerator(user) {
    const roteiroForm = document.getElementById('roteiroForm');
    if (!roteiroForm) return;

    roteiroForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = form.querySelector('.submit-btn');
        const loadingState = document.getElementById('loadingState');
        const resultState = document.getElementById('resultState');
        const errorState = document.getElementById('errorState');
        const roteiroContent = document.getElementById('roteiroContent');

        resultState.style.display = 'none';
        if(errorState) errorState.style.display = 'none';
        loadingState.style.display = 'block';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Consultando identidade...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            // NOVO: Buscar a identidade da marca no Firebase antes de criar o prompt
            let brandIdentity = '';
            const brandRef = firebase.database().ref('brandProfiles/' + user.uid);
            const snapshot = await brandRef.once('value');

            if (snapshot.exists()) {
                brandIdentity = snapshot.val().description || '';
            }

            // MODIFICADO: Passa a identidade da marca para a função que cria o prompt
            const prompt = createGenericPrompt(data, brandIdentity);
            console.log("Prompt final enviado:", prompt);

            submitBtn.textContent = 'Gerando...';

            // ATENÇÃO: Substitua pela URL do seu backend
            const response = await fetch('https://create-caption-app.onrender.com/gerar-roteiro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }
            
            const responseData = await response.json();
            if (responseData && responseData.roteiro) {
                roteiroContent.innerText = responseData.roteiro;
                resultState.style.display = 'block';
            } else {
                throw new Error('Formato de resposta da API inválido.');
            }
        } catch (error) {
            console.error('Erro no processo de geração:', error);
            if (errorState) {
                errorState.innerHTML = `<p>Ocorreu um erro: ${error.message}</p>`;
                errorState.style.display = 'block';
            }
        } finally {
            loadingState.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gerar Roteiro';
        }
    });

    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
        copyButton.addEventListener('click', (event) => {
            const content = document.getElementById('roteiroContent').innerText;
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

// MODIFICADO: A função agora aceita a identidade da marca como parâmetro
function createGenericPrompt(data, brandIdentity) {
    let prompt = `Crie um roteiro de vídeo curto (para Reels/Shorts) para a marca "${data.nomeMarca}".\n\n`;

    // NOVO: Adiciona o contexto da marca ao prompt, se existir
    if (brandIdentity) {
        prompt += `**Contexto e Identidade da Marca (use isso como base principal para o tom de voz e estilo):**\n${brandIdentity}\n\n`;
    }

    prompt += `**Detalhes específicos para este vídeo:**\n`;
    prompt += `**Tema:** ${data.temaVideo}\n`;
    prompt += `**Objetivo:** ${data.objetivoVideo}\n`;
    prompt += `**Público-alvo:** ${data.publicoAlvo}\n`;
    prompt += `**Duração estimada:** ${data.duracaoEstimada}\n`;
    prompt += `**Mensagem principal:** ${data.mensagemPrincipal}\n`;
    prompt += `**Tom de voz desejado (complementar à identidade da marca):** ${data.tomDeVoz}\n`;
    prompt += `**Diferencial da marca a evidenciar:** ${data.diferencialMarca}\n`;
    
    if (data.sugestoesCenas) {
        prompt += `**Sugestões de cenas/imagens:** ${data.sugestoesCenas}\n`;
    }
    
    prompt += `\n**Instrução:** O roteiro deve ser criativo, envolvente e adequado para o formato de vídeo vertical. Organize o roteiro de forma clara, sugerindo cenas e narração/texto para cada momento do vídeo, sempre respeitando a identidade da marca fornecida.`;

    return prompt;
}