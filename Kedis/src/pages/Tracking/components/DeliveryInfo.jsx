import React from 'react';

const DeliveryInfo = ({ trip }) => {
  if (!trip) return null;

  const getStatusColor = (status) => {
    if (status === 'completed') return 'bg-green-100 text-green-700';
    if (status === 'in_progress') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status) => {
    if (status === 'completed') return 'Livraison Terminée';
    if (status === 'in_progress') return 'En cours de livraison';
    return 'En attente';
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 mb-6">
      <h2 className="text-2xl font-semibold mb-5">Informations de Livraison</h2>

      <div className="space-y-5">
        <div>
          <p className="text-sm text-gray-500">Produit</p>
          <p className="font-semibold text-lg">{trip.product}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Agriculteur</p>
            <p className="font-medium">{trip.farmer}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-medium">{trip.client}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Statut</p>
          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
            {getStatusText(trip.status)}
          </span>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Progression</p>
              <p className="text-3xl font-bold text-green-600">{trip.progress}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Temps estimé</p>
              <p className="font-semibold">{trip.estimatedTime}</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="h-3 bg-gray-200 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-green-600 rounded-full transition-all duration-500"
              style={{ width: `${trip.progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryInfo;