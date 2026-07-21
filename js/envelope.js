// --- SISTEMA INTERATIVO DO ENVELOPE E FOTO MÓVEL ---
document.addEventListener("DOMContentLoaded", () => {
    // Garantir que a referência do Storage e Realtime Database existam
    const storage = firebase.storage();
    const fotosRef = firebase.database().ref("fotos_bestiario");

    const envelopeContainer = document.getElementById("envelopeMesa");
    const uploadFotoEnvelope = document.getElementById("uploadFotoEnvelope");

    if (!envelopeContainer || !uploadFotoEnvelope) return;

    // Clique no envelope: Abre, fecha ou ativa o upload (RESTAURADO)
    envelopeContainer.addEventListener("click", (e) => {
        e.stopPropagation();

        if (envelopeContainer.classList.contains("aberto") && e.target.closest(".conteudo-interno")) {
            uploadFotoEnvelope.click();
            return;
        }

        envelopeContainer.classList.toggle("aberto");
    });

    // Fecha o envelope se clicar fora
    document.addEventListener("click", (e) => {
        if (!e.target.closest("#envelopeMesa")) {
            envelopeContainer.classList.remove("aberto");
        }
    });

    // Quando o usuário escolhe a imagem do PC (Comprimindo e salvando)
    uploadFotoEnvelope.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
            const tipoArquivo = file.type;
            const idUnica = "foto_" + Date.now(); // Gera uma ID única baseada no tempo
            
            // Comprime a imagem antes de criar a foto móvel
            const imagemComprimida = await comprimirImagem(file, 800, 0.7);

            criarFotoMovel(imagemComprimida, tipoArquivo, idUnica);
            salvarEstadoFotos(); // Salva no localStorage imediatamente
            
            uploadFotoEnvelope.value = ""; 
        }
    });
});

// --- SISTEMA DE GERAÇÃO E GERENCIAMENTO DA FOTO MÓVEL ---

let painelAtivo = null;

// CORRIGIDO: Agora a assinatura aceita o parâmetro decoracaoSalva para repassar corretamente
function criarFotoMovel(srcImagem, tipoArquivo, idUnica, decoracaoSalva = null) {
    const container = document.createElement("div");
    container.className = "foto-container";
    container.style.left = "45%";
    container.style.top = "35%";
    container.dataset.id = idUnica; // Identificador da foto para o salvamento
    container.dataset.tipoArquivo = tipoArquivo; // Guarda o tipo para o re-render

    const img = document.createElement("img");
    img.src = srcImagem;
    img.className = (tipoArquivo === "image/png") ? "estilo-desenho" : "estilo-polaroid";
    
    container.appendChild(img);

    // CORRIGIDO: Passando a variável correta aceita na assinatura da função
    if (tipoArquivo !== "image/png") {
        adicionarDecoracao(container, decoracaoSalva);
    }

    document.body.appendChild(container);
    
    container.addEventListener("click", (e) => {
        e.stopPropagation();
        abrirPainelControle(container, e.clientX, e.clientY);
    });
}

