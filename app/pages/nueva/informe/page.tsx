"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { Scatter } from "react-chartjs-2";
import "chart.js/auto";
import h337 from "heatmap.js"; // Importa heatmap.js
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig"; // Ruta de tu archivo firebaseConfig
import { interpolateRgb } from "d3-interpolate"; // Necesitarás d3-interpolate para colores suaves
import { TooltipItem } from "chart.js";



Chart.register(...registerables);

interface Point {
  x: number;
  y: number;
}

// Función para normalizar los puntos dentro de las dimensiones dinámicas del contenedor
const normalizePoints = (points: Point[], width: number, height: number) => {
  const maxX = Math.max(...points.map((p) => p.x), 1);
  const maxY = Math.max(...points.map((p) => p.y), 1);
  const scaleFactorX = width / maxX;
  const scaleFactorY = height / maxY;

  return points.map((point) => ({
    x: Math.floor(point.x * scaleFactorX),
    y: Math.floor(point.y * scaleFactorY),
    value: 1,
  }));
};

// Función para contar las repeticiones de puntos
const calculatePointIntensities = (points: Point[]) => {
  const pointMap = new Map<string, number>();

  points.forEach((point) => {
    // Redondear X e Y para agrupar puntos cercanos
    const roundedX = Math.round(point.x / 5) * 5; // Redondeo ajustado a múltiplos de 5
    const roundedY = Math.round(point.y / 5) * 5;

    const key = `${roundedX},${roundedY}`; // Clave única por coordenada redondeada
    pointMap.set(key, (pointMap.get(key) || 0) + 1);
  });

  // Convertir el mapa en un arreglo de puntos con intensidad
  return Array.from(pointMap.entries()).map(([key, intensity]) => {
    const [x, y] = key.split(",").map(Number);
    return { x, y, intensity }; // Devolver coordenadas e intensidad
  });
};


