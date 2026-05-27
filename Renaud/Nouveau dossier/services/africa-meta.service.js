const normalizeValue = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const PAN_AFRICAN_COUNTRIES = [
  {
    code: 'CM',
    name: 'Cameroun',
    subregion: 'Afrique centrale',
    currency: 'XAF',
    languages: ['fr', 'en'],
    sampleRegions: ['Yaounde', 'Douala', 'Bafoussam', 'Garoua', 'Kribi']
  },
  {
    code: 'CI',
    name: "Cote d'Ivoire",
    subregion: "Afrique de l'Ouest",
    currency: 'XOF',
    languages: ['fr'],
    sampleRegions: ['Abidjan', 'Yamoussoukro', 'Bouake', 'San Pedro', 'Korhogo']
  },
  {
    code: 'SN',
    name: 'Senegal',
    subregion: "Afrique de l'Ouest",
    currency: 'XOF',
    languages: ['fr', 'wo'],
    sampleRegions: ['Dakar', 'Saint-Louis', 'Kaolack', 'Thiès', 'Ziguinchor']
  },
  {
    code: 'ML',
    name: 'Mali',
    subregion: "Afrique de l'Ouest",
    currency: 'XOF',
    languages: ['fr', 'bm'],
    sampleRegions: ['Bamako', 'Sikasso', 'Segou', 'Mopti', 'Kayes']
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    subregion: "Afrique de l'Ouest",
    currency: 'XOF',
    languages: ['fr'],
    sampleRegions: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora']
  },
  {
    code: 'NG',
    name: 'Nigeria',
    subregion: "Afrique de l'Ouest",
    currency: 'NGN',
    languages: ['en', 'ha', 'ig', 'yo'],
    sampleRegions: ['Lagos', 'Abuja', 'Kano', 'Kaduna', 'Ibadan']
  },
  {
    code: 'GH',
    name: 'Ghana',
    subregion: "Afrique de l'Ouest",
    currency: 'GHS',
    languages: ['en'],
    sampleRegions: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Sunyani']
  },
  {
    code: 'BJ',
    name: 'Benin',
    subregion: "Afrique de l'Ouest",
    currency: 'XOF',
    languages: ['fr'],
    sampleRegions: ['Cotonou', 'Porto-Novo', 'Parakou', 'Bohicon']
  },
  {
    code: 'TG',
    name: 'Togo',
    subregion: "Afrique de l'Ouest",
    currency: 'XOF',
    languages: ['fr'],
    sampleRegions: ['Lome', 'Kara', 'Sokode', 'Atakpame']
  },
  {
    code: 'KE',
    name: 'Kenya',
    subregion: "Afrique de l'Est",
    currency: 'KES',
    languages: ['en', 'sw'],
    sampleRegions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret']
  },
  {
    code: 'UG',
    name: 'Ouganda',
    subregion: "Afrique de l'Est",
    currency: 'UGX',
    languages: ['en', 'sw'],
    sampleRegions: ['Kampala', 'Gulu', 'Mbarara', 'Jinja']
  },
  {
    code: 'TZ',
    name: 'Tanzanie',
    subregion: "Afrique de l'Est",
    currency: 'TZS',
    languages: ['sw', 'en'],
    sampleRegions: ['Dar es Salaam', 'Arusha', 'Dodoma', 'Mwanza', 'Mbeya']
  },
  {
    code: 'RW',
    name: 'Rwanda',
    subregion: "Afrique de l'Est",
    currency: 'RWF',
    languages: ['rw', 'en', 'fr'],
    sampleRegions: ['Kigali', 'Musanze', 'Rubavu', 'Huye']
  },
  {
    code: 'ET',
    name: 'Ethiopie',
    subregion: "Afrique de l'Est",
    currency: 'ETB',
    languages: ['am', 'en'],
    sampleRegions: ['Addis-Abeba', 'Bahir Dar', 'Mekele', 'Hawassa']
  },
  {
    code: 'ZM',
    name: 'Zambie',
    subregion: 'Afrique australe',
    currency: 'ZMW',
    languages: ['en'],
    sampleRegions: ['Lusaka', 'Ndola', 'Kitwe', 'Livingstone']
  },
  {
    code: 'MW',
    name: 'Malawi',
    subregion: 'Afrique australe',
    currency: 'MWK',
    languages: ['en'],
    sampleRegions: ['Lilongwe', 'Blantyre', 'Mzuzu']
  },
  {
    code: 'ZA',
    name: 'Afrique du Sud',
    subregion: 'Afrique australe',
    currency: 'ZAR',
    languages: ['en', 'zu', 'xh', 'af'],
    sampleRegions: ['Johannesburg', 'Pretoria', 'Durban', 'Cape Town']
  },
  {
    code: 'MZ',
    name: 'Mozambique',
    subregion: 'Afrique australe',
    currency: 'MZN',
    languages: ['pt'],
    sampleRegions: ['Maputo', 'Beira', 'Nampula', 'Quelimane']
  },
  {
    code: 'MG',
    name: 'Madagascar',
    subregion: 'Afrique australe',
    currency: 'MGA',
    languages: ['fr', 'mg'],
    sampleRegions: ['Antananarivo', 'Toamasina', 'Fianarantsoa', 'Mahajanga']
  },
  {
    code: 'MA',
    name: 'Maroc',
    subregion: 'Afrique du Nord',
    currency: 'MAD',
    languages: ['ar', 'fr'],
    sampleRegions: ['Casablanca', 'Rabat', 'Meknes', 'Agadir', 'Fes']
  },
  {
    code: 'DZ',
    name: 'Algerie',
    subregion: 'Afrique du Nord',
    currency: 'DZD',
    languages: ['ar', 'fr'],
    sampleRegions: ['Alger', 'Oran', 'Setif', 'Constantine']
  },
  {
    code: 'TN',
    name: 'Tunisie',
    subregion: 'Afrique du Nord',
    currency: 'TND',
    languages: ['ar', 'fr'],
    sampleRegions: ['Tunis', 'Sfax', 'Sousse', 'Kairouan']
  },
  {
    code: 'EG',
    name: 'Egypte',
    subregion: 'Afrique du Nord',
    currency: 'EGP',
    languages: ['ar', 'en'],
    sampleRegions: ['Le Caire', 'Alexandrie', 'Gizeh', 'Minya']
  },
  {
    code: 'SD',
    name: 'Soudan',
    subregion: 'Afrique du Nord-Est',
    currency: 'SDG',
    languages: ['ar', 'en'],
    sampleRegions: ['Khartoum', 'Port-Soudan', 'Kassala', 'Gezira']
  },
  {
    code: 'CD',
    name: 'Republique democratique du Congo',
    subregion: 'Afrique centrale',
    currency: 'CDF',
    languages: ['fr'],
    sampleRegions: ['Kinshasa', 'Lubumbashi', 'Goma', 'Bukavu', 'Kisangani']
  },
  {
    code: 'CG',
    name: 'Congo',
    subregion: 'Afrique centrale',
    currency: 'XAF',
    languages: ['fr'],
    sampleRegions: ['Brazzaville', 'Pointe-Noire', 'Dolisie']
  },
  {
    code: 'GA',
    name: 'Gabon',
    subregion: 'Afrique centrale',
    currency: 'XAF',
    languages: ['fr'],
    sampleRegions: ['Libreville', 'Franceville', 'Port-Gentil']
  },
  {
    code: 'TD',
    name: 'Tchad',
    subregion: 'Afrique centrale',
    currency: 'XAF',
    languages: ['fr', 'ar'],
    sampleRegions: ["N'Djamena", 'Moundou', 'Sarh', 'Abeche']
  },
  {
    code: 'NE',
    name: 'Niger',
    subregion: "Afrique de l'Ouest",
    currency: 'XOF',
    languages: ['fr'],
    sampleRegions: ['Niamey', 'Maradi', 'Zinder', 'Agadez']
  }
];

