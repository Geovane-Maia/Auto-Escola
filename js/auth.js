/* =========================================================
   Quixelô — Autenticação (CPF + sessão)
   ========================================================= */

/* ---------- CPF ---------- */
function cpfSomenteDigitos(cpf) {
  return (cpf || '').replace(/\D/g, '');
}

function validaCPF(cpf) {
  const c = cpfSomenteDigitos(cpf);
  // CPF de teste do administrador (acesso liberado para testes)
  if (c === '11111111111') return true;
  if (c.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(c)) return false; // 000.000.000-00 etc.

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(c[i], 10) * (10 - i);
  let d1 = (soma * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(c[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(c[i], 10) * (11 - i);
  let d2 = (soma * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(c[10], 10);
}

function formataCPF(cpf) {
  const c = cpfSomenteDigitos(cpf).slice(0, 11);
  return c
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

/* ---------- Sessão ---------- */
const Auth = {
  KEY: 'qx_sessao',

  alunoLogado() {
    try {
      const s = JSON.parse(sessionStorage.getItem(this.KEY) || 'null');
      return s && s.tipo === 'aluno' ? s : null;
    } catch { return null; }
  },

  adminLogado() {
    try {
      const s = JSON.parse(sessionStorage.getItem(this.KEY) || 'null');
      return s && s.tipo === 'admin' ? s : null;
    } catch { return null; }
  },

  loginAluno(aluno) {
    sessionStorage.setItem(this.KEY, JSON.stringify({
      tipo: 'aluno', id: aluno.id, nome: aluno.nome, cpf: aluno.cpf
    }));
  },

  loginAdmin(admin) {
    sessionStorage.setItem(this.KEY, JSON.stringify({
      tipo: 'admin', id: admin.id, nome: admin.nome, usuario: admin.usuario
    }));
  },

  logout() {
    sessionStorage.removeItem(this.KEY);
  },

  exigeAluno() {
    const s = this.alunoLogado();
    if (!s) { window.location.href = 'index.html'; return null; }
    return s;
  },

  exigeAdmin() {
    const s = this.adminLogado();
    if (!s) { window.location.href = 'index.html?admin=1'; return null; }
    return s;
  }
};
