document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(user => {
        // Só inicializa a lógica da página se o usuário estiver logado
        if (user) {
            initializeAnalysisTool(user);
        }
    });
});

function initializeAnalysisTool(user) {
    // --- SELETORES DO DOM ---
    const analysisForm = document.getElementById('analysisForm');
    const contentInput = document.getElementById('content');
    // O brandIdentityInput foi removido
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    const resultContentDiv = document.getElementById('result-content');
    const errorDiv = document.getElementById('error');
    const submitBtn = document.querySelector('.submit-btn');
    const chartCanvas = document.getElementById('analysisChart');
    const progressionChartCanvas = document.getElementById('progressionChart');
    const keywordsList = document.getElementById('keywordsList');
    const sentimentText = document.getElementById('sentimentText');
    const readabilityText = document.getElementById('readabilityText');
    const titlesList = document.getElementById('titlesList');
    const toneText = document.getElementById('toneText');
    const copyButton = document.getElementById('copyButton');
    
    let analysisChart = null;
    let progressionChart = null;

    const API_ENDPOINT = 'https://create-caption-app.onrender.com/analise-content';

    const criteriaNames = ["Abertura Impactante", "Originalidade e Autenticidade", "Clareza da Mensagem", "Tom de Voz Coerente", "Conexão com o Público-Alvo", "Chamada para Ação (CTA) Eficaz", "Alinhamento com a Identidade da Marca", "Formatação e Legibilidade", "Uso Estratégico de Hashtags"];

    analysisForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = contentInput.value.trim();
        if (!content) {
            alert('Por favor, insira o conteúdo para análise.');
            return;
        }

        resultDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        loadingDiv.style.display = 'block';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Consultando identidade...';

        try {
            // NOVO: Buscar a identidade da marca no Firebase
            let brandIdentity = '';
            const brandRef = firebase.database().ref('brandProfiles/' + user.uid);
            const snapshot = await brandRef.once('value');
            if (snapshot.exists()) {
                brandIdentity = snapshot.val().description || '';
            }
            
            submitBtn.textContent = 'Analisando...';
            const analysisPrompt = createGenericPrompt(content, brandIdentity);
            
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: analysisPrompt })
            });
            if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
            
            const data = await response.json();
            const fullAnalysis = data.analise;
            const results = parseAnalysisResults(fullAnalysis, criteriaNames);

            resultContentDiv.innerText = fullAnalysis;
            renderChart(results.scores, criteriaNames);
            renderProgressionChart(results.progression);
            renderNewSections(results);
            resultDiv.style.display = 'block';
        } catch (error) {
            console.error('Erro na análise:', error);
            errorDiv.innerText = `Ocorreu um erro: ${error.message}. Tente novamente.`;
            errorDiv.style.display = 'block';
        } finally {
            loadingDiv.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Analisar Conteúdo';
        }
    });
    
    // ... (O restante das funções: createGenericPrompt, parseAnalysisResults, renderChart, etc. continuam aqui, sem alterações)
    function createGenericPrompt(content, brandIdentity) {
        const identityClause = brandIdentity
            ? `A identidade da marca para referência é: "${brandIdentity}". O critério "Alinhamento com a Identidade da Marca" deve usar esta descrição como base.`
            : "Como a identidade da marca não foi fornecida, avalie o critério 'Alinhamento com a Identidade da Marca' de forma geral, com base na consistência e profissionalismo do próprio conteúdo.";
        return `Você é um especialista em marketing e análise de conteúdo. Analise o texto a seguir de forma crítica e construtiva.\n\n**Conteúdo para Análise:**\n"${content}"\n\n**${identityClause}**\n\n**Estrutura da Resposta (Siga este formato rigorosamente):**\n\n**Análise Geral:**\n[Forneça um resumo de 2-3 frases com sua avaliação geral.]\n\n**Pontuações dos Critérios:**\n[Liste cada um dos 9 critérios abaixo e atribua a nota de 0 a 5 entre colchetes.]\nAbertura Impactante: [NOTA]\nOriginalidade e Autenticidade: [NOTA]\nClareza da Mensagem: [NOTA]\nTom de Voz Coerente: [NOTA]\nConexão com o Público-Alvo: [NOTA]\nChamada para Ação (CTA) Eficaz: [NOTA]\nAlinhamento com a Identidade da Marca: [NOTA]\nFormatação e Legibilidade: [NOTA]\nUso Estratégico de Hashtags: [NOTA]\n\n**Potencial de Engajamento:**\n[Estime em uma porcentagem. Ex: Potencial de Engajamento: [75%]]\n\n--- ANÁLISE DETALHADA ---\n\n**Palavras-chave e Relevância:**\n[Liste 3-5 palavras-chave e sua relevância (Alta, Média, Baixa).]\n\n**Sentimento do Conteúdo:**\n[Classifique o sentimento (Positivo, Neutro, Negativo) e sua intensidade. Ex: Positivo (80%)]\n\n**Nível de Leitura:**\n[Classifique a complexidade (Fácil, Médio, Difícil) e uma pontuação (0-100, onde 100 é mais fácil).]\n\n**Títulos Sugeridos:**\n[Proponha 3 títulos alternativos.]\n\n**Análise de Tom:**\n[Descreva o tom de voz identificado.]`;
    }
    function parseAnalysisResults(text, criteria) {
        const results = { scores: {}, progression: null, keywords: [], sentiment: {}, readability: {}, suggestedTitles: [], toneVariation: null };
        const lines = text.split('\n');
        lines.forEach(line => {
            criteria.forEach(criterion => {
                if (line.includes(criterion)) {
                    const match = line.match(/\[(\d)\]/);
                    if (match) results.scores[criterion] = parseInt(match[1], 10);
                }
            });
            if (line.includes('Potencial de Engajamento:')) {
                const match = line.match(/\[(\d+)%\]/);
                if (match) results.progression = parseInt(match[1], 10);
            }
        });
        const detailedText = text.split('--- ANÁLISE DETALHADA ---')[1] || '';
        const keywordsMatch = detailedText.match(/Palavras-chave e Relevância:\s*([\s\S]*?)(?=Sentimento do Conteúdo:)/);
        if (keywordsMatch) results.keywords = keywordsMatch[1].trim().split('\n').map(l => l.replace(/^-/, '').trim());
        const sentimentMatch = detailedText.match(/Sentimento do Conteúdo:\s*([\w\s]+)\s*\((\d+)%\)/);
        if (sentimentMatch) results.sentiment = { text: sentimentMatch[1].trim(), percentage: sentimentMatch[2] };
        const readabilityMatch = detailedText.match(/Nível de Leitura:\s*([\w\s]+)\s*\(.*?(\d+)\)/);
        if (readabilityMatch) results.readability = { level: readabilityMatch[1].trim(), score: readabilityMatch[2] };
        const titlesMatch = detailedText.match(/Títulos Sugeridos:\s*([\s\S]*?)(?=Análise de Tom:)/);
        if (titlesMatch) results.suggestedTitles = titlesMatch[1].trim().split('\n').map(l => l.replace(/^\d+\.\s*/, '').trim());
        const toneMatch = detailedText.match(/Análise de Tom:\s*([\s\S]*?)$/);
        if (toneMatch) results.toneVariation = toneMatch[1].trim();
        return results;
    }
    function renderChart(scores, labels) {
        if (analysisChart) analysisChart.destroy();
        const dataValues = labels.map(label => scores[label] || 0);
        analysisChart = new Chart(chartCanvas, {
            type: 'radar',
            data: { labels: labels, datasets: [{ label: 'Pontuação', data: dataValues, backgroundColor: 'rgba(190, 242, 100, 0.2)', borderColor: '#bef264', pointBackgroundColor: '#bef264', pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: '#bef264' }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { r: { suggestedMin: 0, suggestedMax: 5, ticks: { stepSize: 1, color: '#a1a1aa', backdropColor: 'transparent' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }, angleLines: { color: 'rgba(255, 255, 255, 0.1)' }, pointLabels: { color: '#e4e4e7', font: { size: 12 } } } }, plugins: { legend: { display: false } } }
        });
    }
    function renderProgressionChart(progression) {
        if (progressionChart) progressionChart.destroy();
        progressionChart = new Chart(progressionChartCanvas, {
            type: 'bar',
            data: { labels: ['Potencial'], datasets: [{ label: 'Engajamento', data: [progression], backgroundColor: ['rgba(190, 242, 100, 0.8)'], borderColor: ['#bef264'], borderWidth: 1, borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true, max: 100, ticks: { color: '#a1a1aa', callback: (value) => value + '%' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }, y: { ticks: { color: '#a1a1aa' }, grid: { display: false } } }, plugins: { legend: { display: false } } }
        });
    }
    function renderNewSections(results) {
        const sections = {
            keywordsSection: results.keywords && results.keywords.length > 0 ? () => { document.getElementById('keywordsList').innerHTML = results.keywords.map(item => `<li>${item}</li>`).join(''); } : null,
            sentimentSection: results.sentiment.text ? () => { document.getElementById('sentimentText').textContent = `${results.sentiment.text} (${results.sentiment.percentage || 'N/A'}%)`; } : null,
            readabilitySection: results.readability.level ? () => { document.getElementById('readabilityText').textContent = `${results.readability.level} (Pontuação: ${results.readability.score || 'N/A'})`; } : null,
            titlesSection: results.suggestedTitles && results.suggestedTitles.length > 0 ? () => { document.getElementById('titlesList').innerHTML = results.suggestedTitles.map(title => `<li>${title}</li>`).join(''); } : null,
            toneSection: results.toneVariation ? () => { document.getElementById('toneText').textContent = results.toneVariation; } : null,
        };
        for (const sectionId in sections) {
            const el = document.getElementById(sectionId);
            if (sections[sectionId]) {
                sections[sectionId]();
                el.style.display = 'block';
            } else {
                el.style.display = 'none';
            }
        }
    }
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const textToCopy = document.getElementById('result-content').innerText;
            navigator.clipboard.writeText(textToCopy)
                .then(() => alert('Análise copiada para a área de transferência!'))
                .catch(err => console.error('Erro ao copiar: ', err));
        });
    }
}