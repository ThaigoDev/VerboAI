document.addEventListener('DOMContentLoaded', function() {
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
    toggleNomeAutorField(); // Estado inicial

    // --- VALIDAÇÃO DE CHECKBOXES ---
    form.addEventListener('submit', function(event) {
        const canaisCheckboxes = form.querySelectorAll('input[name="canaisDistribuicao"]');
        if (canaisCheckboxes.length > 0) {
            const isAnyCanalChecked = Array.from(canaisCheckboxes).some(cb => cb.checked);
            if (!isAnyCanalChecked) {
                alert('Por favor, selecione ao menos um canal de distribuição.');
                event.preventDefault();
            }
        }
    });

    // --- LÓGICA DE ENVIO DO FORMULÁRIO ---
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const submitBtn = form.querySelector('.submit-btn');
        const loadingState = document.getElementById('loadingState');
        const resultState = document.getElementById('resultState');
        const errorState = document.getElementById('errorState');
        const copyContent = document.getElementById('copyContent');
        const copyButton = document.getElementById('copyButton');

        resultState.style.display = 'none';
        errorState.style.display = 'none';
        loadingState.style.display = 'block';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Gerando...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.canaisDistribuicao = formData.getAll('canaisDistribuicao');

        const prompt = createGenericPrompt(data);
        console.log("Prompt enviado:", prompt);

        try {
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
    if(copyButton){
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
});

function createGenericPrompt(data) {
    let prompt = `Crie uma copy jornalística premium para a marca "${data.nomeMarca}" com base nas seguintes informações:\n\n`;
    prompt += `**Tema Central:** ${data.temaCentral}\n`;
    prompt += `**Objetivo do Conteúdo:** ${data.objetivoConteudo}\n`;
    if (data.palavrasChave) {
        prompt += `**Palavras-chave para SEO:** ${data.palavrasChave}\n`;
    }
    prompt += `**Estrutura Desejada:** ${data.estruturaDesejada}\n`;
    prompt += `**Público-alvo:** ${data.publicoAlvo}\n`;
    prompt += `**Tom da Comunicação:** ${data.tomComunicacao}\n`;
    prompt += `**Informações Obrigatórias:** ${data.infoObrigatorias}\n`;
    prompt += `**Mensagem Principal:** ${data.mensagemPrincipal}\n`;
    if (data.fonteReferencia) {
        prompt += `**Fonte/Referência:** ${data.fonteReferencia}\n`;
    }
    prompt += `**Assinatura:** ${data.assinatura}`;
    if (data.assinatura === 'Nome de autor específico' && data.nomeAutor) {
        prompt += ` - ${data.nomeAutor}`;
    }
    prompt += `\n**Canais de Distribuição:** ${data.canaisDistribuicao.join(', ')}\n`;
    prompt += `\n**Instrução:** O texto deve ser informativo, bem estruturado, com credibilidade e otimizado para os objetivos e canais definidos.`;

    return prompt;
}
