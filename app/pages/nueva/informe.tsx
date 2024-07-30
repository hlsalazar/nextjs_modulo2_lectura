"use client";

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const InformePage: React.FC = () => {
    const router = useRouter();
    const [generatedGazeData, setGeneratedGazeData] = useState<{ x: number; y: number }[]>([]);
    const [pageGeneratedGazeData, setPageGeneratedGazeData] = useState<{ x: number; y: number }[]>([]);

    useEffect(() => {
        if (router.query.generatedGazeData) {
            setGeneratedGazeData(JSON.parse(router.query.generatedGazeData as string));
        }
        if (router.query.pageGeneratedGazeData) {
            setPageGeneratedGazeData(JSON.parse(router.query.pageGeneratedGazeData as string));
        }
    }, [router.query]);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Informe de Puntos de Mirada</h1>
            <div>
                <h2 className="text-xl font-bold mb-2">Puntos de mirada generados</h2>
                <ul>
                    {generatedGazeData.map((point, index) => (
                        <li key={index}>x: {point.x}, y: {point.y}</li>
                    ))}
                </ul>
            </div>
            <div>
                <h2 className="text-xl font-bold mb-2">Puntos de página generada</h2>
                <ul>
                    {pageGeneratedGazeData.map((point, index) => (
                        <li key={index}>x: {point.x}, y: {point.y}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default InformePage;
