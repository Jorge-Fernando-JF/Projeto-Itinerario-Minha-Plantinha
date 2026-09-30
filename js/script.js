/* ==========================================================
   MINHA PLANTINHA — lógica do aplicativo
   Organizado em blocos:
   1. Dados (usuário, planta, conquistas)
   2. Armazenamento (localStorage)
   3. Datas e sequência de dias
   4. Crescimento da planta
   5. Conquistas (gamificação)
   6. Modal de mensagens
   7. Atualização das telas
   8. Eventos dos botões
   ========================================================== */

/* ---------------------- 1. DADOS ---------------------- */

let usuario = {
    email: "",
    senha: ""
};

let planta = {
    semente: "",
    pote: "",
    nome: "",
    diasConsecutivos: 0,
    ultimoDia: "",
    cuidados: {
        regar: false,
        sol: false
    }
};

// Lista de conquistas que o app oferece e a condição para desbloquear cada uma.
// "condicao" recebe a planta atual e devolve true/false.
const CONQUISTAS = [
    {
        id: "primeiro-cuidado",
        emoji: "🏆",
        titulo: "Primeiro cuidado",
        descricao: "Você cuidou da sua planta pela primeira vez!",
        condicao: function (p) {
            return p.cuidados.regar || p.cuidados.sol;
        }
    },
    {
        id: "primeiro-crescimento",
        emoji: "🌿",
        titulo: "Primeiro crescimento",
        descricao: "Sua plantinha começou a crescer!",
        condicao: function (p) {
            return p.diasConsecutivos >= 1;
        }
    },
    {
        id: "tres-dias",
        emoji: "🔥",
        titulo: "3 dias consecutivos",
        descricao: "Você está criando um hábito!",
        condicao: function (p) {
            return p.diasConsecutivos >= 3;
        }
    },
    {
        id: "sete-dias",
        emoji: "🌳",
        titulo: "7 dias consecutivos",
        descricao: "Sua planta está ficando forte!",
        condicao: function (p) {
            return p.diasConsecutivos >= 7;
        }
    },
    {
        id: "dez-dias",
        emoji: "🌳",
        titulo: "10 dias consecutivos",
        descricao: "Você alcançou uma grande etapa!",
        condicao: function (p) {
            return p.diasConsecutivos >= 10;
        }
    }
];

// Guarda apenas os IDs das conquistas já desbloqueadas.
let conquistas = [];

/* ---------------------- 2. ARMAZENAMENTO ---------------------- */

function salvarDados() {
    localStorage.setItem("usuario", JSON.stringify(usuario));
    localStorage.setItem("planta", JSON.stringify(planta));
    localStorage.setItem("conquistas", JSON.stringify(conquistas));
}

function carregarDados() {
    const usuarioSalvo = localStorage.getItem("usuario");
    const plantaSalva = localStorage.getItem("planta");
    const conquistasSalvas = localStorage.getItem("conquistas");

    if (usuarioSalvo) {
        usuario = JSON.parse(usuarioSalvo);
    }

    if (plantaSalva) {
        planta = JSON.parse(plantaSalva);
    }

    if (conquistasSalvas) {
        conquistas = JSON.parse(conquistasSalvas);
    }
}

/* ---------------------- 3. DATAS E SEQUÊNCIA DE DIAS ---------------------- */

function mostrarTela(id) {
    document.querySelectorAll(".tela").forEach(function (tela) {
        tela.classList.remove("ativa");
    });

    const tela = document.getElementById(id);

    if (tela) {
        tela.classList.add("ativa");
    }
}

