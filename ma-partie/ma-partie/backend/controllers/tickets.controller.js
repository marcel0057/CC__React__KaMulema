const pool = require('../config/db');
const { serverError } = require('./_helpers');

const parseQrPayload = (ticket, livraison) =>
  JSON.stringify({
    numero_ticket: ticket.numero_ticket,
    livraison_id: livraison.id,
    produit: livraison.produit_nom,
    vendeur_id: livraison.vendeur_id,
    acheteur_id: livraison.acheteur_id,
    montant: livraison.montant_total,
    date_generation: new Date().toISOString()
  });

const updateTransporteurRating = async (transporteurId) => {
  const [[rows]] = await pool.query(
    `SELECT ROUND(AVG(note), 2) AS moyenne, COUNT(*) AS total
     FROM avis
     WHERE type_cible = 'transporteur' AND cible_id = ?`,
    [transporteurId]
  );

  await pool.query(
    'UPDATE transporteurs SET note_moyenne = ?, nb_livraisons = ? WHERE id = ?',
    [rows.moyenne || 0, rows.total || 0, transporteurId]
  );
};

const updateVendeurRating = async (vendeurId) => {
  // La note vendeur est calculée dynamiquement via la table `avis` dans getProduits.
  // Cette fonction vérifie simplement que l'avis a bien été inséré.
  const [[rows]] = await pool.query(
    `SELECT ROUND(AVG(note), 2) AS moyenne, COUNT(*) AS total
     FROM avis
     WHERE type_cible = 'vendeur' AND cible_id = ?`,
    [vendeurId]
  );
  return rows; // Retourne les stats pour un éventuel usage futur
};

exports.generateTicket = async (req, res) => {
  try {
    const { livraison_id } = req.body;
    if (!livraison_id) {
      return res.status(400).json({ message: 'Veuillez selectionner une livraison.' });
    }

    const [deliveryRows] = await pool.query(
      `SELECT l.*, p.nom AS produit_nom
       FROM livraisons l
       INNER JOIN produits p ON p.id = l.produit_id
       WHERE l.id = ? LIMIT 1`,
      [livraison_id]
    );

    if (!deliveryRows.length) {
      return res.status(404).json({ message: 'Livraison introuvable.' });
    }

    const livraison = deliveryRows[0];
    const allowed = [livraison.vendeur_id, livraison.acheteur_id].includes(req.user.id) || req.user.role === 'admin';
    if (!allowed) {
      const [transporteurs] = await pool.query('SELECT id FROM transporteurs WHERE user_id = ? LIMIT 1', [req.user.id]);
      if (!transporteurs.length || transporteurs[0].id !== livraison.transporteur_id) {
        return res.status(403).json({ message: 'Vous ne pouvez pas generer ce ticket.' });
      }
    }

    const [existingRows] = await pool.query('SELECT * FROM tickets WHERE livraison_id = ? LIMIT 1', [livraison_id]);
    if (existingRows.length) {
      return res.json({ message: 'Ticket existant retourne.', ticket: existingRows[0] });
    }

    const ticket = {
      numero_ticket: `AGRO-${livraison_id}-${Date.now().toString().slice(-6)}`
    };
    const qrData = parseQrPayload(ticket, livraison);

    const [result] = await pool.query(
      `INSERT INTO tickets (livraison_id, numero_ticket, qr_data, statut)
       VALUES (?, ?, ?, 'genere')`,
      [livraison_id, ticket.numero_ticket, qrData]
    );

    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ? LIMIT 1', [result.insertId]);

    return res.status(201).json({
      message: 'Ticket QR genere avec succes.',
      ticket: rows[0]
    });
  } catch (error) {
    return serverError(res, error, 'Impossible de generer le ticket.');
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    let clause = 'l.acheteur_id = ?';
    let params = [req.user.id];

    if (req.user.role === 'agriculteur') {
      clause = 'l.vendeur_id = ?';
    }

    if (req.user.role === 'transporteur') {
      const [transporteurs] = await pool.query('SELECT id FROM transporteurs WHERE user_id = ? LIMIT 1', [req.user.id]);
      if (!transporteurs.length) {
        return res.json({ tickets: [] });
      }
      clause = 'l.transporteur_id = ?';
      params = [transporteurs[0].id];
    }

    if (req.user.role === 'admin') {
      clause = '1 = 1';
      params = [];
    }

    const [rows] = await pool.query(
      `SELECT
         t.*,
         l.statut AS livraison_statut,
         l.montant_total,
         p.nom AS produit_nom
       FROM tickets t
       INNER JOIN livraisons l ON l.id = t.livraison_id
       INNER JOIN produits p ON p.id = l.produit_id
       WHERE ${clause}
       ORDER BY t.date_generation DESC`,
      params
    );

    return res.json({ tickets: rows });
  } catch (error) {
    return serverError(res, error, 'Impossible de charger vos tickets.');
  }
};

