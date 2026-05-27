const pool = require('../config/db');
const { serverError, toBoolean, toNullableNumber } = require('./_helpers');

exports.getAgronomes = async (req, res) => {
  try {
    const { specialite, region, note_min, experience_min, certifie } = req.query;
    const conditions = [`u.role = 'agronome'`, 'u.actif = TRUE'];
    const params = [];

    if (specialite) {
      conditions.push('a.specialite LIKE ?');
      params.push(`%${specialite}%`);
    }

    if (region) {
      conditions.push('(u.region = ? OR u.ville = ?)');
      params.push(region, region);
    }

    if (note_min) {
      conditions.push('a.note_moyenne >= ?');
      params.push(Number(note_min));
    }

    if (experience_min) {
      conditions.push('a.annees_experience >= ?');
      params.push(Number(experience_min));
    }

    if (certifie !== undefined && certifie !== '') {
      conditions.push('a.certifie = ?');
      params.push(toBoolean(certifie));
    }

    const [rows] = await pool.query(
      `SELECT
         a.*,
         u.nom,
         u.prenom,
         u.email,
         u.telephone,
         u.region,
         u.ville,
         u.date_inscription
       FROM agronomes a
       INNER JOIN users u ON u.id = a.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.certifie DESC, a.note_moyenne DESC, a.annees_experience DESC, u.nom ASC`,
      params
    );

    return res.json({ agronomes: rows });
  } catch (error) {
    return serverError(res, error, 'Impossible de charger les agronomes.');
  }
};

exports.suggestAgronomes = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude et longitude requises pour la suggestion.' });
    }

    const currentLat = Number(lat);
    const currentLng = Number(lng);

    const [rows] = await pool.query(
      `SELECT
         a.*,
         u.nom,
         u.prenom,
         u.email,
         u.telephone,
         u.region,
         u.ville,
         u.date_inscription,
         (ST_Distance_Sphere(point(a.longitude, a.latitude), point(?, ?)) / 1000) AS distance_km
       FROM agronomes a
       INNER JOIN users u ON u.id = a.user_id
       WHERE u.role = 'agronome' AND u.actif = TRUE`,
      [currentLng, currentLat]
    );

    // Score calculation: note × 0.4 + proximity × 0.4 + experience × 0.2
    const suggested = rows.map((agronome) => {
      const distance = Number(agronome.distance_km || 0);
      
      // Proximity score (0-10), closer is better. Max distance ~500km gets 0.
      let proxScore = Math.max(0, 10 - (distance / 50)); 
      
      // Note score (0-10) -> note_moyenne is 0-5, so note * 2
      let noteScore = Number(agronome.note_moyenne || 0) * 2;
      
      // Experience score (0-10) -> assume max 20 years
      let expScore = Math.min(10, Number(agronome.annees_experience || 0) / 2);

      const score = (noteScore * 0.4) + (proxScore * 0.4) + (expScore * 0.2);
      
      return {
        ...agronome,
        distance: distance,
        score: score
      };
    }).sort((a, b) => b.score - a.score).slice(0, 10); // top 10

    return res.json({ agronomes: suggested });
  } catch (error) {
    return serverError(res, error, 'Impossible de suggerer des agronomes.');
  }
};

exports.getAgronomeById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         a.*,
         u.nom,
         u.prenom,
         u.email,
         u.telephone,
         u.region,
         u.ville
       FROM agronomes a
       INNER JOIN users u ON u.id = a.user_id
       WHERE a.id = ? LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Agronome introuvable.' });
    }

    const agronome = rows[0];
    const [avis] = await pool.query(
      `SELECT
         av.id,
         av.note,
         av.commentaire,
         av.date_avis,
         u.nom AS auteur_nom,
         u.prenom AS auteur_prenom
       FROM avis av
       INNER JOIN users u ON u.id = av.auteur_id
       WHERE av.type_cible = 'agronome' AND av.cible_id = ?
       ORDER BY av.date_avis DESC`,
      [agronome.id]
    );

    return res.json({ agronome, avis });
  } catch (error) {
    return serverError(res, error, 'Impossible de charger ce profil agronome.');
  }
};

