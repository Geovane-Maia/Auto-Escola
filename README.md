# Autoescola Renascer — Simulados ABCDETRAN

## ▶ Comece aqui (offline, sem internet)

1. Baixe o ZIP do repositório e extraia a pasta.
2. Dê **duplo clique** em `ABRIR-SIMULADO-OFFLINE.bat` (Windows) — ou abra `ABRIR-SIMULADO-OFFLINE.html` em qualquer sistema.
3. Digite o CPF de teste `11111111111` no teclado virtual e clique na seta verde.

> Funciona sem internet: a pasta `Simulados-Offline/` tem o sistema completo autocontido. O `ABRIR-SIMULADO-OFFLINE` só aponta para ela.

## 📞 Contato

Autoescola Renascer — (85) 99615-6124 · (88) 98233-2839 · (85) 98887-3335 · Instagram @autoescola_renascer

## 📁 O que é cada coisa

| Item | Para que serve |
|------|----------------|
| `ABRIR-SIMULADO-OFFLINE.bat` / `.html` | **Entrada do sistema offline (duplo clique)** |
| `Simulados-Offline/` | Sistema pronto p/ usar sem internet (gerado por `build_offline.py`) |
| Botão 🔊 | **Leitura em áudio** da página (enunciados, alternativas e avisos) — funciona offline |
| `docs/` | Manual do aluno (PDF) e apresentação interativa (PPTX) |
| `index.html`, `painel.html`, `simulado.html`, `admin.html` | Código-fonte do site (precisa de servidor local ou internet p/ nuvem) |
| `supabase-schema.sql` | Banco na nuvem (opcional) |

Site de simulados do DETRAN em **HTML/CSS/JS puro**, seguindo exatamente o guia visual **ABCDETRAN** (paleta verde/laranja/azul e ciclo de 3 passos). Os dados usam **Supabase (PostgreSQL)** quando configurado — ou funcionam localmente no navegador como fallback.

## 📁 Estrutura

```
auto_escola/
├── index.html            → Login do aluno (teclado virtual de CPF) + acesso admin
├── painel.html           → Área do aluno (boas-vindas, cadernos, histórico)
├── simulado.html         → Tela da prova (3 zonas: contexto / decisão / navegação)
├── admin.html            → Painel administrativo (CRUD completo)
├── css/
│   ├── style.css         → Tema ABCDETRAN (paleta + botões + zonas da prova)
│   └── admin.css         → Estilos extras do painel admin
├── js/
│   ├── config.js         → Credenciais do Supabase (preencher para usar o banco)
│   ├── banco-questoes.js → 50 questões do Simulado Final (Sindcfcs · com gabarito)
│   ├── placas.js         → Mapa das 30 placas (arquivos em assets/placas/)
│   ├── db.js             → Camada de dados (Supabase REST ou localStorage) + seed sem duplicar
├── assets/
│   └── placas/           → 30 placas: diagramas oficiais do CTB (Wikimedia Commons, R/A) + 5 ilustrativas em SVG
│   ├── auth.js           → Validação de CPF + sessão
│   ├── main.js           → Login com teclado virtual
│   ├── painel.js         → Cadernos e histórico (nome, turma, último acesso, IP)
│   ├── simulado.js       → Motor da prova (selecionar → confirmar → avançar)
│   └── admin.js          → CRUD de alunos, perguntas e resultados
└── supabase-schema.sql   → Script SQL para criar as tabelas no Supabase
```

## 🎨 Paleta ABCDETRAN (exata do guia)

| Uso | Cor | Hex |
|-----|-----|-----|
| Entrar / header / aprovado | Verde | `#34A14C` / esc `#237A36` |
| Confirmar Resposta (✓) | Laranja | `#E67F24` / esc `#B95F0E` |
| Avançar (›) | Azul | `#2F66AC` / esc `#1D4A86` |
| Zona de Contexto (enunciado) | Verde-claro | `#C3E6C5` |
| Zona de Decisão (alternativas) | Bege | `#FCE0A6` |
| Zona de Navegação (botões) | Azul-claro | `#A9C6E6` |
| Aviso de pendências | Vermelho | `#C62828` |
| Fundo geral | Cinza-claro | `#EFF3F5` |

