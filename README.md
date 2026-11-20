# Cap Brevet Maths

Application gratuite de révision des mathématiques pour le brevet des collèges (cycle 4).
Elle marche sur téléphone et sur ordinateur, s'installe comme une appli et fonctionne **sans connexion** une fois ouverte une première fois.

**Adresse :** https://profds29-coder.github.io/cap-brevet/

## Ce qu'on y trouve
- 17 notions du programme, 82 modèles de questions tirées au hasard, 4 niveaux par notion.
- La révision du jour (6 questions).
- L'épreuve d'automatismes : 15 questions, 20 minutes, sur 6 points.
- L'épreuve de problèmes : 1 h 40, sur 14 points, avec erreur reportée.
- Le brevet blanc complet sur 20, avec option tiers-temps.
- Les progrès par notion.

## Données personnelles
Aucun compte, seulement un pseudo. Tout reste **dans le navigateur de l'appareil** : rien n'est envoyé sur Internet.
Pour changer d'appareil ou par sécurité, utiliser **Réglages → Code de sauvegarde**.

## Installer l'appli
- **Android (Chrome)** : ouvrir l'adresse, menu ⋮ → « Installer l'application » (ou « Ajouter à l'écran d'accueil »).
- **iPhone (Safari)** : ouvrir l'adresse, bouton Partager → « Sur l'écran d'accueil ».
- **Ordinateur (Chrome ou Edge)** : icône d'installation à droite de la barre d'adresse.

## Pour la personne qui modifie le code
- Le code est dans `src/` : `moteur.js` (correction), `notions.js` (questions), `problemes.js` (épreuve de problèmes), `app.js` (écrans), `style.css` et `extra.css`.
- `sh build.sh` reconstruit le dossier `docs/`, qui est le site publié par GitHub Pages (avec le fichier `sw.js` qui garde l'appli hors connexion ; sa version change toute seule à chaque construction).
- Tests : `node tests/test-moteur.js`, `node tests/test-banque.js`, `node tests/test-problemes.js`.
- Polices libres (SIL Open Font License) copiées dans `pwa/fonts/` : Atkinson Hyperlegible et Bricolage Grotesque.
