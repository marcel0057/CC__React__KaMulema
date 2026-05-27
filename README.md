# KA MOLEMA

KA MOLEMA est une plateforme agricole intelligente construite avec **React** pour l'interface et **Spring Boot** pour le backend. Elle accompagne les agriculteurs dans le diagnostic des maladies des plantes, la mise en relation avec les agronomes, la certification, le marché agricole, le transport, les conseils de semis et les tickets QR.

## Technologies

- **Frontend** : React + Vite
- **Backend principal** : Spring Boot + Java 17
- **API IA** : Plant.id API
- **Email** : Spring Mail avec SMTP Gmail
- **Stockage actuel** : données en mémoire côté Spring Boot pour la démonstration

Le dossier `server/` contient l'ancien backend Node.js. Il est conservé comme ancienne version, mais le backend officiel du projet est maintenant `spring-backend/`.

## Prérequis

Chaque membre du groupe doit installer :

- Node.js
- npm
- Java JDK 17 ou plus récent
- Maven, si aucun wrapper Maven n'est disponible sur son poste
- Un navigateur moderne : Edge, Chrome ou Firefox

Vérification :

```powershell
node --version
npm.cmd --version
java -version
mvn -version
```

Si PowerShell refuse `npm`, utilisez toujours `npm.cmd`.

## Installation

Ouvrir PowerShell dans le dossier du projet :

```powershell
cd "C:\Users\auror\OneDrive\Documents\Ka Molema"
```

Installer les dépendances React :

```powershell
npm.cmd install
```

Compiler le backend Spring Boot :

```powershell
cd "C:\Users\auror\OneDrive\Documents\Ka Molema\spring-backend"
mvn -DskipTests package
```

Revenir à la racine :

```powershell
cd "C:\Users\auror\OneDrive\Documents\Ka Molema"
```

## Configuration `.env`

Créer un fichier `.env` à la racine du projet :

```powershell
cd "C:\Users\auror\OneDrive\Documents\Ka Molema"
notepad ".env"
```

Contenu attendu :

```env
PLANT_ID_API_KEY=votre_vraie_cle_plant_id
PORT=3001
VITE_AI_DIAGNOSIS_API_URL=/api/plant-diagnosis/analyze
MAIL_USERNAME=votre_adresse_gmail
MAIL_PASSWORD=votre_mot_de_passe_application_gmail
MAIL_FROM=votre_adresse_expediteur
```

Important :

- Ne mettez pas d'espace autour du signe `=`.
- Ne collez pas `PORT=3001` sur la même ligne que la clé Plant.id.
- Ne partagez jamais la vraie clé Plant.id publiquement.
- Ne partagez jamais le mot de passe d'application Gmail publiquement.
- Le fichier `.env` ne doit pas être envoyé sur GitHub.

Pour Gmail, `MAIL_PASSWORD` doit être un **mot de passe d'application**, pas le mot de passe normal du compte.

## Lancement du projet

L'application utilise deux serveurs :

- `localhost:3001` : backend Spring Boot
- `localhost:5173` ou `localhost:5174` : frontend React

### Terminal 1 : backend Spring Boot

```powershell
cd "C:\Users\auror\OneDrive\Documents\Ka Molema"
npm.cmd run server
```

Ou directement :

```powershell
.\start-server.ps1
```

Résultat attendu :

```txt
Started KaMolemaBackendApplication
Tomcat started on port 3001
```

Si le port `3001` est déjà occupé par l'ancien serveur Node.js, arrêtez l'ancien terminal avec `Ctrl + C`, puis relancez `npm.cmd run server`.

Test rapide du backend :

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

### Terminal 2 : frontend React

```powershell
cd "C:\Users\auror\OneDrive\Documents\Ka Molema"
npm.cmd run dev
```

Ouvrir ensuite l'adresse affichée :

```txt
http://localhost:5173
```

Si Vite dit que le port 5173 est déjà utilisé, il proposera souvent :

```txt
http://localhost:5174
```

## Connexion

La connexion est locale pour la démonstration. Il n'y a pas encore de vraie table utilisateurs.

Exemple :

```txt
Email : vous@example.com
Rôle : Agriculteur
Mot de passe : 123456
```

## Fonctionnalités

### Diagnostic IA des maladies

- Upload de plusieurs photos de plantes infectées.
- Description textuelle des symptômes.
- Dictée vocale si le navigateur supporte la reconnaissance vocale.
- Appel réel à Plant.id via Spring Boot.
- Résultat détaillé : maladie probable, nom scientifique, confiance IA, gravité, causes, symptômes, évolution, actions urgentes, traitements, prévention et sources.
- Historique local des analyses.

Route backend :

```txt
POST /api/plant-diagnosis/analyze
```

### Agronomes

- Liste des ingénieurs agronomes depuis Spring Boot.
- Filtres par région, ville, zone d'intervention et expérience.
- Affichage du téléphone et de l'adresse email.
- Contact direct.
- Demande de rendez-vous distincte du simple contact.
- Envoi réel de mail si les variables SMTP sont configurées.

Routes backend :

```txt
GET  /api/agronomes
POST /api/agronomes/contact
```

### Certification

- Liste des agriculteurs certifiés ou en attente.
- Scores d'évaluation.
- Niveaux Bronze, Argent et Or.
- Formulaire de demande d'évaluation.
- Page statistiques et historique.
- Enregistrement de la demande côté Spring Boot pendant l'exécution.

