/* =========================================================
   Quixelô — simulado.html (novo layout)
   Ciclo: 1) Selecionar → 2) Confirmar resposta → 3) Próxima
   ========================================================= */
(async () => {
  await DB.seed();

  const sessao = Auth.exigeAluno();
  if (!sessao) return;

  const app = document.getElementById('app');
  const cat = new URLSearchParams(location.search).get('cat') || 'todas';

  let perguntas = (await DB.perguntas.byCategoria(cat)).slice();
  if (perguntas.length === 0) {
    app.innerHTML = '<p class="vazio">Nenhuma pergunta cadastrada nesta categoria ainda.</p>';
    return;
  }

  perguntas = perguntas.sort(() => Math.random() - 0.5);

  const N = perguntas.length;
  const LETRAS = ['A', 'B', 'C', 'D', 'E'];
  const nomeCategoria = cat === 'todas' ? 'Completo' : cat;

  /* SVGs de placas para questões de Sinalização */
  const PLACAS = {
    seta: '<svg viewBox="0 0 100 100" width="86" height="86"><circle cx="50" cy="50" r="44" fill="#fff" stroke="#c0392b" stroke-width="9"/><path d="M50 24v38M50 24l-13 15M50 24l13 15" stroke="#111" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    proibido: '<svg viewBox="0 0 100 100" width="86" height="86"><circle cx="50" cy="50" r="44" fill="#c0392b"/><rect x="14" y="43" width="72" height="14" rx="3" fill="#fff"/></svg>',
    triangulo: '<svg viewBox="0 0 100 100" width="86" height="86"><path d="M50 12 L92 88 H8 Z" fill="#fff" stroke="#c0392b" stroke-width="9" stroke-linejoin="round"/><rect x="45.5" y="38" width="9" height="26" rx="4.5" fill="#111"/><circle cx="50" cy="76" r="5.5" fill="#111"/></svg>',
    estacionamento: '<svg viewBox="0 0 100 100" width="86" height="86"><rect x="8" y="8" width="84" height="84" rx="12" fill="#2a5db0"/><text x="50" y="72" font-size="58" font-weight="800" text-anchor="middle" fill="#fff" font-family="Arial">P</text></svg>'
  };

  /* estado por questão */
  const estado = perguntas.map(() => ({ selecionada: null, confirmada: false }));
  let atual = 0;
  // Guia ABCDETRAN: 1 minuto por questão (30 questões = 30 minutos)
  let tempoRestante = N * 60;
  let timerId = null;
  let provaEncerrada = false;

  function iniciarTimer() {
    timerId = setInterval(() => {
      if (provaEncerrada) return;
      tempoRestante--;
      const t = document.getElementById('timer');
      if (t) {
        const m = String(Math.floor(tempoRestante / 60)).padStart(2, '0');
        const s = String(tempoRestante % 60).padStart(2, '0');
        t.textContent = `${m}:${s}`;
        if (tempoRestante <= 120) t.classList.add('pouco');
      }
      if (tempoRestante <= 0) {
        clearInterval(timerId);
        finalizar(true);
      }
    }, 1000);
  }

  function renderProva() {
    const p = perguntas[atual];
    const est = estado[atual];
    const confirmadas = estado.filter(e => e.confirmada).length;
    const m = String(Math.floor(tempoRestante / 60)).padStart(2, '0');
    const s = String(tempoRestante % 60).padStart(2, '0');
    const pctProgresso = Math.round((confirmadas / N) * 100);

    const statusMsg = est.confirmada
      ? 'Resposta confirmada ✔'
      : est.selecionada !== null
        ? 'Resposta selecionada — confirme (laranja)'
        : 'Resposta não selecionada';

    app.innerHTML = `
      <div class="prova-topo">
        <img class="logo-prova" src="assets/logo.jpeg" alt="Quixelô">
        <div class="contador-topo">
          <span>QUESTÃO <strong>${String(atual + 1).padStart(2, '0')}</strong> / ${N}</span>
          <div class="barra-progresso"><div class="fill" style="width:${pctProgresso}%"></div></div>
        </div>
        <span class="abcdetran">ABCDETRAN</span>
        <div class="timer ${tempoRestante <= 120 ? 'pouco' : ''}" id="timer">${m}:${s}</div>
        <button class="btn-sair-simulado" id="btn-sair">« Sair</button>
      </div>

      <div id="aviso-pend"></div>

      <div class="cartao-questao">
        ${p.imagem && PLACAS[p.imagem] ? `<div class="img-questao">${PLACAS[p.imagem]}</div>` : ''}
        <p class="enunciado">${p.enunciado}</p>
      </div>

      <div class="grade-respostas">
        ${p.alternativas.map((alt, i) => `
          <button class="cartao-resp ${est.selecionada === i ? 'selecionada' : ''}" data-i="${i}">
            <span class="letra">${LETRAS[i]}</span>
            <span class="texto-resp">${alt}</span>
            <span class="radio"></span>
          </button>
        `).join('')}
      </div>

      <div class="barra-acoes">
        <button class="btn-exame btn-anterior" id="btn-voltar" ${atual === 0 ? 'disabled' : ''}>← ANTERIOR</button>
        <button class="btn-exame btn-confirmar" id="btn-confirmar">✓ CONFIRMAR RESPOSTA</button>
        <button class="btn-exame btn-proxima" id="btn-avancar">PRÓXIMA →</button>
      </div>

      <div class="barra-status">
        <span class="pill"><span class="ic">📋</span> Respondidas: <strong>${confirmadas}/${N}</strong></span>
        <span class="pill">${est.confirmada ? '✔' : 'ⓘ'} ${statusMsg}</span>
      </div>
    `;

    document.querySelectorAll('.cartao-resp').forEach(btn => {
      btn.addEventListener('click', () => {
        if (estado[atual].confirmada) {
          mostrarAviso('Esta questão já foi confirmada. Avance para a próxima.');
          return;
        }
        estado[atual].selecionada = parseInt(btn.dataset.i, 10);
        renderProva();
      });
    });

    document.getElementById('btn-voltar').addEventListener('click', () => {
      if (atual > 0) { atual--; renderProva(); }
    });
    document.getElementById('btn-sair').addEventListener('click', () => {
      if (confirm('Deseja sair do simulado? As respostas não confirmadas serão perdidas.')) {
        window.location.href = 'painel.html';
      }
    });
    document.getElementById('btn-confirmar').addEventListener('click', confirmar);
    document.getElementById('btn-avancar').addEventListener('click', avancar);
  }

  function mostrarAviso(msg) {
    const box = document.getElementById('aviso-pend');
    if (box) {
      box.innerHTML = `<div class="aviso-pendencias">⚠ ${msg}</div>`;
      setTimeout(() => { if (box) box.innerHTML = ''; }, 3500);
    }
  }

  function confirmar() {
    const est = estado[atual];
    if (est.selecionada === null) {
      mostrarAviso('Selecione uma alternativa antes de confirmar.');
      return;
    }
    est.confirmada = true;
    renderProva();
  }

  function pendencias() {
    const out = [];
    estado.forEach((e, i) => { if (!e.confirmada) out.push(i); });
    return out;
  }

  function avancar() {
    const est = estado[atual];
    if (!est.confirmada && est.selecionada !== null) {
      mostrarAviso('Confirme no botão laranja antes de avançar!');
      return;
    }

    const pend = pendencias().filter(i => i !== atual);
    if (atual < N - 1) {
      const proxima = pend.find(i => i > atual);
      atual = proxima !== undefined ? proxima : (atual < N - 1 ? atual + 1 : atual);
      renderProva();
      return;
    }

    // última questão
    if (pend.length === 0) {
      finalizar(false);
    } else {
      mostrarAviso('Ainda existem questões a serem resolvidas.');
      atual = pend[0];
      renderProva();
    }
  }

  async function finalizar(porTempo) {
    if (provaEncerrada) return;
    const pend = pendencias();
    if (!porTempo && pend.length > 0) {
      mostrarAviso('Ainda existem questões a serem resolvidas.');
      atual = pend[0];
      renderProva();
      return;
    }
    provaEncerrada = true;
    clearInterval(timerId);

    const acertos = perguntas.reduce((acc, p, i) =>
      acc + (estado[i].confirmada && estado[i].selecionada === p.correta ? 1 : 0), 0);
    const pct = Math.round((acertos / N) * 100);
    const aprovado = pct >= 70;

    try {
      await DB.resultados.criar({ cpf: sessao.cpf, nome: sessao.nome, categoria: nomeCategoria, acertos, total: N });
    } catch (err) {
      console.error('Erro ao salvar resultado:', err);
    }

    app.innerHTML = `
      <div class="prova-topo">
        <img class="logo-prova" src="assets/logo.jpeg" alt="Quixelô">
        <div class="contador-topo"><span>PROVA FINALIZADA${porTempo ? ' — TEMPO ESGOTADO' : ''}</span></div>
        <div class="timer">✓</div>
      </div>
      <div class="tela-conclusao">
        <div class="faixa-concluida">Disciplina concluída! »</div>
        <div class="card-resultado">
          <div class="nota-grande">${pct}%</div>
          <div class="selo ${aprovado ? 'aprovado' : 'reprovado'}">${aprovado ? '✔ APROVADO' : '✘ REPROVADO'}</div>
          <p class="resultado-detalhes">Você acertou <strong>${acertos}</strong> de <strong>${N}</strong> questões — mínimo de <strong>70%</strong> para aprovação.</p>
          <div class="resultado-acoes">
            <a class="btn btn-primario" href="painel.html">Voltar ao caderno</a>
            <button class="btn btn-secundario" id="btn-gabarito">Ver gabarito</button>
          </div>
        </div>
        <div id="gabarito" style="margin-top:24px;"></div>
      </div>
    `;

    document.getElementById('btn-gabarito').addEventListener('click', () => {
      const box = document.getElementById('gabarito');
      if (box.dataset.aberto === '1') { box.innerHTML = ''; box.dataset.aberto = ''; return; }
      box.dataset.aberto = '1';
      box.innerHTML = '<h2 style="margin-bottom:12px;color:#111;">Gabarito</h2>' + perguntas.map((p, i) => {
        const certo = estado[i].confirmada && estado[i].selecionada === p.correta;
        return `
          <div class="gabarito-item ${certo ? 'certo' : 'errado'}">
            <h4>${i + 1}. ${p.enunciado}</h4>
            <p class="correto-texto">✔ Resposta correta: ${LETRAS[p.correta]}) ${p.alternativas[p.correta]}</p>
            ${certo ? '' : `<p class="sua-texto">✘ Sua resposta: ${estado[i].selecionada !== null ? LETRAS[estado[i].selecionada] + ') ' + p.alternativas[estado[i].selecionada] : 'em branco'}</p>`}
          </div>
        `;
      }).join('');
    });
  }

  renderProva();
  iniciarTimer();
})();
