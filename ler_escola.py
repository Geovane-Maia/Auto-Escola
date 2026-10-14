"""Lê os dados da autoescola de js/escola-dados.js (bloco JSON)."""
import json
import os
import re

RAIZ = os.path.dirname(os.path.abspath(__file__))


def ler_escola():
    with open(os.path.join(RAIZ, 'js', 'escola-dados.js'), encoding='utf-8') as f:
        src = f.read()
    inicio = src.index('{')
    fim = src.rindex('}')
    return json.loads(src[inicio:fim + 1])


if __name__ == '__main__':
    print(ler_escola())
