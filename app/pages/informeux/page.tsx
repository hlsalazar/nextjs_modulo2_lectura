"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig" //Ruta de firebase
import { clustersDbscan } from "@turf/clusters-dbscan";
import { featureCollection, point } from "@turf/helpers";

interface MostViewedElement {
  id: string;
  viewCount: number;
  content: string;
}

interface Report {
  id: string; // o el tipo de dato que tenga el ID
  mostViewedElements?: MostViewedElement[];
  [key: string]: any; // Si hay más campos, usa un índice flexible
}

const DashboardSkeleton: React.FC = () => {
  const [ reports, setReports ] = useState<any[]>([]);
  const [ loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [clusters, setClusters] = useState<any[]>([]);
  const [overallMostViewed, setOverallMostViewed] = useState<any[]>([]);



  //Funcion para obtener los datos de firestore
  const fetchReports = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "reports"));
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReports(data);
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  //función para calcular los elementos más vistos de todo slos registros

  const calculateOverallMostViewedElements = (reports: Report[]): { id: string; viewCount: number }[] => {
    const elementCounts = new Map<string, number>();
  
    reports.forEach((report) => {
      if (report.mostViewedElements) {
        report.mostViewedElements.forEach((element) => {
          const { id, viewCount } = element;
  
          if (elementCounts.has(id)) {
            elementCounts.set(id, elementCounts.get(id)! + viewCount);
          } else {
            elementCounts.set(id, viewCount);
          }
        });
      }
    });
  
    // Ordenar por número de vistas y devolver como un array
    return Array.from(elementCounts.entries())
      .map(([id, viewCount]) => ({ id, viewCount }))
      .sort((a, b) => b.viewCount - a.viewCount);
  };
  

  useEffect(() => {
    const fetchAndProcessReports = async () => {
      const reportsData = await fetchReports();
      if (reports?.length > 0) {
        const mostViewed = calculateOverallMostViewedElements(reports);
        console.log("Resumen general de elementos más vistos:", mostViewed);
        setOverallMostViewed(mostViewed);
      }
    };
    fetchAndProcessReports();
  }, []);
  
  

  // Función para ejecutar DBSCAN
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
    const clusteredData = clustered.features.reduce((acc: any[], feature: any) => {
      const clusterId = feature.properties?.cluster;
      if (clusterId !== undefined) {
        acc[clusterId] = acc[clusterId] || [];
        acc[clusterId].push(feature.geometry.coordinates);
      }
      return acc;
    }, []);

    setClusters(clusteredData);
    console.log("Clusters encontrados:", clusteredData);
  };
  

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
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "20px",
      marginBottom: "20px",
    },
    statCard: {
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
      textAlign: "center" as const,
    },
    statValue: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      margin: "10px 0",
    },
    statPercentage: {
      fontSize: "0.9rem",
      fontWeight: "bold",
    },
    positive: {
      color: "#38a169",
    },
    negative: {
      color: "#e53e3e",
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
    toggleButtonHover: {
      backgroundColor: "#0056b3",
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
            (showAll ? reports : reports.slice(0,3)).map((report) => (
              <div key={report.id} style={styles.statCard}>
                <h3>Reporte ID: {report.id}</h3>
                <p style={styles.statValue}>
                  Puntos de Mirada: {report.generatedGazeData?.length || 0}
                </p>
                {report.generatedGazeData && report.generatedGazeData.length > 0 ? (
                  <ul style={{ listStyleType: "none", padding: 0, fontSize: "0.9rem" }}>
                    {report.generatedGazeData.slice(0, 3).map((point: any, index: number) => (
                      <li key={index}>
                        Coordenadas: X = {point.x.toFixed(2)}, Y = {point.y.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#718096" }}>Sin datos de mirada registrados</p>
                )}
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

        {/*Botón de expansión*/}

        {reports.length > 3 && (
          <button style={styles.toggleButton} onClick={() => setShowAll((prev) => !prev)}>
            {showAll ? "Mostrar Menos" : "Mostrar Más"}
          </button>
        )}

        <section style={styles.statsSection}>
          {clusters.length > 0 ? (
            clusters.map((element, index) => (
              <div key={index} style={styles.statCard}>
                <h3>Elemento: {element.id}</h3>
                <p>Veces visto: {element.viewCount}</p>
              </div>
            ))
          ) : (
            <div style={styles.statCard}>
              <p>No se encontraron elementos más vistos.</p>
            </div>
          )}
        </section>


        {/* Botón para ejecutar DBSCAN */}
        <button style={styles.toggleButton} onClick={runDBSCAN}>
          Ejecutar Clustering (DBSCAN)
        </button>

        {/* Mostrar Clusters */}
        <section style={styles.statsSection}>
          {clusters.length > 0 ? (
            clusters.map((cluster, index) => (
              <div key={index} style={styles.statCard}>
                <h3>Cluster {index + 1}</h3>
                <p>Puntos en el Cluster: {cluster.length}</p>
              </div>
            ))
          ) : (
            <div style={styles.statCard}>
              <p>No se han calculado clusters.</p>
            </div>
          )}
        </section>


        {/* Charts Section */}
        <section style={styles.chartsSection}>
          <div style={styles.chartPlaceholder}>Chart 1</div>
          <div style={styles.chartPlaceholder}>Chart 2</div>
        </section>
      </main>
    </div>
  );
};

export default DashboardSkeleton;
