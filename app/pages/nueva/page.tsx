"use client"

import React, { useState } from 'react';

const ExampleComponent = () => {
  const initialDivs = [
    { id: 1, content: 'Este es el contenido del primer div cuadrado.', style: 'square' },
    { id: 2, content: 'Este es el contenido del segundo div horizontal.', style: 'horizontal' },
    { id: 3, content: 'Este es el contenido del tercer div vertical.', style: 'vertical' },
    { id: 4, content: 'Este es el contenido del cuarto div cuadrado.', style: 'square' },
    { id: 5, content: 'Este es el contenido del quinto div horizontal.', style: 'horizontal' },
    { id: 6, content: 'Este es el contenido del sexto div vertical.', style: 'vertical' },
    { id: 7, content: 'Este es el contenido del séptimo div cuadrado.', style: 'square' }
  ];

  const [divs, setDivs] = useState(initialDivs);

  const updateDivContents = () => {
    const updatedDivs = divs.map(div => ({
      ...div,
      content: `Div ${div.id} con un nuevo número aleatorio: ${Math.floor(Math.random() * 101)}.`
    }));
    setDivs(updatedDivs);
  };

  return (
    <div style={styles.gridContainer}>
      {divs.map(div => (
        <div key={div.id} style={{ ...styles.gridItem, ...styles[div.style] }}>
          <h2>Div {div.id}</h2>
          <p>{div.content}</p>
        </div>
      ))}
      <button onClick={updateDivContents}>Update Div Contents</button>
    </div>
  );
};

const styles = {
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridTemplateRows: 'repeat(3, 1fr)',
    gap: '20px',
    padding: '20px',
    height: '100vh',
    width: '100vw',
  },
  gridItem: {
    border: '1px solid #000',
    borderRadius: '5px',
    padding: '20px',
    background: '#f0f0f0',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  square: {
    gridColumn: 'span 1',
    gridRow: 'span 1',
  },
  horizontal: {
    gridColumn: 'span 2',
    gridRow: 'span 1',
  },
  vertical: {
    gridColumn: 'span 1',
    gridRow: 'span 2',
  },
};

export default ExampleComponent;
