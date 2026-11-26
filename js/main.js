/* Site faire-part — Maëlle & Raphaël
   Comportements : formulaire de réponse et page « Vos musiques ».
   Pas de back-end : rien n'est enregistré côté serveur. */
(function () {
  'use strict';

  /* ---------- Réponse ---------- */
  var formReponse = document.getElementById('formulaire-reponse');
  if (formReponse) {
    var details = document.getElementById('details-presence');
    var boutonsPresence = formReponse.querySelectorAll('[data-presence]');
    var presence = 'oui';

    boutonsPresence.forEach(function (bouton) {
      bouton.addEventListener('click', function () {
        presence = bouton.getAttribute('data-presence');
        boutonsPresence.forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === bouton));
        });
        details.hidden = presence !== 'oui';
      });
    });

    formReponse.querySelectorAll('[data-compteur]').forEach(function (compteur) {
      var min = Number(compteur.getAttribute('data-min'));
      var max = Number(compteur.getAttribute('data-max'));
      var sortie = compteur.querySelector('output');
      var champ = compteur.querySelector('input[type="hidden"]');
      var moins = compteur.querySelector('[data-pas="-1"]');
      var plus = compteur.querySelector('[data-pas="1"]');
      var maj = function (valeur) {
        valeur = Math.max(min, Math.min(max, valeur));
        sortie.textContent = valeur;
        champ.value = valeur;
        moins.disabled = valeur <= min;
        plus.disabled = valeur >= max;
      };
      moins.addEventListener('click', function () { maj(Number(champ.value) - 1); });
      plus.addEventListener('click', function () { maj(Number(champ.value) + 1); });
      maj(Number(champ.value));
    });

    formReponse.addEventListener('submit', function (e) {
      e.preventDefault();
      var nom = document.getElementById('nom');
      if (!nom.value.trim()) {
        nom.setAttribute('aria-invalid', 'true');
        nom.focus();
        return;
      }
      window.location.href = presence === 'oui' ? 'merci-oui.html' : 'merci-non.html';
    });
  }

  /* ---------- Vos musiques ---------- */
  var formMusiques = document.getElementById('formulaire-musiques');
  if (formMusiques) {
    // HYPOTHÈSE : catalogue de démonstration, à remplacer par une API (iTunes, Deezer…).
    var catalogue = [
      { id: 1, titre: 'September', artiste: 'Earth, Wind & Fire' },
      { id: 2, titre: 'Dancing Queen', artiste: 'ABBA' },
      { id: 3, titre: 'Alors on danse', artiste: 'Stromae' },
      { id: 4, titre: 'Les Démons de minuit', artiste: 'Images' },
      { id: 5, titre: 'I Wanna Dance with Somebody', artiste: 'Whitney Houston' },
      { id: 6, titre: 'Champs-Élysées', artiste: 'Joe Dassin' },
      { id: 7, titre: 'Uptown Funk', artiste: 'Mark Ronson ft. Bruno Mars' },
      { id: 8, titre: 'Le Lac Majeur', artiste: 'Mort Shuman' },
      { id: 9, titre: 'Get Lucky', artiste: 'Daft Punk' },
      { id: 10, titre: 'Mon truc en plumes', artiste: 'Zizi Jeanmaire' }
    ];
    var selection = [];
    var proposees = [];

    var champRecherche = document.getElementById('recherche');
    var listeResultats = document.getElementById('resultats');
    var listeSelection = document.getElementById('selection');
    var selectionVide = document.getElementById('selection-vide');
    var nbSelection = document.getElementById('nb-selection');
    var corpsProposees = document.getElementById('proposees');
    var proposeesVide = document.getElementById('proposees-vide');
    var nbProposees = document.getElementById('nb-proposees');
    var remerciement = document.getElementById('remerciement');

    var normaliser = function (texte) {
      return texte.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    };

    var ligneChanson = function (chanson) {
      var li = document.createElement('li');
      var texte = document.createElement('span');
      var titre = document.createElement('span');
      titre.className = 'titre';
      titre.textContent = chanson.titre;
      var artiste = document.createElement('span');
      artiste.className = 'artiste';
      artiste.textContent = ' · ' + chanson.artiste;
      texte.appendChild(titre);
      texte.appendChild(artiste);
      li.appendChild(texte);
      return li;
    };

    var afficherResultats = function () {
      var q = normaliser(champRecherche.value.trim());
      listeResultats.textContent = '';
      if (q.length < 2) return;
      var choisis = selection.map(function (c) { return c.id; });
      catalogue
        .filter(function (c) {
          return normaliser(c.titre + ' ' + c.artiste).indexOf(q) !== -1 && choisis.indexOf(c.id) === -1;
        })
        .slice(0, 5)
        .forEach(function (c) {
          var li = ligneChanson(c);
          var bouton = document.createElement('button');
          bouton.type = 'button';
          bouton.className = 'ajouter';
          bouton.textContent = 'Ajouter';
          bouton.setAttribute('aria-label', 'Ajouter ' + c.titre);
          bouton.addEventListener('click', function () {
            selection.push(c);
            champRecherche.value = '';
            afficherResultats();
            afficherSelection();
            champRecherche.focus();
          });
          li.appendChild(bouton);
          listeResultats.appendChild(li);
        });
    };

    var afficherSelection = function () {
      listeSelection.textContent = '';
      nbSelection.textContent = selection.length;
      selectionVide.hidden = selection.length > 0;
      selection.forEach(function (c) {
        var li = ligneChanson(c);
        var bouton = document.createElement('button');
        bouton.type = 'button';
        bouton.className = 'retirer';
        bouton.textContent = '×';
        bouton.setAttribute('aria-label', 'Retirer ' + c.titre);
        bouton.addEventListener('click', function () {
          selection = selection.filter(function (x) { return x.id !== c.id; });
          afficherSelection();
          afficherResultats();
        });
        li.appendChild(bouton);
        listeSelection.appendChild(li);
      });
    };

    var afficherProposees = function () {
      corpsProposees.textContent = '';
      nbProposees.textContent = proposees.length;
      proposeesVide.hidden = proposees.length > 0;
      proposees.forEach(function (p) {
        var tr = document.createElement('tr');
        [p.titre, p.artiste, p.par].forEach(function (valeur, i) {
          var td = document.createElement('td');
          td.textContent = valeur;
          if (i === 2) td.className = 'par';
          tr.appendChild(td);
        });
        corpsProposees.appendChild(tr);
      });
    };

    champRecherche.addEventListener('input', afficherResultats);

    formMusiques.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!selection.length) {
        champRecherche.focus();
        return;
      }
      var par = document.getElementById('prenom').value.trim() || 'Anonyme';
      proposees = selection.map(function (c) {
        return { titre: c.titre, artiste: c.artiste, par: par };
      }).concat(proposees);
      selection = [];
      afficherSelection();
      afficherProposees();
      formMusiques.hidden = true;
      remerciement.hidden = false;
    });

    document.getElementById('proposer-encore').addEventListener('click', function () {
      remerciement.hidden = true;
      formMusiques.hidden = false;
      champRecherche.focus();
    });

    afficherSelection();
    afficherProposees();
  }
})();
