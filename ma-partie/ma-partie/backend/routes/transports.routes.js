const express = require('express');
const router = express.Router();
const controller = require('../controllers/transports.controller');
const { verifierRole, verifierToken } = require('../middleware/auth.middleware');

router.get('/transporteurs', controller.getTransporteurs);
router.post('/demande', verifierToken, controller.createLivraison);
router.get('/mes-livraisons', verifierToken, controller.getMyLivraisons);
router.put('/livraisons/:id/statut', verifierToken, verifierRole('transporteur', 'admin'), controller.updateLivraisonStatut);
router.get('/livraisons/:id', verifierToken, controller.getLivraisonById);
router.post('/livraisons/:id/noter', verifierToken, controller.noterTransporteur);

module.exports = router;
