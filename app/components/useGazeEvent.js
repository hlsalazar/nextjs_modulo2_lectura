//components/useGazeEvent.js
import { useState, useEffect } from 'react';

const useGazeEvent = (gazeevents) => {
  const [clickPositions, setClickPositions] = useState([]);
  const [matchingEventsArray, setMatchingEventsArray] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleDocumentClick = (event) => {
      const target = event.target;
      const rect = target.getBoundingClientRect();
      const clickPosition = { x: event.clientX, y: event.clientY };
      setClickPositions(prevPositions => [...prevPositions, clickPosition]);

      const matchingEvents = gazeevents.filter(gazeEvent => {
        return gazeEvent.docX >= rect.left && gazeEvent.docX <= rect.right &&
               gazeEvent.docY >= rect.top && gazeEvent.docY <= rect.bottom;
      });

      if (matchingEvents.length > 0) {
        setMatchingEventsArray(matchingEvents);
        setMessage(`Clicked at: X=${clickPosition.x}, Y=${clickPosition.y} | Eventos de mirada dentro del área: ${JSON.stringify(matchingEvents)}`);
      } else {
        setMessage(`Clicked at: X=${clickPosition.x}, Y=${clickPosition.y} | No hay eventos de mirada dentro del área.`);
      }
      console.log("MISDATOS", gazeevents)
      console.log("DUMMY", gazeevents)
      console.log("MATCHING", matchingEvents)
    };


    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [gazeevents]);

  return { clickPositions, matchingEventsArray, message };
};

export default useGazeEvent;
