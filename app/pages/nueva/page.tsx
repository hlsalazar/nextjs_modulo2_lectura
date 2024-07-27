"use client"

import React, { useState, useEffect } from 'react';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";

const ExampleComponent = () => {
  const [divs, setDivs] = useState([]);

  useEffect(() => {
    // Obtener información de localStorage al montar el componente
    const storedDivs = JSON.parse(localStorage.getItem('previousDivs'));
    if (storedDivs) {
      setDivs(storedDivs);
    }
  }, []);

  const updateDivContents = () => {
    const storedDivs = JSON.parse(localStorage.getItem('previousDivs'));
    if (storedDivs) {
      const updatedDivs = storedDivs.map(div => ({
        ...div,
        content: div.content // Mantener el contenido original
      }));
      setDivs(updatedDivs);
    }
  };

  return (
    <div style={styles.gridContainer}>
      {divs.map((div, index) => (
        <div key={div.id} style={{ ...styles.gridItem, ...parseStyle(div.style) }}>
          <h2 style={styles.header}>Div {div.id}</h2>
          <div style={styles.contentContainer}>
            <div style={styles.innerContent} dangerouslySetInnerHTML={{ __html: div.content }} />
          </div>
          {div.id === 1 && (
            <Carousel showArrows={true} infiniteLoop={true} showThumbs={false} className="h-full">
              {JSON.parse(div.content).map((image, index) => (
                <div key={index} className="h-full">
                  <img src={image.src} alt={image.alt} className="object-cover object-center h-full" />
                </div>
              ))}
            </Carousel>
          )}
        </div>
      ))}
      <button onClick={updateDivContents}>Update Div Contents</button>
    </div>
  );
};

const parseStyle = (styleString) => {
  const style = {};
  styleString.split(';').forEach(item => {
    const [key, value] = item.split(':');
    if (key && value) {
      style[key.trim()] = value.trim();
    }
  });
  return style;
};

const styles = {
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridTemplateRows: 'auto',
    gap: '20px',
    padding: '20px',
    width: '100vw',
    justifyContent: 'center', // Centrar la rejilla horizontalmente
  },
  gridItem: {
    border: '1px solid #000',
    borderRadius: '5px',
    padding: '0', // Eliminar padding para que el contenido ocupe todo el espacio
    background: '#f0f0f0',
    textAlign: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Asegurarse de que el contenido no se salga del div
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  innerContent: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover', // Asegurarse de que la imagen ocupe todo el contenedor
  },
  header: {
    margin: '0 0 10px 0',
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
