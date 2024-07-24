"use client";

import React from 'react';

const NuevaPagina = () => {
    return (
        <main className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
            <h1 className="text-3xl font-bold mb-4">Nueva Página</h1>
            <p className="text-lg text-gray-700">Este es un contenido muy simple de una nueva página.</p>
            <a href="/" className="mt-4 inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                Volver a la página principal
            </a>
        </main>
    );
}

export default NuevaPagina;
