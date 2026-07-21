(function () {
    const bloco = document.querySelector(".bloco-paginas");
    if (!bloco) return;

    // 1. Cria o elemento da Folha 0
    const folhaRosto = document.createElement("div");
    folhaRosto.className = "folha folha-rosto-standalone";
    folhaRosto.dataset.numero = "0";
    
    // zIndex alto para garantir que ela nasça POR CIMA de todas as páginas do bloco
    folhaRosto.style.zIndex = "1000"; 
    folhaRosto.style.position = "absolute";
    folhaRosto.style.top = "0";
    folhaRosto.style.left = "0";
    folhaRosto.style.width = "100%";
    folhaRosto.style.height = "100%";
    folhaRosto.style.transformOrigin = "left center";

// Conteúdo da Folha de Rosto
    folhaRosto.innerHTML = `
        <div class="folha-frente">
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; text-align: center; padding: 30px; box-sizing: border-box;">
                <p style="
                    margin: 0; 
                    line-height: 1.6; 
                    font-family: inherit; 
                    font-size: 1.6rem; 
                    font-weight: bold;
                ">
                    Criado e catalogado por<br>
                    Rick Richards e Jonathan Saymoor
                </p>
            </div>
        </div>
        <div class="folha-verso">
        </div>
    `;

    // Adiciona a folha ao bloco
    bloco.appendChild(folhaRosto);

    // Estado da física da Folha 0
    let estadoRosto = {
        virada: false,
        angulo: 0,
        velocidade: 0,
        animando: false
    };

    // Evento de Clique da Folha 0
    folhaRosto.addEventListener("click", (e) => {
        e.stopPropagation();

        // Só permite virar se o livro estiver aberto
        if (typeof cena !== "undefined" && !cena.livro.aberto) return;
        if (estadoRosto.animando) return;

        estadoRosto.virada = !estadoRosto.virada;
        estadoRosto.animando = true;
    });

    // Loop de Animação isolado da Folha 0
    function animarFolhaRosto() {
        if (estadoRosto.animando) {
            let alvo = estadoRosto.virada ? 180 : 0;
            let forca = (alvo - estadoRosto.angulo) * 0.05;
            
            estadoRosto.velocidade += forca;
            estadoRosto.velocidade *= 0.62;
            estadoRosto.angulo += estadoRosto.velocidade;

            folhaRosto.style.transform = `rotateY(${-estadoRosto.angulo}deg)`;

            // Quando passar dos 90 graus (meio do caminho), joga ela lá pra trás (zIndex 0)
            // para que fique atrás das páginas esquerdas
            if (estadoRosto.angulo > 90) {
                folhaRosto.style.zIndex = "0";
            } else {
                folhaRosto.style.zIndex = "1000";
            }

            // Fim do movimento
            if (
                Math.abs(alvo - estadoRosto.angulo) < 0.5 &&
                Math.abs(estadoRosto.velocidade) < 0.5
            ) {
                estadoRosto.angulo = alvo;
                folhaRosto.style.transform = `rotateY(${-alvo}deg)`;
                estadoRosto.velocidade = 0;
                estadoRosto.animando = false;
            }
        }

        requestAnimationFrame(animarFolhaRosto);
    }

    animarFolhaRosto();
})();