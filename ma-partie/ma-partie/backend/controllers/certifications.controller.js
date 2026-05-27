const pool = require('../config/db');
const { serverError } = require('./_helpers');

const deriveNiveau = (criteriaCount) => {
  if (criteriaCount >= 5) {
    return 'platine';
  }
  if (criteriaCount >= 4) {
    return 'or';
  }
  if (criteriaCount >= 3) {
    return 'argent';
  }
  return 'bronze';
};

const computeCertificationSnapshot = async (agriculteurId) => {
  const [[user]] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [agriculteurId]);
  const [[latestCertification]] = await pool.query(
    'SELECT * FROM certifications WHERE agriculteur_id = ? ORDER BY id DESC LIMIT 1',
    [agriculteurId]
  );
  const [[bioCount]] = await pool.query(
    'SELECT COUNT(*) AS total FROM produits WHERE vendeur_id = ? AND bio = TRUE',
    [agriculteurId]
  );
  const [[positiveAvis]] = await pool.query(
    "SELECT COUNT(*) AS total FROM avis WHERE cible_id = ? AND type_cible = 'vendeur' AND note >= 4",
    [agriculteurId]
  );
  const [[agronomeEvaluation]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM rendez_vous rv
     INNER JOIN agronomes a ON a.user_id = rv.agronome_id
     WHERE rv.agriculteur_id = ? AND rv.statut = 'termine' AND a.certifie = TRUE`,
    [agriculteurId]
  );
  const [[bonsCount]] = await pool.query(
    'SELECT COUNT(*) AS total FROM bons_fidelite WHERE user_id = ? AND utilise = FALSE',
    [agriculteurId]
  );

  const criteria = {
    formation_complete: Boolean(latestCertification?.formation_complete),
    anciennete_ok: Number(user?.anciennete_mois || 0) >= 24,
    avis_positifs_ok: Number(positiveAvis?.total || 0) >= 10,
    produits_bio_ok: Number(bioCount?.total || 0) >= 3,
    evaluation_agronome_ok: Number(agronomeEvaluation?.total || 0) >= 1
  };

  const achievedCount = Object.values(criteria).filter(Boolean).length;
  return {
    user,
    latestCertification,
    criteria,
    achievedCount,
    progression: Math.round((achievedCount / 5) * 100),
    niveau_suggere: deriveNiveau(achievedCount),
    nb_avis_positifs: positiveAvis?.total || 0,
    nb_produits_bio: bioCount?.total || 0,
    nb_bons_disponibles: bonsCount?.total || 0
  };
};

exports.getMyCertification = async (req, res) => {
  try {
    const snapshot = await computeCertificationSnapshot(req.user.id);
    const [bons] = await pool.query(
      'SELECT * FROM bons_fidelite WHERE user_id = ? ORDER BY date_attribution DESC',
      [req.user.id]
    );

    return res.json({
      certification: snapshot.latestCertification || {
        niveau: snapshot.niveau_suggere,
        statut: 'aucune_demande'
      },
      progression: snapshot.progression,
      niveau_suggere: snapshot.niveau_suggere,
      criteres: snapshot.criteria,
      points_fidelite: snapshot.user?.points_fidelite || 0,
      nb_avis_positifs: snapshot.nb_avis_positifs,
      nb_produits_bio: snapshot.nb_produits_bio,
      bons_fidelite: bons
    });
  } catch (error) {
    return serverError(res, error, 'Impossible de charger votre certification.');
  }
};

exports.submitDemande = async (req, res) => {
  try {
    const snapshot = await computeCertificationSnapshot(req.user.id);

    if (snapshot.latestCertification?.statut === 'en_attente') {
      return res.status(409).json({ message: 'Une demande est deja en attente pour votre compte.' });
    }

    const [result] = await pool.query(
      `INSERT INTO certifications
        (agriculteur_id, niveau, statut, formation_complete, annees_activite, nb_avis_positifs, produits_bio, evaluation_agronome)
       VALUES (?, ?, 'en_attente', ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        snapshot.niveau_suggere,
        snapshot.criteria.formation_complete,
        snapshot.user?.anciennete_mois || 0,
        snapshot.nb_avis_positifs,
        snapshot.nb_produits_bio >= 3,
        snapshot.criteria.evaluation_agronome_ok
      ]
    );

    return res.status(201).json({
      message: 'Votre demande de certification a ete transmise a ladministration.',
      certification_id: result.insertId
    });
  } catch (error) {
    return serverError(res, error, 'Impossible denvoyer la demande de certification.');
  }
};

exports.getAllCertifications = async (req, res) => {
  try {
    const { niveau, statut, region } = req.query;
    const conditions = ['1 = 1'];
    const params = [];

    if (niveau) {
      conditions.push('c.niveau = ?');
      params.push(niveau);
    }

    if (statut) {
      conditions.push('c.statut = ?');
      params.push(statut);
    }

    if (region) {
      conditions.push('u.region = ?');
      params.push(region);
    }

    const [rows] = await pool.query(
      `SELECT
         c.*,
         u.nom,
         u.prenom,
         u.region,
         u.ville,
         u.points_fidelite,
         u.anciennete_mois
       FROM certifications c
       INNER JOIN users u ON u.id = c.agriculteur_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY
         FIELD(c.statut, 'en_attente', 'approuve', 'rejete'),
         c.date_demande DESC`,
      params
    );

    return res.json({ certifications: rows });
  } catch (error) {
    return serverError(res, error, 'Impossible de charger les certifications.');
  }
};

exports.decideCertification = async (req, res) => {
  try {
    const { statut, commentaire_admin, niveau } = req.body;
    if (!['approuve', 'rejete'].includes(statut)) {
      return res.status(400).json({ message: 'Decision invalide.' });
    }

    const [rows] = await pool.query('SELECT * FROM certifications WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Demande de certification introuvable.' });
    }

    const current = rows[0];
    await pool.query(
      `UPDATE certifications
       SET statut = ?, commentaire_admin = ?, date_decision = NOW(), niveau = ?
       WHERE id = ?`,
      [
        statut,
        commentaire_admin || null,
        niveau || current.niveau,
        current.id
      ]
    );

    return res.json({ message: `Certification ${statut}e avec succes.` });
  } catch (error) {
    return serverError(res, error, 'Impossible de traiter cette demande.');
  }
};

exports.getCertificationStats = async (req, res) => {
  try {
    const [levels] = await pool.query(
      `SELECT niveau AS name, COUNT(*) AS value
       FROM certifications
       GROUP BY niveau`
    );

    const [status] = await pool.query(
      `SELECT statut AS name, COUNT(*) AS value
       FROM certifications
       GROUP BY statut`
    );

    return res.json({ repartition_niveaux: levels, repartition_statuts: status });
  } catch (error) {
    return serverError(res, error, 'Impossible de charger les statistiques de certification.');
  }
};
