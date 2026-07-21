const bloco = document.querySelector(".bloco-paginas");
const paginas = [];

// Aumente para quantas páginas você quiser! Cada número aqui representa uma folha física.
const TOTAL_PAGINAS = 80; 

// Agora cada objeto representa uma FOLHA inteira. O conteúdo vai apenas na FRENTE.
const conteudoBestiario = [

];

// 1. Criação Dinâmica das Páginas com Aleatoriedade
for(let i = 0; i < TOTAL_PAGINAS; i++){
    const folha = document.createElement("div");
    folha.className = "folha";
    folha.dataset.numero = i;
    
    // Empilhamento visual inicial
    folha.style.zIndex = TOTAL_PAGINAS - i;

    // Se não houver conteúdo definido no array, cria uma página em branco padrão
    const info = conteudoBestiario[i] || { frente: `<h2>Página ${i + 1}</h2><p>Anotações em branco...</p>` };
    
    // IMPORTANTE: O HTML do verso agora nasce totalmente vazio, sem h2 ou p!
    folha.innerHTML = `
        <div class="folha-frente">${info.frente}</div>
        <div class="folha-verso"></div>
    `;

    // --- TOQUE DE ALEATORIEDADE ---
    const posXFrente = Math.floor(Math.random() * 100);
    const posYFrente = Math.floor(Math.random() * 100);
    const posXVerso = Math.floor(Math.random() * 100);
    const posYVerso = Math.floor(Math.random() * 100);

    const frenteDiv = folha.querySelector(".folha-frente");
    const versoDiv = folha.querySelector(".folha-verso");

    frenteDiv.style.backgroundPosition = `center, center, ${posXFrente}% ${posYFrente}%, center`;
    versoDiv.style.backgroundPosition = `center, center, ${posXVerso}% ${posYVerso}%, center`;

    frenteDiv.style.transform = "none";
    versoDiv.style.transform = "rotateY(180deg)";

    const tremorFrente = (Math.random() * 0.6 - 0.3).toFixed(1);
    frenteDiv.style.textShadow = `0px ${tremorFrente}px 0.2px rgba(43, 31, 29, 0.8)`;
    // --------------------------------------

    bloco.appendChild(folha);

    paginas.push({
        elemento: folha,
        virada: false,
        angulo: 0,
        velocidade: 0,
        animando: false
    });

    // Evento de Clique Individual (continua idêntico)
    folha.addEventListener("click", () => {
        if (!cena.livro.aberto) return;
        if (paginas.some(p => p.animando)) return;

        const pag = paginas[i];

        if (!pag.virada) {
            pag.virada = true;
            pag.animando = true;
        } else {
            pag.virada = false;
            pag.animando = true;
        }
    });
}

// Selecionamos o bloco de páginas estáticas do fundo para podermos escondê-lo
const paginasEstaticas = document.querySelector(".paginas");

function atualizarBlocoPaginas() {
    paginasEstaticas.style.transition = "opacity 0.3s ease"; // Suaviza o sumiço das páginas do fundo

    paginas.forEach((pag, index) => {
        if (!pag.animando) return;

        let alvo = pag.virada ? 180 : 0;

        let forca = (alvo - pag.angulo) * 0.05;
        pag.velocidade += forca;
        pag.velocidade *= 0.62;
        pag.angulo += pag.velocidade;

        pag.elemento.style.transform = `rotateY(${-pag.angulo}deg)`;

        if (pag.angulo > 90) {
            pag.elemento.style.zIndex = index + 1;
        } else {
            pag.elemento.style.zIndex = TOTAL_PAGINAS - index;
        }

        if (
            Math.abs(alvo - pag.angulo) < 0.5 &&
            Math.abs(pag.velocidade) < 0.5
        ) {
            pag.angulo = alvo;
            pag.elemento.style.transform = `rotateY(${-alvo}deg)`;
            pag.velocidade = 0;
            pag.animando = false;
        }
    });

    // --- NOVA LÓGICA DE DETECÇÃO ---
    // Verifica se TODAS as páginas do livro estão viradas (ou seja, se a última página foi para a esquerda)
    const todasViradas = paginas.every(pag => pag.virada);

    if (todasViradas) {
        // Se todas os folhas móveis foram para a esquerda, esconde o bloco de fundo estático
        paginasEstaticas.style.opacity = "0";
        paginasEstaticas.style.pointerEvents = "none";
    } else {
        // Se pelo menos uma página voltou para a direita, exibe as páginas de fundo novamente
        paginasEstaticas.style.opacity = "1";
        paginasEstaticas.style.pointerEvents = "auto";
    }
}