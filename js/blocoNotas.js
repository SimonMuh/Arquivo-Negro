// --- SISTEMA INTERATIVO DO BLOCO DE NOTAS ---
document.addEventListener("DOMContentLoaded", () => {
    const firebaseConfig = {
    apiKey: "AIzaSyDLEuAbD2syec0iyUIjhgNlGzPFUIB7MNw",
    authDomain: "arquivo-c43f6.firebaseapp.com",
    projectId: "arquivo-c43f6",
    storageBucket: "arquivo-c43f6.firebasestorage.app",
    messagingSenderId: "687445700895",
    appId: "1:687445700895:web:f658b344bf024d1968002a"
    };
    
    // Inicializa apenas se ainda não foi inicializado por outro script
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const database = firebase.database();
    const paginasRef = database.ref("paginas_livro");

    const bloco = document.getElementById("blocoNotasMesa");
    const btnFechar = document.getElementById("btnFecharBloco");
    const btnRegistrar = document.getElementById("btnRegistrarNoLivro");

    // Variáveis de controle para o modo edição
    let modoEdicaoAtivo = false;
    let layoutSendoEditado = null; // Guarda se era layout 0 ou 1

    // Inputs para monitorar e salvar
    const campos = {
        nome: document.getElementById("notaNome"),
        descricao: document.getElementById("notaDescricao"),
        meios: document.getElementById("notaMeios"),
        casos: document.getElementById("notaCasos"),
        fraquezas: document.getElementById("notaFraquezas")
    };

    if (!bloco || !btnFechar) return;

// Criando referência para o rascunho temporário do bloco na nuvem
    const rascunhoRef = database.ref("rascunho_bloco");

    // 1. Carrega os textos e escuta mudanças em tempo real enquanto alguém digita
    function carregarRascunhoBloco() {
        rascunhoRef.on("value", (snapshot) => {
            const dados = snapshot.val();
            if (dados) {
                // Só joga o texto se o jogador não estiver ativamente com o teclado digitando naquele input específico
                if (campos.nome && document.activeElement !== campos.nome) campos.nome.value = dados.nome || "";
                if (campos.descricao && document.activeElement !== campos.descricao) campos.descricao.value = dados.descricao || "";
                if (campos.meios && document.activeElement !== campos.meios) campos.meios.value = dados.meios || "";
                if (campos.casos && document.activeElement !== campos.casos) campos.casos.value = dados.casos || "";
                if (campos.fraquezas && document.activeElement !== campos.fraquezas) campos.fraquezas.value = dados.fraquezas || "";
            }
        });
    }

    // 2. Salva o rascunho atual na nuvem toda vez que o usuário digita algo
    function salvarRascunhoBloco() {
        const dados = {
            nome: campos.nome.value,
            descricao: campos.descricao.value,
            meios: campos.meios.value,
            casos: campos.casos.value,
            fraquezas: campos.fraquezas.value
        };
        rascunhoRef.set(dados);
    }
// === FUNÇÕES DE SINCRONIZAÇÃO EM NUVEM ===
    function salvarTodasAsPaginasDoLivro() {
        const todasAsFolhas = document.querySelectorAll(".bloco-paginas .folha");
        const dadosPaginas = {}; // Mudado de [] para {} para organizar melhor no Firebase

        todasAsFolhas.forEach((folha, index) => {
            const frente = folha.querySelector(".folha-frente");
            if (frente) {
                dadosPaginas["pagina_" + index] = {
                    index: index,
                    html: frente.innerHTML
                };
            }
        });

        // Envia direto para o banco de dados da nuvem
        paginasRef.set(dadosPaginas);
    }

    function carregarPaginasSalvasDoLivro() {
        // "on" faz o seu PC ficar escutando a nuvem em tempo real. Se alguém mudar lá, atualiza no seu PC.
        paginasRef.on("value", (snapshot) => {
            const dadosPaginas = snapshot.val();
            if (!dadosPaginas) return;

            const todasAsFolhas = document.querySelectorAll(".bloco-paginas .folha");

            Object.values(dadosPaginas).forEach(dados => {
                if (todasAsFolhas[dados.index]) {
                    const frente = todasAsFolhas[dados.index].querySelector(".folha-frente");
                    if (frente) {
                        frente.innerHTML = dados.html;
                    }
                }
            });
        });
    }

    // Adiciona o ouvinte de digitação em cada campo
    Object.values(campos).forEach(campo => {
        if (campo) {
            campo.addEventListener("input", salvarRascunhoBloco);
        }
    });

    // 3. Abrir o Bloco de Notas (Animação em duas etapas)
    bloco.addEventListener("click", (e) => {
        if (bloco.classList.contains("bloco-aberto") || e.target.closest("#btnFecharBloco")) {
            return;
        }
        
        bloco.classList.add("capa-aberta");
        
        setTimeout(() => {
            bloco.classList.add("bloco-aberto");
        }, 500);
    });

    // 4. Fechar o Bloco de Notas (Faz o caminho inverso)
    btnFechar.addEventListener("click", (e) => {
        e.stopPropagation();
        
        bloco.classList.remove("bloco-aberto");
        
        setTimeout(() => {
            bloco.classList.remove("capa-aberta");
            modoEdicaoAtivo = false; 
            layoutSendoEditado = null; // Limpa o layout salvo ao fechar
        }, 800);
    });

    // 5. Clique no botão de Registrar
    if (btnRegistrar) {
        btnRegistrar.addEventListener("click", (e) => {
            e.stopPropagation(); 
            
            if (!campos.nome.value.trim()) {
                alert("Dê pelo menos um Nome para a anomalia antes de registrá-la!");
                return;
            }

            const todasAsFolhas = document.querySelectorAll(".bloco-paginas .folha");
            if (todasAsFolhas.length === 0) {
                alert("Nenhuma folha encontrada no livro!");
                return;
            }

            let folhaAbertaEl = null;
            for (let i = 0; i < todasAsFolhas.length; i++) {
                const transform = todasAsFolhas[i].style.transform;
                if (!transform || transform.includes("rotateY(0deg)") || transform === "none") {
                    folhaAbertaEl = todasAsFolhas[i];
                    break;
                }
            }

            if (!folhaAbertaEl) {
                alert("O livro está na contracapa ou totalmente preenchido!");
                return;
            }

            const alvoEscrita = folhaAbertaEl.querySelector(".folha-frente");

            // VERIFICAÇÃO INTELIGENTE
            const textoAtual = alvoEscrita.textContent;
            const jaTemFicha = alvoEscrita.querySelector(".ficha-conteudo-pronto");
            const ehPaginaEmBrancoPadrao = textoAtual.includes("Anotações em branco...");

            if (jaTemFicha) {
                if (modoEdicaoAtivo) {
                    alvoEscrita.innerHTML = "";
                } else {
                    alert("Esta página já contém registros! Se quiser editá-la, use o botão do Lápis. Se quiser criar uma nova ficha, use uma página em branco.");
                    return;
                }
            } else if (!ehPaginaEmBrancoPadrao && textoAtual.trim().length > 0) {
                alert("Esta página já contém registros! Você não pode escrever por cima das anotações existentes.");
                return;
            }

            // 4. CAPTURA OS DADOS DIGITADOS
            const dados = {
                nome: campos.nome.value.trim(),
                descricao: campos.descricao.value.trim() || "Sem descrição disponível...",
                meios: campos.meios.value.trim() || "Desconhecido...",
                casos: campos.casos.value.trim() || "Nenhum caso documentado...",
                fraquezas: campos.fraquezas.value.trim() || "Nenhuma fraqueza conhecida..."
            };

            // 5. DEFINIÇÃO DO LAYOUT (PRESERVA SE FOR EDIÇÃO)
            let escolherLayout;
            if (modoEdicaoAtivo && layoutSendoEditado !== null) {
                escolherLayout = layoutSendoEditado; // Mantém o antigo
            } else {
                escolherLayout = Math.floor(Math.random() * 2); // Sorteia um novo se for ficha nova
            }

            let estruturaHTML = "";

            if (escolherLayout === 0) {
                estruturaHTML = `
                    <div class="ficha-conteudo-pronto layout-bestiario">
                        <div class="linha-topo-bestiario">
                            <h2 class="texto-manuscrito ficha-nome">${dados.nome}</h2>
                            <div class="espaco-foto-criatura">
                                <span class="placeholder-foto">[ Foto da Criatura ]</span>
                            </div>
                        </div>
                        <div class="bloco-descricao-bestiario">
                            <p class="texto-manuscrito"><strong>Descrição:</strong> ${dados.descricao}</p>
                        </div>
                        <div class="colunas-inferiores">
                            <div class="col-meios">
                                <p class="texto-manuscrito"><strong>Comportamentos:</strong> ${dados.meios}</p>
                            </div>
                            <div class="col-fraquezas">
                                <p class="texto-manuscrito"><strong>Fraquezas:</strong> ${dados.fraquezas}</p>
                            </div>
                        </div>
                        <div class="bloco-casos-final">
                            <p class="texto-manuscrito"><strong>Casos Registrados:</strong> ${dados.casos}</p>
                        </div>
                    </div>
                `;
            } else {
                estruturaHTML = `
                    <div class="ficha-conteudo-pronto layout-diario-cheio">
                        <h2 class="texto-manuscrito ficha-nome-diario">${dados.nome}</h2>
                        <div class="espaco-foto-central">
                            <span class="placeholder-foto">[ Foto da Criatura ]</span>
                        </div>
                        <div class="secao-diario">
                            <p class="texto-manuscrito"><strong>Descrição Geral:</strong> ${dados.descricao}</p>
                        </div>
                        <div class="secao-diario">
                            <p class="texto-manuscrito"><strong>Comportamentos:</strong> ${dados.meios}</p>
                        </div>
                        <div class="secao-diario caixa-destaque-fraqueza">
                            <p class="texto-manuscrito"><strong>Ponto Fraco / Neutralização:</strong> ${dados.fraquezas}</p>
                        </div>
                        <div class="secao-diario fim-pagina">
                            <p class="texto-manuscrito"><strong>Casos Conhecidos:</strong> ${dados.casos}</p>
                        </div>
                    </div>
                `;
            }

            alvoEscrita.innerHTML = estruturaHTML;

            // --- SISTEMA DE AUTO-AJUSTE DO TAMANHO DA FONTE ---
            const fichaInserida = alvoEscrita.querySelector(".ficha-conteudo-pronto");
            let tamanhoFonte = 14; 

            while (fichaInserida.scrollHeight > alvoEscrita.clientHeight && tamanhoFonte > 8) {
                tamanhoFonte -= 0.5;
                fichaInserida.querySelectorAll("p.texto-manuscrito").forEach(p => {
                    p.style.fontSize = tamanhoFonte + "px";
                });
            }
            // Salva o estado atual do livro para não perder ao recarregar
            salvarTodasAsPaginasDoLivro();
            // Limpa o formulário, reseta flags e o localStorage
            Object.values(campos).forEach(campo => { if(campo) campo.value = ""; });
            rascunhoRef.set(null); // Limpa o rascunho na nuvem ao registrar
            modoEdicaoAtivo = false;
            layoutSendoEditado = null;

            // Fecha o bloco de notas de forma suave
            bloco.classList.remove("bloco-aberto");
            setTimeout(() => {
                bloco.classList.remove("capa-aberta");
            }, 800);
        });
    }

    // Inicializa carregando o rascunho
    carregarRascunhoBloco();
    // Inicializa carregando o conteúdo salvo das páginas do livro
    carregarPaginasSalvasDoLivro();

    // --- 6. FUNCIONALIDADE DO LÁPIS E DA BORRACHA ---
    const btnLapis = document.getElementById("btn-lapis");
    const btnBorracha = document.getElementById("btn-borracha");

    function obterFolhaFrenteAberta() {
        const todasAsFolhas = document.querySelectorAll(".bloco-paginas .folha");
        for (let i = 0; i < todasAsFolhas.length; i++) {
            const transform = todasAsFolhas[i].style.transform;
            if (!transform || transform.includes("rotateY(0deg)") || transform === "none") {
                return {
                    elemento: todasAsFolhas[i].querySelector(".folha-frente"),
                    numero: i
                };
            }
        }
        return null;
    }

    // CLIQUE NO LÁPIS (EDITAR PÁGINA)
    if (btnLapis) {
        btnLapis.addEventListener("click", (e) => {
            e.stopPropagation();

            const folhaAtual = obterFolhaFrenteAberta();
            if (!folhaAtual) {
                alert("Abra o livro em uma página preenchida para editar!");
                return;
            }

            const ficha = folhaAtual.elemento.querySelector(".ficha-conteudo-pronto");
            if (!ficha) {
                alert("Esta página está em branco! Não há nada para editar.");
                return;
            }

            // Ativa a flag global de edição
            modoEdicaoAtivo = true;

            // 🟢 DETECTA E SALVA O LAYOUT ATUAL ANTES DE APAGAR:
            if (ficha.classList.contains("layout-bestiario")) {
                layoutSendoEditado = 0;
            } else if (ficha.classList.contains("layout-diario-cheio")) {
                layoutSendoEditado = 1;
            } else {
                layoutSendoEditado = 0; // Fallback de segurança
            }

            // 1. Resgata o título
            const nomeAnomalia = ficha.querySelector("h2").textContent;
            campos.nome.value = nomeAnomalia;

            // 2. Resgata os textos dos campos estruturados
            const resgatarTextoDoCampo = (termosProcurados) => {
                const paragrafos = ficha.querySelectorAll("p");
                for (let p of paragrafos) {
                    const tagStrong = p.querySelector("strong");
                    if (tagStrong) {
                        const textoStrong = tagStrong.textContent.toLowerCase();
                        const achouTermo = termosProcurados.some(termo => textoStrong.includes(termo.toLowerCase()));
                        
                        if (achouTermo) {
                            let textoCompleto = p.textContent;
                            let textoDoPrefixo = tagStrong.textContent;
                            return textoCompleto.replace(textoDoPrefixo, "").trim();
                        }
                    }
                }
                return "";
            };

            campos.descricao.value = resgatarTextoDoCampo(["Descrição:", "Descrição Geral:"]);
            campos.meios.value = resgatarTextoDoCampo(["comportamento", "meios para encontrar", "comportamentos:"]);
            campos.fraquezas.value = resgatarTextoDoCampo(["Fraquezas:", "Ponto Fraco"]);
            campos.casos.value = resgatarTextoDoCampo(["Casos Registrados:", "Casos Conhecidos:"]);

            // 4. Abre o Bloco de Notas suavemente na tela
            if (bloco) {
                bloco.classList.add("capa-aberta");
                setTimeout(() => {
                    bloco.classList.add("bloco-aberto");
                }, 300);
            }
            
            alert("Registros carregados de volta para alteração!");
        });
    }

    // CLIQUE NA BORRACHA (APAGAR)
    if (btnBorracha) {
        btnBorracha.addEventListener("click", (e) => {
            e.stopPropagation();

            const folhaAtual = obterFolhaFrenteAberta();
            if (!folhaAtual) return;

            const ficha = folhaAtual.elemento.querySelector(".ficha-conteudo-pronto");
            if (!ficha) {
                alert("Esta página já está limpa!");
                return;
            }

            if (confirm(`Deseja mesmo apagar os registros de "${ficha.querySelector("h2").textContent}" desta página?`)) {
                const numeroPaginaVisual = folhaAtual.numero + 1;
                folhaAtual.elemento.innerHTML = `<h2>Página ${numeroPaginaVisual}</h2><p>Anotações em branco...</p>`;
                modoEdicaoAtivo = false;
                // Atualiza o salvamento do livro sem essa página
                salvarTodasAsPaginasDoLivro();
                layoutSendoEditado = null;
                alert("Página apagada com sucesso!");
            }
        });
    }
});