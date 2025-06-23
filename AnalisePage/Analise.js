document.addEventListener('DOMContentLoaded', function() {
    // --- SELETORES DO DOM ---
    const analysisForm = document.getElementById('analysisForm');
    const contentInput = document.getElementById('content');
    const brandIdentityInput = document.getElementById('brandIdentity');
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

    const keywordsSection = document.getElementById('keywordsSection');
    const sentimentSection = document.getElementById('sentimentSection');
    const readabilitySection = document.getElementById('readabilitySection');
    const titlesSection = document.getElementById('titlesSection');
    const toneSection = document.getElementById('toneSection');

    let analysisChart = null;
    let progressionChart = null;

    const API_ENDPOINT = 'https://create-caption-app.onrender.com/analise-content';

    const criteriaNames = [
        "Abertura Impactante",
        "Originalidade e Autenticidade",
        "Clareza da Mensagem",
        "Tom de Voz Coerente",
        "Conexão com o Público-Alvo",
        "Chamada para Ação (CTA) Eficaz",
        "Alinhamento com a Identidade da Marca",
        "Formatação e Legibilidade",
        "Uso Estratégico de Hashtags"
    ];

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

        const brandIdentity = brandIdentityInput.value.trim();
        const analysisPrompt = createGenericPrompt(content, brandIdentity);

        try {
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
        }
    });

    function createGenericPrompt(content, brandIdentity) {
        const identityClause = brandIdentity
            ? `A identidade da marca para referência é: "${brandIdentity}". O critério "Alinhamento com a Identidade da Marca" deve usar esta descrição como base.`
            : "Como a identidade da marca não foi fornecida, avalie o critério 'Alinhamento com a Identidade da Marca' de forma geral, com base na consistência e profissionalismo do próprio conteúdo.";

        return `
            Você é um especialista em marketing e análise de conteúdo. Analise o texto a seguir de forma crítica e construtiva.

            **Conteúdo para Análise:**
            "${content}"

            **${identityClause}**

            **Estrutura da Resposta (Siga este formato rigorosamente):**

            **Análise Geral:**
            [Forneça um resumo de 2-3 frases com sua avaliação geral.]

            **Pontuações dos Critérios:**
            [Liste cada um dos 9 critérios abaixo e atribua a nota de 0 a 5 entre colchetes.]
            Abertura Impactante: [NOTA]
            Originalidade e Autenticidade: [NOTA]
            Clareza da Mensagem: [NOTA]
            Tom de Voz Coerente: [NOTA]
            Conexão com o Público-Alvo: [NOTA]
            Chamada para Ação (CTA) Eficaz: [NOTA]
            Alinhamento com a Identidade da Marca: [NOTA]
            Formatação e Legibilidade: [NOTA]
            Uso Estratégico de Hashtags: [NOTA]

            **Potencial de Engajamento:**
            [Estime em uma porcentagem. Ex: Potencial de Engajamento: [75%]]

            --- ANÁLISE DETALHADA ---

            **Palavras-chave e Relevância:**
            [Liste 3-5 palavras-chave e sua relevância (Alta, Média, Baixa).]

            **Sentimento do Conteúdo:**
            [Classifique o sentimento (Positivo, Neutro, Negativo) e sua intensidade. Ex: Positivo (80%)]

            **Nível de Leitura:**
            [Classifique a complexidade (Fácil, Médio, Difícil) e uma pontuação (0-100, onde 100 é mais fácil).]

            **Títulos Sugeridos:**
            [Proponha 3 títulos alternativos.]

            **Análise de Tom:**
            [Descreva o tom de voz identificado.]
        `;
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
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pontuação',
                    data: dataValues,
                    backgroundColor: 'rgba(190, 242, 100, 0.2)',
                    borderColor: '#bef264',
                    pointBackgroundColor: '#bef264',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#bef264'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { r: { suggestedMin: 0, suggestedMax: 5, ticks: { stepSize: 1, color: '#a1a1aa', backdropColor: 'transparent' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }, angleLines: { color: 'rgba(255, 255, 255, 0.1)' }, pointLabels: { color: '#e4e4e7', font: { size: 12 } } } },
                plugins: { legend: { display: false } }
            }
        });
    }

    function renderProgressionChart(progression) {
        if (progressionChart) progressionChart.destroy();
        progressionChart = new Chart(progressionChartCanvas, {
            type: 'bar',
            data: {
                labels: ['Potencial'],
                datasets: [{
                    label: 'Engajamento',
                    data: [progression],
                    backgroundColor: ['rgba(190, 242, 100, 0.8)'],
                    borderColor: ['#bef264'],
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                scales: { x: { beginAtZero: true, max: 100, ticks: { color: '#a1a1aa', callback: (value) => value + '%' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }, y: { ticks: { color: '#a1a1aa' }, grid: { display: false } } },
                plugins: { legend: { display: false } }
            }
        });
    }
    
    function renderNewSections(results) {
        // Keywords
        if (results.keywords && results.keywords.length > 0) {
            keywordsList.innerHTML = results.keywords.map(item => `<li>${item}</li>`).join('');
            keywordsSection.style.display = 'block';
        } else {
            keywordsSection.style.display = 'none';
        }
        // Sentiment
        if (results.sentiment.text) {
            sentimentText.textContent = `${results.sentiment.text} (${results.sentiment.percentage || 'N/A'}%)`;
            sentimentSection.style.display = 'block';
        } else {
            sentimentSection.style.display = 'none';
        }
        // Readability
        if (results.readability.level) {
            readabilityText.textContent = `${results.readability.level} (Pontuação: ${results.readability.score || 'N/A'})`;
            readabilitySection.style.display = 'block';
        } else {
            readabilitySection.style.display = 'none';
        }
        // Titles
        if (results.suggestedTitles && results.suggestedTitles.length > 0) {
            titlesList.innerHTML = results.suggestedTitles.map(title => `<li>${title}</li>`).join('');
            titlesSection.style.display = 'block';
        } else {
            titlesSection.style.display = 'none';
        }
        // Tone
        if (results.toneVariation) {
            toneText.textContent = results.toneVariation;
            toneSection.style.display = 'block';
        } else {
            toneSection.style.display = 'none';
        }
    }

    function hideNewSections() {
        [keywordsSection, sentimentSection, readabilitySection, titlesSection, toneSection].forEach(section => {
            section.style.display = 'none';
        });
    }

    document.getElementById('copyButton').addEventListener('click', () => {
        const textToCopy = document.getElementById('result-content').innerText;
        navigator.clipboard.writeText(textToCopy)
            .then(() => alert('Análise copiada para a área de transferência!'))
            .catch(err => console.error('Erro ao copiar: ', err));
    });
});
