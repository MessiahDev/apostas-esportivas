const eventosContainer = document.getElementById("eventos-container");
const carrinhoLista = document.getElementById("carrinho-lista");
const carrinhoTotal = document.getElementById("carrinho-total");

let carrinho = [];

async function carregarEventos() {
  try {
    eventosContainer.innerHTML = '<div class="spinner"></div>';
    // http://localhost:5209/api/Events Troque por este URL se estiver usando localmente!
    const response = await fetch("https://apostasesportivasapi.onrender.com/api/Events");
    if (!response.ok) throw new Error("Erro ao carregar eventos");

    const eventos = await response.json();
    renderizarEventos(eventos);
  } catch (error) {
    console.error(error);
    eventosContainer.innerHTML = "<p>Falha ao carregar os eventos.</p>";
  }
}

function renderizarEventos(eventos) {
  eventosContainer.innerHTML = "";

  eventos.forEach(evento => {
    const div = document.createElement("div");
    div.className = "evento";

    const outcomesButtons = evento.outcomes.map(outcome => `
      <button onclick="mostrarInputAposta(this, ${evento.id}, '${evento.name}', '${outcome.description}', ${outcome.odd})">
        ${outcome.description} - ${outcome.odd}
      </button>
    `).join("");

    div.innerHTML = `
      <h3>${evento.name}</h3>
      <div class="odds">${outcomesButtons}</div>
    `;

    eventosContainer.appendChild(div);
  });
}

function mostrarInputAposta(botao, eventoId, eventoNome, resultado, odd) {
  removerInputsAbertos();

  const inputDiv = document.createElement("div");
  inputDiv.className = "aposta-input";

  inputDiv.innerHTML = `
    <input type="number" min="1" step="0.01" placeholder="Valor (R$)" />
    <button>Adicionar</button>
  `;

  botao.parentElement.appendChild(inputDiv);

  const input = inputDiv.querySelector("input");
  const btnAdicionar = inputDiv.querySelector("button");

  btnAdicionar.onclick = () => {
    const valor = parseFloat(input.value);
    if (isNaN(valor) || valor <= 0) {
      alert("Digite um valor válido");
      return;
    }

    carrinho.push({
      eventoId,
      eventoNome,
      resultado,
      odd,
      valor,
      retorno: (valor * odd).toFixed(2)
    });

    renderizarCarrinho();
    inputDiv.remove();
  };
}

function removerInputsAbertos() {
  document.querySelectorAll(".aposta-input").forEach(el => el.remove());
}

function removerItem(index) {
  carrinho.splice(index, 1);
  renderizarCarrinho();
}

function renderizarCarrinho() {
  carrinhoLista.innerHTML = "";
  let total = 0;

  carrinho.forEach((item, index) => {
    total += parseFloat(item.retorno);
    const div = document.createElement("div");
    div.className = "carrinho-item";
    div.innerHTML = `
      <strong>${item.eventoNome}</strong><br/>
      ${item.resultado} @ ${item.odd} → Aposta: R$ ${item.valor.toFixed(2)}<br/>
      Retorno: R$ ${item.retorno}
      <button class="remover-btn" onclick="removerItem(${index})">remover</button>
    `;
    carrinhoLista.appendChild(div);
  });

  carrinhoTotal.textContent = `Total de retorno: R$ ${total.toFixed(2)}`;

  let btnEnviar = document.getElementById("btn-enviar-apostas");

  if (carrinho.length === 0) {
    if (btnEnviar) {
      btnEnviar.remove();
    }
    return;
  }

  if (!btnEnviar) {
    btnEnviar = document.createElement("button");
    btnEnviar.id = "btn-enviar-apostas";
    btnEnviar.textContent = "Enviar Apostas";
    btnEnviar.onclick = enviarApostas;
    carrinhoLista.appendChild(btnEnviar);
  }
}

function mostrarMensagem(texto, tipo = 'sucesso') {
  const el = document.getElementById("mensagem-status");
  el.textContent = texto;
  el.className = `mensagem-status mostrar${tipo === 'erro' ? ' erro' : ''}`;

  setTimeout(() => {
    el.classList.remove("mostrar");
  }, 3000);
}

async function enviarApostas() {
  const btnEnviar = document.getElementById("btn-enviar-apostas");
  if (!btnEnviar) return;

  btnEnviar.disabled = true;
  const textoOriginal = btnEnviar.textContent;
  btnEnviar.textContent = "Enviando...";

  try {
    const payload = carrinho.map(aposta => ({
      eventId: aposta.eventoId,
      outcomeDescription: aposta.resultado,
      odd: aposta.odd,
      amount: aposta.valor,
      potentialReturn: parseFloat(aposta.retorno)
    }));

    console.log("Enviando payload formatado:", JSON.stringify(payload, null, 2));

    // http://localhost:5209/api/Events/bet Troque por este URL se estiver usando localmente!
    const resposta = await fetch('https://apostasesportivasapi.onrender.com/api/Events/bet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resposta.ok) {
      const erro = await resposta.json();
      console.error("Erro da API:", erro);
      throw new Error(erro.message || 'Erro ao enviar apostas.');
    }

    const resultado = await resposta.json();
    console.log('Resultado das apostas:', resultado);

    mostrarMensagem("Apostas enviadas com sucesso!");
    carrinho = [];
    renderizarCarrinho();

  } catch (erro) {
    console.error(erro);
    mostrarMensagem("Erro ao enviar apostas.", "erro");
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = textoOriginal;
  }
}

carregarEventos();