function adicionarDecoracao(container, decoracaoSalva = null) {
    const tipo = decoracaoSalva ? decoracaoSalva.tipo : (Math.random() > 0.5 ? "fita" : "grampo");
    const noise = () => Math.random() * 8 - 4;

    // Guarda o tipo escolhido no HTML para podermos ler depois na hora de salvar
    container.dataset.tipoDecoracao = tipo;

    if (tipo === "fita") {
        const configs = {
            topo:   { classe: "fita-topo",          w: "55px", h: "16px", trans: "translateX(-50%)", rot: 0 + noise() },
            base:   { classe: "fita-base",          w: "55px", h: "16px", trans: "translateX(-50%)", rot: 0 + noise() },
            esqSup: { classe: "fita-canto-esq-sup", w: "50px", h: "16px", trans: "translate(-50%, -50%)", rot: -45 + noise() },
            dirSup: { classe: "fita-canto-dir-sup", w: "50px", h: "16px", trans: "translate(50%, -50%)", rot: 45 + noise() },
            esqInf: { classe: "fita-canto-esq-inf", w: "50px", h: "16px", trans: "translate(-50%, 50%)", rot: 45 + noise() },
            dirInf: { classe: "fita-canto-dir-inf", w: "50px", h: "16px", trans: "translate(50%, 50%)", rot: -45 + noise() }
        };

        // Lista de variações de fita (incluindo a nova de 2 cantos alternados)
        const variacoesFita = [
            [configs.topo],                                     // Só no topo
            [configs.topo, configs.base],                        // Topo e Base
            [configs.esqSup, configs.dirSup],                    // Dois cantos de cima
            [configs.esqSup, configs.dirInf],                    // Diagonal oposta (Esq Sup e Dir Inf)
            [configs.dirSup, configs.esqInf],                    // Diagonal oposta (Dir Sup e Esq Inf)
            [configs.esqSup, configs.dirSup, configs.esqInf, configs.dirInf] // Nos 4 cantos
        ];

        // Se tiver o padrão salvo (o índice do array), usa ele. Se não, sorteia.
        let indicePadrao = decoracaoSalva ? decoracaoSalva.padrao : Math.floor(Math.random() * variacoesFita.length);
        container.dataset.padraoDecoracao = indicePadrao; // Guarda o índice para o salvamento

        const padraoEscolhido = variacoesFita[indicePadrao];

        padraoEscolhido.forEach(conf => {
            const fita = document.createElement("div");
            fita.className = `decoracao-fita ${conf.classe}`;
            fita.style.width = conf.w;
            fita.style.height = conf.h;
            fita.style.transform = `${conf.trans} rotate(${conf.rot}deg)`;
            container.appendChild(fita);
        });

    } else {
        // Grampos limpos: Apenas variações lineares e horizontais (topo e/ou base)
        const configs = {
            topo: { classe: "grampo-topo", w: "32px", h: "5px", trans: "translateX(-50%)", rot: 0 + noise() },
            base: { classe: "grampo-base", w: "32px", h: "5px", trans: "translateX(-50%)", rot: 0 + noise() }
        };

        const variacoesGrampo = [
            [configs.topo],               // Um grampo central no topo
            [configs.base],               // Um grampo central na base
            [configs.topo, configs.base]  // Grampo em cima e embaixo simultaneamente
        ];

        // Mesma lógica para o índice do grampo
        let indicePadrao = decoracaoSalva ? decoracaoSalva.padrao : Math.floor(Math.random() * variacoesGrampo.length);
        container.dataset.padraoDecoracao = indicePadrao;

        const padraoEscolhido = variacoesGrampo[indicePadrao];

        padraoEscolhido.forEach(conf => {
            const grampo = document.createElement("div");
            grampo.className = `decoracao-grampo ${conf.classe}`;
            grampo.style.width = conf.w;
            grampo.style.height = conf.h;
            grampo.style.transform = `${conf.trans} rotate(${conf.rot}deg)`;
            container.appendChild(grampo);
        });
    }
}

