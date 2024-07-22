// src/components/MousePosition.jsx
"use client"
import React, { useState, useEffect } from 'react';

const MousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 10, right: 10, background: '#fff', padding: '5px', borderRadius: '5px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
      <p>Mouse Position: {mousePosition.x}, {mousePosition.y}</p>
    </div>
  );
};

export default MousePosition;
