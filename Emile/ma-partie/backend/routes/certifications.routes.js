const express = require('express');
const router = express.Router();
const controller = require('../controllers/certifications.controller');
const { verifierRole, verifierToken } = require('../middleware/auth.middleware');

router.get('/ma-certification', verifierToken, verifierRole('agriculteur'), controller.getMyCertification);
router.post('/demande', verifierToken, verifierRole('agriculteur'), controller.submitDemande);
router.get('/toutes', verifierToken, verifierRole('admin'), controller.getAllCertifications);
router.put('/:id/decision', verifierToken, verifierRole('admin'), controller.decideCertification);
router.get('/stats', verifierToken, verifierRole('admin'), controller.getCertificationStats);

module.exports = router;
