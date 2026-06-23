# ECOTRACK — Guide de test complet (User Flows par rôle)

> Document de recette fonctionnelle — à exécuter dans l'ordre indiqué.  
> Chaque section est indépendante et peut être jouée sur un navigateur séparé.

---

## Prérequis

| Élément | Valeur |
|---|---|
| Frontend | `http://localhost:5173` (ou port Vite affiché) |
| Backend | `http://localhost:8000` |
| Base de données | PostgreSQL + données seed chargées |
| Lancer backend | `cd backend && uvicorn app.main:app --reload` |
| Lancer frontend | `cd frontend && npm run dev` |

### Comptes de démonstration (seed)

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@ecotrack.fr` | `Password1!` |
| Manager | `gestionnaire@ecotrack.fr` | `Password1!` |
| Agent | `agent1@ecotrack.fr` | `Password1!` |
| Citoyen | `citoyen1@ecotrack.fr` | `Password1!` |

> **Raccourci** : cliquer sur "Comptes de démonstration" dans la page de login pour pré-remplir automatiquement.

---

## Flux 1 — CITOYEN

> **But** : tester l'inscription, la carte, les signalements et la gamification.

### 1.1 Inscription

1. Aller sur `/register`
2. Remplir : Nom complet = `Test Citoyen`, Email = `test.citoyen@mail.fr`, Mot de passe = `Test1234!`
3. Cliquer **Créer mon compte**
4. ✅ Redirection vers `/map` — sidebar avec "Carte" et "Signaler"
5. Cliquer à nouveau sur `/register` avec le même email
6. ✅ Message d'erreur "Email déjà utilisé"

### 1.2 Connexion / déconnexion

1. Se déconnecter (icône dans la sidebar ou rafraîchir et vider le localStorage)
2. Aller sur `/login`
3. Saisir des credentials incorrects
4. ✅ Message "Identifiants invalides"
5. Cliquer sur **Comptes de démonstration** → sélectionner **Citoyen**
6. ✅ Connexion et redirection vers `/map`

### 1.3 Carte interactive

1. Ouvrir `/map`
2. ✅ Carte Leaflet chargée, tuiles CartoDB Dark Matter
3. ✅ Marqueurs colorés visibles (vert = NORMAL, orange = WATCH, rouge = CRITICAL)
4. Cliquer sur un marqueur
5. ✅ Popup avec QR code, statut, taux de remplissage, zone
6. ✅ Bouton **Signaler** (orange) visible dans la popup — bouton "Voir le détail" absent pour le CITOYEN
7. Dans le panneau gauche : taper un QR code partiel (ex. `CNT`)
8. ✅ Liste filtrée en temps réel
9. Filtrer par statut **CRITICAL**
10. ✅ Seuls les marqueurs critiques restent visibles / surlignés
11. Filtrer par zone
12. ✅ Conteneurs de la zone filtrés

### 1.4 Signalement depuis la carte (chemin principal)

1. Sur `/map`, cliquer sur un marqueur
2. ✅ Popup affiche le bouton **Signaler**
3. Cliquer **Signaler**
4. ✅ Redirection vers `/reports/new` — **l'étape 1 est sautée**, on arrive directement sur le formulaire du problème avec le conteneur déjà sélectionné affiché en haut
5. Choisir **FULL** + ajouter un commentaire
6. Cliquer **Envoyer le signalement**
7. ✅ Toast "Signalement envoyé", retour `/map`

### 1.5 Signalement depuis `/reports/new` (chemin alternatif)

1. Naviguer directement sur `/reports/new`
2. ✅ Étape 1 affichée : champ de recherche texte libre
3. Taper un QR code → sélectionner un conteneur dans la liste
4. ✅ Passage automatique à l'étape 2 (formulaire du problème)
5. Choisir **DAMAGED** + laisser le commentaire vide
6. Cliquer **Envoyer le signalement**
7. ✅ Toast "Signalement envoyé", retour `/map`

### 1.6 Signalement — doublon

1. Depuis la carte, cliquer sur le **même conteneur** que précédemment → **Signaler**
2. ✅ Arrivée directe à l'étape 2
3. Sélectionner un type et envoyer
4. ✅ Toast d'erreur avec les 8 premiers caractères de l'ID du signalement existant

### 1.7 Profil et gamification

1. Aller sur `/profile`
2. ✅ Avatar avec initiales, total de points affiché
3. ✅ Timeline des événements de points (ex. "+10 REPORT_CREATED")
4. ✅ Liste de mes signalements avec statuts
5. Vérifier que les points ont augmenté suite au signalement de la section 1.4

### 1.8 Vérification RBAC citoyen

1. Tenter d'accéder manuellement à `/dashboard`
2. ✅ Page 403 "Accès refusé" (ou redirection `/map`)
3. Tenter `/containers`
4. ✅ Accès refusé
5. Tenter `/admin/users`
6. ✅ Accès refusé

---

## Flux 2 — AGENT

> **But** : tester la gestion des tournées terrain (vue mobile-first).

### 2.1 Connexion

1. Se connecter avec `agent1@ecotrack.fr` / `Password1!`
2. ✅ Redirection vers `/my-tours`
3. ✅ Sidebar affiche : "Ma tournée", "Carte", "Signaler"
4. ✅ Pas d'accès à "/Conteneurs", "/Tournées", "/Dashboard", "/Admin"

### 2.2 Signalement terrain depuis la carte

1. Aller sur `/map`
2. Cliquer sur un marqueur
3. ✅ Popup affiche **deux boutons** : "Voir le détail" (vert) + "Signaler" (orange)
4. Cliquer **Signaler**
5. ✅ Redirection vers `/reports/new` avec le conteneur pré-sélectionné (étape 1 sautée)
6. Choisir un type de problème → Envoyer
7. ✅ Signalement créé, retour `/map`

### 2.3 Sans tournée assignée

1. Ouvrir `/my-tours`
2. ✅ État vide "Aucune tournée assignée aujourd'hui"

> **Pré-requis** : pour la suite, un Manager doit assigner une tournée à cet agent (cf. Flux 3.7). Reprendre ici après.

### 2.4 Tournée ASSIGNED — démarrage

1. Retourner sur `/my-tours`
2. ✅ Card de tournée visible avec zone + date + statut "Assignée"
3. ✅ Gros bouton "Démarrer la tournée"
4. Cliquer **Démarrer la tournée**
5. ✅ Statut passe à "En cours", bouton disparaît
6. ✅ Liste des étapes apparaît avec numéros d'ordre et QR codes

### 2.5 Collecte des étapes

1. Sur la première étape (PENDING) : cliquer **Collecté** (bouton vert)
2. ✅ Étape passe à DONE (fond vert, coche, heure enregistrée)
3. Sur la deuxième étape : cliquer **Problème** (bouton amber)
4. ✅ Étape passe à ISSUE (fond amber)
5. ✅ Barre de progression mise à jour
6. Terminer toutes les étapes restantes

### 2.6 Finalisation de la tournée

1. Une fois toutes les étapes DONE ou ISSUE : bouton **Terminer** devient disponible (visible dans `/my-tours`)
2. Naviguer vers `/tours/:id` (si le lien est accessible)
3. ✅ Bouton "Terminer la tournée" visible en haut
4. Cliquer **Terminer la tournée**
5. ✅ Statut passe à DONE, bouton disparaît
6. ✅ Dans `/my-tours` : tournée apparaît dans "Terminées"

### 2.7 Vérification RBAC agent

1. Tenter d'accéder à `/tours` (liste MANAGER)
2. ✅ Accès refusé
3. Tenter `/dashboard`
4. ✅ Accès refusé
5. `/containers/:id` — vérifier que l'agent peut voir mais PAS modifier
6. ✅ Pas de bouton "Modifier" ni "Supprimer"

---

## Flux 3 — MANAGER

> **But** : tester toute la gestion opérationnelle (conteneurs, signalements, alertes, tournées, analytics).

### 3.1 Connexion et dashboard

1. Se connecter avec `gestionnaire@ecotrack.fr` / `Password1!`
2. ✅ Redirection vers `/dashboard`
3. ✅ 12 KPI cards chargées (conteneurs total, critiques, taux moyen, alertes, etc.)
4. ✅ Indicateur "Live" pulsant + heure de dernière mise à jour
5. ✅ AreaChart "Remplissage moyen 7j" visible
6. ✅ PieChart répartition statuts visible
7. ✅ BarChart top zones visible
8. Cliquer le bouton ⟳ Actualiser
9. ✅ Données rechargées, heure mise à jour

### 3.2 Carte gestionnaire

1. Aller sur `/map`
2. ✅ Tous les marqueurs visibles avec couleurs par statut
3. Zoomer sur une zone dense
4. ✅ Marqueurs CRITICAL pulsent (animation CSS)
5. Cliquer sur un marqueur CRITICAL
6. ✅ Popup avec fill%, heure dernière mesure — uniquement le bouton **"Voir le détail"** (vert), pas de bouton Signaler pour le MANAGER
7. Filtrer par zone + statut CRITICAL simultanément
8. ✅ Combinaison de filtres fonctionne

### 3.3 Gestion des conteneurs

1. Aller sur `/containers`
2. ✅ Tableau paginé avec QR, adresse, zone, statut, fill%
3. Rechercher un conteneur par QR partiel
4. ✅ Résultats filtrés en temps réel
5. Cliquer **Créer un conteneur**
6. Remplir : QR = `TEST-001`, Lat = `48.8566`, Lng = `2.3522`, Adresse = `1 rue de la Paix`
7. ✅ Conteneur créé, apparaît dans la liste
8. Cliquer l'icône Modifier sur le conteneur créé
9. Changer l'adresse, sauvegarder
10. ✅ Modification enregistrée, toast de confirmation
11. Accéder à `/containers/:id` d'un conteneur avec des mesures
12. ✅ Jauge SVG fill, onglet Mesures avec LineChart

### 3.4 Gestion des signalements

1. Aller sur `/reports`
2. ✅ Tableau avec tabs statut (OPEN / CONFIRMED / RESOLVED / REJECTED / Tous)
3. ✅ Signalement créé par le citoyen (Flux 1.4) visible dans l'onglet OPEN
4. Sur un signalement OPEN : changer le statut vers **CONFIRMED**
5. ✅ Toast de confirmation, signalement disparaît de l'onglet OPEN
6. Aller sur l'onglet CONFIRMED → signalement visible
7. Changer vers **RESOLVED**
8. ✅ Transition CONFIRMED → RESOLVED fonctionnelle
9. Tester une transition invalide (ex. OPEN → RESOLVED directement)
10. ✅ Erreur 422 gérée proprement

### 3.5 Alertes IoT

1. ✅ Cloche dans la topbar — badge rouge si alertes non acquittées
2. Cliquer la cloche
3. ✅ Dropdown avec liste d'alertes (CRITICAL_FILL et OPEN_REPORT)
4. ✅ Tri : actives en premier, acquittées en bas
5. Cliquer **Acquitter** sur une alerte
6. ✅ L'alerte passe dans la section acquittée, badge mis à jour
7. Fermer le dropdown en cliquant en dehors
8. ✅ Dropdown se ferme

### 3.6 Planifier une tournée

1. Aller sur `/tours`
2. ✅ Tableau vide (ou avec tournées existantes)
3. Cliquer **Planifier**
4. ✅ Wizard 3 étapes ouvert

**Étape 1 — Configuration :**
5. Sélectionner une zone dans le menu déroulant
6. Choisir une date future
7. Ajuster le seuil de remplissage à `60%`
8. Cliquer **Calculer l'itinéraire**

**Étape 2 — Aperçu (calcul disponible) :**
9. ✅ Spinner pendant le calcul
10. ✅ Carte Leaflet mini avec polyline numérotée et marqueurs numérotés
11. ✅ Stats : nombre de conteneurs + distance estimée en km
12. ✅ Tableau scrollable des étapes ordonnées avec fill% coloré
13. Cliquer **Confirmer l'itinéraire**

**Étape 2 — Aperçu (calcul indisponible) :**
9b. ✅ Écran d'erreur : "Calcul d'itinéraire indisponible" avec deux boutons
10b. Cliquer **Réessayer** → relance le calcul
11b. Ou cliquer **Créer sans aperçu →** → passe directement à l'étape 3

**Étape 3 — Confirmation :**
14. ✅ Récapitulatif : zone, date formatée, seuil de remplissage
15. ✅ Si calcul disponible : nombre de conteneurs + distance estimée ; sinon : "Calculé à la création"
16. Cliquer **Créer la tournée**
17. ✅ Redirection vers `/tours/:id` — statut DRAFT

### 3.7 Assigner la tournée à un agent

**Depuis la liste `/tours` :**
1. Sur la ligne de la tournée créée (statut DRAFT ou ASSIGNED) : cliquer l'icône **Assigner** (silhouette avec coche)
2. ✅ Modal "Assigner un agent" s'ouvre

**Depuis le détail `/tours/:id` :**
1. Cliquer le bouton **Assigner** (DRAFT) ou **Réassigner** (ASSIGNED) en haut à droite

**Dans la modal (ADMIN) :**
3. ✅ Select déroulant avec la liste des agents actifs au format "Nom Complet (email)"
4. Sélectionner `agent1@ecotrack.fr` dans la liste
5. Cliquer **Assigner**
6. ✅ Toast "Agent assigné", statut passe à ASSIGNED, nom de l'agent affiché dans le header

**Dans la modal (MANAGER) :**
3. ✅ Si `/users` inaccessible (403) : fallback silencieux sur un champ texte UUID
4. Saisir l'UUID de l'agent et cliquer **Assigner**

> **→ Retourner au Flux 2 section 2.4 pour que l'agent joue sa tournée.**

### 3.8 Suivi de la tournée en cours

1. Pendant que l'agent joue sa tournée, ouvrir `/tours/:id` en tant que Manager
2. ✅ Carte Leaflet avec markers colorés par step status (gris = PENDING, vert = DONE, rouge = ISSUE)
3. ✅ Barre de progression visible
4. ✅ Polling automatique : les marqueurs se mettent à jour toutes les 10 secondes
5. ✅ Polyline reliant les étapes dans l'ordre

### 3.9 Analytics

1. Aller sur `/analytics`
2. ✅ 3 graphiques chargés (fill area, reports bar, top zones)
3. Changer la granularité de **Journalier** à **Horaire**
4. ✅ Données recalculées avec les bonnes timestamps
5. Filtrer par zone
6. ✅ Graphiques mis à jour pour la zone sélectionnée
7. Section prédictions : conteneurs critiques visibles
8. Cliquer sur un conteneur critique
9. ✅ Prédiction 24h / 48h avec intervalles de confiance
10. Cliquer **Exporter** → modal export
11. ✅ Modal avec sélection format CSV/PDF, zone, statut, dates
12. Sélectionner **CSV**, cliquer **Exporter**
13. ✅ Fichier `ecotrack-reports.csv` téléchargé

### 3.10 Vérification RBAC manager

1. Tenter d'accéder à `/admin/users`
2. ✅ Accès refusé
3. Tenter `/admin/audit`
4. ✅ Accès refusé
5. Sur `/containers` : vérifier **pas** de bouton "Supprimer" (réservé ADMIN)

---

## Flux 4 — ADMIN

> **But** : tester la gestion des utilisateurs, l'audit, la suppression et toutes les fonctionnalités MANAGER.

### 4.1 Connexion

1. Se connecter avec `admin@ecotrack.fr` / `Password1!`
2. ✅ Redirection vers `/dashboard`
3. ✅ Sidebar affiche tous les menus y compris "Utilisateurs" et "Audit"

### 4.2 Gestion des utilisateurs

1. Aller sur `/admin/users`
2. ✅ Tableau paginé avec tous les comptes
3. ✅ Badges de rôle colorés (Citoyen / Agent / Manager / Admin)
4. ✅ Statuts ACTIVE (vert) / INACTIVE (rouge)

**Créer un utilisateur :**
5. Cliquer **Créer**
6. Remplir : Email = `nouveau@ecotrack.fr`, Mot de passe = `Password1!`, Nom = `Nouveau User`, Rôle = `AGENT`
7. ✅ Utilisateur créé, apparaît dans la liste
8. Tenter de créer avec le même email
9. ✅ Erreur "Email déjà utilisé"

**Modifier un utilisateur :**
10. Cliquer l'icône crayon sur `nouveau@ecotrack.fr`
11. Changer le rôle de AGENT → MANAGER
12. ✅ Rôle mis à jour dans la liste

**Désactiver un utilisateur :**
13. Cliquer l'icône désactiver sur `citoyen1@ecotrack.fr`
14. ✅ Modal de confirmation
15. Confirmer la désactivation
16. ✅ Ligne atténuée (opacity), statut INACTIVE

**Tenter de se désactiver soi-même :**
17. Trouver le compte admin courant dans la liste
18. Cliquer désactiver sur son propre compte
19. ✅ Erreur "Impossible de se désactiver soi-même" (409)

**Recherche et filtres :**
20. Rechercher par nom partiel
21. ✅ Résultats filtrés
22. Filtrer par rôle = MANAGER
23. ✅ Seuls les managers listés
24. Filtrer par statut = INACTIVE
25. ✅ Seuls les comptes inactifs listés

### 4.3 Audit logs

1. Aller sur `/admin/audit`
2. ✅ Tableau avec événements récents (LOGIN, CONTAINER_UPDATED, ALERT_ACKNOWLEDGED…)
3. ✅ Badges actions colorés (vert = CREATE, bleu = LOGIN, rouge = DELETE)
4. ✅ Colonne acteur avec email (null si compte supprimé)
5. ✅ IDs ressources tronqués (8 premiers caractères)
6. Cliquer **Filtres**
7. Saisir `LOGIN` dans le champ Action
8. ✅ Seuls les événements LOGIN visibles
9. Saisir une date `from`
10. ✅ Filtrage chronologique fonctionnel
11. Cliquer **Réinitialiser**
12. ✅ Tous les filtres vidés, liste complète

### 4.4 Suppression de conteneur (ADMIN uniquement)

1. Aller sur `/containers`
2. ✅ Bouton "Supprimer" (corbeille) visible — absent pour les MANAGER
3. Cliquer supprimer sur le conteneur `TEST-001` créé en 3.3
4. ✅ Dialog de confirmation
5. Confirmer
6. ✅ Conteneur supprimé (soft-delete → status MAINTENANCE dans la liste si visible)

### 4.5 Toutes les fonctionnalités MANAGER

L'ADMIN a accès à tous les flux du Manager (3.1 → 3.9). Vérifier notamment :
- ✅ Dashboard accessible
- ✅ Carte complète
- ✅ Peut créer/modifier des conteneurs
- ✅ Peut changer le statut des signalements
- ✅ Peut acquitter les alertes
- ✅ Peut planifier et assigner des tournées
- ✅ Analytics + export CSV/PDF

---

## Flux 5 — Cas d'erreurs & robustesse

### 5.1 Expiration de session

1. Se connecter en tant que citoyen
2. Vider manuellement `localStorage` (DevTools → Application → Local Storage)
3. Rafraîchir la page
4. ✅ Redirection vers `/login` (intercepteur 401)

### 5.2 Token expiré (simulé)

1. Dans DevTools, modifier le token JWT stocké dans `localStorage['ecotrack-auth']`
2. Naviguer vers une page protégée
3. ✅ Logout automatique + redirection `/login`

### 5.3 Rate limiting login

1. Sur `/login`, saisir un mauvais mot de passe 5 fois de suite
2. ✅ Message "Trop de tentatives, réessayez dans 5 minutes" (429)

### 5.4 Erreur réseau (backend coupé)

1. Arrêter le backend (`Ctrl+C` dans le terminal uvicorn)
2. Naviguer sur la carte ou le dashboard
3. ✅ Toast d'erreur 5xx générique (pas de stack trace)
4. Redémarrer le backend
5. ✅ Données rechargées au prochain poll ou rechargement

### 5.5 Error Boundary

1. Impossible à tester directement en prod — vérifier que le composant est bien importé dans `main.tsx`
2. En mode développement : ajouter temporairement `throw new Error('test')` dans un composant
3. ✅ Écran "Quelque chose a mal tourné" avec bouton "Recharger la page"

---

## Flux 6 — Vérification responsive

> Ouvrir DevTools → Toggle Device Toolbar (Ctrl+Shift+M)

| Page | 375px (mobile) | 768px (tablette) | 1280px (desktop) |
|---|---|---|---|
| Login | ✅ Form centré, lisible | ✅ Split-screen | ✅ Split-screen |
| Carte | ✅ Panneau filtres masqué par défaut | ✅ Panneau collapsible | ✅ Panneau ouvert |
| Conteneurs | ✅ Tableau scrollable horizontalement | ✅ OK | ✅ OK |
| Ma tournée | ✅ Boutons touch ≥48px, lisible terrain | ✅ OK | ✅ OK |
| Dashboard | ✅ 2 colonnes KPI | ✅ 3 colonnes | ✅ 6 colonnes |
| Users Admin | ✅ Tableau scrollable | ✅ OK | ✅ OK |

---

## Récapitulatif des vérifications RBAC

| Page / Action | CITIZEN | AGENT | MANAGER | ADMIN |
|---|---|---|---|---|
| `/map` — accès | ✅ | ✅ | ✅ | ✅ |
| `/map` — bouton **Signaler** dans popup | ✅ | ✅ | ❌ | ❌ |
| `/map` — bouton **Voir le détail** dans popup | ❌ | ✅ | ✅ | ✅ |
| `/reports/new` — accès direct | ✅ | ✅ | ❌ | ❌ |
| `/reports/new` — pré-sélection via popup carte | ✅ | ✅ | ❌ | ❌ |
| `/profile` | ✅ | ❌ | ❌ | ❌ |
| `/containers` | ❌ | ❌ | ✅ | ✅ |
| `/containers/:id` | ❌ | ✅ lecture | ✅ édition | ✅ + suppression |
| `/reports` | ❌ | ❌ | ✅ | ✅ |
| `/my-tours` | ❌ | ✅ | ❌ | ❌ |
| `/tours` | ❌ | ❌ | ✅ | ✅ |
| `/tours/:id` | ❌ | ✅ si assigné | ✅ | ✅ |
| `/tours/:id` — bouton Assigner/Réassigner | ❌ | ❌ | ✅ | ✅ |
| Modal assignation — select agents par nom | ❌ | ❌ | ⚠️ fallback UUID | ✅ |
| `/dashboard` | ❌ | ❌ | ✅ | ✅ |
| `/analytics` | ❌ | ❌ | ✅ | ✅ |
| `/admin/users` | ❌ | ❌ | ❌ | ✅ |
| `/admin/audit` | ❌ | ❌ | ❌ | ✅ |

---

## Ordre de jeu recommandé pour la démo complète

```
1. [ADMIN]   Créer un compte AGENT de test si non seedé
               → noter son email pour retrouver son nom dans la modal d'assignation

2. [CITIZEN] S'inscrire
               Ouvrir la carte → cliquer un marqueur → bouton Signaler
               → formulaire pré-rempli → choisir FULL → Envoyer

3. [MANAGER] Dashboard → vérifier l'alerte générée → acquitter
               /reports → signalement OPEN → passer à CONFIRMED
               /tours → Planifier :
                 Étape 1 : zone + date + seuil
                 Étape 2 : Calculer l'itinéraire (ou "Créer sans aperçu" si indisponible)
                 Étape 3 : Créer la tournée
               /tours/:id → Assigner → sélectionner l'agent dans la liste (ou saisir UUID)

4. [AGENT]   /my-tours → Démarrer la tournée
               Collecter chaque étape : Collecté ou Problème
               Terminer la tournée

5. [MANAGER] Dashboard → vérifier les KPI mis à jour
               /analytics → export CSV

6. [ADMIN]   /admin/audit → vérifier tous les événements tracés
               /admin/users → désactiver le compte citoyen de test
```

---

*Mis à jour le 2026-06-13 — ECOTRACK Bloc 2 — Agent Frontend*
