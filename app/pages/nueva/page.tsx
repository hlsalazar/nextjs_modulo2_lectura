import React from 'react';

const ExampleComponent = () => {
  return (
    <div style={styles.gridContainer}>
      <div style={{ ...styles.gridItem, ...styles.square }}>
        <h2>Div 1</h2>
        <p>Este es el contenido del primer div cuadrado.</p>
      </div>
      <div style={{ ...styles.gridItem, ...styles.horizontal }}>
        <h2>Div 2</h2>
        <p>Este es el contenido del segundo div horizontal.</p>
      </div>
      <div style={{ ...styles.gridItem, ...styles.vertical }}>
        <h2>Div 3</h2>
        <p>Este es el contenido del tercer div vertical.</p>
      </div>
      <div style={{ ...styles.gridItem, ...styles.square }}>
        <h2>Div 4</h2>
        <p>Este es el contenido del cuarto div cuadrado.</p>
      </div>
      <div style={{ ...styles.gridItem, ...styles.horizontal }}>
        <h2>Div 5</h2>
        <p>Este es el contenido del quinto div horizontal.</p>
      </div>
      <div style={{ ...styles.gridItem, ...styles.vertical }}>
        <h2>Div 6</h2>
        <p>Este es el contenido del sexto div vertical.</p>
      </div>
      <div style={{ ...styles.gridItem, ...styles.square }}>
        <h2>Div 7</h2>
        <p>Este es el contenido del séptimo div cuadrado.</p>
      </div>
    </div>
  );
};

const styles = {
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)', // Cuatro columnas de igual tamaño
    gridTemplateRows: 'repeat(3, 1fr)', // Tres filas de igual tamaño
    gap: '20px',
    padding: '20px',
    height: '100vh', // Ocupa toda la altura de la pantalla
    width: '100vw', // Ocupa todo el ancho de la pantalla
  },
  gridItem: {
    border: '1px solid #000',
    borderRadius: '5px',
    padding: '20px',
    background: '#f0f0f0',
    textAlign: 'center',
    boxSizing: 'border-box', // Asegura que padding y border se incluyan en el tamaño total
  },
  square: {
    gridColumn: 'span 1', // Ocupa una columna
    gridRow: 'span 1', // Ocupa una fila
  },
  horizontal: {
    gridColumn: 'span 2', // Ocupa dos columnas
    gridRow: 'span 1', // Ocupa una fila
  },
  vertical: {
    gridColumn: 'span 1', // Ocupa una columna
    gridRow: 'span 2', // Ocupa dos filas
  },
};

export default ExampleComponent;