exports.createRendezVous = async (req, res) => {
  try {
    const { agronome_id, agronome_user_id, date_rdv, probleme_decrit } = req.body;
    let finalAgronomeUserId = agronome_user_id || null;

    if (!finalAgronomeUserId && agronome_id) {
      const [agronomeRows] = await pool.query('SELECT user_id FROM agronomes WHERE id = ? LIMIT 1', [agronome_id]);
      finalAgronomeUserId = agronomeRows[0]?.user_id || null;
    }

    if (!finalAgronomeUserId || !date_rdv) {
      return res.status(400).json({ message: 'Veuillez choisir un agronome et une date de rendez-vous.' });
    }

    const [userRows] = await pool.query(
      "SELECT id FROM users WHERE id = ? AND role = 'agronome' LIMIT 1",
      [finalAgronomeUserId]
    );

    if (!userRows.length) {
      return res.status(404).json({ message: 'Agronome introuvable.' });
    }

    const [result] = await pool.query(
      `INSERT INTO rendez_vous
        (agriculteur_id, agronome_id, date_rdv, probleme_decrit, statut)
       VALUES (?, ?, ?, ?, 'en_attente')`,
      [req.user.id, finalAgronomeUserId, date_rdv, probleme_decrit || null]
    );

    return res.status(201).json({
      message: 'Rendez-vous cree avec succes.',
      rendez_vous_id: result.insertId
    });
  } catch (error) {
    return serverError(res, error, 'Impossible de creer le rendez-vous.');
  }
};

exports.getMesRendezVous = async (req, res) => {
  try {
    let clause = 'rv.agriculteur_id = ?';
    if (req.user.role === 'agronome') {
      clause = 'rv.agronome_id = ?';
    } else if (req.user.role === 'admin') {
      clause = '1 = 1';
    }

    const params = req.user.role === 'admin' ? [] : [req.user.id];
    const [rows] = await pool.query(
      `SELECT
         rv.*,
         a.nom AS agriculteur_nom,
         a.prenom AS agriculteur_prenom,
         g.nom AS agronome_nom,
         g.prenom AS agronome_prenom
       FROM rendez_vous rv
       INNER JOIN users a ON a.id = rv.agriculteur_id
       INNER JOIN users g ON g.id = rv.agronome_id
       WHERE ${clause}
       ORDER BY rv.date_rdv ASC`,
      params
    );

    return res.json({ rendez_vous: rows });
  } catch (error) {
    return serverError(res, error, 'Impossible de charger les rendez-vous.');
  }
};

exports.updateRendezVousStatus = async (req, res) => {
  try {
    const { statut } = req.body;
    const allowedStatus = ['en_attente', 'confirme', 'termine', 'annule'];
    if (!allowedStatus.includes(statut)) {
      return res.status(400).json({ message: 'Statut de rendez-vous invalide.' });
    }

    const [rows] = await pool.query('SELECT * FROM rendez_vous WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Rendez-vous introuvable.' });
    }

    const rdv = rows[0];
    const canUpdate =
      req.user.role === 'admin' ||
      req.user.id === rdv.agronome_id ||
      (req.user.id === rdv.agriculteur_id && statut === 'annule');

    if (!canUpdate) {
      return res.status(403).json({ message: 'Vous ne pouvez pas modifier ce rendez-vous.' });
    }

    await pool.query('UPDATE rendez_vous SET statut = ? WHERE id = ?', [statut, rdv.id]);

    return res.json({ message: 'Statut du rendez-vous mis a jour.' });
  } catch (error) {
    return serverError(res, error, 'Impossible de modifier ce rendez-vous.');
  }
};
