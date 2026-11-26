/* Site faire-part — Maëlle & Raphaël
   Comportements : formulaire de réponse et page « Vos musiques ».
   Pas de back-end : rien n'est enregistré côté serveur. */
(function () {
  'use strict';

  /* ---------- Animations ---------- */
  var animations = !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    'IntersectionObserver' in window;

  if (animations) {
    document.documentElement.classList.add('anime');

    // Pages intérieures : ordre d'entrée des blocs
    document.querySelectorAll('.page-contenu, .entete-page').forEach(function (bloc) {
      Array.prototype.forEach.call(bloc.children, function (enfant, i) {
        enfant.style.setProperty('--i', i);
      });
    });

    // Accueil : apparitions au défilement, section par section
    var marquer = function (el, type, i) {
      el.classList.add('reveal');
      if (type) el.classList.add('reveal-' + type);
      el.style.setProperty('--i', i);
    };
    document.querySelectorAll('.section').forEach(function (section) {
      var i = 0;
      section.querySelectorAll(
        '.guirlande, .surtitre, h2, .texte-empile > *, .italique, .chateau, .histoire-photo,' +
        '.etape, .couleurs li, .presence p, .presence .bouton, .info, .contact .intro, .personne'
      ).forEach(function (el) {
        if (el.closest('.etape') && !el.classList.contains('etape')) return;
        if (el.closest('.texte-empile') && el.parentElement !== el.closest('.texte-empile')) return;
        if (el.classList.contains('reveal')) return;
        var type = '';
        if (el.matches('h2')) type = 'ecrire';
        else if (el.matches('.chateau, .histoire-photo')) type = 'aquarelle';
        else if (el.matches('.couleurs li')) type = 'pop';
        else if (el.matches('.guirlande')) type = 'guirlande';
        marquer(el, type, i++);
      });
    });

    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (entree) {
        if (!entree.isIntersecting) return;
        var cible = entree.target.revealCible || entree.target;
        cible.classList.add(cible.classList.contains('infos') ? 'trace' : 'visible');
        observateur.unobserve(entree.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal, .infos').forEach(function (el) {
      // Un titre masqué par clip-path n'a pas de surface visible : on observe son parent
      if (el.classList.contains('reveal-ecrire')) {
        var temoin = document.createElement('span');
        temoin.setAttribute('aria-hidden', 'true');
        temoin.style.cssText = 'position:absolute;left:0;right:0;height:1px;pointer-events:none';
        el.parentElement.insertBefore(temoin, el);
        temoin.revealCible = el;
        observateur.observe(temoin);
        return;
      }
      observateur.observe(el);
    });

    // Étapes : défilement aimanté et repères latéraux
    var etapes = document.querySelectorAll('[data-etape]');
    if (etapes.length > 1) {
      document.documentElement.classList.add('etapes-actives');
      var reperes = document.createElement('nav');
      reperes.className = 'reperes';
      reperes.setAttribute('aria-label', 'Étapes de la page');
      var liens = [];
      etapes.forEach(function (etape) {
        var lien = document.createElement('a');
        lien.href = '#' + etape.id;
        var libelle = document.createElement('span');
        libelle.textContent = etape.getAttribute('data-etape');
        lien.appendChild(libelle);
        reperes.appendChild(lien);
        liens.push(lien);
      });
      document.body.appendChild(reperes);

      var suivi = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (entree) {
          if (!entree.isIntersecting) return;
          var index = Array.prototype.indexOf.call(etapes, entree.target);
          liens.forEach(function (l, i) {
            if (i === index) l.setAttribute('aria-current', 'step');
            else l.removeAttribute('aria-current');
          });
          reperes.classList.toggle('visible', index > 0);
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      etapes.forEach(function (e) { suivi.observe(e); });
    }

    // Ordinateur : une molette ou une touche = une étape (si l'étape tient dans l'écran)
    var grandEcran = window.matchMedia('(min-width: 900px) and (min-height: 640px)');
    if (etapes.length > 1) {
      var verrou = false;
      var cumul = 0;
      var indexCourant = function () {
        var milieu = window.innerHeight / 2;
        var courant = 0;
        etapes.forEach(function (e, i) { if (e.getBoundingClientRect().top <= milieu) courant = i; });
        return courant;
      };
      var allerA = function (i) {
        var cible = i >= etapes.length ? document.querySelector('.pied') : etapes[Math.max(0, i)];
        if (!cible) return;
        verrou = true;
        var y = i >= etapes.length
          ? document.documentElement.scrollHeight
          : cible.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: y, behavior: 'smooth' });
        setTimeout(function () { verrou = false; cumul = 0; }, 950);
      };
      // Laisse défiler librement à l'intérieur d'une étape plus haute que l'écran
      var libre = function (sens) {
        var e = etapes[indexCourant()];
        var r = e.getBoundingClientRect();
        return sens > 0 ? r.bottom > window.innerHeight + 4 : r.top < -4;
      };
      var guider = function (sens, evenement) {
        if (!grandEcran.matches) return;
        if (libre(sens)) return;
        evenement.preventDefault();
        if (verrou) return;
        var i = indexCourant();
        // Dans le pied de page, on remonte vers la dernière étape
        if (sens < 0 && etapes[i].getBoundingClientRect().top < -4) { allerA(i); return; }
        allerA(i + sens);
      };
      var syncClasse = function () {
        document.documentElement.classList.toggle('etapes-guidees', grandEcran.matches);
      };
      syncClasse();
      if (grandEcran.addEventListener) grandEcran.addEventListener('change', syncClasse);

      window.addEventListener('wheel', function (e) {
        if (!grandEcran.matches || e.ctrlKey) return;
        var sens = e.deltaY > 0 ? 1 : -1;
        if (libre(sens)) return;
        e.preventDefault();
        if (verrou) return;
        cumul += e.deltaY;
        if (Math.abs(cumul) < 30) return;
        guider(sens, e);
      }, { passive: false });

      window.addEventListener('keydown', function (e) {
        if (e.target.closest && e.target.closest('input, textarea, select, button')) return;
        var touches = { PageDown: 1, ArrowDown: 1, ' ': 1, PageUp: -1, ArrowUp: -1 };
        if (e.key === ' ' && e.shiftKey) touches[' '] = -1;
        var sens = touches[e.key];
        if (sens) guider(sens, e);
      });
    }

    // Légère profondeur sur les fleurs d'ouverture
    var fleurs = document.querySelectorAll('.fleurs');
    if (fleurs.length) {
      var enAttente = false;
      window.addEventListener('scroll', function () {
        if (enAttente) return;
        enAttente = true;
        requestAnimationFrame(function () {
          var y = Math.min(window.scrollY, 900);
          fleurs[0].style.translate = '0 ' + (-y * 0.18) + 'px';
          if (fleurs[1]) fleurs[1].style.translate = '0 ' + (y * 0.12) + 'px';
          enAttente = false;
        });
      }, { passive: true });
    }
  }

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
