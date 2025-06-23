/**
 * Redireciona para a página da ferramenta clicada.
 * @param {string} tool - O nome da ferramenta (ex: 'legendas', 'roteiros').
 * @param {Event} event - O objeto do evento de clique.
 */
function redirectTo(tool, event) {
    const card = event.currentTarget;
    
    // Animação de clique
    card.style.transform = 'scale(0.98)';
    card.style.transition = 'transform 0.1s ease';

    // URLs relativas para cada ferramenta
    // Certifique-se de que esses caminhos correspondem à estrutura de pastas do seu projeto.
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
            // Caso uma ferramenta ainda não esteja implementada
            alert(`A ferramenta "${tool}" estará disponível em breve!`);
            card.style.transform = 'scale(1)'; // Reseta a animação
        }
    }, 150);
}

/**
 * Efeito de parallax suave para o fundo.
 * Usa requestAnimationFrame para otimizar a performance.
 */
let isTicking = false;

function subtleParallax() {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.1; // Taxa de movimento mais sutil
    const bgAnimation = document.querySelector('.bg-animation');
    
    if (bgAnimation) {
        bgAnimation.style.transform = `translateY(${rate}px)`;
    }
    
    isTicking = false;
}

function requestTick() {
    if (!isTicking) {
        requestAnimationFrame(subtleParallax);
        isTicking = true;
    }
}

// Adiciona o listener de scroll apenas uma vez
window.addEventListener('scroll', requestTick, { passive: true });
