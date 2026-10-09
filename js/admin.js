/* =========================================================
   Quixelô — admin.html (CRUD, DB async)
   ========================================================= */
(async () => {
  await DB.seed();

  const sessao = Auth.exigeAdmin();
  if (!sessao) return;

  document.getElementById('nome-admin').textContent = sessao.nome;
  document.getElementById('btn-sair').addEventListener('click', () => {
    Auth.logout();
    window.location.href = 'index.html';
  });

  /* ---------- abas ---------- */
  document.querySelectorAll('.aba').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'));
      btn.classList.add('ativa');
      document.querySelectorAll('.conteudo-aba').forEach(c => c.hidden = true);
      document.getElementById('aba-' + btn.dataset.aba).hidden = false;
    });
  });

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const LETRAS = ['A', 'B', 'C', 'D', 'E'];

  /* =========================================================
     ALUNOS
     ========================================================= */
  const modalAluno = document.getElementById('modal-aluno');
  const formAluno = document.getElementById('form-aluno');
  const erroAluno = document.getElementById('erro-aluno');
  let editandoAlunoId = null;

  async function renderAlunos(filtro = '') {
    const tabela = document.getElementById('tabela-alunos');
    const f = filtro.trim().toLowerCase();
    const todos = await DB.alunos.all();
    const lista = todos.filter(a => !f || a.nome.toLowerCase().includes(f) || a.cpf.includes(f));

    if (lista.length === 0) {
      tabela.innerHTML = '<tbody><tr><td class="vazio-celula">Nenhum aluno encontrado.</td></tr></tbody>';
      return;
    }

    tabela.innerHTML = `
      <thead><tr><th>Nome</th><th>CPF</th><th>Turma</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody>
        ${lista.map(a => `
          <tr>
            <td>${esc(a.nome)}</td>
            <td>${formataCPF(a.cpf)}</td>
            <td>${esc(a.turma) || '—'}</td>
            <td><span class="situacao ${a.ativo ? 'ok' : 'ruim'}">${a.ativo ? 'Ativo' : 'Inativo'}</span></td>
            <td class="celula-acoes">
              <button class="btn btn-secundario btn-pequeno" data-editar="${a.id}">Editar</button>
              <button class="btn btn-perigo btn-pequeno" data-remover="${a.id}">Excluir</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;

    tabela.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () => abrirAluno(b.dataset.editar)));
    tabela.querySelectorAll('[data-remover]').forEach(b => b.addEventListener('click', async () => {
      const aluno = lista.find(x => x.id === b.dataset.remover);
      if (confirm(`Excluir o aluno "${aluno.nome}"? Esta ação não pode ser desfeita.`)) {
        await DB.alunos.remove(b.dataset.remover);
        renderAlunos(document.getElementById('busca-aluno').value);
      }
    }));
  }

  async function abrirAluno(id = null) {
    editandoAlunoId = id;
    erroAluno.hidden = true;
    document.getElementById('titulo-modal-aluno').textContent = id ? 'Editar aluno' : 'Novo aluno';
    if (id) {
      const todos = await DB.alunos.all();
      const a = todos.find(x => x.id === id);
      document.getElementById('aluno-nome').value = a.nome;
      document.getElementById('aluno-cpf').value = formataCPF(a.cpf);
      document.getElementById('aluno-turma').value = a.turma || '';
      document.getElementById('aluno-ativo').checked = a.ativo;
    } else {
      formAluno.reset();
      document.getElementById('aluno-ativo').checked = true;
    }
    modalAluno.hidden = false;
    document.getElementById('aluno-nome').focus();
  }

  document.getElementById('btn-novo-aluno').addEventListener('click', () => abrirAluno());
  document.getElementById('busca-aluno').addEventListener('input', (e) => renderAlunos(e.target.value));

  document.getElementById('aluno-cpf').addEventListener('input', (e) => {
    e.target.value = formataCPF(e.target.value);
  });

  formAluno.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroAluno.hidden = true;

    const nome = document.getElementById('aluno-nome').value.trim();
    const cpf = cpfSomenteDigitos(document.getElementById('aluno-cpf').value);
    const turma = document.getElementById('aluno-turma').value.trim();
    const ativo = document.getElementById('aluno-ativo').checked;

    if (!validaCPF(cpf)) {
      erroAluno.textContent = 'CPF inválido. Confira os números.';
      erroAluno.hidden = false;
      return;
    }
    const todos = await DB.alunos.all();
    const duplicado = todos.find(a => a.cpf === cpf && a.id !== editandoAlunoId);
    if (duplicado) {
      erroAluno.textContent = 'Já existe um aluno cadastrado com este CPF.';
      erroAluno.hidden = false;
      return;
    }

    if (editandoAlunoId) {
      await DB.alunos.update(editandoAlunoId, { nome, cpf, turma, ativo });
    } else {
      await DB.alunos.create({ nome, cpf, turma, ativo });
    }

    modalAluno.hidden = true;
    renderAlunos(document.getElementById('busca-aluno').value);
  });

  /* =========================================================
     PERGUNTAS
     ========================================================= */
  const modalPergunta = document.getElementById('modal-pergunta');
  const formPergunta = document.getElementById('form-pergunta');
  let editandoPerguntaId = null;
  let imagemPergunta = '';
  // chaves aceitas: foto enviada (data:/http) ou qualquer placa do mapa global PLACAS
  function ehPreset(v) {
    return !!v && typeof PLACAS !== 'undefined' && Object.prototype.hasOwnProperty.call(PLACAS, v);
  }

  function atualizaPreviewImagem() {
    const img = document.getElementById('preview-perg-imagem');
    const btnRem = document.getElementById('btn-remover-imagem');
    const svgBox = document.getElementById('preview-svg');
    if (!img || !btnRem) return;
    if (svgBox) svgBox.innerHTML = '';
    if (imagemPergunta && (imagemPergunta.startsWith('data:') || imagemPergunta.startsWith('http') || imagemPergunta.startsWith('blob:'))) {
      img.src = imagemPergunta;
      img.hidden = false;
      btnRem.hidden = false;
    } else if (imagemPergunta && ehPreset(imagemPergunta)) {
      img.removeAttribute('src');
      img.hidden = true;
      btnRem.hidden = false;
      if (svgBox && typeof PLACAS !== 'undefined' && PLACAS[imagemPergunta]) svgBox.innerHTML = PLACAS[imagemPergunta];
    } else {
      img.removeAttribute('src');
      img.hidden = true;
      btnRem.hidden = true;
    }
    const preset = document.getElementById('perg-placa-preset');
    if (preset) preset.value = ehPreset(imagemPergunta) ? imagemPergunta : '';
  }

  function processaArquivoImagem(arquivo) {
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) { alert('Selecione um arquivo de imagem (PNG/JPG).'); return; }
    if (arquivo.size > 2 * 1024 * 1024) { alert('Imagem muito grande. Use uma imagem de até 2MB.'); return; }
    const leitor = new FileReader();
    leitor.onload = () => {
      const original = new Image();
      original.onload = () => {
        // Reduz para no máximo 600px para não estourar localStorage/Supabase
        const MAX = 600;
        let w = original.width, h = original.height;
        const escala = Math.min(1, MAX / Math.max(w, h));
        w = Math.round(w * escala); h = Math.round(h * escala);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(original, 0, 0, w, h);
        imagemPergunta = canvas.toDataURL('image/jpeg', 0.82);
        atualizaPreviewImagem();
      };
      original.onerror = () => alert('Não foi possível ler a imagem.');
      original.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  }

  function montarAlternativas(quantidade = 4) {
    const box = document.getElementById('campos-alternativas');
    box.innerHTML = '';
    for (let i = 0; i < quantidade; i++) {
      const linha = document.createElement('div');
      linha.className = 'linha-alternativa';
      linha.innerHTML = `
        <input type="radio" name="correta" value="${i}" ${i === 0 ? 'checked' : ''} title="Marcar como correta">
        <span class="letra-alt">${LETRAS[i]}</span>
        <input type="text" class="input-alternativa" placeholder="Alternativa ${LETRAS[i]}" required>
      `;
      box.appendChild(linha);
    }
  }

  async function renderFiltroCategorias() {
    const select = document.getElementById('filtro-cat');
    const atual = select.value;
    const cats = await DB.perguntas.categorias();
    select.innerHTML = '<option value="todas">Todas as categorias</option>' +
      cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    if ([...select.options].some(o => o.value === atual)) select.value = atual;

    document.getElementById('lista-categorias').innerHTML =
      cats.map(c => `<option value="${esc(c)}">`).join('');
  }

  async function renderPerguntas() {
    await renderFiltroCategorias();
    const cat = document.getElementById('filtro-cat').value;
    const lista = await DB.perguntas.byCategoria(cat);
    const box = document.getElementById('lista-perguntas');

    if (lista.length === 0) {
      box.innerHTML = '<p class="vazio">Nenhuma pergunta nesta categoria.</p>';
      return;
    }

    box.innerHTML = lista.map(p => `
      <div class="card-pergunta-admin">
        <div class="cabec-pergunta">
          <span class="categoria-tag">${esc(p.categoria)}</span>
          <div class="celula-acoes">
            <button class="btn btn-secundario btn-pequeno" data-editar-perg="${p.id}">Editar</button>
            <button class="btn btn-perigo btn-pequeno" data-remover-perg="${p.id}">Excluir</button>
          </div>
        </div>
        <p class="enunciado-admin">${esc(p.enunciado)}</p>
        ${p.imagem ? (p.imagem.startsWith('data:') || p.imagem.startsWith('http') ? `<img src="${p.imagem}" alt="Placa" class="thumb-pergunta">` : `<span class="categoria-tag">🪧 Placa padrão: ${esc(p.imagem)}</span>`) : ''}
        <ul class="lista-alternativas">
          ${p.alternativas.map((alt, i) => `
            <li class="${i === p.correta ? 'correta' : ''}">${LETRAS[i]}) ${esc(alt)} ${i === p.correta ? '✔' : ''}</li>
          `).join('')}
        </ul>
      </div>
    `).join('');

    box.querySelectorAll('[data-editar-perg]').forEach(b => b.addEventListener('click', () => abrirPergunta(b.dataset.editarPerg)));
    box.querySelectorAll('[data-remover-perg]').forEach(b => b.addEventListener('click', async () => {
      if (confirm('Excluir esta pergunta?')) {
        await DB.perguntas.remove(b.dataset.removerPerg);
        renderPerguntas();
      }
    }));
  }

  async function abrirPergunta(id = null) {
    editandoPerguntaId = id;
    imagemPergunta = '';
    document.getElementById('titulo-modal-pergunta').textContent = id ? 'Editar pergunta' : 'Nova pergunta';
    await renderFiltroCategorias();

    if (id) {
      const todos = await DB.perguntas.all();
      const p = todos.find(x => x.id === id);
      document.getElementById('perg-categoria').value = p.categoria;
      document.getElementById('perg-enunciado').value = p.enunciado;
      imagemPergunta = p.imagem || '';
      montarAlternativas(p.alternativas.length);
      document.querySelectorAll('.input-alternativa').forEach((inp, i) => inp.value = p.alternativas[i]);
      document.querySelector(`input[name="correta"][value="${p.correta}"]`).checked = true;
    } else {
      formPergunta.reset();
      montarAlternativas(4);
    }
    const inputFile = document.getElementById('perg-imagem');
    if (inputFile) inputFile.value = '';
    atualizaPreviewImagem();
    modalPergunta.hidden = false;
  }

  document.getElementById('btn-nova-pergunta').addEventListener('click', () => abrirPergunta());
  document.getElementById('filtro-cat').addEventListener('change', renderPerguntas);
  document.getElementById('perg-imagem').addEventListener('change', (e) => {
    processaArquivoImagem(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('btn-remover-imagem').addEventListener('click', () => {
    imagemPergunta = '';
    const inputFile = document.getElementById('perg-imagem');
    if (inputFile) inputFile.value = '';
    atualizaPreviewImagem();
  });
  document.getElementById('perg-placa-preset').addEventListener('change', (e) => {
    imagemPergunta = e.target.value || '';
    atualizaPreviewImagem();
  });

  formPergunta.addEventListener('submit', async (e) => {
    e.preventDefault();
    const categoria = document.getElementById('perg-categoria').value.trim();
    const enunciado = document.getElementById('perg-enunciado').value.trim();
    const alternativas = [...document.querySelectorAll('.input-alternativa')].map(i => i.value.trim());
    const correta = parseInt(document.querySelector('input[name="correta"]:checked').value, 10);
    const imagem = imagemPergunta || null;

    if (alternativas.some(a => !a)) {
      alert('Preencha todas as alternativas.');
      return;
    }

    if (editandoPerguntaId) {
      await DB.perguntas.update(editandoPerguntaId, { categoria, enunciado, alternativas, correta, imagem });
    } else {
      await DB.perguntas.create({ categoria, enunciado, alternativas, correta, imagem });
    }

    modalPergunta.hidden = true;
    renderPerguntas();
  });

  /* =========================================================
     RESULTADOS
     ========================================================= */
  async function renderResultados() {
    const tabela = document.getElementById('tabela-resultados');
    const lista = await DB.resultados.all();

    if (lista.length === 0) {
      tabela.innerHTML = '<tbody><tr><td class="vazio-celula">Nenhum simulado realizado ainda.</td></tr></tbody>';
      return;
    }

    tabela.innerHTML = `
      <thead><tr><th>Data</th><th>Aluno</th><th>Caderno</th><th>Acertos</th><th>%</th><th>Ações</th></tr></thead>
      <tbody>
        ${lista.map(r => {
          const pct = Math.round((r.acertos / r.total) * 100);
          return `
            <tr>
              <td>${new Date(r.data).toLocaleString('pt-BR')}</td>
              <td>${esc(r.nome)}</td>
              <td>${esc(r.categoria)}</td>
              <td>${r.acertos}/${r.total}</td>
              <td><span class="situacao ${pct >= 70 ? 'ok' : 'ruim'}">${pct}%</span></td>
              <td class="celula-acoes"><button class="btn btn-perigo btn-pequeno" data-remover-res="${r.id}">Excluir</button></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    `;

    tabela.querySelectorAll('[data-remover-res]').forEach(b => b.addEventListener('click', async () => {
      if (confirm('Excluir este resultado?')) {
        await DB.resultados.remove(b.dataset.removerRes);
        renderResultados();
      }
    }));
  }

  document.getElementById('btn-limpar-resultados').addEventListener('click', async () => {
    if (confirm('Apagar TODOS os resultados? Esta ação não pode ser desfeita.')) {
      await DB.resultados.limpar();
      renderResultados();
    }
  });

  /* =========================================================
     CONFIGURAÇÕES
     ========================================================= */
  document.getElementById('form-senha').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nova = document.getElementById('nova-senha').value;
    const confirma = document.getElementById('confirma-senha').value;
    const erro = document.getElementById('erro-senha');
    erro.hidden = true;

    if (nova !== confirma) {
      erro.textContent = 'As senhas não conferem.';
      erro.hidden = false;
      return;
    }
    await DB.admins.updateSenha(sessao.usuario, nova);
    alert('Senha alterada com sucesso!');
    document.getElementById('form-senha').reset();
  });

  document.getElementById('btn-exportar').addEventListener('click', async () => {
    const dados = {
      alunos: await DB.alunos.all(),
      perguntas: await DB.perguntas.all(),
      resultados: await DB.resultados.all()
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `quixelo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('input-importar').addEventListener('change', async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = async () => {
      try {
        const dados = JSON.parse(leitor.result);
        if (DB.temNuvem) {
          alert('Importação disponível apenas no modo local. No modo nuvem, use o painel do Supabase.');
          return;
        }
        // modo local: substitui tudo
        if (dados.alunos) localStorage.setItem('qx_alunos', JSON.stringify(dados.alunos));
        if (dados.perguntas) localStorage.setItem('qx_perguntas', JSON.stringify(dados.perguntas));
        if (dados.resultados) localStorage.setItem('qx_resultados', JSON.stringify(dados.resultados));
        alert('Dados importados com sucesso!');
        renderAlunos();
        renderPerguntas();
        renderResultados();
      } catch {
        alert('Arquivo inválido.');
      }
    };
    leitor.readAsText(arquivo);
    e.target.value = '';
  });

  /* ---------- modais: fechar ---------- */
  document.querySelectorAll('[data-fechar]').forEach(b => {
    b.addEventListener('click', () => b.closest('.modal-overlay').hidden = true);
  });
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) m.hidden = true; });
  });

  /* ---------- render inicial ---------- */
  await renderAlunos();
  await renderPerguntas();
  await renderResultados();
})();
