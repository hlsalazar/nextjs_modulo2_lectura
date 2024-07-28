import { useState, useEffect } from 'react';

const useGazeData = () => {
  const [gazeEvents, setGazeEvents] = useState([]);
  const [rankedElements, setRankedElements] = useState([]);

  useEffect(() => {
    const fetchGazeEvents = async () => {
      try {
        const response = await fetch('https://api-seguim-ocular.vercel.app/api/dataexmp');
        const data = await response.json();
        setGazeEvents(data);
      } catch (error) {
        console.error("Error fetching gaze events:", error);
      }
    };

    fetchGazeEvents();
  }, []);

  useEffect(() => {
    if (gazeEvents && gazeEvents.length > 0) {
      // Aquí puedes aplicar tu algoritmo para clasificar y sugerir la disposición de los elementos
      setRankedElements(gazeEvents);
    }
  }, [gazeEvents]);

  return { gazeEvents, rankedElements };
};

export default useGazeData;