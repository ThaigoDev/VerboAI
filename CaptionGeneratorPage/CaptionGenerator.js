document.addEventListener('DOMContentLoaded', function() {
    const captionForm = document.getElementById('captionForm');
    if (!captionForm) return;

    captionForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        const error = document.getElementById('error');
        
        // Resetar a UI
        result.style.display = 'none';
        error.style.display = 'none';
        loading.style.display = 'block';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Gerando...';
        
        // Coletar dados do formulário
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        // Criar o prompt genérico para a API
        const prompt = createGenericPrompt(data);
        
        try {
            // ATENÇÃO: Substitua pela URL do seu backend
            const response = await fetch('https://create-caption-app.onrender.com/gerar-legenda/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt })
            });
            
            if (!response.ok) {
                throw new Error(`Erro na resposta da API: ${response.status}`);
            }
            
            const responseData = await response.json();
            
            if (responseData && responseData.legenda) {
                 // Exibir o resultado
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
            // Resetar o botão e esconder o loading
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gerar Legenda Criativa';
            loading.style.display = 'none';
        }
    });

    // Anexa o evento ao botão de copiar
    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
        copyButton.addEventListener('click', copyToClipboard);
    }
});

function createGenericPrompt(data) {
    let prompt = `Crie uma legenda criativa e autêntica para a marca "${data.nomeMarca}" sobre o tema: "${data.tema}".\n\n`;

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
- Desenvolva o corpo da legenda de forma criativa e direta, alinhada ao tom solicitado.
- Use emojis de forma estratégica para adicionar apelo visual.
- Inclua uma Chamada para Ação (CTA) clara e relevante no final.
- Sugira de 3 a 5 hashtags pertinentes ao tema e ao negócio.

Seja criativo, autêntico e evite clichês. A legenda deve ter personalidade e se conectar genuinamente com o público.`;

    return prompt;
}

function copyToClipboard(event) {
    const content = document.getElementById('resultContent').innerText;
    const btn = event.currentTarget; // Usar event.currentTarget para ter certeza que é o botão

    navigator.clipboard.writeText(content).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copiado!';
        btn.style.backgroundColor = '#22c55e'; // Verde para sucesso
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = ''; // Reseta para a cor padrão do CSS
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar. Tente selecionar o texto manualmente.');
    });
}
