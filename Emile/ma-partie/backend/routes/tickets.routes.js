const express = require('express');
const router = express.Router();
const controller = require('../controllers/tickets.controller');
const { verifierRole, verifierToken } = require('../middleware/auth.middleware');

router.post('/generer', verifierToken, controller.generateTicket);
router.get('/mes-tickets', verifierToken, controller.getMyTickets);
router.put('/:numero/scanner', verifierToken, verifierRole('client', 'admin'), controller.scanTicket);
router.post('/:id/notation', verifierToken, controller.submitNotation);
router.get('/:numero', verifierToken, controller.getTicketByNumero);

module.exports = router;
