"""Gera a pasta Simulados-Offline/ com as 4 páginas autocontidas.

Tudo embutido (CSS, JS e placas em base64): basta dar duplo clique no
index.html, sem internet e sem instalar nada. Os dados ficam no
localStorage do navegador (modo local forçado).
"""
import base64
import mimetypes
import os
import re
import shutil

RAIZ = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(RAIZ, 'Simulados-Offline')

PAGINAS = {
    'index.html': (['css/style.css'],
                   ['js/config.js', 'js/banco-questoes.js', 'js/placas.js',
                    'js/db.js', 'js/auth.js', 'js/main.js']),
    'painel.html': (['css/style.css'],
                    ['js/config.js', 'js/banco-questoes.js', 'js/placas.js',
                     'js/db.js', 'js/auth.js', 'js/painel.js']),
    'simulado.html': (['css/style.css'],
                      ['js/config.js', 'js/banco-questoes.js', 'js/placas.js',
                       'js/db.js', 'js/auth.js', 'js/simulado.js']),
    'admin.html': (['css/style.css', 'css/admin.css'],
                   ['js/config.js', 'js/banco-questoes.js', 'js/placas.js',
                    'js/db.js', 'js/auth.js', 'js/admin.js']),
}

CONFIG_OFFLINE = ("/* Configuração fixa do modo offline: sempre local. */\n"
                  "window.SUPABASE = { url: '', anonKey: '' };\n")


def data_url(caminho):
    with open(caminho, 'rb') as f:
        bruto = f.read()
    mime, _ = mimetypes.guess_type(caminho)
    if caminho.endswith('.svg'):
        mime = 'image/svg+xml'
    return 'data:' + (mime or 'application/octet-stream') + ';base64,' + base64.b64encode(bruto).decode('ascii')


def main():
    placas = {}
    pasta = os.path.join(RAIZ, 'assets', 'placas')
    for nome in sorted(os.listdir(pasta)):
        placas['assets/placas/' + nome] = data_url(os.path.join(pasta, nome))
    print(f'placas embutidas: {len(placas)}')

    with open(os.path.join(RAIZ, 'js', 'placas.js'), encoding='utf-8') as f:
        mapa = f.read()
    placas_por_chave = {}
    for chave, arq in re.findall(r"['\"]?([A-Za-z0-9_-]+)['\"]?\s*:\s*'([^']+)'", mapa):
        caminho = 'assets/placas/' + arq
        if caminho in placas:
            placas_por_chave[chave] = placas[caminho]
    assert len(placas_por_chave) == 31, len(placas_por_chave)

    if os.path.isdir(DEST):
        shutil.rmtree(DEST)
    os.makedirs(DEST)

    for pagina, (csss, jss) in PAGINAS.items():
        with open(os.path.join(RAIZ, pagina), encoding='utf-8') as f:
            html = f.read()

        logo = data_url(os.path.join(RAIZ, 'assets', 'logo-renascer.png'))
        html = html.replace('assets/logo-renascer.png', logo)

        for css in csss:
            with open(os.path.join(RAIZ, css), encoding='utf-8') as f:
                conteudo = f.read()
            assert 'http://' not in conteudo and 'https://' not in conteudo, css
            tag = f'<link rel="stylesheet" href="{css}">'
            assert tag in html, (pagina, css)
            html = html.replace(tag, '<style>\n' + conteudo + '\n</style>')

        for js in jss:
            if js == 'js/config.js':
                conteudo = CONFIG_OFFLINE
            else:
                with open(os.path.join(RAIZ, js), encoding='utf-8') as f:
                    conteudo = f.read()
            assert '</script' not in conteudo.lower(), js
            conteudo = conteudo.replace('assets/logo-renascer.png', logo)
            tag = f'<script src="{js}"></script>'
            assert tag in html, (pagina, js)
            html = html.replace(tag, '<script>\n' + conteudo + '\n</script>')
            if js == 'js/placas.js':
                b64 = '/* Placas embutidas (offline). */\nconst PLACAS_B64 = {\n' + ''.join(
                    f'  {k!r}: {v!r},\n' for k, v in placas_por_chave.items()
                ) + '};\n'
                html += ''  # será inserido abaixo via marcador
                html = html.replace(
                    '<script>\n' + conteudo + '\n</script>',
                    '<script>\n' + conteudo + '\n</script>\n<script>\n' + b64 + '</script>',
                    1)

        restantes = re.findall(r'assets/placas/[A-Za-z0-9_.-]+\.(?:svg|jpg|png)', html)
        assert not restantes, restantes
        assert '<link rel="stylesheet"' not in html and '<script src="js/' not in html
        with open(os.path.join(DEST, pagina), 'w', encoding='utf-8') as f:
            f.write(html)
        print(f'{pagina}: {os.path.getsize(os.path.join(DEST, pagina)) // 1024} KB')

    leia = ('SIMULADOS ABCDETRAN — VERSÃO OFFLINE\n'
            '====================================\n'
            '1. Dê duplo clique em index.html (não precisa de internet).\n'
            '2. CPF de teste: 11111111111 (11 dígitos) + seta verde.\n'
            '3. Os dados ficam salvos neste navegador (localStorage).\n'
            'Para gerar de novo após mudar o projeto: python build_offline.py\n')
    with open(os.path.join(DEST, 'LEIA-ME.txt'), 'w', encoding='utf-8') as f:
        f.write(leia)
    print('pasta Simulados-Offline pronta')


if __name__ == '__main__':
    main()
