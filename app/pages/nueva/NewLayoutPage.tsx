"use client"

import React from 'react';
import ExampleComponent from '../../components/ExampleComponent';
import useGazeData from '../../hooks/useGazeData';

const NewLayoutPage: React.FC<{ gazeEvents: any[] }> = ({ gazeEvents }) => {
  const { rankedElements } = useGazeData(gazeEvents);

  const getGridStyle = (elementId: string) => {
    const index = rankedElements.findIndex(el => el.id === elementId);
    return index < 0 ? {} : styles[`position${index + 1}`];
  };

  return (
    <div style={styles.gridContainer}>
      <ExampleComponent />
    </div>
  );
};

const styles = {
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridTemplateRows: 'auto',
    gap: '20px',
    padding: '20px',
    width: '100vw',
    justifyContent: 'center',
  },
  position1: { gridColumn: 'span 4', gridRow: 'span 2' },
  position2: { gridColumn: 'span 3', gridRow: 'span 2' },
  position3: { gridColumn: 'span 2', gridRow: 'span 2' },
  position4: { gridColumn: 'span 2', gridRow: 'span 1' },
  position5: { gridColumn: 'span 1', gridRow: 'span 1' },
};

export default NewLayoutPage;
