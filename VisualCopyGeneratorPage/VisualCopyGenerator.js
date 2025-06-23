document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('visualCopyForm');
    if (!form) return;

    // --- FUNÇÃO PARA CONTROLAR CAMPOS CONDICIONAIS ---
    function setupConditionalField(radioName, conditionalElementId) {
        const radios = document.querySelectorAll(`input[name="${radioName}"]`);
        const conditionalField = document.getElementById(conditionalElementId);
        
        const toggleVisibility = () => {
            const shouldShow = document.querySelector(`input[name="${radioName}"][value="sim"]`)?.checked;
            if (conditionalField) {
                conditionalField.style.display = shouldShow ? 'block' : 'none';
                if (!shouldShow) {
                    conditionalField.querySelectorAll('input, textarea').forEach(field => field.value = '');
                }
            }
        };

        radios.forEach(radio => radio.addEventListener('change', toggleVisibility));
        toggleVisibility(); // Estado inicial
    }

    // Configura os campos condicionais
    setupConditionalField('incluirStorytelling', 'storytellingFields');

    // --- VALIDAÇÃO DE CHECKBOXES ---
    form.addEventListener('submit', function(event) {
        const formatoPecaCheckboxes = form.querySelectorAll('input[name="formatoPeca"]');
        const isAnyFormatChecked = Array.from(formatoPecaCheckboxes).some(cb => cb.checked);
        if (!isAnyFormatChecked) {
            alert('Por favor, selecione ao menos um formato para a peça.');
            event.preventDefault();
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

        resultState.style.display = 'none';
        if(errorState) errorState.style.display = 'none';
        loadingState.style.display = 'block';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Gerando...';

        const formData = new FormData(form);
        const data = {
            nomeMarca: formData.get('nomeMarca'),
            objetivoPeca: formData.get('objetivoPeca'),
            formatoPeca: formData.getAll('formatoPeca'),
            temaCentral: formData.get('temaCentral'),
            mensagemPrincipal: formData.get('mensagemPrincipal'),
            tomComunicacao: formData.get('tomComunicacao'),
            headlineDesejada: formData.get('headlineDesejada'),
            incluirStorytelling: formData.get('incluirStorytelling'),
            storytelling: {
                gancho: formData.get('ganchoStorytelling'),
                solucao: formData.get('solucaoStorytelling'),
                acao: formData.get('acaoStorytelling'),
            }
        };

        const prompt = createGenericPrompt(data);
        console.log("Prompt enviado:", prompt);

        try {
            // ATENÇÃO: Substitua pela URL do seu backend
            const response = await fetch('https://create-caption-app.onrender.com/gerar-copy-visual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
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
            submitBtn.textContent = 'Gerar Copy Visual';
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
    let prompt = `Crie uma copy visual impactante para a marca "${data.nomeMarca}" com base nas seguintes informações:\n\n`;
    prompt += `**Objetivo da Peça:** ${data.objetivoPeca}\n`;
    prompt += `**Formato(s) da Peça:** ${data.formatoPeca.join(', ')}\n`;
    prompt += `**Tema Central:** ${data.temaCentral}\n`;
    prompt += `**Mensagem Principal:** ${data.mensagemPrincipal}\n`;
    prompt += `**Tom da Comunicação:** ${data.tomComunicacao}\n`;
    if (data.headlineDesejada) {
        prompt += `**Headline ou Destaque:** ${data.headlineDesejada}\n`;
    }
    if (data.incluirStorytelling === 'sim') {
        prompt += `**Usar Estrutura de Storytelling:** Sim\n`;
        prompt += `  - Gancho: ${data.storytelling.gancho || 'Não informado'}\n`;
        prompt += `  - Solução: ${data.storytelling.solucao || 'Não informado'}\n`;
        prompt += `  - CTA: ${data.storytelling.acao || 'Não informado'}\n`;
    }
    prompt += `\n**Instrução:** Crie textos curtos e diretos, adequados para serem lidos rapidamente em uma peça de design.`;

    return prompt;
}
