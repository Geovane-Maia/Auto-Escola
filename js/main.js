/* =========================================================
   Quixelô — index.html (login com teclado virtual)
   ========================================================= */
(async () => {
  await DB.seed();

  /* se já estiver logado, segue direto */
  if (Auth.alunoLogado()) { window.location.href = 'painel.html'; return; }
  if (Auth.adminLogado() && new URLSearchParams(location.search).get('admin')) { window.location.href = 'admin.html'; return; }

  /* ---------- teclado virtual ---------- */
  let cpfDigitado = '';
  const display = document.getElementById('cpf-display');
  const erroCpf = document.getElementById('erro-cpf');

  function renderDisplay() {
    if (cpfDigitado.length === 0) {
      display.textContent = '_-_-_-';
      display.classList.add('vazio');
      return;
    }
    display.classList.remove('vazio');
    display.textContent = formataCPF(cpfDigitado) || cpfDigitado;
  }

  document.getElementById('teclado').addEventListener('click', (e) => {
    const tecla = e.target.closest('.tecla');
    if (!tecla) return;
    erroCpf.hidden = true;
    if (tecla.dataset.num !== undefined) {
      if (cpfDigitado.length < 11) {
        cpfDigitado += tecla.dataset.num;
        renderDisplay();
      }
    }
  });

  document.getElementById('tecla-apagar').addEventListener('click', () => {
    cpfDigitado = cpfDigitado.slice(0, -1);
    renderDisplay();
  });

  async function tentarEntrar() {
    erroCpf.hidden = true;

    if (cpfDigitado.length !== 11) {
      erroCpf.textContent = 'Digite os 11 algarismos do seu CPF.';
      erroCpf.hidden = false;
      return;
    }
    if (!validaCPF(cpfDigitado)) {
      erroCpf.textContent = 'CPF inválido. Confira os números.';
      erroCpf.hidden = false;
      return;
    }

    let aluno;
    try {
      aluno = await DB.alunos.findByCpf(cpfDigitado);
    } catch (err) {
      erroCpf.textContent = 'Erro de conexão com o banco. Tente novamente.';
      erroCpf.hidden = false;
      console.error(err);
      return;
    }

    if (!aluno) {
      erroCpf.textContent = 'CPF não encontrado. Procure a secretaria para se cadastrar.';
      erroCpf.hidden = false;
      return;
    }
    if (!aluno.ativo) {
      erroCpf.textContent = 'Cadastro inativo. Fale com a secretaria.';
      erroCpf.hidden = false;
      return;
    }

    Auth.loginAluno(aluno);
    window.location.href = 'painel.html';
  }

  document.getElementById('tecla-entrar').addEventListener('click', tentarEntrar);

  /* teclado físico também funciona */
  document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9' && cpfDigitado.length < 11) {
      cpfDigitado += e.key;
      renderDisplay();
      erroCpf.hidden = true;
    } else if (e.key === 'Backspace') {
      cpfDigitado = cpfDigitado.slice(0, -1);
      renderDisplay();
    } else if (e.key === 'Enter') {
      tentarEntrar();
    }
  });

  /* ---------- modal admin ---------- */
  const modal = document.getElementById('modal-admin');
  const erroAdmin = document.getElementById('erro-admin');

  document.getElementById('link-admin').addEventListener('click', () => {
    modal.hidden = false;
    document.getElementById('usuario').focus();
  });
  document.getElementById('fechar-modal').addEventListener('click', () => {
    modal.hidden = true;
    erroAdmin.hidden = true;
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });

  document.getElementById('form-admin').addEventListener('submit', async (e) => {
    e.preventDefault();
    erroAdmin.hidden = true;

    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value;

    try {
      if (await DB.admins.login(usuario, senha)) {
        const admin = await DB.admins.find(usuario);
        Auth.loginAdmin(admin);
        window.location.href = 'admin.html';
      } else {
        erroAdmin.textContent = 'Usuário ou senha incorretos.';
        erroAdmin.hidden = false;
      }
    } catch (err) {
      erroAdmin.textContent = 'Erro de conexão com o banco. Tente novamente.';
      erroAdmin.hidden = false;
      console.error(err);
    }
  });
})();
