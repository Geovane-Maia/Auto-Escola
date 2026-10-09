/* =========================================================
   Quixelô — painel.html (área do aluno)
   ========================================================= */
(async () => {
  await DB.seed();

  const sessao = Auth.exigeAluno();
  if (!sessao) return;

  document.getElementById('nome-aluno').textContent = sessao.nome;
  document.getElementById('boas-vindas-nome').textContent = sessao.nome;

  /* turma, último acesso e IP (Passo 2 do guia) */
  const aluno = await DB.alunos.findByCpf(sessao.cpf);
  document.getElementById('boas-vindas-turma').textContent = (aluno && aluno.turma) ? aluno.turma : '—';

  const ultimoAcesso = localStorage.getItem('qx_ultimo_acesso_' + sessao.cpf);
  document.getElementById('boas-vindas-acesso').textContent = ultimoAcesso
    ? new Date(ultimoAcesso).toLocaleString('pt-BR')
    : 'primeiro acesso';
  localStorage.setItem('qx_ultimo_acesso_' + sessao.cpf, new Date().toISOString());

  /* IP do último acesso (somente exibição, sem rastreio) */
  try {
    const ultimoIp = localStorage.getItem('qx_ultimo_ip_' + sessao.cpf);
    document.getElementById('boas-vindas-ip').textContent = ultimoIp || '—';
    fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => {
      if (d && d.ip) {
        localStorage.setItem('qx_ultimo_ip_' + sessao.cpf, d.ip);
        const el = document.getElementById('boas-vindas-ip');
        if (el && ultimoIp) el.textContent = ultimoIp;
        else if (el) el.textContent = d.ip;
      }
    }).catch(() => {});
  } catch {}

  document.getElementById('btn-sair').addEventListener('click', () => {
    Auth.logout();
    window.location.href = 'index.html';
  });

  /* ---------- caderno único (clique inicia o simulado) ---------- */
  const grade = document.getElementById('lista-cadernos');
  const total = (await DB.perguntas.all()).length;
  const card = document.createElement('a');
  card.className = 'card-caderno card-caderno-unico';
  card.href = 'simulado.html?cat=todas';
  card.innerHTML = `
    <span class="icone-caderno">📒</span>
    <h3>Caderno Nº 01</h3>
    <span class="tipo">Tipo: SIMULADO</span>
    <br>
    <span class="qtd">${total} questões no banco</span>
    <span class="btn-comecar">▶ ACESSAR O CADERNO</span>
  `;
  grade.appendChild(card);

  /* ---------- histórico ---------- */
  const historico = document.getElementById('historico');
  const resultados = await DB.resultados.porCpf(sessao.cpf);

  if (resultados.length === 0) {
    historico.innerHTML = '<p class="vazio">Você ainda não concluiu nenhum simulado. Boa prova! 🚗</p>';
  } else {
    const tabela = document.createElement('table');
    tabela.className = 'tabela';
    tabela.innerHTML = `<thead><tr><th>Data</th><th>Caderno</th><th>Acertos</th><th>%</th><th>Situação</th></tr></thead>`;
    const tbody = document.createElement('tbody');
    resultados.forEach(r => {
      const pct = Math.round((r.acertos / r.total) * 100);
      const aprovado = pct >= 70;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(r.data).toLocaleDateString('pt-BR')}</td>
        <td>${r.categoria}</td>
        <td>${r.acertos}/${r.total}</td>
        <td><strong>${pct}%</strong></td>
        <td><span class="situacao ${aprovado ? 'ok' : 'ruim'}">${aprovado ? 'Aprovado' : 'Revisar'}</span></td>
      `;
      tbody.appendChild(tr);
    });
    tabela.appendChild(tbody);
    historico.appendChild(tabela);
  }
})();
