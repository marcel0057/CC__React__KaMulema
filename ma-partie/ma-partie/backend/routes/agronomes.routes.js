const express = require('express');
const router = express.Router();
const controller = require('../controllers/agronomes.controller');
const { verifierRole, verifierToken } = require('../middleware/auth.middleware');

router.get('/', controller.getAgronomes);
router.get('/suggest', controller.suggestAgronomes);
router.post('/rendez-vous', verifierToken, verifierRole('agriculteur'), controller.createRendezVous);
router.get('/rendez-vous/mes', verifierToken, controller.getMesRendezVous);
router.put('/rendez-vous/:id', verifierToken, controller.updateRendezVousStatus);
router.get('/:id', controller.getAgronomeById);

module.exports = router;
