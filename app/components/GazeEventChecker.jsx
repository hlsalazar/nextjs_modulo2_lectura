import React from 'react';
import useGazeEvent from '../components/useGazeEvent'; // Actualiza la ruta según tu estructura de carpetas

const GazeEventChecker = ({ gazeEvents }) => {
  const transformedGazeEvents = gazeEvents.map(point => ({
    docX: point.x,
    docY: point.y
  }));
  const { clickPositions, matchingEventsArray, message, clickedElement } = useGazeEvent(transformedGazeEvents);

  return (
    <div>
      {transformedGazeEvents.map((point, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${point.docX}px`,
            top: `${point.docY}px`,
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '2px 5px',
            borderRadius: '5px',
            border: '1px solid black',
            cursor: 'pointer'
          }}
        >
          X={point.docX}, Y={point.docY}
        </div>
      ))}
      <div>{message}</div>
      <div>Clics registrados:</div>
      {clickPositions.map((pos, index) => (
        <div key={index}>Clic {index + 1}: X={pos.x}, Y={pos.y}</div>
      ))}
      <div>Eventos de mirada coincidentes:</div>
      {matchingEventsArray.map((event, index) => (
        <div key={index}>Evento {index + 1}: X={event.docX}, Y={event.docY}</div>
      ))}
      <div>Elemento clicado: {clickedElement ? `${clickedElement.tagName} with id=${clickedElement.id}` : 'Ninguno'}</div>
    </div>
  );
};

export default GazeEventChecker;