const CONTINENTAL_LANGUAGES = [
  { code: 'fr', label: 'Francais' },
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'ar', label: 'Arabe' },
  { code: 'pt', label: 'Portugais' }
];

const TRADE_CORRIDORS = [
  {
    name: 'Corridor Abidjan-Lagos',
    countries: ["Cote d'Ivoire", 'Ghana', 'Togo', 'Benin', 'Nigeria'],
    focus: 'produits frais, logistique periportuaire, commerce regional'
  },
  {
    name: 'Corridor Douala-NDjamena',
    countries: ['Cameroun', 'Tchad'],
    focus: 'intrants, cereales, produits transformes et acces hinterland'
  },
  {
    name: 'Corridor Douala-Bangui',
    countries: ['Cameroun', 'Republique centrafricaine'],
    focus: 'ravitaillement, produits vivriers et logistique de desserte'
  },
  {
    name: 'Northern Corridor',
    countries: ['Kenya', 'Ouganda', 'Rwanda', 'Republique democratique du Congo'],
    focus: 'commerce est-africain, cereales et horticulture'
  },
  {
    name: 'Central Corridor',
    countries: ['Tanzanie', 'Rwanda', 'Burundi', 'Republique democratique du Congo'],
    focus: 'flux interieurs et export agricole'
  },
  {
    name: 'Corridor Caire-Khartoum',
    countries: ['Egypte', 'Soudan'],
    focus: 'irrigation, horticulture, intrants et logistique Nil'
  },
  {
    name: 'Corridor Maputo-Gauteng',
    countries: ['Mozambique', 'Afrique du Sud'],
    focus: 'export agro-industriel et debouches maritimes'
  }
];