exports.scanTicket = async (req, res) => {
  try {
    const { statut } = req.body;
    const [rows] = await pool.query(
      `SELECT
         t.*,
         l.acheteur_id,
         l.vendeur_id,
         l.transporteur_id,
         l.statut AS livraison_statut
       FROM tickets t
       INNER JOIN livraisons l ON l.id = t.livraison_id
       WHERE t.numero_ticket = ? LIMIT 1`,
      [req.params.numero]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Ticket introuvable.' });
    }

    const ticket = rows[0];
    if (req.user.role !== 'admin' && req.user.id !== ticket.acheteur_id) {
      return res.status(403).json({ message: 'Vous ne pouvez pas scanner ce ticket.' });
    }

    if (statut === 'probleme') {
      await pool.query(
        "UPDATE tickets SET statut = 'probleme', date_scan = NOW() WHERE id = ?",
        [ticket.id]
      );
      await pool.query(
        "UPDATE livraisons SET statut = 'probleme' WHERE id = ?",
        [ticket.livraison_id]
      );
      return res.json({ message: 'Probleme signale sur la livraison.' });
    }

    if (ticket.statut === 'confirme') {
      return res.json({ message: 'Cette livraison a deja ete confirmee.', points_ajoutes: 0 });
    }

    const [[buyer]] = await pool.query('SELECT points_fidelite, anciennete_mois FROM users WHERE id = ? LIMIT 1', [ticket.acheteur_id]);
    const bonus = Number(buyer?.anciennete_mois || 0) > 12 ? 100 : 0;
    const pointsAjoutes = 50 + bonus;

    await pool.query(
      "UPDATE tickets SET statut = 'confirme', date_scan = NOW() WHERE id = ?",
      [ticket.id]
    );
    await pool.query(
      "UPDATE livraisons SET statut = 'livre', date_livraison_reelle = NOW() WHERE id = ?",
      [ticket.livraison_id]
    );
    await pool.query(
      'UPDATE users SET points_fidelite = points_fidelite + ? WHERE id = ?',
      [pointsAjoutes, ticket.acheteur_id]
    );

    return res.json({
      message: `Livraison confirmee ! +${pointsAjoutes} points ajoutes a votre compte.`,
      points_ajoutes: pointsAjoutes
    });
  } catch (error) {
    return serverError(res, error, 'Impossible de confirmer cette livraison.');
  }
};

exports.submitNotation = async (req, res) => {
  try {
    const { note_produit, note_transporteur, note_vendeur, commentaire } = req.body;
    const [rows] = await pool.query(
      `SELECT
         t.*,
         l.id AS livraison_id,
         l.acheteur_id,
         l.vendeur_id,
         l.transporteur_id,
         l.statut AS livraison_statut
       FROM tickets t
       INNER JOIN livraisons l ON l.id = t.livraison_id
       WHERE t.id = ? LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Ticket introuvable.' });
    }

    const ticket = rows[0];
    if (req.user.role !== 'admin' && req.user.id !== ticket.acheteur_id) {
      return res.status(403).json({ message: 'Vous ne pouvez pas noter cette livraison.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM notations_livraison WHERE ticket_id = ? LIMIT 1',
      [ticket.id]
    );
    if (existing.length) {
      return res.status(409).json({ message: 'Cette livraison a deja ete notee.' });
    }

    await pool.query(
      `INSERT INTO notations_livraison
        (ticket_id, livraison_id, client_id, note_produit, note_transporteur, note_vendeur, commentaire)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket.id,
        ticket.livraison_id,
        req.user.id,
        Number(note_produit || 0),
        Number(note_transporteur || 0),
        Number(note_vendeur || 0),
        commentaire || null
      ]
    );

    if (Number(note_transporteur)) {
      await pool.query(
        `INSERT INTO avis (auteur_id, cible_id, type_cible, note, commentaire)
         VALUES (?, ?, 'transporteur', ?, ?)`,
        [req.user.id, ticket.transporteur_id, Number(note_transporteur), commentaire || null]
      );
      await updateTransporteurRating(ticket.transporteur_id);
    }

    if (Number(note_vendeur)) {
      await pool.query(
        `INSERT INTO avis (auteur_id, cible_id, type_cible, note, commentaire)
         VALUES (?, ?, 'vendeur', ?, ?)`,
        [req.user.id, ticket.vendeur_id, Number(note_vendeur), commentaire || null]
      );
      await updateVendeurRating(ticket.vendeur_id);
    }

    return res.json({ message: 'Notation enregistree avec succes.' });
  } catch (error) {
    return serverError(res, error, 'Impossible denregistrer la notation.');
  }
};

exports.getTicketByNumero = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         t.*,
         l.acheteur_id,
         l.vendeur_id,
         l.transporteur_id,
         l.montant_total,
         p.nom AS produit_nom
       FROM tickets t
       INNER JOIN livraisons l ON l.id = t.livraison_id
       INNER JOIN produits p ON p.id = l.produit_id
       WHERE t.numero_ticket = ? LIMIT 1`,
      [req.params.numero]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Ticket introuvable.' });
    }

    const ticket = rows[0];
    const allowed = req.user.role === 'admin' || [ticket.acheteur_id, ticket.vendeur_id].includes(req.user.id);
    if (!allowed && req.user.role === 'transporteur') {
      const [transporteurs] = await pool.query('SELECT id FROM transporteurs WHERE user_id = ? LIMIT 1', [req.user.id]);
      if (!transporteurs.length || transporteurs[0].id !== ticket.transporteur_id) {
        return res.status(403).json({ message: 'Acces refuse a ce ticket.' });
      }
    } else if (!allowed && req.user.role !== 'transporteur') {
      return res.status(403).json({ message: 'Acces refuse a ce ticket.' });
    }

    return res.json({
      ticket: {
        ...ticket,
        qr_data: (() => {
          try {
            return JSON.parse(ticket.qr_data);
          } catch (error) {
            return ticket.qr_data;
          }
        })()
      }
    });
  } catch (error) {
    return serverError(res, error, 'Impossible de charger ce ticket.');
  }
};
