const pool = require('../config/db');

const ensureColumn = async (tableName, columnName, ddl) => {
  const [rows] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE ?`, [columnName]);
  if (!rows.length) {
    await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${ddl}`);
  }
};

const ensurePanAfricanSchema = async () => {
  await ensureColumn('users', 'pays', "pays VARCHAR(100) NULL DEFAULT 'Cameroun' AFTER ville");
  await ensureColumn(
    'users',
    'langue_preferee',
    "langue_preferee VARCHAR(20) NULL DEFAULT 'fr' AFTER pays"
  );
  await ensureColumn(
    'users',
    'devise_preferee',
    "devise_preferee VARCHAR(10) NULL DEFAULT 'XAF' AFTER langue_preferee"
  );

  await ensureColumn(
    'produits',
    'pays_origine',
    "pays_origine VARCHAR(100) NULL DEFAULT 'Cameroun' AFTER region"
  );
  await ensureColumn(
    'produits',
    'devise',
    "devise VARCHAR(10) NULL DEFAULT 'XAF' AFTER pays_origine"
  );
  await ensureColumn(
    'produits',
    'qualite_grade',
    "qualite_grade VARCHAR(50) NULL DEFAULT 'standard' AFTER devise"
  );
  await ensureColumn(
    'produits',
    'exportable',
    'exportable BOOLEAN NOT NULL DEFAULT FALSE AFTER qualite_grade'
  );

  await ensureColumn(
    'demandes_conseils',
    'pays',
    "pays VARCHAR(100) NULL DEFAULT 'Cameroun' AFTER user_id"
  );
  await ensureColumn(
    'demandes_conseils',
    'objectif',
    "objectif VARCHAR(100) NULL DEFAULT 'Vente locale' AFTER date_semis_prevue"
  );

  await ensureColumn(
    'transporteurs',
    'zones_couvertes',
    'zones_couvertes TEXT NULL AFTER disponible'
  );
  await ensureColumn(
    'transporteurs',
    'transfrontalier',
    'transfrontalier BOOLEAN NOT NULL DEFAULT FALSE AFTER zones_couvertes'
  );
  await ensureColumn(
    'transporteurs',
    'rayon_action_km',
    'rayon_action_km INT NOT NULL DEFAULT 500 AFTER transfrontalier'
  );

  await ensureColumn(
    'livraisons',
    'pays_depart',
    "pays_depart VARCHAR(100) NULL DEFAULT 'Cameroun' AFTER adresse_depart"
  );
  await ensureColumn(
    'livraisons',
    'pays_destination',
    "pays_destination VARCHAR(100) NULL DEFAULT 'Cameroun' AFTER adresse_destination"
  );
  await ensureColumn(
    'livraisons',
    'corridor_logistique',
    'corridor_logistique VARCHAR(150) NULL AFTER pays_destination'
  );
  await ensureColumn(
    'livraisons',
    'livraison_transfrontaliere',
    'livraison_transfrontaliere BOOLEAN NOT NULL DEFAULT FALSE AFTER corridor_logistique'
  );
};

module.exports = {
  ensurePanAfricanSchema
};
