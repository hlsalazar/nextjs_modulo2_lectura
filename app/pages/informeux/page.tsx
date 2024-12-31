"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig"; // Ruta de firebase
import { clustersDbscan } from "@turf/clusters-dbscan";
import { featureCollection, point } from "@turf/helpers";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
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


  // Registrar los componentes necesarios para Chart.js
  ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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
  // Ejecutar DBSCAN
  const runDBSCAN = () => {
    if (reports.length === 0) {
      alert("No hay datos para analizar.");
      return;
    }

    const allPoints = reports.flatMap((report) =>
      report.generatedGazeData?.map((point: any) => [point.x, point.y]) || []
    );

    if (allPoints.length === 0) {
      alert("No hay puntos de mirada para procesar.");
      return;
    }

    // Convertir los puntos a GeoJSON
    const features = allPoints.map((coords) => point(coords));
    const geojson = featureCollection(features);

    // Ejecutar DBSCAN con parámetros personalizados
    const epsilon = 10; // Distancia máxima entre puntos
    const minPoints = 3; // Puntos mínimos para formar un cluster
    const clustered = clustersDbscan(geojson, epsilon, { minPoints });

    // Filtrar clusters y organizar los resultados
    const clusteredData = clustered.features.reduce(
      (acc: any[], feature: any) => {
        const clusterId = feature.properties?.cluster;
        if (clusterId !== undefined) {
          acc[clusterId] = acc[clusterId] || [];
          acc[clusterId].push(feature.geometry.coordinates);
        }
        return acc;
      },
      []
    );

    setClusters(clusteredData);
    console.log("Clusters encontrados:", clusteredData);
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchReports();
      if (data && data.length > 0) {
        calculateImportantElements(data);
      }
    };
    fetchData();
  }, []);
  

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
        </section>

        {/* Botón de expansión */}
        {reports.length > 3 && (
          <button style={styles.toggleButton} onClick={() => setShowAll((prev) => !prev)}>
            {showAll ? "Mostrar Menos" : "Mostrar Más"}
          </button>
        )}

        {/* Botón para ejecutar DBSCAN */}
        <button style={styles.toggleButton} onClick={runDBSCAN}>
          Ejecutar Clustering (DBSCAN)
        </button>

        {/* Mostrar Clusters */}
        <section style={styles.statsSection}>
          <div style={styles.statCard}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "bold" }}>Resultados de Clustering</h3>
            {clusters.length > 0 ? (
              clusters.map((cluster, index) => (
                <div key={index} style={{ marginBottom: "10px" }}>
                  <strong>Cluster {index + 1}</strong>
                  <p style={{ color: "#38a169" }}>Puntos en el Cluster: {cluster.length}</p>
                </div>
              ))
            ) : (
              <p>No se han calculado clusters.</p>
            )}
          </div>  
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



      </main>
    </div>
  );
};

export default DashboardSkeleton;
