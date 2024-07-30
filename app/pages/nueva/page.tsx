"use client";

import React, { useEffect, useState } from 'react';
import ExampleComponent from '../../components/ExampleComponent';
import useGazeData from '../../hooks/useGazeData';
import Link from 'next/link';

const CombinedPage: React.FC = () => {
  const { rankedElements } = useGazeData();
  const [content, setContent] = useState<string[]>([]);
  const [matchingElementIds, setMatchingElementIds] = useState<string[]>([]);

  useEffect(() => {
    const storedContent = localStorage.getItem('pageContent');
    const storedMatchingElementIds = localStorage.getItem('matchingElementIds');
    if (storedContent) {
      setContent(JSON.parse(storedContent));
    }
    if (storedMatchingElementIds) {
      setMatchingElementIds(JSON.parse(storedMatchingElementIds));
    }
  }, []);

  const processContent = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    matchingElementIds.forEach(id => {
      const element = doc.getElementById(id);
      if (element) {
        element.style.border = '2px solid red';
      }
    });
    
    return doc.body.innerHTML;
  };

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
        <Link href="/highlighted-elements" legacyBehavior>
          <a className="mt-4 inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            Ir a página de elementos resaltados
          </a>
        </Link>
      </main>
      <section className="p-4">
        <h1 className="text-2xl font-bold mb-4">Contenido Transferido</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.map((html, index) => (
            <div key={index} dangerouslySetInnerHTML={{ __html: processContent(html) }} className="p-4 border rounded shadow-md"></div>
          ))}
        </div>
      </section>
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

export default CombinedPage;
