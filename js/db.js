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

  /* Normaliza enunciado para detectar repetidas (acentos/caixa/pontuação) */
  function normEnun(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* Banco completo: 30 originais + Banco Nacional (db.js + banco-questoes.js) */
  function todasSeed() {
    const novas = (typeof PERGUNTAS_NOVAS !== 'undefined' && Array.isArray(PERGUNTAS_NOVAS)) ? PERGUNTAS_NOVAS : [];
    return [...PERGUNTAS_SEED, ...novas];
  }

  /* Completa a lista com as questões do seed que ainda faltam (sem duplicar) */
  function mesclarSeed(lista) {
    const out = (lista || []).map(p => (p && !p.id) ? { ...p, id: uid() } : p);
    const vistos = new Set(out.map(p => normEnun(p.enunciado)));
    for (const p of todasSeed()) {
      if (!vistos.has(normEnun(p.enunciado))) {
        vistos.add(normEnun(p.enunciado));
        out.push({ id: uid(), ...p });
      }
    }
    return out;
  }

  /* ---------- seed ---------- */
  async function seed() {
    const CPF_TESTE = '11111111111';
    if (!temNuvem) {
      if (!localStorage.getItem(K.admins)) {
        gravarLocal(K.admins, [{ id: uid(), usuario: 'admin', senha: 'admin123', nome: 'Administrador', criadoEm: new Date().toISOString() }]);
      }
      // perguntas: cria ou completa sem duplicar (migra quem já tinha as 30 antigas)
      const atuais = lerLocal(K.perguntas, null);
      gravarLocal(K.perguntas, mesclarSeed(atuais || []));
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
    const pergs = await api('GET', 'perguntas?select=id,enunciado');
    if (!pergs.length) {
      // banco vazio: insere tudo em lotes de 20
      const todas = todasSeed();
      for (let i = 0; i < todas.length; i += 20) {
        await api('POST', 'perguntas', todas.slice(i, i + 20).map(p => ({ id: uid(), ...p })));
      }
    } else {
      // completa com as questões do seed que ainda faltam (sem duplicar)
      const vistos = new Set(pergs.map(p => normEnun(p.enunciado)));
      const faltam = todasSeed().filter(p => !vistos.has(normEnun(p.enunciado)));
      for (let i = 0; i < faltam.length; i += 20) {
        await api('POST', 'perguntas', faltam.slice(i, i + 20).map(p => ({ id: uid(), ...p })));
      }
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

/* ---------- banco de perguntas inicial (30) ---------- */
const PERGUNTAS_SEED = [
  /* Legislação (8) */
  { categoria: 'Legislação', enunciado: 'A velocidade máxima permitida em vias urbanas, salvo sinalização específica, é de:', alternativas: ['60 km/h', '80 km/h', '40 km/h', '100 km/h'], correta: 0 },
  { categoria: 'Legislação', enunciado: 'Ao encontrar sinal vermelho de semáforo, o motorista deve:', alternativas: ['Acelerar para passar antes', 'Parar antes da faixa de parada e aguardar', 'Tocar a buzina', 'Segurar pela contramão'], correta: 1 },
  { categoria: 'Legislação', enunciado: 'Estacionar sobre calçada de acesso a garagem é:', alternativas: ['Permitido por até 5 minutos', 'Permitido se o motorista estiver no veículo', 'Proibido', 'Permitido à noite'], correta: 2 },
  { categoria: 'Legislação', enunciado: 'O uso do cinto de segurança é obrigatório:', alternativas: ['Apenas em vias rápidas', 'Apenas para o motorista', 'Para todos os ocupantes do veículo', 'Somente em vias urbanas'], correta: 2 },
  { categoria: 'Legislação', enunciado: 'Dirigir sob influência de álcool:', alternativas: ['É permitido se a ingestão for pequena', 'É proibido e sujeito a multa, suspensão e prisão', 'É permitido à noite', 'É permitido em vias pouco movimentadas'], correta: 1 },
  { categoria: 'Legislação', enunciado: 'A faixa de pedestres (zebrado) serve para:', alternativas: ['Estacionar motocicletas', 'Uso exclusivo de pedestres cruzarem a via', 'Circulação de bicicletas', 'Parada de ônibus'], correta: 1 },
  { categoria: 'Legislação', enunciado: 'A ultrapassagem em curva ou lombada:', alternativas: ['É permitida com atenção', 'É proibida', 'É permitida à noite', 'É permitida se a via for larga'], correta: 1 },
  { categoria: 'Legislação', enunciado: 'O trânsito de pedestres em via rápida é permitido:', alternativas: ['Em qualquer ponto', 'Somente em faixas de pedestres, passarelas ou túneis', 'Somente à noite', 'É sempre proibido'], correta: 1 },

  /* Sinalização (6) */
  { categoria: 'Sinalização', enunciado: 'Em uma via urbana, a placa de regulamentação indica...', imagem: 'seta', alternativas: ['Sentido obrigatório seguir em frente.', 'Proibido seguir em frente.', 'Sentido permitido à esquerda.', 'Trânsito em ambos os sentidos.'], correta: 0 },
  { categoria: 'Sinalização', enunciado: 'O sinal circular vermelho com uma faixa horizontal branca significa:', imagem: 'proibido', alternativas: ['Parada obrigatória', 'Ceda passagem', 'Sentido proibido', 'Velocidade máxima'], correta: 2 },
  { categoria: 'Sinalização', enunciado: 'O sinal triangular com borda vermelha é de:', imagem: 'triangulo', alternativas: ['Advertência', 'Obrigação', 'Indicação', 'Serviços'], correta: 0 },
  { categoria: 'Sinalização', enunciado: 'A placa azul quadrada com a letra "P" indica:', imagem: 'estacionamento', alternativas: ['Proibido estacionar', 'Estacionamento permitido', 'Parada obrigatória', 'Ponto de ônibus'], correta: 1 },
  { categoria: 'Sinalização', enunciado: 'O piso com faixas diagonais brancas (zebrado) junto à borda da via indica:', alternativas: ['Área de lazer', 'Faixa de retenção — não estacionar nem parar', 'Faixa de pedestres', 'Entrada de garagem'], correta: 1 },
  { categoria: 'Sinalização', enunciado: 'A placa vermelha redonda com um caminhão preto e uma faixa vermelha significa:', imagem: 'proibido-caminhoes', alternativas: ['Proibido o trânsito de caminhões', 'Área de carga', 'Estacionamento para caminhões', 'Via de caminhões preferencial'], correta: 0 },

  /* Direção Defensiva (6) */
  { categoria: 'Direção Defensiva', enunciado: 'A distância de seguimento segura depende de:', alternativas: ['Somente da velocidade', 'Velocidade, tempo de reação e condições do piso', 'Apenas do tipo de veículo', 'Da vontade do motorista'], correta: 1 },
  { categoria: 'Direção Defensiva', enunciado: 'Ao dirigir sob chuva, o motorista deve:', alternativas: ['Manter a mesma velocidade', 'Reduzir a velocidade e aumentar a distância', 'Acender o pisca-alerta permanentemente', 'Circular na contramão'], correta: 1 },
  { categoria: 'Direção Defensiva', enunciado: '"Ponto cego" é a área:', alternativas: ['Visível pelos espelhos', 'Não coberta pelos espelhos retrovisores', 'Frente ao veículo', 'Atrás do veículo apenas'], correta: 1 },
  { categoria: 'Direção Defensiva', enunciado: 'O que fazer antes de mudar de faixa?', alternativas: ['Buzinar', 'Sinalizar com a seta e conferir os espelhos', 'Acelerar', 'Fechar os olhos'], correta: 1 },
  { categoria: 'Direção Defensiva', enunciado: 'Dirigir com sono é perigoso porque:', alternativas: ['Aumenta o consumo de combustível', 'Reduz o tempo de reação e a atenção', 'Desgasta os pneus', 'Nada acontece'], correta: 1 },
  { categoria: 'Direção Defensiva', enunciado: 'Em descidas longas, o motorista deve:', alternativas: ['Segurar o freio continuamente', 'Usar o freio-motor (marchas reduzidas) e frear em pulsos', 'Desligar o motor', 'Colocar neutro'], correta: 1 },

  /* Primeiros Socorros (5) */
  { categoria: 'Primeiros Socorros', enunciado: 'Em caso de acidente, o PRIMEIRO passo é:', alternativas: ['Remover a vítima imediatamente', 'Sinalizar o local e chamar o SAMU (192)', 'Tirar fotos', 'Esperar alguém passar'], correta: 1 },
  { categoria: 'Primeiros Socorros', enunciado: 'Vítima inconsciente mas respirando deve ser colocada em:', alternativas: ['Posição de sentado', 'Posição lateral de segurança', 'De barriga para baixo', 'De cabeça baixa'], correta: 1 },
  { categoria: 'Primeiros Socorros', enunciado: 'Sangramento intenso de um braço deve ser controlado:', alternativas: ['Apertando com os dedos', 'Com torniquete improvisado, se necessário, e pressão direta', 'Aplicando gelo', 'Esperando parar sozinho'], correta: 1 },
  { categoria: 'Primeiros Socorros', enunciado: 'Número do SAMU é:', alternativas: ['190', '192', '193', '180'], correta: 1 },
  { categoria: 'Primeiros Socorros', enunciado: 'Em caso de suspeita de lesão na coluna, o socorrista deve:', alternativas: ['Movimentar a vítima para local seguro', 'Manter a vítima imóvel e aguardar os socorros', 'Sentar a vítima', 'Dar água à vítima'], correta: 1 },

  /* Mecânica Básica (5) */
  { categoria: 'Mecânica Básica', enunciado: 'A luz vermelha de óleo acesa no painel indica:', alternativas: ['Combustível baixo', 'Problema de lubrificação — pare o veículo imediatamente', 'Pneu furado', 'Bateria fraca'], correta: 1 },
  { categoria: 'Mecânica Básica', enunciado: 'A calibragem correta dos pneus:', alternativas: ['Deve ser sempre acima do indicado', 'Deve seguir o manual do fabricante', 'Não importa', 'Deve ser mínima possível'], correta: 1 },
  { categoria: 'Mecânica Básica', enunciado: 'O radiador do veículo tem função de:', alternativas: ['Arrefecer o motor', 'Gerar energia', 'Acelerar o carro', 'Filtrar o ar'], correta: 0 },
  { categoria: 'Mecânica Básica', enunciado: 'Cinto de segurança com defeito no estribo:', alternativas: ['Pode continuar usado', 'Deve ser reparado ou substituído imediatamente', 'Só funciona no banco traseiro', 'Nada afeta'], correta: 1 },
  { categoria: 'Mecânica Básica', enunciado: 'Bateria descarregada pode ser identificada por:', alternativas: ['Faróis fracos ao ligar e clique ao dar partida', 'Pneus murcho', 'Ruído no freio', 'Óleo escuro'], correta: 0 }
];
