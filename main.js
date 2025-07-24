/**
 * Redireciona para a página da ferramenta clicada.
 * @param {string} tool - O nome da ferramenta (ex: 'legendas', 'roteiros').
 * @param {Event} event - O objeto do evento de clique.
 */
function redirectTo(tool, event) {
    const card = event.currentTarget;
    
    // Animação de clique
    card.style.transform = 'scale(0.97) translateY(-5px)';
    card.style.transition = 'transform 0.1s ease';

    // URLs relativas para cada ferramenta
    const urls = {
        'legendas': './CaptionGeneratorPage/CaptionGenerator.html',
        'roteiros': './ScriptGeneratorPage/ScriptGenerator.html',
        'design': './VisualCopyGeneratorPage/VisualCopyGenerator.html',
        'materias': './ContentProPage/ContentPro.html',
        'analise': './AnalisePage/Analise.html',
        'entrevista': './EntrevistaPage/EntrevistaPage.html'
    };
    
    // Redireciona após um pequeno delay para a animação ser visível
    setTimeout(() => {
        if (urls[tool]) {
            window.location.href = urls[tool];
        } else {
            alert(`A ferramenta "${tool}" estará disponível em breve!`);
            card.style.transform = 'translateY(-10px)'; // Retorna ao estado de hover
        }
    }, 150);
}