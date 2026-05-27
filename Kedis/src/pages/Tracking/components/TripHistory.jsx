import React from 'react';

const TripHistory = ({ trips, onSelect }) => {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-semibold mb-5">Historique des Trajets</h2>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {trips.map((trip) => (
          <div
            key={trip.id}
            onClick={() => onSelect(trip)}
            className={`p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${
              trip.status === 'in_progress' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{trip.product}</p>
                <p className="text-sm text-gray-600">{trip.from} → {trip.to}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                trip.status === 'completed' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {trip.status === 'completed' ? 'Terminé' : 'En cours'}
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              {trip.farmer} • {trip.estimatedTime}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TripHistory;