document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(user => {
        // Só inicializa a lógica da página se o usuário estiver logado
        if (user) {
            initializeInterviewTool(user);
        }
    });
});

function initializeInterviewTool(user) {
    const interviewForm = document.getElementById('interviewForm');
    if (!interviewForm) return;

    interviewForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = form.querySelector('.submit-btn');
        const loadingMessage = document.getElementById('loadingMessage');
        const errorMessage = document.getElementById('errorMessage');
        const resultSection = document.getElementById('resultSection');
        const interviewQuestions = document.getElementById('interviewQuestions');

        if(errorMessage) errorMessage.style.display = 'none';
        if(resultSection) resultSection.style.display = 'none';
        if(loadingMessage) loadingMessage.style.display = 'block';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Consultando identidade...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            // --- NOVO: BUSCAR DADOS DA MARCA E DO USUÁRIO ---
            let brandName = user.displayName || user.email; // Fallback
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
            
            // MODIFICADO: Passa os dados buscados para a função que cria o prompt
            const promptText = createInterviewPrompt(data, brandName, brandIdentity);
            
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
    
    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
        copyButton.addEventListener('click', (event) => {
            const content = document.getElementById('interviewQuestions').innerText;
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
function createInterviewPrompt(data, brandName, brandIdentity) {
    let prompt = `Você é um redator e jornalista especialista em criar perguntas para entrevistas de negócios, marketing e conteúdo.\n\n`;

    if (brandIdentity) {
        prompt += `**Contexto e Identidade da Marca (use isso como base para as perguntas):**\n${brandIdentity}\n\n`;
    }

    prompt += `Gere **${data.quantidade}** perguntas de entrevista para a marca/projeto **"${brandName}"**.\n\n`;
    prompt += `**Tema da Entrevista:** ${data.tema}\n`;
    prompt += `**Perfil do Entrevistado:** ${data.publico || 'Não especificado'}\n`;
    prompt += `**Estilo Desejado para as Perguntas:** ${data.estilo}\n`;
    prompt += `**Contexto Adicional:** ${data.contexto_adicional || 'Nenhum contexto adicional fornecido.'}\n\n`;
    prompt += `As perguntas devem ser:\n`;
    prompt += `* Claras, bem estruturadas e abertas (para incentivar respostas detalhadas).\n`;
    prompt += `* Alinhadas com o tema e o estilo solicitados, sempre respeitando a identidade da marca.\n`;
    prompt += `* Formuladas para extrair respostas que sejam relevantes, interessantes e que criem uma conexão com o público-alvo da marca.\n\n`;
    prompt += `Entregue o resultado como uma lista de perguntas numeradas, de forma clara e direta.`;

    return prompt.trim();
}