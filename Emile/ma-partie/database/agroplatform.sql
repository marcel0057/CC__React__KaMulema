CREATE DATABASE IF NOT EXISTS agroplatform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agroplatform;

DROP TABLE IF EXISTS notations_livraison;
DROP TABLE IF EXISTS bons_fidelite;
DROP TABLE IF EXISTS demandes_conseils;
DROP TABLE IF EXISTS conseils_semences;
DROP TABLE IF EXISTS types_sol;
DROP TABLE IF EXISTS alertes_prix;
DROP TABLE IF EXISTS rendez_vous;
DROP TABLE IF EXISTS avis;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS livraisons;
DROP TABLE IF EXISTS transporteurs;
DROP TABLE IF EXISTS certifications;
DROP TABLE IF EXISTS analyses;
DROP TABLE IF EXISTS maladies;
DROP TABLE IF EXISTS produits;
DROP TABLE IF EXISTS agronomes;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  telephone VARCHAR(20),
  mot_de_passe VARCHAR(255) NOT NULL,
  role ENUM('agriculteur','agronome','transporteur','client','admin') NOT NULL,
  region VARCHAR(100),
  ville VARCHAR(100),
  points_fidelite INT DEFAULT 0,
  anciennete_mois INT DEFAULT 0,
  date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actif BOOLEAN DEFAULT TRUE
);

CREATE TABLE agronomes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  specialite VARCHAR(200),
  annees_experience INT DEFAULT 0,
  bio TEXT,
  tarif_consultation DECIMAL(10,2),
  note_moyenne DECIMAL(3,2) DEFAULT 0,
  nb_avis INT DEFAULT 0,
  certifie BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE produits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendeur_id INT NOT NULL,
  nom VARCHAR(200) NOT NULL,
  categorie ENUM('fruits','legumes','cereales','tubercules','epices','autres') NOT NULL,
  description TEXT,
  prix DECIMAL(10,2) NOT NULL,
  unite VARCHAR(50) DEFAULT 'kg',
  quantite_disponible DECIMAL(10,2),
  region VARCHAR(100),
  bio BOOLEAN DEFAULT FALSE,
  disponible BOOLEAN DEFAULT TRUE,
  date_publication TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendeur_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE maladies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  culture VARCHAR(100) NOT NULL,
  description TEXT,
  symptomes TEXT,
  traitements TEXT,
  produits_traitement TEXT,
  niveau_gravite ENUM('faible','moyen','eleve','critique') NOT NULL,
  mots_cles TEXT
);

CREATE TABLE analyses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  maladie_id INT,
  mode_saisie ENUM('photo','texte','vocal') DEFAULT 'photo',
  description_symptomes TEXT,
  image_nom VARCHAR(255),
  confiance INT DEFAULT 0,
  date_analyse TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (maladie_id) REFERENCES maladies(id)
);

CREATE TABLE certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agriculteur_id INT NOT NULL,
  niveau ENUM('bronze','argent','or','platine') NOT NULL DEFAULT 'bronze',
  statut ENUM('en_attente','approuve','rejete') DEFAULT 'en_attente',
  formation_complete BOOLEAN DEFAULT FALSE,
  annees_activite INT DEFAULT 0,
  nb_avis_positifs INT DEFAULT 0,
  produits_bio BOOLEAN DEFAULT FALSE,
  evaluation_agronome BOOLEAN DEFAULT FALSE,
  date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_decision TIMESTAMP NULL,
  commentaire_admin TEXT,
  FOREIGN KEY (agriculteur_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE transporteurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nom_entreprise VARCHAR(200),
  type_vehicule VARCHAR(100),
  capacite_tonnes DECIMAL(5,2),
  tarif_km DECIMAL(10,2),
  note_moyenne DECIMAL(3,2) DEFAULT 0,
  nb_livraisons INT DEFAULT 0,
  disponible BOOLEAN DEFAULT TRUE,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE livraisons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produit_id INT NOT NULL,
  vendeur_id INT NOT NULL,
  acheteur_id INT NOT NULL,
  transporteur_id INT,
  adresse_depart TEXT,
  adresse_destination TEXT,
  lat_depart DECIMAL(10,8),
  lng_depart DECIMAL(11,8),
  lat_destination DECIMAL(10,8),
  lng_destination DECIMAL(11,8),
  distance_km DECIMAL(8,2),
  duree_estimee_heures DECIMAL(5,2),
  statut ENUM('en_attente','confirme','en_route','livre','probleme') DEFAULT 'en_attente',
  montant_total DECIMAL(10,2),
  date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_livraison_prevue DATE,
  date_livraison_reelle TIMESTAMP NULL,
  FOREIGN KEY (produit_id) REFERENCES produits(id),
  FOREIGN KEY (vendeur_id) REFERENCES users(id),
  FOREIGN KEY (acheteur_id) REFERENCES users(id),
  FOREIGN KEY (transporteur_id) REFERENCES transporteurs(id)
);

CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  livraison_id INT NOT NULL,
  numero_ticket VARCHAR(50) UNIQUE NOT NULL,
  qr_data TEXT NOT NULL,
  statut ENUM('genere','scanne','confirme','probleme') DEFAULT 'genere',
  date_generation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_scan TIMESTAMP NULL,
  FOREIGN KEY (livraison_id) REFERENCES livraisons(id)
);

CREATE TABLE avis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auteur_id INT NOT NULL,
  cible_id INT NOT NULL,
  type_cible ENUM('agronome','transporteur','vendeur') NOT NULL,
  note INT NOT NULL,
  commentaire TEXT,
  date_avis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auteur_id) REFERENCES users(id)
);

CREATE TABLE rendez_vous (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agriculteur_id INT NOT NULL,
  agronome_id INT NOT NULL,
  date_rdv DATETIME NOT NULL,
  probleme_decrit TEXT,
  statut ENUM('en_attente','confirme','termine','annule') DEFAULT 'en_attente',
  FOREIGN KEY (agriculteur_id) REFERENCES users(id),
  FOREIGN KEY (agronome_id) REFERENCES users(id)
);

CREATE TABLE alertes_prix (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  produit_nom VARCHAR(200),
  prix_seuil DECIMAL(10,2),
  active BOOLEAN DEFAULT TRUE,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE types_sol (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  caracteristiques TEXT,
  ph_min DECIMAL(4,2),
  ph_max DECIMAL(4,2)
);

CREATE TABLE conseils_semences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_sol_id INT NOT NULL,
  culture_recommandee VARCHAR(200) NOT NULL,
  region VARCHAR(100),
  altitude_min INT DEFAULT 0,
  altitude_max INT DEFAULT 9999,
  pluviometrie_min INT DEFAULT 0,
  pluviometrie_max INT DEFAULT 9999,
  saison_semis VARCHAR(100),
  rendement_estime VARCHAR(100),
  conseils_specifiques TEXT,
  niveau_difficulte ENUM('facile','moyen','difficile') DEFAULT 'moyen',
  FOREIGN KEY (type_sol_id) REFERENCES types_sol(id)
);

CREATE TABLE demandes_conseils (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type_sol_id INT,
  region VARCHAR(100),
  altitude INT,
  superficie_hectares DECIMAL(8,2),
  date_semis_prevue DATE,
  resultats TEXT,
  date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (type_sol_id) REFERENCES types_sol(id)
);

