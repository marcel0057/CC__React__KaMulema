export const mockTrips = [
  {
    id: "TR001",
    product: "Tomates Cerises",
    farmer: "Jean Kouassi",
    client: "SuperMarket Abidjan",
    from: "Centre, CM",
    to: "Abidjan, CM",
    status: "in_progress",
    progress: 65,
    estimatedTime: "2h 15min",
    currentPosition: { lat: 5.32, lng: -4.02 },
    start: { lat: 6.82, lng: -5.28 },
    end: { lat: 5.36, lng: -4.008 },
    steps: [
      { lat: 6.82, lng: -5.28, name: "Centre" },
      { lat: 6.1, lng: -4.8, name: "Yamoussoukro" },
      { lat: 5.36, lng: -4.008, name: "Abidjan" }
    ]
  },
  {
    id: "TR002",
    product: "Ignames",
    farmer: "Marie N'Guessan",
    client: "Restaurant Le Baobab",
    from: "Centre, CM",
    to: "Abidjan, CM",
    status: "completed",
    progress: 100,
    estimatedTime: "Terminé",
    currentPosition: { lat: 5.36, lng: -4.008 },
    start: { lat: 6.82, lng: -5.28 },
    end: { lat: 5.36, lng: -4.008 }
  }
];