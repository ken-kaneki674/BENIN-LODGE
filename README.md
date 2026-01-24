# BENIN LODGE - Système de Gestion des Réservations

**BENIN LODGE** est une application web moderne de gestion hôtelière conçue pour faciliter l'administration des réservations, le suivi des clients et l'analyse des performances pour plusieurs établissements hôteliers au Bénin.

## 🌟 Fonctionnalités Principales

### 🏨 Gestion des Réservations

* **Tableau de Bord Intuitif** : Vue d'ensemble des réservations avec indicateurs clés (Total, Confirmées, En attente, Revenus).
* **Suivi en Temps Réel** : Liste détaillée des réservations avec statuts (Confirmée, En attente, Annulée).
* **Actions Rapides** : Possibilité de confirmer, voir les détails ou annuler une réservation en un clic.
* **Filtres Avancés** : Recherche et filtrage par statut, hôtel ou plage de dates.
* **Formulaire Complet** : Ajout de nouvelles réservations avec calcul automatique du coût en fonction du type de chambre et de la durée.

### 📊 Analyses et Statistiques

* **Graphiques Interactifs** : Visualisation des données via **Chart.js**.
  * Répartition des réservations par statut.
  * Performance par hôtel.
  * Évolution des revenus mensuels.

### 👥 Gestion des Clients

* Base de données clients centralisée.
* Historique des réservations et montant total dépensé par client.
* Exportation des données clients en CSV.

### ⚙️ Administration et Outils

* **Système de Notifications** : Alertes pour les nouvelles réservations, paiements ou annulations.
* **Thème Dynamique** : Support des modes **Clair** (Light) et **Sombre** (Dark).
* **Gestion des Données** :
  * Sauvegarde locale via `localStorage` (les données persistent après fermeture du navigateur).
  * Export/Import complet des données (JSON) pour sauvegarde.
  * Export des réservations en CSV.

## 🛠️ Technologies Utilisées

* **Frontend** : HTML5, CSS3, JavaScript (ES6+).
* **Framework UI** : Bootstrap 5.3 (pour la mise en page et les composants responsifs).
* **Icônes** : Bootstrap Icons.
* **Visualisation de Données** : Chart.js 4.2.1.
* **Persistance** : LocalStorage API (Pas de base de données backend requise pour la démo).

## 🚀 Installation et Utilisation

1. **Cloner ou Télécharger** le projet.
2. Assurez-vous d'avoir une connexion internet (pour charger les ressources CDN comme Bootstrap et Chart.js).
3. **Ouvrir** le fichier `index.html` dans n'importe quel navigateur web moderne.
4. L'application est prête à l'emploi ! Des données de démonstration sont chargées automatiquement au premier lancement.

## 🏨 Hôtels Supportés (Démo)

* Golden Tulip Le Diplomate
* Azalaï Hôtel de la Plage
* Auberge de Grand-Popo

---
*Benin Lodge - L'excellence dans la gestion hôtelière.*
