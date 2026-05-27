# Contrat API - diagnostic IA des maladies des plantes

Le front React ne simule pas de diagnostic. Il envoie les donnees au backend local `/api/plant-diagnosis/analyze`.
Ce backend appelle Plant.id avec la cle secrete `PLANT_ID_API_KEY`.

## Configuration Plant.id

Creer un fichier `.env` a la racine du projet :

```env
PLANT_ID_API_KEY=votre_cle_plant_id
PORT=3001
VITE_AI_DIAGNOSIS_API_URL=/api/plant-diagnosis/analyze
```

La cle Plant.id ne doit jamais etre placee directement dans un composant React.

## Lancement en developpement

Terminal 1 :

```bash
npm run server
```

Terminal 2 :

```bash
npm run dev
```

## Requete

`POST /api/plant-diagnosis/analyze`

Type : `multipart/form-data`

Champs attendus :

- `plantPhotos` : une ou plusieurs images de la plante infectee.
- `farmerId` : identifiant de l'agriculteur.
- `cropName` : culture concernee.
- `location` : zone geographique.
- `symptomDescription` : description texte ou transcription vocale.
- `affectedPart` : feuilles, tige, fruit, racine ou plante entiere.
- `plantAge` : age approximatif de la plante.

## Reponse retournee au front

```json
{
  "id": "AN-2026-0001",
  "analyzedAt": "2026-05-20T10:30:00.000Z",
  "diseaseName": "Mildiou de la tomate",
  "scientificName": "Phytophthora infestans",
  "confidence": 86,
  "severity": "Elevee",
  "nationalStatus": "listed",
  "statusMessage": "Maladie connue et repertoriee dans la base phytosanitaire utilisee.",
  "cropName": "Tomate",
  "causes": [
    "Humidite elevee et arrosage excessif",
    "Propagation par spores en presence de feuilles mouillees"
  ],
  "observedSymptoms": [
    "Taches jaunes ou brunes sur les feuilles",
    "Moisissure blanchatre sous les feuilles",
    "Fletrissement progressif"
  ],
  "likelyProgression": [
    "Propagation rapide aux feuilles voisines",
    "Baisse du rendement",
    "Pourriture possible des fruits"
  ],
  "urgentActions": [
    "Isoler les plants fortement touches",
    "Retirer les feuilles infectees",
    "Eviter l'arrosage sur le feuillage"
  ],
  "treatmentSteps": [
    "Confirmer le diagnostic avec un agronome si la confiance est inferieure a 80%",
    "Appliquer un traitement homologue selon les recommandations locales",
    "Surveiller l'evolution pendant 7 jours"
  ],
  "preventionSteps": [
    "Espacer les plants pour ameliorer l'aeration",
    "Eviter l'exces d'humidite",
    "Utiliser des semences saines"
  ],
  "recommendedProducts": [
    "Produit phytosanitaire homologue par l'autorite nationale",
    "Traitement cuivre si autorise pour la culture concernee"
  ],
  "needsExpertReview": false,
  "sources": [
    {
      "title": "EPPO Global Database",
      "url": "https://gd.eppo.int/"
    }
  ]
}
```

## Maladie non reconnue ou non repertoriee

Si l'IA n'est pas sure ou si la maladie n'existe pas dans la base nationale, l'API doit retourner :

```json
{
  "diseaseName": "Maladie non identifiee",
  "confidence": 42,
  "severity": "A confirmer",
  "nationalStatus": "unlisted",
  "statusMessage": "Cette maladie ne correspond pas clairement aux maladies repertoriees. Le cas doit etre transmis a un ingenieur agronome.",
  "needsExpertReview": true,
  "causes": [],
  "observedSymptoms": [],
  "likelyProgression": [],
  "urgentActions": [
    "Isoler la plante ou la parcelle touchee",
    "Prendre plusieurs photos nettes",
    "Contacter un agronome pour validation"
  ],
  "treatmentSteps": [],
  "preventionSteps": [],
  "recommendedProducts": [],
  "sources": []
}
```
