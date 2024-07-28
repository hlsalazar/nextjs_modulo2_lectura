"use client";

import React from 'react';
import ExampleComponent from '../../components/ExampleComponent';
import useGazeData from '../../hooks/useGazeData';

const NewLayoutPage: React.FC = () => {
  const { rankedElements } = useGazeData();

  console.log("Fetched gaze events:", rankedElements);

  return (
    <div style={styles.pageContainer}>
      <header style={styles.header}>
        <h1>Product Page</h1>
        <nav>
          <ol>
            <li><a href="#">Home</a></li>
            <li><a href="#">Category</a></li>
            <li>Product</li>
          </ol>
        </nav>
      </header>
      <main style={styles.mainContent}>
        <ExampleComponent rankedElements={rankedElements} />
      </main>
    </div>
  );
};

const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    width: '100vw',
  },
  header: {
    width: '100%',
    marginBottom: '20px',
    borderBottom: '1px solid #ddd',
    paddingBottom: '10px',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridAutoRows: 'minmax(100px, auto)',
    gap: '20px',
    width: '100%',
  },
};

export default NewLayoutPage;
