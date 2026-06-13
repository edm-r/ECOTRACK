

**ECOTRACK**

Plateforme intelligente de gestion des déchets urbains

**DOCUMENT DE CADRAGE TECHNIQUE (DCT)**

| Élément | Description |
| :---- | ----- |
| Projet | ECOTRACK \- Plateforme IoT, data et citoyenne pour la collecte intelligente des déchets |
| Document | Document de Cadrage Technique \- Version de travail V0.1 |
| Périmètre | planification, conception, prototype fonctionnel et démonstration |
| Établissement | INGETIS |
| Référence projet | Cahier des charges fonctionnel commun ECOTRACK  |
| Date de version | Juin 2026 |

# **Historique des versions et validation** {#historique-des-versions-et-validation}

| Version | Date | Objet | Auteur | Statut |
| :---- | :---- | :---- | :---- | :---- |
| 0.1 | Juin 2026 | Première construction du DCT | Équipe projet | À relire |
| 0.2 | À compléter | Corrections après revue pédagogique | Équipe projet | Prévu |
| 1.0 | À compléter | Version validée pour dépôt | Responsable projet | Prévu |

# **Sommaire**  {#sommaire}

[Historique des versions et validation	I](#historique-des-versions-et-validation)

[Sommaire	II](#sommaire)

[I.	Résumé exécutif	1](#résumé-exécutif)

[II.	Contexte, objectifs et périmètre	3](#contexte,-objectifs-et-périmètre)

[III.	Analyse du besoin et acteurs	4](#analyse-du-besoin-et-acteurs)

[IV.	Exigences fonctionnelles retenues	6](#exigences-fonctionnelles-retenues)

[V.	Contraintes, hypothèses et principes directeurs	7](#contraintes,-hypothèses-et-principes-directeurs)

[VI.	Choix de stack technique	8](#choix-de-stack-technique)

[VII.	Architecture cible	10](#architecture-cible)

[VIII.	Modélisation fonctionnelle et données	11](#modélisation-fonctionnelle-et-données)

[IX.	API, intégrations et flux IoT	15](#api,-intégrations-et-flux-iot)

[X.	Sécurité by design	17](#sécurité-by-design)

[XI.	Data, analytics et prédiction	18](#data,-analytics-et-prédiction)

[XII.	Qualité, tests et documentation	20](#qualité,-tests-et-documentation)

[XIII.	Organisation projet et planning	21](#organisation-projet-et-planning)

[XIV.	Risques et plans de mitigation	22](#risques-et-plans-de-mitigation)

[XV.	Critères de validation et livrables	24](#critères-de-validation-et-livrables)

[XVI.	Perspectives	25](#perspectives)

[Annexe A \- Exemple de scénario de démonstration	i](#annexe-a---exemple-de-scénario-de-démonstration)

[Annexe B \- Structure de repository recommandée	i](#annexe-b---structure-de-repository-recommandée)

[Annexe C \- Checklist avant soutenance	ii](#annexe-c---checklist-avant-soutenance)

[Annexe D \- Glossaire	ii](#annexe-d---glossaire)

[Annexe E \- Maquettes fonctionnelles textuelles	ii](#annexe-e---maquettes-fonctionnelles-textuelles)

[Annexe F \- Spécification détaillée des algorithmes	iii](#annexe-f---spécification-détaillée-des-algorithmes)

[Annexe G \- Extraits DDL indicatifs	iv](#annexe-g---extraits-ddl-indicatifs)

[Annexe H \- Contrats API illustratifs	v](#annexe-h---contrats-api-illustratifs)

[Annexe I \- Traçabilité exigences / preuves	vi](#annexe-i---traçabilité-exigences-/-preuves)

[Annexe J \- Plan de tests détaillé	vii](#annexe-j---plan-de-tests-détaillé)

[Annexe K \- Veille technologique synthétique	viii](#annexe-k---veille-technologique-synthétique)

[Annexe L \- Numérique responsable et conformité	ix](#annexe-l---numérique-responsable-et-conformité)

[Références internes	ix](#références-internes)

1. # **Résumé exécutif** {#résumé-exécutif}

ECOTRACK est une plateforme intelligente destinée à améliorer la gestion des déchets urbains en rendant la collecte plus mesurable, plus réactive et plus participative. Le projet combine des données issues de conteneurs connectés, des usages citoyens, des outils de pilotage pour les gestionnaires et des parcours terrain pour les agents de collecte. Dans le cadre du Mastère 1, l'objectif n'est pas de déployer une infrastructure industrielle complète, mais de concevoir et de démontrer un prototype cohérent, techniquement justifié et suffisamment robuste pour servir de base à une montée en puissance.

Le présent DCT formalise les choix techniques retenus, les hypothèses de conception, les responsabilités fonctionnelles, l'architecture applicative, la modélisation des données, les flux d'intégration, la sécurité minimale intégrée, les risques et les critères de validation. Il s'inscrit dans un cadre pédagogique où les blocs attendus sont la planification et l'organisation du projet, puis la conception et le développement d'une solution démontrable.

L'approche proposée vise un équilibre entre ambition et réalisme. ECOTRACK peut théoriquement mobiliser un écosystème complet : IoT, Kafka, data warehouse, machine learning, haute disponibilité, SIEM, applications mobiles natives et orchestration cloud. Toutefois, pour couvrir notre périmètre, l'équipe devra privilégier une architecture modulaire, une base de données solide, une API claire, une interface web responsive, un simulateur IoT et des mécanismes de sécurité fondamentaux. Les briques plus coûteuses ou plus complexes sont cadrées comme évolutions.

| Axe | Synthèse |
| :---- | :---- |
| Objectif | Produire un prototype cohérent : ingestion de mesures simulées, gestion des conteneurs, signalements, dashboard, alertes et tournées simplifiées. |
| Approche | Architecture modulaire, technologies maîtrisables, données simulées réalistes, sécurité intégrée dès la conception. |
| Résultat attendu | Dossier technique soutenable, application démontrable, documentation claire et base évolutive pour le M2. |

1. ## Décisions structurantes {#décisions-structurantes}

| Sujet | Décision | Justification |
| :---- | :---- | :---- |
| Plateforme | Application web responsive plutôt que trois applications natives séparées | Réduire le coût de développement tout en couvrant citoyens, agents et gestionnaires par rôles. |
| Backend | API REST unique | Facile à documenter, tester et connecter au frontend et aux services data. |
| Données | PostgreSQL \+ PostGIS | Répond aux besoins relationnels et géospatiaux sans multiplier les bases. |
| IoT | Simulateur \+ MQTT optionnel | Permet de démontrer le flux capteur sans dépendre de matériel physique. |
| ML | Modèle prédictif simple et explicable | Suffisant pour prouver la valeur data sans complexité excessive. |
| Sécurité | JWT, RBAC, validation, audit logs | Sécurité fondamentale compatible, évolutive vers SIEM. |

   2. ## Principes de rédaction et de conception {#principes-de-rédaction-et-de-conception}

Ce document applique quatre principes : pragmatisme, clarté, évolutivité et anticipation des risques. Les choix proposés ne sont pas une collection de technologies à la mode ; ils répondent à des contraintes concrètes de temps, de compétences et de démonstration. Chaque décision importante est donc accompagnée d'une justification et, lorsque c'est nécessaire, d'une alternative possible.

* Pragmatique : un nombre limité de composants, chacun associé à un besoin clair.  
* Accessible : une rédaction lisible par un chef de projet ou un Product Owner, sans perdre la précision technique.  
* Évolutif : une architecture permettant d’ajouter Kafka, SIEM, haute disponibilité ou applications natives.  
* Exhaustif sur les risques : identification des risques techniques, fonctionnels, organisationnels, data et sécurité.

2. # **Contexte, objectifs et périmètre** {#contexte,-objectifs-et-périmètre}

   1. ## Contexte métier {#contexte-métier}

Les services urbains de collecte des déchets reposent encore souvent sur des tournées fixes, peu sensibles à l'état réel des conteneurs. Cette organisation entraîne des passages inutiles, des débordements non anticipés, des coûts de carburant élevés, une insatisfaction citoyenne et une faible capacité d'analyse. ECOTRACK répond à cette situation en instrumentant les conteneurs, en centralisant les informations utiles et en aidant les acteurs à décider plus vite.

Le projet se situe à l'intersection de plusieurs domaines : développement logiciel, données géospatiales, IoT, analytique, sécurité et expérience utilisateur. Sa complexité impose un cadrage rigoureux. Il serait risqué de vouloir livrer une plateforme complète de niveau production. L'objectif raisonnable est de construire une base fonctionnelle démontrable et documentée, dont les limites sont assumées.

2. ## Objectifs stratégiques traduits en objectifs {#objectifs-stratégiques-traduits-en-objectifs}

   

| Objectif global | Traduction | Preuve attendue |
| :---- | :---- | :---- |
| Réduire les débordements | Afficher les conteneurs critiques et créer des alertes à partir des mesures simulées | Dashboard avec statut visuel et liste des alertes |
| Optimiser les tournées | Proposer un ordre de collecte simple selon zone, seuil et distance approximative | Génération d’une tournée démontrable |
| Impliquer les citoyens | Permettre le signalement d’un conteneur plein et le suivi de points | Parcours citoyen fonctionnel |
| Piloter par la donnée | Produire KPIs, graphiques et historique des mesures | Vue gestionnaire avec indicateurs |
| Sécuriser les accès | Mettre en place authentification, rôles et journalisation | Accès différencié citoyen/agent/gestionnaire/admin |

   3. ## Périmètre inclus {#périmètre-inclus}

* Authentification, inscription contrôlée et gestion des profils par rôle.  
* CRUD des zones et conteneurs, incluant localisation géographique.  
* Simulation de mesures IoT : niveau de remplissage, batterie, température, horodatage.  
* Dashboard gestionnaire : carte, indicateurs, conteneurs critiques, alertes.  
* Signalements citoyens avec contrôle anti-doublon simple.  
* Tournées de collecte : création, affectation à un agent, étapes et validation.  
* Gamification minimaliste : points attribués aux actions utiles.  
* Module analytics : tendances, top conteneurs critiques, prédiction simple de remplissage.  
* Documentation technique : API, modèle de données, installation, scénarios de test.

4. ## Hors périmètre  {#hors-périmètre}

| Élément exclu | Raison | Report |
| :---- | :---- | :---- |
| Haute disponibilité multi-serveurs | Complexité d’infrastructure trop élevée pour le M1 | Bloc 3 |
| SIEM complet avec corrélation avancée | Nécessite maturité logs et infrastructure sécurité | Cyber |
| Kafka en production | Peut être simulé ou documenté sans être imposé | extension data |
| Applications natives iOS/Android | Coût de développement et maintenance élevé | Après validation MVP web |
| Optimisation avancée OR-Tools temps réel | Risque algorithmique important | Extension après heuristique simple |
| RGPD complet juridiquement validé | Le DCT intègre les principes, pas un audit légal | Version production |

| Règle de périmètre \- Tout élément hors périmètre peut être cité en perspective, mais il ne doit pas devenir une condition de réussite. |
| :---- |

3. ## Hypothèses de volumétrie pour le prototype {#hypothèses-de-volumétrie-pour-le-prototype}

| Objet | Hypothèse | Justification |
| :---- | :---- | :---- |
| Conteneurs | 2 000 en cible, 100 à 300 simulés en démo | Démonstration fluide sur machine étudiante |
| Utilisateurs | 15 000 citoyens en cible, jeu de test 50 à 200 | Validation rôles et parcours sans charge excessive |
| Mesures IoT | Toutes les 15 min en cible, génération accélérée en démo | Créer suffisamment d’historique pour analytics |
| Zones | 12 secteurs | Conforme au besoin métier |
| Agents | 50 en cible, 5 à 10 en jeu de test | Démontrer l’affectation des tournées |

3. # **Analyse du besoin et acteurs** {#analyse-du-besoin-et-acteurs}

   1. ## Acteurs principaux {#acteurs-principaux}

Le système doit gérer plusieurs profils dont les objectifs divergent. Le citoyen veut signaler rapidement un problème et suivre son impact. L'agent veut accéder à une tournée simple et valider les collectes sans complexité. Le gestionnaire veut visualiser l'état du parc de conteneurs et prioriser les interventions. L'administrateur veut configurer les référentiels et garantir la traçabilité.

| Acteur | Objectif | Attentes techniques |
| :---- | :---- | :---- |
| Citoyen | Signaler, consulter son profil, gagner des points | Interface simple, géolocalisation, retour immédiat |
| Agent | Suivre une tournée, valider une collecte, signaler une anomalie | Mode mobile-first, étapes claires, peu de saisie |
| Gestionnaire | Piloter les conteneurs, alertes, tournées et KPIs | Dashboard lisible, filtres, export simple |
| Administrateur | Gérer utilisateurs, rôles, zones, paramètres | Backoffice sécurisé, journalisation |
| Capteur simulé | Émettre mesures de remplissage | Format JSON stable, fréquence paramétrable |

2. ## Parcours prioritaires {#parcours-prioritaires}

* Un gestionnaire se connecte et visualise les conteneurs critiques sur une carte.  
* Un citoyen signale un conteneur plein ; le système vérifie le doublon, enregistre le signalement et crédite des points.  
* Un flux de mesures simulées met à jour le niveau de remplissage et déclenche une alerte au-delà d’un seuil.  
* Un gestionnaire crée une tournée à partir des conteneurs prioritaires et l’affecte à un agent.  
* Un agent consulte sa tournée, valide une collecte et signale une anomalie si nécessaire.  
* Le tableau de bord affiche des indicateurs : nombre d’alertes, taux de remplissage moyen, collectes réalisées, zones critiques.

  3. ##  Matrice besoins \- fonctionnalités {#matrice-besoins---fonctionnalités}

| Besoin | Fonctionnalité associée | Priorité | Commentaire |
| :---- | :---- | :---- | :---- |
| Visibilité temps réel | Carte, statuts, alertes | Élevée | Indispensable pour la démo |
| Réduction passages inutiles | Seuils et tournées ciblées | Élevée | Heuristique simple suffisante en  |
| Engagement citoyen | Signalements \+ points | Moyenne | Version minimale mais visible |
| Traçabilité | Audit logs | Élevée | Nécessaire pour sécurité et soutenance |
| Analyse historique | Graphiques et tendances | Moyenne | Data démontrable avec dataset simulé |
| Sécurité opérationnelle | RBAC, JWT, validations | Élevée | Socle technique obligatoire |

4. # **Exigences fonctionnelles retenues** {#exigences-fonctionnelles-retenues}

Les exigences suivantes constituent le noyau fonctionnel du prototype. Elles sont formulées comme des capacités vérifiables afin de faciliter la recette et la préparation de la soutenance.

| ID | Fonction | Description | Priorité |
| :---- | :---- | :---- | :---- |
| F-01 | Authentification | L’utilisateur peut se connecter via email/mot de passe et recevoir un jeton JWT. | Must |
| F-02 | Gestion des rôles | Les vues et actions sont filtrées selon citoyen, agent, gestionnaire, admin. | Must |
| F-03 | Conteneurs | Le gestionnaire/admin peut créer, modifier, désactiver et localiser un conteneur. | Must |
| F-04 | Carte | Les conteneurs sont affichés sur une carte avec couleur selon niveau de remplissage. | Must |
| F-05 | Mesures IoT | Le système ingère ou génère des mesures horodatées associées aux conteneurs. | Must |
| F-06 | Alertes | Une alerte est créée lorsque le seuil critique est dépassé. | Must |
| F-07 | Signalement | Un citoyen peut signaler un problème sur un conteneur. | Must |
| F-08 | Anti-doublon | Un signalement identique récent peut être refusé ou fusionné. | Should |
| F-09 | Tournées | Un gestionnaire peut générer une tournée à partir d’une zone et d’un seuil. | Must |
| F-10 | Agent | L’agent peut visualiser les étapes et valider une collecte. | Must |
| F-11 | Gamification | Les actions citoyennes utiles génèrent des points visibles dans le profil. | Should |
| F-12 | Analytics | Le dashboard affiche au moins 5 KPIs et plusieurs graphiques. | Should |
| F-13 | Exports | Un export CSV ou PDF simple peut être produit pour les tournées ou rapports. | Could |
| F-14 | Journalisation | Les actions sensibles sont historisées. | Must |

1. ## Règles métier principales {#règles-métier-principales}

| ID | Règle |
| :---- | :---- |
| RM-01 | Un conteneur est considéré normal si son niveau est inférieur à 70 %. |
| RM-02 | Un conteneur est à surveiller entre 70 % et 90 %. |
| RM-03 | Un conteneur est critique au-delà de 90 % ou si un signalement citoyen récent confirme un problème. |
| RM-04 | Une tournée sélectionne en priorité les conteneurs critiques d’une zone donnée. |
| RM-05 | Un citoyen ne peut pas créer plusieurs signalements identiques sur le même conteneur dans un intervalle court. |
| RM-06 | Une collecte validée remet le niveau de remplissage du conteneur à une valeur faible simulée ou attend une nouvelle mesure. |

5. # **Contraintes, hypothèses et principes directeurs** {#contraintes,-hypothèses-et-principes-directeurs}

## 5.1 Contraintes projet {#5.1-contraintes-projet}

La conception doit tenir compte d'un délai limité, d'une équipe potentiellement hétérogène, d'un besoin de démonstration en soutenance et d'un environnement d'exécution probablement local ou cloud léger. L'architecture doit donc éviter les dépendances trop lourdes et limiter le nombre de services indispensables.

| Contrainte | Impact | Réponse proposée |
| :---- | :---- | :---- |
| Temps | Projet sur quelques mois | Découpage en sprints et priorisation MoSCoW |
| Compétences | Niveaux variables selon spécialités | Technologies documentées, conventions simples |
| Budget | Pas d’infrastructure payante obligatoire | Docker local, services open source |
| Démonstration | Doit fonctionner devant jury | Données simulées, scripts de reset, scénario court |
| Maintenance | Code repris par d’autres membres | README, Swagger, migrations, seeders |
| Sécurité | Données et rôles sensibles | RBAC, logs, validation entrées, secrets hors dépôt |

2. ##  Principes d’architecture {#principes-d’architecture}

* Séparation claire frontend, backend, données et simulateur IoT.  
* API REST documentée comme contrat entre les équipes.  
* Base PostgreSQL/PostGIS comme source de vérité unique.  
* Dépendances externes réduites : OpenStreetMap/Leaflet plutôt que services cartographiques payants.  
* Sécurité par défaut : aucune route sensible sans authentification et rôle approprié.  
* Observabilité minimale : logs applicatifs, audit des actions et indicateurs techniques simples.  
* Données de test reproductibles : scripts de seed et scénarios de démonstration.

  3. ## Critères de choix technologique {#critères-de-choix-technologique}

| Critère | Définition | Intérêt |
| :---- | :---- | :---- |
| Adéquation au besoin | La technologie doit résoudre un besoin identifié. | Éviter l’empilement technique inutile |
| Courbe d’apprentissage | L’équipe doit pouvoir produire vite. | Réduit le risque de blocage |
| Documentation | Documentation officielle et communauté active. | Facilite l’autonomie |
| Interopérabilité | API, formats standards, Dockerisation. | Prépare l’intégration M2 |
| Coût | Open source ou gratuit pour prototype. | Respecte le budget étudiant |
| Évolutivité | Possibilité de monter en charge sans réécriture totale. | Préserve la trajectoire projet |

6. # **Choix de stack technique** {#choix-de-stack-technique}

   2. ## Stack recommandée pour le prototype {#stack-recommandée-pour-le-prototype}

| Couche | Choix | Justification pragmatique |
| :---- | :---- | :---- |
| Frontend | React \+ TypeScript ou Vue 3 \+ TypeScript | Écosystème riche, composants réutilisables, typage, intégration Leaflet. |
| UI | TailwindCSS ou CSS modules | Rapidité de maquettage, cohérence visuelle, responsive. |
| Cartographie | Leaflet \+ OpenStreetMap | Open source, suffisant pour géolocalisation des conteneurs. |
| Backend | FastAPI Python ou Node.js/Express | REST clair, documentation Swagger possible, compétences courantes. |
| Base | PostgreSQL 15 \+ PostGIS | Relationnel \+ géospatial dans un seul moteur robuste. |
| Cache | Redis optionnel | Utile pour sessions, KPIs fréquents, mais non bloquant en M1. |
| IoT | Mosquitto MQTT \+ simulateur Python | Démonstration proche du réel sans matériel physique. |
| Analytics | Python, Pandas, scikit-learn | Analyse et prédiction simple maîtrisables. |
| DevOps léger | Docker Compose \+ GitHub Actions basique | Reproductibilité et tests sans complexité production. |
| Documentation | Swagger/OpenAPI, README, Markdown | Indispensable pour validation et reprise projet. |

   3. ## Alternatives et arbitrages {#alternatives-et-arbitrages}

   

| Sujet | Analyse | Décision |
| :---- | :---- | :---- |
| FastAPI vs Express | FastAPI si l’équipe data est forte en Python ; Express si l’équipe web maîtrise Node.js. | Les deux sont acceptables si l’API est bien documentée. |
| React vs Vue | React offre un marché plus large ; Vue peut être plus simple pour une petite équipe. | Le choix doit suivre les compétences réelles de l’équipe. |
| MQTT obligatoire ou simulé | MQTT apporte du réalisme IoT ; un générateur direct en base réduit la complexité. | Option recommandée : MQTT si temps suffisant, sinon simulateur HTTP/SQL documenté. |
| Kafka | Pertinent pour streaming industriel, mais lourd en M1. | À documenter comme évolution M2 plutôt que composant obligatoire. |
| Metabase/Grafana | Utile pour dashboards data ; peut doubler le frontend. | À utiliser seulement si l’équipe data veut démontrer un dashboard autonome. |

   4. ## Stack minimale de secours {#stack-minimale-de-secours}

Pour sécuriser la livraison, une stack minimale de secours doit être définie. Elle permet de maintenir une démo fonctionnelle même si certains composants avancés prennent du retard.

| Composant | Version minimale acceptable |
| :---- | :---- |
| Frontend | Une seule SPA responsive avec trois vues principales : carte, tournées, profil. |
| Backend | API REST monolithique modulaire avec documentation Swagger. |
| Données | PostgreSQL/PostGIS avec scripts de migration et seed. |
| IoT | Script Python de génération de mesures toutes les X secondes. |
| Analytics | Requêtes SQL \+ graphiques frontend, sans outil BI externe. |
| Sécurité | JWT \+ RBAC \+ hash bcrypt \+ logs applicatifs. |

7. #  **Architecture cible** {#architecture-cible}

L'architecture est volontairement modulaire mais compacte. Elle isole les responsabilités sans multiplier les services. Le frontend consomme l'API REST ; le backend applique les règles métier et les contrôles de sécurité ; PostgreSQL/PostGIS conserve les données métier et géographiques ; un simulateur IoT alimente le système avec des mesures réalistes.

![][image1]

*Figure 1 \- Architecture technique cible du prototype ECOTRACK*

## 7.1. Description des couches {#7.1.-description-des-couches}

| Couche | Composants | Responsabilités |
| :---- | :---- | :---- |
| Présentation | SPA web responsive | Affichage carte, tableaux, formulaires, profils selon rôle. |
| API métier | Backend REST | Authentification, règles métier, orchestration des cas d’usage. |
| Données | PostgreSQL/PostGIS | Persistance, historique, géométrie, requêtes spatiales. |
| Ingestion IoT | Simulateur \+ broker/worker | Réception, validation et stockage des mesures. |
| Analytics | SQL \+ Python | KPIs, tendances, prédiction simple, préparation rapports. |
| Sécurité | RBAC, validation, logs | Protection des accès, traçabilité et réduction des abus. |

## 7.2. Déploiement cible pour démonstration {#7.2.-déploiement-cible-pour-démonstration}

Le déploiement de soutenance doit rester reproductible. Une configuration Docker Compose est recommandée avec un conteneur base de données, un service backend, un service frontend, éventuellement Mosquitto et Redis. Cette organisation permet de démarrer l'environnement avec une commande unique et de préparer un jeu de données propre avant la démonstration.

| Service | Rôle | Exposition |
| :---- | :---- | :---- |
| frontend | Application web compilée ou dev server | Port 5173/3000 |
| api | Backend REST | Port 8000/3000 |
| postgres | Base PostgreSQL \+ PostGIS | Port 5432 |
| mosquitto | Broker MQTT optionnel | Port 1883 en local, 8883 en cible TLS |
| redis | Cache optionnel | Port 6379 |
| simulator | Générateur de mesures | Service ponctuel ou tâche planifiée |

## 7.3. Architecture évolutive {#7.3.-architecture-évolutive}

La structure proposée permet d'ajouter progressivement des composants plus avancés sans rupture majeure : Kafka peut s'intercaler entre MQTT et les traitements data, un reverse proxy peut exposer les services en HTTPS, un SIEM peut collecter les logs, un pipeline CI/CD peut déployer automatiquement l'application et des mécanismes de haute disponibilité peuvent être intégrés autour de la base ou du load balancer.

| Décision d’évolutivité \- Le périmètre doit donc produire des contrats stables : schéma de données, API documentée, format de message IoT et conventions de logs. Ces contrats sont plus importants qu’une infrastructure complexe prématurée. |
| :---- |

8. # **Modélisation fonctionnelle et données** {#modélisation-fonctionnelle-et-données}

## 8.1. Vue fonctionnelle globale {#8.1.-vue-fonctionnelle-globale}

La modélisation distingue les processus citoyens, opérationnels et gestionnaires. Le parcours citoyen nourrit le système en signalements. Le flux IoT apporte une information régulière et mesurable. Le gestionnaire transforme ces informations en décisions : alerte, tournée, priorisation. L'agent exécute la tournée et renvoie une preuve de collecte.

![][image2]

*Figure 2 \- Flux fonctionnel d’un signalement citoyen*

## 8.2. Processus BPMN simplifié : signalement d’un conteneur plein {#8.2.-processus-bpmn-simplifié-:-signalement-d’un-conteneur-plein}

| Élément | Description |
| :---- | :---- |
| Déclencheur | Le citoyen observe un conteneur plein ou un problème terrain. |
| Préconditions | Utilisateur connecté, conteneur existant ou sélectionnable sur la carte. |
| Étapes | Sélection du conteneur, saisie du type, validation, contrôle anti-doublon, enregistrement. |
| Sorties | Signalement créé, points attribués, alerte visible par le gestionnaire. |
| Exceptions | Doublon récent, conteneur introuvable, photo trop lourde, utilisateur non authentifié. |

## 8.3. Modèle conceptuel de données {#8.3.-modèle-conceptuel-de-données}

Le modèle conceptuel repose sur quelques entités structurantes. L'utilisateur est central pour les actions humaines. Le conteneur est l'objet opérationnel principal et appartient à une zone. Les mesures IoT forment un historique temporel associé au conteneur. Les signalements complètent les mesures et permettent une confirmation terrain. Les tournées organisent les interventions et leurs étapes.

![][image3]

*Figure 3 \- MCD simplifié ECOTRACK*

## 8.4. Entités principales et responsabilités {#8.4.-entités-principales-et-responsabilités}

| Entité | Rôle métier | Attributs clés |
| :---- | :---- | :---- |
| Utilisateur | Compte applicatif et rôle | email unique, mot de passe hashé, statut, rôle |
| Zone | Secteur géographique | nom, priorité, géométrie polygonale PostGIS |
| Conteneur | Bac connecté ou simulé | code QR, type, capacité, position, zone, statut |
| Mesure IoT | Historique capteur | niveau, température, batterie, timestamp, source |
| Signalement | Remontée citoyenne ou agent | type, commentaire, photo, statut, utilisateur |
| Tournée | Mission de collecte | date, zone, agent, statut, distance estimée |
| Étape tournée | Conteneur à collecter | ordre, statut, heure validation, volume collecté |
| Badge/Points | Gamification | score, source, date, utilisateur |
| AuditLog | Traçabilité | acteur, action, ressource, IP, timestamp |

## 8.5. Modèle logique relationnel proposé {#8.5.-modèle-logique-relationnel-proposé}

| Table | Colonnes principales | Contraintes/index |
| :---- | :---- | :---- |
| users | id, email, password\_hash, full\_name, role, status, created\_at | email unique, index role/status |
| zones | id, name, priority, geom, created\_at | index spatial GIST sur geom |
| containers | id, zone\_id, qr\_code, type, capacity\_l, geom, status | FK zone, index spatial, qr unique |
| iot\_measurements | id, container\_id, fill\_level, temperature, battery, measured\_at | partition possible par date en M2 |
| reports | id, user\_id, container\_id, type, status, comment, created\_at | contrainte anti-doublon applicative |
| routes | id, zone\_id, agent\_id, scheduled\_date, status, estimated\_distance | FK agent vers users |
| route\_steps | id, route\_id, container\_id, step\_order, status, collected\_at | unique(route\_id, step\_order) |
| points\_events | id, user\_id, source, points, created\_at | agrégation score par user |
| audit\_logs | id, actor\_id, action, resource\_type, resource\_id, ip, created\_at | append-only logique |

## 8.6. Dictionnaire de données initial {#8.6.-dictionnaire-de-données-initial}

| Champ | Type | Valeurs | Description |
| :---- | :---- | :---- | :---- |
| containers.fill\_level\_latest | integer | 0-100 | Dernier niveau connu, dérivé de la dernière mesure |
| iot\_measurements.fill\_level | integer | 0-100 | Niveau remonté par capteur ou simulateur |
| iot\_measurements.battery | integer | 0-100 | État batterie simulé du capteur |
| reports.type | enum | FULL, DAMAGED, BLOCKED, OTHER | Nature du problème déclaré |
| reports.status | enum | OPEN, CONFIRMED, RESOLVED, REJECTED | Cycle de traitement du signalement |
| routes.status | enum | DRAFT, ASSIGNED, IN\_PROGRESS, DONE, CANCELLED | Cycle d’une tournée |
| route\_steps.status | enum | PENDING, DONE, SKIPPED, ISSUE | État d’une étape terrain |
| users.role | enum | CITIZEN, AGENT, MANAGER, ADMIN | Rôle applicatif RBAC |

## 8.7. Gestion géographique avec PostGIS {#8.7.-gestion-géographique-avec-postgis}

PostGIS permet de stocker les positions des conteneurs sous forme de points et les zones sous forme de polygones. Cette approche évite de maintenir deux systèmes géographiques séparés. Les requêtes spatiales permettent d'identifier les conteneurs d'une zone, de calculer des distances approximatives, de préparer des heatmaps et de regrouper les problèmes par secteur.

| Fonction PostGIS | Usage ECOTRACK |
| :---- | :---- |
| ST\_Contains(zone.geom, container.geom) | Associer un conteneur à une zone ou vérifier sa cohérence. |
| ST\_Distance(a.geom, b.geom) | Estimer une distance entre deux conteneurs pour l’heuristique de tournée. |
| ST\_ClusterDBSCAN | Identifier des concentrations de signalements ou débordements. |
| GIST index | Accélérer les requêtes géospatiales. |

9. # **API, intégrations et flux IoT** {#api,-intégrations-et-flux-iot}

## 9.1 Principes API {#9.1-principes-api}

L'API REST constitue le contrat principal entre frontend, backend et traitements. Elle doit être stable, documentée et testable. Chaque endpoint sensible doit vérifier l'authentification et le rôle. Les erreurs doivent être structurées afin de faciliter le diagnostic pendant la démo et les tests.

| Principe | Choix | Justification |
| :---- | :---- | :---- |
| Versioning | /api/v1/... | Prépare l’évolution sans casser le frontend. |
| Format | JSON | Lisible, standard, facile à tester avec Postman. |
| Documentation | Swagger/OpenAPI | Indispensable pour jury et équipe. |
| Pagination | limit/offset ou page/size | Évite les réponses trop lourdes. |
| Erreurs | code, message, details | Diagnostic clair côté frontend. |
| Sécurité | Bearer JWT | Contrôle d’accès centralisé. |

2. ## Endpoints principaux {#endpoints-principaux}

| Méthode | Endpoint | Rôle | Usage |
| :---- | :---- | :---- | :---- |
| POST | /auth/login | Tous | Connexion et obtention JWT |
| GET | /me | Tous | Profil courant |
| GET | /containers | Manager/Admin/Agent | Liste filtrée des conteneurs |
| POST | /containers | Manager/Admin | Création conteneur |
| GET | /containers/{id}/measurements | Manager/Admin | Historique IoT |
| POST | /reports | Citizen/Agent | Création signalement |
| GET | /alerts | Manager/Admin | Alertes actives |
| POST | /routes/optimize | Manager/Admin | Proposition de tournée |
| PATCH | /route-steps/{id}/validate | Agent | Validation collecte |
| GET | /analytics/kpis | Manager/Admin | Indicateurs dashboard |
| POST | /iot/measurements | Service interne | Fallback ingestion sans MQTT |

## 9.3. Flux IoT {#9.3.-flux-iot}

Le flux IoT est traité comme un flux simulé mais réaliste. Chaque message contient un identifiant de conteneur, un niveau de remplissage, un état batterie, une température et un horodatage. Le worker vérifie le format, associe la mesure au conteneur, l'insère en base et déclenche une alerte si nécessaire.

![][image4]

*Figure 4 \- Séquence d’ingestion IoT et génération d’alerte*

## 

3. ## Format de message IoT proposé {#format-de-message-iot-proposé}

| Champ | Type | Exemple | Description |
| :---- | :---- | :---- | :---- |
| container\_id | string/uuid | CNT-000123 | Identifiant fonctionnel ou technique du conteneur |
| fill\_level | integer | 87 | Niveau de remplissage en pourcentage |
| temperature | float | 26.4 | Température simulée du capteur |
| battery | integer | 74 | Batterie restante en pourcentage |
| measured\_at | datetime ISO | 2026-06-12T09:30:00Z | Date de mesure |
| source | string | simulator | Origine de la mesure |

   4. ## Intégrations externes {#intégrations-externes}

| Service | Usage | Risque | Décision  |
| :---- | :---- | :---- | :---- |
| OpenStreetMap | Fond de carte | Faible | Prévoir cache/limitation, pas d’usage intensif non conforme. |
| Nominatim | Géocodage optionnel | Moyen | Éviter la dépendance en démo ; utiliser coordonnées cédées. |
| Email/SMTP | Notifications optionnelles | Moyen | Non indispensable ; peut être simulé par logs. |
| Firebase Push | Notifications mobiles | Élevé | Hors périmètre sauf démonstration simple. |

10. #  **Sécurité by design** {#sécurité-by-design}

La sécurité doit être réelle mais proportionnée. Le prototype ne doit pas se contenter d'écrans visuels : les contrôles doivent être implémentés côté backend. Les priorités sont l'authentification, l'autorisation par rôle, la protection des mots de passe, la validation des entrées, la journalisation des actions sensibles et la gestion des secrets.

## 10.1 Menaces principales {#10.1-menaces-principales}

| Menace | Impact | Réponse  |
| :---- | :---- | :---- |
| Usurpation de compte | Accès non autorisé au dashboard ou aux données | Hash bcrypt, JWT court, mots de passe robustes |
| Élévation de privilège | Un citoyen accède aux fonctions gestionnaire | RBAC côté API, tests d’autorisation |
| Injection SQL | Altération ou fuite de données | ORM/requêtes paramétrées, validation entrées |
| Spam de signalements | Pollution des données et fausses alertes | Anti-doublon, rate limiting, audit logs |
| Fuite de secrets | Compromission base/API | .env hors dépôt, variables d’environnement |
| Données géographiques sensibles | Exposition excessive | Minimisation et contrôle des exports |
| Flux IoT falsifiés | Mesures erronées | Jeton service ou certificat , validation source |

2. ## RBAC proposé {#rbac-proposé}

| Rôle | Permissions | Restrictions |
| :---- | :---- | :---- |
| Citoyen | Créer signalement, consulter profil, points, carte publique limitée | Aucun accès aux données globales détaillées |
| Agent | Voir tournée assignée, valider collecte, créer anomalie | Pas de gestion utilisateurs ni configuration |
| Gestionnaire | Voir dashboard, créer tournées, traiter alertes | Pas de gestion technique avancée |
| Administrateur | Gérer utilisateurs, zones, paramètres, audit | Accès journalisé systématiquement |

   3. ## Mesures techniques obligatoires {#mesures-techniques-obligatoires}

* Mots de passe stockés uniquement sous forme hachée avec bcrypt ou équivalent.  
* JWT signé avec secret hors dépôt et expiration courte.  
* Middleware d’autorisation sur toutes les routes sensibles.  
* Validation des payloads API avec schémas typés.  
* Rate limiting sur login et création de signalements.  
* Journalisation des actions : login échoué, création/modification/suppression, validation collecte, changement rôle.  
* Fichier **.env.exemple** fourni, mais aucun secret réel dans le dépôt.  
* CORS explicitement configuré, pas de wildcard en version de soutenance.  
* Gestion propre des erreurs sans exposer stack trace ou informations sensibles.

  4. ## Journalisation et audit {#journalisation-et-audit}

Le journal d'audit n'a pas vocation à remplacer un SIEM . Il doit cependant prouver que les actions sensibles sont traçables. Chaque entrée doit contenir l'acteur, l'action, la ressource, l'adresse IP si disponible, le résultat et l'horodatage. Cette base servira à une éventuelle intégration ELK/Wazuh en M2.

| Événement | Déclencheur | Données minimales |
| :---- | :---- | :---- |
| AUTH\_LOGIN\_FAILED | Tentative de connexion échouée | user\_email, ip, timestamp |
| USER\_ROLE\_UPDATED | Changement de rôle | actor\_id, target\_user\_id, old\_role, new\_role |
| CONTAINER\_UPDATED | Modification conteneur | actor\_id, container\_id, diff minimal |
| REPORT\_CREATED | Signalement créé | actor\_id, container\_id, report\_type |
| ROUTE\_ASSIGNED | Tournée affectée | manager\_id, agent\_id, route\_id |
| COLLECTION\_VALIDATED | Collecte validée | agent\_id, route\_step\_id, container\_id |

11. # **Data, analytics et prédiction**  {#data,-analytics-et-prédiction}

## 11.1 Objectifs data réalistes {#11.1-objectifs-data-réalistes}

La partie data doit démontrer la capacité d'**ECOTRACK** à transformer les mesures en décisions. cela passe par des KPIs fiables, des graphiques lisibles et un modèle prédictif simple. L'objectif n'est pas d'obtenir un modèle complexe, mais de montrer une chaîne de valeur complète : mesure, stockage, nettoyage, agrégation, visualisation et prédiction.

| Famille | Indicateurs | Restitution |
| :---- | :---- | :---- |
| KPI opérationnels | Conteneurs critiques, alertes ouvertes, collectes réalisées, distance estimée | Dashboard gestionnaire |
| KPI citoyens | Signalements, points, participation | Profil citoyen |
| KPI zones | Taux moyen de remplissage, top zones critiques | Carte/graphique |
| Historique | Évolution du niveau de remplissage par conteneur | Graphique temporel |
| Prédiction | Estimation du temps avant seuil critique | Modèle simple ou règle extrapolée |

2. ## Pipeline data {#pipeline-data}

* Générer ou recevoir des mesures IoT simulées.  
* Valider le schéma du message et les bornes de valeurs.  
* Insérer la mesure brute dans iot\_measurements.  
* Mettre à jour le statut courant du conteneur.  
* Calculer les agrégats nécessaires au dashboard.  
* Entraîner ou recalculer un modèle simple sur un jeu historique.  
* Afficher les résultats dans le dashboard ou un notebook de démonstration.

  3. ## Prédiction de remplissage {#prédiction-de-remplissage}


La prédiction peut être formulée comme une régression simple : estimer le niveau de remplissage futur ou le temps restant avant seuil critique. Les variables disponibles peuvent inclure l'historique du conteneur, l'heure, le jour de semaine, la zone, le type de conteneur, la saison simulée et les signalements. Une régression linéaire, Random Forest Regressor ou Gradient Boosting léger suffit pour démontrer la démarche.

| Élément | Choix | Commentaire |
| :---- | :---- | :---- |
| Variable cible | fill\_level à horizon H ou temps avant 90 % | H \= 24h ou 48h pour prototype |
| Features | jour, heure, zone, type, derniers niveaux, pente récente | Calculables depuis historique |
| Modèles candidats | Régression linéaire, RandomForestRegressor | Simple, explicable, rapide |
| Métriques | MAE, RMSE, R² | Compréhensibles par jury |
| Limite | Données simulées donc performance non généralisable | À expliciter dans le DCT |

4. ## Qualité des données {#qualité-des-données}

| Contrôle | Erreur détectée | Traitement M1 |
| :---- | :---- | :---- |
| Complétude | Mesures sans container\_id ou timestamp | Rejet ou quarantaine |
| Validité | fill\_level hors 0-100 | Rejet avec log erreur |
| Cohérence temporelle | Timestamp futur ou trop ancien | Alerte qualité |
| Unicité | Mesure dupliquée même conteneur/date/source | Contrainte ou déduplication |
| Référentiel | Conteneur inexistant | Rejet \+ log technique |

12. # **Qualité, tests et documentation** {#qualité,-tests-et-documentation}

## 12.1 Stratégie de tests {#12.1-stratégie-de-tests}

Les tests doivent couvrir les parcours critiques plutôt que viser une couverture artificielle. La priorité est d'assurer que les rôles sont respectés, que les mesures sont correctement ingérées, que les alertes se déclenchent, que les tournées se créent et que la démonstration peut être répétée sans incident.

| Type | Portée | Outil possible |
| :---- | :---- | :---- |
| Unitaires backend | Services métier, calcul statut, anti-doublon, RBAC | Pytest/Jest |
| API | Endpoints auth, conteneurs, signalements, tournées | Postman/Newman ou tests intégration |
| Frontend | Composants critiques, formulaires, rendu carte | Vitest/Jest |
| E2E | Login manager \-\> dashboard \-\> tournée | Cypress/Playwright optionnel |
| Data | Contraintes SQL, validité seed, métriques | Tests SQL/dbt conceptuel |
| Sécurité | Accès interdit par rôle, injection simple, rate limit | Tests ciblés |

2. ## Critères qualité du code {#critères-qualité-du-code}

* Structure claire par modules : auth, users, containers, reports, routes, analytics.  
* Nommage cohérent en anglais technique pour le code et en français pour la documentation utilisateur.  
* Aucune logique métier critique uniquement côté frontend.  
* Gestion d’erreurs centralisée et messages exploitables.  
* Scripts de migration et seed versionnés.  
* README d’installation testé sur une machine propre.  
* Swagger/OpenAPI à jour avec exemples de payloads.  
* Commits Git réguliers avec messages compréhensibles.

  3. ## Documentation attendue {#documentation-attendue}

| Document | Contenu | Statut |
| :---- | :---- | :---- |
| README | Installation, lancement, variables, comptes de test, scénario démo | Obligatoire |
| Swagger/OpenAPI | Contrat API complet | Obligatoire |
| Dictionnaire données | Tables, champs, types, contraintes | Obligatoire |
| Guide utilisateur | Parcours citoyen, agent, gestionnaire | Recommandé |
| Guide développeur | Architecture code, conventions, tests | Recommandé |
| Journal de décisions | Pourquoi telle stack, limites, alternatives | Très utile pour soutenance |

13. # **Organisation projet et planning** {#organisation-projet-et-planning}

## 13.1 Méthodologie {#13.1-méthodologie}

L'organisation recommandée est agile mais légère. Des sprints de deux semaines permettent de produire des incréments démontrables. Chaque sprint doit se terminer par une démonstration interne, même courte. Cette discipline évite l'effet tunnel et permet de réagir rapidement aux risques techniques.

![][image5]

*Figure 5 \- Planification par sprints pour le périmètre*

2. ## Rôles projet recommandés {#rôles-projet-recommandés}

   

| Rôle | Responsabilités |
| :---- | :---- |
| Référent produit | Priorise les fonctionnalités, valide les parcours, prépare la soutenance métier |
| Référent backend | API, sécurité, règles métier, tests backend |
| Référent frontend | UI, carte, intégration API, responsive |
| Référent data | Modèle données, PostGIS, analytics, prédiction |
| Référent IoT/sécurité | Simulation MQTT, logs, RBAC, règles sécurité |
| Référent documentation | DCT, README, Swagger, schémas, support soutenance |

   3. ## Backlog priorisé {#backlog-priorisé}

   

| Priorité | Item backlog | Période |
| :---- | :---- | :---- |
| P0 | Créer structure repo, Docker Compose, base PostgreSQL/PostGIS | Sprint 0 |
| P0 | Mettre en place auth JWT \+ RBAC | Sprint 1 |
| P0 | Créer CRUD zones/conteneurs \+ seed | Sprint 1 |
| P0 | Afficher carte des conteneurs avec statuts | Sprint 2 |
| P0 | Créer signalement citoyen et anti-doublon | Sprint 2 |
| P0 | Simuler mesures IoT et générer alertes | Sprint 3 |
| P0 | Créer tournée depuis conteneurs critiques | Sprint 4 |
| P1 | Valider étapes côté agent | Sprint 4 |
| P1 | Dashboard KPIs et graphiques | Sprint 5 |
| P1 | Modèle prédictif simple et notebook | Sprint 5 |
| P2 | Export CSV/PDF | Sprint 5 si temps |
| P2 | Notifications email/push | Hors sprint si retard |

   4. ## Rituels de suivi {#rituels-de-suivi}

* Point hebdomadaire de 30 minutes : avancement, blocages, décisions.  
* Revue technique courte en milieu de sprint : API, modèle de données, intégration.  
* Démonstration de fin de sprint : un scénario fonctionnel, même partiel.  
* Journal des risques mis à jour toutes les deux semaines.  
* Gel fonctionnel deux semaines avant soutenance pour stabiliser et documenter.

14. #  **Risques et plans de mitigation** {#risques-et-plans-de-mitigation}

La réussite du projet dépend fortement de l'anticipation des risques. Le tableau suivant regroupe les risques fonctionnels, techniques, data, sécurité et organisationnels. Chaque risque est associé à une probabilité, un impact et une réponse concrète.

| ID | Risque | Probabilité | Impact | Mitigation |
| :---- | :---- | :---- | :---- | :---- |
| R-01 | Périmètre trop large | Élevée | Élevé | Prioriser P0/P1, placer le reste en perspectives M2 |
| R-02 | Intégration frontend/backend tardive | Moyenne | Élevé | Définir Swagger tôt, mocks API dès Sprint 1 |
| R-03 | Difficulté PostGIS | Moyenne | Moyen | Limiter aux points/polygones simples, fournir requêtes exemples |
| R-04 | MQTT instable ou incompris | Moyenne | Moyen | Prévoir fallback POST /iot/measurements |
| R-05 | Données simulées peu réalistes | Moyenne | Moyen | Définir profils par zone et courbes de remplissage |
| R-06 | ML sur-dimensionné | Moyenne | Moyen | Choisir modèle simple, expliquer limites |
| R-07 | Carte lente avec trop de points | Faible | Moyen | Limiter démo à 300 points, clustering si besoin |
| R-08 | Failles RBAC | Moyenne | Élevé | Tests d’accès par rôle dans CI ou checklist |
| R-09 | Secrets publiés dans Git | Faible | Élevé | .gitignore, .env.example, revue repo |
| R-10 | Dépendance à API externe | Moyenne | Moyen | Seed avec coordonnées fixes, pas de géocodage obligatoire |
| R-11 | Manque de documentation | Moyenne | Élevé | Documentation intégrée au sprint, pas en fin de projet |
| R-12 | Démo non reproductible | Moyenne | Élevé | Script reset \+ seed \+ scénario écrit |
| R-13 | Conflits Git | Moyenne | Moyen | Branches courtes, PR simples, conventions |
| R-14 | Performance API insuffisante | Faible | Moyen | Index SQL, pagination, éviter requêtes N+1 |
| R-15 | Ambiguïté entre M1 et M2 | Élevée | Moyen | Tagger clairement hors périmètre dans DCT |

## 14.1 Plan de continuité de projet {#14.1-plan-de-continuité-de-projet}

| Situation | Plan B |
| :---- | :---- |
| Si le module IoT est en retard | Utiliser génération directe via script SQL/API et documenter MQTT en extension. |
| Si le frontend cartographique bloque | Prévoir tableau filtrable des conteneurs \+ carte minimale. |
| Si l’optimisation tournée bloque | Utiliser tri par distance au dépôt ou nearest neighbor simplifié. |
| Si le ML n’est pas prêt | Présenter une extrapolation basée sur pente récente \+ notebook exploratoire. |
| Si Docker pose problème | Fournir installation locale documentée \+ dump base. |

15. # **Critères de validation et livrables** {#critères-de-validation-et-livrables}

## 15.1 Livrables  {#15.1-livrables}

| Livrable | Description | Format |
| :---- | :---- | :---- |
| DCT | Document de cadrage technique 30-35 pages | Version Word puis LaTeX après validation |
| Code source | Frontend, backend, scripts data/IoT | Repository Git structuré |
| Base de données | DDL, migrations, seed, dictionnaire | SQL \+ README |
| API | Swagger/OpenAPI, exemples de requêtes | URL ou fichier JSON/YAML |
| Prototype | Application démontrable | Docker Compose ou guide local |
| Tests | Tests critiques et rapport court | Sortie CI ou captures |
| Documentation | README, guide démo, guide utilisateur minimal | Markdown/PDF |
| Présentation | Support soutenance 20-25 slides | PPTX ultérieur |

2. ## Critères d’acceptation fonctionnels {#critères-d’acceptation-fonctionnels}

   

| ID | Critère | Preuve |
| :---- | :---- | :---- |
| CA-01 | Un utilisateur peut se connecter avec un rôle défini. | Compte test citoyen, agent, gestionnaire, admin |
| CA-02 | La carte affiche des conteneurs avec statuts cohérents. | Couleurs normal/surveillance/critique |
| CA-03 | Un signalement crée une entrée et une notification/alerte visible. | Parcours citoyen complet |
| CA-04 | Une mesure simulée modifie l’état d’un conteneur. | Script ou MQTT en démo |
| CA-05 | Le gestionnaire peut générer une tournée à partir des conteneurs critiques. | Liste ordonnée d’étapes |
| CA-06 | L’agent peut valider une étape de tournée. | Statut mis à jour |
| CA-07 | Les actions sensibles sont visibles dans l’audit log. | Exemples en base ou écran admin |
| CA-08 | Le dashboard affiche au moins 5 KPIs corrects. | Valeurs cohérentes avec seed |

   3. ## Critères de soutenabilité {#critères-de-soutenabilité}

   

* Le jury doit comprendre en moins de 5 minutes le problème, la solution et le périmètre.  
* Chaque choix technique majeur doit être justifié par un besoin et une contrainte.  
* La démo doit raconter un scénario métier complet, pas seulement montrer des écrans isolés.  
* Les limites doivent être assumées explicitement et reliées aux perspectives.  
* Le document doit montrer que l’équipe a anticipé les risques et prévu des plans de secours.

16. # **Perspectives** {#perspectives}

Les perspectives ne doivent pas affaiblir le périmètre ; elles montrent au contraire que l'architecture a été pensée pour évoluer. Les extensions suivantes sont naturelles une fois le MVP validé.

| Axe  | Évolutions possibles |
| :---- | :---- |
| DevOps | CI/CD complet, environnements dev/staging/prod, déploiement automatisé |
| Infrastructure | Reverse proxy, TLS, load balancing, supervision complète |
| Sécurité | WAF, IDS/IPS, SIEM, tests OWASP ZAP, gestion incidents |
| Data | Kafka, dbt, data warehouse étoile, qualité automatisée, dashboards BI |
| ML | Prédiction plus robuste, détection d’anomalies, optimisation avancée de tournées |
| Mobile | Applications natives ou PWA avancée avec notifications push |
| RGPD | Consentement, anonymisation, droit à l’oubli, registre de traitement |

| Point de vigilance \- Les perspectives ne doivent pas être présentées comme déjà réalisées. Elles doivent être décrites comme une trajectoire rendue possible par les choix. |
| :---- |

	

# **Annexe A \- Exemple de scénario de démonstration** {#annexe-a---exemple-de-scénario-de-démonstration}

* Démarrer Docker Compose et charger le jeu de données initial.  
* Se connecter comme gestionnaire et afficher le dashboard.  
* Montrer les conteneurs normaux, à surveiller et critiques sur la carte.  
* Lancer le simulateur IoT pour faire monter le niveau d’un conteneur.  
* Constater la création d’une alerte dans le dashboard.  
* Se connecter comme citoyen et créer un signalement sur le même conteneur.  
* Montrer l’attribution des points dans le profil citoyen.  
* Revenir comme gestionnaire, générer une tournée pour la zone concernée.  
* Se connecter comme agent, consulter la tournée et valider une collecte.  
* Afficher les KPIs mis à jour et l’audit log.

# **Annexe B \- Structure de repository recommandée** {#annexe-b---structure-de-repository-recommandée}

ecotrack/  
  frontend/  
    src/  
      components/  
      pages/  
      services/  
      routes/  
  backend/  
    app/  
      auth/  
      users/  
      containers/  
      reports/  
      routes/  
      analytics/  
      iot/  
    tests/  
  database/  
    migrations/  
    seeds/  
    ddl/  
  data/  
    notebooks/  
    models/  
  iot-simulator/  
  docs/  
    api/  
    architecture/  
    user-guide/  
  docker-compose.yml  
  README.md  
  .env.example

# **Annexe C \- Checklist avant soutenance** {#annexe-c---checklist-avant-soutenance}

| Contrôle | Statut |
| :---- | :---- |
| Application démarre depuis README | □ |
| Base seedée avec zones, conteneurs, utilisateurs, mesures | □ |
| Comptes de test documentés | □ |
| Swagger accessible | □ |
| Scénario de démonstration répété | □ |
| Captures de secours disponibles | □ |
| Risques et limites préparés pour questions jury | □ |
| DCT relu, pagination et sommaire vérifiés | □ |
| Aucun secret dans le repository | □ |
| Support de présentation aligné avec le DCT | □ |

# **Annexe D \- Glossaire** {#annexe-d---glossaire}

| Terme | Définition |
| :---- | :---- |
| API | Interface de programmation permettant au frontend et autres services de communiquer avec le backend. |
| DCT | Document de Cadrage Technique : document décrivant les choix, contraintes, architecture et risques techniques. |
| IoT | Internet of Things : objets connectés capables de mesurer et transmettre des données. |
| JWT | JSON Web Token : jeton signé utilisé pour authentifier les requêtes. |
| PostGIS | Extension de PostgreSQL pour gérer les données géographiques. |
| RBAC | Role-Based Access Control : contrôle des droits selon les rôles utilisateur. |
| MVP | Minimum Viable Product : version minimale utilisable et démontrable du produit. |
| Tournée | Circuit de collecte affecté à un agent, composé d’étapes associées à des conteneurs. |

# **Annexe E \- Maquettes fonctionnelles textuelles** {#annexe-e---maquettes-fonctionnelles-textuelles}

Cette annexe précise les écrans attendus pour éviter les interprétations trop larges. Elle ne remplace pas des maquettes Figma, mais fournit une base de validation fonctionnelle entre l'équipe technique et le Product Owner.

| Écran | Contenu minimal | Rôle principal |
| :---- | :---- | :---- |
| Écran connexion | Email, mot de passe, message erreur clair, redirection selon rôle | Tous |
| Dashboard gestionnaire | KPIs, carte, filtres zone/statut, alertes récentes, action créer tournée | Gestionnaire/Admin |
| Carte citoyenne | Conteneurs visibles, recherche, bouton signaler, retour statut | Citoyen |
| Profil citoyen | Points, historique signalements, badges simples, impact estimé | Citoyen |
| Tournée agent | Liste ordonnée, carte, bouton démarrer, valider étape, signaler anomalie | Agent |
| Backoffice admin | Utilisateurs, rôles, zones, conteneurs, consultation audit logs | Admin |
| Analytics | Graphiques temporels, top zones, évolution remplissage, prédiction simple | Gestionnaire/Admin |

## Annexe E.1 Règles UX à respecter {#annexe-e.1-règles-ux-à-respecter}

* Un utilisateur doit comprendre l’état d’un conteneur sans lire une documentation externe.  
* Les couleurs doivent être accompagnées de libellés pour rester accessibles.  
* Les actions dangereuses ou irréversibles doivent demander confirmation.  
* Le mode agent doit rester lisible sur mobile et limiter la saisie clavier.  
* Les messages d’erreur doivent expliquer l’action attendue, pas seulement afficher un code technique.  
* La démo doit pouvoir être réalisée avec des comptes préconfigurés et des données stables.

# **Annexe F \- Spécification détaillée des algorithmes** {#annexe-f---spécification-détaillée-des-algorithmes}

## F.1 Statut courant d’un conteneur {#f.1-statut-courant-d’un-conteneur}

Le statut d’un conteneur est calculé à partir de la dernière mesure disponible et éventuellement renforcé par les signalements récents. Cette règle doit être centralisée côté backend pour éviter des divergences entre les écrans.

| Statut | Condition | Affichage |
| :---- | :---- | :---- |
| NORMAL | fill\_level \< 70 et aucun signalement critique récent | Vert |
| WATCH | 70 \<= fill\_level \< 90 | Orange |
| CRITICAL | fill\_level \>= 90 ou signalement FULL confirmé/récent | Rouge |
| MAINTENANCE | conteneur endommagé ou désactivé | Gris |
| UNKNOWN | aucune mesure récente disponible | Bleu/gris |

## F.2 Heuristique de tournée {#f.2-heuristique-de-tournée}

L’optimisation de tournées ne doit pas être présentée comme une résolution industrielle complète du Vehicle Routing Problem. Une heuristique simple et explicable est suffisante : filtrer les conteneurs critiques d’une zone, choisir un point de départ, puis appliquer un nearest neighbor ou un tri par distance approximative. Une amélioration 2-opt peut être ajoutée si le temps le permet.

| Étape | Description |
| :---- | :---- |
| 1 | Filtrer les conteneurs d’une zone avec statut CRITICAL ou WATCH prioritaire. |
| 2 | Exclure les conteneurs déjà planifiés dans une tournée active. |
| 3 | Calculer une distance approximative depuis le dépôt ou depuis le dernier point. |
| 4 | Construire une séquence par nearest neighbor. |
| 5 | Optionnel : appliquer une passe 2-opt pour réduire les croisements. |
| 6 | Créer la tournée et ses étapes, puis laisser le gestionnaire valider. |

## F.3 Anti-doublon de signalement {#f.3-anti-doublon-de-signalement}

| Paramètre | Valeur proposée |
| :---- | :---- |
| Clé de contrôle | container\_id \+ type \+ fenêtre temporelle |
| Fenêtre M1 | 60 minutes par défaut, paramétrable |
| Comportement | Refuser avec message clair ou rattacher comme confirmation |
| Justification | Évite le spam et la surpondération des alertes citoyennes |

# **Annexe G \- Extraits DDL indicatifs** {#annexe-g---extraits-ddl-indicatifs}

Les extraits suivants ne remplacent pas les scripts finaux de migration, mais ils cadrent le niveau attendu pour le modèle relationnel. Les noms exacts peuvent évoluer selon le framework choisi.

CREATE TABLE users (  
  id UUID PRIMARY KEY,  
  email VARCHAR(255) UNIQUE NOT NULL,  
  password\_hash TEXT NOT NULL,  
  full\_name VARCHAR(255) NOT NULL,  
  role VARCHAR(30) NOT NULL CHECK (role IN ('CITIZEN','AGENT','MANAGER','ADMIN')),  
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',  
  created\_at TIMESTAMP NOT NULL DEFAULT now()  
);

CREATE TABLE zones (  
  id UUID PRIMARY KEY,  
  name VARCHAR(120) NOT NULL,  
  priority INTEGER DEFAULT 1,  
  geom GEOMETRY(POLYGON, 4326\) NOT NULL  
);

CREATE TABLE containers (  
  id UUID PRIMARY KEY,  
  zone\_id UUID REFERENCES zones(id),  
  qr\_code VARCHAR(80) UNIQUE NOT NULL,  
  type VARCHAR(50) NOT NULL,  
  capacity\_l INTEGER NOT NULL,  
  geom GEOMETRY(POINT, 4326\) NOT NULL,  
  status VARCHAR(30) NOT NULL DEFAULT 'UNKNOWN',  
  created\_at TIMESTAMP NOT NULL DEFAULT now()  
);

CREATE INDEX idx\_containers\_geom ON containers USING GIST (geom);  
CREATE INDEX idx\_zones\_geom ON zones USING GIST (geom);

## 

## G.1 Index et performance {#g.1-index-et-performance}

| Champ | Index | Usage |
| :---- | :---- | :---- |
| containers.geom | GIST | Recherche spatiale et affichage carte |
| iot\_measurements(container\_id, measured\_at) | B-tree | Historique par conteneur |
| reports(container\_id, type, created\_at) | B-tree | Anti-doublon et suivi signalements |
| routes(agent\_id, scheduled\_date) | B-tree | Tournées agent |
| audit\_logs(created\_at) | B-tree | Consultation chronologique |

# **Annexe H \- Contrats API illustratifs** {#annexe-h---contrats-api-illustratifs}

## H.1 Création d’un signalement {#h.1-création-d’un-signalement}

POST /api/v1/reports  
Authorization: Bearer \<token\>  
Content-Type: application/json

{  
  "container\_id": "CNT-000123",  
  "type": "FULL",  
  "comment": "Conteneur presque plein devant l'entrée du marché",  
  "latitude": 48.8566,  
  "longitude": 2.3522  
}

Response 201  
{  
  "id": "rep\_01",  
  "status": "OPEN",  
  "points\_awarded": 10,  
  "message": "Signalement enregistré. Merci pour votre contribution."  
}

## H.2 Génération d’une tournée {#h.2-génération-d’une-tournée}

POST /api/v1/routes/optimize  
Authorization: Bearer \<manager\_token\>  
Content-Type: application/json

{  
  "zone\_id": "zone-centre",  
  "threshold": 70,  
  "agent\_id": "agent-001",  
  "scheduled\_date": "2026-06-20"  
}

Response 200  
{  
  "route\_id": "route-20260620-01",  
  "estimated\_distance\_km": 12.4,  
  "steps": \[  
    {"order": 1, "container\_id": "CNT-000123", "fill\_level": 94},  
    {"order": 2, "container\_id": "CNT-000145", "fill\_level": 89}  
  \]  
}

# **Annexe I \- Traçabilité exigences / preuves** {#annexe-i---traçabilité-exigences-/-preuves}

| Exigence | Preuve à fournir | Bloc concerné |
| :---- | :---- | :---- |
| F-01 Authentification | Tests API login, capture écran connexion, JWT décodé sans secret | Bloc 2 |
| F-03 Conteneurs | CRUD démontré, données en base, carte alimentée | Bloc 2 |
| F-05 Mesures IoT | Script simulateur, table iot\_measurements, alerte générée | Bloc 2 |
| F-07 Signalements | Parcours citoyen complet, entrée reports, points attribués | Bloc 2 |
| F-09 Tournées | Route créée, étapes ordonnées, affectation agent | Bloc 2 |
| Sécurité RBAC | Tentatives d’accès interdites documentées | Bloc 1/2 |
| Risques projet | Registre des risques \+ plans B | Bloc 1 |
| Architecture | Schémas, justification stack, limites M1/M2 | Bloc 1 |

# **Annexe J \- Plan de tests détaillé** {#annexe-j---plan-de-tests-détaillé}

Ce plan de tests sert de base minimale pour prouver que le prototype n'est pas uniquement visuel. Il doit être exécuté avant chaque démonstration importante et particulièrement avant la soutenance.

| ID | Cas de test | Précondition | Résultat attendu | Priorité |
| :---- | :---- | :---- | :---- | :---- |
| T-AUTH-01 | Connexion avec identifiants valides | Compte test actif | JWT reçu et redirection correcte | Critique |
| T-AUTH-02 | Connexion avec mauvais mot de passe | Compte existant | Erreur contrôlée et audit log | Critique |
| T-RBAC-01 | Citoyen tente d’accéder au dashboard manager | Token citoyen | Réponse 403 | Critique |
| T-CONT-01 | Création conteneur par manager | Token manager | Conteneur visible en base et sur carte | Critique |
| T-IOT-01 | Insertion mesure valide | Conteneur existant | Mesure stockée et statut recalculé | Critique |
| T-IOT-02 | Insertion mesure invalide fill\_level=140 | Payload invalide | Rejet 400 et log erreur | Majeur |
| T-REP-01 | Signalement citoyen valide | Token citoyen | Report OPEN \+ points | Critique |
| T-REP-02 | Signalement doublon | Signalement récent existant | Rejet ou fusion contrôlée | Majeur |
| T-ROUTE-01 | Génération tournée zone centre | Conteneurs critiques seedés | Étapes ordonnées créées | Critique |
| T-AGENT-01 | Validation étape par agent assigné | Route ASSIGNED | Étape DONE \+ audit log | Critique |
| T-AN-01 | Chargement KPIs dashboard | Données seedées | Valeurs cohérentes et temps réponse acceptable | Majeur |

## J.1 Jeux de données de test {#j.1-jeux-de-données-de-test}

| Jeu | Contenu | Usage |
| :---- | :---- | :---- |
| Dataset minimal | 12 zones, 100 conteneurs, 10 utilisateurs, 500 mesures | Tests rapides et démo locale |
| Dataset nominal | 12 zones, 300 conteneurs, 50 utilisateurs, 5 000 mesures | Démonstration plus crédible |
| Dataset stress léger | 2 000 conteneurs, 20 000 mesures | Vérifier pagination et carte, sans obligation M1 |
| Dataset sécurité | Comptes avec rôles distincts, erreurs de login, payloads invalides | Tester RBAC et validations |

# **Annexe K \- Veille technologique synthétique** {#annexe-k---veille-technologique-synthétique}

La veille technologique du DCT doit rester utile à la décision. Elle compare les options principales sans transformer le document en catalogue d'outils. Les éléments ci-dessous peuvent être enrichis avec des sources officielles dans la version finale.

| Domaine | Option | Avantage | Limite |
| :---- | :---- | :---- | :---- |
| Frontend | React | Écosystème vaste, nombreuses librairies cartographiques | Peut demander plus de structure |
| Frontend | Vue 3 | Progressif, lisible, rapide à prendre en main | Écosystème parfois moins standard en entreprise selon contexte |
| Backend | FastAPI | Swagger automatique, Python utile pour data | Moins naturel si équipe full JavaScript |
| Backend | Express | Simple, très connu, full-stack JS possible | Documentation OpenAPI à maintenir plus manuellement |
| Base | PostgreSQL/PostGIS | Robuste, géospatial, open source | Nécessite apprendre quelques fonctions spatiales |
| Streaming | Kafka | Standard industriel événementiel | Trop lourd pour MVP obligatoire |
| IoT | MQTT/Mosquitto | Léger, réaliste pour capteurs | Ajoute une brique à intégrer |
| BI | Metabase | Dashboards rapides | Peut disperser la démo si le frontend fait déjà dashboard |
| Monitoring | Grafana | Très bon pour métriques | À réserver aux besoins data/cyber avancés |

## K.1 Décision de veille {#k.1-décision-de-veille}

La décision recommandée est d'utiliser peu d'outils, mais de les utiliser correctement. PostgreSQL/PostGIS, une API REST documentée, une SPA responsive et un simulateur IoT suffisent à démontrer la valeur métier. Les outils de streaming, SIEM et haute disponibilité doivent être décrits comme compatibles avec la trajectoire M2, non comme prérequis du prototype.

# **Annexe L \- Numérique responsable et conformité** {#annexe-l---numérique-responsable-et-conformité}

ECOTRACK porte un objectif environnemental, mais le numérique lui-même consomme des ressources. Le projet doit donc intégrer des pratiques sobres et responsables.

| Principe | Objectif | Application ECOTRACK |
| :---- | :---- | :---- |
| Minimisation des données | Ne collecter que les informations utiles au service | Limiter les données citoyennes aux informations de compte et signalements nécessaires |
| Sobriété applicative | Réduire les traitements et rafraîchissements inutiles | Polling raisonnable, pagination, cache pour KPIs fréquents |
| Accessibilité | Ne pas dépendre uniquement des couleurs | Libellés, contrastes, textes alternatifs pour icônes |
| Durée de conservation | Prévoir une politique de purge | Mesures détaillées historisées puis agrégées en M2 |
| Transparence | Informer l’utilisateur sur l’usage des signalements | Texte court dans l’application et documentation |
| Sécurité des données | Protéger les comptes et rôles | Hash, RBAC, audit logs, secrets hors dépôt |
| Éco-conception | Limiter le poids frontend | Lazy loading, composants utiles, pas de librairies non nécessaires |

## L.1 Données personnelles et limites RGPD {#l.1-données-personnelles-et-limites-rgpd}

Le prototype ne constitue pas une mise en production réelle. Il doit cependant démontrer les bons réflexes : consentement explicite dans les maquettes, séparation des rôles, limitation des exports, absence de données personnelles réelles dans les jeux de test et possibilité de désactiver un compte. Un audit RGPD complet pourra être formalisé en M2 si la solution vise une expérimentation réelle.

# **Références internes** {#références-internes}

Ce DCT s’appuie sur les documents projet fournis :

* ECOTRACK \- Cahier des charges fonctionnel commun, version janvier 2026\.

Table des matières  
[Historique des versions et validation	I](#historique-des-versions-et-validation)

[Sommaire	II](#sommaire)

[I.	Résumé exécutif	1](#résumé-exécutif)

[1.1.	Décisions structurantes	2](#décisions-structurantes)

[1.2.	Principes de rédaction et de conception	2](#principes-de-rédaction-et-de-conception)

[II.	Contexte, objectifs et périmètre	3](#contexte,-objectifs-et-périmètre)

[2.1.	Contexte métier	3](#contexte-métier)

[2.2.	Objectifs stratégiques traduits en objectifs	3](#objectifs-stratégiques-traduits-en-objectifs)

[2.3.	Périmètre inclus	3](#périmètre-inclus)

[2.4.	Hors périmètre	4](#hors-périmètre)

[3\.	Hypothèses de volumétrie pour le prototype	4](#hypothèses-de-volumétrie-pour-le-prototype)

[III.	Analyse du besoin et acteurs	4](#analyse-du-besoin-et-acteurs)

[3.1.	Acteurs principaux	4](#acteurs-principaux)

[3.2.	Parcours prioritaires	5](#parcours-prioritaires)

[3.3.	Matrice besoins \- fonctionnalités	5](#matrice-besoins---fonctionnalités)

[IV.	Exigences fonctionnelles retenues	6](#exigences-fonctionnelles-retenues)

[4.1.	Règles métier principales	7](#règles-métier-principales)

[V.	Contraintes, hypothèses et principes directeurs	7](#contraintes,-hypothèses-et-principes-directeurs)

[5.1 Contraintes projet	7](#5.1-contraintes-projet)

[5.2.	Principes d’architecture	8](#principes-d’architecture)

[5.3.	Critères de choix technologique	8](#critères-de-choix-technologique)

[VI.	Choix de stack technique	8](#choix-de-stack-technique)

[6.2	Stack recommandée pour le prototype	8](#stack-recommandée-pour-le-prototype)

[6.3	Alternatives et arbitrages	9](#alternatives-et-arbitrages)

[6.4	Stack minimale de secours	9](#stack-minimale-de-secours)

[VII.	Architecture cible	10](#architecture-cible)

[7.1. Description des couches	10](#7.1.-description-des-couches)

[7.2. Déploiement cible pour démonstration	11](#7.2.-déploiement-cible-pour-démonstration)

[7.3. Architecture évolutive	11](#7.3.-architecture-évolutive)

[VIII.	Modélisation fonctionnelle et données	11](#modélisation-fonctionnelle-et-données)

[8.1. Vue fonctionnelle globale	11](#8.1.-vue-fonctionnelle-globale)

[8.2. Processus BPMN simplifié : signalement d’un conteneur plein	12](#8.2.-processus-bpmn-simplifié-:-signalement-d’un-conteneur-plein)

[8.3. Modèle conceptuel de données	12](#8.3.-modèle-conceptuel-de-données)

[8.4. Entités principales et responsabilités	13](#8.4.-entités-principales-et-responsabilités)

[8.5. Modèle logique relationnel proposé	13](#8.5.-modèle-logique-relationnel-proposé)

[8.6. Dictionnaire de données initial	14](#8.6.-dictionnaire-de-données-initial)

[8.7. Gestion géographique avec PostGIS	14](#8.7.-gestion-géographique-avec-postgis)

[IX.	API, intégrations et flux IoT	15](#api,-intégrations-et-flux-iot)

[9.1 Principes API	15](#9.1-principes-api)

[9.2	Endpoints principaux	15](#endpoints-principaux)

[9.3. Flux IoT	15](#9.3.-flux-iot)

[9.3	Format de message IoT proposé	16](#format-de-message-iot-proposé)

[9.4	Intégrations externes	16](#intégrations-externes)

[X.	Sécurité by design	17](#sécurité-by-design)

[10.1 Menaces principales	17](#10.1-menaces-principales)

[10.2	RBAC proposé	17](#rbac-proposé)

[10.3	Mesures techniques obligatoires	17](#mesures-techniques-obligatoires)

[10.4	Journalisation et audit	18](#journalisation-et-audit)

[XI.	Data, analytics et prédiction	18](#data,-analytics-et-prédiction)

[11.1 Objectifs data réalistes	18](#11.1-objectifs-data-réalistes)

[11.2	Pipeline data	19](#pipeline-data)

[11.3	Prédiction de remplissage	19](#prédiction-de-remplissage)

[11.4	Qualité des données	19](#qualité-des-données)

[XII.	Qualité, tests et documentation	20](#qualité,-tests-et-documentation)

[12.1 Stratégie de tests	20](#12.1-stratégie-de-tests)

[12.2	Critères qualité du code	20](#critères-qualité-du-code)

[12.3	Documentation attendue	20](#documentation-attendue)

[XIII.	Organisation projet et planning	21](#organisation-projet-et-planning)

[13.1 Méthodologie	21](#13.1-méthodologie)

[13.2	Rôles projet recommandés	21](#rôles-projet-recommandés)

[13.3	Backlog priorisé	21](#backlog-priorisé)

[13.4	Rituels de suivi	22](#rituels-de-suivi)

[XIV.	Risques et plans de mitigation	22](#risques-et-plans-de-mitigation)

[14.1 Plan de continuité de projet	23](#14.1-plan-de-continuité-de-projet)

[XV.	Critères de validation et livrables	24](#critères-de-validation-et-livrables)

[15.1 Livrables	24](#15.1-livrables)

[15.2	Critères d’acceptation fonctionnels	24](#critères-d’acceptation-fonctionnels)

[15.3	Critères de soutenabilité	24](#critères-de-soutenabilité)

[XVI.	Perspectives	25](#perspectives)

[Annexe A \- Exemple de scénario de démonstration	i](#annexe-a---exemple-de-scénario-de-démonstration)

[Annexe B \- Structure de repository recommandée	i](#annexe-b---structure-de-repository-recommandée)

[Annexe C \- Checklist avant soutenance	ii](#annexe-c---checklist-avant-soutenance)

[Annexe D \- Glossaire	ii](#annexe-d---glossaire)

[Annexe E \- Maquettes fonctionnelles textuelles	ii](#annexe-e---maquettes-fonctionnelles-textuelles)

[Annexe E.1 Règles UX à respecter	iii](#annexe-e.1-règles-ux-à-respecter)

[Annexe F \- Spécification détaillée des algorithmes	iii](#annexe-f---spécification-détaillée-des-algorithmes)

[F.1 Statut courant d’un conteneur	iii](#f.1-statut-courant-d’un-conteneur)

[F.2 Heuristique de tournée	iii](#f.2-heuristique-de-tournée)

[F.3 Anti-doublon de signalement	iv](#f.3-anti-doublon-de-signalement)

[Annexe G \- Extraits DDL indicatifs	iv](#annexe-g---extraits-ddl-indicatifs)

[G.1 Index et performance	v](#g.1-index-et-performance)

[Annexe H \- Contrats API illustratifs	v](#annexe-h---contrats-api-illustratifs)

[H.1 Création d’un signalement	v](#h.1-création-d’un-signalement)

[H.2 Génération d’une tournée	vi](#h.2-génération-d’une-tournée)

[Annexe I \- Traçabilité exigences / preuves	vi](#annexe-i---traçabilité-exigences-/-preuves)

[Annexe J \- Plan de tests détaillé	vii](#annexe-j---plan-de-tests-détaillé)

[J.1 Jeux de données de test	vii](#j.1-jeux-de-données-de-test)

[Annexe K \- Veille technologique synthétique	viii](#annexe-k---veille-technologique-synthétique)

[K.1 Décision de veille	viii](#k.1-décision-de-veille)

[Annexe L \- Numérique responsable et conformité	ix](#annexe-l---numérique-responsable-et-conformité)

[L.1 Données personnelles et limites RGPD	ix](#l.1-données-personnelles-et-limites-rgpd)

[Références internes	ix](#références-internes)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAncAAAG0CAYAAABQXgHlAACAAElEQVR4XuydB5jUxBvGsQIKgr2iIKJYEBQpooL0KhaU3stRjt4RBOlVqvQOIr0LR++993a04+jtKtwdxe/PN/efmJ1k91p2L7v3/p7nfZJMJpNJZjZ5d5KZpCIAAAAAAOArzEmlhgAAAAAAAK8F5g4AAAAAwIeAuQMAAAAA8CFg7gAAAAAAfAiYOwAAAAAAHwLmDgAAAADAh4C5AwAAAADwIWDuAAAAAAB8CJg7AAAAAAAfAuYOAAAAAMCHgLkDAAAAAPAhYO4AAAAAAHwImDsAAAAAAB8C5g4AAAAAwIeAuQMAAAAA8CFg7gAAAAAAfAiYOwAAAAAAHwLmDgAAAEhuomPu0c2QMIq4c1fMx9yDfE1crly+XM4870Zg7gAAAIDkhG/29x88UIOBD8PlzeXuJmDuAAAAgOQgPPIO3QoNV4NBCoLLn+uBxcDcAQAAAMkB39jRYpey4fJ3g8GHuQMAAAA8jRtu6JQqVSo6duwYXbx4kSZMmCCWJW+//bYuZtLQpxtfrNx/hgwZ1CCNFi1aaPMzZ86kDh06iPnRo0dr4RJO56WXXqLIyEiH8Pz589Obb76pLbdu3Zo++OCDRB13fLG4PsDcAQAAAJ6EW2ti7t1Xg5PEuXPnqFy5cg5hadKkcVi2irhMTtmyZeOMkxRcmTs9enNnBqfz2GOP0WuvveYQPmXKFAdzx1SrVs2tx8T1wcJWXJg7AAAAwJNY3EqjweZjxowZarAIl8ZEznfq1ImeffZZKly4MN29e5defvllKlGihIizefNmEef+/fsUFRUl5g8fPuyQnqRy5cr09NNPU/PmzcXy7t27tX2wZFr6bYYOHUpp06alPHny0Lhx40SYjNOxY0eRr9WrV2vxVfTmTp/Wv//+q4sVP3O3f/9+sd+YmBgRVrx4cTH1tLljLKwXMHcAAACAJ7kdFqEGWUbdunU1o6Q3Nnpjop/39/en7t27i/k6derQlStXxDy3vrG5Y9q0aWNq7iIiIoQxZPgxcEBAgJg3a7mTy9wq1rBhQy28QoUKtGTJEoc46ryKNHdqWuo28TF3zK5duyhLlixifvjw4WKaHObOwnoBcwcAAAB4Ejf0jjTFmVnSz/ft21e0rjHdunUTLW9MfMzdw4cP6auvvqLHH39chHXp0kXbVjVCcpnfZ9uxY4cW/s8//1Dp0qUd4qjzKtKUqWmp28TX3DG87ffff68tJ4e5s7BewNwBAAAAniQ8Mra1y2rYqOlxZpbiY+78/Pzo5MmTYj5Hjhym5q5gwYJ04sQJMb9t2zbq3LmzmK9YsaIWp0qVKg7bqK1tP/30U7K33DFr166l/v37a8vJY+4sqxcwdwAAAIAnsfAm7kC/fv3E40V+B417dwYFBYlwNiUsNiypU6cW89zixu+2yXX6eJKsWbNS9uzZRcsdh+fLl0+Lw9tzyx2vf+6552j8+PEinB/VstgMvfjii3Tv3j2H/TNDhgwRnT2++OILGjt2rAjT56tQoUJinvOnItPi1kFGn5b+nTvuYCLjLl26VAuXyNZF3q+K3I4fGeuXpdyFhfUC5g4AAADwJBbexIEPYWG9gLkDAAAAPImFN3HgQ1hYL2DuAAAAAE9i4U0c+BAW1guYOwAAAMCTWHgTBz6EhfUC5g4AAADwJBbexIEPYWG9gLkDAAAAPImFN3HgQ1hYL2DuAAAAAE9i4U0c+BAW1guYOwAAAMCTWHgTBz6EhfUC5g4AAADwJBbexIEPYWG9gLkDAAAAPImFN3HgQ1hYL2DuAAAAAE+S0Jv45unHaEqzdTSh4RrISzSl+XpRbgkhofXCBTB3AAAAgCeJz038wf2H1Cb7FJrTaQuFX7xDEZcgbxOXG5cflyOXZ1zEp17EE5g7AAAAwJPEdRM/tOo8Df5hicEsQN6rwT8sFuXqirjqRQKAuQMAAAA8iaubOBuAxT13GswB5P3icnVl8FzViwQCcwcAAAB4Elc38dbZpxhMAeQ7avX+ZLXINVzViwQCcwcAAAB4Emc38TVjDtKF3dcMhgDyHQXvu0Frxh5Si17grF4kApg7AAAAwJM4u4m3zzHNYAY8qT8HjjSExaXEbJPSxeVshrN6kQhg7gAAAABPYnYTv3j0Jh1fc8FgBNylLO+8Syf2nKIrJ69RySIlDevjK2fm7rNPPzOEuVNjhow1hNlVx1ZfoIvHbqlVwLReJBKYOwAAAMCTmN3E5/y2zWAC3KmsWd6jdUvX042zt7QwadTezvQOXT11jdKlS0cXjl6kV195VYuzZNY/YpoqVSqHbVhbVm6jiX9OFvN6c1eiSAm6fOIq5fwkpyGNi8cvU46PctCaxWu1+Kwv8xYQ6+ZOnSeWQy+EO6SfMUNGkWb69OnFsjR335UuT0e2H3W6P57y8XB6Tz35lDh+Pg/6fXtCc7ttU6uAab1IJDB3AAAAgCcxu4nzwLeqAfCE2AQ9/vjjYl4atfHDJ4rpM888K6Y1q9TS4qtGSW7DRorD8uf5UixLc7dywSoRLqWmIc2dPk8r5q+k8IuR2vK0sdNFXvTpy/2WLFpKTKW50+/LbH88HTdsgpjOmTJX5LN6pRoO+/eEuLxVzOpFIoG5AwAAADyJ2U3c0+auVLHSFHzsEl06cSVB5o5bxo7uPO5g7o7uOEbL5gbQ2iXr6IvP8ojwMiXKUkhQmLava6dvULlS3xnSMDN3rAL5vhJ545a7xx57jG6eu+2Q/vMZnxePlLl1kZebNmgmpryP/ZsPON0fL8vja9OsrUh3zNBxoqVSzYM7BXMHAAAA+BBmN3FPmztvlzRo3iqYOwAAAMCHMLuJw9wlTDB3LoG5AwAAADyJ2U0c5s49ko9x3a3A/WcMYa4EcwcAAAD4EGY3cVfmbvuaneL9M7kcMG+FIY6ndXDrITG9dT6Etq3e4bBu84qttP6fDdoy51++f7cpYIshrdP7zxrCnCkhcVkJNXfLdedWPx+X5k2bbwhzJZg7AAAAwIcwu4m7MnfFvi1Gb7z2hhi+g5eLFy6ureNepVtXbdeWueOAvnOAfnnH2l2iJ6o+7etnbtLZg+c1IxNXelJN6vsLw9b3935iuXunHmKa4bkMWpwPP/hQTDn/L734kphXx7/bvX4vtfJvLQyhXJZGkDtQ8JQ7PXCYGpeHPNEP5bJh2SaHtFl6cxef+NzJZHCfITRp5GQ6te+0w7qNyzfTtcDrWisdD80i18mwMwfOifyd3BtoSFsvmDsAAADAhzC7icdl7niojyIFi1D7Fh20sd/CgiOoXfP2Yv6Vl18RpoyHNmEzNGHEJIdlfXqFvykspm+/9Tb1+q2PSId7krpKT80Tmzuevps5qzbUCLfKcSudPt6AHgNF/rklj42iau5YchiTzO9kEdNGdRuLvLCh5WUebJl71erjfvLhJ8KIzpw4S/SMlT17+bj1aUtzF9/4LP8GTUUe1HDu1ctmuHfXvjTqj9HCcA7pO1Sskz2NeXw+ns6fvpBuB4Ua0pCCuQMAAAB8CLObeFzmjqfN/JqLcd6kuVu9aA19/eU3mjiMW9A+yv6RMB/6ZZ5nw5IrRy7KljWbWH4m7TPaPtjcuUpPzZM0d1Jp06SlY7tOaEaPxS1+k0dN0fKfJnUal+buySefFFM2X2wUpbk7vvukwdzx8Cgyn5xvNoA85Io8bilp7uIbn8XGT39upOSQLfpBj+V5UIeR4RZC+ejaTDB3AAAAgA9hdhOf29X5FyqkOZKS5o7FnxGbN30Bvf/e++JdPDYZdavXE19h0C9zKxIbsIUzFouvO/C21X6pRh9n/1gYHDkGnLP01FYoNjXnDgWJlsRZk2ZrLWGvvfKaGCR4xvi/hZnT55/fG+SvQujTYfFAxPwos071uuJxaKY3M4nwxvWaiJY2frwrzZ2M26n1rzS8/wjq1aW3eO+PTS8fm/5rGixp7lzF1x8bGz6ecitftYrVHdKy0tzhCxUAAACAD2F2E+dvy/I3R1UT4E7xI0Y5z58cU9e7Ej/OVcOg+AnflgUAAAB8DGc38fY5phmMgDvFrVND+w2jyhUqG9a50i8/VDSEQfFXu0+mqkUvcFYvEgHMHQAAAOBJnN3E14w9RBd2GXumQr6jC3uv09pxh9SiFzirF4kA5g4AAADwJK5u4q2zTzEYAsh31Or9yWqRa7iqFwkE5g4AAADwJHHdxJu+PZ5CL0QYjAHkveLy5HJ1RVz1IgHA3AEAAACeJD438e6F5tD8rv8NJgx5r7gcuTzjIj71Ip7A3AEAAACeJD438Qf3H1Kb7FNodqctFH7RaBgg+4vLjcuPy5HLMy7iUy/iCcwdAAAA4EkSehPfPP0YTWm+Xgx860vyrz2AqtToZAj3BXF5cbklhITWCxfA3AEAAACexMKbuFfT98/x1O2PP9XgFIuF9QLmDgAAAPAkFt7EvZpO/YbQH+OmqMEpFgvrBcwdAAAA4EksvIl7NU0696QJM+epwSkWC+sFzB0AAADgSSy8iXs11Zt3oDlLV6jBKRYL6wXMHQAAAOBJLLyJezXf1fGnFRu2qMEpFgvrBcwdAAAA4EksvIl7NcWr1qftew+owSkWC+sFzB0AAADgSSy8iXs1bO6OnjytBqdYLKwXMHcAAACAJ7HwJu7VsLkLvnxVDU6xWFgvYO4AAAAAT2LhTdyrYXN349ZtNTjFYmG9gLkDAAAAPImFN3Gvhs1dzL17anCKxcJ6AXMHAAAAeBILb+JeTfm6/mpQisbCegFzBwAAAHgSC2/iXk31Fh3UoBSNhfUC5g4AAADwJBbexL0a/y691KAUjYX1AuYOAAAA8CQW3sS9muLf/UiFChXSluV8SEgIlSlThvr376+FO9OAAQNEnDNnzmjzY8aMoZ9//pnGjRsnlpmePXtSuXLlKDIyUkuTuXXrljaf3FhYL2DuAAAAAE9i4U3cq/myUGGqW7cu3b59mw4cOEAlS5YU4V999ZWY3rt3j1q3bi3mK1SoQJ07d9a25WXJ+PHjxbRevXpiunTpUm0dU6dOHXr48KGY//TTT8W0cuXKdPDgQbpy5QqlSmUPK2RhvYC5AwAAADyJhTdxr6ZQsRLk7+9PuXPnptdee02Yu7CwMNq5c6cW5/HHHxdTV+buxRdfFFNp7ji99OnTay15evO2du1aMeX9vvDCCzB3AAAAAEg6Ft7EvZripcsKk8UmbMmSJVrLnd7EyTBX5k5tuZNcvnyZTp06RTlz5tTCmjVrJqa834iICJo9ezbMHQAAAACShoU3ca+mbPkfhMmSSCM3dOhQ+uCDD7QWOcaZudu+fbsW1rRpUzF9/fXXhaF77rnntHXckpctWzaaNGmSWJb7feONN2DuAAAAAJA0LLyJey3//vsvbdyxWw12QJo9Vxw6dEhM2bhx5whvxsJ6AXMHAAAAeBILb+Jey92oaNqx76AanKKxsF7A3AEAAACexMKbuNdy9fpNOh54Vg1O0VhYL2DuAAAAAE9i4U3cazl19jxdunpdDU7RWFgvYO4AAAAAT2LhTdxr2X3wCEXewXnQY2G9gLkDAAAAPImFN3GvZe2WHWpQisfCegFzBwAAAHgSC2/iXsuCgDVqUIrHwnoBc+cu+FMnXFC3QsPpZkgYBEEQ5IMKDY+kmHv31FuASyy8iXstU+YuUoNSPBbWC5g7q4m8G0UhYRF0NypKfBcPgiAI8m1Fx8TQ7Ud/5KNj4mfyLLyJey3DJ/2lBqV4LKwXMHdWcuvRv7iYRz9y9YcPQRAE+b6ioqMpJDxCvTUYsPAm7rX0HDZGDUrxWFgvYO6sgpvn1R86BEEQlLLEf/DZ4PEXGJxh4U3ca2nba5AalOKxsF7A3FlBWMSdRz9o448cgpJbDRo0oKVLlzqE8XcU1XhS27Zto969e4v569evU5UqVbTwjBkzGuJDEGQUt+DxH35nWHgT91r8OnRTg1I8FtYLmDsrQKsdZFfFZe54vlOnTtryli1bqGfPnmJeb+44PEOGDIb04yNXZhKCfFXhkXectt5ZeBP3Wmq16qQGpXgsrBcwd0kl5t598TKt+sOGIDsooeZOL725S4pg7qCUKh4twQwLb+Jeyw/1m6lBKR4L6wXMXVLhH6/6g4Yguygx5i5v3rxiqpo72XLH7xTlypWLIiIiqHjx4tr69OnTU2hoKNWqVYsee+wx0/2x0qRJQ3v27KGAgADKnDkzXb161RBPP8/7LVu2LB06dIj++OMPp/uHILvJWecKC2/iXkvxqvXVoBSPhfUC5i6p4JEsZGc1atSIFi1a5BCmmqiEmruoqChKly4dHTt2zLA/qTJlyjjsQ87v3r2bPv/8c4d17777riGeau70acdn/xBkBzn7vJaFN3GvBebOiIX1AuYuqcDcQXbW2LFjDebt+eef1+YTY+6kbty4QdmyZaOtW7fSlStX6MUXX6Rbt26Jdd999x3dvXtX24fchlvsChYs6JCOVHzNnZR+/+o6CLKDeLxTMyy8iXstMHdGLKwXMHdJBeYOsrvYKG3YsIEiIyOpefPmdOLECW3dc889R19//TX169dPtIhxWFzmjlvfGjduLNIrX748rVu3TsTl3rQhISHCUKZOnVozd7wPNn1vvPGGWH7mmWdo165ddObMGWEIDx8+LMI/+eQTWrNmDW3cuNGluTPbv349BNlFMHfOgbkzYmG9gLlLKjB3EARBkJlg7pwDc2fEwnoBc5dUYO4gCIIgM8HcOefHBs3VoBSPhfUC5i6pwNxBEARBZoK5c07t1r+qQSkeC+sFzF1SgbmDIAiCzARz58jV6zfpTNAFuhUSSi269VFXp3gsrBcwd0kF5g6CIAgyE8ydI7sPHhHv2kmVr+tPPzVoQXOXrVSjpkgsrBcwd0kF5g6CIAgyE8ydkVI1GjoYvBLVGqhRUiwW1guYu6QCcwdBEASZCebOSKnqfg7mrlztxmqUFIuF9QLmLqnA3EEQBEFmgrkzMj9gtYO5O3nmnBolxWJhvYC5SyowdxAEQZCZYO7MkcZuyar16qoUjYX1AuYuqcDcQRAEQWaCuTOHjV3pGg3V4BSPhfUC5i6pwNxBEARBZoK5M2foxOlUs2UnNTjFY2G9gLlLKvE1d1HRUVR9XC36/Pe8VG+yHzWd0QKyob4f/hPl6voFLd67xFCGntbVkKtUYmBpyt/ra/Kb2sSQV8hzqjmhDn362+eUr+dXdOD8QUNZeVp/rh4l8lNlbHVDXiH3iK8NfP3m6zhfz9UyMZMnzN35A9epZbZJ9Gvuv2hUjRU0puZK22tUjQAaVmOJIdyO6lFoDvlnGk875wfSw/sP1dNvKRbWC5i7pBIfc9duVkdqMLUxXb1zDfIS7Q3eJ26eoZGhhvL0hMoP/ZH6rxhoyBeU/Jq/f+Ejk/e1ocw8oSPBR+mLHvkpKPSCIV+Q58TXc76uq+Wjyt3mrtX7k2nHjBMUcekO5Gad23GFRlReRpP816rFYBlW1QuCuUs6cZm7wv2L08HLhwwXB8g7VH7Yj3Ti0glDubpTubp9QRfDLxnyAtlLeXp8SXei7hjKz13ietFx3q+GfEDJI76u8/VdLSe93GXu7t97SC2zTjIYEMj9urD7GnX67C+1SCwhqfVCB8xdUnFl7qqNrUknb5wyXBQg71LpId9R+J1wQ/m6Q/wIVt0/ZF991i2PoQzdIdQLeyrw1hmqPLqaobyk3GXumr493mA6IM/p2vEQ6ld6oVosSSap9UIHzF1ScWXuCvQqaLgYQN6n3cF7aPCKoYbytVp3o+5SzYl1DfuH7KsxG8fRwaBDhrK0UqgX9hZf59Uy+6/srDd3QQdv0IrBew2GA/KsWmefohZNkklKvVCAuUsqzsyd/7TmdCnisuFC4Cua8NcEQ1h81bR1M21aoVIFw3o7ih/Pcpmq5Wylvuz9jWG/kP3Fj0vVsrRSqBf2Fl/nnV0b3GHu3NVqN374REMY5FxhQRE0uvYKtXiSRFLqhQLMXVIxM3f9lw2i0oPLGS4C7tTi1Uuoco0qhvCEqGK1SoYwZ/KkuWvcvLEhzNO6EnmVSg0uayhrqxQTE0O9l/Uz7NfTqt2gNj319FNUokwJwzoz2aFsklubTm+m/ecOGMrUCtmlXjjT6Mlj6Nl0z1LeL/OK34gMP3PtLO0+tscQ31fl7Npgtbk7t+8aHV8TbDAaZir2bTFKlSoVZXozE4UFRxjWq0qoueP0/xw4UszvWLuLnnnmWW1d0UJFKV26dJQrRy6xzPlwpSeeeCJe6VqlMUPGiulnn35mWJcQ/ZZvplpESSKx9cIEmLukYmbuuJfl0sPLDBcAdypDhgxU9vuy2vKF28H0wosvUMv2LYUR4wtvtg+y0aef5RTrG/g3oIpVK4o4XXt3pf7DBmg/tLnL5lGatGlo1OTRDvsIDrko4rfu2No0TanLEVeo7+C+4qK/6+huCg69SJneyURfF4p9b8jM3PUb0o+eefYZWrhioVjWb6+/CDjbpyfEZXoj7KahvK3QzO2zHG6OySGuDxfDHDty6M+3LJscOXOIMJ6X5RJ064JWllw/9OUt69orr75iuizTeenll+jkpZNiWaZV7sfvRDjnQ60j+nwkt+pPamgoUytkh3rhTDsO76Rx08Y5hHE58vTlV14W8/wbX711tbjRd+jaUayr26iemP4xcrB2bKXKlaJXX3uVzt04Tycvn6J+Q/uLst55ZJe47rz40ov0/c/f05HzRw35sIOcXRusNnfDKi4zGAxnYpMk5xvXayKmbZu3o2efTUdnD56nl158iar+XJUuHL0o1rG5u3b6BpUsUpKunromTGHJoqXEuhwf5aCvv/xGbKtPn+PwfIbnMmgm7O1M7zjkQ2/calap5bBOXXaVLuf5lx8q0ssvvazlmff1Zd4CYj5w/xlRz/7oPZjOH74gwpbM+kdMuS7ylE1jhfI/i+UvPsujXb94Xn9O1Dw50555gRQZEq0WU6JJbL0wAeYuqTgzd8FhFw0XAHdqw+6NYvrPulhT+fobr4spXyzZiGV+N7MWt/eg3uIGK5c/+uQjMZUtd29nftv0hvL6m2+I6dnr50zTlPO8PV+45fIbb8Vux8aB/+mbmTtpJIuVKi6m+u31rUPO9ukJcZmuObLWUN5WqMPsTob9eVqPPfaYmO4/tV9c8BY8MlH68x1X2ciyHDZ2mJjK8tbXtZGTRhmW5TyLTYE+rYKFY99b5Xy4qiPJrS+65zeUqRWyQ71wprad2xnCpLnTt9zx9YCnff7oI6bZP8oupk8++aSY/jlxpLZ9xuczCnPHhpCXs2TNQsPHj6BjF44b9mUnObs2WG3ummeJf+uabLljhQSFibCuHbqJqTQ7O9fG/nnm+TbN2lKPX3s6rOcWP249Y3Nnlj4bIjZaC/5apJkwua2UNGos1cypy3Gle3THMW3+yPajIm9yO7nfpbOXuTR3PDVrudOfEzaK+jw5U8j5cDq48rxaTIkmsfXCBJi7pOLM3Kk/fndK/2gzQ8aMYqqaO3mBldLfYD/PE5tf9bEstwbql6W5c5amlDNzdyn8slNzN2nmZIc09Ns3aenvkLa6P09q+YEAQ3lbodZ/tzXsy9Pi1jQuI55nY8bmztn5XrtjnXgVQF82siz5ZsxTWd76usblqi7ztHnbFiK+NAcyraq1qoop50OtI/p8qOGeFv/m1TK1QnaoF87ELXfq6xmy/PgaIc3dO1neEVNp7k5fO0PzAxbQ34tmimVZX6TY3PEfDJ6X1zFWbb86mtm3o8yuDVabuyZvjjMYDGfSt9zJFjf56NXM3LHhyfN5XjH/+OOPO6TlzNzp03LWcvfUk09p86qZU5ddpcvLx3bFjumnN5CyxVGG/TNnuWbu5kyZ6xBfNXe5c+XW0kmMuWPtXXJGLaZEk9h6YQLMXVKxg7nLmu09bb57vx5iyo/Jnn/hefFYduqcaaIl7sOPP6T33s8mHpOambv8X38pKjjfRPmxbMdujq0G/KiX02zVoZX2WFafpozHj2V79O/532PZkIv01ttv0VcFvxLrzczdgOEDKe0zaalrn25iWb/90aBjIj+cN2f79JTMLuBWyC438Vr1a9FTTz0lHqlyOerPtyybXLlzifLkeVk2+seyLdq1cChv1cypyzzlOsytNM7MHedDrSP6fCS3UqK5Y3FrKj8+le/cyfJj8WNW/o2v3LxS/Jb1LX36eKzvfiov/piu37XBYO74USy36LKx27hnkyEPdpHZtSG5zR2fZ36MKU2RNHen95+lF194kSpXqKwZIbkuW9ZsdOXkNcr8ThbxuJLDXJk7Kf27cYW/KSwMJT8N0MdRzZy67CpdzvPP3/8iHp1ynm+dD6F3M2fV8nZyb6DhsWyBfF/RR9k/Mpi79997Xxzb6kVrRAsyz+vPiZonV4K581HsYO7MtGX/FnHj5Yum2SNWKHEyu4BbIbvfxCHXSqnmLjHiP3t8XVLDvV1m14bkNHd20Lxp82nZ3ABDuDvFJk2aO08I5s5Hsau5g9wjswu4FfLFm3hKEswdZHZtSOnmLiUI5s5HSai54/eY9Dp1JdAQJyHiXmX8SEwNT6zk4zD1kSw/NlPfr2HxezdyXt3GLpKPgQeOGGRYl1CZXcCtkKub+Lqd60UP0eUbAgzrXEn/orrZcmJ06OzheL/cHleHh1VbVhnC4qukbKuKW7bbdWlvCE+IksvccSsYv3col/+a/5chTnwVV3klRlaWk14FvikgpoWKFBLTxOadh/5xds64rqthrmR2bbCruVs+b4UhLD7r4it+DHpw6yFDeFy6cfZWorZjrZi/kgIe5T3oSPyGimHp391LrGDufJSEmjuWfLFYavW2Ndo8v2MmLhT/v5FvPbCVNu/bQtsP7RDz6jsn/D6Lq2W9lqxZqs3zy877Tu4XBpPTl+HS3Mkwfu+KhyOQ5o63YaMhh8woX+F7kQbH06ez5/he8VI1z3Pe+WV5zr+aJyk1H2bHqqbJeZBpBmxc4ZCWPo/S3PFxyDj8Hg+/2yOX2bDEZ5gFswu4FXJ1Ey9crLA2zzci+e4SHyefE7mO57mXolxmMyd7HZot8/nhcy7PE7/vtGjlIm091yU+33xe+A8Eb+vM3KnbsuQNl83Tmu1rtfDD546Im37WbFnFMcg8cd3X/1FZscl5XZbb8rw8DrlODqfC74jyOv1x8L7154Dzpu5XXXaVD6nkMHd8bPId2849OovpwTP/fceaj5PNH7+bKs/B/sADYl1Cy0t/XdFfr8zi8n7lfvTlpNZPVWrZyHrC85v2bnaopzwOI6crj8GZueN88z5PXIytE2pavD95zvT75zhyGBdejk8dMLs2eNLcsSnjXqbXz9wUy9xD9ua527Rm8VqxvHnFVi0umxq9iTNbtylgixbGponTU/fB2rVuj2EcPb25uxZ4XXvnj3U7KJQObTss5lcuWCXSPHcoSCybmTt1e5nvMwfOOcRL/XRqMeV38Xj4Fe5YYba9fv96c8fv3/FUfzy8LzaLnKZ+X3rB3PkoSTF3fDHhTgwf5/hYGxKCO0DwVA5BwS8qf/bFZ+Il9HwF8lHOz3NR8dKxQ0Hweyv8UjmPU2e2rEoOPcA3rllLZtPYqePoy0f/gHlf0khJcyenPJYYD13ALzazuZPbyB5w3IOWl/kmIrfhY+KxyZ577jmxzHn/4MMPxDAHzt7/U/OhHqtZmhyfX9TmVhcezkVeiDktfR71HTh4yr31OC8yLRano++Z50xmF3Ar5Oomrjd3LO5UwFM+Rj4nPDQNm2c+Jv3YceV+KCfqw2+9fhPLpb8rLcqz54BeYvnNTG+KcyjrWrM2zcV5/+bb2C8icL3k8p23fL4Y35DHlPup4k+m5k7dliVvuJwO73f20jliuUz5MiIun3M+Bm49YXPGnSP4eGQc7ugzZPQQw75Ycluel8chTcecf+aKKb+UzwZefxzqOeF1+v0mNB9SyWHu+J1a/Z8aljzn/Ofm/ezv0w+//CDKSx5n6jSpxXp9eXH90W+rlleR4kXEOIc8ziD/Hjkd/g2ZxZXnV+5HlpNZ/VSl1k9ZT5atX07vvveuVsacd+6swek+nfpph7yr4vxxXJkffVq8zGUrt9XXDb6m8B9arpvxrQNm1wZPmjs2KjzsyAvPvyCWLx6/TJV+qiTGp+OOBJ9+/Kno6CDjcjjPO1vXzK+5ljaPJcfpqfuYPXkOfZz9Y0OHC725404O3AlCjk3HHTyyZnlPGKbihYs7jJ9nZu7U7aUhUwddluaOVaRgEfr2629Nt9fvX6Y1c+IsWjxzqeF4eP3bb72tbWsmmDsfJSnmjnueTpk9VcxzT0GequaOLyw8ZTPDF2qelwP48qCg/O+VjY+63KVnF8N+uRcsX2TlowzW+ZtB4kYgjY5q7tgE8jR9+vTaY1n+5zx83HAxbzbOmTwm1uBRQxx6R8ox0FSp+VCP1VWaclBbGZfT0udRNXd8g5GPxeV5ql6numh91OfJTGYXcCvk6iaumju+4PCUWyP4GHgA2OPBJwzj/nHvUn18aWi+yPeFGBdRvhLArSzy8Tq3dPg19RPzfGPkKZ9L2ZLFBtrM3KnbsvimyS2r0+f9JfLJdYjDew2MvXnrB6LmPMoy4VZr/m3IHpNmktvqj0Mep5m5k9vpz4k+b3K/Cc2Hlp9kMHcs/k3yn6B6jeuLZT7n/Bifh7LgZVle8hzox5+T5cX1R25rVl7ydQb+cyhbvPh3bxZXnl+5H1lOZvVTlb5+8lTWE1muXE/lfM16NcU0PuZOznMPfH1aXOf15k79vchrVXzrgNm1wdPmjqdskLau2i7M2PY1O0UYmzeeThgxySHuoF5/OF3H6tLuN2F4uKVOmjv9PrK8865o3Ro9eAyFX4x0yAubNE5fhr35+ps0pO9QbVnq+O6TIo1+v/c3mDt1e33+XJm7of2G0dNPPW3YXt0/p8VGjnva8rJ6PPpz4Uwwdz6KM3PnahBjae64NUu2svE/XJ7yP0WeyotW1VqxQ0GwmZHzcugS/ifNU9kapl/mf+OBV0+LR1P6fXPrnnxfhVuquCWO5+UFTTV3/KUInnIzN99IZOsWf8WCb/j8L1qmLbeRx8Q3Vn6MqA59YZYvNR/qsbpKUz4ykhdymZbMo2ruuHVAbsvnSZo6ztPkWVO0daouhAbT2qPrDOVthTrOiX2sZia9ueO8cksuP5aWj5P4HMnHXWzE5CMo+Y6dPKfValcT09def008opSPmvg8sUGShoCHuuGpPJ/cwixbVMdMGSvMwt4T+xzyqG7L4rLmvPAjLl6WLUQyX7nz5tbicv2S81x/ZZ2WAyur7xvKbfXHIVum5VcTuDVJNXf6c6LPm9xvXPlwpjw9vjSUqRVyVS+4tVzOy7Ek+Zzzo3OZX/4t6M0d/x647ujLS/7G4iovHvJE7o9/f67iyv3IclLrp1p/WPr6qU9L5pXrqSxjZ+ZOrSfyuPlccd3Vp8V1Xm/u1N8L/4nkqb4O6B/v6uXs2mC1uWvxrvNBjKUR4XHaTu07LczYiT2nRBgP8cHT9i06OMSdPu4vp+tYb73xljbmnd7cyX1Iw6VKmjtOXz7C/Tzn58IoXjpxRSzz41FuJeMpL7fyb20wd+r2+vzx1zb0+9Sbu4wZMlLLJq0M26v757S4dTN3ri9EmHo8cZm722fD6NAqDGLskzgzd64+P6YfjJVbxvj9EXlx5AsKDybMj794WZoaNoRyXhpAvuEWLVlMu7mpy9zZQt33L1V+0d5b43/WfJHki6p8xCU7RcjphBkT6efKP4vtuIWMt+GWP54X7/M8UpESRcVUbsPHxMcgX1LXv2PIxswsX2o+1GN1laZ8765qrVhDyGnp8yhbHvQdKrilg8d0k8s8GK86iLMqZ58YskKzts92+sia88aGnE2evoWCP8fE5lqeIz5/etMrH5XJc8rGlR+r8eM8XuaWCjb78ia2eNVi+rbot+ImyMtVa8WeTxa3qnA95brFN0V+11KfR3VblnxRnaf8VYkDpw865ItbT3jsMpn/KjWragacb9Jcr2SLovx0lZTcluflccjzx58/498Bv6/FpkJ/HOo54bzp9xtXPpzJXZ8fc1UvWJ1+/5VKli2pvXMozzm3sHF58TK3ZFetFXsO+PfA505fXvL8x1Ve/HhW7lf+/pzFlfvRl5O+fqr1h8XlqK+fMi3+Q8OfoeN6Ks/F7327i6l8CiHzrtYTNnf8NES2KOvT4mV9hwq1bvD1gdfHpw44uzZYbe5cfX6MjUj9mg20r0zwJ8Tku2yXT1ylUsVKa++rrV2yjgoWKBjnOm7RkmPDSXOn3wcbJB57rk+3vg554UetsjWsQ8uOVK1idW0dx63ycxUxP3LQKCpdvIwYm254/xHiUancTkrdnt+f4/yyUdPH40ex3zzab4Nafg7vAKrb6/cvH02zalerYzge/Xoz4fNjPoyZueu/bJD4kLR6AYC8V5cjrzj9OLgVsvsH4iHn2nR6M+0/d8BQplYosfWCHylOmzvd8JUZO8uK3tyq9K227pSza4PV5u7cvmt0fI35GG5xtTIlVGz69O/S6VvuoFj9lm+mWkRJIrH1wgSYu6RiZu5Y/tOa06WI2E85Qd6v8sN+FGWqlrOV+rL3f50RIO9Rrm5fGMrSSqFe2Ft8nXd2bbDa3DFN3x5vMBmQ5xUWFEGja69QiydJJKVeKMDcJRVn5o5VoFfs4wjIu7U7eA8NXjHUUL5W627UXao5sa5h/5B9NWbjODoYdMhQllYK9cLe4uu8Wmb/lZ315i7o4A1aMXivwWxAnlXr7FPUokkySakXCjB3ScWVubsacpWqjqthuBhA3qOzIeeo5CDzRy7uEL+U/cfqoYZ8QPbTxsDN1Hneb4YydIdQL+wpcX1/dJ1Xy0vKHeaOmdZqAx1bbf54FnK/BpRdROE3klaGZiS1XuiAuUsqrswdK/jmRSrY978XkSHv0ZJD/9DPf1Y2lKm7xTdytNTYW/1XDKTeS/sZys6d4nqRv+fXdPDyfwMVQ8knvq7z9V0tJ70iIu+otwxBSHiEGpRg5nTZSvO7bjcYD8i9ap9jGt2+FKkWhyVYUS/+D8xdUgmLiDT8oM3004hfqOmMFhQUGjteGGRfLTywmD7/PS9tP7XDUI6eEj+K43etev3T12VvSchzOnL1CI3fPJFyds1Nl29fNpSZpzR50xT65pGx4I4cah4h94qv33wd5+u5Wi5muhUart4yBNwoYAWhV++Q/1vjaNWw/QYTAlmnnTNPUrN3JlCvIvPUIrAUq+oFwdwlnajoGNGjTf1Rq4qKjqIa42sL01B3UgNxgYCSpvojmxrCkqryw36iXF2/oMX7lhrK0NPixz0lBpam/L2+Jr+pTQx59SU1mWIMs5NqTqgjhjjK1/MrOnD+oKGsPK0/V48S+ak8ppohr55SvRHNDGG+LL428PWbr+N8PVfLxEzObtahEda1/AQdvE4ts02iX3P/RaNqrKAxNVd6XP1qzDKE+Yq6fzOH/DONp10LAunh/Yfq6bcUC+sFzJ0V8L8z9UcNuV/HTp2m7+r4U/cho+JlsCH7qkS1BoYwyL6q3ryD+P2p4dB/unM3iu4/eKDeLjTCnTyy9Tb6jhxP+44cU4NBArG4PsDcWUHM/3/I6o8b8pz+GDeFytRqRDv3u7fnIuQeBV28RDMXLzOEQ/YTG/G7d+8awqH/FBoeQbedPJKVRNy5Sw8furclyN3wH+sDR4+rwSCBcD3g+mAhMHdWwb1c7kZFG37kkGd1+nwQVfBrSaVrNqItu/Ya1kP2Ve3WnQ1hkH3k36UXfV+vmSEcchTfpKNj7qm3CFNuh4Vb+SjOo3QbPJIOHjupBoMEwuXP9cBiYO6s5M4jcxffDhaQ+3U2KJh+btiS2vceRFEw3l6has3aG8Kg5Fe52o3pdmioIRxyVEhYBN27f1+9Nbjk4b//Ou14YVe6DhpBxwLPqMEggXC5c/m7AZg7q/n3/z9UFj+qxbtg9tC4GXPE46R1W5OvBywUt+YsDRCmXA2Hkkdh4RHidQc1HPpP/McxNDxSGLukwO9cCXN47z65535vDV0GDqcTp8+qwSAecLly+XI5W/yOnQrMnTvh3ycXJL+TB9lDl69dpypN21G73oPoTlSUYT2U/GITroZBnte+I8fJr8PvhnDIUQ8sfm+OGwhibHjfCI+MFNfNIycDDeug+IqNu0ecO8wdSLnMWhJAxavWpyade8b7HRngfsIjImnkVGs/yA0SBp//CTPdO6YX8B6iY2Lo50at6ExQsLoK2BOYOwAYafSWrd2orgLJQJueAzz1Dxco1GnThU6dPa8GgxRKVHQ0/fLI2AGvAuYOAD23Q8OoVqtfRWse934GycePDZqrQcDNyEfiADCRd+5Sxcat1WBgf2DuAHAGt+Jxax636gHPs2nnXoyh5SFuhYRS+bpN1WCQgmFjV6lJGzUYeAcwdwC4gh9PlavdhHoOG0N7D2MUdk9Tv11XNQi4AR6CJujiZTUYpGCa/tabLl29pgYD7wDmDoD4wkavfF1/YfTwPphnmD5/CV29flMNBhYxbd5i8SjW1WeyQMqDB6y+dPW6Ggy8B5g7ABID9ybk8b/Qmud++NE4sJ7Gv/agA8dOqMEghdOw4+905foNNRh4FzB3ACQFfpTFnzvjgT29/TuRdoXfB5s0e4EaDJIAf57vzl1Lv2UJfIAG7buZtpR3795dDUoQCxbg9+thYO4AsAoeF4wfcW3csZsePEiY0atXr56YXrlyRWj9+vVUsGBBMf37778dlk+cOEFlypShRYsWUbFixahFixY0ffp0atSokZKq78CtTK17DNCWU6X679LVsGFDcV4mTZpEa9asofnz59OKFSu0ZV7H8deuXUtPPfUUBQUFUevWrenPP/+k06dPa+mkBHgMwUzZPhTzsq7t3btXnKPq1auLqau6xmTPnl3crP38/PRJAy+nfvuudON2iBosqFSpkhoUL44fj+0QNWLECGUNcDMwdwBYzcUr1xyMXnxQzR1ToUIFfRSHZRk/Y8aMlDt3brqfwO9ZeiNDJ06niDuxn+xRzR1z+PBhh/OgX5bxM2fOTEuXLqWTJ1PeB893HThMLbr1Na1rTOfOnbV5Z3WNadMGPSh9jXrtfqN3Hv02li9fTr///jsVLVpUhC9cuFBM2dxx6x3/cZK/t06dOlGXLl3E/CuvvEJz586la9euibh9+/YVf6Zq1aol1qdLl85h27feeovmzZtH48aNE8vAcmDuAHAnN27dFj0RO/T5w6UB49YRbinhC2B8zB3H37Nnj7YcHBxMX3/9tbbsq7BhZtisyVam+Jq7TZs2aeuio6OpR48etHjxYi3Mlxk4ZpI2pI9ZXWOcmTu1rjG8bZ48eRzCgPdx/eYtqtWqk3j1gVuy69evTw8ePDA1d5L06dOL6Ycffkhz5syhiIgIYeok+rjS3A0YENvqzttGRkaKa1XhwoUpderUWlxgKTB3AHgKV1/BMGtNcWXuZHymf//+YsoXWl/nfPAlWrIq9jGrJL7mTrJ69WoxvXPnDrVt21YL91X4z8X5i5e0ZbO6xjgzd/q6xoSGhorpE0884RAOvItrj4xdw47dKTQ8QixPnTpVTLNmzao9cmdjz7BhCwmJfWSbLVs2un37tpjnVnCmZs2aYnrz5k1Tc/fee++JKW/LyNZffnUCuAWYOwA8Df9Lrtmyk/gKBn/aBySM6i06qEHABB6uB8OcADOu3rgp3mNV2bVrlza/e/duunEjttfs0aNHKTw8XLyfKbl69apm+LiuyffrOK5Ehl28eNFhW2bfvn0Oy8BSYO4ASE4WBKwRLzLjc2cJo06b/1qZgBF+HYB7cQOgwu8Emxk74FPA3AFgF/C5s/gzY+E/GIvLCTzMCQ/NA4BK8OUrYoBi4PPA3AFgJ/grGN/Vif0KBnAOv0v3a/+hanCKh3tps/AFFWBGZf+2GN8wZQBzB4BdGTJhGr6C4YK+f47HO4s66rbtQifOnFODARBUatKG7kZFqcHAN4G5A8DucA/Rn/xaiMdtMHqOlKqBgXQZPg/RMffUYAAEPzdsiXd6UxYwdwB4E/JzZzxuHj53RnTyzDlavXmbGpxi4GEsytdtqgYDoMHXCxj/FAfMHQDeSkK/guGr8OOmlAiXe6vusWMcAmAGt/jH3IOxS4HA3AHg7fDQBhUbt479CoaFY5qFhEfQ7bAIioqOETcIO6tRp+6GMF/W74P/pHnLVhnCIYh15GQg/digufhcn7rOCkXejaKbIWF05y4e9doUmDsAfAkeRoVb89joJfZRDL+bExYRqQbbmomz5tNNJx899zXYyGMYGOAMNnY8FM69e84/d2gV3CubTR56Z9sOmDsAfBVXnztzRnjkHY/cFNwBH6svIx/D40YKnHH4RCD1GDpaDXY7oeGR9ADvANsJmDsAfJ34fu5MPn71VvhbmTy4cXJTq1Ytypw5Mz3//PP0008/0enTp9UoCaZeu99o7MTJ4hu5+u/kJgcDBw5M9jw4gz9iL8/Rtm3Gjjbq+Vu2bJn2vVNv59Dxk9RrePKNj8mvcADbAHMHQEpCfgXDrDUvxAcuzvXbdVWDPIpqeh48eGAISyjqMCdJTc8KcubMqc2/++67ujXx59lnn3VY5m+Xli5d2iEsMezfv5/Spk1rOE+dO3d2CKtSpYoYDPvNN9/UxfJO9hw6Qr1HjFWDPc7t0HA1CCQPMHcApDT4Kxjlajeh/qMmamHcESPGSx/H6jl84hRt2Z08HyTnj6Tnzp1bDTaYjIQwaOwUmjZvsUNYUtKzCr25SyyqubMKNnectnqeXnjhBYewu///UoMvmLuytRo/+iOR/I9FYe5sA8wdACkZ/goGf+7st0F/qqu8Fu4lOP7veWqw22Fjt3z5cjVY4+bNm6KVK2PGjLRu3ToRpn9MGBAQ4GA+qjZrR9k/ziHMx+TJk7VwjlOxYkVhVvSPfJs1a0ZPPfUU/fjjj8LgqHArVbFixShNmjQ0dGjsp9vkI1beR5EiRUSL15YtW8Q6Z+GMNHcLFy4U8aL+/+UDeYxPP/00FS1aVBgoV/vVH7+cDwkJMQ2X6I/TDGnueF98nhh+XHvs2DGHdCTebu7Y2NnlPcyHj/LhC38SfQCYOwBA7PsyvvK5M77RNe/ax+M3vNdff5127dqlBmvojcUbb7xBV69eFfP6Fiw2iJxv7jjx2OOPa+GlSpXS5vXpyHl+z2/GjBli/sqVK5Q6dWotjmTp0qXafPXq1SksLExbNkvTbF6aOn3L3ffff6+ZO9U8DRkyxOl+zVru5PZr1qyhJk2aiHk2lWwQGfU4zVpKpbljZHqvvvqqw7IebzZ3/Hv1dD2PC+5cAZIdmDsAQGwvWYn83FnPYWNsd+NICDwyvydp3bo19evXTw0WREdHi5YrSdu2bal//9gBiPUmJ0/+L8W5V+PrUQ2XnKqSrYOS0NBQ+uSTT7T1bKAkeoOTK1cuOnDggGm43J+ZuXOWZ2f7dWXu9PPcMYXh9NVj1MeX6M1dz549qWrVqrR7d+xA32bxvdXcla7R0Ja/Tx4aBSQ7MHcAADZ3se8fqfDwGyWr+4mvIXjb587WbtlBR08lvadqQlDNw4kTJ6hSpUqGdfqWu/fff19M127dQZ8XNm+hY2NlFi7n69atSxs2bNDC2WTK1i7J47qWwD59+tDq1au1ZbM0zeYT2nLXsmVLp/t95ZVXtPCxY2M7A+i3HzRoEPXu3ZsuXryohanHmSlTJm1eojd3TIYMGbR5NX+MN5o77mRjR2PHwNzZApg7AIBzcycJvnzVKz93xo+tPE2NGjWE6UifPj0NGzZMC+f30bJkySLMxtq1a7VwbtnKX7I8FSpZVjxmlAZExufHvadOnaLt27drrVWy5yerbNmyIj63HPK7aCVKlHAwbpIbN26IfPEjyo4dOzoYHTY4JUuWNLxbZxauf19OvnOn5pnzUblyZRHmbL9sfNmESYMm06lWrZpYlmEq+uM0Q6bD+TYLl2ny42J92Pjx4x3i2xU2dnYG5s4WwNwBAOI2d3ouXXXP587cAQ8hYochIpyx99BR0QGEx+hLTpy1XjkLB55nxYYt4s+V3YG5swUwdwCAhJk7PfJzZ2bj5tmFboNH2nJw5hGTZ4hhTpLz8Zq+FY5bA/U4CweeJ2D9ZtFy7g3A3NkCmDsAQOLNnYS/61qjRUfxFYzomBh1dbKTHI9nXVG9RQcKPBekBgNgYNm6TTR9/hI12LbA3NkCmDsAQNLNnR5uzavVKu7PnXkS/ubmpp17xTQ5v0ErhzlROzsAIOF6Klm6ZoMtPqmXEGDubAHMHQDAWnOnx9XnzjwJm6qytZuIvLA8Za4Gj5tC1Zp3EPM3boeIYU4AcMbRk6epeLX6tHXPfpq3bBXNXLxMjWJ7YO5sAcwdAMB95o4x+9yZp2n6W+9Hpq6BZu5OnjmnRnELvK9SNRoKM1mpSRsKvnxFjQKARse+g0WdKfmoznhD5wkzYO5sAcwdAMC95k4PfwWDP5ekfgVj1aat4qbmjrH0Bo+fqpk6qX4jJ6jRLGfRyrX/7fPRjTo5O04A74D/CMg6wwbPG4G5swUwdwAAz5k7Cbfmla/rL76CwUaPWylkK9d1NwwLcvjEKYcbpydaRUrX/G9/rB/qNVOjAKDRY+gYw5+Q0jXs1REoPsDc2QKYOwCA582dnuOBZx1uaKWq+9HO/YfUaEnmblT0I1P3/5tmTffdNHnsvzptuhhu1Czu0AGAGfo/Azz/a///BsD2JmDubAHMHQAgec1dy+79DCaINXLqTDWqJZSr7S/Sd9dj0nJ1YtNnlajmRz2GjnbL42bgOwwaO1nUF25d5lcXvBmYO1sAcwcASLi5ux4WQ70WnKV6Y44mSRXaGx9FsSEqUb2heE+tXKNuhm2sULlGXaly93mG8KSqWt/lsS0v9dpR7eE7DevtoF9nBtKR4Ai1SJOVjcduU9vpJw15TSniOvNL58mG8OQWlwmXTUKAubMFMHcAgPibuy0nQuiNRhvpr+03KDj8oVdr3f6ThrCk6nzIPUOYHbXyWCh90GorjVoVTPceuKcFMy6uhMTQK34bqGD3PbTnwl1DHlOKjgTfNoTZSVw2XEaNJx4XZRYXMHe2AOYOABC3ubt4K5q+7bGHZu68abj4Q96rXUF3qOyA/bTiwE21yN1Kp5mB9Oucs4b8QPbVmVv3RZlx2bkC5s4WwNwBAFybuxvh96hEn/104oZ3tEpBCVe3+ec8ZvCaTT5BAUdCDXmAvENcdlyGzoC5swUwdwAA1+Yua/Mthgs85HviFjx3P6I9cD6cBiwPNuwb8i5xGXJZmgFzZwtg7gAAzs3duet36Y/lFw0Xd8j3tDvorngHz51898hAXggz7hvyPpXuu08tXgHMnS2AuQMAODd3LzfYYLioe5NSpUplCIuPPsqR0xDmaX32RT5DmLvFnSzcSd1xxw37tKsq16xrCEsu1Wvc3BCW3OKyNAPmzhbA3AEAnJu7djNPGy7qSVFib1I5cuWmwaMnGcLjkt7crd15iLYfjX2J//0PPxbTvxevoiefesqwnR3MXXJoxdFQOhocqVYDS+i76Jxhf57QhbAHNHjMZDEvy/3UtQiasWiFIa5eCTV3HX/vYwjT650sWQ1hnLdXX38jzjQS+7txt7hMVWDubAHMHQDA3NztCAy1fIgK/U2KDdTC1ZvF8CH5vy5Ee04GU4GC32rrlq7fTu1/6ylugHpzV+q7H2jb4dPk16w1BYXeN8TNW+AbKvP9T7Tl4ClDy90Pv1QRcc/diqYjF25Szs/zUOtO3UzTnLNsHXXq3pcOnL3qkMbLr74m8qxuwybx9PU71LB5G+0Y9Gk4O0Y2Gi+9/Apt3HecFqzaRIvXbhXrZcvd06lTi2nLjr/RV4UKi/nCxUvR8Ush9EnOzxzyZoW6zD6tVgVL+KTdNsO+PCU2UOdux9D+05dp4syF1KhFWxH+duZ3KWDzHlGGfD65fg4ZO0WsY3NXsXptOnjuGnUfMJSWrNsmyipd+ufE+scee4wCr0Vq+5DGjMuJ0zwafEvUFbnezNxx3Np+/k7T0Oerz+CRdPxyKD3zzLMiTtc+g2jzAeuH80mIcrTbrhYzzJ09gLkDAJibu0W7rxsu5kmVau7k/JNPPimmbI7Y8Mh1vMw3ML25Y8MmNWn2YkNcefOTcfX75+VvChcV8zUbNKZnn00njJ6zNFktOnRxSGPouKmm+WBxPldu3SfWq2k4O0Z9PgsVLSEMBc9Lczd9wXI6ezOK0j+XQZiJ+Ss2OOxbnzcrxIPXuoPkfMTPJo7NP89ny/4RPf744+KPwIKVG7U4v/bo51A/X3rlVVq/+4iYf+KJJwznvFKNOg77kMaM05Zh+kfrZuYuXbr0omxdpaHmq0uvAWLKf1RKlvvekKYnxWWqAnNnC2DuAADJb+7yfVWQ9p666NCqxVNp2IqX+Y4a+LcUYXxD41aufzbsoDM37hri5sn/FZX78WfaeijQYH5q1G9EH3+aS8w/lyEjde37h9M05y5fJ26kasvdsPHTTLdp2qajmHIL3okrYYY0nB0ji/P59+KVIv/8CJG31xsDbvVjQyiXi5UqK1qR3HFz90VzN2rKLEqb9hkxz+eO6xPPZ373PWHG9S1kchtuuftj1ETRktqt32DRqsrmunHLdtp6/T6kMWMjz2lyyx0bRLnezNyprxqoaejz1W/YGFEv+M/LyavhtHzTLtG699fCAEO6nhLMnW2BuQMAeM7cpSTpzZs3yRfNnR3FLb1qWJNW7Q1hdhbMnW2BuQMAwNy5QzB3jsDcuVbPQcPpu59+MYTbWTB3tgXmDgAAc2el5HtayaHyP1cSj3BZsmNGQuUr5o47ueg7PCRF6uN9Oygx5csdfNSwpAjmzrbA3AEAEmfu+N2fL/IVoNx5vzSsi4/4fSL9Mvc+lT0RWdXqNDBsEx/pX5KX4nft2PCkTpNGTFdvP2CI40qb9p8QPVpz5c6rdXhIqNTj1Strtg8MYayEtv7xO2Ry3uzm7yoPUsll7ib8vcAQllDxO2nbj5wxhCdV8TF38YljlZq372wIcyZ3nRMWzJ1tgbkDACTO3EnjkefLr8WUh2nI+PwLoldn5579RRgbKX6RnMeY4+WyP1QQPUr5JfDX33xLa2XidRwuh6hg8cvoP1asqi3LF9K5swQPYSL3ocrM3OnT4KEtpLljMzlzyWrxwjobI17mITP0x8LxuIelmpb+WHj7997PLoankHlW05THq+8dKRUfc8d5Uo9df35HTZ5JadKm1YbWYHOnHofMg7ofvZLT3HEnhAqVq9OHn3xKs5auEeF8TK+89ro2Rt2kWYso+8c5tHPD5z1Hzs9FhxPuKMEdUfgYZQcbjsO9Ul986WU6HHTDdB+qvi1Wkj7Pk1/rPKE3bmzyuVzZMHFaXN68P44jzy3HcZZHdV9m++MOHByf//DI/b+V6R2Rvnr8alyZFvcE52V5TrhDhjyOASPGiY5F3HPc7JzwkD28P7NOIHrB3NkWmDsAQOLMHV/4eRBgbg3j5Vp+TUQPTh77LUPG5x3i8g2Hp7IHKN/I1VYkHm+Ob8bSCHLvUzNzJ4cyUffBj5xYPQYOE1PuSahfr0+Dh0HhKQ+RwUNisBFbsWWvGAetz5BRDseybONO+q33QGE89a1L+mPh7bnnLC/rzZ0+TfV49Xl+461MpnnWmzvOk7Njl+dXbxLZ3KnHYZYHVclt7mQeuVcxP+Lm8eWOXbytmTs2aiKf/+/ZyuMa8pSHjNG3Uklzt2HvMWHAuYcptwar+1DzoZfs7SpN0Y5j58R+eJ573XJasoXZLI5ZHtV9mO1PDqwtj5nT5nrK8+rxq3Gl2KDxudOfE5lHuQ2bQLNzwoZRpqFPUxXMnW2BuQMAJM7cSeMhbxQ8lS1xsgWDTQi37MmbEw8NIrfXGw1uSZM3L96GH6PyvN7cSSPGA/fq96EqrpY7nnKrBbei8NAkvKwfAoPT1R9Lr0EjHNL44KNPDMei315v7vRpujJW8Wm54zypx64/v2o6bO7U43CVB6nkNne7jgeJ5dfeeJPadu6urZfmhY9ZHpMcEoSHmVm0ZoupuWvXpYeWBrdmqftQ88H68ptC4hG8au54rDx9Hden5SyOmkd1X2b7K1KitJgOGjnBIW2WevxqXJkWr/dv3cHU3ElTO3XeP07PCffcZfOn5lUvmDvbAnMHADA3dzsDQ2lvsPMvVEjjwZ/04pYRHqeNb2z8+Ee+h8dfiuCbjryp8Fhjk+csEa1yPIbYlLlLRYuV/ibCj6bkyP7jZ8wX8bjFSn6pgW9u0+Yvc/quX3zMHd8U5aDCLDZibMr4Zrh+z1GHY+HxzdhADZ8wXexXbqc/FmfmTp+mPF5+0V/NlzNzx/mVrXucJ/XY1fOrmjv1OGQe1P3olVxfqDAzd/wIm4+RDRqbag5nY8KPoOUjfB7Mlx9Vcjxe5vM9+5+1mrnjQar5ix78KJu/TqHug6cFixR3yAs/SufzJFul5fnlsuOvhHA6JcqWd0jrzbfeFvuVcVzlUX2fVN1flqzZxFAp8nG63typx6/GlWlVrV1fG1qFz4l+3Ec2ynwMXIfNzgmbat6H/BPhTPhChW2BuQMAmJs7pu3f1n5b1pn4EZca5m61+fV3bV5vzqySO9J0t+z8bdlfqtUyhFklfnythrlL0kS5kuzly+/BqetUJSSu1cK3ZW0LzB0AwLm5i+tRmreqaMkyDss8xpgaJ6lyR5ru1vuttqpVwFLqjot9LzEh4q81VK/rZwj3ZfE7hlxH5afsXCkhca0Ul6UZMHe2AOYOAODc3J27fpcGBbh+qRryDe26cJdGrw5Wq4ClfDdgP10IM+4b8j6V7rtPLV4BzJ0tgLkDADg3dwxfxA9djjZc3CHfUuamm9WidwuvNXT+TiTkHXr9URk6A+bOFsDcAQBcmzvmk7bb6Muuuw0Xecj7dS7kgTBcniLm/r+UyX+TIR+Qd4jLjsvQGTB3tgDmDgAQt7ljIqMfiHfwtp615pNOUPIq8NZ9eqvJJvryt11qUXsEbimcttX1cDuQffRZpx3xat2FubMFMHcAgPiZO8nc7VfpVb8NoiWv6p9HIC9T0V77hEkfsOS8WrQeZ//5cGoy8bjIT5n++w15tUaHqfIQ1NXEiMuEy8Z/knnnCTNg7mwBzB0AIGHmLiVQvGp9NQh4GZeuXqcfGzSn/qMmqqs8ytXrN2nv4WNqsM8Cc2cLYO4AADB3KjB33s3hE4FUsrofTZu3WF2VLPw55W81yGeBubMFMHcAAJg7FZg77+PK9Rv0k18L0VJ3JuiCujpZSUn1CebOFsDcAQBg7lRS0s3Y21m1aZsoL57alVHTZqpBPgvMnS2AuQMAwNypwNzZH26hq9i4Nd24dVtdZTsePnxIc5auUIN9Epg7WwBzBwCAuVOBubMnt0PDqIp/W+oycLi6yvaUqNZADfJJYO5sAcwdAADmTgXmzj5wq1eHPn9Qo07dadlazw22bDXdBo9Ug3wSmDtbAHMHAIC5U4G5S35On79A5Wo3oZFTfeN9tbCICNqwfbca7HPA3NkCmDsAAMydCsxd8rEgYI14hLl97wF1ldfzQ/1mapDPAXNnC2DuAAAwdyowd57l33//Fe/R1WrViSLu3FFX+wyNf+2hBvkcMHe2AOYOAABzpwJz5xkmzJxHP9ZvTkMmTFNX+SQ8/t7xwLNqsE8Bc2cLYO4AADB3KjB37qfnsDFUo0VHmrUkQF3l00yctUAN8ilg7mwBzB0AAOZOBebOPei/IpFS8fW6BXNnC2DuAAAwdyq+fgP2NN7wFQlPMWjsFDXIp4C5swUwdwAAmDsVNiKFChWiIkWKUEBA7GNDXpaaNWuWCPP396fmzZsb1rOuX79OmzZtotDQUDGvxmfWrFlDtWrVonr16olljtuhQwcx/8cff2jxvBX5FYl9Bw6qqxy4ePGiGuSzxNy7R0vXbFCDfQaYO1sAcwcAgLlTYXOXKlXs5bFEiRJiysvBwcFanPHjx2vzUVFRYnr48GG6f/++Fp4pUya6ceOG2E6Nf/bsWVq5cqUWljZtWhHXz89PLDds2FBb503wO3T8FYnM771P5cuXF4MQnzt3Tqxj81quXDm6cuUKBQUF0YYNG6hmzZpUvHhxYYj5nOjjcC9aTmPXrl2OO/FyStfwzrKNDzB3tgDmDgAAc6cizd0333xDlSpVEmG8nD9/fmFCdu7cKcLSp09PdevW1bZTzV23bt00c8fo47dq1UqLx/C+OC6rTJkyXmXu7j94oH1FIjrmnsO6LFmyaOYub968YsotosePH9da7AIDA2V0hzg9esQOHRITE6Ot9wXa9/b+VllnwNzZApg7AADMnYq+5S5nzpxiqrbc6alataqY6s2djKs3dxKOv3DhQrp9+7+P3qdOnVozd/369fMKcxf7FYnGpl+R4FbLVatWifMmzV3p0qVp/fr1QmzuJKdPn9bm9XGYa9eu0Wuvvaat9wVu3A6hXQcOq8E+AcydLYC5AwDA3Knozd2DBw9o7NixDi13I0aMoJMnTwrT8fzzz9PNmzdFXL25K1mypJheunRJrDeLX6BAAXruuedEix6bGGnuGLl/OxKfr0i8/PLLlD17dgdzx+fx888/F4+69eaOee+998RjWX2ctWvXUq5cuShfvnwOcX0BfhfRF4G5swUwdwAAmDsVK3rL7t27V0zTpUunrPFO9h4+9v+vSPzq01+R8BR12nRWg3wCmDtbAHMHAIC5U7HC3PkK/BWJ8nX96XzwJXUVSAKHTwTS+Yu+d05h7mwBzB0AAOZOJaWbu7tR0VS/fVdq+Xs/evDgoboaWETTLr3UIK8H5s4WwNwBAGDuVFKyubt87XqK/4qEp+D3Fq/fvKUGezUwd7YA5g4AAHOnkhLNHb4i4Xn4+7od+g5Wg70amDtbAHMHAIC5U0kp5u7U2fOiha5SkzZieA7gWSLv3KXSNRupwV4NzJ0tgLkDAMDcqfi6ueOvSLCpOHLyv8GDQfKwZNV68UkyXwHmzhbA3AEAYO5UfNHc8fh73EGi8a89DF+RAMnL4PFT1SCvBebOFsDcAQBg7iRDJkwTqtK0rTZ/KyRUjeZVBJ4LcvoVCWAPfOnPBMydLYC5AwDA3En4JqtX6Zr2/wSYM+LzFQlgD3gsQV8B5s4WwNwBAGDuJNPnL3Ewd3XbdFGj2IKo6Gi6cOmKGiy+IsGGDl+R8C7+/fdf+mvBUjXYK4G5swUwdwAAmDs9xas20Mzdleux33m1EzwuWqkaDals7SZaGD9yFV+R8MEvHqQUfOXRLMydLYC5AwDA3Onhli++0bKBshs8dEmpGn6x5rNaffF90g59/hAtP8C76T1irBrklcDc2QKYOwAAzJ2e5es2CfPUvvcgdVWyUvqR2Sz5f+Mp1bbnQDUa8FLuRkX5xADSMHe2AOYOAABzpyci8o4wTqs2bVVXJRuclxLVHTt7SAHfofuQUWqQ1wFzZwtg7gAAMHcqdjJNY/6abTB0pWv4UZmajcQ8m1HgG/ArAd4OzJ0tgLkDALjf3PErYV912025Ou6gvv9coEmbr9laTXqPN4Qlh4b/c4z6z9lJo1aeNqwbsuIiFe21j7K12EJhd++rpxx4IfzlkAcPHqrBXgXMnS2AuQMAuNfcDQsIolJ991Nw+EPITWo+9RRVGHJQPfXACxk9fbYa5FXA3NkCmDsAgPvMXZXhh2jWrpsGMwJZr33BUZS9tX3eEwSJw06vBCQGmDtbAHMHAHCPuZuy4RJN3nzNYEIg94kN3k+DD9JDjIzitQyf/Jca5FXA3NkCmDsAgHvM3WeddhjMhyc0bPw0Q1h8tC/wEh085/1mtMW0U2jB82LuP3hA8wNWq8FeA8ydLYC5AwBYb+6aTDxuMB2JUaGiJWjOsnXU/ree9MQTTxjWm8lKc5crd14q+0MFbVnmJ8+XX1PgtUixrI8v10+d9w+lfy6DQxjryIWbYpnz2KxtJwoKva+tK1KitJiq+UqMui88T1H3vPvF/JRMyep+apDXAHNnC2DuAADWmrsNR2/Tyw02GAxHYiTN08mr4fRWpnfE/OrtB2jmktWaeWrevjP1/uNP+v7nymKZjdP5kHuUI1dusfx25ndp0qxF9N1Pv4jlF158SZivj3LkFMtVatWjUVNm0VtvZzaYu46/96Hqdf0M+eH0R02eaWru5HyqVKkMYax06dLTudsxDmGsyjXrGsKSojbTT6pFA7yELgOHq0FeA8ydLYC5AwBYa+7aPjIVZQdY0ztWtnoNGjmB3nzrbRG2cd9xKlqyDGXN9oFYVlv00qV/jj746BMxv2jNFsr/dSGhp1OnFmFDx00VUzZfC1ZupLRpnxHLWw8FOpi7gX+O17adsWiFlh9eTp0mjbZslt/RU2dT1dr1HcJY525Fi7DdJy5QuR9/Fscit7Xa3GVriUez3kpIWDht2b1PDfYKYO5sAcwdAMBac+c37hhVHH7YYDYSI7156jVohJg+/8KLNGn2YqrfpIVYli1kUp179qds2T+iC2EPaN2uwzR9wXLNXPF6+diWt+NWwMcff1wsL9+828Hc5fw8j7Zd6fI/avnh5WMXbxvypy4/+dRThjC9OH/cMiiXrTZ3rzfcqBYN8CIGjJ6kBnkFMHe2AOYOAGCtuas35ihV/fOIwWwkRrKljB+Zvvr6GyKMW+0+z5NfM01s0F557XX68JNPxbI0b/xeHLeUsUljSTOoN3c8nbt8nTCD/FhXb+64ZU3Oc1oyP2r+nC1vP3qW/loYoB0Di41mw+ZtRF65JZEf78r4Vps7fjQOvBdvHRIF5s4WwNwBAOxr7qDEC+bOu5k8ZyH9y5928TJg7mwBzB0AAObOFwVz592wsZs6b7EabHtg7mwBzB0AAOYuoVLf87OjYO68H298NAtzZwtg7gAAnjV39Ro3N4Q50+DRk7R5HhNO/16afL+ttp8/7T9zxfD+W0LE22b/OIeYl0OouJIzc7dh7zGRz6TkxSrB3Hk//UdNVIMcmDt3Lq1evZrWrFlDBw8epHnz5mnrLl++TCNGjBDz0dHRNHDgQDE/depUMT1+/LgWd+fOndS/f38xP3HiRAoMDBTzM2bMoK1bE9brGubOFsDcAQCS19xxp4LM774n5rmH6enrd0SnA17Wm7sSZcuLaZ2GTcVUGqhT1yJo4syFpoaKBwbeeey8mPLy34tXialqznjbERP/ohNXwjRzxx0g9pwMpgIFvxXLeQt8Q2W+/4m2HDylbV+4eCk6fimEPsn5mVjO91VBh7xJ8X7X7z5CL73yqljmMfa4122n7n3F0C0c9vKrr4lzUeq7H2jb4dPk16y1MIrqOVGXnQnmzvuJjomhgPWb1WCNSpUqiWmHDh0ohuMGBIjlvHnz0ujRo8X8N998I3qEM2zoihYtKuYXLlwopkyZMmXElLdjZs+eTQ8ePKA7d+5oceILzJ0tgLkDACSfuWNT9Mwzz2pmiYc4YXO1cus+sSzNXdvO3UUcKQ5jA8Xzn32RT1vW74d7wcp5uY0rc8dTHvNOmrsnn3xSTNlILV2/XeRTn978FRsMeSpYpLhDeno99fTT2rwcQJnFvX95qh9/T4rPh3pO1GVngrnzDcrUaqQGaUhzJ42cbI1jM9e2bVvq1q2bEMMtd9w6V6xYMbHMrX4S2cLH2+m32bNnD+XIkUOLFx9g7mwBzB0AIHnM3fYjZ2j2P2vpzI272gDFTdt0FMtyjLgG/i3FVK5nnb0ZJYY/UQ2UuswqVqqsaLnjFjZe5lYxHqLEmbnbfOAkZXz+BTHPrXB7T13UWu7y5P9KDI/Cgx3L7Tl9bjksWe578dUJPiazvLT59XfxlQ3+OgUvs7lj89ml1wAtTA7Rwmnx4Mb/bNghzoX+nHDLonqOnAnmzjdo3WOAGqThzNzt2LGDXn/9dWrTpg21bt2acuXKJVr3mjZtSosXL6YWLVpQ9uzZtXSkuePtqlSpQgUKFKCIiAiR/ocffqjFiw8wd7YA5g4A4Flz56tq0LSVIcyZ9C137hLMnW9w9fpN2nv4mBpsW2DubAHMHQAA5s7TgrkDCaGKf1s1yLbA3NkCmDsAAMydLwrmznfwpiFRYO5sAcwdACD5zB2/48bTgM17xPTA2avi3TSeX7h6s/ZtVyl9JwmpVdv2i3W8rRrGvU71ceX3ZaW4d+qaHQfpcNANQ7rx1YAR48R0ytylDuH7Ai85fM5MavmmXdq8uo2VgrnzHUZNm6kG2RaYO1sAcwcASD5zJztXyA4K3ImhWp0GYl4OEcJy9d1V2Xlh2cadmnmTYccvh1L7rr3EPHd86DdsDF0IeyCWO/fs72Cu5gWsN6S9duchbf5o8C0x5X1wpwwZLs0dd77gKfeuXb55t2buuPOHPu1333tfy6fchrVu12HRKYPn+Vg4v7tPXNDWcwcL7lAhl+MSzJ3v8PDho3q3dIUabEtg7mwBzB0AIPnNHQ9EzNPceb8U473xfPcBQ7V4cZk7NkvfVaiotcDJsI6/99FaynLlziumPFYdT9Ues2Z6/oUXxVQaTinurcpj1PG8NHc8PXcrWjOTP1as6tBy903homKqHyRZbvt25nfFlMfw47Ht+J08NnfT5i8TacphWHi/+ny4Esydb1GiWgO6FRKqBtsOmDtbAHMHAEi8uQs8F0QTZy2gWq06ifeCGnbsTjV7z6EfBh80mA0zSXN37OJtWrBqE81auob6Dx/rMHgxKy5zx9MO3XprrWsyjFvpvshXQMx/+MmnYmDi997PLpbjY+5WbNlLRy7cpLfezqyF8dAl3ML4eZ78Yllv7has3KjF4yFT2NyxYcuR83PKmu0DEW5m7uSYemzo2IzKDhfcCsiPrncdDxLDrnzw0SeGPDrTu82cD34LvI9ug0dS5wHD1GDbAXNnC2DuAACuzd39Bw9o+94DNGtJADXp3FOYuJotO9GEmfPo1NnzanRauOs6vdHoP5PjSvoBjVOnSWM6z9KbOzZx+nX6MeWefTadFsYtd2wSK1SurpkoFhu+vxYGCNPELYVsJnsNGkHjZ8w3pM16J0tW7TEsm7WWHX8T8eTgyXpzx9P3P/yYRk+dTZneySLip0mbVuwvQ8bnxfqfq9TQBlOW23DL4J+TZmjj+anmjsfY4zSq1/UTLXlqHs1UZ/RRtWiAFxMWEUGlavipwbYD5s4WwNwBAP4zd3sPHRXfsyxdoyGVrO5H3YeMog3bd9H9+/eVLVxTtv9+g9kwEw/iq4bFpR9+qWIIs0ruTNuTmrjpGl26Ha0WC/ByFgSsSfBv0dPA3NkCmDsAUiKHTwTSyKkzqVztJqIlrm6b32javMWWvdPz4OG/VGHIf50RzPT9z5UNYVDSNWrtZXqt4Ua1SICPMHzSX2qQrYC5swUwdwD4Mnfu3qVVm7ZRy9/7aY9T2cRdvnbdIZ6rx7KJpeH4Y7Qr6I7BfEDuU1DYQ/qozTa6HXlPLQ7gI9h9zDuYO1sAcweAr8DvxXUZOFxc/Fk8v3HHbvr333/VqAbCI++oQZbwSdttdORq/N4Rg5KmC4+M3St+6CHr64yePlsNshUwd7YA5g4Ab+ZMUDCNnPo3fVfHX7wnN3j8VDoWeIaiohP2vlVYhHvM3YlLkZS7006DEYGsV81RR2napstqEQAf49Dxk3Th0hU12DbcCg1Xg4DngbkDwBvgHqs87MiQR+aNTVz5uv7inbmzFy6qUROFO/9tR997SG823kQzd940GBIo6dp6NlK02J29Zv2jdWBPmnftowbZhsg7UWoQ8DwwdwDYEf0j1vrtuopecmbDjlhFxB1rjAE/AuYetjxsgwq34uXrslMMrptceqfePEOYlcpUb4khzF3KXbMvfdByM608eFM91cDHKV+3qRpkC+5GRVM83gIB7gfmDoDkhFvk2LTx8CNs5Co1aSOMXHRMjBrV7YSEGQ1ZfAm+fEW0Jg6ZME1dZRv+WbPB7S+jnwm6QL8PHik+F+UJeOxBPibuJANSDqs3b3v0h8w9r1Ikhdt4JGsXYO4A8CR7Dx/TWuR4QGDuyXo++JIaLVmIio6hmHsJ62XJ5oI/i8QtjXZm2MTpWkcTd7Pt0bnw9GCzbCb5D0KZWo1EnUqOPwfAs/QaPlYNSlZuJ+HPIbAcmDsA3AU/mpw0e4EYS+7HBs1p2vwlFB4RqUazFdxr9t4914Ok8qPXpr/1FuY0OiZhZjA5aNd7kGbs6rTprK52G2x6k4Mbt0NE6y8fL7+XCXyT5KpfZoSGR9IDD7VWg3gBcweAFXDvVL6h/tywpTBzPK4cD0PijfB7M2EmJjQ0PEI8NuYWIm+hWvMOmrETjy8fGWxPwSa4XO3GarBH4TywwWMjsGwtBjb2JWYs/Cdewxy5E94/d8ZK7nwAAzB3ACSG4MtXaeCYScIw/K+98wCTmmjjuL0XRBERK4IiYPtQFBERpAkqKogi0nuV3qV3QVR6UaQjglSlCgjSe29HPfoB1wvHHe93/zkmZifZvb29bMnu+3ue90kymU1md7Iz/0x5p1m3vmKJrmAjMk3Moaul//DxVL1FB/p90VLRbWsX+7BO+uobejt8/IQhnjcNTqSrNG5tCPeHYfURtGJ+1vAb2rRjt+E8m/1szNRZhjBvG1rr4xIShaiLT8icyyXGZ7C4Y5iMwKQHjC2TY+U69h8qxs4FM3gTb9KlN3XoN1Q9ZSsw0eCDmo18Nt7OjKjoGGrYsYca7FcwzrNW685iJjZPxrAv/nqmmYCHxR3DqKCLNV0UNBbLdYVSd5YUdRCywQAWWR8+cRp1GvA9lf3Kf2OUIKYC9TfFZAzMcuauW/sBp+UMYwKLO4bBzEK9mMNsw1CkUaeeNGDEeDXY1lRr3l7b9/e4oO179wuhGcjAvQZE6Cf1WwT8DGiGxOSn+ctWqsEMw+KOCV32HDwiuljhPiLUWuhU2vYZLH6LYKNiLf9OaFAp97VvXaR4Cv4LaMlDi56/RTHjmo4DvleDGIbFHRM6HA8/rY2bGzL2V7p0JVKNElKcv3hJVOBwaxKMzF2yIiDzOJBcWLgDWrXFTOO07ZnzF9XTjJ9BjwPDKLC4Y4IXuPSYMGO2qEzhky3YJ0G4S0pKKlVt0kZMEglmAq3VTpLuIqWpGhzwYGLRxu27xNJX7fp8JyaKMP5nwbJVYhYrw+hgcccED2cvXKQ+P44RrQzoZrWrnzlv0mXQDwE7sN9KVq7bRKfPXVCDAwa4k6jWrJ0abCswJg9LzsGnIws9/8ITKxgFFneMvcHYIIyZg0sHbplzDiriT+u3FK12wc7mnXts4SICXcaNOvUKyDVCMwsmIaF7EC8OCYmJ6mnGy9jheWd8Cos7xl4cDDtGdVt3pHc+rmrqof3kyZN08OBBh7BQBl1pEL8HjhxTT3nEE088oe1v2RKYLaOo6Hbut8czcOzUabE0XVZFd86cOdUgvwGhB5GH1TlCdea5rxk/fbYaxIQ2LO6YwAYDuDGLE7MMW/caKCpDf3PvvfeqQQEJBsC37jVIDXYLd4SbO3F8DZ6XNZu2qsEBT/kaWZtFG0jiTg/WuUW3LVqNrXCtkpSURL1796bw8HCaNCm9KzJbtmwUFRVF5cuXp8TERCpYsCBNmTLF4XNNmjQR4eCNN95wOGeGfLbHjBlD48ePF9f/5JNP6Pz589p1cuTIIcIHDfLsP2YleMmd+sdCNZgJXVjcMYEHxsqhNQPj5tSu1oceeohiY2Pp4Ycf1gr3ffv2iUJffw6F8E033SQK37vvvtvw2QMHDlC7du3ojz/+oDvuuIPOnj0rws3itWnThjZt2qRdR4q7IUOGUEREBLVq1UocBwpyEsnFS5e1sNdff138JkhrSkoKtW/fnhYvXkzbt28X50uWLElnzpyhCRMmiGNZuUE0nDhxQnzmxRdfFL+n/P6IU7RoUbpy5Qrly5ePtm7dSocPH6Zx48bR0qVL02/sY+Cfza6os2j1eSZJSEigvHnzCsfDdevWpaNHj4pw5NOpU6eoQIEC4hiVffPmzcXzu2jRIu3z/gTCGw6ysfwZJmZ4Ar5/69attRb7tWvXUkzMf+P9qlSpYhB3+C+jfNCLO/1/AM+z/tkF8vlHGaIir4PfPJB6CbhrltHB4o7xP6ioRk/5TRROg0f/ItbjdMbNN99Mt9xyi1boDhw4kPLkyWM4h7d7Kdbef/99w3lUehLZ6vHFF1+4jCevI8UNKgxUFFJk+hsM0odAiIqJVU9pFRKYN2+etv/ll1+K7Z49e8S2UaNGYqsXdwCfKVSokNjv06ePFge/kT4/3n33XXE+3g/jyFDh//izY4uNnUD69W4t9HkGIKDxIoLfev58xyXDZD7JvMH5W2+9VTzLpUqV0kcNCCIuXxFdt5jRjG1cvPP/vBlHjhyhSpUqGcQdnmdV3NWoUUNsnf0H5G8mn11gJu6ee+45mjt3riFf8GIUCPT9aawaxIQuLO4Y/4AuGrSySP9Z7vLII4+IwrxLly7iGF0ysmVDf27dunUGcac/70rcOYsnrwMxA/r16ydasqS49CeYWNKye381WENtuevQoQMtWbKEtm3bJs6r4u6XX34RW/nb4DP58+cX3/eee+4RYagA33rrLbpw4QL9/PPPQlCg9e+zzz6jli1biji+JBicuWK5tCqNW4t9fZ4hnw4dOiRaoSA4IATRcnfsWPpYSlXc4YUJLVxoWR4xYkT6xQMYjM37qE76zFtXvgn3799PmzdvprCwMKpYsaII03fLyhY6vbgrXry42OpFmf4/gOdZ/+wC+fyjWxbPNloMUZ5AFMrrfP311+IlJlDEMyay8BhH5gYs7hjf8cfiFWJsEd7Ur0RFq6cZD/miaVux2kaoU6t1ZzXIlqDltX6H7mpwyCBf/DAD/tSZc+ppp+gn++iBKA4V7Og/kfEKLO4Y74OVIRp37iXG0a3dnN5SxFgDxtfBt1+oAyeuM+b/pQbblq9bdhROuEMVtDyOnDQjUy37aOkMddRxm0zIwuKO8Q7hZ89Rgw496Mtm7WjvIW5V8gZo3YDjZobEignBBlaCgMgJddAFPXryTCH0IHo37ditRmFugFVnsupWhwkKWNwx1oFuV7w5Dhr1syVuDxhz0G0XqEtr+YtqzdurQUFBVl2kBCNYDUOuRIPt+YhLapSQBpPTmJCHxR2TNeb8tUwIuqHjfuU3Rh+AiROhsHxYZkBXfzBX8NzV5hq4S8KyehB7mJABP4fwrxeqsEsUhljcMZ6AwftYUxLOhZOuXlVPM14APsIwyF71+8cEf+sWuiWx2gPjHpg1umPvAU3w9Ro2isLPnlejBS0/TZyqBjGhB4s7xj3Q5YpJERjzEsgLsgcjf61cQ71/GM1C2gkDRo5Xg4IO+DDE+NVzFyPUU4wbYNxvnbbdhJuZLbv2qqeDCiw5OGfxcjWYCS18I+5SUlPFbDY2exlWisC6pBAW8Wlvw+p5Nu9bl8E/0pLV/xrCM2P4/wUrmCEL33DBAipmNf+kYcWR2m260uXIKMM5NvftePgZqt6yg3hZvXj5iuF8MBiWawzW7+barhnWGw9RvCvuIqNjKTo2Pq3wTVFPMQFKctqfA92taCXgmZj+Ba0MF3RLiHkK/n/4H+L/GGwEw/giVEaXo2IoNj7BrXGrWL7LnXhMxuAFFuUdWvWiY4Pn/4FxuT2GBr7zaquBrEMdhrLuUmR0UL/YZoB3xF1y2pt0VEycGswEMGgdQkU5a+ES9RTjY1DZYxC9N95A8b/E/zNYGDt1lhpkK1ABQdRlFrSoM9aycMVqUQZi0pLdiYyOEa13oU5i0lWKig1JLWK9uENhFR/CzjftxOFjJ4TbkqpN2oi1Hhn/g8HgmKziTfD/xBguu4MuWW8IYF+B1rqswLNovUNsfDxVb9FBtH75+/nq2bOnGuQ2eFHnFt70l+Ur0Vn7r9kQa8UdxovEJySqwSFHcnIyLV26lPr27UubNm1ST4v1IT/55BM12OtgTUSsvQiwBiHeUpt27SPGKmQFK75PZq9x9epV6tGjh2nhh7UncQ4mwR+8V69e/0UKUDAO6Mjxk2qw5VyOtP/yb9/0HKAG2QYI7Ky2oGLlhtUb0he4Dzbwf8W6rrCTJ639P6BcGD/e9SQc3F921zqbyLRw4UKHMsZqdu/eTQMHDlSD3ebM+Qu0c99/a2OHMpExsX4X6j7GWnEXgurYQGRkpBBRECsAC3fLBewlP/1krZ+ys2fP0uOPP64dY6FrlSNHjghv98PGT6LPG7cWzfZ6sBi5O5hd24rv48k1duzYQbfccotYvFvPHXfc4fB9ILJnzpxJt956qy5W4IEVJ+I86KLzBBR0cTZ/EbNr1yR+e0+6Ys0YPPoX2ncoTA22NdOmTaOGDf/rUhw2bBgVK1ZMFyPrvPnmm2qQU6b+sZA+qNmYjp4MV095tUyZN2+eGpRp0ALJpINexRDCOnEXE+dYwYYqU6dOpS5dujiEDRo0yOHY26gFISoTOPdEK11WlzNSr+1PIO727NlDuXLl0sJWr15Nq1atMhWr3iyIs4q3xti5ws7jYjFoesHyVWqwLchqd6xK614Dg8qJs9l/1+ylMitkRtxJ4N8TXbWNOvXUejsCuUwBX7G408DkimAYjuIm1ok7qwssO4PCCTZihHG2ElqV2rZtK1qcZBcpuOuuu6hNmzb02GOP0cqVK0VzvxRS2JetfwcOHKAXXniBOnfuTO3btxf3wXlZIGL/ySefFNsePXsKv3S1W7QVhVmVKlXoyy+/1O4pkddMTEzU9r/77jtq166ddt1169Y5XFti9n0aN24sPofw4sWLiwJw/vz5WjpLlixJFSpUEK2azq4xePBgl2kGEHcA10Q3LUD61q5da1pBBGJBjJZUfw58xoBjOzJy0nQ1yDZY1Wqnp8Y3ncR4TbsTHh7u8n+K8uHmm2/WyouUlBSaNGmS9n9fvny52K9cubIWH/E6dOggylj0coAiRYpQjRo1KF++fHT33Xdr169WrZoYHvLOO++IMsiMokWL0odVq1OZanXpnvsf0MJxvY8++ojKlClDzZo1E2lbvHgx3XnnneIcynd5L304LG/evOLFFKAclt8RZaMEaTMLv/3226lTp07i+6nA6Tn7Jf2PEGq9s07cJfAkCgMYL4E/Y+HChcXxyy+/TPv3/7fCwL333itEySuvvEKHDh3Swjds2CC2+lYyfddupUqVRDerHr2YKVH+I/qiadu0CnCG4Vzu3Lk1IaQH10ShIvch8gC6R/T30qfJ7PsA3E//GRRiElV0ubqGxFmapbjbuHEj5cmTh7Zt2ya+g13EXacBw2jPwcNqsE+xq3sUu04mwLhkbw1y/7RBS69d21ecPn3a6f8UL4M4J3sf8F+XYkn/f9eLO318cO7cObHFS7SkUKFCYovr58yZUws3K0Pw+SeeeEI7zvVsPvEsbtq2Q5RTkvvuu09L24MPPqiFP//889q+PhzIzyPNshUf5Wjp0qW1tJmFQ0wCjPU2o3Uv3/YcBTIYexciWCfusjooP1g4deqUGqQVEniDFC1qOgsLCxMC0Ky71JW4k0JMgntMnrNA+MAqVry4Fo63x9tuu81wTxVV3Mn9jh07aiIK6NNk9n3gUBb3038fZ+IOaTO7hrtp1qcL13300UfFvh3EXcOOPQJiSSS7vsk279ZXDbIF3i4ng2EpNrP/bu/evenvv/82nJPHzsSdGl+i75aV++gxQQuaWhbpQRpKlSqlHaP8AmMnThYT1LDsGYBglPfWizj9fVVxJ4/xOX0aYGZpgwGU1bKXRa0XwIe1m6pBIUtMnPWt5gEKizurgbBo0aKFJm4SEhK0AuC3334TTfMAf0J0OYLp06dTzZo1xf7hw4dpxoz0FjcpivA5V+IOS4OVqlqLYm+Me0S3KsiePbvY6gs4dDeY4a64w7Uh4ObOnev0++B+devWFfsYg+hM3AFX15A4S7M+XZhZFhOTPjQg0MVdtWbtAsZhqh3FXVR0DG3cvksNtgW+KCfRkrR41Vo12DbMnj2bmjT5by3dEiVKaC936EkYO3as2MdEKTm+Wd9NqRd3iD9hwgSxj4kacuatmbgD+nIjR44c2r4eVUjq9/cdDhMiL0fup7S0ZVbc4btjGAs4fvy4NrwH11fDUQaizgAoa3/44QexrwfPQjB02VsBizsP8EWhZRcwYxZjKlD4LFq0yOHcxYsXqV+/frR+/XqH8AsXLohwfRfl0aNHtckY8k0NY1LkPpxu4q2sa7dvxfGcOXNEXLxdYsxcdPR/FffkyZNp5MiR2rEedMGaXR/o9wGurR/c7Oz7oNDBmBV0I2TLlk2EyWvprwecXcNVmoHZtfTh8hy6vNUwf1GlUauAKmjtKO6GT5ymBtkGX5ST+M9hLOfuA/8N9bAb+A4QL2bjllFGomxVW/N//PFH2rdvn/Y/l0NDEL9///6inAHyPMpXs3Jh1KhRLidwIG0YcrN161bhXkn9LNy37D9yVEy+qNO6M3Xv3l3EgSCT98ILqNzXpwNjm8HBgwdFmah+R7NwvNgOGDBApMcZA0elC9xQh8WdB/ii0GLSwSBZvJ2fOR+Yy4Ohmxnj3wAKuox8SoUKleq1CLj/iR3FnV3H2wFf5n/ngcMo/Gz6GDPGf/T5cQw16tTL57Ph9QTDMn1WwOLOA3xZaIUqJ0+fFX9SO/i1wtsk3pZll0GoU7FWk4Ac7G5HcQeRbFd8XU7Wa/8txYTm8ksBR7rI6+kXkTdp9ny/3DfQYHHnAb4utEIJjKn7slm7oFjzMBSBsAvUgtWO4m705JlqkG3wRzkJp+XwC8gEBt8OGe6XGawTZ80VWzk2OxRhcecB/ii0QoEN23aKcXWBNE6LcY46A3br7r3Ub3j6APBAxG7iDq2fWDrPrvijnDx49Dj1HzFOOw7lyj1QaN9viFjezJfU79Cd5i9bSeX96FfT37C48wB/FFrBgpnX7IuXLouxRb5YZ5SxDuQZClHM6Ny2ex/1/SlwhR2wm7hbtmad8BVnV/xVTq7bsl24SsI4XVTuR08aXTYxvgfdtHBfc+5iukN3PWb1gieMm/67GM5TNs2wDQZ3OZ7C4s4D/FVoBQPl0gTBtLnps2rRMlG1SRuauWCxEosJdDC2CYUn7IMajajH98aZfoGG3cQdHD/bGX+Wkz/+PFVU7KKCr9lIPc34EQy5+bhuM4e1pVGG/LlyjS6WZ8AnpCyXRNlUK3TznsWdB/iz0LIrh44epwo1G6f/4dIK2w79hlLvH0ar0RibULlRK4dCtHxa4Wy22HggYTdx58+l2qzAX+Xk3/9uFC+R+ufTzi2gwcrk2fOpWvP2dOT4ifTWtrQ8s2IVG1xH5nuFWo3V0yEDizsP8FehZVcwhg5vZvrCtnabrmo0xiZgwoS+AJUGwRfI2E3c2dkNCvBXOdmsa580Yez4fDaz6SofoYA+n/BCcz7ikholU2BCjaxvQrnVlsWdB/ir0LIr5ZWCVtqVKHtVtkw6Lbv30/Kw/NeNhLuO+ITAL0jsJu6adOmtBtkKf5aTeAH5qnkH3dir0K3kA5klq9ca6gUIs8SkrK3f/s/GLeJaZauHrs87Fnce4M9Cy25gQLP+j4vWiIq1mtLoKb+x01GbAkGHAhj+pOyE3cTdT79MVYNsRSCUkxjXBfc8KHvQDcgEFniBEYKupmPPDlpevx8/SY2eKeq3/1ZcK1RhcecBmSm0rp47R4datqRNhQvT+vz5Q8q+qPw11an0BY15+11a9+KLhvNZtc1vvklHu3eny8uWqT+730BadlepQusLFDCkNxisW5mK1PP9DwzhvjaZ96mZcJtjN3G3YPkqNchWZKacBCnHN1Ls8FIU2fouimx+k6V2oMkDVParejSvQT7DuUC2qA4PUfyMhnQ9OTAqam/mESys6b00pf5L1LjmJ/Rh9do0q35+Q5zMGMSdGmZH8+Q5YHHnAe4UWteiomhDwYJ0adZsoogrbF605MNHaUvRonRh9mw1G3wG7o00IC1q+ti8Z6e//8HtvLeTuMNs5O1796vBtsKdchKknNpKkS1vpZSDC4liT7CZWOLCDhTVOQfRdf+s/GLXPEq6fMQQZmfLzHPA4s4DMiq0IhYtogP16hsqIjbvWty6DbSjQgU1O7xK4smT4p64t5oeNt+ZO3lvJ3EHn4+Bup6yu2RUToL4KbUpaWkPQyXGZm7RXXNRaoRvl2TkPAo8c+c5YHHnAa4KragNG+jUoO8MlQ+bbyw1/GyGlbxVXIuJod2ffCruqaaDzfeWUd7bSdyh1c7u66S6KidBwu8tKGX/fEPFxebaYga+TNcTItWf0ytwHgWuZfQcsLjzAFeF1uYiRYguXjZUPGy+s63vvkuUmnGzdVbZV6cOXT1w2HB/Nv+Zq7y3k7jbuH2XZV77/YWrchJEtrjFUGGxZWypZzZR7PD31Z/TK3AeBa5l9BywuPMAZ4XW5RUrKHrFSkOFw+Z721KsmJo9lpISG0vHv+1huC+b/81Z3ttJ3K3ZtFW487AzzspJEP9rdbp+5ZChwrLaVv010xAWSHb2yGZDmDuWMKOuy1YbK/BVHrF5bq6eAxZ3HuCs0Fr/4ouGiiardnLHbkOYpxZz/BRdOXLMEJ4ZeyFvXrHt26Wr2B5Yv8kQxyxMtbFDh4ltx5bfGM5ZYRhon5mZlJlFtNCa3DertuuftbRq3gLaavKS0KROXUOYmbkbLzN2/eJl6tWxkyE8I1s0fabYntt30CH8i08+NcS1ypzlvZ3E3b9btovl+eyMs3ISxAx4yVBRuWsQbJtWu9dVeNNNN4ntotm/GM5lxrau+W8iQVavpbfxIwYawtw1zKD0FvGTa2Qpj9h8Z3gOzGbRsrjzANNCK+0t++yo0YaKJqs2oFt3Q9j2lasdjveuXS8q34tYuiXteNPSFYbPFPnf/6h7uw6UfPaC4dypnXto9fyFdO3cRXG8f91GOrZth9jfuGS52KZeuERHt27XxB3inNmzn8qVLCXECM4jXB92ZPNWcc1DG7eIY/09cC1svSXuYHCV4S32VPnccD8rDL+d3L/lllvE9vz+Q0Lsbft7lTjesvxvij91hk7v3qfFRf7vXL1G7OvjxZ4Ip8u6GbyIt2PVP9rxie27RBw1HWo4nofE0+cczqecjxD76/9aKrZJZ86J/JXpu3DgEJ3de4D2/btB5LNMl5oGb5hZ3ttJ3G1O+09iZRc7Y1pOpnHtwDJKPb3BUEm5a980rSu2UrjBrsccpx3r/tKOEyMO0YVj27Q4+hayzSbC8FpkGO3fukI7Pn90K8We30eXT+0Ux8/nfVZrBZTXkp/BFsdb/llA8RcO0OlDG02PYWo6syLuYr8rrP60lgH3G1nJI9idd94htg1qV9PC4i7sp5P712vH+7Ysp+Qr6b8f8kr+xvjdt61dJPIQxwi/dHIHXb18RMQ/tGOVCN+4ap4mvI/v+1dsPyj7nrZ//333OqTFmb3/XjFDmP5z+u+AdMn91OhjtHP9YtPvUKjAC1q8OdPGOFzv5ptvFluZzqwYngO4SVFhcecBZoVW1Pr1dC3suKGSyaqp4q7kO8XF9s477hTbap9VFhXq+GE/0u+//EoPPvCACJ/ww08On2tatx5lf+ghUbHi+Pj2nYZ7fdu2vdhWTxMuXVu3FfvPPfOs2FYoXUZsRWF5Iw62tb6sZriODPumYWMh7MzuIUWdN8Xd5rfeUrPJMs6Pm2C4nxWmF3fyt/7fy6+I7ZuFC4vtKwULCfH018xZQqxDZMnWOgh7fTy01K5d9Jd4AXi5QEEtX3PmyCEEVvSxk0KU6dNw7z33OITjc3hu5k6aIu5bMH9+cU8IfJzPnSuX2Ibv2kuRaf8B3BetxAjDc4ntxOEjxBYvAfo06O9rpZnlvZ3EXdiJU3T63AU12FaYlZMgfkYjQwWVGatc6QP6c/ZEyv34Y+IYFWzX9s3Ffs5HHxEVbb8e7UW4FHcQURBVeLZxPHXCD9r1EL9z26Zi/8UX8ortC/ny0JXwXbR22e+0d/MyKvzaf61YuJb+My0a1xb3euWlF4WY+2vOr+K8evxyofwO6ZTX0n+3zFjScu8tqRY77G3D/TJrUshM/+UnIbZvv/02WjJ3shB4Det8RcMGdhfnzxzeJLYyryCYIdqwX/DF57VzEMYQhov/mCTCPiz/vhCB7xV/i0YN60spUUdF+EPZHtTSAIG9a8MSp+Juw8q5Qoz979VCYos81583+w44fuuN18S2+NtFxFb9Dt/17aJdA9eVgl5e76knH3dIc1YMz0FUx+xqFrK48wSzQuvSX38ZKhgrTC/uUMH+s2CR2H/jtdfE8W233aadh7hD5Qvh1apRE4frzBz/s9iWLVlStPBEHDqinZs8cjQVeOEFIQpQoevFXZ6nnxH3ka2BT+bOLbbuijsZ9lC2bA738IW4g7Nbb3Hpt98N97PCIO5KvF2MKpYpK1rsEDZl1Bix1Ys2bNGShtbRf/9crLWimcWD9WjfUbwt4trSEI7nq5AynAAiTR+u/xzudeuttzrEl+IOLcBS3MlzqrjD59U0eMPM8t5O4i4qOoZ27j+oBtsKs3ISxP38uaGCyozJljspkP5dPptKvPOmZhBkMq5e3GEbfnCDEAU/jxqsxUF8iDN9/LE/9dfO9+jcyiDu9J+BgEPrEcQcjiECjuxabTgW/yNdOvXp8sSS141Qf1rLiBtb0XC/zBqEDISXFHEl3y2qnbvv3vQWtY6tm2hCSf72vbu10eLJfJLn+nZvZ/gNpY0bPkCIP1En3gjDS8DF49udijtprlruzL4Drost8v3dYkUM32HS2KEi3+V1ZFrVdMg0q/fNjOE5QEurCos7DzArtLwp7tClCUM33P333SdaUF5/9TVxHpXm6O+GUtE33qDZEydR/nz5aHGa8LjrzvSWPWm33347tW/eQox1e/rJJynu5GntHIQiPoMuVwiGP36dLFoAcR/ZQpjtwQdpTtr15bEUdxB/GFclu2VlGNKrF3eVP/zI4R4s7sxN33InLSNxh/1cOXPSvMlTacHU6Q7xenboSJ9W/JCunjkvBB5aYv+c8Zt4TtBNDvHVqFZth+76YkXedAjH5/DcDO7RS1ync6vWNGrwEPqqchURv2WDRuJZQYueM3EHsSq7ZfVpUL+rVWaW93YSd2DO4uVqkNfp3bt3egWVxrFjx6hTp04UERFBrVu3pvLly9PRo0e18xlhVk4Cq8QdWlPQVYf95559WlS4+Z9/ThyjxQfCQC/uVi/+jYq99bpoPXosZw6Ha+Z77lmaPO57atOivjh+4P77qGeXVvTpR+VEV2DNryrT8gVTtWvpP4NWGByrYk49hkhU0xns4k5/jDxBl+ngvp1p3szxQsTN/HWEJnzwO678c4b4vdE6u2DWhLR66H5xTuYjBHWpEm+Lz1eqWEbEGdq/m/hN3yj8CiVdOky/TxklulEhsPI885SWFrSgwfAyoKbVlbhTvwPufc89d4vjr6pWovm/jTd8B+zfffdd4vmYMHKQ+D766+HZ0KdZvW9mjMWdTcVdRia7zlDJYxyUej6UzayCtwpviTsrTS+yQs3M8t5u4m7w6F/UIAeyZctGDRo0oMIQ82nkTXtxKlOmjNgvWbKkEGTNmjWjAwcO0GtpL3AzZswQ5woWLEjFbswoltdITEykkydPijBUpLly5aJBgwaJY4i78PBwsd+nTx9N3Kn3VzErJ0FWxZ0vbMr4YYawQLNAF3dWWI1qnxnC3DWMZ4OQVMODzVjcBam4g6EV7fs+/QzhoW5mFbxV2EHc1av+tSEsVMws7+0m7qo1a6cGOZAnTx769xlNSeYAABxBSURBVN9/KSUlhbp06eJwrn799AXTIeIg7iTdunUTAq1Xr140dOhQ7RqgdOnSYgvx9swzz9CpU6fEsWy5mzBhgnYe6O9vhlk5Cewg7pbNn2IICzQLZnH3bceWVLFcKTFZQT3H5mgs7mwi7qSLEH+Z/v6qOJBdsXYxswreKuwg7vxpQgCkbd0ZV6fGQdevGpZZM8t7u4k7LHruitQbzprfe+89WrhwIcXExGjnIM7A3Xff7SDuEC8pKUnsnzlzRrvGpEmTqGrVqmJfDF6/fp1q165NFy5ccGi5k+eB/v5mmJWTwGpxJ7s/vW1WukCxwoJZ3ElDV7p+7JpV5iwvnXWTq89Yk/pfG+Jkxpzd3xNjcedncRe2ZZvLCktOnJAuQvxl+vuzuHOOK3FXBpXdjX3kOSaj6CcRmJmMW+Wjj4W4wTHcynxUrjxNGjHKcA95n/eKvUOfVKhIlw6FaWG4TvP6DRziylnW0pDPH5Ytp02cyYy5eo6lSXGHsZfqOdVkHHldjN9053OuzCzv7SbuPqjRSA1y4NVXXxUC7KGHHhLH6JYtW7as2C9RooRobWvcuLGDuAMFChSgWrVq0eHDh7VrhIWF0dSpU8V5vXgrVKiQU3Gn3l/FrJwEGYm77wd8K8ZmYRaqes7M1IrXW+apw2EY3GcMH9JLO8Z4MWwxVgsTPDDoH8f6OBmZP8Vd/54dqHyZEnR45yotTKZdP+FBjkWT31POMHbXXv/fy4YwT03OsoU5y0t3xZ3eHYreMAtYDTMzZ/f3xFjc+Vncwe0D/H1hUoIMg3uSfl270fwp08R5VG76lrPls+fSx+U/EDNgcYwB7aj85YzZ1o2b0Afvl6bDmxzdjSBc78gW+22bNtP84JldR8ZXW+4++/Ajza+eFHeYbYsB8vJ6mF1plg5pMj7SgOPhAwaJgfZDe/cVaala6ROHdMrPSXcucuC+jJvR/aSZVfBW4UrcyUknMClypMnJEWbHmJSALfzbYbKEmFFmcn1pZveRYXCPgwkW2P+hX3/hNkXGhXsUvUNiKSb1Bh93EKUQi+VLvS+2ckwn7iWF2LC+/cSzhMk8+s+rLXfYNqtXX+Qb0lbpgwrCH54+jryuvuVOClXpQgezvCF48Z9R06w3s7y3m7gbMnaiGuQ10EJnNWblJHAl7t4p+oY2CxUWfXYvdWrTRMxS/GfJLC28dvUqYkIF9lHx9ura2qFixQQIvTsKGNxr4HPdOrQwjYfzFcqVFPc0O5atLZhJW/WzD7Vr1Kv5hcP91c/9Mvo7scVEELRCFcifT/us6rNPHiOd+muYmb/EnT6P8FvKNMq0S8PvIvflObgMMevyhq/Ajz4oLX67qDN7RNgf08cKESx9yKm/u5qXc2eME9eIOLFdHENQIg72kT9wbyPFpsxLfRyYK3Gnz2PZcifzWqYDZba8h5peTMTApJq/F03X7o9nD9eSn5E++3AMP4vYN3uW9cbizs/iDjNFsX3myafE9rWXXnY4L92H6GePDvy2h9jKSv7tN4qIbd5n84gt/Jdhq5/5qg+HyVm1MDgydnUdmP7++fI8J7YQeNhKcQdRpr8eZtJiq6ZDmowP++Wn4Q6zaF8t9JLY6tOJONiqvvZk3IzuJ82sgreKjMSdbJHzRNw9/thjYgtRBtHvbDylvA9mqUrxJsMwq1rGk7Nna3/5ldi6s9IEZr3K9EhDKyG28jthlnRC+FmxrxeP+jjqFiafq4ezZzeNA2Grhk0dPVZspduVxrXrONxPNbO8t5u423c4jM6cv6gG2wazchK4EndS5JgZZq9iq3d1AZOtKnAWjIpd+iKDSDi2d60WD+VowsWD2rEaT7rngB82jPXSH2OLih9OdaUPNpkO9f7q56QjXbhCkfvSpOiRTm1xjHvLdMprmJm/xJ2aR2jFw9YdcQdBfnD7SsM1hcP2tC1mz8o8lK1jd9xxu+F31/9G6v1yPfaoQ3idr9Oft4ljhmhhqoiTcdRwaWoev/n6q+JY5rU06TJHTS+2+t8H94Gj7D2blopj+ZvKGdk4jjy92/CM6u8ljcWdt8Xd4sVENxwEqwYXJNKdCVxAwL3Eo4/kcIhjJu5k64QUYbKbVFbWMMyShQ859Z4QBmjZyvHwI9q9ZVeX2XVkfP390cqCLVxfYCvF3aDuPR2u5yodanzE04s7mRZ9OqV7D5mWxx591CFuRveTJpaD8xIZiTu5nxlx16dzF9qzZp3heujS37B4mSFcfx/pvFofBhcoWJ1i5dz54ndFq+dPAwaKFSXMljfTG8QdWkix/8D99wvxpoq7kYO+c3i25Ooj+jjqFoZWXGylaFfjmIk7+XIENy3Y6l8YzMws7+0m7sDg0T+rQbbBrJwEcb9UNVRQ0uCCRA17OPtDwuVFq2aOrVzSVJcjEErS7YVsxZGGViC0lMB5rFk8tJxIR8bqMSpkVMaypUqmQ72/+jm01mCLyh1i7aWC+bXrw0UGHO3KYykAkE41Lap5VdyNqWC4nzS9QF23Yo7W2uRK3MnvKVvlVJPiDoIOeYG8QTeqzB+z312flzge1KeT2BYt8j/R6oXnBW5JpBBTxZ1ZnIzEncxjGR+G7y/TIbuRzdKrn4GN++zeuEQbTyjjyK5jKe7MnlHVhLhrcbOahSzuPMGs0Io7cIAStu4wVDIwVcihiwuVJyrNJx5/XIShckaLi15coSKDOws55kovyuC09pHsD4v90iVKaJ+R4bgnWrawUgBautAahDFWzq4j4+vvjxa+wq+8Sp9/XEkcS3H35aefiVY7XA+fh58zfTpky5o0GR9pgGNeM3GnT6d03ovKH98fPtz0cdX7ObPt5coruWQd4d8NMdxPmqfiTm0pw+8OH4Ty95QtpdL095k+drwYdydb7tAqBr+ILz7/vBYH3fvyMw1q1BQvDRDIaH1Tr60Xd/BbiJZVpAXHeBF5t+jbYh/5BX91srVRmirO3BF38rquxN2QXn3Eih3omtXfTzWzvLejuMtoUkUgY1ZOgsQFzruYYNkfyib8f+V4JLtorcCsSTiJLVf6XXEelSJaZ7DiA47VivfAtr/F6hUQhfouXnSfIVwKSDUezuM+7b5pKMZE6Y8RX1b8Tz6RS/irk6JGvb/+c0grVlbAeb1we+apJxzCpOEY90a69Pc2s8R5rdSf1jJi+vwnQFXD94HAg0itVb2yFo4068fZmbXcSevQqrHDMboq0V39+acVhahB3uAZgElRr//d5W+kfxn45MOyYqUJ+L1DfuI5ejxXTk2IIc3wc4h95KVZHJnHZUoVd0ifmscyvsxrmQ74VpT3UJ8TVdxhi2fv6adya+IOaYRvPinu1GdUnyZpeA6ie+dTs5DFnSc4K7SOfNPKUMmw+cdSz56nc9Onq1lkGZsUMeQLk8t9ecO8eW0rTY4jhOBUz0lzlvd2FHcDRoxXg2yDs3IyNfocJW8eb6ikgtHkygXesKi296k/rWVEtrjFq3kkuyylyVVFINDUuO6aHXwTOjO1NTozhucgac1INQtZ3HmCs0Jr46uvGioaNv/Y7s8qq9ljKQeaNnXaDc/mX3OW93YUdwmJSbRk9b9qsC1wVk6CyG9uN1RSbJmwmOMUN/Zj9We1jKubp3Ae2cFcPAcs7jzAWaGVmphIYW3aGSobNt9ayolwOtarl5o9lrP1xhg0tsAxV3lvR3EHylZvoAbZAmflJLh2eBUlb5lorKzY3LLozjnVn9RyOI8C31w9ByzuPMBVoXXy++8paulyQ6XD5jvb+MorarZ4hdg9e+hEz16G+7P5z1zlvV3F3egpvwmnwnbDVTkJYr57na5H7DZUWGyuLeG3+nTt2Hr15/QKnEeBaxk9ByzuPCAx6aoa5MChli3p4o2xQWy+s9Qz52lDoUJqdniV87NmiXvi3mp62Hxn7uT95agYNcg2dBn0gxoU8GQk7kB096cp5djfhoqLzdzix1eiq+vGqT+jV+E8Cjxz5zlgcecBUbFxapCBy8uX0ybMRs3AFxubNXa4RUvaX6+emg0+A/dGGtR0sXnXEnfscjvv4+IT1SDb0KiTeVdzIOOOuAOJ8ztRTJ8X0moj89mAbCco9cQq4e4i9eIR9efzCZxHgWGZeQ5Y3HmAu907p4YPF7MqI6bNYJHnBbsWdozOjhxNe6t9RdtvLLvkT5AGpCVm9VqiC5cM6WWzzmTew5+dO3mfmno9TWxcU4NtAyZVnI+4pAYHNO6KO4BB4dE9nqbkrZPo+hXr1xK1q10/v52SFn8rKvTk3fPVn82ncB75zzx5DljceUB8QlKmxsCkXr1KkWvWCEfHbNZZ1IYNRJnIB1+RFB5Ol5YuNaSXzTrLbN5fsXGXrMRuEysyI+4k1+MvU/KeBZS8fRZbml07uCJTz7kvCKQ8qly3qSEsGM2T54DFnYe423rHMIx/uZaSQklXMy80Ao3NO/fQzv0H1eCAxRNxxzDuUrFWk0w1soQaLO48BA9VVEwcP1wME8Dg/xkZE6sG25aP6zZTgwIWFneMt/is4TfipY1xDou7LJCSmioqDn7IGCbwwP8ymIQdwHdq13eIGhyQsLhjvMHX33SkhET7To7yFSzuLABdPhjTg0HbDMP4F/wP8X8Mhq5YM2YtXEIHjhxTgwMOFneM1TTp0psuR0apwYwJLO4sBLPx0FWL8XhsbGy+N/z/7Dwr1l2qNGoV8ENCWNwxVgJfjydOn1GDGSewuGMYhrEhgT57lsUdYxVDx/1Kuw8cUoMZF7C4YxiGsSnlvm5If/+7UQ0OCFjcMVYwcdZcWr1hixrMZACLO4ZhGBszfvpsmjZ3kRrsd1jcMVll6T/r6Pc/l6rBjBuwuGMYhrE5m3bspnZ9vlOD/QqLOyYrbN29l0ZOmqEGM27C4o5hGCYIqNW6S0A5OWZxx3jK3kNH6KM6zQJ+0lAgw+KOYRgmSPjz73+oVc+BarBfYHHHeMLx8NPUccD3lBwCs969CYs7hmGYIAKVIiZanI+4pJ7yKSzumMwScSWSGnfupQYzHsDijmEYJgj5Y/EKqt2mixrsM1jcMZkhPiGBarbqrAYzHsLijmEYJoip07YrjZv+uxrsdVjcMe6CZfXgmLtt27bqKUHu3LnVoAzx5DPBBIs7hmGYICc2Pp4q1GpMX7fs6LO1sFncMe6ASRMlPvmSHnjgAapRo4YIK1y4MN10001UpEgRcYx9mNyX4T169KDs2bNTo0aNxPHnn39OTz31lOEzOXPmFHESEkJG8LC4YxiGCSWGjJ1Iddp287rIY3HHuAPGhz7yyCNiv2LFispZooMHD5q2wiH8mWee0Y537txJKTee6Vq1ammf2bVrF507d06LFyqwuGMYhglB4EMMXWHRsbHqKUtgccdkhFxCL0eOHGIrxV22bNlo06ZNYn/58uX05JNPin0IOn04iE17fitXrkzbt293cJ0iPyNBnE6dOjmEBTMs7hiGYUKYZWvWU5mv6tOGbTvVU1mCxR3jCgwTkOzZs8ehWxZj7x588EFq3LixEHFz5syhm2++WZzTh3fp0kUcf/rpp+Jc9erV6dFHH6WIiAjtM+iKffzxx0UchIcKLO4YhmEYOnoynCrVa0H9R4yzxHksizvGGZ/Wb0kpKalqMGMhLO4YhmEYAQRZx/5DhQuVmQsWq6czBYs7xozws+fFM8Z4FxZ3DMMwjIGkq1fpm54DqFbrzsK5bGZhcceoXImKpkad2EmxL2BxxzAMw7gE4/Gw1me3736ixKQk9bQpLO4YPc279aWvWnRQgxkvweKOYRiGcRusX4tZjsMmTHY5No/FHSPBS0HYiVNqMONFWNwxDMMwHjF++mwxPu+Lpm1p6+69DudY3DEALwE79x9Ugxkvw+KOYRiGyTIXLl0WLTQVazURrXss7pgpcxbQynXpfukY38LijmEYhrEULALf58fRwn/e8InTxOQMJrRYvnY9/bYwazOuGc9hcccwDMNYjr7l7p+NW4RvM4g9dNMlJLo3KYOxD5PnLND2t+3ZL0Q94z9Y3DEMwzCW46pb9s+Va+izht9Q1SZtaMnqteppxoZgjdiOA74XzrB7DB2hnmZ8DIs7hmEYxnJciTs9WKkADpM/qNGI6rfvLlr5GHvRb/hY0SoLY3cngQGLO4ZhGMZy3BV3KpeuRNLQcb9SnbZdqXyNhjRu2u8UGxevRmMCBMyYhjCX4g72ZbN2ajTGx7C4YxiGYSzHU3GnB86Tm3bto43Vu3jpshqF8TMf123mIOxgZdPszPmLalTGh7C4YxiGYSzHCnGnsnnnHmrVc6AQED2/H0n7DoVRcvI1NRrjI+DEukx1R1H3RZO2oqud8S8s7hiGYRjL8Ya4U0EXLsboScEHP3t7Dh5RozFeomX3AZqwq1SvObu8CSBY3DEMwzCW4wtxZ8bx8NOiCxfj9ao0akWTZ8+nqOgYNZrPSY04StcOrqDk7bOCxiDqxgzrS5fWTzWc85rtnk/X47l7PiNY3DEMwzCW4y9xZwa6c9GqB9crcNkxePQvPmvhi+71HMV+/zZd2z+Xrp/fThR7IijswO71hjCfWORhSt46iaJ7PkNxYz9Wf27mBizuGIZhGMsJJHFnBrp00aqHdXFlly4mcFgFWuli+hc0ihM26yw6jKLaPUixQ4uqP3/Iw+KOYRiGsZxAF3dmXI6MomlzF1HtNl2obPUGVKleCxrx63Q6dPS4GtUlV7dOp8S5rYxihM0rdv3CDoru8piaDSENizuGYRjGcuwo7pwhW/ngZBmtfJjA8cfiFRQVE6tGpetxlyhuRGmDAGHzrqWG/0vxE6up2RGysLhjGIZhLCeYxJ0ZcAOCbtwZ8/+kBh16CNE3fd6fFNnyNoPwsMr+XjTdEAa7evkInT600RCeFfPGNb1tcSPeJ0pl1ziAxR3DMAxjOcEu7sxIjQyn5PUjDaLDmZV8t6i2X+KdNw3nVZsxcbghDJYYcYiO7FptCM+KObtmwsWDdC5si9hf9ddMw/nMWplSxenyqZ1if8ncydSpTRPtHH6TNi3qGz7jymKHvaNmS0jC4o5hGIaxnFAUd0n/jCCKOmIQHM7ssZw5tP1cjz1qOK9aIIi72PP76Pi+fw3hntqdd95BQ/p1Ffvvv1eMKpYrpZ2DeESY+hlXFtniFjVbQhIWdwzDMIzlhKK4i+6V1yA2XNnyBVNp2fwp1Lp5PWrbsoEIuxYZRmXfL07zZo6ne+65W4QVyJ+P5v82nh64/z5xfNNNN4ntlPHD6JWXXtSE2PWY46I1EOGjf+jncC8IJbSMPZrjYe0av44ZSi++kJ7mNUtnOZyX14SgTI0+JsJaNqlDKxZOE2FH96zR0pF8JYwqVSxDPbu0ooIvPi8+h++Bc0ifTNecaWPo6adyO6QL4g6fwT5+A724g2VW3MX0ya9mS0jC4o5hGIaxnFAUd5EtbjaIDVcGcZftwQeoXOl3NXHX59u22vk/Z08U2w/Kvie2P48aLLbOxF3/nh1EVyZMxpFWt0ZVIRpzPvqIwzUW/zFJbFf+OcPhvL7l7uMKZejbji3Fvr7lTl5Dn2YzcadP15uvvyq6dmV8iLuYc/uod7c24jir4i5uTAU1W0ISFncMwzCM5YSkuGueLnbcNYi7i8e3U0rUUU3cHdj2twjH/ltvvCa2t9+ePkkDLXjYQhBh+07RNxzE3bG9a0VLIM6N+bG/dp9Rw/pqrW+PPJxdbFVx9+rLBRzOq+JOthqiFW7b2kUO10Ca162YQ1Fn9ghxh8kYSEf8hQMiffp0XQnfpaULJr+LHL+XZXE3tqKaLSEJizuGYRjGcljcZWx6oRO2+x9tH61jW9csdIiL4wvHtjkcnz+6lbb8s0AIN9kahhazXRuWGO4FQYbPQIjhWIopOZkBXav68/prnti3ThN0sEM7VoluWf2EClwH6ZZdrGcObxLiDumT6Tq4faW4jz5d/yyZ5XC8e+N/acf1YZtXz3eI48pY3KXD4o5hGIaxHBZ3wWH7tiynu+660xDuzKS485exuEuHxR3DMAxjOSzu7GHOZuAGiqljBzMyFnfpsLhjGIZhLIfFnaNhbNncGePEft48z4juSYRBvHz6UTktjvo5M8vsODRpLRrXNoRlJO4yK66stszen8VdOizuGIZhGMthcedoUtzJiQkyDFtMaog8vVs7bljnK8rxSHb6ovKHhuvAnIk7CCG4NqlQrqR2/FLB/MLpMFyVYLJE80a1xLn1f/9B9993L3Xr0EKLiy3G/sEdyhO5c2nhMP0EC8x6ffbpJ8VEEKQb5wsVeIGKv13EIT34HpgNjLGC+Ly8B7bovsX3qFfzC22GLq714+AeIl3674Atxvjp0+/MWNylw+KOYRiGsRwWd44G4QZhF312r0MYtu8WSxdF8hgzTCNObDdcAz7ipNiCyVm10qQQwkQLTHqQx3CZIuPICQ7Sv50q7p568nHTa0pxB3csmDGLsOfzPquJOxz/MX2sw2fxPeS+Ku6w7dG5lXYePvZwraXz0mfVqt8B98JWpt+ZsbhLh8UdwzAMYzkhKe5crCsrW+6w3JZcvkvthlWPmzaoYbgOzFXLHbZoKdMLo0ljhxriSrcq0n+dFeJOulXRG2bcli75jqm4G9CroxYPvw2uJV2mqN/h5UL5Ddc2s7jR5dRsCUlY3DEMwzCWE4riLqpjuo84M5PiLunSYcr3XHorlCrm5PG44QNEy1XjetUN14G5EnfoVv3804raMbZoLezavrm4pnSM/OAD9wvnwQ9nf8ghbu7HHxPi8+yRzSI+Whsh5qS4u3Ryh1iJAu5JBvXp5FLc4Xvg3vDX5664e/1/Lwvff+p3gOjUp9+ZxQ57W82WkITFHcMwDGM5oSju4mc0NIgNX5oUQnY1iLvwgxsM4Zkx0TXOsLhjGIZhrCcUxd315ARKXNjBIDh8ZSzuTlD85JpqtoQkLO4YhmEYywlFcQeiuzxmEBxsvrHons+q2RGysLhjGIZhLCdUxR1dT6XoruluRNh8Z8kbRlHS2tFqboQsLO4YhmEYy7mafI2uq4EhQmpEGMUMfNkgQNi8Y8lbf6W40RXUbAhpYuLi1aBghcUdwzCMr7h+/Tolpwm8UOV6QqRwjXL94i6DGGGzxlIO/UWRLW6hxGUD1J8/5LkcFaMGBSss7hiGYXxJZHSsGhRyJMzvKARIwsx6lLS8LyWvH8mWBbv6z1CKn/i5mBV7dfMU9edmbnAldP57LO4YhmF8SQh1DTFMwBCfmESp10NmUASLO4ZhGF8TQt1DDBMQRMaETKsdYHHHMAzja9CCEBUbpwYzDOMFLkVGq0HBDos7hmEYf3AlOoZSU1PVYIZhLCQuPpESk66qwcEOizuGYRh/ERufIFoVUljkMYylYGb65ahoupaSop4KBVjcMQzD+Jukq8lC5GFcEBytsrGxeWLxYjwrZsUmJCapf7NQgsUdwzAMwzBMEMHijmEYhmEYJohgcccwDMMwDBNEsLhjGIZhGIYJIljcMQzDMAzDBBEs7hiGYRiGYYIIFncMwzAMwzBBBIs7hmEYhmGYIILFHcMwDMMwTBDB4o5hGIZhGCaIYHHHMAzDMAwTRLC4YxiGYRiGCSJY3DEMwzAMwwQRLO4YhmEYhmGCCBZ3DMMwDMMwQQSLO4ZhGIZhmCCCxR3DMAzDMEwQIcTdLDY2NjY2NjY2tqCwNv8H0bnnE6zXwDoAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,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>

[image3]: <data:image/png;base64,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>

[image4]: <data:image/png;base64,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>

[image5]: <data:image/png;base64,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>