/* =========================================================
   ABCDETRAN — Leitura em áudio (Web Speech API)
   Botão flutuante 🔊 lê os elementos com [data-audio].
   Usa as vozes do próprio sistema: funciona offline.
   ========================================================= */
(() => {
  const temVoz = 'speechSynthesis' in window;
  let lendo = false;
  let btn = null;

  function textosParaLer() {
    return [...document.querySelectorAll('[data-audio]')]
      .filter(e => e.offsetParent !== null)
      .map(e => e.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('. ');
  }

  function falar() {
    if (!temVoz) return;
    parar();
    const texto = textosParaLer();
    if (!texto) return;
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'pt-BR';
    u.rate = 1;
    const voz = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith('pt'));
    if (voz) u.voice = voz;
    u.onend = () => { lendo = false; atualiza(); };
    u.onerror = () => { lendo = false; atualiza(); };
    lendo = true;
    atualiza();
    speechSynthesis.speak(u);
  }

  function parar() {
    if (temVoz) speechSynthesis.cancel();
    lendo = false;
    atualiza();
  }

  function atualiza() {
    if (!btn) return;
    btn.textContent = lendo ? '⏹' : '🔊';
    btn.title = lendo ? 'Parar leitura' : 'Ouvir o conteúdo da página';
    btn.setAttribute('aria-label', btn.title);
    btn.classList.toggle('tocando', lendo);
  }

  function init() {
    if (!temVoz) return;
    btn = document.createElement('button');
    btn.className = 'btn-audio';
    btn.type = 'button';
    atualiza();
    btn.addEventListener('click', () => (lendo ? parar() : falar()));
    document.body.appendChild(btn);
    window.addEventListener('beforeunload', () => { if (temVoz) speechSynthesis.cancel(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