Padrão dos botões: retangular 8px, borda inferior 4px mais escura (efeito 3D), ícone branco grande.

## 🚀 Como rodar

```bash
npx serve .        # ou: python -m http.server 8000
```

Abra `http://localhost:8000`.

## 🧪 CPF de teste (Administrador)

Para testes, use o acesso padrão já semeado automaticamente:

- CPF: `111.111.111-11` (digite `11111111111` no teclado virtual + seta verde `→`)
- Nome: `Administrador` · Turma: `Administrador`

> O seed em `js/db.js` cria esse aluno se não existir (local + Supabase). A validação em `js/auth.js` libera esse CPF mesmo sendo dígito repetido.

## ✅ Conformidade com o passo a passo (fotos do guia)

- [x] **Passo 1 — CPF:** teclado virtual, 11 algarismos, sem pontos/traços, `«` laranja apaga, `→` verde entra.
- [x] **Passo 2 — Identidade + Caderno:** boas-vindas com nome, turma, último acesso e IP; cartão `Caderno Nº 01 / Tipo: SIMULADO / ACESSAR O CADERNO`.
- [x] **Anatomia da prova:** Zona Contexto (verde-clara, enunciado + placa), Zona Decisão (bege, quadrados brancos A–D), Zona Navegação (azul-clara).
- [x] **Regra de Ouro (3 passos):** 1) Selecionar (borda preta pontilhada) → 2) Confirmar no botão laranja `✓` → 3) Avançar no botão azul `›`. Não avança sem confirmar.
- [x] **Passo 4 — Pendências:** `Aviso: Ainda existem questões a serem resolvidas.` + salto até a pendência (Retorne → Marque → Grave laranja → Siga azul).
- [x] **Passo 5 — Chegada:** `Disciplina concluída! »` somente após responder e confirmar todas as 30.
- [x] **Checklist:** teclado só números, meta 30 questões, confirmação visual pontilhada, regra laranja, conclusão automática.
- [x] **Tempo:** 2 horas de prova.

## 🗄️ Banco de dados (Supabase)

O site vem pronto para usar **Supabase** (PostgreSQL com API REST — funciona direto do navegador, sem backend). Enquanto não configurado, tudo é salvo **localmente no navegador** (por dispositivo).

### Para ativar o banco na nuvem:

1. Crie uma conta grátis em [supabase.com](https://supabase.com) e crie um projeto.
2. No painel, vá em **SQL Editor**, cole o conteúdo de `supabase-schema.sql` e clique em **Run** (já inclui o aluno `Administrador / 11111111111`).
3. Vá em **Settings → API** e copie a **Project URL** e a **anon key**.
4. Abra `js/config.js` e preencha:

```js
window.SUPABASE = {
  url: 'https://SEU-PROJETO.supabase.co',
  anonKey: 'sua-chave-anon-aqui'
};
```

5. Pronto — alunos, perguntas e resultados passam a valer em **qualquer dispositivo**.

> **Admin inicial:** usuário `admin`, senha `admin123` (troque em Configurações após o primeiro acesso). O seed automático popula as 30 perguntas na primeira execução.

## 👨‍🎓 Acesso do aluno

1. Aluno cadastrado pelo admin (nome, CPF, turma).
2. Na tela inicial, digite o **CPF no teclado virtual** (11 dígitos) e clique na **seta verde →**.
3. No painel, confira nome/turma/IP e clique no **cartão do caderno** → responda → veja nota e gabarito.

## 📊 Como funciona a prova

- **Tempo:** 2 horas.
- **Ciclo:** 1) **Selecionar** a alternativa (borda preta pontilhada) → 2) **CONFIRMAR RESPOSTA** (botão laranja `✓`) → 3) **AVANÇAR** (botão azul `›`).
- **Pendências:** o sistema não deixa finalizar com questões em branco (aviso vermelho + salto até a pendência).
- **Conclusão:** tela `Disciplina concluída! »` com nota (aprovado ≥ 70%) e gabarito.

