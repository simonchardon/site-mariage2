/* Site faire-part — Maëlle & Raphaël
   Comportements : formulaire de réponse et page « Vos musiques ».
   Pas de back-end : rien n'est enregistré côté serveur. */
(function () {
  'use strict';

  /* ---------- Rechargement : on repart toujours du début ---------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  var auDebut = function () { window.scrollTo({ top: 0, behavior: 'instant' }); };
  auDebut();
  document.addEventListener('DOMContentLoaded', auDebut);
  window.addEventListener('load', function () {
    auDebut();
    // Certains navigateurs (et l'aperçu intégré) restaurent la position juste après le chargement
    requestAnimationFrame(auDebut);
    setTimeout(auDebut, 60);
    setTimeout(auDebut, 250);
  });
  window.addEventListener('pageshow', auDebut);
  // En quittant ou rechargeant, on remonte d'abord : aucune position n'est mémorisée
  window.addEventListener('beforeunload', auDebut);
  window.addEventListener('pagehide', auDebut);

  // Liens internes (« Faites défiler », repères) : on défile sans ajouter d'ancre à l'adresse
  document.addEventListener('click', function (e) {
    var lien = e.target.closest && e.target.closest('a[href^="#"]');
    if (!lien) return;
    var cible = document.getElementById(lien.getAttribute('href').slice(1));
    if (!cible) return;
    e.preventDefault();
    cible.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });

  /* ---------- Menu burger (mobile) ---------- */
  var entete = document.querySelector('.entete');
  var burger = entete && entete.querySelector('.burger');
  if (burger) {
    var basculerMenu = function (ouvert) {
      entete.classList.toggle('ouvert', ouvert);
      burger.setAttribute('aria-expanded', String(ouvert));
      burger.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
    };
    burger.addEventListener('click', function () { basculerMenu(!entete.classList.contains('ouvert')); });
    // Un lien du menu ou un clic ailleurs referme le menu
    document.addEventListener('click', function (e) {
      if (!entete.classList.contains('ouvert')) return;
      if (e.target.closest('.nav a') || !entete.contains(e.target)) basculerMenu(false);
    }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') basculerMenu(false); });
  }

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

    // Ordinateur : une molette ou une touche = une étape (ou une tranche d'étape haute)
    var grandEcran = window.matchMedia('(min-width: 900px) and (min-height: 640px)');
    if (etapes.length > 1) {
      var verrou = false;
      var cumul = 0;
      var dernierEvenement = 0;
      // Étape qui occupe le haut de l'écran
      var etapeEnHaut = function () {
        var courante = etapes[0];
        etapes.forEach(function (e) { if (e.getBoundingClientRect().top <= 4) courante = e; });
        return courante;
      };
      var glissement = 0; // identifiant du glissement en cours (0 = aucun)
      var allerVers = function (y, dureeVoulue) {
        verrou = true;
        var id = ++glissement;
        var debut = Date.now();
        var depart = window.scrollY;
        var distance = y - depart;
        var duree = dureeVoulue || 1400;
        // Glissement lent, accéléré puis freiné (easeInOutCubic)
        var glisser = function () {
          if (id !== glissement) return; // interrompu (doigt posé sur l'écran)
          var t = Math.min(1, (Date.now() - debut) / duree);
          var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          window.scrollTo({ top: depart + distance * e, behavior: 'instant' });
          if (t < 1) requestAnimationFrame(glisser);
          else setTimeout(function () { if (id === glissement) glissement = 0; }, 80);
        };
        requestAnimationFrame(glisser);
        // On attend la fin du glissement ET la fin de l'inertie du pavé tactile
        var liberer = function () {
          if (Date.now() - debut > duree + 100 && Date.now() - dernierEvenement > 220) {
            verrou = false;
            cumul = 0;
          } else {
            setTimeout(liberer, 60);
          }
        };
        setTimeout(liberer, duree);
      };
      // Prochaine position : la section suivante, ou la suite d'une section plus haute que l'écran
      var cibleSuivante = function (sens) {
        var h = window.innerHeight;
        var y = window.scrollY;
        var pas = Math.round(h * 0.8);
        var r = etapeEnHaut().getBoundingClientRect();
        var cible = null;
        if (sens > 0) {
          // Reste de la section courante sous l'écran : on le montre par tranches
          if (r.bottom > h + 60) return y + Math.min(r.bottom - h, pas);
          etapes.forEach(function (e) { if (!cible && e.getBoundingClientRect().top > 4) cible = e; });
          return cible ? cible.getBoundingClientRect().top + y : document.documentElement.scrollHeight - h;
        }
        // Vers le haut : d'abord le début de la section courante, par tranches si elle est haute
        if (r.top < -60) return y + Math.max(r.top, -pas);
        etapes.forEach(function (e) { if (e.getBoundingClientRect().top < -4) cible = e; });
        if (!cible) return null;
        var rc = cible.getBoundingClientRect();
        // Section précédente haute : on arrive sur sa fin, pas sur son début
        return rc.height > h + 60 ? y + rc.bottom - h : rc.top + y;
      };
      var guider = function (sens, evenement) {
        if (!grandEcran.matches) return;
        evenement.preventDefault();
        if (verrou) return;
        var y = cibleSuivante(sens);
        if (y !== null && Math.abs(y - window.scrollY) > 2) allerVers(Math.max(0, y));
      };
      var syncClasse = function () {
        document.documentElement.classList.toggle('etapes-guidees', grandEcran.matches);
      };
      syncClasse();
      if (grandEcran.addEventListener) grandEcran.addEventListener('change', syncClasse);

      window.addEventListener('wheel', function (e) {
        if (!grandEcran.matches || e.ctrlKey) return;
        var sens = e.deltaY > 0 ? 1 : -1;
        dernierEvenement = Date.now();
        e.preventDefault();
        if (verrou) return;
        cumul += e.deltaY;
        if (Math.abs(cumul) < 30) return;
        guider(sens, e);
      }, { passive: false });

      // Mobile : un écran par section, un geste depuis le bord d'une section = étape voisine.
      // Une section plus haute que l'écran défile nativement à l'intérieur et s'arrête à son bord.
      var racine = document.documentElement;
      var pied = document.querySelector('.pied');
      var principal = document.querySelector('main');
      var derniere = etapes[etapes.length - 1];
      var modeMobile = false;
      var courante = 0;
      var enTransition = false;
      var poser = function () {
        etapes.forEach(function (e, n) {
          e.style.setProperty('--decalage', n - courante);
          e.toggleAttribute('inert', n !== courante);
        });
      };
      var allerPage = function (n) {
        n = Math.max(0, Math.min(etapes.length - 1, n));
        if (n === courante) return;
        var page = etapes[n];
        // En remontant vers une section haute, on arrive sur sa fin
        page.scrollTop = n < courante ? page.scrollHeight : 0;
        courante = n;
        enTransition = true;
        poser();
        setTimeout(function () { enTransition = false; }, 900);
      };
      var activerMobile = function () {
        var m = !grandEcran.matches;
        if (m === modeMobile) return;
        modeMobile = m;
        racine.classList.add('sans-transition');
        racine.classList.toggle('etapes-mobile', m);
        etapes.forEach(function (e) {
          e.classList.toggle('page-etape', m);
          e.scrollTop = 0;
          if (!m) { e.style.removeProperty('--decalage'); e.removeAttribute('inert'); }
        });
        courante = 0;
        if (m) { if (pied) derniere.appendChild(pied); poser(); }
        else if (pied && principal) principal.after(pied);
        window.scrollTo({ top: 0, behavior: 'instant' });
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { racine.classList.remove('sans-transition'); });
        });
      };
      activerMobile();
      if (grandEcran.addEventListener) grandEcran.addEventListener('change', activerMobile);

      var geste = null;
      document.addEventListener('touchstart', function (e) {
        if (!modeMobile || e.touches.length > 1 || (entete && entete.classList.contains('ouvert'))) { geste = null; return; }
        var p = etapes[courante];
        geste = {
          y: e.touches[0].clientY, t: Date.now(), dy: 0, passage: null,
          haut: p.scrollTop <= 1,
          bas: p.scrollTop + p.clientHeight >= p.scrollHeight - 1
        };
      }, { passive: true });
      document.addEventListener('touchmove', function (e) {
        if (!geste || e.touches.length > 1) return;
        if (enTransition) { if (e.cancelable) e.preventDefault(); return; }
        var dy = e.touches[0].clientY - geste.y;
        if (geste.passage === null) {
          if (Math.abs(dy) < 6) return;
          // Le geste part du bord de la section et pousse vers l'extérieur : c'est un passage d'étape
          geste.passage = (dy < 0 && geste.bas) || (dy > 0 && geste.haut);
        }
        if (geste.passage) {
          if (e.cancelable) e.preventDefault();
          geste.dy = dy;
        }
      }, { passive: false });
      var finGeste = function () {
        var g = geste;
        geste = null;
        if (!g || !g.passage || enTransition) return;
        var vitesse = Math.abs(g.dy) / Math.max(1, Date.now() - g.t);
        if (Math.abs(g.dy) > 50 || (Math.abs(g.dy) > 20 && vitesse > 0.3)) allerPage(courante + (g.dy < 0 ? 1 : -1));
      };
      document.addEventListener('touchend', finGeste, { passive: true });
      document.addEventListener('touchcancel', function () { geste = null; }, { passive: true });
      // Liens internes et focus clavier : on change d'écran au lieu de défiler
      document.addEventListener('click', function (e) {
        if (!modeMobile) return;
        var lien = e.target.closest && e.target.closest('a[href^="#"]');
        if (!lien) return;
        var cible = document.getElementById(lien.getAttribute('href').slice(1));
        var page = cible && cible.closest('.page-etape');
        if (!page) return;
        e.preventDefault();
        e.stopPropagation();
        allerPage(Array.prototype.indexOf.call(etapes, page));
      }, true);
      document.addEventListener('focusin', function (e) {
        if (!modeMobile) return;
        var page = e.target.closest && e.target.closest('.page-etape');
        if (page) allerPage(Array.prototype.indexOf.call(etapes, page));
        document.body.scrollTop = 0;
      });

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
        if (enAttente || !grandEcran.matches) return;
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
