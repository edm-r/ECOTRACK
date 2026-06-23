# **ECOTRACK \- CAHIER DES CHARGES FONCTIONNEL COMMUN** 

## **PLATEFORME INTELLIGENTE DE GESTION DES DÉCHETS URBAINS**

**Date** : Janvier 2026  
**École** : INGETIS  
**Durée** : 5 mois (Janvier \- Mai)  
**Promotions** : Master 1 & Master 2  
**Spécialités** : Développement | Data Science | Cyber-Réseaux

---

## **TABLE DES MATIÈRES**

1. Présentation Générale

2. Analyse du Besoin

3. Acteurs et Utilisateurs

4. Scénarios et Cas d’Utilisation

5. Spécifications Fonctionnelles par Spécialité

6. Architecture Système Multi-Spécialités

7. Modèle de Données (Conception Étudiants)

8. Exigences Non Fonctionnelles

9. Stack Technique Recommandée par Spécialité

10. Interfaces et Intégrations

11. Organisation et Méthodologie

12. Livrables par Spécialité

13. Critères d’Évaluation

14. Annexes

---

## **I. PRÉSENTATION GÉNÉRALE**

### **1.1 Contexte et Enjeux**

La gestion des déchets urbains représente un défi majeur pour les métropoles modernes. Face à l’urbanisation croissante et aux enjeux environnementaux, les villes doivent moderniser leur système de collecte pour le rendre plus efficace, écologique et économique.

**Constats actuels :** 

- Collectes inefficaces avec des passages inutiles sur des conteneurs vides  
- Débordements fréquents de conteneurs dans les zones à forte densité   
- Coûts opérationnels élevés (carburant, main-d’œuvre, maintenance)   
- Impact environnemental important (émissions CO₂, pollution)   
- Manque de visibilité en temps réel sur l’état des conteneurs   
- Engagement citoyen limité dans le tri et la réduction des déchets   
- Planification des tournées peu optimisée   
- Absence de données analytiques pour piloter le service   
- Vulnérabilités de sécurité sur les infrastructures IoT

**Enjeux stratégiques :** 

- **Environnementaux** : Réduire l’empreinte carbone de la collecte   
- **Économiques** : Optimiser les coûts opérationnels (-20% visé)   
- **Sociaux** : Impliquer les citoyens dans une démarche éco-responsable   
- **Data-driven** : Piloter le service par les données   
- **Technologiques** : Moderniser l’infrastructure avec l’IoT   
- **Sécuritaires** : Garantir la protection des données et de l’infrastructure

### **1.2 Vision du Projet**

ECOTRACK ambitionne de transformer la gestion des déchets urbains en un service intelligent, connecté et participatif, où la technologie IoT, l’intelligence artificielle, la cybersécurité et l’engagement citoyen convergent pour créer une ville plus propre et durable.

**Notre vision repose sur 6 piliers :**

| Pilier | Description | Spécialité principale |
| :---- | :---- | :---- |
| 🔌 Connectivité IoT | Conteneurs intelligents avec capteurs temps réel | Cyber-Réseaux |
| 🤖 Intelligence Artificielle | Prédiction des remplissages et optimisation | Data Science |
| 📱 Mobilité | Applications mobiles citoyens, agents, gestionnaires | Développement |
| 📊 Analytics | Dashboards temps réel et rapports analytiques | Data Science |
| 🎮 Gamification | Engagement citoyen par points, badges et défis | Développement |
| 🔒 Sécurité | Infrastructure sécurisée et protection des données | Cyber-Réseaux |

### **1.3 Objectifs Stratégiques**

| Objectif | Indicateur | Cible | Spécialité |
| :---- | :---- | :---- | :---- |
| Optimiser tournées | Réduction distance | \-20% | Data/Dev |
| Réduire débordements | Taux débordements | \<2% | Data/Dev |
| Économiser coûts | Réduction opérationnels | \-15% | Tous |
| Réduire émissions | Réduction CO₂ | \-18% | Data |
| Engagement citoyen | Utilisateurs actifs | 15 000 | Dev |
| Disponibilité | Uptime plateforme | \>99.5% | Cyber |
| Sécurité | Incidents majeurs | 0 | Cyber |

### **1.4 Périmètre du Projet**

* **Géographie** : Métropole de 500 000 habitants

* **Infrastructure** : 2 000 conteneurs connectés

* **Zones** : 12 secteurs géographiques

* **Utilisateurs** : 15 000 citoyens actifs, 50 agents, 10 gestionnaires

---

## **II. ANALYSE DU BESOIN**

### **2.1 Problématiques Actuelles**

**Collecte Inefficace** 

- Les tournées suivent des circuits fixes sans tenir compte du remplissage réel.   
- Passages inutiles sur conteneurs vides (30-40% des arrêts)   
- Gaspillage carburant et temps   
- Usure prématurée véhicules

**Débordements Fréquents** 

- Absence de visibilité temps réel sur état des conteneurs.   
- Débordements dans zones touristiques/commerciales   
- Insalubrité et nuisances   
- Plaintes citoyens   
- Interventions d’urgence coûteuses

**Manque de Données** 

- Aucune donnée exploitable pour analyser le service.  
- Décisions basées sur intuition  
- Impossibilité mesurer performance   
- Pas d’amélioration continue   
- ROI non mesurable

**Vulnérabilités de Sécurité** 

-  Infrastructure IoT exposée sans protection adéquate.   
-  Capteurs non authentifiés   
-  Communications non chiffrées   
-  Pas de monitoring sécurité   
-  Données sensibles non protégées

### **2.2 Solution Proposée : ECOTRACK**

ECOTRACK est une plateforme IoT intelligente qui transforme la gestion des déchets en un système connecté, optimisé, participatif et sécurisé.

**Composantes de la solution :**

| Composante | Description | Spécialité |
| :---- | :---- | :---- |
| 🔌 Capteurs IoT | 2000 conteneurs équipés de capteurs ultrasoniques. Transmission MQTT vers plateforme cloud. | Cyber |
| 🗺 Optimisation Tournées | Algorithmes avancés (TSP, 2-opt) pour tournées optimales. \-20% distances. | Dev/Data |
| 📱 Applications Mobiles | Apps citoyens, agents, gestionnaires avec interfaces modernes. | Dev |
| 📊 Analytics Avancés | Dashboards temps réel, prédictions ML, rapports automatisés. | Data |
| 🎮 Gamification | Système points, badges, défis pour 15 000 citoyens engagés. | Dev |
| 🔒 Infrastructure Sécurisée | Architecture multi-zones, chiffrement, monitoring sécurité. | Cyber |

