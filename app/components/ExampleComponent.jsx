"use client";

import React, { useState, useEffect } from 'react';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";

const ExampleComponent = ({ rankedElements }) => {
  const [divs, setDivs] = useState([]);

  useEffect(() => {
    const storedDivs = JSON.parse(localStorage.getItem('previousDivs'));
    if (storedDivs) {
      setDivs(storedDivs);
    }
  }, []);

  const parseStyle = (styleString) => {
    const style = {};
    if (styleString) {
      styleString.split(';').forEach(item => {
        const [key, value] = item.split(':');
        if (key && value) {
          style[key.trim()] = value.trim();
        }
      });
    }
    return style;
  };

  return (
    <div style={styles.gridContainer}>
      {divs.map((div) => (
        <div
          key={div.id}
          style={{
            ...styles.gridItem,
            ...parseStyle(div.style),
            ...(rankedElements.includes(div.id) && { backgroundColor: 'yellow' }),
          }}
        >
          <h2 style={styles.header}>Div {div.id}</h2>
          {div.id === 'image-gallery' ? (
            <Carousel showArrows={true} infiniteLoop={true} showThumbs={false} className="h-full w-full">
              {isValidJSON(div.content) ? (
                JSON.parse(div.content).map((image, index) => (
                  <div key={index} className="h-full w-full">
                    <img src={image.src} alt={image.alt} className="object-cover object-center h-full w-full" />
                  </div>
                ))
              ) : (
                <div dangerouslySetInnerHTML={{ __html: div.content }} />
              )}
            </Carousel>
          ) : (
            <div style={styles.contentContainer}>
              <div style={styles.innerContent} dangerouslySetInnerHTML={{ __html: div.content }} />
            </div>
          )}
        </div>
      ))}
      <button onClick={() => setDivs(JSON.parse(localStorage.getItem('previousDivs')))}>Update Div Contents</button>
    </div>
  );
};

const isValidJSON = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

const styles = {
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridAutoRows: 'minmax(100px, auto)',
    gap: '20px',
    padding: '20px',
    width: '100vw',
    justifyContent: 'center',
  },
  gridItem: {
    border: '1px solid #000',
    borderRadius: '5px',
    padding: '0',
    background: '#f0f0f0',
    textAlign: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
};

export default ExampleComponent;
