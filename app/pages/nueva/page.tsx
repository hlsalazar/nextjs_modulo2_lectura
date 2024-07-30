"use client";

import React, { useEffect, useState } from 'react';
import ExampleComponent from '../../components/ExampleComponent';
import useGazeData from '../../hooks/useGazeData';
import Link from 'next/link';

const NuevaPage: React.FC = () => {
  const [content, setContent] = useState<string[]>([]);
  const [matchingElementIds, setMatchingElementIds] = useState<string[]>([]);
  const [rankedElementsFromStorage, setRankedElementsFromStorage] = useState<any[]>([]);
  const [showMainContent, setShowMainContent] = useState(false); // Estado para alternar el contenido
  const [gazeDataArray, setGazeDataArray] = useState<{ x: number; y: number }[]>([]);

  const [collecting, setCollecting] = useState(false);
  const [calibrationComplete, setCalibrationComplete] = useState(false);

  useEffect(() => {
    const storedContent = localStorage.getItem('pageContent');
    const storedMatchingElementIds = localStorage.getItem('matchingElementIds');
    const storedRankedElements = localStorage.getItem('rankedElements');
    const storedGazeData = localStorage.getItem('gazeData');

    if (storedContent) {
      setContent(JSON.parse(storedContent));
      console.log('Contenido de la página cargado desde localStorage');
    }
    if (storedMatchingElementIds) {
      setMatchingElementIds(JSON.parse(storedMatchingElementIds));
      console.log('IDs de elementos coincidentes cargados desde localStorage');
    }
    if (storedRankedElements) {
      setRankedElementsFromStorage(JSON.parse(storedRankedElements));
      console.log('Elementos ordenados por puntos coincidentes cargados desde localStorage:', JSON.parse(storedRankedElements));
    }
    if (storedGazeData) {
      setGazeDataArray(JSON.parse(storedGazeData));
      console.log('Puntos de mirada recibidos:', JSON.parse(storedGazeData));
    }
  }, []);

  const processContent = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    matchingElementIds.forEach(id => {
      const element = doc.getElementById(id);
      if (element) {
        element.style.border = '2px solid red';
      }
    });
    
    return doc.body.innerHTML;
  };

  const toggleContent = () => {
    setShowMainContent(!showMainContent);
  };

  // Funciones para manejo de la calibración y recolección de puntos de mirada
  useEffect(() => {
    // Agregar los scripts necesarios de GazeCloud
    const script1 = document.createElement('script');
    script1.src = 'https://api.gazerecorder.com/GazeCloudAPI.js';
    script1.async = true;
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://app.gazerecorder.com/GazeRecorderAPI.js';
    script2.async = true;
    document.body.appendChild(script2);

    const script3 = document.createElement('script');
    script3.src = 'https://app.gazerecorder.com/GazePlayer.js';
    script3.async = true;
    document.body.appendChild(script3);

    return () => {
      document.body.removeChild(script1);
      document.body.removeChild(script2);
      document.body.removeChild(script3);
    };
  }, []);

  const iniciarCalibracion = () => {
    if (window.GazeCloudAPI) {
      window.GazeCloudAPI.OnCalibrationComplete = function () {
        console.log('Calibración completa');
        setCalibrationComplete(true);
      };
      window.GazeCloudAPI.OnCamDenied = function () { console.log('No se puede obtener acceso a la cámara'); }
      window.GazeCloudAPI.OnError = function (msg) { console.log('ERROR: ' + msg); }
      window.GazeCloudAPI.UseClickRecalibration = true;
      window.GazeCloudAPI.StartEyeTracking();
    } else {
      console.log('GazeCloudAPI no está disponible.');
    }
  };

  const iniciarRecoleccion = () => {
    setCollecting(true);
    if (window.GazeCloudAPI) {
      window.GazeCloudAPI.OnResult = function (GazeData) {
        if (collecting) {
          let x = GazeData.docX;
          let y = GazeData.docY;

          const margin = 50; // Aumentar el área visible
          const width = window.innerWidth - margin;
          const height = window.innerHeight - margin;
          if (x < margin) x = margin;
          if (y < margin) y = margin;
          if (x > width) x = width;
          if (y > height) y = height;

          setGazeDataArray(prevArray => [...prevArray, { x, y }]);
        }
      };
    } else {
      console.log('GazeCloudAPI no está disponible.');
    }
  };

  const finalizarRecoleccion = () => {
    setCollecting(false);
    if (window.GazeCloudAPI) {
      window.GazeCloudAPI.StopEyeTracking();
    }
    console.log('Recolección de puntos finalizada');
    console.log('Puntos de página generada:', gazeDataArray);
  };

  return (
    <div style={styles.pageContainer}>
      <button 
        onClick={toggleContent} 
        className="mb-4 inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Toggle Content
      </button>

      {showMainContent ? (
        <main style={styles.mainContent}>
          <ExampleComponent rankedElements={rankedElementsFromStorage} />
          <Link href="/highlighted-elements" legacyBehavior>
            <a className="mt-4 inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
              Ir a página de elementos resaltados
            </a>
          </Link>
        </main>
      ) : (
        <section className="p-4">
          <h1 className="text-2xl font-bold mb-4">Contenido Transferido</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.map((html, index) => (
              <div key={index} dangerouslySetInnerHTML={{ __html: processContent(html) }} className="p-4 border rounded shadow-md"></div>
            ))}
          </div>
        </section>
      )}

      {/* Botones para calibración y recolección de puntos de mirada */}
      <div className="fixed bottom-4 flex gap-4">
        <button
          onClick={iniciarCalibracion}
          className="rounded-md bg-red-500 px-4 py-2 text-white"
          disabled={calibrationComplete}
        >
          Iniciar Calibración
        </button>
        <button
          onClick={iniciarRecoleccion}
          className="rounded-md bg-green-500 px-4 py-2 text-white"
          disabled={!calibrationComplete}
        >
          Recolectar Puntos
        </button>
        <button
          onClick={finalizarRecoleccion}
          className="rounded-md bg-yellow-500 px-4 py-2 text-white"
          disabled={!collecting}
        >
          Finalizar Recolección
        </button>
      </div>

      {/* Contenedor para mostrar los puntos de mirada */}
      <div id="gazePoints" className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {gazeDataArray.map((point, index) => (
          <div
            key={index}
            className="gazePoint"
            style={{
              position: 'absolute',
              left: `${point.x}px`,
              top: `${point.y}px`,
              width: '10px',
              height: '10px',
              backgroundColor: 'red',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    width: '100vw',
  },
  header: {
    width: '100%',
    marginBottom: '20px',
    borderBottom: '1px solid #ddd',
    paddingBottom: '10px',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridAutoRows: 'minmax(100px, auto)',
    gap: '20px',
    width: '100%',
  },
};

export default NuevaPage;
