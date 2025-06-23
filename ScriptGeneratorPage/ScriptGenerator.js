document.addEventListener('DOMContentLoaded', function() {
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
        submitBtn.textContent = 'Gerando...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const prompt = createGenericPrompt(data);
        console.log("Prompt enviado:", prompt);

        try {
            // ATENÇÃO: Substitua pela URL do seu backend
            const response = await fetch('https://create-caption-app.onrender.com/gerar-roteiro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }
            
            const responseData = await response.json();
            if (responseData && responseData.roteiro) {
                roteiroContent.innerText = responseData.roteiro;
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
                btn.style.backgroundColor = '#22c55e'; // Verde
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.backgroundColor = ''; // Volta ao padrão
                }, 2000);
            }).catch(err => {
                console.error('Erro ao copiar:', err);
                alert('Não foi possível copiar o texto.');
            });
        });
    }
});

function createGenericPrompt(data) {
    let prompt = `Crie um roteiro de vídeo curto (para Reels/Shorts) para a marca "${data.nomeMarca}" com base nas seguintes informações:\n\n`;
    prompt += `**Tema do vídeo:** ${data.temaVideo}\n`;
    prompt += `**Objetivo:** ${data.objetivoVideo}\n`;
    prompt += `**Público-alvo:** ${data.publicoAlvo}\n`;
    prompt += `**Duração estimada:** ${data.duracaoEstimada}\n`;
    prompt += `**Mensagem principal:** ${data.mensagemPrincipal}\n`;
    prompt += `**Tom de voz:** ${data.tomDeVoz}\n`;
    prompt += `**Diferencial da marca a evidenciar:** ${data.diferencialMarca}\n`;
    
    if (data.sugestoesCenas) {
        prompt += `**Sugestões de cenas/imagens:** ${data.sugestoesCenas}\n`;
    }
    
    prompt += `\n**Instrução:** O roteiro deve ser criativo, envolvente e adequado para o formato de vídeo vertical. Organize o roteiro de forma clara, sugerindo cenas e narração/texto para cada momento do vídeo.`;

    return prompt;
}