---

## **III. ACTEURS ET UTILISATEURS**

### **3.1 Parties Prenantes**

| Partie Prenante | Rôle | Attentes |
| :---- | :---- | :---- |
| Métropole | Commanditaire | ROI, efficacité, conformité |
| Services Techniques | Gestionnaires | Outils pilotage, optimisation |
| Agents Collecte | Terrain | App intuitive, routes claires |
| Citoyens | Utilisateurs finaux | Service qualité, engagement |
| DSI Métropole | Infrastructure | Sécurité, disponibilité |
| Étudiants M1/M2 | Développeurs | Projet formateur, technologies modernes |

### **3.2 Profils Utilisateurs**

* **Citoyen** (15 000 actifs)   
  * Signaler conteneur plein ou problème   
  * Consulter horaires collecte   
  * Accumuler points gamification   
  * Participer aux défis   
  * Consulter son impact environnemental  
* **Agent de Collecte** (50)   
  * Recevoir tournée optimisée sur mobile  
  * Scanner conteneurs collectés   
  * Signaler anomalies terrain   
  * Suivre progression tournée   
  * Valider collectes effectuées  
* **Gestionnaire** (10)   
  * Visualiser état temps réel conteneurs   
  * Créer et optimiser tournées   
  * Consulter analytics et KPIs   
  * Gérer alertes et anomalies   
  * Générer rapports  
* **Administrateur** (3)   
  * Gérer utilisateurs et permissions   
  * Configurer plateforme (zones, seuils, capteurs)   
  * Superviser sécurité et logs   
  * Administrer gamification   
  * Monitoring système

---

## **IV. SCÉNARIOS ET CAS D’UTILISATION**

### **4.1 Cas d’Utilisation Citoyen**

**UC-C01 : Signalement de conteneur plein** 

1. **Acteur** : Citoyen authentifié   
2. **Précondition** : Application mobile installée, utilisateur connecté   
3. **Scénario principal** :   
   1. Le citoyen ouvre l’application et accède à la carte   
   2. Il localise le conteneur concerné (GPS ou recherche)   
   3. Il sélectionne “Signaler un problème”   
   4. Il choisit le type : “Conteneur plein”   
   5. Il peut ajouter une photo optionnellement   
   6. Il valide le signalement   
   7. Le système enregistre le signalement avec horodatage et position   
   8. Le citoyen reçoit des points de gamification (+10 pts)   
   9. Une notification est envoyée au gestionnaire de zone   
4. **Post-condition** : Signalement enregistré, points crédités   
5. **Exceptions** : Signalement en doublon (\< 1h), conteneur inexistant

**UC-C02 : Consultation de l’historique personnel** 

1. **Acteur** : Citoyen authentifié   
2. **Scénario principal** :   
   1. Le citoyen accède à son profil   
   2. Il consulte ses statistiques : signalements, points, badges   
   3. Il visualise son impact environnemental (CO₂ économisé)   
   4. Il compare son classement dans le leaderboard

**UC-C03 : Participation à un défi collectif** 

1. **Acteur** : Citoyen authentifié   
2. **Scénario principal** :   
   1. Le citoyen consulte les défis disponibles   
   2. Il s’inscrit au défi “Zéro débordement \- Quartier Centre”   
   3. Il effectue des signalements pendant la période du défi   
   4. À la fin, les résultats sont calculés et les récompenses attribuées

### **4.2 Cas d’Utilisation Agent de Collecte**

**UC-A01 : Réception de la tournée du jour** 

1. **Acteur** : Agent authentifié   
2. **Précondition** : Début de service, application mobile   
3. **Scénario principal** :   
   1. L’agent s’authentifie sur l’application mobile   
   2. Le système affiche la tournée optimisée du jour   
   3. L’agent visualise sur la carte : itinéraire, étapes numérotées   
   4. Il consulte les détails : nombre de conteneurs, distance, durée estimée   
   5. Il démarre la tournée   
4. **Post-condition** : Tournée en cours, tracking activé

**UC-A02 : Validation d’une collecte** 

1. **Acteur** : Agent en tournée   
2. **Scénario principal** :   
   1. L’agent arrive au conteneur   
   2. Il scanne le QR code du conteneur (ou sélection manuelle)   
   3. Le système affiche les informations du conteneur   
   4. L’agent effectue la collecte   
   5. Il valide “Collecte effectuée” avec indication du volume   
   6. Le système enregistre : timestamp, agent, volume, position GPS   
   7. L’étape suivante s’affiche automatiquement   
3. **Exceptions** : Conteneur inaccessible, anomalie constatée

**UC-A03 : Signalement d’anomalie** 

1. **Acteur** : Agent en tournée   
2. **Scénario principal** :   
   1. L’agent constate une anomalie (conteneur endommagé, accès bloqué)   
   2. Il sélectionne “Signaler anomalie”   
   3. Il choisit le type d’anomalie dans une liste   
   4. Il ajoute un commentaire et/ou photo   
   5. Le système enregistre et alerte le gestionnaire

### **4.3 Cas d’Utilisation Gestionnaire**

**UC-G01 : Création d’une tournée optimisée** 

1. **Acteur** : Gestionnaire authentifié   
2. **Précondition** : Données conteneurs à jour   
3. **Scénario principal** :   
   1. Le gestionnaire accède au module “Tournées”   
   2. Il crée une nouvelle tournée pour une date donnée   
   3. Il sélectionne les critères : zone, seuil remplissage (ex: \>70%)   
   4. Le système propose automatiquement les conteneurs à collecter   
   5. Le gestionnaire lance l’optimisation algorithmique   
   6. Le système calcule l’itinéraire optimal (TSP, 2-opt)   
   7. Le gestionnaire visualise : carte, ordre, distance, durée   
   8. Il peut ajuster manuellement si nécessaire   
   9. Il valide et assigne la tournée à un agent   
4. **Post-condition** : Tournée créée, agent notifié

**UC-G02 : Monitoring temps réel** 

