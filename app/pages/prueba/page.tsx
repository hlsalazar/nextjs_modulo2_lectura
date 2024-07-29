"use client";

import React, { useEffect, useState } from 'react';

export default function Nueva() {
    const [content, setContent] = useState<string[]>([]);

    useEffect(() => {
        const storedContent = localStorage.getItem('pageContent');
        if (storedContent) {
            setContent(JSON.parse(storedContent));
        }
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Contenido Transferido</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.map((html, index) => (
                    <div key={index} dangerouslySetInnerHTML={{ __html: html }} className="p-4 border rounded shadow-md"></div>
                ))}
            </div>
        </div>
    );
}