const COUNTRY_LOOKUP = new Map(
  PAN_AFRICAN_COUNTRIES.flatMap((country) => [
    [normalizeValue(country.name), country],
    [normalizeValue(country.code), country]
  ])
);

const normalizeCountryName = (value) => {
  const fallback = PAN_AFRICAN_COUNTRIES[0];
  if (!value) {
    return fallback.name;
  }

  const match = COUNTRY_LOOKUP.get(normalizeValue(value));
  return match?.name || String(value).trim();
};

const getCountryMeta = (value) => {
  if (!value) {
    return PAN_AFRICAN_COUNTRIES[0];
  }
  return COUNTRY_LOOKUP.get(normalizeValue(value)) || null;
};

const resolveDefaultCurrency = (country) => getCountryMeta(country)?.currency || 'XAF';

const resolveDefaultLanguage = (country) => getCountryMeta(country)?.languages?.[0] || 'fr';

const getSampleRegionsByCountry = (country) => getCountryMeta(country)?.sampleRegions || [];

const inferCountryFromAddress = (address = '') => {
  const normalized = normalizeValue(address);
  const match = PAN_AFRICAN_COUNTRIES.find((country) => normalized.includes(normalizeValue(country.name)));
  return match?.name || null;
};

const findTradeCorridor = (departCountry, destinationCountry) => {
  const normalizedDeparture = normalizeCountryName(departCountry);
  const normalizedDestination = normalizeCountryName(destinationCountry);

  return (
    TRADE_CORRIDORS.find(
      (corridor) =>
        corridor.countries.includes(normalizedDeparture) &&
        corridor.countries.includes(normalizedDestination)
    ) || null
  );
};

const buildTradeAdvisory = ({ departCountry, destinationCountry, productName, exportable = false }) => {
  const normalizedDeparture = normalizeCountryName(departCountry);
  const normalizedDestination = normalizeCountryName(destinationCountry);
  const isCrossBorder = normalizedDeparture !== normalizedDestination;
  const corridor = findTradeCorridor(normalizedDeparture, normalizedDestination);

  return {
    cross_border: isCrossBorder,
    corridor_name: corridor?.name || (isCrossBorder ? 'Corridor transfrontalier general' : 'Circuit domestique'),
    corridor_focus: corridor?.focus || 'logistique locale, approvisionnement et distribution',
    advisory: isCrossBorder
      ? exportable
        ? `Le trajet ${normalizedDeparture} -> ${normalizedDestination} peut soutenir la vente regionale de ${productName || 'ce produit'}. Verifiez documents, conditionnement et disponibilite transport transfrontalier.`
        : `Le trajet ${normalizedDeparture} -> ${normalizedDestination} est transfrontalier. Confirmez les conditions douanieres, la conservation et la tracabilite avant expedition.`
      : `La livraison reste dans ${normalizedDeparture}. Priorisez la rapidite, la fraicheur et la fiabilite du dernier kilometre.`,
    depart_country: normalizedDeparture,
    destination_country: normalizedDestination
  };
};

const buildPanAfricanPlatformMeta = () => ({
  countries: PAN_AFRICAN_COUNTRIES,
  languages: CONTINENTAL_LANGUAGES,
  corridors: TRADE_CORRIDORS,
  subregions: [...new Set(PAN_AFRICAN_COUNTRIES.map((country) => country.subregion))]
});

module.exports = {
  CONTINENTAL_LANGUAGES,
  PAN_AFRICAN_COUNTRIES,
  TRADE_CORRIDORS,
  buildPanAfricanPlatformMeta,
  buildTradeAdvisory,
  findTradeCorridor,
  getCountryMeta,
  getSampleRegionsByCountry,
  inferCountryFromAddress,
  normalizeCountryName,
  resolveDefaultCurrency,
  resolveDefaultLanguage
};
