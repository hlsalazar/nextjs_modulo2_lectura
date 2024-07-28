"use client";

import React, { useEffect, useState } from 'react';
import { lusitana } from "../ui/fonts";
import GazeEventChecker from '../components/GazeEventChecker';
import MousePosition from '../components/MousePosition';
import { StarIcon } from '@heroicons/react/20/solid';
import { Radio, RadioGroup } from '@headlessui/react';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from 'react-responsive-carousel';
import Link from 'next/link';

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

const product = {
    name: 'Basic Tee 6-Pack',
    price: '$192',
    href: '#',
    breadcrumbs: [
        { id: 1, name: 'Men', href: '#' },
        { id: 2, name: 'Clothing', href: '#' },
    ],
    images: [
        {
            src: 'https://tailwindui.com/img/ecommerce-images/product-page-02-secondary-product-shot.jpg',
            alt: 'Two each of gray, white, and black shirts laying flat.',
        },
        {
            src: 'https://tailwindui.com/img/ecommerce-images/product-page-02-tertiary-product-shot-01.jpg',
            alt: 'Model wearing plain black basic tee.',
        },
        {
            src: 'https://tailwindui.com/img/ecommerce-images/product-page-02-tertiary-product-shot-02.jpg',
            alt: 'Model wearing plain gray basic tee.',
        },
        {
            src: 'https://tailwindui.com/img/ecommerce-images/product-page-02-featured-product-shot.jpg',
            alt: 'Model wearing plain white basic tee.',
        },
    ],
    colors: [
        { name: 'White', class: 'bg-white', selectedClass: 'ring-gray-400' },
        { name: 'Gray', class: 'bg-gray-200', selectedClass: 'ring-gray-400' },
        { name: 'Black', class: 'bg-gray-900', selectedClass: 'ring-900' },
    ],
    sizes: [
        { name: 'XXS', inStock: false },
        { name: 'XS', inStock: true },
        { name: 'S', inStock: true },
        { name: 'M', inStock: true },
        { name: 'L', inStock: true },
        { name: 'XL', inStock: true },
        { name: '2XL', inStock: true },
        { name: '3XL', inStock: true },
    ],
    description: 'The Basic Tee 6-Pack allows you to fully express your vibrant personality with three grayscale options. Feeling adventurous? Put on a heather gray tee. Want to be a trendsetter? Try our exclusive colorway: "Black". Need to add an extra pop of color to your outfit? Our white tee has you covered.',
    highlights: [
        'Hand cut and sewn locally',
        'Dyed with our proprietary colors',
        'Pre-washed & pre-shrunk',
        'Ultra-soft 100% cotton',
    ],
    details: 'The 6-Pack includes two black, two white, and two heather gray Basic Tees. Sign up for our subscription service and be the first to get new, exciting colors, like our upcoming "Charcoal Gray" limited release.',
}
const reviews = { href: '#', average: 4, totalCount: 117 }

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function Page() {
    const [data, setData] = useState<Point[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedColor, setSelectedColor] = useState(product.colors[0]);
    const [selectedSize, setSelectedSize] = useState(product.sizes[2]);
    const [elementsWithPoints, setElementsWithPoints] = useState<{ id: string, points: Point[] }[]>([]);
    const [showHighlightedPage, setShowHighlightedPage] = useState(false);
    const [showMatchingElements, setShowMatchingElements] = useState(false); // Estado para controlar la visibilidad del recuadro azul

    useEffect(() => {
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

    useEffect(() => {
        if (!isLoading && data.length > 0) {
            const elements = document.querySelectorAll<HTMLElement>(
                "[id^='image'], #product-name, #product-price, #reviews-link, #color-label, [id^='color-span-'], #size-label, #size-guide, [id^='size-span-'], #add-to-bag-button, #description-text, #highlights-list, [id^='highlight-span-'], #details-text"
            );
            const elementsArray = Array.from(elements);

            const elementsPoints: { id: string, points: Point[] }[] = elementsArray.map(element => {
                const rect = element.getBoundingClientRect();
                const pointsInElement = data.filter(point => (
                    point.x >= rect.left && point.x <= rect.right &&
                    point.y >= rect.top && point.y <= rect.bottom
                ));
                return { id: element.id, points: pointsInElement };
            }).filter(item => item.points.length > 0);

            setElementsWithPoints(elementsPoints);
        }
    }, [isLoading, data]);

    const handleClick = () => {
        setShowHighlightedPage(true);
    }

    const handleClickEsconder = () => {
        setShowHighlightedPage(false);
        saveElementsToLocalStorage();
    }

    const handleShowMatchingElements = () => {
        setShowMatchingElements(true);
    }

    const handleHideMatchingElements = () => {
        setShowMatchingElements(false);
    }

    const saveElementsToLocalStorage = () => {
        const elements = document.querySelectorAll<HTMLElement>(
            "[id^='image'], #product-name, #product-price, #reviews-link, #color-label, [id^='color-span-'], #size-label, #size-guide, [id^='size-span-'], #add-to-bag-button, #description-text, #highlights-list, [id^='highlight-span-'], #details-text"
        );

        const elementsArray = Array.from(elements);
        const elementsData = elementsArray.map(element => {
            const matchedElement = elementsWithPoints.find(e => e.id === element.id);
            return {
                id: element.id,
                content: element.innerHTML,
                style: window.getComputedStyle(element).cssText,
                points: matchedElement ? matchedElement.points : []
            };
        });

        localStorage.setItem('previousDivs', JSON.stringify(elementsData));
        console.log('Elementos guardados en localStorage:', elementsData);
        console.log('ElementsWithPoints guardado en localStorage:', elementsWithPoints);
    }

    if (isLoading) {
        return <div id="loading">Loading...</div>;
    }

    return (
        <div>
            {!showHighlightedPage ? (
                <main id="main-content" className="flex h-screen items-center justify-center p-2">
                    <h1 id="page-title" className={`${lusitana.className} mb-2 text-lg`}>Página de prueba</h1>
                    <MousePosition />
                    <GazeEventChecker gazeEvents={data} />

                    <div className="flex w-full h-full max-w-screen-xl">
                        <div id="image-gallery" className="flex-1 h-full p-2">
                            <Carousel showArrows={true} infiniteLoop={true} showThumbs={false} className="h-full">
                                {product.images.map((image, index) => (
                                    <div key={index} className="h-full">
                                        <img src={image.src} alt={image.alt} className="object-cover object-center h-full border border-red-500" />
                                        <p className="text-xs text-red-500">{`ID: image${index + 1}`}</p>
                                    </div>
                                ))}
                            </Carousel>
                        </div>

                        <div id="product-details" className="flex-1 h-full overflow-auto bg-white p-2">
                            <div id="product-header" className="pt-2">
                                <nav id="breadcrumb-nav" aria-label="Breadcrumb" className="text-xs">
                                    <ol id="breadcrumb-list" role="list" className="flex items-center space-x-1">
                                        {product.breadcrumbs.map((breadcrumb) => (
                                            <li id={`breadcrumb-item-${breadcrumb.id}`} key={breadcrumb.id}>
                                                <div className="flex items-center">
                                                    <a id={`breadcrumb-link-${breadcrumb.id}`} href={breadcrumb.href} className="mr-1 text-gray-900">
                                                        {breadcrumb.name}
                                                    </a>
                                                    <svg
                                                        fill="currentColor"
                                                        width={10}
                                                        height={12}
                                                        viewBox="0 0 16 20"
                                                        aria-hidden="true"
                                                        className="h-3 w-2 text-gray-300"
                                                    >
                                                        <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
                                                    </svg>
                                                </div>
                                            </li>
                                        ))}
                                        <li id="current-product" className="text-xs">
                                            <a id="current-product-link" href={product.href} aria-current="page" className="text-gray-500 hover:text-gray-600">
                                                {product.name}
                                            </a>
                                        </li>
                                    </ol>
                                </nav>

                                <div id="product-info" className="grid gap-x-2 gap-y-4 p-2 sm:px-4 lg:grid-cols-1 lg:gap-x-4 lg:px-4">
                                    <div id="product-name-container" className="lg:border-r lg:border-gray-200 lg:pr-2">
                                        <h1 id="product-name" className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl border border-red-500 p-1">{product.name}</h1>
                                        <p className="text-xs text-red-500">{`ID: product-name`}</p>
                                    </div>

                                    <div id="product-options">
                                        <h2 id="product-information" className="sr-only">Product information</h2>
                                        <p id="product-price" className="text-xl tracking-tight text-gray-900 border border-red-500 p-1">{product.price}</p>
                                        <p className="text-xs text-red-500">{`ID: product-price`}</p>

                                        <div id="product-reviews" className="mt-2">
                                            <h3 className="sr-only">Reviews</h3>
                                            <div id="reviews-container" className="flex items-center">
                                                <div id="star-rating" className="flex items-center">
                                                    {[0, 1, 2, 3, 4].map((rating) => (
                                                        <StarIcon
                                                            id={`star-${rating}`}
                                                            key={rating}
                                                            aria-hidden="true"
                                                            className={classNames(
                                                                reviews.average > rating ? 'text-gray-900' : 'text-gray-200',
                                                                'h-4 w-4 flex-shrink-0',
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                <p id="star-summary" className="sr-only">{reviews.average} out of 5 stars</p>
                                                <a id="reviews-link" href={reviews.href} className="ml-2 text-xs font-medium text-indigo-600 hover:text-indigo-500 border border-red-500 p-1">
                                                    {reviews.totalCount} reviews
                                                </a>
                                                <p className="text-xs text-red-500">{`ID: reviews-link`}</p>
                                            </div>
                                        </div>

                                        <form id="product-form" className="mt-2">
                                            <div id="color-options">
                                                <h3 id="color-label" className="text-xs font-medium text-gray-900 border border-red-500 p-1">Color</h3>

                                                <fieldset id="color-fieldset" aria-label="Choose a color" className="mt-1">
                                                    <RadioGroup id="color-radio-group" value={selectedColor} onChange={setSelectedColor} className="flex items-center space-x-1">
                                                        {product.colors.map((color) => (
                                                            <Radio
                                                                id={`color-radio-${color.name}`}
                                                                key={color.name}
                                                                value={color}
                                                                aria-label={color.name}
                                                                className={classNames(
                                                                    color.selectedClass,
                                                                    'relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 focus:outline-none data-[checked]:ring-2 data-[focus]:data-[checked]:ring data-[focus]:data-[checked]:ring-offset-1',
                                                                )}
                                                            >
                                                                <span
                                                                    id={`color-span-${color.name}`}
                                                                    aria-hidden="true"
                                                                    className={classNames(
                                                                        color.class,
                                                                        'h-4 w-4 rounded-full border border-black border-opacity-10',
                                                                        'border border-red-500'
                                                                    )}
                                                                />
                                                            </Radio>
                                                        ))}
                                                    </RadioGroup>
                                                    <p className="text-xs text-red-500">{`ID: color-radio-group`}</p>
                                                </fieldset>
                                            </div>

                                            <div id="size-options" className="mt-2">
                                                <div id="size-header" className="flex items-center justify-between">
                                                    <h3 id="size-label" className="text-xs font-medium text-gray-900 border border-red-500 p-1">Size</h3>
                                                    <a id="size-guide" href="#" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 border border-red-500 p-1">
                                                        Size guide
                                                    </a>
                                                </div>

                                                <fieldset id="size-fieldset" aria-label="Choose a size" className="mt-1">
                                                    <RadioGroup
                                                        id="size-radio-group"
                                                        value={selectedSize}
                                                        onChange={setSelectedSize}
                                                        className="grid grid-cols-4 gap-1 sm:grid-cols-8 lg:grid-cols-4"
                                                    >
                                                        {product.sizes.map((size) => (
                                                            <Radio
                                                                id={`size-radio-${size.name}`}
                                                                key={size.name}
                                                                value={size}
                                                                disabled={!size.inStock}
                                                                className={classNames(
                                                                    size.inStock
                                                                        ? 'cursor-pointer bg-white text-gray-900 shadow-sm'
                                                                        : 'cursor-not-allowed bg-gray-50 text-gray-200',
                                                                    'group relative flex items-center justify-center rounded-md border px-2 py-1 text-xs font-medium uppercase hover:bg-gray-50 focus:outline-none data-[focus]:ring-2 data-[focus]:ring-indigo-500 sm:flex-1 sm:py-3',
                                                                    'border border-red-500'
                                                                )}
                                                            >
                                                                <span id={`size-span-${size.name}`}>{size.name}</span>
                                                                {size.inStock ? (
                                                                    <span
                                                                        id={`size-instock-span-${size.name}`}
                                                                        aria-hidden="true"
                                                                        className="pointer-events-none absolute -inset-px rounded-md border-2 border-transparent group-data-[focus]:border group-data-[checked]:border-indigo-500"
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        id={`size-outstock-span-${size.name}`}
                                                                        aria-hidden="true"
                                                                        className="pointer-events-none absolute -inset-px rounded-md border-2 border-gray-200"
                                                                    >
                                                                        <svg
                                                                            id={`size-outstock-svg-${size.name}`}
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 100 100"
                                                                            preserveAspectRatio="none"
                                                                            className="absolute inset-0 h-full w-full stroke-2 text-gray-200"
                                                                        >
                                                                            <line x1={0} x2={100} y1={100} y2={0} vectorEffect="non-scaling-stroke" />
                                                                        </svg>
                                                                    </span>
                                                                )}
                                                            </Radio>
                                                        ))}
                                                    </RadioGroup>
                                                    <p className="text-xs text-red-500">{`ID: size-radio-group`}</p>
                                                </fieldset>
                                            </div>

                                            <button
                                                id="add-to-bag-button"
                                                type="submit"
                                                className="mt-2 flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-1 text-xs font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 border border-red-500 p-1"
                                            >
                                                Add to bag
                                            </button>
                                            <p className="text-xs text-red-500">{`ID: add-to-bag-button`}</p>
                                        </form>
                                    </div>

                                    <div id="product-description" className="lg:border-r lg:border-gray-200 lg:pr-2">
                                        <div id="description-container">
                                            <h3 id="description-label" className="sr-only">Description</h3>

                                            <div id="description-content" className="space-y-1">
                                                <p id="description-text" className="text-xs text-gray-900 border border-red-500 p-1">{product.description}</p>
                                            </div>
                                        </div>

                                        <div id="highlights-container" className="mt-2">
                                            <h3 id="highlights-label" className="text-xs font-medium text-gray-900 border border-red-500 p-1">Highlights</h3>

                                            <div id="highlights-content" className="mt-1">
                                                <ul id="highlights-list" role="list" className="list-disc space-y-1 pl-2 text-xs">
                                                    {product.highlights.map((highlight) => (
                                                        <li id={`highlight-item-${highlight}`} key={highlight} className="text-gray-400">
                                                            <span id={`highlight-span-${highlight}`} className="text-gray-600 border border-red-500 p-1">{highlight}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div id="details-container" className="mt-2">
                                            <h2 id="details-label" className="text-xs font-medium text-gray-900 border border-red-500 p-1">Details</h2>

                                            <div id="details-content" className="mt-1 space-y-1">
                                                <p id="details-text" className="text-xs text-gray-600 border border-red-500 p-1">{product.details}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="matching-elements" style={{ display: 'none' }} className="bg-blue-500 text-white p-2 mt-2 w-full">
                        <h2 className="text-sm font-bold mb-2">Elementos con puntos coincidentes:</h2>
                        {elementsWithPoints.length > 0 ? (
                            elementsWithPoints.map(element => (
                                <div key={element.id} className="mb-1">
                                    <h3 className="font-semibold">{element.id}</h3>
                                    <ul className="list-disc list-inside">
                                        {element.points.map((point, index) => (
                                            <li key={index}>x: {point.x}, y: {point.y}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <p>No hay puntos coincidentes.</p>
                        )}
                    </div>

                    {/* Botón adicional */}
                    <button onClick={handleClick} className="mt-4 inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                        Ver Elementos Resaltados
                    </button>

                    <button onClick={handleClickEsconder} className="mt-4 inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                        Generar Sugerencia
                    </button>
                </main>
            ) : (
                <main className="flex flex-col items-center justify-center p-4">
                    <h1 className="text-2xl font-bold mb-4">Página con Elementos Resaltados</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-screen-lg">
                        {elementsWithPoints.map(element => (
                            <div key={element.id} id={element.id} className="bg-yellow-300 p-4 rounded shadow-lg">
                                <h2 className="font-bold text-lg mb-2">Elemento {element.id}</h2>
                                <p>{element.points.length} puntos coincidentes</p>
                            </div>
                        ))}
                        <Link href="/highlighted-elements" legacyBehavior>
                            <a className="mt-4 inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                                Ir a página de elementos resaltados
                            </a>
                        </Link>
                    </div>

                    <button onClick={handleClickEsconder} className="mt-4 inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                        Generar Sugerencia
                    </button>

                    {/* Botón para mostrar el recuadro azul */}
                    <button onClick={handleShowMatchingElements} className="mt-4 inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                        Mostrar
                    </button>

                    {/* Rercuadro azul */}
                    {showMatchingElements && (
                        <div className="bg-blue-500 text-white p-4 mt-4 rounded shadow-lg relative">
                            <button onClick={handleHideMatchingElements} className="absolute top-0 right-0 mt-2 mr-2 text-white">
                                X
                            </button>
                            <h2 className="text-sm font-bold mb-2">Elementos con puntos coincidentes:</h2>
                            {elementsWithPoints.length > 0 ? (
                                elementsWithPoints.map(element => (
                                    <div key={element.id} className="mb-1">
                                        <h3 className="font-semibold">{element.id}</h3>
                                        <ul className="list-disc list-inside">
                                            {element.points.map((point, index) => (
                                                <li key={index}>x: {point.x}, y: {point.y}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))
                            ) : (
                                <p>No hay puntos coincidentes.</p>
                            )}
                        </div>
                    )}
                </main>
            )}
        </div>
    );
}