1. **Acteur** : Gestionnaire   
2. **Scénario principal** :    
   1. Le gestionnaire consulte le dashboard temps réel   
   2. Il visualise sur la carte : tous les conteneurs colorés par état   
   3. Il identifie les conteneurs critiques (\>90% remplissage)   
   4. Il reçoit les alertes en temps réel (débordement imminent)   
   5. Il peut déclencher une collecte d’urgence si nécessaire

**UC-G03 : Génération de rapport mensuel** 

1. **Acteur** : Gestionnaire   
2. **Scénario principal** :   
   1. Le gestionnaire accède aux analytics   
   2. Il sélectionne la période : mois précédent   
   3. Il choisit les KPIs à inclure : collectes, distances, débordements   
   4. Il lance la génération du rapport PDF   
   5. Le système produit un rapport structuré avec graphiques   
   6. Le gestionnaire télécharge ou envoie par email

### **4.4 Cas d’Utilisation Administrateur**

**UC-AD01 : Gestion des utilisateurs** 

1. **Acteur** : Administrateur   
2. **Scénario principal** :   
   1. L’administrateur accède au backoffice   
   2. Il consulte la liste des utilisateurs   
   3. Il peut : créer, modifier, désactiver un compte   
   4. Il assigne les rôles et permissions   
   5. Toutes les actions sont tracées dans les logs

**UC-AD02 : Configuration des alertes** 

1. **Acteur** : Administrateur   
2. **Scénario principal** :   
   1. L’administrateur accède à la configuration   
   2. Il définit les seuils d’alerte par type de conteneur   
   3. Il configure les destinataires des notifications   
   4. Il active/désactive les canaux (email, SMS, push)

### **4.5 Cas d’Utilisation Transversaux**

**UC-T01 : Authentification sécurisée** 

1. **Acteurs** : Tous les utilisateurs   
2. **Scénario principal** :   
   1. L’utilisateur saisit email et mot de passe   
   2. Le système vérifie les identifiants   
   3. Si MFA activé (gestionnaire/admin), demande du code   
   4. Le système génère un JWT avec expiration   
   5. L’utilisateur accède à l’application   
3. **Exceptions** : Mot de passe incorrect (blocage après 5 tentatives)

**UC-T02 : Réception de données IoT** 

1. **Acteurs** : Capteurs IoT (2000 conteneurs)   
2. **Scénario principal** :   
   1. Le capteur mesure le niveau de remplissage (ultrason)   
   2. Il transmet via MQTT : container\_id, fill\_level, temperature, timestamp   
   3. Le broker MQTT reçoit et authentifie le message   
   4. Les données transitent vers Kafka puis PostgreSQL   
   5. Le dashboard se met à jour en temps réel   
3. **Fréquence** : Toutes les 15 minutes ou sur changement significatif

---

## **V. SPÉCIFICATIONS FONCTIONNELLES PAR SPÉCIALITÉ**

### **5.1 Modules Communs (Toutes Spécialités)**

| Module | Fonctionnalités clés |
| :---- | :---- |
| Authentification | Inscription, login, JWT, RBAC (4 rôles), MFA optionnel |
| Dashboard | Carte interactive, états conteneurs, KPIs temps réel |
| Notifications | Alertes push, email, temps réel |
| Profil utilisateur | Gestion compte, préférences, historique |

### **5.2 Modules Spécialité DÉVELOPPEMENT**

| Module | Fonctionnalités clés |
| :---- | :---- |
| Frontend SPA | Interface responsive, composants réutilisables, state management |
| Backend API | REST/GraphQL, middleware auth, validation |
| Optimisation Tournées | Algorithmes TSP/2-opt, calcul distances, feuilles route |
| Gamification | Points, badges (30+), défis, leaderboard, notifications |
| Support | Tickets, chatbot FAQ, historique |
| Administration | Backoffice complet, audit trail |

### **5.3 Modules Spécialité DATA SCIENCE**

| Module | Fonctionnalités clés |
| :---- | :---- |
| PostGIS & Géospatial | Requêtes spatiales, clustering, heatmaps |
| Analytics Avancés | 8+ types graphiques, évolutions temporelles |
| Machine Learning | Prédiction remplissage, détection anomalies |
| ETL/DataOps | Pipelines batch/streaming, qualité données |
| Reporting | Rapports PDF/Excel automatisés, scheduler |
| Data Warehouse | Star schema, dimensions SCD2, agrégations |

### **5.4 Modules Spécialité CYBER-RÉSEAUX**

| Module | Fonctionnalités clés |
| :---- | :---- |
| Infrastructure Réseau | Architecture multi-zones (DMZ, LAN, Management) |
| Sécurité | Firewall pfSense, IDS Suricata, WAF |
| Monitoring | Prometheus/Grafana, alertes, logs centralisés |
| Haute Disponibilité | Load balancing HAProxy, Keepalived VIP |
| Chiffrement | TLS 1.3, JWT, certificats Let’s Encrypt |
| SIEM/SOC | ELK Stack ou Wazuh, corrélation événements |

---

## **VI. ARCHITECTURE SYSTÈME MULTI-SPÉCIALITÉS**

### **6.1 Architecture Globale Intégrée**

┌─────────────────────────────────────────────────────────────────────┐  
│                         UTILISATEURS                                │  
│          (Citoyens, Agents, Gestionnaires, Admins)                  │  
└────────────────────────────┬────────────────────────────────────────┘  
                             │ HTTPS (TLS 1.3)  
                             ▼  
┌─────────────────────────────────────────────────────────────────────┐  
│                    ZONE DMZ (Cyber)                                 │  
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │  
│  │   Firewall  │  │  HAProxy    │  │     WAF     │                  │  
│  │   pfSense   │  │  (LB+HA)    │  │             │                  │  
│  └─────────────┘  └─────────────┘  └─────────────┘                  │  
└────────────────────────────┬────────────────────────────────────────┘  
                             │  
┌────────────────────────────▼────────────────────────────────────────┐  
│                    ZONE APPLICATIVE (Dev)                           │  
│  ┌─────────────────────────────────────────────────────────────┐    │  
│  │                    FRONTEND (SPA)                           │    │   
│  │                 Framework JS \+ TypeScript                   │    │  
│  └─────────────────────────────────────────────────────────────┘    │  
│                             │ REST API                              │  
│  ┌─────────────────────────────────────────────────────────────┐    │  
│  │                    BACKEND API                              │    │  
│  │            Node.js/Express ou Python/FastAPI                │    │  
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │    │  
│  │  │Controllers │  │ Services   │  │Repositories│             │    │  
│  │  └────────────┘  └────────────┘  └────────────┘             │    │  
│  └─────────────────────────────────────────────────────────────┘    │  
└────────────────────────────┬────────────────────────────────────────┘  
                             │  
