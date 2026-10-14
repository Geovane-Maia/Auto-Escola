# Como trocar de autoescola

Tudo que identifica a autoescola está num lugar só: **`js/escola-dados.js`**.
Quando pedir a troca, execute nesta ordem:

## 1. Editar os dados

Abra `js/escola-dados.js` e troque os valores (nome, nome curto,
slogan, telefones, instagram):

```js
window.ESCOLA = {
  "nome": "Nova Autoescola",
  "nomeCurto": "Nova",
  ...
};
```

## 2. Trocar a logo

Salve a nova logo em `assets/` (ex.: `assets/logo_nova.png`) e aponte
o campo `"logo"` para ela. O campo `"logoReserva"` é o plano B
(exibido se a principal faltar).

## 3. Regenerar a versão offline

```bash
python build_offline.py
```

Isso recria `Simulados-Offline/` já com nome, logo e contatos novos
(o `LEIA-ME.txt` também usa o nome atual).

## 4. Regenerar PDF e PPTX de `docs/`

Os geradores leem `js/escola-dados.js` via `ler_escola.py`, então basta
recriá-los com os mesmos scripts usados na criação (eles aplicam nome
e contatos da config atual).

## 5. Conferir e subir

```bash
git add .; git commit -m "Marca Nova Autoescola"; git push origin main
```

## O que é automático

- Títulos das páginas, cabeçalhos, marcas do topo, logo (com reserva),
  contatos do rodapé e `LEIA-ME.txt` seguem `js/escola-dados.js`.
- README, títulos de seção e textos internos: ajuste manual se citar o nome.

## O que NÃO troca sozinho

- Dados já salvos no navegador/Supabase (alunos, resultados).
- Nome do repositório no GitHub (troque em Settings, se quiser).
