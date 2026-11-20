#!/bin/sh
# Construit l'application à partir de src/ :
#  - dist/index.html : un seul fichier (aperçu claude.ai) ;
#  - docs/ : la version installable hors connexion publiée par GitHub Pages.
# Utilisation : sh build.sh
cd "$(dirname "$0")" && mkdir -p dist
python3 - <<'PY'
import hashlib, json, os, re, shutil
shell = open('src/shell.html').read()
css = open('src/style.css').read() + '\n' + open('src/extra.css').read()
js = '\n'.join(open('src/' + f).read() for f in ['moteur.js', 'notions.js', 'problemes.js', 'app.js'])
page = shell.replace('/*CSS*/', css).replace('/*JS*/', js)
open('dist/index.html', 'w').write(page)

# Version GitHub Pages : en-tête complet, polices locales, pas d'appel extérieur.
corps = re.sub(r'<link rel="preconnect".*?>\n|<link rel="stylesheet" href="https://fonts[^>]*>\n|<meta name="claude:[^>]*>\n', '', page)
pages = open('pwa/tete.html').read() + corps + '\n</html>\n'
if os.path.isdir('docs'): shutil.rmtree('docs')
shutil.copytree('pwa', 'docs', ignore=shutil.ignore_patterns('tete.html', 'sw.js'))
open('docs/index.html', 'w').write(pages)
open('docs/.nojekyll', 'w').write('')
fichiers = ['./'] + sorted(os.path.relpath(os.path.join(r, f), 'docs').replace(os.sep, '/')
    for r, _, fs in os.walk('docs') for f in fs if not f.startswith('.'))
h = hashlib.sha256()
for f in fichiers[1:]: h.update(open('docs/' + f, 'rb').read())
sw = open('pwa/sw.js').read().replace('__VERSION__', h.hexdigest()[:10]).replace('__FICHIERS__', json.dumps(fichiers))
open('docs/sw.js', 'w').write(sw)
print('docs/ :', len(fichiers), 'fichiers en cache, version', h.hexdigest()[:10])
PY
echo "dist/index.html : $(wc -c < dist/index.html) octets"
