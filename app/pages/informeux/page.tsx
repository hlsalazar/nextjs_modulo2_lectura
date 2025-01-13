"use client";

import { useEffect, useState, useRef} from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig"; // Ruta de firebase
import { clustersDbscan } from "@turf/clusters-dbscan";
import { featureCollection, point } from "@turf/helpers";
import { Bar } from "react-chartjs-2";
import { Scatter } from "react-chartjs-2";
import h337 from "heatmap.js"; // Importar Heatmap.js

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  PointElement,
} from "chart.js";

import React from "react";

interface MostViewedElement {
  id: string;
  pointsCount: number;
  content: string;
}

const DashboardSkeleton: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [clusters, setClusters] = useState<any[]>([]);
  const [importantElements, setImportantElements] = useState<MostViewedElement[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null); // Estado para manejar la tarjeta expandida
  const [noisePoints, setNoisePoints] = useState<any[]>([]);
  const [preprocessedPoints, setPreprocessedPoints] = useState<any[]>([]);//estado para los puntos pre procesados
  const heatmapContainerRef = useRef<HTMLDivElement | null>(null);
  const [scatterTaskData, setScatterTaskData] = useState<any>({ datasets: [] });//estado para los puntos de tarea completadas y tiempo



  


  // Registrar los componentes necesarios para Chart.js
  ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement);

  // Función para obtener los datos de Firestore
  const fetchReports = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "reports"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(data);
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar los puntos más importantes por densidad
  const filterRelevantPoints = (points: { x: number; y: number; value: number }[], threshold: number) => {
    const densityMap = new Map<string, number>();

    points.forEach(({ x, y }) => {
      const key = `${x},${y}`;
      densityMap.set(key, (densityMap.get(key) || 0) + 1);
    });

    return points.filter(({ x, y }) => densityMap.get(`${x},${y}`)! >= threshold);
  };

  

  //Funcion para pre procesar los datos para el mapa de calor

  // Función para normalizar y preprocesar los puntos de mirada
  const preprocessGazeData = (reports: any[], containerHeight: number) => {
    const allPoints = reports.flatMap((report) =>
      Array.isArray(report.generatedGazeData)
        ? report.generatedGazeData.map(({ x, y }: { x: number; y: number }) => ({
            x: Math.round(x), // Redondear coordenadas
            y: Math.round(y - containerHeight), // Invertir el eje Y
            value: 1, // Asignar un peso inicial
          }))
        : []
    );
  
    // Filtrar puntos con densidad mínima de 3
    const filteredPoints = filterRelevantPoints(allPoints, 3);
  
    // Normalizar valores para el mapa de calor
    const maxWeight = Math.max(...filteredPoints.map((p) => p.value));
    const normalizedPoints = filteredPoints.map((p) => ({
      ...p,
      value: (p.value / maxWeight) * 100, // Escalar entre 0 y 100
    }));
  
    return normalizedPoints;
  };

  


  // Función para calcular los elementos más importantes
  const calculateImportantElements = (reports: any[]) => {
    const elementCounts = new Map<string, { pointsCount: number; content: string }>();

    reports.forEach((report) => {
      if (report.mostViewedElements) {
        report.mostViewedElements.forEach((element: MostViewedElement) => {
          const { id, pointsCount, content } = element;

          // Sumar vistas acumulativas
          if (elementCounts.has(id)) {
            const existing = elementCounts.get(id)!;
            elementCounts.set(id, {
              pointsCount: existing.pointsCount + pointsCount,
              content: existing.content,
            });
          } else {
            elementCounts.set(id, { pointsCount, content });
          }
        });
      }
    });

    // Ordenar por vistas y convertir a un array
    const sortedElements = Array.from(elementCounts.entries())
      .map(([id, { pointsCount, content }]) => ({ id, pointsCount, content }))
      .sort((a, b) => b.pointsCount - a.pointsCount);

    setImportantElements(sortedElements); // Actualiza el estado
  };

  
  const toggleExpandCard = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index); // Alternar expansión
  };

  const processTaskData = (data: any[]) => {
    const taskPoints = data
      .filter((report) => report.isCompleted && report.taskDuration) // Filtrar tareas completadas con duración
      .map((report) => ({
        x: report.taskDuration, // Duración de la tarea (minutos)
        y: 1, // Cada tarea completada cuenta como 1
      }));
  
    // Agrupar por duración y contar tareas completadas
    const aggregatedData = taskPoints.reduce((acc: { x: number; y: number }[], point) => {
      const existing = acc.find((p: any) => p.x === point.x);
      if (existing) {
        existing.y += 1; // Incrementar el conteo de tareas
      } else {
        acc.push({ ...point });
      }
      return acc;
    }, []);
  
    const scatterDataset = {
      datasets: [
        {
          label: "Relación Tareas vs. Tiempo",
          data: aggregatedData,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          pointRadius: 6,
        },
      ],
    };
  
    setScatterTaskData(scatterDataset);
  };
  


  const generateHeatmap = (containerId: string, points: { x: number; y: number; value: number }[]): void => {
    const container = document.querySelector(containerId) as HTMLElement;
    if (!container) {
      console.error(`No se encontró el contenedor con el ID: ${containerId}`);
      return;
    }
  
    const heatmapInstance = h337.create({
      container,
      radius: 30, // Ajustar el radio según la densidad
      maxOpacity: 0.7,
      minOpacity: 0.2,
      blur: 0.85,
    });
  
    const heatmapData = {
      max: Math.max(...points.map((p) => p.value)), // Valor máximo en los datos
      min: Math.min(...points.map((p) => p.value)), // Agregar el valor mínimo en los datos
      data: points.map(({ x, y, value }) => ({ x, y, value })),
    };

    console.log("Cantidad de puntos de mirada:", reports.flatMap(report => report.generatedGazeData || []).length);

    
    // Renderiza el mapa de calor
    heatmapInstance.setData(heatmapData);

  };
  
  
  

  const barData = {
    labels: importantElements.map((el) => el.id).slice(0, 5),
    datasets: [
      {
        label: "Veces vistas",
        data: importantElements.map((el) => el.pointsCount).slice(0, 5),
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Elementos más Importantes (Top 5)",
      },
    },
  };

  const scatterTaskOptions = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `Duración: ${context.raw.x} min, Tareas: ${context.raw.y}`,
        },
      },
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Relación entre Tareas Completadas y Duración",
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Duración de la Tarea (segundos)",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Cantidad de Tareas Completadas",
        },
      },
    },
  };
  
  // Ejecutar DBSCAN
  const runDBSCAN = () => {
    setClusters([]);
    setNoisePoints([]);
  
    if (reports.length === 0) {
      alert("No hay datos para analizar.");
      return;
    }
  
    // Extraer y verificar puntos de mirada
    const allPoints = reports.flatMap((report) =>
      Array.isArray(report.generatedGazeData)
        ? report.generatedGazeData.map((point: any) => [point.x, point.y])
        : []
    );
  
    if (allPoints.length === 0) {
      alert("No hay puntos de mirada para procesar.");
      return;
    }
  
    // Redondear y escalar puntos
    const roundedPoints = allPoints.map(([x, y]) => [parseFloat(x.toFixed(2)), parseFloat(y.toFixed(2))]);
    const scaledPoints = roundedPoints.map(([x, y]) => [x / 100, y / 100]); // Escalado para evitar rangos grandes
  
    // Revisar los datos de entrada
    console.log("Cantidad de puntos totales:", roundedPoints.length);
    console.log("Ejemplo de punto (original):", roundedPoints[0]);
    console.log("Ejemplo de punto (escalado):", scaledPoints[0]);
    console.log("Rango de coordenadas X (original):", {
      min: Math.min(...roundedPoints.map(([x]) => x)),
      max: Math.max(...roundedPoints.map(([x]) => x)),
    });
    console.log("Rango de coordenadas Y (original):", {
      min: Math.min(...roundedPoints.map(([, y]) => y)),
      max: Math.max(...roundedPoints.map(([, y]) => y)),
    });
  
    // Parámetros de DBSCAN
    const xRange = Math.max(...roundedPoints.map(([x]) => x)) - Math.min(...roundedPoints.map(([x]) => x));
    const yRange = Math.max(...roundedPoints.map(([, y]) => y)) - Math.min(...roundedPoints.map(([, y]) => y));
    const epsilon = 0.2; // Usar valor pequeño ya que los puntos están escalados
    const minPoints = 5; // Ajuste adecuado para conjuntos más grandes
  
    console.log("Epsilon ajustado dinámicamente:", epsilon);
  
    // Crear el FeatureCollection para DBSCAN
    const features = scaledPoints.map((coords) => point(coords));
    const geojson = featureCollection(features);
  
    // Ejecutar DBSCAN
    const clustered = clustersDbscan(geojson, epsilon, { minPoints });
  
    if (!clustered || !clustered.features) {
      console.error("DBSCAN no generó resultados. Verifica los datos de entrada y parámetros.");
      return;
    }
  
    // Agrupar resultados en clusters y puntos de ruido
    const clusteredData = clustered.features.reduce((acc: any[], feature: any) => {
      const clusterId = feature.properties?.cluster;
      if (clusterId !== undefined && clusterId !== -1) {
        acc[clusterId] = acc[clusterId] || [];
        acc[clusterId].push(feature.geometry.coordinates);
      }
      return acc;
    }, []);
  
    const noise = clustered.features
      .filter((feature: any) => feature.properties?.cluster === -1)
      .map((feature: any) => feature.geometry.coordinates);
  
    setClusters(clusteredData);
    setNoisePoints(noise);
  
    console.log("Clusters encontrados:", clusteredData);
    console.log("Cantidad de clusters:", clusteredData.length);
    console.log("Puntos de ruido:", noise.length);
  
    // Calcular métricas de los clústeres
    const clusterMetrics = clusteredData.map((cluster) => {
      const centerX = cluster.reduce((sum: number, [x]: [number, number]) => sum + x, 0) / cluster.length;
      const centerY = cluster.reduce((sum: number, [, y]: [number, number]) => sum + y, 0) / cluster.length;
  
      return {
        center: [centerX, centerY],
        size: cluster.length,
      };
    });
  
    console.log("Métricas de clústeres:", clusterMetrics);
  };
  
  
  
  const prepareScatterData = () => {
    const datasets = clusters.map((cluster, clusterIndex) => ({
      label: `Cluster ${clusterIndex + 1}`,
      data: cluster.map(([x, y]: number[]) => ({ x, y })),
      backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.6)`,
      borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, 1)`,
      pointRadius: cluster.length > 10 ? 8 : 5, // Destacar clústeres grandes
    }));
  
    if (noisePoints.length > 0) {
      datasets.push({
        label: "Ruido",
        data: noisePoints.map(([x, y]: number[]) => ({ x, y })),
        backgroundColor: "rgba(128, 128, 128, 0.6)",
        borderColor: "rgba(128, 128, 128, 1)",
        pointRadius: 5,
      });
    }
  
    return datasets;
  };
  
  

  

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchReports(); // Llama a fetchReports y obtiene los datos
      if (data && data.length > 0) {
        calculateImportantElements(data); // Calcula los elementos más importantes
        processTaskData(data); // Procesa los datos para el gráfico de relación
  
        const container = document.querySelector("#heatmapContainer") as HTMLElement;
        if (container) {
          const containerHeight = container.offsetHeight; // Aquí ya tiene una altura fija
          console.log("Altura del contenedor:", containerHeight);
  
          const processedPoints = preprocessGazeData(data, containerHeight);
          setPreprocessedPoints(processedPoints);
        } else {
          console.error("El contenedor del mapa de calor no está disponible.");
        }
      }
    };
  
    fetchData();
  }, []);
  
  

  useEffect(() => {
    if (preprocessedPoints.length > 0) {
      generateHeatmap("#heatmapContainer", preprocessedPoints);
    }
  }, [preprocessedPoints]);
  
  

  // Estilos en un objeto
  const styles = {
    container: {
      display: "flex",
      height: "100vh",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f8f9fa",
    },
    sidebar: {
      width: "250px",
      backgroundColor: "#1a202c",
      color: "#fff",
      padding: "20px",
      display: "flex",
      flexDirection: "column" as const,
      gap: "20px",
    },
    sidebarTitle: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      textAlign: "center" as const,
    },
    menuItem: {
      padding: "10px 15px",
      borderRadius: "5px",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    },
    menuItemHover: {
      backgroundColor: "#2d3748",
    },
    mainContent: {
      flex: 1,
      display: "flex",
      flexDirection: "column" as const,
      padding: "20px",
      overflowY: "auto" as const,
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    headerTitle: {
      fontSize: "1.5rem",
      fontWeight: "bold",
    },
    searchInput: {
      padding: "8px 12px",
      border: "1px solid #ccc",
      borderRadius: "5px",
    },
    statsSection: {
      padding: "20px",
      backgroundColor: "#f4f6f8",
      borderRadius: "10px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      marginBottom: "20px",
    },
    cardGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "20px",
    },
    card: {
      backgroundColor: "#e6f7ff",
      borderRadius: "10px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      padding: "15px",
      display: "flex",
      flexDirection: "column" as const,
      justifyContent: "space-between",
      transition: "all 0.3s ease",
      cursor: "pointer",
      height: "150px", // Altura inicial
      overflow: "hidden", // Oculta contenido extra cuando no está expandido
    },
    expandedCard: {
      height: "auto", // La tarjeta se expande a su altura total
      overflow: "visible", // Permite que todo el contenido se vea
    },
    
    cardHeader: {
      borderBottom: "1px solid #eaeaea",
      paddingBottom: "10px",
      marginBottom: "10px",
    },
    cardTitle: {
      fontSize: "1.2rem",
      fontWeight: "bold",
      color: "#007bff",
    },
    cardBody: {
      display: "flex",
      flexDirection: "column" as "column", // Solución aquí
      alignItems: "flex-start",
      gap: "10px",
    },
    cardContent: {
      fontSize: "0.9rem",
      color: "#555",
    },
    cardMetric: {
      fontSize: "1rem",
      fontWeight: "bold",
      color: "#28a745",
    },
    statCard: {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
      textAlign: "center" as const,
    },
    chartsSection: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
    },
    chartPlaceholder: {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
      textAlign: "center" as const,
      fontSize: "1rem",
      color: "#718096",
    },
    toggleButton: {
      padding: "10px 15px",
      backgroundColor: "#007bff",
      color: "#fff",
      borderRadius: "5px",
      border: "none",
      cursor: "pointer",
      fontWeight: "bold" as const,
      margin: "20px auto 0 auto",
      display: "block",
      transition: "background-color 0.3s ease",
    },
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <h1 style={styles.sidebarTitle}>TailAdmin</h1>
        <nav>
          <ul>
            <li style={styles.menuItem}>Dashboard</li>
            <li style={styles.menuItem}>ECommerce</li>
            <li style={styles.menuItem}>Analytics</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={styles.mainContent}>
        {/* Header */}
        <header style={styles.header}>
          <h2 style={styles.headerTitle}>Dashboard</h2>
          <input type="text" placeholder="Search..." style={styles.searchInput} />
        </header>

        {/* Statistics Cards */}
        <section style={styles.statsSection}>
          {loading ? (
            <div style={styles.statCard}>
              <h3>Cargando datos...</h3>
            </div>
          ) : reports.length > 0 ? (
            (showAll ? reports : reports.slice(0, 3)).map((report) => (
              <div key={report.id} style={styles.statCard}>
                <h3>Reporte ID: {report.id}</h3>
                <p>Puntos de Mirada: {report.generatedGazeData?.length || 0}</p>
              </div>
            ))
          ) : (
            <div style={styles.statCard}>
              <h3>No se encontraron datos</h3>
              <p style={{ color: "#e53e3e" }}>
                Asegúrate de que la colección 'reports' en Firebase contenga datos.
              </p>
            </div>
          )}
          {/* Botón de expansión */}
          {reports.length > 3 && (
            <button style={styles.toggleButton} onClick={() => setShowAll((prev) => !prev)}>
              {showAll ? "Mostrar Menos" : "Mostrar Más"}
            </button>
          )}
        </section>


        {/* Mapa de calor */}

        <section style={styles.statsSection}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "20px" }}>
            Mapa de Calor: Resumen de Puntos de Mirada
          </h3>
          <div
            id="heatmapContainer"
            style={{
              height: "400px", // Asignar una altura fija
              position: "relative",
              width: "100%",
              border: "1px solid #ccc",
            }}
          ></div>
        </section>




        {/* Botón para ejecutar DBSCAN */}
        <button style={styles.toggleButton} onClick={runDBSCAN}>
          Ejecutar Clustering (DBSCAN)
        </button>

        {/* Mostrar Clusters */}
        <section style={styles.statsSection}>
        {clusters.length > 0 ? (
          clusters.map((cluster, index) => (
            <div key={index} style={{ marginBottom: "10px" }}>
              <strong>Cluster {index + 1}</strong>
              <p style={{ color: "#38a169" }}>Puntos en el Cluster: {cluster.length}</p>
              {cluster.map((coords: number[], i: number) => (
                <span key={i} style={{ display: "block" }}>
                  ({coords[0].toFixed(2)}, {coords[1].toFixed(2)})
                </span>
              ))}
            </div>
          ))
        ) : (
          <p>No se han calculado clusters.</p>
        )}

        </section>

        <section style={styles.statsSection}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "20px" }}>
            Gráfico de Dispersión: Clústeres y Ruido
          </h3>
          {
            clusters.length > 0 || noisePoints.length > 0 ? (
              <>
                {/* Crear scatterData dinámicamente */}
                {(() => {
                  const scatterData = {
                    datasets: prepareScatterData(),
                  };
                  return (
                    <Scatter
                      data={scatterData}
                      options={{
                        plugins: {
                          tooltip: {
                            callbacks: {
                              label: (context: any) => {
                                const { x, y } = context.raw;
                                return `X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}`;
                              },
                            },
                          },
                          legend: {
                            display: true,
                            position: "top",
                          },
                          title: {
                            display: true,
                            text: "Distribución de Puntos y Clústeres (DBSCAN)",
                          },
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: "Coordenada X",
                            },
                          },
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: "Coordenada Y",
                            },
                          },
                        },
                        responsive: true,
                      }}
                    />
                  );
                })()}
              </>
            ) : (
              <p>No hay datos para mostrar en el gráfico de dispersión.</p>
            )
          }
        </section>


        
        {/* ELEMENTOS MÁS IMPORTANTE*/}

        <section style={styles.statsSection}>
          <div style={styles.statCard}>
            {importantElements.length > 0 ? (
              <>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "20px" }}>
                  Elementos más Importantes
                </h3>
                <div style={styles.cardGrid}>
                {importantElements.slice(0, 5).map((element, index) => (
                  <div
                    key={element.id}
                    style={{
                      ...styles.card,
                      height: expandedCard === index ? "auto" : "150px",
                      overflow: expandedCard === index ? "visible" : "hidden",
                    }}
                  >
                    <div style={styles.cardHeader}>
                      <strong style={styles.cardTitle}>
                        {index + 1}. {element.id}
                      </strong>
                    </div>
                    <div style={styles.cardBody}>
                      <span style={styles.cardMetric}>
                        Veces vistas: <strong>{element.pointsCount}</strong>
                      </span>
                      <p style={styles.cardContent}>
                        {expandedCard === index
                          ? element.content || "Contenido no disponible"
                          : `${element.content?.slice(0, 15) || ""}${element.content?.length > 15 ? "..." : ""}`}
                      </p>
                      {element.content && element.content.length > 15 && (
                        <span
                          style={{
                            color: "#007bff",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                          onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                        >
                          {expandedCard === index ? "Ver menos" : "Ver más"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                </div>


                {/* Gráfico de barras */}
                <div style={{ marginTop: "20px" }}>
                  <Bar
                    data={{
                      labels: importantElements.slice(0, 5).map((el) => el.id),
                      datasets: [
                        {
                          label: "Veces vistas",
                          data: importantElements.slice(0, 5).map((el) => el.pointsCount),
                          backgroundColor: [
                            "rgba(75, 192, 192, 0.6)",
                            "rgba(54, 162, 235, 0.6)",
                            "rgba(255, 206, 86, 0.6)",
                            "rgba(255, 99, 132, 0.6)",
                            "rgba(153, 102, 255, 0.6)",
                          ],
                          borderColor: [
                            "rgba(75, 192, 192, 1)",
                            "rgba(54, 162, 235, 1)",
                            "rgba(255, 206, 86, 1)",
                            "rgba(255, 99, 132, 1)",
                            "rgba(153, 102, 255, 1)",
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      plugins: {
                        legend: {
                          display: true,
                          position: "top",
                        },
                        tooltip: {
                          enabled: true,
                          callbacks: {
                            label: function (context) {
                              const elementIndex = context.dataIndex;
                              const element = importantElements[elementIndex];
                              return [
                                `Elemento: ${element.id}`,
                                `Veces vistas: ${element.pointsCount}`,
                                `Contenido: ${element.content}`,
                              ];
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: "Veces vistas",
                          },
                        },
                        x: {
                          title: {
                            display: true,
                            text: "Elementos",
                          },
                        },
                      },
                      responsive: true,
                    }}
                  />
                </div>
              </>
            ) : (
              <p>No hay elementos destacados.</p>
            )}
          </div>
        </section>
        
        {/* Gráfico de dispersión */}

        <section style={styles.statsSection}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "20px" }}>
            Relación entre Tareas Completadas y Duración
          </h3>
          {scatterTaskData.datasets.length > 0 ? (
            <Scatter data={scatterTaskData} options={scatterTaskOptions} />
          ) : (
            <p>No hay datos suficientes para mostrar el gráfico.</p>
          )}
        </section>




      </main>
    </div>
  );
};

export default DashboardSkeleton;