┌────────────────────────────▼────────────────────────────────────────┐  
│                    ZONE DATA (Data Science)                         │  
│  ┌─────────────────────────────────────────────────────────────┐    │  
│  │               PostgreSQL \+ PostGIS                          │    │  
│  │    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │    │  
│  │    │ Tables OLTP  │  │   DW Star    │  │ Materialized │     │    │  
│  │    │  (Transact.) │  │   Schema     │  │    Views     │     │    │  
│  │    └──────────────┘  └──────────────┘  └──────────────┘     │    │  
│  └─────────────────────────────────────────────────────────────┘    │  
│  ┌─────────────────────────────────────────────────────────────┐    │  
│  │               PIPELINES ETL/STREAMING                       │    │   
│  │    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │    │  
│  │    │   Kafka      │  │   Airflow    │  │     dbt      │     │    │  
│  │    │  (Streaming) │  │   (Batch)    │  │  (Transform) │     │    │  
│  │    └──────────────┘  └──────────────┘  └──────────────┘     │    │  
│  └─────────────────────────────────────────────────────────────┘    │  
└────────────────────────────┬────────────────────────────────────────┘  
                             │  
┌────────────────────────────▼────────────────────────────────────────┐  
│                    ZONE IOT (Cyber \+ Data)                          │  
│  ┌─────────────────────────────────────────────────────────────┐    │  
│  │                 MQTT Broker (Mosquitto)                     │    │  
│  │              2000 capteurs IoT connectés                    │    │  
│  │            TLS \+ Authentification certificats               │    │  
│  └─────────────────────────────────────────────────────────────┘    │  
└─────────────────────────────────────────────────────────────────────┘  
                             │  
┌────────────────────────────▼────────────────────────────────────────┐  
│                    ZONE MANAGEMENT (Cyber)                          │  
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │  
│  │  Prometheus  │  │   Grafana    │  │  SIEM/Wazuh  │               │  
│  │  (Métriques) │  │ (Dashboards) │  │  (Sécurité)  │               │  
│  └──────────────┘  └──────────────┘  └──────────────┘               │   
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │  
│  │   Suricata   │  │   ELK Stack  │  │   Ansible    │               │  
│  │    (IDS)     │  │    (Logs)    │  │    (IaC)     │               │  
│  └──────────────┘  └──────────────┘  └──────────────┘               │  
└─────────────────────────────────────────────────────────────────────┘

### **6.2 Flux de Données Inter-Spécialités**

**Flux 1 : Capteur → Dashboard (Temps réel)**

Capteur IoT → MQTT (Cyber) → Kafka (Data) → API Backend (Dev) → Frontend (Dev)

**Flux 2 : Mesures → Analytics (Batch)**

MQTT → Kafka → Staging (Data) → ETL/dbt (Data) → DW (Data) → Dashboard Grafana

**Flux 3 : Utilisateur → Action (Transactionnel)**

Frontend → API (Dev) → PostgreSQL (Data) → Logs ELK (Cyber) → Monitoring

---

## **VI-BIS. ARCHITECTURE RÉSEAU (Spécialité Cyber-Réseaux)**

**NOTE** : Cette section présente l’architecture réseau cible simplifiée. Les étudiants Cyber-Réseaux doivent concevoir et déployer cette infrastructure.

### **6.3 Vue d’Ensemble de l’Architecture**

L’infrastructure ECOTRACK est organisée en **4 zones de sécurité** isolées par VLANs, avec un firewall central assurant le filtrage inter-zones.

#### *Tableau 1 : Les 4 Zones de Sécurité*

| Zone | VLAN | Réseau | Fonction | Niveau de confiance |
| :---- | :---- | :---- | :---- | :---- |
| **DMZ** | 10 | 10.10.1.0/24 | Services exposés à Internet (Load Balancer, WAF) | 🔴 Faible |
| **LAN Applicatif** | 20 | 10.10.2.0/24 | Applications, bases de données | 🟡 Moyen |
| **Management** | 30 | 10.10.3.0/24 | Monitoring, sécurité, administration | 🟢 Élevé |
| **IoT** | 40 | 10.10.4.0/24 | Capteurs connectés, broker MQTT | 🔴 Faible |

#### *Tableau 2 : Flux Réseau Principaux*

| De → Vers | Sens | Protocole/Port | Description |
| :---- | :---- | :---- | :---- |
| Internet → DMZ | Entrant | HTTPS/443 | Accès utilisateurs |
| DMZ → LAN | Interne | HTTP/3000 | Load Balancer vers API |
| LAN → LAN | Interne | PostgreSQL/5432 | App vers Base de données |
| IoT → LAN | Interne | MQTT/8883 | Capteurs vers Broker |
| Toutes zones → MGT | Interne | Logs/9200 | Centralisation logs |
| MGT → Toutes zones | Interne | SSH/22 | Administration |

#### *Tableau 3 : Représentation Visuelle*

┌─────────────────────────────────────────────────────────────────┐  
│                         INTERNET                                │  
└──────────────────────────────┬──────────────────────────────────┘  
                               │  
                    ┌──────────▼──────────┐  
                    │   FIREWALL pfSense  │  
                    │   (Routeur central) │  
                    └──────────┬──────────┘  
                               │  
        ┌──────────────────────┼──────────────────────┐  
        │

                                              
   ┌────▼────┐           ┌─────▼─────┐          ┌────▼────┐  
   │   DMZ   │           │    LAN    │          │   MGT   │  
   │ VLAN 10 │◄─────────►│  VLAN 20  │◄────────►│ VLAN 30 │  
   │ 1 VM    │           │  3 VMs    │          │  2 VMs  │  
   └─────────┘           └─────┬─────┘          └─────────┘  
                               │  
                         ┌─────▼─────┐  
                         │    IoT    │  
                         │  VLAN 40  │  
                         │   1 VM    │  
                         └───────────┘

---

### **6.4 Inventaire des Serveurs**

