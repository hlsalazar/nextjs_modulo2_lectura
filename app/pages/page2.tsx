"use client";

import React from 'react';
import { lusitana } from "../ui/fonts";
import GazeEventChecker from '../components/GazeEventChecker';
import MousePosition from '../components/MousePosition';

interface Point {
    x: number;
    y: number;
}

function roundToTolerance(value: number, tolerance: number): number {
    return Math.round(value / tolerance) * tolerance;
}

function getMostFrequentPoints(data: Point[], tolerance: number = 5): (Point & { count: number })[] {
    const counts: Record<string, Point & { count: number }> = {};
    data.forEach(point => {
        const roundedX = roundToTolerance(point.x, tolerance);
        const roundedY = roundToTolerance(point.y, tolerance);
        const key = `${roundedX},${roundedY}`;

        if (!counts[key]) {
            counts[key] = { x: roundedX, y: roundedY, count: 0 };
        }
        counts[key].count++;
    });

    const sortedPoints = Object.values(counts).sort((a, b) => b.count - a.count);
    return sortedPoints.slice(0, 5);
}

export default function Page() {
    const [data, setData] = React.useState<Point[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Intentando hacer fetch...");
                const res = await fetch('https://api-seguim-ocular.vercel.app/api/dataexmp');
                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }
                const json = await res.json();
                setData(json);
                console.log("Datos recibidos: ", json);
            } catch (error) {
                console.error("Error fetching data: ", error);
            }
            setIsLoading(false);
        };
        fetchData();
    }, []);
    
    const frequentPoints = getMostFrequentPoints(data);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <main>
            <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>Página de prueba</h1>
            <MousePosition />
            <GazeEventChecker gazeEvents={data} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                
                <div id="product1" className="product border p-4">
                    <img src="https://via.placeholder.com/150" alt="Product 1" />
                    <p>Producto 1</p>
                    <button id="btn1">Comprar Producto 1</button>
                </div>
                <div id="product2" className="product border p-4">
                    <img src="https://via.placeholder.com/150" alt="Product 2" />
                    <p>Producto 2</p>
                    <button id="btn2">Comprar Producto 2</button>
                </div>
                <div id="product3" className="product border p-4">
                    <img src="https://via.placeholder.com/150" alt="Product 3" />
                    <p>Producto 3</p>
                    <button id="btn3">Comprar Producto 3</button>
                </div>
                <div id="product4" className="product border p-4">
                    <img src="https://via.placeholder.com/150" alt="Product 4" />
                    <p>Producto 4</p>
                    <button id="btn4">Comprar Producto 4</button>
                </div>
            </div>
        </main>
    );
}
