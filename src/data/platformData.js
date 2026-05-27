export const agronomes = [
  {
    id: "AGR-01",
    name: "Dr Marcel Tchoumi",
    specialty: "Phytopathologie",
    city: "Bafoussam",
    region: "Ouest",
    zones: ["Bafoussam", "Dschang", "Mbouda", "Foumbot"],
    experience: 9,
    availability: "Disponible cette semaine",
    modes: ["WhatsApp", "Appel", "Terrain"],
    email: "akilanneaxel@gmail.com",
    phone: "+237 690 11 22 33",
    rating: 4.8,
    reviews: 42,
  },
  {
    id: "AGR-02",
    name: "Ing. Carine Mballa",
    specialty: "Sol et fertilisation",
    city: "Yaounde",
    region: "Centre",
    zones: ["Yaounde", "Mbalmayo", "Obala"],
    experience: 6,
    availability: "Rendez-vous sous 48h",
    modes: ["Messagerie", "Visio", "Terrain"],
    email: "auroreluna8@gmail.com",
    phone: "+237 677 24 18 90",
    rating: 4.6,
    reviews: 28,
  },
  {
    id: "AGR-03",
    name: "Dr Alain Njoya",
    specialty: "Cacao et cultures d'exportation",
    city: "Ebolowa",
    region: "Sud",
    zones: ["Ebolowa", "Sangmelima", "Kribi"],
    experience: 14,
    availability: "Disponible demain",
    modes: ["WhatsApp", "Terrain"],
    email: "akilanneaxel@gmail.com",
    phone: "+237 699 45 67 10",
    rating: 4.9,
    reviews: 61,
  },
  {
    id: "AGR-04",
    name: "Ing. Nadine Fotso",
    specialty: "Maraichage",
    city: "Douala",
    region: "Littoral",
    zones: ["Douala", "Edea", "Nkongsamba"],
    experience: 4,
    availability: "Disponible aujourd'hui",
    modes: ["Appel", "Messagerie"],
    email: "auroreluna8@gmail.com",
    phone: "+237 650 83 74 22",
    rating: 4.4,
    reviews: 19,
  },
];

export const products = [
  {
    id: "P-01",
    name: "Tomates fraiches",
    farmer: "Michelle Farm",
    region: "Ouest",
    city: "Bafoussam",
    price: 850,
    unit: "kg",
    quantity: 320,
    minOrder: 20,
    deliveryDelay: "24h - 48h",
    paymentModes: ["Mobile Money", "Cash a la livraison"],
    quality: "Extra frais",
    category: "Legumes",
    certified: true,
    loyalPriority: true,
  },
  {
    id: "P-02",
    name: "Cacao grade A",
    farmer: "Cooperative Ntem",
    region: "Sud",
    city: "Ebolowa",
    price: 2400,
    unit: "kg",
    quantity: 1200,
    minOrder: 100,
    deliveryDelay: "3 - 5 jours",
    paymentModes: ["Virement", "Mobile Money"],
    quality: "Grade A export",
    category: "Exportation",
    certified: true,
    loyalPriority: false,
  },
  {
    id: "P-03",
    name: "Manioc doux",
    farmer: "Ferme Kedis",
    region: "Centre",
    city: "Mbalmayo",
    price: 420,
    unit: "kg",
    quantity: 180,
    minOrder: 30,
    deliveryDelay: "48h",
    paymentModes: ["Mobile Money"],
    quality: "Transformable",
    category: "Tubercules",
    certified: false,
    loyalPriority: true,
  },
  {
    id: "P-04",
    name: "Plantain mur",
    farmer: "Ngongang Agro",
    region: "Littoral",
    city: "Nkongsamba",
    price: 1800,
    unit: "regime",
    quantity: 75,
    minOrder: 5,
    deliveryDelay: "24h",
    paymentModes: ["Cash a la livraison", "Mobile Money"],
    quality: "Mature",
    category: "Fruits",
    certified: true,
    loyalPriority: true,
  },
];

export const certifications = [
  {
    id: "C-01",
    farmer: "Michelle Farm",
    region: "Ouest",
    status: "Certifie",
    level: "Or",
    score: 88,
    criteria: ["Traçabilite", "Qualite produit", "Avis clients", "Evaluation agronome"],
  },
  {
    id: "C-02",
    farmer: "Ferme Kedis",
    region: "Centre",
    status: "En attente",
    level: "Argent",
    score: 64,
    criteria: ["Traçabilite", "Volume stable"],
  },
  {
    id: "C-03",
    farmer: "Ngongang Agro",
    region: "Littoral",
    status: "A corriger",
    level: "Bronze",
    score: 51,
    criteria: ["Photos produits", "Evaluation terrain"],
  },
];

export const deliveries = [
  {
    id: "TR-001",
    product: "Tomates fraiches",
    transporter: "Express Agro Cameroun",
    from: "Bafoussam",
    to: "Yaounde",
    status: "En route",
    progress: 68,
    eta: "2h 15min",
    cost: 45000,
    distance: 288,
  },
  {
    id: "TR-002",
    product: "Plantain mur",
    transporter: "LogiVert",
    from: "Nkongsamba",
    to: "Douala",
    status: "Confirme",
    progress: 32,
    eta: "1h 40min",
    cost: 28000,
    distance: 142,
  },
  {
    id: "TR-003",
    product: "Cacao grade A",
    transporter: "Cam Freight Rural",
    from: "Ebolowa",
    to: "Port de Douala",
    status: "Livre",
    progress: 100,
    eta: "Termine",
    cost: 92000,
    distance: 314,
  },
];

export const soilRecommendations = [
  {
    crop: "Tomate",
    confidence: 87,
    reason: "Sol limono-sableux, bonne exposition et humidite moderee.",
    season: "Mars - Juin",
  },
  {
    crop: "Mais",
    confidence: 78,
    reason: "Bonne tolerance aux variations de pluie et cycle court.",
    season: "Mars - Mai",
  },
  {
    crop: "Haricot",
    confidence: 71,
    reason: "Ameliore le sol et s'adapte aux zones de moyenne altitude.",
    season: "Avril - Juillet",
  },
];

// ─── Helpers pour les filtres dynamiques ───────────────────────────────────
function unique(array) {
  return [...new Set(array)].filter(Boolean).sort();
}

/** Toutes les régions présentes dans la liste des agronomes */
export const agronomeRegions = unique(agronomes.map((a) => a.region));

/** Toutes les régions présentes dans la liste des certifications */
export const certificationRegions = unique(certifications.map((c) => c.region));

/** Toutes les régions présentes dans le catalogue produits */
export const productRegions = unique(products.map((p) => p.region));

/** Toutes les catégories présentes dans le catalogue produits */
export const productCategories = unique(products.map((p) => p.category));

/** Tous les niveaux de certification disponibles */
export const certificationLevels = unique(certifications.map((c) => c.level));

// ─── Tickets ───────────────────────────────────────────────────────────────
export const tickets = [
  {
    id: "TK-2401",
    product: "Tomates fraiches",
    beneficiary: "Marche Mfoundi",
    status: "Genere",
    qrValue: "KA-MOLEMA-TK-2401",
    rating: 0,
  },
  {
    id: "TK-2402",
    product: "Cacao grade A",
    beneficiary: "Exportateur Douala",
    status: "Confirme",
    qrValue: "KA-MOLEMA-TK-2402",
    rating: 5,
  },
];
