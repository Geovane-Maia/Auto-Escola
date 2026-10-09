# Auto Escola Quixelô — Simulados (padrão ABCDETRAN)

Site de simulados do DETRAN em **HTML/CSS/JS puro**, seguindo exatamente o guia visual **ABCDETRAN** (paleta verde/laranja/azul e ciclo de 3 passos). Os dados usam **Supabase (PostgreSQL)** quando configurado — ou funcionam localmente no navegador como fallback.

## 📁 Estrutura

```
auto_escola/
├── index.html            → Login do aluno (teclado virtual de CPF) + acesso admin
├── painel.html           → Área do aluno (boas-vindas, cadernos, histórico)
├── simulado.html         → Tela da prova (3 zonas: contexto / decisão / navegação)
├── admin.html            → Painel administrativo (CRUD completo)
├── assets/logo.jpeg      → Logo oficial da Auto Escola Quixelô
├── css/
│   ├── style.css         → Tema ABCDETRAN (paleta + botões + zonas da prova)
│   └── admin.css         → Estilos extras do painel admin
├── js/
│   ├── config.js         → Credenciais do Supabase (preencher para usar o banco)
│   ├── db.js             → Camada de dados (Supabase REST ou localStorage) + seed
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
- [x] **Tempo:** 1 minuto por questão (`N * 60s`; 30 questões = 30 min).

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

- **Tempo:** 1 minuto por questão.
- **Ciclo:** 1) **Selecionar** a alternativa (borda preta pontilhada) → 2) **CONFIRMAR RESPOSTA** (botão laranja `✓`) → 3) **AVANÇAR** (botão azul `›`).
- **Pendências:** o sistema não deixa finalizar com questões em branco (aviso vermelho + salto até a pendência).
- **Conclusão:** tela `Disciplina concluída! »` com nota (aprovado ≥ 70%) e gabarito.

## 🔐 Painel do administrador

Acesso: link "Área do administrador" no rodapé do login.

- **Alunos:** criar, editar (nome, CPF, turma, ativo), excluir, buscar.
- **Perguntas:** criar, editar, excluir; categorias: Legislação, Sinalização, Direção Defensiva, Primeiros Socorros, Mecânica Básica.
- **Imagem da placa:** no modal da pergunta, botão `📷 Subir imagem` (PNG/JPG até 2MB, reduzida auto a 600px) ou placa padrão (seta, proibido, triângulo, P). A imagem aparece na Zona de Contexto da prova.
- **Resultados:** ver todos, excluir individual ou limpar tudo.
- **Configurações:** trocar senha do admin; exportar backup JSON (importação apenas no modo local).

## 📕 Manual do aluno (PDF)

O arquivo `Guia-do-Aluno-ABCDETRAN.pdf` traz toda a orientação de uso da plataforma de questionário (sem a parte de administrador): 5 etapas, 3 botões, teclado de CPF, 3 zonas da prova, regra de ouro, pendências, conclusão e check-list.

## ⬆️ Como subir para o GitHub

```bash
cd auto_escola
git init
git add .
git commit -m "Quixelô simulados — tema ABCDETRAN + CPF de teste"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git push -u origin main
```

> Não suba `js/config.js` com chaves reais para repositório público — use variáveis ou mantenha o arquivo com valores vazios (como está por padrão). O `.gitignore` já ignora logs locais.

## ⚠️ Observações

- Sem Supabase configurado, os dados ficam no `localStorage` (valem por dispositivo/navegador).
- Com Supabase, as tabelas usam a chave anon com acesso público (adequado para projeto escolar; para produção maior, restrinja com autenticação).
- O banco já vem com **30 perguntas iniciais** — adicione mais pelo painel admin.
