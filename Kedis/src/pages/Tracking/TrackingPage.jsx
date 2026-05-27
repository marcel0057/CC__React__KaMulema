import React, { useState, useEffect } from 'react';
import TrackingMap from './components/TrackingMap';
import DeliveryInfo from './components/DeliveryInfo';
import TripHistory from './components/TripHistory';
import { mockTrips } from './data/mockTrips';

const TrackingPage = () => {
  const [selectedTrip, setSelectedTrip] = useState(mockTrips[0]);
  const [liveProgress, setLiveProgress] = useState(mockTrips[0].progress);

  // Simulation de mise à jour en temps réel
  useEffect(() => {
    if (selectedTrip.status === 'in_progress') {
      const interval = setInterval(() => {
        setLiveProgress(prev => {
          const newProgress = Math.min(prev + 5, 100);
          if (newProgress === 100) {
            alert("Livraison terminée ! 🎉");
          }
          return newProgress;
        });
      }, 3000); // Mise à jour toutes les 3 secondes

      return () => clearInterval(interval);
    }
  }, [selectedTrip]);

  const tripWithLiveProgress = {
    ...selectedTrip,
    progress: liveProgress
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-green-700">🗺️ Kedis Tracking</h1>
            <p className="text-gray-600">Suivi en temps réel des transports</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700"
          >
            Actualiser
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TrackingMap trip={tripWithLiveProgress} />
          </div>

          <div>
            <DeliveryInfo trip={tripWithLiveProgress} />
            <TripHistory trips={mockTrips} onSelect={setSelectedTrip} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;