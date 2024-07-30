"use client";

import { useEffect, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import 'chart.js/auto';

Chart.register(...registerables);

interface Point {
  x: number;
  y: number;
}

const InformePage: React.FC = () => {
  const [generatedGazeData, setGeneratedGazeData] = useState<Point[]>([]);
  const [pageGeneratedGazeData, setPageGeneratedGazeData] = useState<Point[]>([]);

  useEffect(() => {
    const storedGeneratedGazeData = localStorage.getItem('gazeData');
    const storedPageGeneratedGazeData = localStorage.getItem('gazeDataGenerado');

    if (storedGeneratedGazeData) {
      setGeneratedGazeData(JSON.parse(storedGeneratedGazeData));
    }
    if (storedPageGeneratedGazeData) {
      setPageGeneratedGazeData(JSON.parse(storedPageGeneratedGazeData));
    }
  }, []);

  const scatterData = {
    datasets: [
      {
        label: 'Puntos de mirada recibidos',
        data: generatedGazeData.map(point => ({ x: point.x, y: point.y })),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        pointRadius: 5,
      },
      {
        label: 'Puntos generados en la página',
        data: pageGeneratedGazeData.map(point => ({ x: point.x, y: point.y })),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        pointRadius: 5,
      },
    ],
  };

  const scatterOptions = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Posición X',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Posición Y',
        },
      },
    },
  };

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.header}>Informe de Usabilidad Basado en Seguimiento Ocular</h1>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Introducción</h2>
        <p style={styles.paragraph}>
          Este informe se enfoca en el análisis de seguimiento ocular para la mejora de la navegación y la eficiencia en la experiencia del usuario en páginas web. Utilizando datos de mirada y datos generados de la página, se busca identificar patrones y áreas de mejora en la interfaz de usuario.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Puntos de Mirada Recibidos</h2>
        <ul style={styles.list}>
          {generatedGazeData.map((point, index) => (
            <li key={index}>x: {point.x}, y: {point.y}</li>
          ))}
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Puntos de Página Generada</h2>
        <ul style={styles.list}>
          {pageGeneratedGazeData.map((point, index) => (
            <li key={index}>x: {point.x}, y: {point.y}</li>
          ))}
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Visualización de Datos</h2>
        <div style={styles.chartContainer}>
          <Scatter data={scatterData} options={scatterOptions} />
        </div>
        <p style={styles.paragraph}>
          El gráfico de dispersión muestra los puntos de mirada recibidos en rojo y los puntos generados en la página en azul. Esto nos permite visualizar las áreas de alta y baja interacción.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Análisis y Recomendaciones</h2>
        <p style={styles.paragraph}>
          Basado en el análisis de los datos de seguimiento ocular, se pueden observar las siguientes áreas clave:
        </p>
        <ul style={styles.list}>
          <li>Áreas de alta concentración de mirada indican elementos importantes que captan la atención del usuario.</li>
          <li>Elementos con baja interacción podrían necesitar ajustes en diseño o contenido para mejorar su visibilidad.</li>
          <li>Comparación entre los datos recibidos y generados ayuda a identificar discrepancias y oportunidades de mejora en la interfaz.</li>
        </ul>
        <p style={styles.paragraph}>
          Recomendaciones:
        </p>
        <ul style={styles.list}>
          <li>Optimizar la disposición de los elementos basados en los datos de mirada para guiar mejor la navegación del usuario.</li>
          <li>Implementar pruebas de usabilidad iterativas para ajustar el diseño según el feedback real de los usuarios.</li>
          <li>Utilizar análisis de seguimiento ocular continuamente para mantener la eficiencia y la usabilidad de la interfaz.</li>
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Conclusión</h2>
        <p style={styles.paragraph}>
          El análisis de seguimiento ocular es una herramienta poderosa para mejorar la usabilidad y la experiencia del usuario en páginas web. Al identificar patrones de mirada y ajustar el diseño en consecuencia, se pueden crear interfaces más intuitivas y eficientes.
        </p>
      </section>
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
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f4f4f4',
    color: '#333',
  },
  header: {
    width: '100%',
    marginBottom: '20px',
    borderBottom: '1px solid #ddd',
    paddingBottom: '10px',
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#222',
  },
  section: {
    width: '80%',
    marginBottom: '20px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#444',
  },
  paragraph: {
    fontSize: '18px',
    marginBottom: '10px',
    lineHeight: '1.6',
    color: '#555',
  },
  list: {
    listStyleType: 'disc',
    paddingLeft: '20px',
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#555',
  },
  chartContainer: {
    width: '100%',
    height: '400px',
    marginBottom: '20px',
  },
};

export default InformePage;