7 VMs au total 

#### *Infrastructure Minimale Requise*

| Zone | Nom VM | IP | Rôle | Services | RAM | Priorité |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **DMZ** | ECO-PROXY | 10.10.1.10 | Reverse Proxy \+ LB | HAProxy, Nginx, ModSecurity | 4 Go | Obligatoire |
| **LAN** | ECO-APP | 10.10.2.10 | Application | Backend API (Node/Python) | 4 Go | Obligatoire |
| **LAN** | ECO-WEB | 10.10.2.20 | Frontend | Nginx, fichiers statiques | 2 Go | Obligatoire |
| **LAN** | ECO-DB | 10.10.2.30 | Base de données | PostgreSQL \+ PostGIS \+ Redis | 8 Go | Obligatoire |
| **MGT** | ECO-MON | 10.10.3.10 | Monitoring \+ Logs | Prometheus, Grafana, ELK (all-in-one) | 8 Go | Obligatoire |
| **MGT** | ECO-SEC | 10.10.3.20 | Sécurité | Suricata IDS, Wazuh (optionnel) | 4 Go | Obligatoire |
| **IoT** | ECO-MQTT | 10.10.4.10 | Broker IoT | Mosquitto MQTT \+ TLS | 2 Go | Obligatoire |

**Total : 7 VMs \- 32 Go RAM minimum**

#### *Extensions Optionnelles* 

| Nom VM | IP | Rôle | Services |
| :---- | :---- | :---- | :---- |
| ECO-LB-02 | 10.10.1.11 | HA Load Balancer | Keepalived (failover) |
| ECO-DB-02 | 10.10.2.31 | Réplication BDD | PostgreSQL replica |
| ECO-BASTION | 10.10.3.50 | Accès sécurisé | SSH \+ 2FA |

---

### **6.5 Plan d’Adressage IP**

| Zone | VLAN | Réseau | Passerelle | Plage utilisable | Nb IPs |
| :---- | :---- | :---- | :---- | :---- | :---- |
| DMZ | 10 | 10.10.1.0/24 | 10.10.1.1 | .10 à .50 | \~40 |
| LAN | 20 | 10.10.2.0/24 | 10.10.2.1 | .10 à .100 | \~90 |
| Management | 30 | 10.10.3.0/24 | 10.10.3.1 | .10 à .50 | \~40 |
| IoT | 40 | 10.10.4.0/24 | 10.10.4.1 | .10 à .254 | \~244 |

---

## **IV-BIS. USE CASES CYBER-RÉSEAUX** 

### **4.6 Cas d’Utilisation Spécifiques Cyber**

3 Use Cases essentiels

#### *UC-CY01 : Détection et blocage d’une attaque*

| Élément | Description |
| :---- | :---- |
| **Acteur** | Système IDS Suricata |
| **Déclencheur** | Tentative de scan de ports ou bruteforce |
| **Scénario** | 1\. Suricata détecte l’activité suspecte → 2\. Alerte envoyée vers Grafana/ELK → 3\. Notification email/Slack → 4\. Blocage IP sur pfSense (manuel ou auto) |
| **Résultat** | Attaque stoppée, événement loggé |
| **Livrable** | 5 règles Suricata personnalisées minimum |

#### *UC-CY02 : Supervision et alerting*

| Élément | Description |
| :---- | :---- |
| **Acteur** | Administrateur système |
| **Déclencheur** | Seuil dépassé (CPU \> 80%, disque \> 90%, service down) |
| **Scénario** | 1\. Prometheus collecte les métriques → 2\. Règle d’alerte déclenchée → 3\. Alertmanager notifie → 4\. Dashboard Grafana affiche le problème |
| **Résultat** | Problème identifié rapidement |
| **Livrable** | 3 dashboards Grafana \+ 5 règles d’alerte |

#### *UC-CY03 : Accès sécurisé à l’infrastructure*

| Élément | Description |
| :---- | :---- |
| **Acteur** | Administrateur |
| **Déclencheur** | Besoin d’administrer un serveur |
| **Scénario** | 1\. Connexion SSH par clé uniquement → 2\. Authentification réussie → 3\. Actions loggées vers ELK → 4\. Traçabilité complète |
| **Résultat** | Accès sécurisé et audité |
| **Livrable** | Configuration SSH durcie, logs centralisés |

---

## **VIII-BIS. RÈGLES FIREWALL ESSENTIELLES**

Les étudiants doivent implémenter ces règles sur pfSense.

### **Règles Obligatoires (15 règles minimum)**

#### *Flux Entrants (Internet → DMZ)*

| \# | Source | Destination | Port | Action | Description |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | ANY | 10.10.1.10 | 443 | PASS | HTTPS vers Reverse Proxy |
| 2 | ANY | 10.10.1.10 | 80 | PASS | HTTP (redirect vers 443\) |
| 3 | ANY | ANY | \* | BLOCK | Bloquer tout le reste |

#### *Flux DMZ → LAN*

| \# | Source | Destination | Port | Action | Description |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 4 | 10.10.1.10 | 10.10.2.10 | 3000 | PASS | Proxy → API Backend |
| 5 | 10.10.1.10 | 10.10.2.20 | 80 | PASS | Proxy → Frontend |
| 6 | 10.10.1.0/24 | 10.10.2.0/24 | \* | BLOCK | Bloquer autres flux |

#### *Flux LAN Internes*

| \# | Source | Destination | Port | Action | Description |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 7 | 10.10.2.10 | 10.10.2.30 | 5432 | PASS | App → PostgreSQL |
| 8 | 10.10.2.10 | 10.10.2.30 | 6379 | PASS | App → Redis |
| 9 | 10.10.2.20 | 10.10.2.10 | 3000 | PASS | Frontend → API (si besoin) |

#### *Flux IoT*

| \# | Source | Destination | Port | Action | Description |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 10 | 10.10.4.0/24 | 10.10.4.10 | 8883 | PASS | Capteurs → MQTT (TLS) |
| 11 | 10.10.4.10 | 10.10.2.30 | 5432 | PASS | MQTT → PostgreSQL |
| 12 | 10.10.4.0/24 | ANY | \* | BLOCK | IoT isolé d’Internet |

#### *Flux Management*

