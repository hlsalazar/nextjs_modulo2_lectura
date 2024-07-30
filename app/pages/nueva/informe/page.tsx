"use client";

import { useEffect, useState } from 'react';

const InformePage: React.FC = () => {
  const [generatedGazeData, setGeneratedGazeData] = useState<{ x: number; y: number }[]>([]);
  const [pageGeneratedGazeData, setPageGeneratedGazeData] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const storedGeneratedGazeData = localStorage.getItem('gazeData');
    const storedPageGeneratedGazeData = localStorage.getItem('pageGeneratedGazeData');

    if (storedGeneratedGazeData) {
      setGeneratedGazeData(JSON.parse(storedGeneratedGazeData));
    }
    if (storedPageGeneratedGazeData) {
      setPageGeneratedGazeData(JSON.parse(storedPageGeneratedGazeData));
    }
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Informe de Puntos de Mirada</h1>
      <div>
        <h2 className="text-xl font-bold mb-2">Puntos de mirada recibidos</h2>
        <ul>
          {generatedGazeData.map((point, index) => (
            <li key={index}>x: {point.x}, y: {point.y}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">Puntos de página generada</h2>
        <ul>
          {pageGeneratedGazeData.map((point, index) => (
            <li key={index}>x: {point.x}, y: {point.y}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InformePage;