// CRIA E GERENCIA O PAINEL DE OPÇÕES
function abrirPainelControle(elementoFoto, clickX, clickY) {
    // Se já houver um painel aberto, removemos ele antes de criar o novo
    fecharPainelAtivo();

    const painel = document.createElement("div");
    painel.className = "painel-foto";
    
    // Posiciona o painel ligeiramente deslocado do clique
    painel.style.left = `${clickX + 15}px`;
    painel.style.top = `${clickY + 15}px`;

    // Verifica se a foto já está fixada no momento
    const estaFixada = elementoFoto.dataset.bloqueada === "true";

    // Botão de Mover
    const btnMover = document.createElement("button");
    btnMover.innerHTML = "✋ Mover Registro";
    if (estaFixada) {
        btnMover.style.opacity = "0.4";
        btnMover.style.cursor = "not-allowed";
    } else {
        btnMover.addEventListener("click", (e) => {
            e.stopPropagation();
            fecharPainelAtivo();
            ativarModoArrastar(elementoFoto);
        });
    }

    // Botão DINÂMICO: Fixar / Desafixar
    const btnFixar = document.createElement("button");
    btnFixar.innerHTML = estaFixada ? "🔓 Desafixar da Página" : "📌 Fixar na Página";
    btnFixar.addEventListener("click", (e) => {
        e.stopPropagation();
        fecharPainelAtivo();
        
        if (estaFixada) {
            desafixarFotoDaPagina(elementoFoto);
        } else {
            colarFotoNaPaginaAtiva(elementoFoto);
        }
    });

    // Botão de Redimensionar
    const btnRedimensionar = document.createElement("button");
    btnRedimensionar.innerHTML = "📐 Redimensionar Foto";
    if (estaFixada) {
        btnRedimensionar.style.opacity = "0.4";
        btnRedimensionar.style.cursor = "not-allowed";
    } else {
        btnRedimensionar.addEventListener("click", (e) => {
            e.stopPropagation();
            fecharPainelAtivo();
            ativarModoRedimensionar(elementoFoto);
        });
    }

    // Botão de Girar por Scroll
    const btnGirar = document.createElement("button");
    btnGirar.innerHTML = "🔄 Modo Girar (Scroll)";
    if (estaFixada) {
        btnGirar.style.opacity = "0.4";
        btnGirar.style.cursor = "not-allowed";
    } else {
        btnGirar.addEventListener("click", (e) => {
            e.stopPropagation();
            fecharPainelAtivo();
            ativarModoGirarScroll(elementoFoto);
        });
    }

    // Botão de Excluir Arquivo
    const btnExcluir = document.createElement("button");
    btnExcluir.innerHTML = "🗑️ Excluir Arquivo";
    btnExcluir.style.color = "#ff4d4d"; 
    btnExcluir.addEventListener("click", (e) => {
        e.stopPropagation();
        fecharPainelAtivo(); 
        excluirFotoMovel(elementoFoto); 
    });

    const btnFuturo = document.createElement("button");
    btnFuturo.innerHTML = "⚙️ Opção Futura...";
    btnFuturo.style.opacity = "0.5";
    btnFuturo.style.cursor = "not-allowed";

    painel.appendChild(btnMover);
    painel.appendChild(btnGirar);
    painel.appendChild(btnRedimensionar);
    painel.appendChild(btnFixar);
    painel.appendChild(btnExcluir);
    painel.appendChild(btnFuturo);
    document.body.appendChild(painel);
    
    painelAtivo = painel;
}

// FECHAR O PAINEL
function fecharPainelAtivo() {
    if (painelAtivo) {
        painelAtivo.remove();
        painelAtivo = null;
    }
}

// Fecha o painel se clicar em qualquer lugar da tela
document.addEventListener("click", () => {
    fecharPainelAtivo();
});

function ativarModoArrastar(elemento) {
    elemento.classList.add("arrastando");

    // 1. Cria um escudo invisível que cobre toda a tela
    const escudo = document.createElement("div");
    escudo.style.position = "fixed";
    escudo.style.top = "0";
    escudo.style.left = "0";
    escudo.style.width = "100vw";
    escudo.style.height = "100vh";
    escudo.style.zIndex = "999"; 
    escudo.style.background = "transparent";
    escudo.style.cursor = "grabbing";
    document.body.appendChild(escudo);

    // 2. Função de cálculo de movimento
    function moverElemento(e) {
        const largura = elemento.offsetWidth;
        const altura = elemento.offsetHeight;
        
        elemento.style.left = `${e.clientX - largura / 2}px`;
        elemento.style.top = `${e.clientY - altura / 2}px`;
    }

    escudo.addEventListener("mousemove", moverElemento);

    // 3. Quando clica no escudo, solta a foto e remove o escudo
    function soltarElemento(e) {
        e.stopPropagation();
        e.preventDefault();

        escudo.removeEventListener("mousemove", moverElemento);
        escudo.removeEventListener("click", soltarElemento);
        escudo.remove();

        elemento.classList.remove("arrastando");
        salvarEstadoFotos(); // Corrigido para salvar após soltar de fato
    }

    // O delay de 50ms evita fechar o escudo no mesmo instante do clique
    setTimeout(() => {
        escudo.addEventListener("click", soltarElemento);
    }, 50);
}

