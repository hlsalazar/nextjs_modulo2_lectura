"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { Scatter } from "react-chartjs-2";
import "chart.js/auto";
import h337 from "heatmap.js"; // Importa heatmap.js
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig"; // Ruta de tu archivo firebaseConfig


Chart.register(...registerables);

interface Point {
  x: number;
  y: number;
}

// Función para normalizar los puntos dentro de las dimensiones del contenedor
const normalizePoints = (
  points: Point[],
  maxCanvasWidth: number,
  maxCanvasHeight: number
) => {
  const maxX = Math.max(...points.map((p) => p.x), 1);
  const maxY = Math.max(...points.map((p) => p.y), 1);
  const scaleFactor = Math.min(
    maxCanvasWidth / maxX,
    maxCanvasHeight / maxY
  ); // Escalado uniforme para mantener proporciones

  return points.map((point) => ({
    x: Math.floor(point.x * scaleFactor), // Escala proporcional en X
    y: Math.floor(point.y * scaleFactor), // Escala proporcional en Y
    value: 1, // Peso del punto
  }));
};



const InformePage: React.FC = () => {
  const heatmapContainerRef = useRef<HTMLDivElement | null>(null);
  const [generatedGazeData, setGeneratedGazeData] = useState<Point[]>([]);
  const [pageGeneratedGazeData, setPageGeneratedGazeData] = useState<Point[]>(
    []
  );

  const MAX_CANVAS_WIDTH = 600; // Ajustar el ancho máximo del canvas
  const MAX_CANVAS_HEIGHT = 400; // Ajustar el alto máximo del canvas

  // Cargar datos de localStorage
  useEffect(() => {
    const storedGeneratedGazeData = localStorage.getItem("gazeData");
    const storedPageGeneratedGazeData = localStorage.getItem(
      "gazeDataGenerado"
    );

    if (storedGeneratedGazeData) {
      const data = JSON.parse(storedGeneratedGazeData);
      console.log("Puntos cargados desde localStorage:", data);
      setGeneratedGazeData(data);
    }
    if (storedPageGeneratedGazeData) {
      const data = JSON.parse(storedPageGeneratedGazeData);
      console.log("Puntos generados en la página:", data);
      setPageGeneratedGazeData(data);
    }
  }, []);

  // Crear el mapa de calor
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      heatmapContainerRef.current &&
      generatedGazeData.length > 0
    ) {
      console.log("Inicializando mapa de calor con puntos:", generatedGazeData);

      const container = heatmapContainerRef.current;

      // Normalizar los puntos dentro de las dimensiones limitadas del canvas
      const normalizedPoints = normalizePoints(
        generatedGazeData,
        MAX_CANVAS_WIDTH,
        MAX_CANVAS_HEIGHT
      );

      console.log("Puntos normalizados:", normalizedPoints);

      // Establecer dimensiones del contenedor para ajustarse al canvas
      container.style.width = `${MAX_CANVAS_WIDTH}px`;
      container.style.height = `${MAX_CANVAS_HEIGHT}px`;

      const heatmapInstance = h337.create({
        container,
        radius: 15, // Reduce el radio si el mapa es demasiado grande
        maxOpacity: 0.8, // Mantén una opacidad visible
        minOpacity: 0, // Mantén una opacidad mínima
        blur: 0.6, // Ajusta el suavizado si es necesario
      });

      heatmapInstance.setData({
        min: 0, // Valor mínimo para el mapa de calor
        max: 10, // Máximo valor en la escala de calor
        data: normalizedPoints,
      });
    }
  }, [generatedGazeData]);

  const scatterData = {
    datasets: [
      {
        label: "Puntos de mirada recibidos",
        data: generatedGazeData.map((point) => ({ x: point.x, y: point.y })),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        pointRadius: 5,
      },
      {
        label: "Puntos generados en la página",
        data: pageGeneratedGazeData.map((point) => ({ x: point.x, y: point.y })),
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        pointRadius: 5,
      },
    ],
  };

  const scatterOptions = {
    scales: {
      x: {
        title: {
          display: true,
          text: "Posición X",
        },
      },
      y: {
        title: {
          display: true,
          text: "Posición Y",
        },
      },
    },
  };

  const saveReportToFirebase = async () => {
    if (!generatedGazeData.length) {
      alert("No hay datos de mirada generados para guardar.");
      return;
    }
  
    try {
      const reportData = {
        generatedGazeData,
        pageGeneratedGazeData,
        timestamp: new Date().toISOString(),
      };
  
      const docRef = await addDoc(collection(db, "reports"), reportData);
      console.log("Informe guardado con ID:", docRef.id);
      alert("Informe guardado exitosamente en Firebase.");
    } catch (error) {
      console.error("Error al guardar el informe:", error);
      alert("Hubo un error al guardar el informe. Por favor, intenta nuevamente.");
    }
  };
  
  

  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.header}>
        Informe de Usabilidad Basado en Seguimiento Ocular
      </h1>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Introducción</h2>
        <p style={styles.paragraph}>
          Este informe se enfoca en el análisis de seguimiento ocular para la
          mejora de la navegación y la eficiencia en la experiencia del usuario
          en páginas web. Utilizando datos de mirada y datos generados de la
          página, se busca identificar patrones y áreas de mejora en la
          interfaz de usuario.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Puntos de Mirada Recibidos</h2>
        <ul style={styles.list}>
          {generatedGazeData.map((point, index) => (
            <li key={index}>
              x: {point.x}, y: {point.y}
            </li>
          ))}
        </ul>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Visualización de Datos</h2>
        <div style={styles.chartContainer}>
          <Scatter data={scatterData} options={scatterOptions} />
        </div>
        <p style={styles.paragraph}>
          El gráfico de dispersión muestra los puntos de mirada recibidos en
          rojo. Esto nos permite visualizar las áreas de alta y baja interacción.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Mapa de Calor</h2>
        <div
          id="heatmap-container"
          ref={heatmapContainerRef}
          style={{
            width: `${MAX_CANVAS_WIDTH}px`,
            height: `${MAX_CANVAS_HEIGHT}px`,
            position: "relative",
            backgroundColor: "#fff", // Asegúrate de que el fondo sea blanco
            border: "1px solid #ddd", // Añade un borde para mejor visibilidad
          }}
        ></div>
        <p style={styles.paragraph}>
          El mapa de calor es una representación visual que muestra las áreas
          de mayor atención e interacción en la página. Los colores cálidos,
          como el rojo y amarillo, indican zonas donde los usuarios han
          enfocado más su mirada, mientras que los colores fríos, como el azul
          y verde, representan menor atención. Esto nos permite identificar
          patrones de navegación y evaluar si los elementos clave de la
          interfaz, como botones, enlaces o contenidos principales, están
          captando la atención esperada.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Conclusión</h2>
        <p style={styles.paragraph}>
          El análisis de seguimiento ocular es una herramienta poderosa para
          mejorar la usabilidad y la experiencia del usuario en páginas web. Al
          identificar patrones de mirada y ajustar el diseño en consecuencia,
          se pueden crear interfaces más intuitivas y eficientes.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Guardar Informe</h2>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={saveReportToFirebase}
        >
          Guardar Informe
        </button>
        <p style={styles.paragraph}>
          Haz clic en el botón para guardar el informe en Firebase y compartirlo con
          el analista UX.
        </p>
      </section>

    </div>
  );
};

const styles = {
  pageContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    width: "100vw",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f4f4f4",
    color: "#333",
  },
  header: {
    width: "100%",
    marginBottom: "20px",
    borderBottom: "1px solid #ddd",
    paddingBottom: "10px",
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center",
    color: "#222",
  },
  section: {
    width: "80%",
    marginBottom: "20px",
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#444",
  },
  paragraph: {
    fontSize: "18px",
    marginBottom: "10px",
    lineHeight: "1.6",
    color: "#555",
  },
  list: {
    listStyleType: "disc",
    paddingLeft: "20px",
    fontSize: "18px",
    lineHeight: "1.6",
    color: "#555",
  },
  chartContainer: {
    width: "100%",
    height: "400px",
    marginBottom: "20px",
  },
};

export default InformePage;
