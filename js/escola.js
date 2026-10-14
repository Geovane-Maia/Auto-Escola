/* =========================================================
   ABCDETRAN — Aplica os dados de window.ESCOLA (js/escola-dados.js)
   nos elementos com [data-escola]. Chame aplicarEscola() após
   renderizar conteúdo dinâmico (ex.: simulado.js).
   ========================================================= */
function aplicarEscola(root) {
  const E = window.ESCOLA || {};
  const base = root || document;
  base.querySelectorAll('[data-escola="nome"]').forEach(el => { if (E.nome) el.textContent = E.nome; });
  base.querySelectorAll('[data-escola="marca"]').forEach(el => { if (E.nomeCurto) el.textContent = E.nomeCurto + ' · ABCDETRAN'; });
  base.querySelectorAll('[data-escola="marca-admin"]').forEach(el => { if (E.nomeCurto) el.textContent = E.nomeCurto + ' · Admin'; });
  base.querySelectorAll('[data-escola="slogan"]').forEach(el => { if (E.slogan) el.textContent = E.slogan; });
  base.querySelectorAll('img[data-escola="logo"]').forEach(img => {
    if (E.logo) img.src = E.logo;
    img.onerror = () => { img.onerror = null; if (E.logoReserva) img.src = E.logoReserva; };
    if (E.nome) img.alt = E.nome;
  });
  base.querySelectorAll('[data-escola="contato"]').forEach(el => {
    const tels = (E.telefones || []).join(' · ');
    el.innerHTML = tels + (E.instagram ? '<br>' + E.instagram : '');
  });
  const t = document.querySelector('title[data-titulo]');
  if (t && E.nome) document.title = E.nome + ' — ' + t.dataset.titulo;
}
window.aplicarEscola = aplicarEscola;

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => aplicarEscola());
else aplicarEscola();
