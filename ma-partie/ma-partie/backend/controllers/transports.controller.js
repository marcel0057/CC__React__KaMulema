const pool = require('../config/db');
const {
  calculateDistanceKm,
  formatDuration,
  serverError,
  toNullableNumber
} = require('./_helpers');

const hydrateLivraison = (livraison) => ({
  ...livraison,
  distance_km: livraison.distance_km !== null ? Number(livraison.distance_km) : null,
  duree_estimee_heures:
    livraison.duree_estimee_heures !== null ? Number(livraison.duree_estimee_heures) : null,
  montant_total: livraison.montant_total !== null ? Number(livraison.montant_total) : null,
  duree_formatee:
    livraison.duree_estimee_heures !== null ? formatDuration(livraison.duree_estimee_heures) : null
});

exports.getTransporteurs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         t.*,
         u.nom,
         u.prenom,
         u.region,
         u.ville,
         u.telephone
       FROM transporteurs t
       INNER JOIN users u ON u.id = t.user_id
       ORDER BY t.disponible DESC, t.note_moyenne DESC, t.nb_livraisons DESC`
    );

    return res.json({ transporteurs: rows });
  } catch (error) {
    return serverError(res, error, 'Impossible de charger les transporteurs.');
  }
};

exports.createLivraison = async (req, res) => {
  try {
    const {
      produit_id,
      transporteur_id,
      adresse_depart,
      adresse_destination,
      lat_depart,
      lng_depart,
      lat_destination,
      lng_destination,
      date_souhaitee
    } = req.body;

    if (!produit_id || !transporteur_id || !adresse_depart || !adresse_destination) {
      return res.status(400).json({ message: 'Produit, transporteur et adresses sont obligatoires.' });
    }

    const [produitRows] = await pool.query('SELECT * FROM produits WHERE id = ? LIMIT 1', [produit_id]);
    const [transporteurRows] = await pool.query('SELECT * FROM transporteurs WHERE id = ? LIMIT 1', [transporteur_id]);

    if (!produitRows.length) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }
    if (!transporteurRows.length) {
      return res.status(404).json({ message: 'Transporteur introuvable.' });
    }

    const produit = produitRows[0];
    const transporteur = transporteurRows[0];
    const depLat = toNullableNumber(lat_depart) ?? Number(transporteur.latitude || 3.848);
    const depLng = toNullableNumber(lng_depart) ?? Number(transporteur.longitude || 11.502);
    const destLat = toNullableNumber(lat_destination) ?? depLat + 0.12;
    const destLng = toNullableNumber(lng_destination) ?? depLng + 0.08;

    const distanceKm = Number(calculateDistanceKm(depLat, depLng, destLat, destLng).toFixed(2));
    const vitesse = distanceKm <= 60 ? 60 : 80;
    const dureeHeures = Number((distanceKm / vitesse).toFixed(2));
    const coutTransport = Number((distanceKm * Number(transporteur.tarif_km || 0)).toFixed(2));

    const [result] = await pool.query(
      `INSERT INTO livraisons
        (produit_id, vendeur_id, acheteur_id, transporteur_id, adresse_depart, adresse_destination,
         lat_depart, lng_depart, lat_destination, lng_destination, distance_km, duree_estimee_heures,
         statut, montant_total, date_livraison_prevue)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente', ?, ?)`,
      [
        produit.id,
        produit.vendeur_id,
        req.user.id,
        transporteur.id,
        adresse_depart,
        adresse_destination,
        depLat,
        depLng,
        destLat,
        destLng,
        distanceKm,
        dureeHeures,
        coutTransport,
        date_souhaitee || null
      ]
    );

    const [rows] = await pool.query('SELECT * FROM livraisons WHERE id = ? LIMIT 1', [result.insertId]);

    return res.status(201).json({
      message: 'Demande de livraison creee avec succes.',
      livraison: hydrateLivraison(rows[0]),
      estimation: {
        distance_km: distanceKm,
        duree_estimee_heures: dureeHeures,
        duree_formatee: formatDuration(dureeHeures),
        cout_estime: coutTransport
      }
    });
  } catch (error) {
    return serverError(res, error, 'Impossible de creer la livraison.');
  }
};

