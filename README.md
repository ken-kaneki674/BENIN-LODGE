# BENIN LODGE - Système de Gestion des Réservations

**BENIN LODGE** est une application web moderne de gestion hôtelière conçue pour faciliter l'administration des réservations, le suivi des clients et l'analyse des performances pour plusieurs établissements hôteliers au Bénin.

## 🌟 Fonctionnalités Principales

### 🏨 Gestion des Réservations

* **Tableau de Bord Intuitif** : Vue d'ensemble des réservations avec indicateurs clés (Total, Confirmées, En attente, Revenus).
* **Suivi en Temps Réel** : Liste détaillée des réservations avec statuts (Confirmée, En attente, Annulée).
* **Actions Rapides** : Possibilité de confirmer, voir les détails, modifier ou annuler une réservation en un clic.
* **Filtres Avancés** : Recherche (avec surlignage des résultats) et filtrage par statut, hôtel ou plage de dates, combinables entre eux.
* **Pagination** : 10 réservations par page.
* **Formulaire Complet** : Ajout et modification de réservations avec calcul automatique du coût en fonction du type de chambre et de la durée, et validation des champs (email, téléphone, date de départ postérieure à l'arrivée).

### 📊 Analyses et Statistiques

* **Graphiques Interactifs** : Visualisation des données via **Chart.js**.
  * Répartition des réservations par statut.
  * Performance par hôtel.
  * Évolution des revenus mensuels.

### 👥 Gestion des Clients

* Base de données clients centralisée.
* Historique des réservations et montant total dépensé par client (réservations confirmées).
* Exportation des données clients en CSV.

### ⚙️ Administration et Outils

* **Système de Notifications** : Alertes pour les nouvelles réservations, modifications, confirmations ou annulations, marquées comme lues à l'ouverture, avec accès direct à la réservation concernée.
* **Thème Dynamique** : Support des modes **Clair** (Light) et **Sombre** (Dark).
* **Paramètres** : Nom, email et téléphone de l'établissement enregistrés localement.
* **Responsive** : Menu latéral repliable sur mobile et tablette (moins de 1024 px).
* **Raccourci clavier** : `Ctrl+K` pour accéder à la recherche.
* **Gestion des Données** :
  * Sauvegarde locale via `localStorage` (les données persistent après fermeture du navigateur).
  * Export/Import complet des données (JSON) pour sauvegarde, avec vérification du fichier importé.
  * Export des réservations en CSV (compatible Excel, accents inclus).

## 🛠️ Technologies Utilisées

* **Frontend** : HTML5, CSS3, JavaScript (ES6+).
* **Framework UI** : Bootstrap 5.3.3 (pour la mise en page et les composants responsifs).
* **Icônes** : Bootstrap Icons.
* **Visualisation de Données** : Chart.js 4.2.1.
* **Persistance** : LocalStorage API (Pas de base de données backend requise pour la démo).

## 🚀 Installation et Utilisation

1. **Cloner ou Télécharger** le projet.
2. Assurez-vous d'avoir une connexion internet (pour charger les ressources CDN comme Bootstrap et Chart.js).
3. **Ouvrir** le fichier `index.html` dans n'importe quel navigateur web moderne, ou le servir localement :

   ```bash
   python -m http.server 8765
   ```

   puis ouvrir <http://localhost:8765>.
4. L'application est prête à l'emploi ! Des données de démonstration sont chargées automatiquement au premier lancement.

## 📝 Historique des modifications

### Septembre 2026 — Corrections

* **Navigation** : retour à la page Réservations possible depuis les autres pages ; le bouton **Modifier** fonctionne.
* **Recherche** : ne supprime plus les boutons d'action et accepte les caractères spéciaux.
* **Montants** : calculés à partir du prix et du nombre de nuits (et non plus relus depuis le texte affiché).
* **Sécurité** : toutes les données saisies sont échappées avant affichage (protection contre les failles XSS).
* **Graphique des revenus** : mois et valeurs triés ensemble.
* **Notifications** : contenu dynamique au lieu d'une liste figée.
* **Mobile** : overlay et menu latéral corrigés.
* **Divers** : export CSV échappé, numérotation des réservations fiable, suppression de code mort, Bootstrap mis à jour.

## 🏨 Hôtels Supportés (Démo)

* Golden Tulip Le Diplomate
* Azalaï Hôtel de la Plage
* Auberge de Grand-Popo

---
*Benin Lodge - L'excellence dans la gestion hôtelière.*