Routes backend :

```txt
GET  /api/certifications
POST /api/certifications
```

### Marché

- Catalogue de produits agricoles.
- Recherche par produit, vendeur ou ville.
- Filtres par région, catégorie et certification.
- Demande client avec quantité, téléphone, mode de livraison et total estimé.
- Priorité fidélité quand elle est disponible.

Routes backend :

```txt
GET  /api/products
POST /api/market/requests
```

### Transport

- Liste des livraisons.
- Transporteur, départ, destination, distance, coût et temps estimé.
- Progression de la livraison.
- Vue de suivi simplifiée.

Route backend :

```txt
GET /api/transports/deliveries
```

### Conseil sol

- Paramètres du terrain : sol, localisation, altitude, pente, humidité.
- Recommandations de cultures adaptées.
- Score de compatibilité et saison conseillée.

Route backend :

```txt
GET /api/soil/recommendations
```

### Tickets QR

- Génération de tickets de livraison.
- QR visuel pour la démonstration.
- Historique des tickets depuis Spring Boot.
- Notation après réception.

Routes backend :

```txt
GET  /api/tickets
POST /api/tickets
```

## Structure du projet

```txt
Ka Molema/
  src/
    App.jsx
    main.jsx
    styles.css
    components/
      disease/
    pages/
      Agronomes/
      Certification/
      DiseaseAnalysis/
      Marketplace/
      SoilAdvisor/
      Tickets/
      Transport/
    services/
      diagnosisApi.js
      platformApi.js
    data/
      platformData.js
    utils/

  spring-backend/
    pom.xml
    src/main/resources/application.properties
    src/main/java/cm/kamolema/
      KaMolemaBackendApplication.java
      config/
      common/
      data/
      modules/
        agronomes/
        certifications/
        common/
        catalog/
        diagnosis/
        mail/
        market/
        soil/
        tickets/
        transport/

  server/
    index.mjs

  start-server.ps1
  package.json
  vite.config.js
  .env.example
```

## Explication du code

### `src/App.jsx`

Fichier principal React. Il gère :

- la page d'authentification ;
- la session locale ;
- la sidebar ;
- la navigation entre les modules ;
- l'affichage de la page active.

### `src/services/diagnosisApi.js`

Prépare le `FormData` du diagnostic IA avec les photos et les symptômes, puis appelle :

```txt
/api/plant-diagnosis/analyze
```

La clé Plant.id reste protégée côté backend Spring Boot.

### `src/services/platformApi.js`

Contient les fonctions communes `apiGet` et `apiPost` utilisées par les modules React pour appeler Spring Boot.

### `spring-backend/src/main/java/cm/kamolema/KaMolemaBackendApplication.java`

Point d'entrée du backend Spring Boot.

### `spring-backend/src/main/java/cm/kamolema/config/DotenvLoader.java`

Charge les variables du fichier `.env` de la racine du projet pour que Spring Boot puisse lire :

- `PLANT_ID_API_KEY`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `PORT`

### `spring-backend/src/main/java/cm/kamolema/modules/diagnosis/PlantIdService.java`

Service Java qui appelle Plant.id, lit la réponse et la transforme en résultat détaillé pour React.

### `spring-backend/src/main/java/cm/kamolema/modules/catalog/CatalogController.java`

Expose les routes des modules agronomes, marché, certification, transport, conseil sol et tickets QR.

### `spring-backend/src/main/java/cm/kamolema/modules/mail/MailService.java`

Envoie les vrais emails aux agronomes avec un design HTML KA MOLEMA.

### `spring-backend/src/main/java/cm/kamolema/data/InMemoryStore.java`

Contient les données backend de démonstration. Elles sont réinitialisées quand le serveur redémarre. Pour une version production, ce fichier devra être remplacé par une vraie base de données.

## Commandes utiles

Installer :

```powershell
npm.cmd install
```

Lancer le backend Spring Boot :

```powershell
npm.cmd run server
```

Lancer React :

```powershell
npm.cmd run dev
```

Compiler React :

```powershell
npm.cmd run build
```

Compiler Spring Boot :

```powershell
cd "C:\Users\auror\OneDrive\Documents\Ka Molema\spring-backend"
mvn -DskipTests package
```

## Problèmes fréquents

### `Route API introuvable`

Vous êtes probablement sur :

```txt
http://localhost:3001
```

C'est le backend. Il faut ouvrir l'application React :

```txt
http://localhost:5173
```

### La clé Plant.id n'est pas trouvée

Vérifier `.env`, puis redémarrer le backend :

```powershell
Ctrl + C
npm.cmd run server
```

### Le mail ne part pas

Vérifier :

- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- que `MAIL_PASSWORD` est bien un mot de passe d'application Gmail.

Puis redémarrer le backend.

### La dictée vocale ne fonctionne pas

Utiliser Chrome ou Edge et autoriser le micro pour `localhost`.

## Limites actuelles

Le projet possède maintenant un vrai backend Spring Boot pour tous les modules, mais les données sont encore stockées en mémoire. Cela signifie que les nouvelles demandes disparaissent quand le serveur redémarre.

Pour une version production, il faudra ajouter :

- une base de données MySQL ou PostgreSQL ;
- une vraie authentification côté backend ;
- une génération QR réelle avec bibliothèque dédiée ;
- une carte réelle avec Leaflet ou Google Maps ;
- une persistance serveur de l'historique IA.