| \# | Source | Destination | Port | Action | Description |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 13 | 10.10.3.10 | ALL | 9100 | PASS | Prometheus scrape |
| 14 | ALL | 10.10.3.10 | 9200 | PASS | Logs → ELK |
| 15 | 10.10.3.0/24 | ALL | 22 | PASS | SSH admin |

---

## **IX-BIS. EXIGENCES SÉCURITÉ** 

### **Règles IDS Suricata (5 minimum)**

Les étudiants doivent créer **5 règles personnalisées** couvrant :

| Type de règle | Description | Exemple |
| :---- | :---- | :---- |
| Bruteforce SSH | Détecter 5+ tentatives en 1 minute | threshold by\_src, count 5, seconds 60 |
| Bruteforce API | Détecter 10+ POST /login en 1 minute | Sur endpoint /api/auth/login |
| Scan de ports | Détecter SYN vers 10+ ports différents | flags:S; threshold count 10 |
| Injection SQL | Détecter patterns UNION, SELECT, etc. | content:"UNION"; nocase; |
| Trafic IoT anormal | Détecter volume excessif depuis capteur | threshold count 100, seconds 60 |

### **Hardening Serveurs** 

| Action | Vérification | Obligatoire |
| :---- | :---- | :---- |
| Désactiver root SSH | PermitRootLogin no | ✅ Oui |
| SSH par clé uniquement | PasswordAuthentication no | ✅ Oui |
| Firewall local activé | ufw enable | ✅ Oui |
| Mises à jour auto sécurité | unattended-upgrades | ✅ Oui |
| Logs vers ELK | rsyslog configuré | ✅ Oui |
| Fail2ban installé | Protection bruteforce | ⭕ Recommandé |
| Node exporter | Métriques Prometheus | ⭕ Recommandé |

---

## **XII-BIS. LIVRABLES CYBER-RÉSEAUX** 

### **Livrables Obligatoires**

| Livrable | Format | Description |
| :---- | :---- | :---- |
| **Schéma réseau** | Draw.io/Visio/PNG | Architecture 4 zones avec IPs |
| **Plan d’adressage** | Tableau Word/Excel | VLANs, sous-réseaux, IPs serveurs |
| **Règles firewall** | Export pfSense \+ Doc | 15 règles minimum documentées |
| **Règles IDS** | Fichier .rules | 5 règles Suricata personnalisées |
| **Dashboard monitoring** | Grafana JSON | 3 dashboards (Infra, Sécu, IoT) |
| **Documentation sécurité** | Word 10-15 pages | PSSI simplifiée \+ procédures |

### 

## **VII. MODÈLE DE DONNÉES**

La conception détaillée du modèle de données (entités, attributs, relations, clés) fait partie du travail attendu des étudiants. Ce chapitre présente uniquement les **concepts métier** à modéliser, sans imposer de structure.

### **7.1 Concepts Métier à Modéliser**

Les étudiants doivent identifier et modéliser les concepts suivants :

**Entités principales (à enrichir) :** 

**Utilisateurs** : Les différents profils (citoyen, agent, gestionnaire, admin) 

**Conteneurs** : Les bacs à déchets connectés avec leurs caractéristiques 

**Zones géographiques** : Les secteurs de la métropole 

**Mesures IoT** : Les données remontées par les capteurs 

**Tournées** : Les circuits de collecte avec leurs étapes 

**Signalements** : Les remontées citoyens 

**Gamification** : Points, badges, défis, classements

**Questions de conception à traiter :** 

Quelles sont les entités nécessaires ? 

Quels attributs pour chaque entité ? 

Quelles relations entre entités (1:N, N:M) ?

Quelles clés primaires et étrangères ? 

Comment gérer les données géographiques (PostGIS) ? 

Comment structurer un Data Warehouse (star schema) ?

### **7.2 Contraintes de Conception**

**Contraintes fonctionnelles :** 

1. Gestion de 2 000 conteneurs avec historique des mesures   
2. Traçabilité complète des actions utilisateurs   
3. Performances requises : requêtes \< 200ms

**Contraintes techniques :** 

1. Base PostgreSQL avec extension PostGIS   
2. Normalisation appropriée pour l’OLTP   
3. Dénormalisation pour le Data Warehouse (analytics)   
4. Support des données temporelles et spatiales

### **7.3 Livrables Attendus (Conception)**

Les étudiants doivent produire : 

**Dictionnaire de données** : Liste des entités et attributs 

**Modèle Conceptuel (MCD)** : Diagramme entité-association 

**Modèle Logique (MLD)** : Schéma relationnel 

**Scripts DDL** : Création des tables SQL 

**Justification des choix** : Arguments techniques

---

## **VIII. EXIGENCES NON FONCTIONNELLES**

### **8.1 Performance**

| Métrique | Cible | Responsable |
| :---- | :---- | :---- |
| Temps réponse API | \< 500ms (p95) | Dev |
| Requêtes SQL | \< 200ms (90%) | Data |
| Chargement page | \< 3s | Dev |
| Users simultanés | 500 | Cyber |
| IoT throughput | 400 msg/min | Cyber/Data |
| Cache hit ratio | \> 80% | Dev/Cyber |

### **8.2 Sécurité (Focus Cyber)**

| Exigence | Implémentation | Responsable |
| :---- | :---- | :---- |
| HTTPS obligatoire | TLS 1.3, Let’s Encrypt | Cyber |
| Authentification | JWT \+ MFA optionnel | Dev/Cyber |
| RBAC | 4 rôles, moindre privilège | Dev |
| Protection OWASP Top 10 | WAF, validation input | Cyber |
| Chiffrement passwords | bcrypt (10 rounds) | Dev |
| Rate limiting | 100 req/min/IP | Cyber |
| Audit trail | Logs ELK centralisés | Cyber |
| Scan vulnérabilités | Trivy, OWASP ZAP | Cyber |
| IDS/IPS | Suricata règles custom | Cyber |
| SIEM | Wazuh ou ELK Security | Cyber |

### **8.3 Disponibilité**

| Métrique | Cible | Responsable |
| :---- | :---- | :---- |
| Uptime | 99.5% | Cyber |
| RTO | \< 4h | Cyber |
| RPO | \< 1h | Cyber/Data |
| Backups | Quotidiens, chiffrés | Cyber |
| HA | Active-passive minimum | Cyber |

### **8.4 Scalabilité**