// FUNÇÃO PARA PRENDER A FOTO NA PÁGINA REAL DO LIVRO
function colarFotoNaPaginaAtiva(elementoFoto) {
    const rectFoto = elementoFoto.getBoundingClientRect();
    const centroFotoX = rectFoto.left + rectFoto.width / 2;
    const centroFotoY = rectFoto.top + rectFoto.height / 2;

    if (typeof paginas === "undefined" || paginas.length === 0) {
        alert("Erro: O sistema de controle de páginas não foi inicializado.");
        return;
    }

    let paginaEsquerdaVisivel = null;
    let paginaDireitaVisivel = null;

    // LADO ESQUERDO: Encontra a ÚLTIMA página que foi virada (true)
    let indexUltimaVirada = -1;
    for (let i = 0; i < paginas.length; i++) {
        if (paginas[i].virada) indexUltimaVirada = i;
    }
    if (indexUltimaVirada !== -1) {
        paginaEsquerdaVisivel = paginas[indexUltimaVirada].elemento.querySelector(".folha-verso");
    } else {
        paginaEsquerdaVisivel = document.querySelector(".interior-capa");
    }

    // LADO DIREITO: Encontra a PRIMEIRA página que NÃO foi virada (false)
    let primeiroIndexNaoVirado = -1;
    for (let i = 0; i < paginas.length; i++) {
        if (!paginas[i].virada) {
            primeiroIndexNaoVirado = i;
            break;
        }
    }
    if (primeiroIndexNaoVirado !== -1) {
        paginaDireitaVisivel = paginas[primeiroIndexNaoVirado].elemento.querySelector(".folha-frente");
    } else {
        paginaDireitaVisivel = document.querySelector(".paginas"); 
    }

    let paginaAlvo = null;

    const rectEsq = paginaEsquerdaVisivel ? paginaEsquerdaVisivel.getBoundingClientRect() : null;
    const rectDir = paginaDireitaVisivel ? paginaDireitaVisivel.getBoundingClientRect() : null;

    if (rectEsq && rectDir) {
        const centroEsqX = rectEsq.left + rectEsq.width / 2;
        const centroDirX = rectDir.left + rectDir.width / 2;

        const distanciaEsquerda = Math.abs(centroFotoX - centroEsqX);
        const distanciaDireita = Math.abs(centroFotoX - centroDirX);

        paginaAlvo = (distanciaEsquerda < distanciaDireita) ? paginaEsquerdaVisivel : paginaDireitaVisivel;
    } else {
        paginaAlvo = paginaDireitaVisivel || paginaEsquerdaVisivel;
    }

    if (!paginaAlvo) {
        alert("Não foi possível detectar a página aberta.");
        return;
    }

    paginaAlvo.appendChild(elementoFoto);

    elementoFoto.style.position = "absolute";
    elementoFoto.style.left = "0px";
    elementoFoto.style.top = "0px";

    const rectZeroPapel = elementoFoto.getBoundingClientRect();

    const posXCorreta = rectFoto.left - rectZeroPapel.left;
    const posYCorreta = rectFoto.top - rectZeroPapel.top;

    elementoFoto.style.left = `${posXCorreta}px`;
    elementoFoto.style.top = `${posYCorreta}px`;
    
    elementoFoto.classList.remove("arrastando");

    let anguloSalvo = parseFloat(elementoFoto.dataset.angulo);
    if (isNaN(anguloSalvo)) anguloSalvo = -3;
    elementoFoto.style.transform = `rotate(${anguloSalvo}deg)`; 
    
    elementoFoto.style.zIndex = "10"; 

    if (elementoFoto.dataset.larguraSalva) {
        elementoFoto.style.width = elementoFoto.dataset.larguraSalva;
        elementoFoto.style.height = "auto";
    }

    const alcaAtiva = document.querySelector(".alca-redimensionar");
    if (alcaAtiva) alcaAtiva.remove();

    if (elementoFoto.classList.contains("estilo-desenho")) {
        elementoFoto.style.boxShadow = "none";
        elementoFoto.style.filter = "drop-shadow(1px 1px 2px rgba(0,0,0,0.3))"; 
    } else {
        elementoFoto.style.boxShadow = "none";
    }

    elementoFoto.dataset.bloqueada = "true";
    salvarEstadoFotos();
}

