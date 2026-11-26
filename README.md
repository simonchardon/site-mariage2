# Site faire-part — Maëlle & Raphaël (maquette 2)

Maquette statique en HTML/CSS (sans dépendance ni build) de la version « minimaliste aquarelle » du site de mariage : fond beige, voiles pêche et jaune, titres manuscrits Milton Two, texte Jost, accent vert olive.

- `*.html` : pages, à la racine (accueil `index.html`, réponse `rsvp.html`, merci oui / non, vos musiques)
- `css/style.css` : styles et couleurs (variables en tête de fichier)
- `js/main.js` : boutons et compteurs du formulaire de réponse, recherche de la page « Vos musiques »
- `assets/images/` : illustrations aquarelle générées avec Canva ; `assets/fonts/` : police Milton Two

## Limites connues

- Pas de back-end : le formulaire de réponse redirige vers la page de remerciement sans rien enregistrer, et les musiques proposées ne sont gardées que dans la page.
- La recherche de musiques utilise un petit catalogue de démonstration.
- Les numéros de téléphone, e-mails et hébergements sont des textes provisoires entre crochets.

## Aperçu en local

```sh
python3 -m http.server
```

puis ouvrir http://localhost:8000.