const InformePage: React.FC = () => {
  const heatmapContainerRef = useRef<HTMLDivElement | null>(null);
  const [generatedGazeData, setGeneratedGazeData] = useState<Point[]>([]);
  const colorScale = interpolateRgb("blue", "red"); // Degradado de azul a rojo

  const [pageGeneratedGazeData, setPageGeneratedGazeData] = useState<Point[]>(
    []
  );
  const [processedGazeData, setProcessedGazeData] = useState<
  { x: number; y: number; intensity: number }[]
>([]);

const [showPoints, setShowPoints] = useState(false); // Estado para mostrar/ocultar la lista de puntos

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
    const renderHeatmap = () => {
      if (
        typeof window !== "undefined" &&
        heatmapContainerRef.current &&
        generatedGazeData.length > 0
      ) {
        const container = heatmapContainerRef.current;

        // Obtener dimensiones dinámicas
        const containerWidth = container.offsetWidth || 600; // Default si no hay dimensiones
        const containerHeight = container.offsetHeight || 400;

        // Normalizar puntos
        const normalizedPoints = normalizePoints(
          generatedGazeData,
          containerWidth,
          containerHeight
        );

        // Limpiar contenedor previo
        container.innerHTML = "";

        // Crear mapa de calor
        const heatmapInstance = h337.create({
          container,
          radius: 20, // Ajustar el radio de los puntos
          maxOpacity: 0.8,
          blur: 0.75,
        });

        heatmapInstance.setData({
          min: 0,
          max: 10,
          data: normalizedPoints,
        });
      }
    };

    // Redibujar mapa de calor en montaje y al cambiar el tamaño de la ventana
    window.addEventListener("resize", renderHeatmap);
    renderHeatmap();

    return () => {
      window.removeEventListener("resize", renderHeatmap);
    };
  }, [generatedGazeData]);


  useEffect(() => {
    if (generatedGazeData.length > 0) {
      const updatedData = calculatePointIntensities(generatedGazeData);
      setProcessedGazeData(updatedData);
    }
  }, [generatedGazeData]); // Se recalcula cuando generatedGazeData cambia



  const scatterData = {
  datasets: [
    {
      label: "Puntos de interacción",
      data: processedGazeData.map((point) => ({
        x: Math.round(point.x / 5) * 5, // Redondeo suave
        y: Math.round(point.y / 5) * 5,
        intensity: point.intensity,
      })),
      backgroundColor: processedGazeData.map((point) => {
        if (point.intensity === 1) {
          return "rgba(0, 0, 255, 0.3)"; // Azul claro para baja interacción
        } else if (point.intensity <= 3) {
          return "rgba(255, 165, 0, 0.6)"; // Naranja para media interacción
        } else {
          return "rgba(255, 0, 0, 0.8)"; // Rojo fuerte para alta interacción
        }
      }),
      borderColor: "rgba(0, 0, 0, 0.1)", // Bordes sutiles
      pointRadius: processedGazeData.map((point) =>
        point.intensity === 1 ? 4 : Math.min(point.intensity * 2, 12)
      ), // Tamaños dinámicos, más pequeños para intensidad 1
      pointHoverRadius: 15, // Hover más grande
      pointStyle: "circle",
    },
  ],
};

  
  
  const scatterOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (tooltipItem: TooltipItem<"scatter">) => {
            const dataPoint = tooltipItem.raw as { x: number; y: number; intensity: number };
            const classification =
              dataPoint.intensity > 5
                ? "Alta Interacción 🔴"
                : dataPoint.intensity > 2
                ? "Media Interacción 🟠"
                : "Baja Interacción 🔵";
            return `📍 Coordenadas: X = ${dataPoint.x}, Y = ${dataPoint.y}
  📊 Intensidad: ${dataPoint.intensity} (${classification})`;
          },
        },
      },
      legend: {
        display: true,
        position: "top",
        labels: {
          usePointStyle: true,
          font: { size: 14 },
          generateLabels: () => [
            { text: "Alta Interacción (Rojo)", fillStyle: "rgba(255, 0, 0, 0.8)" },
            { text: "Media Interacción (Naranja)", fillStyle: "rgba(255, 165, 0, 0.8)" },
            { text: "Baja Interacción (Azul)", fillStyle: "rgba(0, 0, 255, 0.8)" },
          ],
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Posición X",
          color: "#333",
          font: { size: 16, weight: "bold" },
        },
        grid: { color: "rgba(200, 200, 200, 0.1)" }, // Grid suave
      },
      y: {
        title: {
          display: true,
          text: "Posición Y",
          color: "#333",
          font: { size: 16, weight: "bold" },
        },
        grid: { color: "rgba(200, 200, 200, 0.1)" },
      },
    },
    animation: {
      duration: 1500, // Animación suave
      easing: "easeOutBounce",
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
        <button
          onClick={() => setShowPoints(!showPoints)}
          style={{
            marginBottom: "10px",
            padding: "8px 12px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
        >
          {showPoints ? "🔽 Contraer Puntos" : "🔼 Expandir Puntos"}
        </button>

        {/* Contenedor de puntos con lógica condicional */}
        {showPoints && (
          <div
            style={{
              maxHeight: "200px",
              overflowY: "auto",
              border: "1px solid #ddd",
              borderRadius: "5px",
              padding: "10px",
              backgroundColor: "#f9f9f9",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <ul style={{ paddingLeft: "20px" }}>
              {generatedGazeData.map((point, index) => (
                <li
                  key={index}
                  style={{ fontSize: "14px", color: "#555", marginBottom: "5px" }}
                >
                  X: {point.x}, Y: {point.y}
                </li>
              ))}
            </ul>
          </div>
          )}

      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Visualización de Datos</h2>
        <div style={styles.chartContainer}>
          <Scatter data={scatterData} options={scatterOptions} />
        </div>
        <p style={styles.paragraph}>
          El gráfico de dispersión presenta una representación visual detallada de los puntos de mirada registrados durante la interacción del usuario con la interfaz. Cada punto corresponde a una coordenada específica (X, Y) en la pantalla, y su color e intensidad varían en función de la cantidad de veces que dicha región ha sido visualizada.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Mapa de Calor</h2>
        <div
          id="heatmap-container"
          ref={heatmapContainerRef}
          style={{
            width: "70%",
            height: "50vh",
            position: "relative",
            backgroundColor: "#fff",
            border: "1px solid #ddd",
          }}
        ></div>
        <p style={styles.paragraph}>
          <br></br>
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