function desafixarFotoDaPagina(elementoFoto) {
    const rectFoto = elementoFoto.getBoundingClientRect();

    document.body.appendChild(elementoFoto);

    elementoFoto.style.position = "fixed";
    elementoFoto.style.left = `${rectFoto.left}px`;
    elementoFoto.style.top = `${rectFoto.top}px`;
    elementoFoto.style.zIndex = "998"; 

    elementoFoto.dataset.bloqueada = "false";
    
    // Restaura o filtro e sombra originais de mesa
    if (elementoFoto.classList.contains("estilo-desenho")) {
        elementoFoto.style.filter = "none";
    } else {
        elementoFoto.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.5)";
    }
    
    salvarEstadoFotos();
}

// SISTEMA DE GIRO POR SCROLL
function abrirModoArrastar(elemento) { 
    ativarModoArrastar(elemento);
}

function ativarModoGirarScroll(elementoFoto) {
    const cursorOriginalBody = document.body.style.cursor;
    document.body.style.cursor = "ew-resize";
    elementoFoto.style.cursor = "ew-resize";

    if (elementoFoto.classList.contains("estilo-desenho")) {
        elementoFoto.style.filter = "drop-shadow(0 0 8px #ffb03a)";
    } else {
        elementoFoto.style.boxShadow = "0 0 25px rgba(255, 176, 58, 0.6)";
    }

    function processarScroll(e) {
        e.preventDefault(); 
        
        let anguloAtual = parseFloat(elementoFoto.dataset.angulo);
        if (isNaN(anguloAtual)) anguloAtual = -3;

        let sensibilidade = 5;
        let novoAngulo = anguloAtual;

        if (e.deltaY < 0) {
            novoAngulo += sensibilidade; 
        } else {
            novoAngulo -= sensibilidade; 
        }

        elementoFoto.dataset.angulo = novoAngulo;
        elementoFoto.style.transform = `rotate(${novoAngulo}deg)`;
    }

    window.addEventListener("wheel", processarScroll, { passive: false });

    function confirmarGiro(e) {
        e.preventDefault();
        e.stopPropagation();

        window.removeEventListener("wheel", processarScroll);
        document.removeEventListener("click", confirmarGiro);

        document.body.style.cursor = cursorOriginalBody;
        elementoFoto.style.cursor = "pointer";
        
        if (elementoFoto.classList.contains("estilo-desenho")) {
            elementoFoto.style.filter = "none";
        } else {
            elementoFoto.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.5)";
        }
        
        salvarEstadoFotos();
    }

    setTimeout(() => {
        document.addEventListener("click", confirmarGiro);
    }, 100);
}

// SISTEMA DE REDIMENSIONAR
function abrirModoRedimensionar(elemento) { // compatibilidade antiga caso use
    ativarModoRedimensionar(elemento);
}

