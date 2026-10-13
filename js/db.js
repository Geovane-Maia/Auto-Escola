/* =========================================================
   Quixelô — Camada de dados
   Usa Supabase (Postgres + REST) quando configurado em
   js/config.js; caso contrário, localStorage (fallback).
   Todas as funções são async.
   ========================================================= */
const DB = (() => {
  const S = window.SUPABASE || {};
  const temNuvem = Boolean(S.url && S.anonKey);
  const K = { alunos: 'qx_alunos', admins: 'qx_admins', perguntas: 'qx_perguntas', resultados: 'qx_resultados' };

  function uid() {
    return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  }

  function lerLocal(k, pad) {
    try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : pad; } catch { return pad; }
  }
  function gravarLocal(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

  /* ---------- REST Supabase ---------- */
  async function api(metodo, caminho, corpo) {
    const r = await fetch(S.url.replace(/\/$/, '') + '/rest/v1/' + caminho, {
      method: metodo,
      headers: {
        'apikey': S.anonKey,
        'Authorization': 'Bearer ' + S.anonKey,
        'Content-Type': 'application/json',
        'Prefer': metodo === 'GET' ? 'return=representation' : 'return=representation'
      },
      body: corpo ? JSON.stringify(corpo) : undefined
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error('Banco ' + r.status + ': ' + txt.slice(0, 200));
    }
    return r.status === 204 ? [] : r.json();
  }

  /* Versão do banco: troca integral ao mudar (ex.: simulado final) */
  const VERSAO_BANCO = 'sindcfcs-50';
  const K_VERSAO = 'qx_seed_versao';

  /* Banco vigente: Simulado Final em js/banco-questoes.js */
  function todasSeed() {
    return (typeof PERGUNTAS_NOVAS !== 'undefined' && Array.isArray(PERGUNTAS_NOVAS)) ? PERGUNTAS_NOVAS : [];
  }

  async function apagaTudoNuvem() {
    const todas = await api('GET', 'perguntas?select=id');
    for (let i = 0; i < todas.length; i += 10) {
      await Promise.all(todas.slice(i, i + 10).map(p => api('DELETE', 'perguntas?id=eq.' + encodeURIComponent(p.id))));
    }
  }

  async function insereTudoNuvem() {
    const todas = todasSeed();
    for (let i = 0; i < todas.length; i += 20) {
      await api('POST', 'perguntas', todas.slice(i, i + 20).map(p => ({ id: uid(), ...p })));
    }
  }

  /* ---------- seed ---------- */
  async function seed() {
    const CPF_TESTE = '11111111111';
    if (!temNuvem) {
      if (!localStorage.getItem(K.admins)) {
        gravarLocal(K.admins, [{ id: uid(), usuario: 'admin', senha: 'admin123', nome: 'Administrador', criadoEm: new Date().toISOString() }]);
      }
      // troca integral do banco quando a versão muda (remove as anteriores)
      if (lerLocal(K_VERSAO, '') !== VERSAO_BANCO) {
        gravarLocal(K.perguntas, todasSeed().map(p => ({ id: uid(), ...p })));
        gravarLocal(K_VERSAO, VERSAO_BANCO);
      }
      // CPF padrão de teste com perfil Administrador
      const alunosLocal = lerLocal(K.alunos, []);
      if (!alunosLocal.some(a => a.cpf === CPF_TESTE)) {
        alunosLocal.push({ id: uid(), nome: 'Administrador', cpf: CPF_TESTE, turma: 'Administrador', ativo: true, criado_em: new Date().toISOString() });
        gravarLocal(K.alunos, alunosLocal);
      }
      return;
    }
    // remoto: só popula se vazio
    const admins = await api('GET', 'admins?select=id');
    if (!admins.length) {
      await api('POST', 'admins', [{ id: uid(), usuario: 'admin', senha: 'admin123', nome: 'Administrador' }]);
    }
    // CPF padrão de teste com perfil Administrador (nuvem)
    const alunoTeste = await api('GET', 'alunos?select=id&cpf=eq.' + CPF_TESTE);
    if (!alunoTeste.length) {
      await api('POST', 'alunos', [{ id: uid(), nome: 'Administrador', cpf: CPF_TESTE, turma: 'Administrador', ativo: true }]);
    }
    // troca integral do banco quando a versão muda (remove as anteriores)
    if (lerLocal(K_VERSAO, '') !== VERSAO_BANCO) {
      await apagaTudoNuvem();
      await insereTudoNuvem();
      gravarLocal(K_VERSAO, VERSAO_BANCO);
    }
  }

  /* ---------- alunos ---------- */
  const alunos = {
    async all() {
      if (temNuvem) return api('GET', 'alunos?select=*&order=criado_em.asc');
      return lerLocal(K.alunos, []);
    },
    async findByCpf(cpf) {
      if (temNuvem) { const r = await api('GET', 'alunos?select=*&cpf=eq.' + encodeURIComponent(cpf)); return r[0] || null; }
      return lerLocal(K.alunos, []).find(a => a.cpf === cpf) || null;
    },
    async create(d) {
      const a = { id: uid(), nome: d.nome.trim(), cpf: d.cpf, turma: (d.turma || '').trim(), ativo: d.ativo !== false, criado_em: new Date().toISOString() };
      if (temNuvem) return (await api('POST', 'alunos', a))[0];
      const l = lerLocal(K.alunos, []); l.push(a); gravarLocal(K.alunos, l); return a;
    },
    async update(id, d) {
      const dados = { ...d };
      if (typeof dados.nome === 'string') dados.nome = dados.nome.trim();
      if (temNuvem) return (await api('PATCH', 'alunos?id=eq.' + encodeURIComponent(id), dados))[0] || null;
      const l = lerLocal(K.alunos, []); const i = l.findIndex(a => a.id === id);
      if (i === -1) return null;
      l[i] = { ...l[i], ...dados }; gravarLocal(K.alunos, l); return l[i];
    },
    async remove(id) {
      if (temNuvem) { await api('DELETE', 'alunos?id=eq.' + encodeURIComponent(id)); return; }
      gravarLocal(K.alunos, lerLocal(K.alunos, []).filter(a => a.id !== id));
    }
  };

  /* ---------- admins ---------- */
  const admins = {
    async all() {
      if (temNuvem) return api('GET', 'admins?select=*');
      return lerLocal(K.admins, []);
    },
    async login(usuario, senha) {
      if (temNuvem) {
        const r = await api('GET', 'admins?select=id&usuario=eq.' + encodeURIComponent(usuario) + '&senha=eq.' + encodeURIComponent(senha));
        return r.length > 0;
      }
      return lerLocal(K.admins, []).some(a => a.usuario === usuario && a.senha === senha);
    },
    async find(usuario) {
      if (temNuvem) { const r = await api('GET', 'admins?select=*&usuario=eq.' + encodeURIComponent(usuario)); return r[0] || null; }
      return lerLocal(K.admins, []).find(a => a.usuario === usuario) || null;
    },
    async updateSenha(usuario, nova) {
      if (temNuvem) { await api('PATCH', 'admins?usuario=eq.' + encodeURIComponent(usuario), { senha: nova }); return true; }
      const l = lerLocal(K.admins, []); const i = l.findIndex(a => a.usuario === usuario);
      if (i > -1) { l[i].senha = nova; gravarLocal(K.admins, l); return true; }
      return false;
    }
  };

  /* ---------- perguntas ---------- */
  const perguntas = {
    async all() {
      if (temNuvem) return api('GET', 'perguntas?select=*');
      return lerLocal(K.perguntas, []);
    },
    async byCategoria(cat) {
      const l = await perguntas.all();
      return cat === 'todas' ? l : l.filter(p => p.categoria === cat);
    },
    async create(d) {
      const p = { id: uid(), ...d };
      if (temNuvem) return (await api('POST', 'perguntas', p))[0];
      const l = lerLocal(K.perguntas, []); l.push(p); gravarLocal(K.perguntas, l); return p;
    },
    async update(id, d) {
      if (temNuvem) return (await api('PATCH', 'perguntas?id=eq.' + encodeURIComponent(id), d))[0] || null;
      const l = lerLocal(K.perguntas, []); const i = l.findIndex(p => p.id === id);
      if (i === -1) return null;
      l[i] = { ...l[i], ...d }; gravarLocal(K.perguntas, l); return l[i];
    },
    async remove(id) {
      if (temNuvem) { await api('DELETE', 'perguntas?id=eq.' + encodeURIComponent(id)); return; }
      gravarLocal(K.perguntas, lerLocal(K.perguntas, []).filter(p => p.id !== id));
    },
    async categorias() {
      const l = await perguntas.all();
      return [...new Set(l.map(p => p.categoria))];
    }
  };

  /* ---------- resultados ---------- */
  const resultados = {
    async all() {
      if (temNuvem) return api('GET', 'resultados?select=*&order=data.desc');
      return lerLocal(K.resultados, []);
    },
    async criar(r) {
      const item = { id: uid(), data: new Date().toISOString(), ...r };
      if (temNuvem) return (await api('POST', 'resultados', item))[0];
      const l = lerLocal(K.resultados, []); l.push(item); gravarLocal(K.resultados, l); return item;
    },
    async porCpf(cpf) {
      if (temNuvem) return api('GET', 'resultados?select=*&cpf=eq.' + encodeURIComponent(cpf) + '&order=data.desc');
      return lerLocal(K.resultados, []).filter(r => r.cpf === cpf).sort((a, b) => b.data.localeCompare(a.data));
    },
    async remove(id) {
      if (temNuvem) { await api('DELETE', 'resultados?id=eq.' + encodeURIComponent(id)); return; }
      gravarLocal(K.resultados, lerLocal(K.resultados, []).filter(r => r.id !== id));
    },
    async limpar() {
      if (temNuvem) {
        const todos = await resultados.all();
        for (const r of todos) await api('DELETE', 'resultados?id=eq.' + encodeURIComponent(r.id));
        return;
      }
      gravarLocal(K.resultados, []);
    },
    /* backup/export — só local (nuvem usa o próprio Supabase) */
    async substituirTodos(list) {
      if (temNuvem) throw new Error('Importação disponível apenas no modo local.');
      gravarLocal(K.resultados, list);
    }
  };

  return { seed, alunos, admins, perguntas, resultados, uid, temNuvem };
})();
