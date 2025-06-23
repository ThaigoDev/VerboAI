document.addEventListener('DOMContentLoaded', function() {
    const interviewForm = document.getElementById('interviewForm');
    if (!interviewForm) return;

    interviewForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Seleciona os elementos do DOM
        const form = event.target;
        const submitBtn = form.querySelector('.submit-btn');
        const loadingMessage = document.getElementById('loadingMessage');
        const errorMessage = document.getElementById('errorMessage');
        const resultSection = document.getElementById('resultSection');
        const interviewQuestions = document.getElementById('interviewQuestions');

        // Reseta a interface do usuário
        if(errorMessage) errorMessage.style.display = 'none';
        if(resultSection) resultSection.style.display = 'none';
        if(loadingMessage) loadingMessage.style.display = 'block';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Gerando...';

        // Coleta os dados do formulário
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Cria o prompt genérico para a IA
        const promptText = `
            Você é um redator e jornalista especialista em criar perguntas para entrevistas de negócios, marketing e conteúdo.

            Gere **${data.quantidade}** perguntas de entrevista para a marca/projeto **"${data.nomeMarca}"**.

            **Tema da Entrevista:** ${data.tema}
            **Perfil do Entrevistado:** ${data.publico || 'Não especificado'}
            **Estilo Desejado para as Perguntas:** ${data.estilo}
            **Contexto Adicional:** ${data.contexto_adicional || 'Nenhum contexto adicional fornecido.'}

            As perguntas devem ser:
            * Claras, bem estruturadas e abertas (para incentivar respostas detalhadas).
            * Alinhadas com o tema e o estilo solicitados.
            * Formuladas para extrair respostas que sejam relevantes, interessantes e que criem uma conexão com o público-alvo da marca.

            Entregue o resultado como uma lista de perguntas numeradas, de forma clara e direta.
        `.trim();

        try {
            // ATENÇÃO: Substitua pela URL do seu backend.
            const response = await fetch('https://create-caption-app.onrender.com/gerar-entrevista', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptText }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro na API (${response.status}): ${errorText || 'Não foi possível obter detalhes.'}`);
            }

            const responseData = await response.json();
            
            if (responseData && responseData.entrevista) {
                interviewQuestions.innerText = responseData.entrevista;
                resultSection.style.display = 'block';
            } else {
                throw new Error('A resposta da API não continha os dados esperados.');
            }

        } catch (error) {
            console.error('Erro ao gerar perguntas:', error);
            if(errorMessage) {
                errorMessage.textContent = `Ocorreu um erro: ${error.message}`;
                errorMessage.style.display = 'block';
            }
        } finally {
            if(loadingMessage) loadingMessage.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gerar Perguntas';
        }
    });
    
    // Evento de clique para o botão de copiar
    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
        copyButton.addEventListener('click', (event) => {
            const content = document.getElementById('interviewQuestions').innerText;
            const btn = event.currentTarget;

            navigator.clipboard.writeText(content).then(() => {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✅ Copiado!';
                btn.style.backgroundColor = '#22c55e'; // Verde
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.backgroundColor = ''; // Volta ao padrão do CSS
                }, 2000);
            }).catch(err => {
                console.error('Erro ao copiar:', err);
                alert('Não foi possível copiar o texto.');
            });
        });
    }
});