function formatarData(data) {
    return data.getFullYear() +
        "-" +
        String(data.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(data.getDate()).padStart(2, "0");
}

function obterDataHoje() {
    return formatarData(new Date());
}

function obterDataOntem() {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    return formatarData(ontem);
}

// Verifica se já é um novo dia. Se a criança pulou um dia inteiro,
// a sequência é perdida e os cuidados voltam a ficar pendentes.
function prepararNovoDia() {
    if (!planta.ultimoDia) {
        return;
    }

    const hoje = obterDataHoje();

    if (planta.ultimoDia === hoje) {
        return;
    }

    if (planta.ultimoDia !== obterDataOntem()) {
        planta.diasConsecutivos = 0;
    }

    planta.cuidados.regar = false;
    planta.cuidados.sol = false;

    salvarDados();
}

/* ---------------------- 4. CRESCIMENTO DA PLANTA ---------------------- */

// Os marcos de crescimento são os mesmos para as duas sementes,
// só muda o desenho (emoji) usado em cada etapa.
const ETAPAS_DIAS = [0, 1, 3, 5, 7, 10];

const IMAGENS_FEIJAO = ["🫘", "🫘🌱", "🌱", "🌿", "🌿🌿", "🌿🌿🌿"];
const IMAGENS_ARVORE = ["🌱", "🌱", "🌿", "🌿🌿", "🌳", "🌳🌳"];

function obterIndiceEtapa(dias) {
    let indice = 0;

    for (let i = 0; i < ETAPAS_DIAS.length; i++) {
        if (dias >= ETAPAS_DIAS[i]) {
            indice = i;
        }
    }

    return indice;
}

function obterImagemPlanta(semente, dias) {
    const indice = obterIndiceEtapa(dias);
    return semente === "Feijão" ? IMAGENS_FEIJAO[indice] : IMAGENS_ARVORE[indice];
}

function atualizarImagem() {
    const imagem = document.getElementById("imagem-planta");
    imagem.textContent = obterImagemPlanta(planta.semente, planta.diasConsecutivos);
}

/* ---------------------- 5. CONQUISTAS ---------------------- */

// Confere todas as conquistas e desbloqueia (uma única vez) as que
// já foram alcançadas, colocando um aviso na fila de modais.
function verificarConquistas() {
    CONQUISTAS.forEach(function (conquista) {
        const jaDesbloqueada = conquistas.includes(conquista.id);

        if (!jaDesbloqueada && conquista.condicao(planta)) {
            conquistas.push(conquista.id);
            salvarDados();

            enfileirarModal(
                conquista.emoji,
                "🏆 Conquista desbloqueada!",
                conquista.titulo + " — " + conquista.descricao
            );
        }
    });

    atualizarContadorConquistas();
}

function atualizarContadorConquistas() {
    document.getElementById("contagem-conquistas").textContent = conquistas.length;
    document.getElementById("total-conquistas").textContent = CONQUISTAS.length;
}

// Monta os cards da tela de conquistas com base no que já foi desbloqueado.
function renderizarConquistas() {
    const lista = document.getElementById("lista-conquistas");
    lista.innerHTML = "";

    CONQUISTAS.forEach(function (conquista) {
        const desbloqueada = conquistas.includes(conquista.id);

        const card = document.createElement("div");
        card.className = "conquista-card" + (desbloqueada ? " desbloqueada" : "");

        const emoji = document.createElement("span");
        emoji.className = "conquista-emoji";
        emoji.textContent = desbloqueada ? conquista.emoji : "🔒";

        const texto = document.createElement("div");

        const titulo = document.createElement("strong");
        titulo.textContent = conquista.titulo;

        const descricao = document.createElement("small");
        descricao.textContent = desbloqueada
            ? conquista.descricao
            : "Continue cuidando da sua planta para desbloquear.";

        texto.appendChild(titulo);
        texto.appendChild(descricao);

        card.appendChild(emoji);
        card.appendChild(texto);

        lista.appendChild(card);
    });
}

/* ---------------------- 6. MODAL DE MENSAGENS ---------------------- */

// Fila simples: se várias mensagens acontecerem ao mesmo tempo
// (ex.: dica educativa + conquista + dia concluído), elas aparecem
// uma de cada vez, na ordem em que foram criadas.
let filaDeModais = [];

function enfileirarModal(emoji, titulo, texto) {
    filaDeModais.push({ emoji: emoji, titulo: titulo, texto: texto });

    if (filaDeModais.length === 1) {
        exibirModalAtual();
    }
}

function exibirModalAtual() {
    const modal = document.getElementById("modal-mensagem");

    if (filaDeModais.length === 0) {
        modal.classList.add("escondido");
        return;
    }

    const mensagem = filaDeModais[0];

    document.getElementById("modal-emoji").textContent = mensagem.emoji;
    document.getElementById("modal-titulo").textContent = mensagem.titulo;
    document.getElementById("modal-texto").textContent = mensagem.texto;

    modal.classList.remove("escondido");
}

document.getElementById("btn-fechar-modal").addEventListener("click", function () {
    filaDeModais.shift();
    exibirModalAtual();
});

/* ---------------------- 7. ATUALIZAÇÃO DAS TELAS ---------------------- */

function atualizarTelaPlanta() {
    document.getElementById("nome-planta-final").textContent = planta.nome;
    document.getElementById("tipo-semente-final").textContent = "Semente: " + planta.semente;
    document.getElementById("tipo-pote-final").textContent = "Recipiente: " + planta.pote;
    document.getElementById("info-semente").textContent = planta.semente;
    document.getElementById("info-pote").textContent = planta.pote;
    document.getElementById("dias-consecutivos").textContent = planta.diasConsecutivos;

    atualizarImagem();
    atualizarCuidados();
    atualizarContadorConquistas();
}

function atualizarCuidados() {
    const btnRegar = document.getElementById("btn-regar");
    const btnSol = document.getElementById("btn-sol");
    const cuidadoRegar = document.getElementById("cuidado-regar");
    const cuidadoSol = document.getElementById("cuidado-sol");

    if (planta.cuidados.regar) {
        btnRegar.textContent = "✓ Concluído";
        btnRegar.disabled = true;
        cuidadoRegar.classList.add("concluido");
    } else {
        btnRegar.textContent = "✓ Reguei";
        btnRegar.disabled = false;
        cuidadoRegar.classList.remove("concluido");
    }

    if (planta.cuidados.sol) {
        btnSol.textContent = "✓ Concluído";
        btnSol.disabled = true;
        cuidadoSol.classList.add("concluido");
    } else {
        btnSol.textContent = "✓ Tomou sol";
        btnSol.disabled = false;
        cuidadoSol.classList.remove("concluido");
    }

    atualizarMensagem();
}

function atualizarMensagem() {
    const mensagem = document.getElementById("mensagem-dia");

    if (planta.cuidados.regar && planta.cuidados.sol) {
        mensagem.textContent = "🎉 Todos os cuidados de hoje foram concluídos!";
    } else {
        mensagem.textContent = "Faça os dois cuidados de hoje para completar o dia.";
    }
}

// Chamada quando os dois cuidados do dia são concluídos.
function completarDia() {
    const hoje = obterDataHoje();

    if (planta.ultimoDia === hoje) {
        return;
    }

    const indiceAntes = obterIndiceEtapa(planta.diasConsecutivos);

    planta.diasConsecutivos++;
    planta.ultimoDia = hoje;

    salvarDados();

    document.getElementById("dias-consecutivos").textContent = planta.diasConsecutivos;
    atualizarImagem();

    // Se a planta passou para uma nova etapa visual, faz uma pequena animação.
    const indiceDepois = obterIndiceEtapa(planta.diasConsecutivos);

    if (indiceDepois > indiceAntes) {
        const imagem = document.getElementById("imagem-planta");
        imagem.classList.remove("cresceu");
        void imagem.offsetWidth; // reinicia a animação
        imagem.classList.add("cresceu");
    }

    verificarConquistas();

    enfileirarModal(
        "🎉",
        "Cuidados de hoje concluídos!",
        "Você cuidou muito bem da sua plantinha hoje! 🔥 " +
            planta.diasConsecutivos +
            " dia(s) consecutivo(s)."
    );
}

// Preenche a tela "Ver progresso".
function carregarProgresso() {
    const dias = planta.diasConsecutivos;

    document.getElementById("nome-progresso").textContent = planta.nome;
    document.getElementById("dias-progresso").textContent = dias;
    document.getElementById("imagem-progresso").textContent = obterImagemPlanta(planta.semente, dias);

    const progresso = Math.min((dias / 10) * 100, 100);

    document.getElementById("barra-progresso-preenchida").style.width = progresso + "%";
    document.getElementById("texto-porcentagem").textContent = Math.round(progresso) + "%";

    const texto = document.getElementById("texto-progresso");

    if (dias === 0) {
        texto.textContent = "Comece hoje a cuidar da sua plantinha! 🌱";
    } else if (dias < 3) {
        texto.textContent = "Muito bem! Continue cuidando todos os dias.";
    } else if (dias < 5) {
        texto.textContent = "Sua plantinha começou a crescer! 🌿";
    } else if (dias < 7) {
        texto.textContent = "Ela está ficando cada vez maior!";
    } else if (dias < 10) {
        texto.textContent = "Parabéns! Sua plantinha está forte! 🌳";
    } else {
        texto.textContent = "🎉 Você alcançou uma grande etapa de crescimento!";
    }

    // Marca cada etapa como concluída, "próxima" (a primeira ainda não
    // alcançada) ou bloqueada.
    let proximaJaMarcada = false;

    ETAPAS_DIAS.slice(1).forEach(function (diaEtapa) {
        const elemento = document.getElementById("etapa-" + diaEtapa);
        const status = document.getElementById("status-etapa-" + diaEtapa);

        elemento.classList.remove("desbloqueada", "atual");

        if (dias >= diaEtapa) {
            elemento.classList.add("desbloqueada");
            status.textContent = "✓ Concluído";
        } else if (!proximaJaMarcada) {
            elemento.classList.add("atual");
            status.textContent = "Próxima etapa";
            proximaJaMarcada = true;
        } else {
            status.textContent = "Bloqueada";
        }
    });
}

/* ---------------------- 8. EVENTOS DOS BOTÕES ---------------------- */

document.getElementById("btn-ir-cadastro").addEventListener("click", function () {
    document.getElementById("erro-cadastro").textContent = "";
    mostrarTela("tela-cadastro");
});

document.getElementById("btn-voltar-login").addEventListener("click", function () {
    document.getElementById("erro-login").textContent = "";
    mostrarTela("tela-login");
});

document.getElementById("btn-cadastrar").addEventListener("click", function () {
    const email = document.getElementById("cadastro-email").value.trim();
    const senha = document.getElementById("cadastro-senha").value.trim();
    const erro = document.getElementById("erro-cadastro");

    erro.textContent = "";

    if (email === "" || senha === "") {
        erro.textContent = "Preencha o email e a senha.";
        return;
    }

    if (!email.includes("@")) {
        erro.textContent = "Digite um email válido.";
        return;
    }

    if (senha.length < 4) {
        erro.textContent = "A senha deve ter pelo menos 4 caracteres.";
        return;
    }

    usuario.email = email;
    usuario.senha = senha;

    salvarDados();

    document.getElementById("login-email").value = email;
    document.getElementById("login-senha").value = "";

    alert("Conta criada com sucesso!");

    mostrarTela("tela-login");
});

document.getElementById("btn-login").addEventListener("click", function () {
    const email = document.getElementById("login-email").value.trim();
    const senha = document.getElementById("login-senha").value.trim();
    const erro = document.getElementById("erro-login");

    erro.textContent = "";

    if (email === "" || senha === "") {
        erro.textContent = "Preencha o email e a senha.";
        return;
    }

    if (usuario.email === "") {
        erro.textContent = "Você ainda não possui uma conta. Crie uma conta primeiro.";
        return;
    }

    if (email === usuario.email && senha === usuario.senha) {
        prepararNovoDia();
        mostrarTela("tela-inicial");
    } else {
        erro.textContent = "Email ou senha incorretos.";
    }
});

// Mostra uma dica quando a criança escolhe o Pote de Danone (reutilização).
document.querySelectorAll('input[name="pote"]').forEach(function (input) {
    input.addEventListener("change", function () {
        const dica = document.getElementById("dica-recipiente");

        if (this.value === "Pote de Danone") {
            dica.textContent =
                "♻️ Boa escolha! Você está reutilizando um material que poderia ser descartado.";
            dica.classList.remove("escondido");
        } else {
            dica.classList.add("escondido");
        }
    });
});

document.getElementById("btn-continuar-inicial").addEventListener("click", function () {
    const semente = document.querySelector('input[name="semente"]:checked');
    const pote = document.querySelector('input[name="pote"]:checked');
    const erro = document.getElementById("erro-inicial");

    erro.textContent = "";

    if (!semente) {
        erro.textContent = "Escolha o tipo de semente.";
        return;
    }

    if (!pote) {
        erro.textContent = "Escolha o tipo de recipiente.";
        return;
    }

    if (semente.value === "Árvore" && pote.value === "Pote de Danone") {
        erro.textContent = "A árvore não pode ser plantada no pote de Danone. Escolha um vaso.";
        return;
    }

    planta.semente = semente.value;
    planta.pote = pote.value;

    mostrarTela("tela-nome");
});

document.getElementById("btn-continuar-nome").addEventListener("click", function () {
    const nome = document.getElementById("nome-planta").value.trim();
    const erro = document.getElementById("erro-nome");

    erro.textContent = "";

    if (nome === "") {
        erro.textContent = "Digite um nome para sua planta.";
        return;
    }

    planta.nome = nome;

    mostrarTela("tela-lembretes");
});

document.getElementById("btn-finalizar").addEventListener("click", function () {
    planta.diasConsecutivos = 0;
    planta.ultimoDia = "";
    planta.cuidados = {
        regar: false,
        sol: false
    };

    salvarDados();

    atualizarTelaPlanta();

    mostrarTela("tela-planta");
});

document.getElementById("btn-regar").addEventListener("click", function () {
    prepararNovoDia();

    if (planta.cuidados.regar) {
        return;
    }

    planta.cuidados.regar = true;
    salvarDados();
    atualizarCuidados();

    enfileirarModal(
        "💧",
        "Você regou sua planta!",
        "A água é essencial para as plantas. Por isso, devemos evitar desperdícios e usar apenas a quantidade necessária."
    );

    verificarConquistas();

    if (planta.cuidados.regar && planta.cuidados.sol) {
        completarDia();
    }
});

document.getElementById("btn-sol").addEventListener("click", function () {
    prepararNovoDia();

    if (planta.cuidados.sol) {
        return;
    }

    planta.cuidados.sol = true;
    salvarDados();
    atualizarCuidados();

    enfileirarModal(
        "☀️",
        "Hora do sol!",
        "As plantas precisam de luz para realizar a fotossíntese e produzir seu próprio alimento."
    );

    verificarConquistas();

    if (planta.cuidados.regar && planta.cuidados.sol) {
        completarDia();
    }
});

document.getElementById("btn-ver-progresso").addEventListener("click", function () {
    carregarProgresso();
    mostrarTela("tela-progresso");
});

document.getElementById("btn-voltar-planta").addEventListener("click", function () {
    prepararNovoDia();
    atualizarTelaPlanta();
    mostrarTela("tela-planta");
});

document.getElementById("btn-ver-conquistas").addEventListener("click", function () {
    renderizarConquistas();
    mostrarTela("tela-conquistas");
});

document.getElementById("btn-voltar-conquistas").addEventListener("click", function () {
    mostrarTela("tela-planta");
});

document.getElementById("btn-voltar-inicio").addEventListener("click", function () {
    // Recomeçar apaga apenas os dados da planta atual.
    // As conquistas já desbloqueadas continuam valendo.
    planta = {
        semente: "",
        pote: "",
        nome: "",
        diasConsecutivos: 0,
        ultimoDia: "",
        cuidados: {
            regar: false,
            sol: false
        }
    };

    localStorage.removeItem("planta");

    document.querySelectorAll('input[type="radio"]').forEach(function (input) {
        input.checked = false;
    });

    document.getElementById("dica-recipiente").classList.add("escondido");
    document.getElementById("nome-planta").value = "";

    mostrarTela("tela-inicial");
});

/* ---------------------- INÍCIO ---------------------- */

carregarDados();

if (planta.nome !== "") {
    prepararNovoDia();
}