function ativarModoRedimensionar(elementoFoto) {
    const alcaAntiga = document.querySelector(".alca-redimensionar");
    if (alcaAntiga) alcaAntiga.remove();

    const alca = document.createElement("div");
    alca.className = "alca-redimensionar";
    alca.innerHTML = "⤧"; 
    
    alca.style.position = "absolute";
    alca.style.zIndex = "10000";
    alca.style.cursor = "ne-resize"; 
    alca.style.background = "#ffb03a";
    alca.style.color = "#000";
    alca.style.fontSize = "12px";
    alca.style.fontWeight = "bold";
    alca.style.width = "20px";
    alca.style.height = "20px";
    alca.style.display = "flex";
    alca.style.alignItems = "center";
    alca.style.justifyContent = "center";
    alca.style.borderRadius = "50%";
    alca.style.border = "2px solid #fff";
    alca.style.boxShadow = "0 2px 5px rgba(0,0,0,0.4)";

    function reposicionarAlca() {
        const rect = elementoFoto.getBoundingClientRect();
        alca.style.left = `${rect.right - 10}px`;
        alca.style.top = `${rect.top - 10}px`;
    }
    reposicionarAlca();
    document.body.appendChild(alca);

    if (elementoFoto.classList.contains("estilo-desenho")) {
        elementoFoto.style.filter = "drop-shadow(0 0 8px #ffb03a)";
    } else {
        elementoFoto.style.boxShadow = "0 0 25px rgba(255, 176, 58, 0.6)";
    }

    let largInicial = elementoFoto.offsetWidth;
    let xInicial = 0;

    function iniciarArrastoAlca(e) {
        e.preventDefault();
        e.stopPropagation();
        
        largInicial = elementoFoto.offsetWidth;
        xInicial = e.clientX;

        window.addEventListener("mousemove", arrastandoAlca);
        window.addEventListener("mouseup", pararArrastoAlca);
    }

    function arrastandoAlca(e) {
        const deltaX = e.clientX - xInicial;
        let novaLargura = largInicial + deltaX;

        if (novaLargura < 100) novaLargura = 100;
        if (novaLargura > 500) novaLargura = 500;

        elementoFoto.style.width = `${novaLargura}px`;
        elementoFoto.style.height = "auto"; 
        
        reposicionarAlca();
    }

    function pararArrastoAlca() {
        window.removeEventListener("mousemove", arrastandoAlca);
        window.removeEventListener("mouseup", pararArrastoAlca);
    }

    alca.addEventListener("mousedown", iniciarArrastoAlca);

    function confirmarTamanho(e) {
        if (e.target === alca || e.target === elementoFoto) return; 

        e.preventDefault();
        e.stopPropagation();

        document.removeEventListener("click", confirmarTamanho);
        alca.remove(); 

        if (elementoFoto.classList.contains("estilo-desenho")) {
            elementoFoto.style.filter = "none";
        } else {
            elementoFoto.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.5)";
        }
        
        elementoFoto.dataset.larguraSalva = elementoFoto.style.width;
        salvarEstadoFotos();
    }

    setTimeout(() => {
        document.addEventListener("click", confirmarTamanho);
    }, 100);
}

// FUNÇÃO PARA DELETAR O REGISTRO
function excluirFotoMovel(elementoFoto) {
    const confirmar = confirm("Tem certeza de que deseja destruir este registro permanentemente?");
    if (!confirmar) return;

    const alcaAtiva = document.querySelector(".alca-redimensionar");
    if (alcaAtiva) alcaAtiva.remove();

    elementoFoto.remove();
    salvarEstadoFotos();
}

// --- SISTEMA DE PERSISTÊNCIA ---