| Composant | Stratégie | Responsable |
| :---- | :---- | :---- |
| Frontend | CDN, assets statiques | Dev |
| Backend | Horizontal scaling | Cyber |
| Database | Partitioning temporel | Data |
| Cache | Redis cluster | Dev/Cyber |
| Streaming | Kafka partitions | Data |

### **8.5 Conformité**

* **RGPD** : Consentement, droit à l’oubli, minimisation données

* **Accessibilité** : WCAG 2.1 niveau AA

* **ISO 27001** : Bonnes pratiques sécurité

---

## **IX. STACK TECHNIQUE RECOMMANDÉE PAR SPÉCIALITÉ**

 **NOTE** : Les technologies ci-dessous sont **recommandées** et non imposées. Les étudiants peuvent proposer des alternatives justifiées, à condition de respecter les objectifs fonctionnels et les contraintes de performance.

### **9.1 Spécialité DÉVELOPPEMENT**

**Focus** : Application full-stack, algorithmes, UX/UI, CI/CD

**Stack technique recommandée :** 

* Frontend : React 18+ ou Vue 3 \+ TypeScript (recommandé)   
* Styling : TailwindCSS ou équivalent   
* Backend : Node.js \+ Express ou Python \+ FastAPI   
* Base de données : PostgreSQL 14+ (+ PostGIS en collaboration Data)   
* Cache : Redis (recommandé)   
* CI/CD : GitHub Actions ou GitLab CI   
* Tests : Jest, Cypress ou équivalents   
* Documentation API : OpenAPI/Swagger

**Modules obligatoires :** 

1. Frontend responsive (Desktop, Tablet, Mobile)   
2. API REST complète avec authentification JWT   
3. Algorithmes optimisation tournées (TSP, 2-opt)   
4. Système gamification complet (points, badges, défis)   
5. Dashboard gestionnaire avec graphiques   
6. Application mobile-first pour agents   
7. Tests automatisés (unitaires, intégration, e2e)   
8. CI/CD pipeline fonctionnel

**Livrables spécifiques :** 

- Code source (GitHub)   
- Documentation API (Swagger)   
- DCT 30-35 pages   
- Tests coverage \>60%   
- Application déployée

### **9.2 Spécialité DATA SCIENCE**

**Focus** : PostGIS, Analytics avancés, ML, ETL/ELT, DataViz

**Stack technique recommandée :** 

* Base de données : PostgreSQL 15 \+ PostGIS 3.3   
* ETL/ELT : Airflow (concepts) \+ dbt (recommandé)   
* Streaming : Kafka (concepts théoriques)   
* Analytics : Python (Pandas, NumPy, Scikit-learn)   
* DataViz : Grafana, Metabase ou Superset   
* ML : Scikit-learn (régression, classification)   
* Qualité : Great Expectations ou dbt tests

**Modules obligatoires :** 

1. Data Warehouse star schema (facts \+ dimensions)   
2. PostGIS requêtes spatiales (ST\_Contains, clustering, heatmap)   
3. Pipelines ETL batch et streaming (concepts)   
4. Dashboards opérationnels (8+ types graphiques)   
5. Machine Learning prédictif (remplissage)   
6. Rapports automatisés PDF/Excel   
7. Qualité données (tests automatisés)   
8. Documentation data catalog et lineage

**Livrables spécifiques :** 

- Scripts SQL DW (DDL, ETL)   
- Notebooks Jupyter analyses   
- Dashboards Grafana/Metabase   
- Modèle ML entraîné   
- Documentation data architecture

### **9.3 Spécialité CYBER-RÉSEAUX**

**Focus** : Infrastructure sécurisée, monitoring, haute disponibilité

**Stack technique recommandée :** 

* Virtualisation : VMware/Proxmox ou Docker   
* Firewall : pfSense (recommandé) ou OPNsense   
* Load Balancer : HAProxy \+ Keepalived   
* IDS/IPS : Suricata ou Snort   
* Monitoring : Prometheus \+ Grafana   
* Logs : ELK Stack (Elasticsearch, Logstash, Kibana)   
* SIEM : Wazuh ou ELK Security   
* IaC : Ansible (recommandé) ou Terraform

**Modules obligatoires :** 

1.  Architecture réseau multi-zones (DMZ, LAN, Management)   
2.  Firewall avec règles documentées   
3.  Haute disponibilité (load balancer, failover)   
4.  IDS avec règles custom ECOTRACK   
5.  Monitoring complet (dashboards, alertes)   
6.   Logs centralisés   
7.  SIEM basique (corrélation événements) 

 Documentation sécurité (PSSI, PCA, runbooks)

**Livrables spécifiques :** 

- Schéma réseau détaillé   
- Configurations firewall/IDS   
- Dashboards monitoring   
- Documentation sécurité (PSSI)   
- Procédures incidents   
- Tests sécurité (pentesting basique)

---

## **X. INTERFACES ET INTÉGRATIONS**

### **10.1 API REST Principales (Conception Étudiants)**

Les étudiants doivent concevoir et documenter les endpoints API suivants :

**Authentification** \- Inscription, login, refresh token, profil utilisateur

**Conteneurs** \- CRUD conteneurs, historique mesures, import/export

**Zones** \- CRUD zones, statistiques par zone

**Tournées** \- CRUD tournées, optimisation algorithmique, export feuilles de route

**Analytics** \- KPIs temps réel, top conteneurs, heatmaps, génération rapports

**Gamification** \- Profil joueur, badges, classements, défis

### **10.2 Intégrations Externes Possibles**

| Service | Usage | Spécialité |
| :---- | :---- | :---- |
| Cartographie | OpenStreetMap, Leaflet | Dev/Data |
| Géocodage | Nominatim (OSM) | Dev |
| Météo | OpenWeatherMap API | Data |
| Notifications | Firebase Cloud Messaging | Dev |
| Email | Nodemailer, SendGrid | Dev |

### **10.3 Protocoles IoT**

| Protocole | Usage | Spécialité |
| :---- | :---- | :---- |
| MQTT | Transport capteurs→broker | Cyber |
| TLS 1.3 | Chiffrement communications | Cyber |
| JSON | Format messages IoT | Data |

---

## **XI. ORGANISATION ET MÉTHODOLOGIE**

### **11.1 Méthodologie Projet**

**Approche Agile Scrum recommandée :** 

Sprints de 2 semaines 

