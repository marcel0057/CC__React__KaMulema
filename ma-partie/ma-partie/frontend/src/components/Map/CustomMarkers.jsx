import L from 'leaflet';

const createCustomIcon = (emoji, bgColor) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <span style="transform: rotate(45deg); font-size: 18px;">${emoji}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

export const UserMarkerIcon = createCustomIcon('📍', '#e53e3e'); // Rouge
export const AgronomeMarkerIcon = createCustomIcon('🌿', '#2d8a4e'); // Vert
export const TransporteurMarkerIcon = createCustomIcon('🚚', '#f59e0b'); // Orange
export const ProductMarkerIcon = createCustomIcon('📦', '#3182ce'); // Bleu