exports.getMyLivraisons = async (req, res) => {
  try {
    let clause = 'l.acheteur_id = ?';
    let params = [req.user.id];

    if (req.user.role === 'agriculteur') {
      clause = 'l.vendeur_id = ?';
    }

    if (req.user.role === 'transporteur') {
      const [transporteurs] = await pool.query('SELECT id FROM transporteurs WHERE user_id = ? LIMIT 1', [req.user.id]);
      if (!transporteurs.length) {
        return res.json({ livraisons: [] });
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
         l.*,
         p.nom AS produit_nom,
         vendeur.nom AS vendeur_nom,
         vendeur.prenom AS vendeur_prenom,
         acheteur.nom AS acheteur_nom,
         acheteur.prenom AS acheteur_prenom,
         tu.nom AS transporteur_nom,
         tu.prenom AS transporteur_prenom
       FROM livraisons l
       INNER JOIN produits p ON p.id = l.produit_id
       INNER JOIN users vendeur ON vendeur.id = l.vendeur_id
       INNER JOIN users acheteur ON acheteur.id = l.acheteur_id
       LEFT JOIN transporteurs t ON t.id = l.transporteur_id
       LEFT JOIN users tu ON tu.id = t.user_id
       WHERE ${clause}
       ORDER BY l.date_demande DESC`,
      params
    );

    return res.json({ livraisons: rows.map(hydrateLivraison) });
  } catch (error) {
    return serverError(res, error, 'Impossible de charger vos livraisons.');
  }
};

exports.updateLivraisonStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    const validStatuts = ['en_attente', 'confirme', 'en_route', 'livre', 'probleme'];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({ message: 'Statut de livraison invalide.' });
    }

    const [rows] = await pool.query('SELECT * FROM livraisons WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Livraison introuvable.' });
    }

    const livraison = rows[0];
    if (req.user.role === 'transporteur') {
      const [transporteurs] = await pool.query('SELECT id FROM transporteurs WHERE user_id = ? LIMIT 1', [req.user.id]);
      if (!transporteurs.length || transporteurs[0].id !== livraison.transporteur_id) {
        return res.status(403).json({ message: 'Vous ne pouvez pas modifier cette livraison.' });
      }
    }

    await pool.query(
      `UPDATE livraisons
       SET statut = ?, date_livraison_reelle = CASE WHEN ? = 'livre' THEN NOW() ELSE date_livraison_reelle END
       WHERE id = ?`,
      [statut, statut, livraison.id]
    );

    return res.json({ message: 'Statut de la livraison mis a jour.' });
  } catch (error) {
    return serverError(res, error, 'Impossible de mettre a jour cette livraison.');
  }
};

exports.getLivraisonById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         l.*,
         p.nom AS produit_nom,
         t.nom_entreprise,
         t.type_vehicule,
         t.tarif_km
       FROM livraisons l
       INNER JOIN produits p ON p.id = l.produit_id
       LEFT JOIN transporteurs t ON t.id = l.transporteur_id
       WHERE l.id = ? LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Livraison introuvable.' });
    }

    const livraison = rows[0];
    const allowed =
      req.user.role === 'admin' ||
      req.user.id === livraison.vendeur_id ||
      req.user.id === livraison.acheteur_id;

    if (!allowed && req.user.role === 'transporteur') {
      const [transporteurs] = await pool.query('SELECT id FROM transporteurs WHERE user_id = ? LIMIT 1', [req.user.id]);
      if (!transporteurs.length || transporteurs[0].id !== livraison.transporteur_id) {
        return res.status(403).json({ message: 'Acces refuse a cette livraison.' });
      }
    } else if (!allowed && req.user.role !== 'transporteur') {
      return res.status(403).json({ message: 'Acces refuse a cette livraison.' });
    }

    return res.json({
      livraison: hydrateLivraison(livraison),
      estimation: {
        distance_km: Number(livraison.distance_km || 0),
        duree_estimee_heures: Number(livraison.duree_estimee_heures || 0),
        duree_formatee: formatDuration(livraison.duree_estimee_heures || 0)
      }
    });
  } catch (error) {
    return serverError(res, error, 'Impossible de charger cette livraison.');
  }
};

exports.noterTransporteur = async (req, res) => {
  try {
    const { note, commentaire } = req.body;
    const numericNote = Number(note);
    if (!numericNote || numericNote < 1 || numericNote > 5) {
      return res.status(400).json({ message: 'La note doit etre comprise entre 1 et 5.' });
    }

    const [rows] = await pool.query('SELECT * FROM livraisons WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Livraison introuvable.' });
    }

    const livraison = rows[0];
    if (req.user.id !== livraison.acheteur_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous ne pouvez pas noter ce transporteur.' });
    }

    await pool.query(
      `INSERT INTO avis (auteur_id, cible_id, type_cible, note, commentaire)
       VALUES (?, ?, 'transporteur', ?, ?)`,
      [req.user.id, livraison.transporteur_id, numericNote, commentaire || null]
    );

    const [[ratings]] = await pool.query(
      `SELECT ROUND(AVG(note), 2) AS moyenne, COUNT(*) AS total
       FROM avis
       WHERE type_cible = 'transporteur' AND cible_id = ?`,
      [livraison.transporteur_id]
    );

    await pool.query(
      `UPDATE transporteurs
       SET note_moyenne = ?, nb_livraisons = GREATEST(nb_livraisons, ?)
       WHERE id = ?`,
      [ratings.moyenne || 0, ratings.total || 0, livraison.transporteur_id]
    );

    return res.json({
      message: 'Transporteur note avec succes.',
      note_moyenne: ratings.moyenne || 0,
      nb_avis: ratings.total || 0
    });
  } catch (error) {
    return serverError(res, error, 'Impossible de noter le transporteur.');
  }
};