Daily standups (15 min) 

Sprint planning et retrospective 

Backlog produit priorisé 

Démonstrations régulières

### **11.2 Jalons Projet (4 mois)**

| Jalon | Semaine | Livrables |
| :---- | :---- | :---- |
| Kick-off | S1 | Équipes constituées, backlog initial |
| Sprint 0 | S2-3 | Architecture, environnement, cadrage |
| Sprint 1-2 | S4-7 | Fondations, modules core |
| Sprint 3-4 | S8-11 | Fonctionnalités avancées |
| Sprint 5 | S12-14 | Intégration, tests, polish |
| Soutenance | S15-16 | Présentation finale |

### **11.3 Points de Synchronisation Inter-Spécialités**

| Fréquence | Objectif |
| :---- | :---- |
| Lundi | Planning hebdo, points bloquants |
| Mercredi | Revue technique, intégrations |
| Vendredi | Démo intégration, rétrospective |

### **11.4 Outils Collaboration Recommandés**

| Outil | Usage |
| :---- | :---- |
| Git/GitHub | Versionning code |
| Jira/Trello | Gestion backlog |
| Slack/Discord | Communication équipe |
| Miro/Draw.io | Schémas, diagrammes |
| Notion/Confluence | Documentation |

---

## **XII. LIVRABLES PAR SPÉCIALITÉ**

### **12.1 Livrables Communs (Toutes Spécialités)**

| Livrable | Description | Format |
| :---- | :---- | :---- |
| DCT | Document de Cadrage Technique (30-35 pages M1) | DOCX/PDF |
| README | Guide installation et utilisation | Markdown |
| Présentation | Support soutenance (20-25 slides) | PPTX |
| Démo | Application fonctionnelle déployée | URL |

### **12.2 Livrables Spécialité Développement**

| Livrable | Description |
| :---- | :---- |
| Code source | Repository GitHub organisé, branches, commits |
| Documentation API | Swagger/OpenAPI complet |
| Tests | Coverage \>60%, tests E2E |
| CI/CD | Pipeline fonctionnel (build, test, deploy) |
| Application | Frontend \+ Backend déployés |

### **12.3 Livrables Spécialité Data Science**

| Livrable | Description |
| :---- | :---- |
| Scripts SQL | DDL tables OLTP \+ DW, procédures ETL |
| Notebooks | Analyses EDA, entraînement ML |
| Dashboards | Grafana/Metabase configurés |
| Modèle ML | Pickle/joblib avec métriques |
| Documentation | Data catalog, lineage, architecture |

### **12.4 Livrables Spécialité Cyber-Réseaux**

| Livrable | Description |
| :---- | :---- |
| Schéma réseau | Architecture multi-zones détaillée |
| Configurations | Firewall, IDS, HAProxy, monitoring |
| Dashboards | Prometheus/Grafana sécurité |
| PSSI | Politique de sécurité complète |
| Runbooks | Procédures incidents et PCA |
| Tests sécurité | Rapport pentesting basique |

---

## **XIII. CRITÈRES D’ÉVALUATION**

### **13.1 Grille d’Évaluation Commune** 

| Critère |  | Description |
| :---- | :---- | :---- |
| Conception |  | Architecture, modélisation, choix techniques |
| Implémentation |  | Qualité code, fonctionnalités, tests |
| Documentation |  | DCT, README, API docs, schémas |
| Tests |  | Coverage, qualité tests, CI/CD |
| Présentation |  | Soutenance, démo, réponses jury |

### **13.2 Critères Spécifiques par Spécialité**

**Développement :** 

* API complète et documentée   
* Tests coverage \>60%   
* UI responsive et accessible   
* Algorithmes fonctionnels

**Data Science :** 

* PostGIS requêtes fonctionnelles   
* 8+ types de graphiques   
* ML avec métriques (RMSE, R²)   
* ETL documenté

**Cyber-Réseaux :** 

* Architecture multi-zones opérationnelle   
* Dashboards monitoring   
* Règles IDS custom   
* Documentation sécurité complète

---

## **XIV. ANNEXES**

### **Annexe A : Glossaire Technique**

| Terme | Définition |
| :---- | :---- |
| **IoT** | Internet of Things \- Objets connectés communicants |
| **MQTT** | Message Queuing Telemetry Transport \- Protocole IoT léger |
| **PostGIS** | Extension PostgreSQL pour données géographiques |
| **TSP** | Travelling Salesman Problem \- Problème d’optimisation |
| **2-opt** | Algorithme amélioration itinéraires |
| **JWT** | JSON Web Token \- Standard authentification |
| **RBAC** | Role-Based Access Control \- Contrôle accès par rôles |
| **Star Schema** | Modèle Data Warehouse (faits \+ dimensions) |
| **SCD Type 2** | Slowly Changing Dimension \- Historisation |
| **ETL** | Extract, Transform, Load \- Pipeline données |
| **ELT** | Extract, Load, Transform \- Pipeline moderne |
| **dbt** | Data Build Tool \- Transformation SQL |
| **Airflow** | Orchestrateur de workflows |
| **Kafka** | Plateforme streaming distribué |
| **IDS/IPS** | Intrusion Detection/Prevention System |
| **SIEM** | Security Information and Event Management |
| **WAF** | Web Application Firewall |
| **HA** | High Availability \- Haute disponibilité |
| **VIP** | Virtual IP \- IP flottante failover |
| **PSSI** | Politique de Sécurité du SI |
| **PCA** | Plan de Continuité d’Activité |

### **Annexe B : Références RNCP**

**RNCP EADL 38822 \- Blocs de compétences :** 

-  A1 : Analyser les besoins et concevoir des solutions   
-  A2 : Concevoir et développer des solutions logicielles   
-  A3 : Administrer et sécuriser les infrastructures   
-  A4 : Piloter des projets numériques

### **Annexe C : Ressources Pédagogiques**

**Documentation officielle :** 

- PostgreSQL : https://www.postgresql.org/docs/   
- PostGIS : https://postgis.net/docs/ \- React : https://react.dev/   
- Vue : https://vuejs.org/ \- FastAPI : https://fastapi.tiangolo.com/   
- Suricata : https://docs.suricata.io/

---

**Document réalisé dans le cadre du projet fil rouge INGETIS-ITIS**  
**© 2026 \- Usage pédagogique uniquement**