CREATE TABLE bons_fidelite (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  code_bon VARCHAR(50) UNIQUE NOT NULL,
  valeur_fcfa INT DEFAULT 0,
  raison VARCHAR(200),
  utilise BOOLEAN DEFAULT FALSE,
  date_attribution TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_expiration DATE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE notations_livraison (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  livraison_id INT NOT NULL,
  client_id INT NOT NULL,
  note_produit INT DEFAULT 0,
  note_transporteur INT DEFAULT 0,
  note_vendeur INT DEFAULT 0,
  commentaire TEXT,
  date_notation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (livraison_id) REFERENCES livraisons(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (id, nom, prenom, email, telephone, mot_de_passe, role, region, ville, points_fidelite, anciennete_mois, date_inscription, actif) VALUES
(1, 'Demo', 'Agriculteur', 'agriculteur@demo.com', '+237690000001', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Centre', 'Yaounde', 980, 18, DATE_SUB(NOW(), INTERVAL 540 DAY), TRUE),
(2, 'Kamga', 'Paul', 'paul.kamga@agro.cm', '+237690000002', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Centre', 'Yaounde', 1200, 28, DATE_SUB(NOW(), INTERVAL 840 DAY), TRUE),
(3, 'Nkoa', 'Mireille', 'mireille.nkoa@agro.cm', '+237690000003', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Littoral', 'Douala', 600, 14, DATE_SUB(NOW(), INTERVAL 420 DAY), TRUE),
(4, 'Atangana', 'Junior', 'junior.atangana@agro.cm', '+237690000004', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Ouest', 'Bafoussam', 340, 8, DATE_SUB(NOW(), INTERVAL 240 DAY), TRUE),
(5, 'Mballa', 'Grace', 'grace.mballa@agro.cm', '+237690000005', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Nord', 'Garoua', 1500, 36, DATE_SUB(NOW(), INTERVAL 1080 DAY), TRUE),
(6, 'Fouda', 'Serge', 'serge.fouda@agro.cm', '+237690000006', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Est', 'Bertoua', 800, 20, DATE_SUB(NOW(), INTERVAL 600 DAY), TRUE),
(7, 'Essomba', 'Clarisse', 'clarisse.essomba@agro.cm', '+237690000007', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Extreme-Nord', 'Maroua', 200, 6, DATE_SUB(NOW(), INTERVAL 180 DAY), TRUE),
(8, 'Tchinda', 'Boris', 'boris.tchinda@agro.cm', '+237690000008', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Sud', 'Ebolowa', 1100, 24, DATE_SUB(NOW(), INTERVAL 720 DAY), TRUE),
(9, 'Manga', 'Ruth', 'ruth.manga@agro.cm', '+237690000009', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Sud', 'Kribi', 400, 10, DATE_SUB(NOW(), INTERVAL 300 DAY), TRUE),
(10, 'Ndzana', 'Yves', 'yves.ndzana@agro.cm', '+237690000010', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Sud-Ouest', 'Limbe', 1700, 40, DATE_SUB(NOW(), INTERVAL 1200 DAY), TRUE),
(11, 'Bello', 'Salif', 'salif.bello@agro.cm', '+237690000011', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Adamaoua', 'Ngaoundere', 300, 7, DATE_SUB(NOW(), INTERVAL 210 DAY), TRUE),
(12, 'Hamidou', 'Aissatou', 'aissatou.hamidou@agro.cm', '+237690000012', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Nord', 'Garoua', 2200, 48, DATE_SUB(NOW(), INTERVAL 1440 DAY), TRUE),
(13, 'Abbo', 'Idriss', 'idriss.abbo@agro.cm', '+237690000013', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Extreme-Nord', 'Maroua', 90, 4, DATE_SUB(NOW(), INTERVAL 120 DAY), TRUE),
(14, 'Ngono', 'Estelle', 'estelle.ngono@agro.cm', '+237690000014', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Centre', 'Yaounde', 1250, 30, DATE_SUB(NOW(), INTERVAL 900 DAY), TRUE),
(15, 'Owona', 'Boris', 'boris.owona@agro.cm', '+237690000015', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agriculteur', 'Littoral', 'Douala', 1450, 32, DATE_SUB(NOW(), INTERVAL 960 DAY), TRUE),
(16, 'Demo', 'Agronome', 'agronome@demo.com', '+237690000016', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Centre', 'Yaounde', 50, 18, DATE_SUB(NOW(), INTERVAL 540 DAY), TRUE),
(17, 'Zang', 'Mireille', 'mireille.zang@agro.cm', '+237690000017', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Littoral', 'Douala', 120, 24, DATE_SUB(NOW(), INTERVAL 720 DAY), TRUE),
(18, 'Messi', 'Alain', 'alain.messi@agro.cm', '+237690000018', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Ouest', 'Bafoussam', 180, 33, DATE_SUB(NOW(), INTERVAL 990 DAY), TRUE),
(19, 'Eto', 'Florence', 'florence.eto@agro.cm', '+237690000019', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Nord', 'Garoua', 60, 15, DATE_SUB(NOW(), INTERVAL 450 DAY), TRUE),
(20, 'Bikele', 'Thierry', 'thierry.bikele@agro.cm', '+237690000020', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Est', 'Bertoua', 90, 21, DATE_SUB(NOW(), INTERVAL 630 DAY), TRUE),
(21, 'Ondoa', 'Carine', 'carine.ondoa@agro.cm', '+237690000021', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Sud', 'Ebolowa', 210, 44, DATE_SUB(NOW(), INTERVAL 1320 DAY), TRUE),
(22, 'Mbarga', 'Kevin', 'kevin.mbarga@agro.cm', '+237690000022', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Sud-Ouest', 'Limbe', 140, 26, DATE_SUB(NOW(), INTERVAL 780 DAY), TRUE),
(23, 'Kamga', 'Denise', 'denise.kamga@agro.cm', '+237690000023', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Adamaoua', 'Ngaoundere', 130, 27, DATE_SUB(NOW(), INTERVAL 810 DAY), TRUE),
(24, 'Nkoa', 'Serge', 'serge.nkoa@agro.cm', '+237690000024', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Centre', 'Yaounde', 70, 16, DATE_SUB(NOW(), INTERVAL 480 DAY), TRUE),
(25, 'Atangana', 'Fanny', 'fanny.atangana@agro.cm', '+237690000025', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Littoral', 'Douala', 100, 22, DATE_SUB(NOW(), INTERVAL 660 DAY), TRUE),
(26, 'Mballa', 'Brice', 'brice.mballa@agro.cm', '+237690000026', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Ouest', 'Bafoussam', 190, 35, DATE_SUB(NOW(), INTERVAL 1050 DAY), TRUE),
(27, 'Fouda', 'Joelle', 'joelle.fouda@agro.cm', '+237690000027', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Nord', 'Garoua', 85, 18, DATE_SUB(NOW(), INTERVAL 540 DAY), TRUE),
(28, 'Essomba', 'Henri', 'henri.essomba@agro.cm', '+237690000028', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Est', 'Bertoua', 115, 20, DATE_SUB(NOW(), INTERVAL 600 DAY), TRUE),
(29, 'Tchinda', 'Mireille', 'mireille.tchinda@agro.cm', '+237690000029', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Sud', 'Kribi', 125, 23, DATE_SUB(NOW(), INTERVAL 690 DAY), TRUE),
(30, 'Manga', 'Parfait', 'parfait.manga@agro.cm', '+237690000030', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Sud-Ouest', 'Limbe', 145, 28, DATE_SUB(NOW(), INTERVAL 840 DAY), TRUE),
(31, 'Ndzana', 'Reine', 'reine.ndzana@agro.cm', '+237690000031', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Adamaoua', 'Ngaoundere', 160, 29, DATE_SUB(NOW(), INTERVAL 870 DAY), TRUE),
(32, 'Bello', 'Amadou', 'amadou.bello@agro.cm', '+237690000032', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Extreme-Nord', 'Maroua', 95, 17, DATE_SUB(NOW(), INTERVAL 510 DAY), TRUE),
(33, 'Hamidou', 'Mariam', 'mariam.hamidou@agro.cm', '+237690000033', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Nord', 'Garoua', 175, 31, DATE_SUB(NOW(), INTERVAL 930 DAY), TRUE),
(34, 'Abbo', 'Patrice', 'patrice.abbo@agro.cm', '+237690000034', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Centre', 'Yaounde', 80, 13, DATE_SUB(NOW(), INTERVAL 390 DAY), TRUE),
(35, 'Ngono', 'Thierry', 'thierry.ngono@agro.cm', '+237690000035', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'agronome', 'Sud', 'Ebolowa', 155, 25, DATE_SUB(NOW(), INTERVAL 750 DAY), TRUE),
(36, 'Demo', 'Transporteur', 'transport@demo.com', '+237690000036', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'transporteur', 'Centre', 'Yaounde', 260, 18, DATE_SUB(NOW(), INTERVAL 540 DAY), TRUE),
(37, 'Owona', 'Nadia', 'nadia.owona@agro.cm', '+237690000037', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'transporteur', 'Littoral', 'Douala', 320, 22, DATE_SUB(NOW(), INTERVAL 660 DAY), TRUE),
(38, 'Zang', 'Boris', 'boris.zang@agro.cm', '+237690000038', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'transporteur', 'Ouest', 'Bafoussam', 480, 26, DATE_SUB(NOW(), INTERVAL 780 DAY), TRUE),
(39, 'Messi', 'Cedric', 'cedric.messi@agro.cm', '+237690000039', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'transporteur', 'Nord', 'Garoua', 150, 11, DATE_SUB(NOW(), INTERVAL 330 DAY), TRUE),
(40, 'Eto', 'Marthe', 'marthe.eto@agro.cm', '+237690000040', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'transporteur', 'Sud-Ouest', 'Limbe', 390, 20, DATE_SUB(NOW(), INTERVAL 600 DAY), TRUE),
(41, 'Demo', 'Client', 'client@demo.com', '+237690000041', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'client', 'Centre', 'Yaounde', 640, 24, DATE_SUB(NOW(), INTERVAL 720 DAY), TRUE),
(42, 'Bikele', 'Pauline', 'pauline.bikele@agro.cm', '+237690000042', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'client', 'Littoral', 'Douala', 430, 16, DATE_SUB(NOW(), INTERVAL 480 DAY), TRUE),
(43, 'Ondoa', 'Joel', 'joel.ondoa@agro.cm', '+237690000043', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'client', 'Ouest', 'Bafoussam', 210, 9, DATE_SUB(NOW(), INTERVAL 270 DAY), TRUE),
(44, 'Mbarga', 'Rosine', 'rosine.mbarga@agro.cm', '+237690000044', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'client', 'Sud', 'Kribi', 900, 27, DATE_SUB(NOW(), INTERVAL 810 DAY), TRUE),
(45, 'Kamga', 'Junior', 'junior.kamga@agro.cm', '+237690000045', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'client', 'Adamaoua', 'Ngaoundere', 510, 19, DATE_SUB(NOW(), INTERVAL 570 DAY), TRUE),
(46, 'Demo', 'Admin', 'admin@demo.com', '+237690000046', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'admin', 'Centre', 'Yaounde', 100, 12, DATE_SUB(NOW(), INTERVAL 360 DAY), TRUE),
(47, 'Nkoa', 'SuperAdmin', 'superadmin@demo.com', '+237690000047', '$2a$10$S2KsmWmtahMsca5fJB99OugYrFjT4rWO4lox3t6if/2xV3a8lOHsa', 'admin', 'Littoral', 'Douala', 180, 18, DATE_SUB(NOW(), INTERVAL 540 DAY), TRUE);

INSERT INTO agronomes (id, user_id, specialite, annees_experience, bio, tarif_consultation, note_moyenne, nb_avis, certifie, latitude, longitude) VALUES
(1, 16, 'Phytopathologiste', 9, 'Analyse des maladies foliaires et traitements preventifs pour les exploitations tropicales.', 12000, 4.60, 18, TRUE, 3.84803200, 11.50207500),
(2, 17, 'Specialiste Maraichage', 11, 'Accompagnement des producteurs de legumes de saison et de serres artisanales.', 14000, 4.40, 14, TRUE, 4.05105600, 9.76786800),
(3, 18, 'Expert Sols Tropicaux', 16, 'Diagnostic des sols d altitude et plans de fumure adaptes aux hauts plateaux.', 18000, 4.70, 21, TRUE, 5.47775000, 10.41718000),
(4, 19, 'Agronome Cerealier', 8, 'Optimisation des cultures de mais, sorgho et riz pluvial dans le nord.', 11000, 4.20, 11, FALSE, 9.32647800, 13.39641900),
(5, 20, 'Expert Cacao & Cafe', 13, 'Suivi de parcelles de cacao, cafe robusta et circuits de commercialisation.', 16000, 4.50, 19, TRUE, 4.57754000, 13.68459000),
(6, 21, 'Specialiste Agriculture Durable', 19, 'Transition vers des pratiques durables et une fertilite organique stable.', 17500, 4.80, 28, TRUE, 2.90000000, 11.15000000),
(7, 22, 'Expert Elevage & Cultures', 10, 'Systemes mixtes elevage-cultures et valorisation des dechets organiques.', 13500, 4.10, 10, FALSE, 4.07000000, 9.70000000),
(8, 23, 'Expert Sols Tropicaux', 12, 'Lecture des profils de sol et choix des varietes selon le pH et le drainage.', 14500, 4.30, 15, TRUE, 7.32000000, 13.58000000),
(9, 24, 'Specialiste Maraichage', 7, 'Encadrement de petites exploitations periurbaines et fertilisation localisee.', 10000, 4.00, 8, FALSE, 3.90000000, 11.48000000),
(10, 25, 'Phytopathologiste', 14, 'Gestion integree des maladies du cacao, tomate et plantain.', 17000, 4.65, 17, TRUE, 4.04500000, 9.71000000),
(11, 26, 'Agronome Cerealier', 18, 'Itineraires techniques pour mais, soja, haricot et pomme de terre.', 15000, 4.55, 16, TRUE, 5.50000000, 10.41000000),
(12, 27, 'Expert Cacao & Cafe', 9, 'Suivi des plantations, taille sanitaire et conseils post recolte.', 13000, 4.25, 9, FALSE, 9.28000000, 13.37000000),
(13, 28, 'Specialiste Agriculture Durable', 11, 'Agroecologie, paillage, rotations et reduction des intrants couteux.', 15500, 4.35, 12, TRUE, 4.60000000, 13.69000000),
(14, 29, 'Expert Sols Tropicaux', 10, 'Conseils pour la mise en valeur des sols sablo-limoneux du littoral sud.', 12500, 4.15, 9, FALSE, 2.94000000, 9.91000000),
(15, 30, 'Specialiste Maraichage', 15, 'Legumes frais, pepinieres et pilotage de la main oeuvre saisonniere.', 16500, 4.58, 18, TRUE, 4.06000000, 9.74000000),
(16, 31, 'Expert Elevage & Cultures', 17, 'Rotation cultures-fourrages et securisation des revenus des cooperatives.', 17250, 4.48, 13, TRUE, 7.33000000, 13.60000000),
(17, 32, 'Agronome Cerealier', 6, 'Production en zones seches et optimisation des semis precoces.', 9500, 3.95, 7, FALSE, 10.60000000, 14.32000000),
(18, 33, 'Expert Cacao & Cafe', 20, 'Appui technique et commercial pour les bassins de cafe et cacao.', 19000, 4.82, 26, TRUE, 9.31000000, 13.41000000),
(19, 34, 'Phytopathologiste', 5, 'Consultations de terrain et mise en place de protocoles anti fongiques.', 9800, 3.90, 6, FALSE, 3.86000000, 11.53000000),
(20, 35, 'Specialiste Agriculture Durable', 14, 'Approches resilientes pour cultures vivrieres et vergers familiaux.', 15800, 4.52, 14, TRUE, 2.92000000, 11.13000000);

INSERT INTO produits (id, vendeur_id, nom, categorie, description, prix, unite, quantite_disponible, region, bio, disponible, date_publication) VALUES
(1, 1, 'mais', 'cereales', 'Mais sec jaune pour farine et alimentation animale.', 175, 'kg', 1200, 'Centre', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 29 DAY)),
(2, 2, 'manioc', 'tubercules', 'Tubercules de manioc frais recoltes en zone humide.', 130, 'kg', 900, 'Centre', TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 28 DAY)),
(3, 3, 'tomate', 'legumes', 'Tomates rondes de plein champ pour marche local.', 240, 'kg', 420, 'Littoral', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 27 DAY)),
(4, 4, 'plantain', 'fruits', 'Plantains verts calibres pour consommation et friture.', 120, 'kg', 670, 'Ouest', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 26 DAY)),
(5, 5, 'arachide', 'autres', 'Arachide decortiquee pour huilerie artisanale.', 390, 'kg', 350, 'Nord', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(6, 6, 'cacao', 'autres', 'Fèves de cacao sechees et triees.', 1320, 'kg', 540, 'Est', TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 24 DAY)),
(7, 7, 'oignon', 'legumes', 'Oignons rouges de saison issus de parcelles irriguees.', 260, 'kg', 200, 'Extreme-Nord', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 23 DAY)),
(8, 8, 'gombo', 'legumes', 'Gombo frais pour restauration et transformation.', 260, 'kg', 180, 'Sud', TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 22 DAY)),
(9, 9, 'piment', 'epices', 'Piment rouge sec a forte intensite aromatique.', 650, 'kg', 140, 'Sud', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 21 DAY)),
(10, 10, 'cafe robusta', 'autres', 'Cafe robusta vert pour torrefaction locale.', 980, 'kg', 310, 'Sud-Ouest', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(11, 11, 'soja', 'cereales', 'Soja grain pour alimentation humaine et animale.', 360, 'kg', 500, 'Adamaoua', TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 19 DAY)),
(12, 12, 'sorgho', 'cereales', 'Sorgho blanc seche adaptee aux zones chaudes.', 205, 'kg', 880, 'Nord', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 18 DAY)),
(13, 13, 'mil', 'cereales', 'Mil perle pour bouillie et couscous local.', 190, 'kg', 760, 'Extreme-Nord', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 17 DAY)),
(14, 14, 'haricot', 'cereales', 'Haricot rouge tri calibre cooperatif.', 420, 'kg', 260, 'Centre', TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 16 DAY)),
(15, 15, 'aubergine africaine', 'legumes', 'Aubergine africaine fraiche pour restauration.', 310, 'kg', 300, 'Littoral', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(16, 1, 'manioc', 'tubercules', 'Cossettes de manioc sechees pour transformation.', 145, 'kg', 640, 'Centre', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 14 DAY)),
(17, 2, 'plantain', 'fruits', 'Plantain mur a maturite commerciale.', 135, 'kg', 540, 'Centre', TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 13 DAY)),
(18, 3, 'cacao', 'autres', 'Cacao marchand grade export artisanal.', 1410, 'kg', 220, 'Littoral', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(19, 4, 'mais', 'cereales', 'Mais blanc calibre consommation familiale.', 185, 'kg', 710, 'Ouest', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 11 DAY)),
(20, 5, 'soja', 'cereales', 'Soja de saison pour transformation locale.', 375, 'kg', 420, 'Nord', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(21, 6, 'tomate', 'legumes', 'Tomate allongee pour sauce et sechage.', 280, 'kg', 250, 'Est', TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(22, 7, 'piment', 'epices', 'Piment sec du nord pour conditionnement.', 610, 'kg', 120, 'Extreme-Nord', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(23, 8, 'moringa', 'autres', 'Feuilles de moringa sechees riches en nutriments.', 780, 'kg', 90, 'Sud', TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(24, 9, 'igname', 'tubercules', 'Igname blanche de table selectionnee.', 220, 'kg', 560, 'Sud', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(25, 10, 'cafe arabica', 'autres', 'Cafe arabica de montagne a haute valeur.', 1250, 'kg', 140, 'Sud-Ouest', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(26, 11, 'mais', 'cereales', 'Mais hybride pour revendeurs et groupements.', 195, 'kg', 980, 'Adamaoua', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(27, 12, 'gombo', 'legumes', 'Gombo tendre de zone irriguee.', 240, 'kg', 210, 'Nord', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(28, 13, 'oignon', 'legumes', 'Oignon de conservation en sacs ventiles.', 250, 'kg', 410, 'Extreme-Nord', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(29, 14, 'arachide', 'autres', 'Arachide fraiche pour pate et beurre local.', 430, 'kg', 290, 'Centre', TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(30, 15, 'courgette', 'legumes', 'Courgettes pour hotelerie et restauration.', 340, 'kg', 170, 'Littoral', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 0 DAY)),
(31, 1, 'haricot', 'cereales', 'Haricot noir pour vente en cooperatives.', 410, 'kg', 230, 'Centre', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(32, 2, 'cacao', 'autres', 'Cacao bio seche au solaire.', 1475, 'kg', 160, 'Centre', TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 26 DAY)),
(33, 3, 'plantain', 'fruits', 'Plantain vert regime entier pour transport longue distance.', 145, 'kg', 620, 'Littoral', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 24 DAY)),
(34, 4, 'tomate', 'legumes', 'Tomates de climat frais des plateaux.', 260, 'kg', 310, 'Ouest', TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 22 DAY)),
(35, 5, 'coton', 'autres', 'Coton graine pour industrie locale.', 230, 'kg', 1400, 'Nord', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(36, 6, 'manioc', 'tubercules', 'Manioc farineux pour gari et baton.', 125, 'kg', 860, 'Est', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 18 DAY)),
(37, 7, 'sorgho', 'cereales', 'Sorgho rouge traditionnel a bon rendement.', 198, 'kg', 720, 'Extreme-Nord', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 16 DAY)),
(38, 8, 'aubergine africaine', 'legumes', 'Aubergines locales en paniers de proximite.', 320, 'kg', 190, 'Sud', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 14 DAY)),
(39, 9, 'cacao', 'autres', 'Cacao marchand du littoral sud.', 1360, 'kg', 240, 'Sud', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(40, 10, 'moringa', 'autres', 'Poudre de moringa pour nutrition familiale.', 820, 'kg', 70, 'Sud-Ouest', TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(41, 11, 'soja', 'cereales', 'Soja jaune propre pour transformation.', 355, 'kg', 650, 'Adamaoua', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(42, 12, 'mil', 'cereales', 'Mil local de zone sahelienne.', 185, 'kg', 930, 'Nord', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(43, 13, 'sesame', 'autres', 'Sesame blanc pour commerce de niche.', 560, 'kg', 200, 'Extreme-Nord', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(44, 14, 'mais', 'cereales', 'Mais de table pour grossistes de Yaounde.', 188, 'kg', 540, 'Centre', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(45, 15, 'cafe robusta', 'autres', 'Robusta pour vente a petite torrefaction.', 1020, 'kg', 205, 'Littoral', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(46, 5, 'igname', 'tubercules', 'Igname longue de saison seche.', 235, 'kg', 380, 'Nord', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 13 DAY)),
(47, 6, 'pomme de terre', 'tubercules', 'Pommes de terre blanches pour restauration.', 310, 'kg', 450, 'Est', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 11 DAY)),
(48, 4, 'chou', 'legumes', 'Chou pommee des plateaux de l ouest.', 190, 'kg', 320, 'Ouest', TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(49, 8, 'carotte', 'legumes', 'Carottes fraiches de moyenne altitude.', 275, 'kg', 260, 'Sud', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(50, 10, 'the', 'autres', 'Feuilles de the pour transformation artisanale.', 720, 'kg', 95, 'Sud-Ouest', FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 5 DAY));

INSERT INTO maladies (id, nom, culture, description, symptomes, traitements, produits_traitement, niveau_gravite, mots_cles) VALUES
(1, 'Rouille commune', 'mais', 'Maladie foliaire du mais provoquant une baisse de photosynthese et une perte de rendement.', '["Taches orangees sur les feuilles","Poudre rouille sous la feuille","Jaunissement progressif"]', '["Appliquer un fongicide a base de mancozebe","Retirer les feuilles tres atteintes","Espacer les plants pour mieux aerer"]', '["Mancozebe 80 WP","Chlorothalonil","Soufre micronise","Trifloxystrobine"]', 'moyen', '["taches","rouille","orange","poudre","feuilles"]'),
(2, 'Mildiou du mais', 'mais', 'Champignon favorise par une forte humidite et des rosées persistantes.', '["Bandes humides sur les feuilles","Feutrage blanchatre au lever du jour","Retard de croissance"]', '["Ameliorer le drainage","Utiliser des semences saines","Traiter avec un fongicide homologue"]', '["Metalaxyl","Cuivre oxychlorure","Mancozebe"]', 'eleve', '["mildiou","blanc","humidite","feutrage","croissance"]'),
(3, 'Striure du mais', 'mais', 'Affection virale ou nutritionnelle provoquant des stries jaunes et un affaiblissement des plants.', '["Stries jaunes lineaires","Feuilles etroites","Plant chétif"]', '["Supprimer les plants fortement touches","Lutter contre les insectes vecteurs","Renforcer la fertilisation"]', '["Lambda cyhalothrine","Engrais NPK","Imidaclopride"]', 'moyen', '["stries","jaune","virus","feuilles","chetif"]'),
(4, 'Pourriture brune', 'cacao', 'Maladie du cacao liee a Phytophthora causant des pertes sur cabosses.', '["Cabosses brunies","Taches humides sur fruits","Noircissement progressif"]', '["Ramasser et detruire les cabosses malades","Pulveriser un fongicide cuprique","Nettoyer le verger"]', '["Bouillie bordelaise","Cuivre oxychlorure","Metalaxyl"]', 'critique', '["cabosse","brun","humide","noir","cacao"]'),
(5, 'Moniliase', 'cacao', 'Infection fongique qui deforme les cabosses et limite fortement le rendement.', '["Cabosses deformees","Poudre blanche sur fruits","Desséchement des jeunes fruits"]', '["Eclaircir les arbres","Couper les fruits infectes","Traiter preventivement"]', '["Mancozebe","Cuivre hydroxide","Soufre mouillable"]', 'eleve', '["blanche","cabosse","deforme","fruit","cacao"]'),
(6, 'Vascularisation', 'cacao', 'Depérissement progressif lie a des attaques vasculaires et un stress chronique.', '["Branches seches","Feuilles qui tombent","Veines brunies"]', '["Tailler les parties atteintes","Renforcer la nutrition organique","Surveiller l humidite du sol"]', '["Compost enrichi","Fongicide systemique","Biostimulant racinaire"]', 'moyen', '["branches","seches","veines","tombe","cacao"]'),
(7, 'Mosaique du manioc', 'manioc', 'Maladie virale majeure transmise par aleurodes et boutures infectees.', '["Feuilles tachetees","Mosaïque jaune verte","Croissance ralentie"]', '["Utiliser des boutures saines","Detruire les plants severement atteints","Controler les aleurodes"]', '["Imidaclopride","Huile de neem","Semences certifiees"]', 'critique', '["mosaique","manioc","jaune","verte","tache"]'),
(8, 'Bacteriose', 'manioc', 'Infection bacterienne provoquant un dessèchement foliaire et des chancres.', '["Taches angulaires","Flétrissement","Exsudat sur tiges"]', '["Eviter les blessures des plants","Eliminer les pieds atteints","Desinfecter les outils"]', '["Cuivre oxychlorure","Desinfectant agricole","Biostimulant"]', 'eleve', '["taches","angulaires","flechissement","tiges","bacterie"]'),
(9, 'Anthracnose', 'manioc', 'Champignon qui touche tiges et feuilles, surtout en saison humide.', '["Lesions sombres sur tiges","Sechage des apex","Feuilles necrosees"]', '["Tailler les parties attaquees","Limiter les excès d eau","Appliquer un fongicide de contact"]', '["Mancozebe","Cuivre","Chlorothalonil"]', 'moyen', '["tiges","sombres","apex","necrose","manioc"]'),
(10, 'Mildiou', 'tomate', 'Maladie explosive de la tomate par temps humide et frais.', '["Taches brunes huileuses","Blanchiment sous les feuilles","Pourriture des fruits"]', '["Eviter l humidite foliaire","Traiter rapidement","Retirer les plants tres atteints"]', '["Metalaxyl","Mancozebe","Cuivre hydroxide"]', 'critique', '["tomate","brune","huileuse","fruit","blanchiment"]'),
(11, 'Alternariose', 'tomate', 'Champignon provoquant des ronds concentriques et une chute des feuilles.', '["Taches rondes concentriques","Feuilles qui sechent","Atteinte des tiges"]', '["Eliminer les residus de culture","Renforcer la rotation","Pulveriser un fongicide adapte"]', '["Chlorothalonil","Azoxystrobine","Mancozebe"]', 'eleve', '["concentrique","rond","sechent","tiges","tomate"]'),
(12, 'Fusariose', 'tomate', 'Maladie du sol causant un jaunissement unilaterale et un flétrissement.', '["Jaunissement partiel","Plante fletrie","Brunissement vasculaire"]', '["Ameliorer la rotation","Solariser si possible","Utiliser un biocontrol"]', '["Trichoderma","Fongicide systemique","Compost mature"]', 'eleve', '["jaunissement","fletrie","vasculaire","sol","tomate"]'),
(13, 'Cercosporiose noire', 'plantain', 'Sigatoka noire du plantain provoquant une chute precoce des feuilles.', '["Stries noires sur les feuilles","Nécroses allongees","Diminution du regime"]', '["Couper les feuilles malades","Aerer la plantation","Appliquer un fongicide foliaire"]', '["Huile minerale","Mancozebe","Propiconazole"]', 'eleve', '["noire","stries","necroses","plantain","feuilles"]'),
(14, 'Pythium', 'general', 'Maladie de fonte des semis en pepiniere et sur jeunes plants.', '["Collet pourri","Plantules qui tombent","Sol trop humide"]', '["Assainir le substrat","Reduire l arrosage","Utiliser un produit de semences"]', '["Metalaxyl","Trichoderma","Cuivre"]', 'moyen', '["collet","plantules","tombent","semis","humide"]'),
(15, 'Botrytis', 'general', 'Pourriture grise favorisee par l humidite et la mauvaise ventilation.', '["Moisi gris","Fleurs pourries","Taches molles"]', '["Limiter l humidite","Retirer les tissus atteints","Pulveriser un fongicide cible"]', '["Iprodione","Boscalid","Soufre mouillable"]', 'moyen', '["gris","moisi","fleurs","molles","pourrie"]');

INSERT INTO analyses (id, user_id, maladie_id, mode_saisie, description_symptomes, image_nom, confiance, date_analyse) VALUES
(1, 1, 1, 'texte', 'Mes feuilles ont des taches orangees avec une poudre fine.', NULL, 82, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(2, 2, 7, 'photo', 'Mosaïque jaune verte sur le manioc.', 'manioc_1.jpg', 77, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(3, 3, 10, 'vocal', 'Tomates avec taches brunes et fruits qui pourrissent.', NULL, 88, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(4, 4, 13, 'texte', 'Grandes stries noires sur feuilles de plantain.', NULL, 79, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(5, 5, 4, 'photo', 'Cabosses brunies en plusieurs points de la parcelle.', 'cacao_2.png', 84, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(6, 6, 12, 'texte', 'Jaunissement partiel et plante fletrie.', NULL, 73, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(7, 8, 15, 'vocal', 'Un moisi gris apparait sur des fleurs et fruits.', NULL, 68, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(8, 10, 14, 'texte', 'Mes jeunes semis tombent et le sol est trop humide.', NULL, 75, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(9, 12, 2, 'photo', 'Blanchiment et feutrage sur feuilles de mais.', 'mais_2.webp', 71, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(10, 14, 8, 'texte', 'Taches angulaires et tiges avec exsudat.', NULL, 70, DATE_SUB(NOW(), INTERVAL 10 HOUR));

INSERT INTO certifications (id, agriculteur_id, niveau, statut, formation_complete, annees_activite, nb_avis_positifs, produits_bio, evaluation_agronome, date_demande, date_decision, commentaire_admin) VALUES
(1, 1, 'argent', 'approuve', TRUE, 18, 12, TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 300 DAY), DATE_SUB(NOW(), INTERVAL 280 DAY), 'Profil stable et tracabilite correcte.'),
(2, 2, 'or', 'approuve', TRUE, 28, 18, TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 260 DAY), DATE_SUB(NOW(), INTERVAL 250 DAY), 'Excellente constance de production.'),
(3, 3, 'bronze', 'en_attente', TRUE, 14, 6, FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 15 DAY), NULL, NULL),
(4, 4, 'bronze', 'rejete', FALSE, 8, 3, FALSE, FALSE, DATE_SUB(NOW(), INTERVAL 120 DAY), DATE_SUB(NOW(), INTERVAL 100 DAY), 'Compléter la formation et augmenter les avis.'),
(5, 5, 'platine', 'approuve', TRUE, 36, 22, TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 400 DAY), DATE_SUB(NOW(), INTERVAL 390 DAY), 'Tres haut niveau de conformite.'),
(6, 6, 'argent', 'approuve', TRUE, 20, 10, TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 240 DAY), DATE_SUB(NOW(), INTERVAL 230 DAY), 'Bon profil.'),
(7, 7, 'bronze', 'en_attente', FALSE, 6, 2, FALSE, FALSE, DATE_SUB(NOW(), INTERVAL 8 DAY), NULL, NULL),
(8, 8, 'or', 'approuve', TRUE, 24, 14, TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 260 DAY), DATE_SUB(NOW(), INTERVAL 240 DAY), 'Exploitant serieux et regulier.'),
(9, 9, 'bronze', 'en_attente', TRUE, 10, 5, FALSE, FALSE, DATE_SUB(NOW(), INTERVAL 12 DAY), NULL, NULL),
(10, 10, 'or', 'approuve', TRUE, 40, 16, TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 350 DAY), DATE_SUB(NOW(), INTERVAL 330 DAY), 'Tres bonne traçabilite.'),
(11, 11, 'bronze', 'rejete', FALSE, 7, 4, FALSE, FALSE, DATE_SUB(NOW(), INTERVAL 160 DAY), DATE_SUB(NOW(), INTERVAL 150 DAY), 'Donnees de production incomplètes.'),
(12, 12, 'platine', 'approuve', TRUE, 48, 25, TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 500 DAY), DATE_SUB(NOW(), INTERVAL 490 DAY), 'Productrice exemplaire.'),
(13, 13, 'bronze', 'en_attente', FALSE, 4, 1, FALSE, FALSE, DATE_SUB(NOW(), INTERVAL 6 DAY), NULL, NULL),
(14, 14, 'argent', 'approuve', TRUE, 30, 11, TRUE, TRUE, DATE_SUB(NOW(), INTERVAL 260 DAY), DATE_SUB(NOW(), INTERVAL 250 DAY), 'Bonne progression.'),
(15, 15, 'argent', 'approuve', TRUE, 32, 12, FALSE, TRUE, DATE_SUB(NOW(), INTERVAL 280 DAY), DATE_SUB(NOW(), INTERVAL 270 DAY), 'Peut viser le niveau or.');

INSERT INTO transporteurs (id, user_id, nom_entreprise, type_vehicule, capacite_tonnes, tarif_km, note_moyenne, nb_livraisons, disponible, latitude, longitude) VALUES
(1, 36, 'TransAgro Express', 'Camionnette frigorifique', 3.50, 200.00, 4.55, 48, TRUE, 3.86666700, 11.51666700),
(2, 37, 'Littoral Cargo Vert', 'Camion plateau', 6.00, 240.00, 4.20, 35, TRUE, 4.05105600, 9.76786800),
(3, 38, 'Bamenda Logistics Sud', 'Pickup 4x4', 2.80, 180.00, 4.05, 24, TRUE, 5.47775000, 10.41718000),
(4, 39, 'Sahel Route Services', 'Camion benne', 8.50, 260.00, 3.90, 18, FALSE, 9.32647800, 13.39641900),
(5, 40, 'Ocean Fresh Movers', 'Fourgon isotherme', 4.20, 220.00, 4.40, 29, TRUE, 4.06000000, 9.74000000);

INSERT INTO livraisons (id, produit_id, vendeur_id, acheteur_id, transporteur_id, adresse_depart, adresse_destination, lat_depart, lng_depart, lat_destination, lng_destination, distance_km, duree_estimee_heures, statut, montant_total, date_demande, date_livraison_prevue, date_livraison_reelle) VALUES
(1, 1, 1, 41, 1, 'Melen, Yaounde', 'Bastos, Yaounde', 3.86666700, 11.51666700, 3.90400000, 11.52500000, 4.25, 0.07, 'livre', 850.00, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 19 DAY)),
(2, 3, 3, 42, 2, 'Bonaberi, Douala', 'Akwa, Douala', 4.05000000, 9.68000000, 4.06000000, 9.71000000, 3.45, 0.06, 'livre', 828.00, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(CURDATE(), INTERVAL 17 DAY), DATE_SUB(NOW(), INTERVAL 17 DAY)),
(3, 6, 6, 43, 2, 'Bertoua centre', 'Douala Bonamoussadi', 4.57754000, 13.68459000, 4.07000000, 9.74000000, 441.30, 5.52, 'en_route', 105912.00, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), NULL),
(4, 10, 10, 44, 5, 'Limbe Mile 4', 'Kribi centre', 4.06000000, 9.74000000, 2.94000000, 9.91000000, 125.80, 1.57, 'confirme', 27676.00, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), NULL),
(5, 12, 12, 45, 4, 'Garoua marche', 'Ngaoundere gare', 9.32647800, 13.39641900, 7.31666700, 13.58333300, 224.60, 2.81, 'en_attente', 58396.00, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), NULL),
(6, 14, 14, 41, 1, 'Nkoabang, Yaounde', 'Omnisports, Yaounde', 3.90000000, 11.56000000, 3.88000000, 11.54000000, 3.15, 0.05, 'livre', 630.00, DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
(7, 18, 3, 44, 2, 'Bonamoussadi, Douala', 'Kribi plage', 4.08500000, 9.74000000, 2.94000000, 9.91000000, 128.20, 1.60, 'probleme', 30768.00, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(CURDATE(), INTERVAL 5 DAY), NULL),
(8, 21, 6, 42, 3, 'Bertoua sud', 'Bafoussam centre', 4.61000000, 13.68000000, 5.49000000, 10.41000000, 371.40, 4.64, 'confirme', 66852.00, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), NULL),
(9, 24, 9, 43, 5, 'Kribi port', 'Limbe Down Beach', 2.94000000, 9.91000000, 4.06000000, 9.74000000, 126.00, 1.58, 'en_route', 27720.00, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), NULL),
(10, 26, 11, 45, 4, 'Ngaoundere marché central', 'Garoua plateau', 7.31666700, 13.58333300, 9.32647800, 13.39641900, 224.60, 2.81, 'en_attente', 58396.00, DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_ADD(CURDATE(), INTERVAL 3 DAY), NULL),
(11, 32, 2, 41, 1, 'Nkolbisson, Yaounde', 'Biyem-Assi, Yaounde', 3.85000000, 11.50000000, 3.87000000, 11.49000000, 2.60, 0.04, 'livre', 520.00, DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)),
(12, 35, 5, 44, 4, 'Garoua ferme nord', 'Maroua centre', 9.35000000, 13.38000000, 10.59000000, 14.32000000, 170.70, 2.13, 'livre', 44382.00, DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(CURDATE(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY)),
(13, 39, 9, 42, 5, 'Kribi quartier Dombe', 'Douala Bonapriso', 2.94000000, 9.91000000, 4.05000000, 9.72000000, 125.40, 1.57, 'confirme', 27588.00, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), NULL),
(14, 44, 14, 43, 1, 'Yaounde Mendong', 'Bafoussam marché A', 3.82000000, 11.47000000, 5.48000000, 10.42000000, 244.80, 3.06, 'en_route', 48960.00, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), NULL),
(15, 50, 10, 45, 5, 'Limbe horticole', 'Yaounde Bastos', 4.06000000, 9.74000000, 3.90000000, 11.52000000, 198.60, 2.48, 'en_attente', 43692.00, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 4 DAY), NULL);

INSERT INTO tickets (id, livraison_id, numero_ticket, qr_data, statut, date_generation, date_scan) VALUES
(1, 1, 'AGRO-1-120001', '{"numero_ticket":"AGRO-1-120001","produit":"mais","vendeur":1,"acheteur":41,"montant":850.00}', 'confirme', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 19 DAY)),
(2, 2, 'AGRO-2-120002', '{"numero_ticket":"AGRO-2-120002","produit":"tomate","vendeur":3,"acheteur":42,"montant":828.00}', 'confirme', DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 17 DAY)),
(3, 3, 'AGRO-3-120003', '{"numero_ticket":"AGRO-3-120003","produit":"cacao","vendeur":6,"acheteur":43,"montant":105912.00}', 'genere', DATE_SUB(NOW(), INTERVAL 6 DAY), NULL),
(4, 4, 'AGRO-4-120004', '{"numero_ticket":"AGRO-4-120004","produit":"cafe arabica","vendeur":10,"acheteur":44,"montant":27676.00}', 'genere', DATE_SUB(NOW(), INTERVAL 4 DAY), NULL),
(5, 6, 'AGRO-6-120006', '{"numero_ticket":"AGRO-6-120006","produit":"haricot","vendeur":14,"acheteur":41,"montant":630.00}', 'confirme', DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY)),
(6, 7, 'AGRO-7-120007', '{"numero_ticket":"AGRO-7-120007","produit":"cacao","vendeur":3,"acheteur":44,"montant":30768.00}', 'probleme', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(7, 11, 'AGRO-11-120011', '{"numero_ticket":"AGRO-11-120011","produit":"cacao","vendeur":2,"acheteur":41,"montant":520.00}', 'confirme', DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)),
(8, 12, 'AGRO-12-120012', '{"numero_ticket":"AGRO-12-120012","produit":"coton","vendeur":5,"acheteur":44,"montant":44382.00}', 'confirme', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY));

INSERT INTO avis (id, auteur_id, cible_id, type_cible, note, commentaire, date_avis) VALUES
(1, 1, 1, 'agronome', 5, 'Diagnostic tres utile et rapide.', DATE_SUB(NOW(), INTERVAL 280 DAY)),
(2, 2, 3, 'agronome', 4, 'Bonne maitrise des sols de montagne.', DATE_SUB(NOW(), INTERVAL 260 DAY)),
(3, 3, 2, 'agronome', 4, 'Conseils precis pour les tomates.', DATE_SUB(NOW(), INTERVAL 210 DAY)),
(4, 4, 6, 'agronome', 5, 'Accompagnement durable tres complet.', DATE_SUB(NOW(), INTERVAL 190 DAY)),
(5, 5, 11, 'agronome', 5, 'Expert cerealier tres fiable.', DATE_SUB(NOW(), INTERVAL 160 DAY)),
(6, 6, 10, 'agronome', 4, 'Analyse claire des maladies du cacao.', DATE_SUB(NOW(), INTERVAL 150 DAY)),
(7, 41, 1, 'transporteur', 5, 'Livraison ponctuelle et emballage soigne.', DATE_SUB(NOW(), INTERVAL 19 DAY)),
(8, 42, 2, 'transporteur', 4, 'Bon contact et bonne communication.', DATE_SUB(NOW(), INTERVAL 17 DAY)),
(9, 44, 4, 'transporteur', 3, 'Vehicule adapte mais retard sur route.', DATE_SUB(NOW(), INTERVAL 13 DAY)),
(10, 41, 14, 'vendeur', 5, 'Haricot tres propre et bien calibre.', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(11, 44, 5, 'vendeur', 4, 'Qualite de coton satisfaisante.', DATE_SUB(NOW(), INTERVAL 13 DAY)),
(12, 42, 3, 'vendeur', 4, 'Tomates fraiches a la reception.', DATE_SUB(NOW(), INTERVAL 17 DAY)),
(13, 43, 6, 'vendeur', 5, 'Cacao seche de bonne qualite.', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(14, 45, 11, 'vendeur', 4, 'Mais regulier et bien emballe.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(15, 41, 2, 'vendeur', 5, 'Cacao bio tres bien trie.', DATE_SUB(NOW(), INTERVAL 15 DAY)),
(16, 8, 15, 'agronome', 4, 'Bonne approche terrain.', DATE_SUB(NOW(), INTERVAL 110 DAY)),
(17, 10, 18, 'agronome', 5, 'Expert cafe et cacao remarquable.', DATE_SUB(NOW(), INTERVAL 90 DAY)),
(18, 14, 20, 'agronome', 4, 'Conseils durables utiles pour le manioc.', DATE_SUB(NOW(), INTERVAL 70 DAY)),
(19, 44, 5, 'transporteur', 4, 'Equipe reactive et chargement propre.', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(20, 41, 1, 'vendeur', 5, 'Mais sec conforme a la commande.', DATE_SUB(NOW(), INTERVAL 19 DAY));

INSERT INTO rendez_vous (id, agriculteur_id, agronome_id, date_rdv, probleme_decrit, statut) VALUES
(1, 1, 16, DATE_ADD(NOW(), INTERVAL 2 DAY), 'Verifier des taches orangees sur le mais.', 'confirme'),
(2, 2, 18, DATE_ADD(NOW(), INTERVAL 4 DAY), 'Conseil sur rotation mais-haricot.', 'en_attente'),
(3, 3, 17, DATE_ADD(NOW(), INTERVAL 5 DAY), 'Ameliorer rendement maraichage.', 'en_attente'),
(4, 5, 19, DATE_SUB(NOW(), INTERVAL 20 DAY), 'Sorgho sensible a la secheresse.', 'termine'),
(5, 6, 20, DATE_SUB(NOW(), INTERVAL 16 DAY), 'Pourriture sur cabosses de cacao.', 'termine'),
(6, 8, 21, DATE_ADD(NOW(), INTERVAL 6 DAY), 'Transition vers bio sur plantain.', 'confirme'),
(7, 10, 22, DATE_ADD(NOW(), INTERVAL 8 DAY), 'Transport et conservation du cafe.', 'confirme'),
(8, 12, 23, DATE_SUB(NOW(), INTERVAL 30 DAY), 'Fertilite faible sur parcelle de soja.', 'termine'),
(9, 14, 24, DATE_ADD(NOW(), INTERVAL 3 DAY), 'Diagnostic oignon et tomates.', 'en_attente'),
(10, 15, 25, DATE_SUB(NOW(), INTERVAL 12 DAY), 'Besoin d appui contre l alternariose.', 'termine'),
(11, 4, 26, DATE_ADD(NOW(), INTERVAL 7 DAY), 'Conseil altitude et pomme de terre.', 'confirme'),
(12, 9, 35, DATE_ADD(NOW(), INTERVAL 10 DAY), 'Choix de cultures rentables pour Kribi.', 'en_attente');

INSERT INTO alertes_prix (id, user_id, produit_nom, prix_seuil, active, date_creation) VALUES
(1, 1, 'mais', 180.00, TRUE, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(2, 3, 'tomate', 250.00, TRUE, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(3, 41, 'cacao', 1400.00, TRUE, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(4, 42, 'plantain', 130.00, TRUE, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(5, 44, 'cafe arabica', 1300.00, FALSE, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(6, 45, 'soja', 370.00, TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO types_sol (id, nom, description, caracteristiques, ph_min, ph_max) VALUES
(1, 'Sol argileux', 'Sol lourd, retient bien l eau.', 'Structure compacte, bonne retention, travail difficile en saison humide.', 5.50, 7.00),
(2, 'Sol sableux', 'Sol leger, drainage rapide.', 'Faible retention, chauffe vite, riche en aeration.', 5.00, 6.50),
(3, 'Sol limoneux', 'Sol fertile et equilibre.', 'Texture douce, bonne reserve utile, adapte a plusieurs cultures.', 6.00, 7.50),
(4, 'Sol tourbeux', 'Riche en matiere organique.', 'Tres sombre, humide, acide, favorable a certaines cultures maraicheres.', 4.50, 6.00),
(5, 'Sol calcaire', 'Sol a pH eleve.', 'Couleur claire, drainage moyen, besoins en matiere organique.', 7.00, 8.50),
(6, 'Sol lateritique', 'Sol tropical typique Afrique.', 'Rouge a brun, ferreux, lessive, bon pour cacao et tubercules si bien entretenu.', 4.50, 6.50),
(7, 'Sol volcanique', 'Sol tres fertile d origine volcanique.', 'Riche en mineraux, profond, favorable aux cultures intensives.', 5.50, 7.00),
(8, 'Sol sablo-limoneux', 'Compromis sable et limon.', 'Bon drainage, travail facile, production reguliere avec fumure adaptee.', 5.50, 7.00);

INSERT INTO conseils_semences (id, type_sol_id, culture_recommandee, region, altitude_min, altitude_max, pluviometrie_min, pluviometrie_max, saison_semis, rendement_estime, conseils_specifiques, niveau_difficulte) VALUES
(1, 1, 'sorgho', 'Garoua', 100, 500, 400, 900, 'Mai a juin', '1.5 a 2.2 tonnes/hectare', 'Bien preparer la parcelle et privilegier des varietes tolerantes a la secheresse.', 'facile'),
(2, 1, 'mil', 'Maroua', 100, 450, 350, 800, 'Mai a juin', '1.2 a 1.8 tonnes/hectare', 'Semer tot pour profiter des premieres pluies.', 'facile'),
(3, 1, 'coton', 'Garoua', 100, 600, 500, 1000, 'Juin a juillet', '1.8 a 2.5 tonnes/hectare', 'Associer avec une fumure organique pour garder la structure du sol.', 'moyen'),
(4, 1, 'riz', 'Bertoua', 200, 700, 1000, 1800, 'Mars a avril', '2.5 a 4 tonnes/hectare', 'Choisir les bas fonds argileux et assurer un bon nivellement.', 'moyen'),
(5, 1, 'tomate', 'Yaounde', 500, 900, 1100, 1800, 'Fevrier a mars', '18 a 28 tonnes/hectare', 'Installer des planches surelevees pour eviter l asphyxie racinaire.', 'difficile'),
(6, 2, 'arachide', 'Ngaoundere', 700, 1300, 700, 1200, 'Mai a juin', '1.2 a 1.8 tonnes/hectare', 'Le sol sableux favorise une bonne formation des gousses.', 'facile'),
(7, 2, 'patate douce', 'Kribi', 0, 400, 1200, 2200, 'Mars a avril', '8 a 12 tonnes/hectare', 'Apporter du compost pour retenir l humidite.', 'facile'),
(8, 2, 'oignon', 'Maroua', 100, 400, 300, 700, 'Octobre a decembre', '12 a 18 tonnes/hectare', 'Arroser legerement mais regulierement.', 'moyen'),
(9, 2, 'pasteque', 'Garoua', 100, 500, 400, 900, 'Mai a juin', '10 a 18 tonnes/hectare', 'Pailler pour limiter l evaporation.', 'moyen'),
(10, 2, 'piment', 'Douala', 0, 300, 1400, 2200, 'Janvier a mars', '6 a 10 tonnes/hectare', 'Corriger le lessivage par des apports organiques frequents.', 'moyen'),
(11, 3, 'pomme de terre', 'Bafoussam', 1200, 1800, 1200, 2000, 'Mars a mai', '12 a 20 tonnes/hectare', 'Choisir des semences certifiees et butter rapidement.', 'moyen'),
(12, 3, 'chou', 'Bafoussam', 1100, 1800, 1000, 1800, 'Fevrier a avril', '18 a 30 tonnes/hectare', 'Maintenir une humidite reguliere pour eviter l eclatement.', 'moyen'),
(13, 3, 'carotte', 'Bafoussam', 1000, 1800, 900, 1700, 'Fevrier a avril', '12 a 18 tonnes/hectare', 'Ameublir finement le lit de semence.', 'moyen'),
(14, 3, 'mais', 'Bafoussam', 1000, 1700, 1000, 1700, 'Mars a juin', '3 a 5 tonnes/hectare', 'Associer le mais avec une legumineuse pour stabiliser la fertilite.', 'facile'),
(15, 3, 'haricot', 'Ngaoundere', 900, 1500, 800, 1400, 'Mai a juillet', '1.4 a 2 tonnes/hectare', 'Eviter les exces d eau au semis.', 'facile'),
(16, 4, 'salade', 'Douala', 0, 300, 1400, 2200, 'Toute l annee', '10 a 16 tonnes/hectare', 'Le sol tourbeux doit etre bien draine pour limiter les fontes de semis.', 'moyen'),
(17, 4, 'poireau', 'Bafoussam', 1000, 1800, 1200, 2000, 'Mars a juin', '8 a 12 tonnes/hectare', 'Apporter de la chaux douce si le pH reste trop bas.', 'moyen'),
(18, 4, 'fraise', 'Limbe', 700, 1400, 1400, 2200, 'Septembre a novembre', '6 a 9 tonnes/hectare', 'Pailler fortement et surveiller le botrytis.', 'difficile'),
(19, 4, 'celeri', 'Yaounde', 600, 1000, 1100, 1800, 'Fevrier a avril', '9 a 14 tonnes/hectare', 'Ameliorer la circulation de l air dans les planches.', 'moyen'),
(20, 4, 'chou-fleur', 'Bafoussam', 1200, 1800, 1000, 1700, 'Fevrier a mai', '10 a 14 tonnes/hectare', 'Prevoir une fertilisation fractionnee.', 'difficile'),
(21, 5, 'oignon', 'Ngaoundere', 900, 1400, 700, 1200, 'Octobre a janvier', '12 a 20 tonnes/hectare', 'Le calcaire favorise la conservation si la matiere organique est suffisante.', 'moyen'),
(22, 5, 'ail', 'Bafoussam', 1000, 1700, 700, 1200, 'Octobre a decembre', '5 a 7 tonnes/hectare', 'Eviter les parcelles trop humides et apporter du compost.', 'moyen'),
(23, 5, 'luzerne', 'Ngaoundere', 900, 1500, 700, 1300, 'Debut de saison des pluies', '8 a 12 tonnes/hectare', 'Bonne option pour systems mixtes elevage-cultures.', 'facile'),
(24, 5, 'carotte', 'Bafoussam', 1000, 1700, 800, 1400, 'Fevrier a avril', '11 a 16 tonnes/hectare', 'Le calcaire aide la forme si le sol est bien ameubli.', 'moyen'),
(25, 5, 'haricot', 'Yaounde', 600, 1000, 900, 1500, 'Mars a juin', '1.2 a 1.9 tonnes/hectare', 'Choisir des varietes tolerantes au pH plus eleve.', 'facile'),
(26, 6, 'cacao', 'Yaounde', 500, 900, 1200, 1800, 'Mars a mai', '0.8 a 1.5 tonnes/hectare', 'Pailler et maintenir une bonne couverture du sol lateritique.', 'moyen'),
(27, 6, 'plantain', 'Yaounde', 500, 900, 1200, 2000, 'Mars a juin', '10 a 16 tonnes/hectare', 'Apporter de la matiere organique avant la mise en place.', 'facile'),
(28, 6, 'manioc', 'Yaounde', 400, 900, 1000, 1800, 'Mars a juin', '12 a 20 tonnes/hectare', 'Faire des billons pour mieux conserver l humidite utile.', 'facile'),
(29, 6, 'cafe robusta', 'Ebolowa', 400, 900, 1200, 2000, 'Mars a mai', '0.9 a 1.4 tonnes/hectare', 'Installer des arbres d ombrage progressifs.', 'difficile'),
(30, 6, 'moringa', 'Bertoua', 300, 700, 900, 1600, 'Debut de saison des pluies', '5 a 8 tonnes/hectare', 'Tailler regulierement pour une meilleure production de feuilles.', 'facile'),
(31, 7, 'cafe arabica', 'Limbe', 900, 1600, 1400, 2200, 'Mars a mai', '0.8 a 1.3 tonnes/hectare', 'Le sol volcanique valorise bien l arabica avec ombrage leger.', 'difficile'),
(32, 7, 'the', 'Limbe', 900, 1800, 1500, 2300, 'Mars a juin', '1.5 a 2.2 tonnes/hectare', 'Maintenir des tailles regulieres pour favoriser les jeunes pousses.', 'difficile'),
(33, 7, 'tomate', 'Bafoussam', 1000, 1700, 1000, 1800, 'Fevrier a avril', '20 a 32 tonnes/hectare', 'Bon potentiel en sol volcanique si la pression maladie est maitrisee.', 'moyen'),
(34, 7, 'pomme de terre', 'Bafoussam', 1200, 1900, 1200, 2000, 'Mars a mai', '15 a 24 tonnes/hectare', 'Exploiter la profondeur du sol et butter tot.', 'moyen'),
(35, 7, 'chou', 'Limbe', 800, 1500, 1300, 2100, 'Fevrier a mai', '20 a 30 tonnes/hectare', 'Surveiller les attaques de chenilles en saison humide.', 'moyen'),
(36, 8, 'soja', 'Ngaoundere', 700, 1300, 800, 1300, 'Mai a juin', '1.5 a 2.4 tonnes/hectare', 'Bonne adaptation avec inoculation des semences.', 'facile'),
(37, 8, 'mais', 'Yaounde', 500, 1000, 1000, 1700, 'Mars a juin', '3.5 a 5.5 tonnes/hectare', 'Le sablo-limoneux reagit bien a des apports fractionnes.', 'facile'),
(38, 8, 'tomate', 'Douala', 0, 400, 1400, 2200, 'Janvier a mars', '18 a 26 tonnes/hectare', 'Installer un drainage leger et pailler contre le lessivage.', 'moyen'),
(39, 8, 'gombo', 'Ebolowa', 300, 900, 1100, 1800, 'Mars a juin', '7 a 11 tonnes/hectare', 'Semer sur billons pour profiter du bon compromis air-eau.', 'facile'),
(40, 8, 'courgette', 'Kribi', 0, 400, 1300, 2200, 'Fevrier a avril', '10 a 16 tonnes/hectare', 'Prevoir une surveillance reguliere du mildiou.', 'moyen');

INSERT INTO demandes_conseils (id, user_id, type_sol_id, region, altitude, superficie_hectares, date_semis_prevue, resultats, date_demande) VALUES
(1, 1, 6, 'Yaounde', 720, 3.50, DATE_ADD(CURDATE(), INTERVAL 20 DAY), '[{"culture_recommandee":"cacao"},{"culture_recommandee":"plantain"},{"culture_recommandee":"manioc"}]', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(2, 10, 7, 'Limbe', 1050, 2.10, DATE_ADD(CURDATE(), INTERVAL 40 DAY), '[{"culture_recommandee":"cafe arabica"},{"culture_recommandee":"the"},{"culture_recommandee":"chou"}]', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(3, 12, 1, 'Garoua', 230, 7.80, DATE_ADD(CURDATE(), INTERVAL 18 DAY), '[{"culture_recommandee":"sorgho"},{"culture_recommandee":"mil"},{"culture_recommandee":"coton"}]', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 14, 3, 'Bafoussam', 1450, 1.60, DATE_ADD(CURDATE(), INTERVAL 25 DAY), '[{"culture_recommandee":"pomme de terre"},{"culture_recommandee":"chou"},{"culture_recommandee":"carotte"}]', DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO bons_fidelite (id, user_id, code_bon, valeur_fcfa, raison, utilise, date_attribution, date_expiration) VALUES
(1, 1, 'FID-AGRO-001', 3000, 'Client ancien et livraisons confirmees', FALSE, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 120 DAY)),
(2, 5, 'FID-AGRO-005', 5000, 'Qualite de service constante', FALSE, DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_ADD(CURDATE(), INTERVAL 90 DAY)),
(3, 10, 'FID-AGRO-010', 4500, 'Priorite anciennete et avis clients', FALSE, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 100 DAY)),
(4, 12, 'FID-AGRO-012', 7000, 'Excellence logistique et regularite', FALSE, DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_ADD(CURDATE(), INTERVAL 180 DAY)),
(5, 41, 'FID-CLI-041', 2500, 'Client fidele avec plusieurs commandes', FALSE, DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_ADD(CURDATE(), INTERVAL 80 DAY)),
(6, 42, 'FID-CLI-042', 1500, 'Achat repete de produits locaux', FALSE, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 60 DAY)),
(7, 44, 'FID-CLI-044', 2200, 'Priorite rupture de stock', FALSE, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 75 DAY)),
(8, 45, 'FID-CLI-045', 1800, 'Fidelite sur longue duree', FALSE, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 70 DAY));

INSERT INTO notations_livraison (id, ticket_id, livraison_id, client_id, note_produit, note_transporteur, note_vendeur, commentaire, date_notation) VALUES
(1, 1, 1, 41, 5, 5, 5, 'Commande bien recue et conforme.', DATE_SUB(NOW(), INTERVAL 19 DAY)),
(2, 2, 2, 42, 4, 4, 4, 'Bonne qualite et transport rapide.', DATE_SUB(NOW(), INTERVAL 17 DAY)),
(3, 8, 12, 44, 4, 4, 4, 'Livraison satisfaisante malgre un retard leger.', DATE_SUB(NOW(), INTERVAL 13 DAY));