function salvarEstadoFotos() {
    const fotos = [];
    document.querySelectorAll(".foto-container").forEach(foto => {
        const estaFixada = foto.dataset.bloqueada === "true";
        let indexPaginaPai = null;
        let ladoFolha = null; 

        if (estaFixada && foto.parentElement && typeof paginas !== "undefined") {
            for (let i = 0; i < paginas.length; i++) {
                if (paginas[i].elemento.contains(foto)) {
                    indexPaginaPai = i;
                    ladoFolha = foto.parentElement.classList.contains("folha-verso") ? "verso" : "frente";
                    break;
                }
            }
        }

        fotos.push({
            id: foto.dataset.id,
            src: foto.querySelector("img").src,
            tipoArquivo: foto.dataset.tipoArquivo,
            left: foto.style.left,
            top: foto.style.top,
            width: foto.style.width,
            angulo: foto.dataset.angulo || "-3",
            bloqueada: foto.dataset.bloqueada || "false",
            indexPaginaPai: indexPaginaPai,
            ladoFolha: ladoFolha,
            decoracao: foto.dataset.tipoDecoracao ? {
                tipo: foto.dataset.tipoDecoracao,
                padrao: parseInt(foto.dataset.padraoDecoracao)
            } : null
        });
    });

    // Salva na nuvem (Firebase Database)
    if (typeof firebase !== "undefined" && firebase.database) {
        firebase.database().ref("fotos_bestiario").set(fotos);
    }
    
    // Backup local
    localStorage.setItem("salvamento_fotos_bestiario", JSON.stringify(fotos));
}

function carregarFotosSalvas() {
    if (typeof firebase !== "undefined" && firebase.database) {
        firebase.database().ref("fotos_bestiario").once("value").then((snapshot) => {
            const fotos = snapshot.val();
            if (fotos) {
                renderizarFotosSalvas(fotos);
            } else {
                // Se não houver nada no Firebase, tenta o backup local
                const dadosLocais = localStorage.getItem("salvamento_fotos_bestiario");
                if (dadosLocais) renderizarFotosSalvas(JSON.parse(dadosLocais));
            }
        });
    } else {
        const dadosLocais = localStorage.getItem("salvamento_fotos_bestiario");
        if (dadosLocais) renderizarFotosSalvas(JSON.parse(dadosLocais));
    }
}

// Função auxiliar para re-desenhar as fotos na tela
function renderizarFotosSalvas(fotos) {
    // Evita duplicar fotos limpando as antigas antes de carregar
    document.querySelectorAll(".foto-container").forEach(el => el.remove());

    fotos.forEach(dadosFoto => {
        criarFotoMovel(dadosFoto.src, dadosFoto.tipoArquivo, dadosFoto.id, dadosFoto.decoracao);
        
        const foto = document.querySelector(`[data-id="${dadosFoto.id}"]`);
        if (!foto) return;

        foto.style.left = dadosFoto.left;
        foto.style.top = dadosFoto.top;
        if (dadosFoto.width) {
            foto.style.width = dadosFoto.width;
            foto.style.height = "auto";
            foto.dataset.larguraSalva = dadosFoto.width;
        }
        foto.dataset.angulo = dadosFoto.angulo;
        foto.style.transform = `rotate(${dadosFoto.angulo}deg)`;
        foto.dataset.bloqueada = dadosFoto.bloqueada;

        if (dadosFoto.bloqueada === "true" && dadosFoto.indexPaginaPai !== null && typeof paginas !== "undefined") {
            const estruturaFolha = paginas[dadosFoto.indexPaginaPai];
            if (estruturaFolha) {
                const seletorLado = dadosFoto.ladoFolha === "verso" ? ".folha-verso" : ".folha-frente";
                const paginaAlvo = estruturaFolha.elemento.querySelector(seletorLado);

                if (paginaAlvo) {
                    paginaAlvo.appendChild(foto);
                    
                    if (foto.classList.contains("estilo-desenho")) {
                        foto.style.boxShadow = "none";
                        foto.style.filter = "drop-shadow(1px 1px 2px rgba(0,0,0,0.3))";
                    } else {
                        foto.style.boxShadow = "none";
                    }
                }
            }
        }
    });
}

// Inicializa o carregador automático de persistência
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(carregarFotosSalvas, 500);
});
// Função auxiliar para comprimir imagens mantendo a qualidade visual
function comprimirImagem(file, larguraMax = 800, qualidade = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > larguraMax) {
                    height = Math.round((height * larguraMax) / width);
                    width = larguraMax;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const tipoFinal = file.type === "image/png" ? "image/png" : "image/jpeg";
                resolve(canvas.toDataURL(tipoFinal, qualidade));
            };
        };
    });
}