## 🔐 Painel do administrador

Acesso: link "Área do administrador" no rodapé do login.

- **Alunos:** criar, editar (nome, CPF, turma, ativo), excluir, buscar.
- **Perguntas:** criar, editar, excluir; categorias: Legislação, Sinalização, Direção Defensiva, Primeiros Socorros, Mecânica Básica.
- **Imagem da placa:** 31 questões exibem a placa em SVG na Zona de Contexto (e no gabarito). No modal da pergunta, botão `📷 Subir imagem` (PNG/JPG até 2MB, reduzida auto a 600px) ou escolha uma das 30 placas padrão no seletor.
- **Resultados:** ver todos, excluir individual ou limpar tudo.
- **Configurações:** trocar senha do admin; exportar backup JSON (importação apenas no modo local).

## 📕 Manual do aluno (PDF)

O arquivo `docs/Guia-do-Aluno-ABCDETRAN.pdf` traz toda a orientação de uso da plataforma de questionário (sem a parte de administrador): 5 etapas, 3 botões, teclado de CPF, 3 zonas da prova, regra de ouro, pendências, conclusão e check-list.

## 📊 Apresentação interativa (PowerPoint)

O arquivo `docs/Apresentacao-Interativa-ABCDETRAN.pptx` (16 slides) ensina a usar o sistema de forma interativa:

- **Menu clicável** com 6 opções que saltam direto ao assunto.
- **Quiz com escolhas:** 2 perguntas de múltipla escolha; cada alternativa é clicável e leva a um feedback de acerto (verde) ou erro (vermelho), com botões `Tentar de novo`, `Próxima` e `MENU`.
- Navegação completa: `COMEÇAR`, `AVANÇAR`, `MENU` e `RECOMEÇAR` em todas as telas.
- Para apresentar: abra no PowerPoint e use o modo **Apresentação de Slides (F5)** — os cliques nos botões navegam entre os slides.

## 🪧 Créditos das placas

As imagens de sinalização em `assets/placas/` misturam diagramas oficiais do CTB (R-1, R-6a, R-7, R-9, R-10, R-25a, R-25c, R-26, R-29, R-37, R-38, A-2a, A-14, A-15, A-19, A-25, A-31, A-35, A-39, A-32b, A-33b + foto de placa Mercosul, via Wikimedia Commons) com ilustrativas em SVG próprio no traço oficial para as demais (o Wikimedia bloqueou novos downloads deste IP; R-3 e R-34 do Commons divergiam das legendas e foram refeitos).

## 💻 Versão offline (sem internet, sem instalar)

A pasta `Simulados-Offline/` contém as 4 páginas **autocontidas** (CSS, JS e as 30 placas embutidos): basta dar **duplo clique em `index.html`**, mesmo sem internet. Os dados ficam no navegador (modo local).

Para regenerar após qualquer mudança no projeto:

```bash
python build_offline.py
```

> Um `.exe` tradicional seria ~200 MB (embute um navegador inteiro) e complicaria cada atualização. A versão offline faz o mesmo — abrir com duplo clique, sem internet — com ~230 KB por página, usando o navegador que já existe no PC.

## ⬆️ Como subir para o GitHub

```bash
cd auto_escola
git init
git add .
git commit -m "Simulados ABCDETRAN + CPF de teste"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git push -u origin main
```

> Não suba `js/config.js` com chaves reais para repositório público — use variáveis ou mantenha o arquivo com valores vazios (como está por padrão). O `.gitignore` já ignora logs locais.

## ⚠️ Observações

- Sem Supabase configurado, os dados ficam no `localStorage` (valem por dispositivo/navegador).
- Com Supabase, as tabelas usam a chave anon com acesso público (adequado para projeto escolar; para produção maior, restrinja com autenticação).
- O banco tem **50 questões** do Simulado Final (Sindcfcs · adaptado ao Banco Nacional), com gabarito e alternativas embaralhadas. A prova sorteia **30 por vez**.
- Ao trocar de banco, o seed substitui integralmente as anteriores (marcador de versão).
