"use client";

import React, { useEffect, useState, useRef } from 'react';
import { lusitana } from "../ui/fonts";
import { useRouter } from 'next/navigation';
import GazeEventChecker from '../components/GazeEventChecker';
import MousePosition from '../components/MousePosition';
import { StarIcon } from '@heroicons/react/20/solid';
import { Radio, RadioGroup } from '@headlessui/react';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from 'react-responsive-carousel';
import Link from 'next/link';
import { TrashIcon } from '@heroicons/react/24/outline'; // Asegúrate de importar el ícono
import { tasks } from '../src/data/tasks';

interface Point {
    x: number;
    y: number;
}

interface GazeData {
    docX: number; // Coordenada X en el documento
    docY: number; // Coordenada Y en el documento
}

interface CartItem {
    product: string;
    color: string;
    size: string;
    image: string;
    alt: string; // Agregar la propiedad alt
}

interface Task {
    id: number;
    description: string;
    conditions: {
        size: string;
        color: string;
        imageAlt: string;
    };
    timeLimit: number;
}



function roundToTolerance(value: number, tolerance: number): number {
    return Math.round(value / tolerance) * tolerance;
}

function calculateMostViewedElements(elementsWithPoints: { id: string, points: Point[] }[]) {
    return elementsWithPoints.map(element => ({
        id: element.id,
        pointsCount: element.points.length, // Número de puntos asociados al elemento
        content: document.getElementById(element.id)?.textContent || "Sin descripción", // Contenido del elemento
    })).sort((a, b) => b.pointsCount - a.pointsCount); // Ordenar por número de puntos de mayor a menor
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
            src: 'https://tailwindui.com/plus/img/ecommerce-images/product-page-02-secondary-product-shot.jpg',
            alt: 'Two each of gray, white, and black shirts laying flat.',
        },
        {
            src: 'https://tailwindui.com/plus/img/ecommerce-images/product-page-02-tertiary-product-shot-01.jpg',
            alt: 'Model wearing plain black basic tee.',
        },
        {
            src: 'https://tailwindui.com/plus/img/ecommerce-images/product-page-02-tertiary-product-shot-02.jpg',
            alt: 'Model wearing plain gray basic tee.',
        },
        {
            src: 'https://tailwindui.com/plus/img/ecommerce-images/product-page-02-featured-product-shot.jpg',
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
    const [cartItems, setCartItems] = useState<CartItem[]>([]); // Estado tipado
    const [activeImageIndex, setActiveImageIndex] = useState(0); // Índice de la imagen activa
    const [isModalOpen, setIsModalOpen] = useState(false); // activa el estado de el modal
    const [taskCode, setTaskCode] = useState("");
    const [taskInstruction, setTaskInstruction] = useState("");


    const [isCartOpen, setIsCartOpen] = useState(false); // Controla el modal

    // Función para manejar el clic en "Recolectar Puntos"
    const handleRecolectarPuntos = () => {
        setIsModalOpen(true); // Abre el modal
    };

    // Función para cerrar el modal y continuar con el flujo
    const handleCloseModal = () => {
        setIsModalOpen(false);
        iniciarRecoleccion(); // Llama a tu función de recolección de puntos existente
        setTaskInstruction(""); // Limpiar la instrucción mostrada
        setStartTime(new Date());    // Guarda la hora actual como inicio

    };

    const handleStartTask = () => {
        const task = tasks.find((t) => t.id === parseInt(taskCode));
        console.log("Tarea seleccionada:", taskCode);


        if (task) {
            setTaskInstruction(task.description);
        } else {
            alert("Código de tarea no válido. Inténtalo nuevamente.");
        }
    };


    const handleCompleteTask = () => {
        if (startTime) {
            const endTime = new Date();
            const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000); // Duración en segundos
            setTaskDuration(duration); // Actualiza el estado para otros usos
            sessionStorage.setItem("taskDuration", duration.toString()); // Almacena directamente en sessionStorage
            console.log(`Tiempo total de tarea: ${duration} segundos`);
        } else {
            console.warn("No se ha iniciado la tarea correctamente.");
            alert("Error interno: La tarea no ha comenzado correctamente.");
        }
    };
    
    
    
    
    
    const toggleCartModal = () => {
        setIsCartOpen(!isCartOpen); // Alterna la visibilidad del modal
    };


    const [showGazePoints, setShowGazePoints] = useState(true);

    // Estados para calibración y recolección de puntos de mirada
    const [gazeDataArray, setGazeDataArray] = useState<Point[]>([]);
    const collectingRef = useRef(false); // Mantiene el valor actual de `collecting`
    const [collecting, setCollecting] = useState(false);
    const [calibrationComplete, setCalibrationComplete] = useState(false);
    const [startTime, setStartTime] = useState<Date | null>(null); // Guarda la hora de inicio
    const [taskDuration, setTaskDuration] = useState<number | null>(null); // Guarda la duración


    const router = useRouter();

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
        if (!isLoading && gazeDataArray.length > 0) {
            const elements = document.querySelectorAll<HTMLElement>(
                "[id^='image'], #product-name, #product-price, #reviews-link, #color-label, [id^='color-span-'], #size-label, #size-guide, [id^='size-span-'], #add-to-bag-button, #description-text, #highlights-list, [id^='highlight-span-'], #details-text"
            );
    
            const elementsArray = Array.from(elements);
    
            const elementsPoints: { id: string, points: Point[] }[] = elementsArray.map(element => {
                const rect = element.getBoundingClientRect();
                const pointsInElement = gazeDataArray.filter(point => (
                    point.x >= rect.left && point.x <= rect.right &&
                    point.y >= rect.top && point.y <= rect.bottom
                ));
                return { id: element.id, points: pointsInElement };
            }).filter(item => item.points.length > 0);
    
            setElementsWithPoints(elementsPoints);
    
            // Calcular elementos más vistos y guardar en sessionStorage
            const mostViewedElements = calculateMostViewedElements(elementsPoints);
            console.log('Elementos más vistos:', mostViewedElements);
            sessionStorage.setItem('mostViewedElements', JSON.stringify(mostViewedElements));
        }
    }, [isLoading, gazeDataArray]);

    useEffect(() => {
        const storedCart = sessionStorage.getItem("cartItems");
        if (storedCart) {
            setCartItems(
                JSON.parse(storedCart).map((item: Partial<CartItem>) => ({
                    product: item.product || "Producto desconocido",
                    color: item.color || "Color no especificado",
                    size: item.size || "Talla no especificada",
                    image: item.image || "https://via.placeholder.com/50", // Fallback para imágenes
                }))
            );
        }
    }, []);

    

    

    useEffect(() => {
        if (taskDuration === null) return; // No hacer nada si taskDuration no está definido
    
        const selectedTask = tasks.find((t) => t.id === parseInt(taskCode));
    
        if (!selectedTask) {
            console.warn("No se encontró una tarea con el código ingresado.");
            alert("Código de tarea no válido. Inténtalo nuevamente.");
            return;
        }
    
        if (cartItems.length === 0) {
            console.warn("No hay elementos en el carrito para comparar.");
            alert("No se encontraron elementos en el carrito.");
            return;
        }
    
        // Normalizar y comparar
        const normalize = (str: string) => (str || "").trim().toLowerCase();
    
        const matchedItem = cartItems.find(
            (item) =>
                normalize(item.size) === normalize(selectedTask.conditions.size) &&
                normalize(item.color) === normalize(selectedTask.conditions.color) &&
                normalize(item.alt) === normalize(selectedTask.conditions.imageAlt)
        );
    
        console.log("item info:", selectedTask.conditions.size, selectedTask.conditions.color, selectedTask.conditions.imageAlt);
        console.log("Cart Items:", cartItems);
        console.log("Matched Item:", matchedItem);
    
        if (!matchedItem) {
            console.warn("No se encontraron elementos coincidentes en el carrito.");
            alert("Tarea no completada. No hay coincidencias en el carrito.");
            return;
        }
    
        const isCompleted = taskDuration <= selectedTask.timeLimit;
    
        sessionStorage.setItem(
            `task_status`,
            JSON.stringify({ completed: isCompleted, taskDuration })
        );
    
        if (isCompleted) {
            alert(`¡Tarea completada con éxito en ${taskDuration} segundos!`);
            console.log(`Tarea completada: ${isCompleted}`);
        } else {
            alert(`Tarea no completada. Tiempo límite: ${selectedTask.timeLimit} segundos.`);
        }

        //funcion para generar sugerencia
        handleGenerateSuggestion();
    }, [taskDuration]);
    
    
    
    

    useEffect(() => {
        const storedGazeData = sessionStorage.getItem("gazeDataArray");
        if (storedGazeData) {
            setGazeDataArray(JSON.parse(storedGazeData));
            console.log("Datos de mirada cargados desde sessionStorage.");
        } else {
            console.log("No se encontraron datos de mirada en sessionStorage.");
        }
    }, []);
    

    useEffect(() => {
        const isFirstRun = sessionStorage.getItem("firstRun");
    
        if (!isFirstRun) {
            // Limpia los datos de mirada y carrito la primera vez
            sessionStorage.removeItem("gazeDataArray"); // Limpia datos de mirada
            sessionStorage.removeItem("cartItems"); // Limpia datos del carrito
            sessionStorage.setItem("firstRun", "true"); // Marca que ya no es la primera vez
            console.log("Datos limpiados por ser la primera vez que se inicia la aplicación.");
        } else {
            console.log("Datos preservados. No es la primera vez que se inicia la aplicación.");
        }
    }, []);
    
    

    // Funciones para manejo de la calibración y recolección de puntos de mirada
    useEffect(() => {
        // Agregar los scripts necesarios de GazeCloud
        const script1 = document.createElement('script');
        script1.src = 'https://api.gazerecorder.com/GazeCloudAPI.js';
        script1.async = true;
        document.body.appendChild(script1);

        const script2 = document.createElement('script');
        script2.src = 'https://app.gazerecorder.com/GazeRecorderAPI.js';
        script2.async = true;
        document.body.appendChild(script2);

        const script3 = document.createElement('script');
        script3.src = 'https://app.gazerecorder.com/GazePlayer.js';
        script3.async = true;
        document.body.appendChild(script3);

        return () => {
            document.body.removeChild(script1);
            document.body.removeChild(script2);
            document.body.removeChild(script3);
        };
    }, []);

    const iniciarCalibracion = () => {
        if (window.GazeCloudAPI) {
            window.GazeCloudAPI.OnCalibrationComplete = function () {
                console.log('Calibración completa');
                setCalibrationComplete(true);
                console.log('Temporizador iniciado:', new Date());
            };
            window.GazeCloudAPI.OnCamDenied = function () { console.log('No se puede obtener acceso a la cámara'); }
            window.GazeCloudAPI.StartEyeTracking();
        } else {
            console.log('GazeCloudAPI no está disponible.');
        }
    };
    

    const iniciarRecoleccion = () => {

        if(!calibrationComplete) {
            console.warn('La calibración no está completa');
            return;
        }
        // Inicia el temporizador aquí, no en calibración
        setGazeDataArray([]);        // Reinicia el array de puntos
        setTaskDuration(null);       // Reinicia la duración de la tarea
        setCollecting(true);         // Activa el estado de recolección
        collectingRef.current = true;
    
        console.log("Recolección de puntos iniciada.");
    
        if (window.GazeCloudAPI) {
            window.GazeCloudAPI.OnResult = function (GazeData: GazeData) {
                if (collectingRef.current) {
                    let x = GazeData.docX;
                    let y = GazeData.docY;
    
                    const margin = 50; // Aumentar el área visible
                    const width = window.innerWidth - margin;
                    const height = window.innerHeight - margin;
    
                    // Asegura que los puntos estén dentro del margen
                    if (x < margin) x = margin;
                    if (y < margin) y = margin;
                    if (x > width) x = width;
                    if (y > height) y = height;

                    const newPoint = {x , y};
    
                    setGazeDataArray((prevArray) => {
                        const updatedArray = [...prevArray, newPoint];
                        sessionStorage.setItem("gazeData", JSON.stringify(updatedArray)); // Almacenar correctamente
                        sessionStorage.setItem("gazeDataArray", JSON.stringify(updatedArray)); // Para la sesión actual
                        return updatedArray;
                      });                      
                }
            };
        } else {
            console.log('GazeCloudAPI no está disponible.');
        }
    };

    const handleSaveAndNavigate = () => {
        const mostViewedElements = sessionStorage.getItem('mostViewedElements');
        if (!mostViewedElements) {
            console.warn('No se han generado elementos más vistos.');
            alert('Por favor, asegúrate de recolectar datos antes de guardar el informe.');
            return;
        }
    
        console.log('Elementos más vistos guardados:', JSON.parse(mostViewedElements));

        // Guarda datos clave antes de navegar
        sessionStorage.setItem("cartItems", JSON.stringify(cartItems));
        sessionStorage.setItem("gazeDataArray", JSON.stringify(gazeDataArray));

        // 2. Verifica los datos que estás guardando en sessionStorage para cartItems y gazeDataArray
        console.log("Cart Items guardados:", JSON.parse(sessionStorage.getItem("cartItems") || "[]"));
        console.log("Puntos de mirada guardados:", JSON.parse(sessionStorage.getItem("gazeDataArray") || "[]"));
        
    
        router.push('/pages/nueva/informe');
        
    };
    

    const handleClick = () => {
        setShowHighlightedPage(true);
    };

    const handleClickEsconder = () => {
        setShowHighlightedPage(false);
        saveElementsTosessionStorage();
    };

    const handleShowMatchingElements = () => {
        setShowMatchingElements(true);
    };

    const handleHideMatchingElements = () => {
        setShowMatchingElements(false);
    };

    const saveElementsTosessionStorage = () => {
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

        sessionStorage.setItem('previousDivs', JSON.stringify(elementsData));

        const content = document.querySelectorAll('#image-gallery, #product-details, #product-description');
        const contentArray = Array.from(content).map((element) => element.outerHTML);
        sessionStorage.setItem('pageContent', JSON.stringify(contentArray));

        console.log('Elementos guardados en sessionStorage:', elementsData);
        console.log('ElementsWithPoints guardado en sessionStorage:', elementsWithPoints);
    };

    const handleGenerateSuggestion = () => {
        // Finaliza la recolección
        setCollecting(false);
        if (window.GazeCloudAPI) window.GazeCloudAPI.StopEyeTracking();
    
    
        // Guarda los puntos en sessionStorage
        sessionStorage.setItem('gazeData', JSON.stringify(gazeDataArray));
        console.log('Puntos guardados:', gazeDataArray);

        // Guarda los elementos más vistos
        const mostViewedElements = sessionStorage.getItem('mostViewedElements');
        console.log('Guardando elementos más vistos en local storage:', mostViewedElements);

    
        // Redirige a la siguiente página
        router.push('/pages/nueva/informe');
    };
    

    const mostrarArrayPuntos = () => {
        console.log(gazeDataArray);
        const elements = document.querySelectorAll<HTMLElement>("[id^='image'], #product-name, #product-price, #reviews-link, #color-label, [id^='color-span-'], #size-label, #size-guide, [id^='size-span-'], #add-to-bag-button, #description-text, #highlights-list, [id^='highlight-span-'], #details-text");

        const matchingElements: string[] = [];
        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isMatch = gazeDataArray.some(point => (
                point.x >= rect.left && point.x <= rect.right &&
                point.y >= rect.top && point.y <= rect.bottom
            ));
            if (isMatch) {
                matchingElements.push(element.id);
            }
        });

        console.log("Elementos coincidentes:", matchingElements);
    }


    const toggleGazePoints = () => {
        setShowGazePoints(prevState => !prevState);
    };

    const finalizarRecoleccion = () => {
        setCollecting(false);
        collectingRef.current = false;
        setShowGazePoints(false);  // Ocultar los puntos
        if (window.GazeCloudAPI) {
            window.GazeCloudAPI.StopEyeTracking();
        }
        console.log('Recolección de puntos finalizada');
        console.log('Puntos de página generada:', gazeDataArray);
    };

    const handleAddToCart = () => {
        const selectedImage = product.images[activeImageIndex]; // Imagen activa
    
        const newItem: CartItem = {
            product: product.name,
            color: selectedColor.name,
            size: selectedSize.name,
            image: selectedImage?.src || "https://via.placeholder.com/50", // Imagen activa
            alt: selectedImage?.alt || "Sin descripción", // Descripción de la imagen activa
        };
    
        setCartItems((prevCart) => {
            const updatedCart = [...prevCart, newItem];
            sessionStorage.setItem("cartItems", JSON.stringify(updatedCart));
            return updatedCart;
        });
    
        alert(`Añadido al carrito: ${product.name}, Imagen: ${selectedImage.alt}`);
    };

    const handleClearCart = () => {
        setCartItems([]); // Vacía el estado del carrito
        sessionStorage.removeItem("cartItems"); // Elimina los datos del carrito del sessionStorage
        alert("Carrito limpiado"); // Mensaje de confirmación
    };
    
    
/*
    if (isLoading) {
        return <div id="loading">Loading...</div>;
    }
*/
    return (
        <div>
            <div className="fixed top-4 right-10 z-50">
                <button
                    onClick={toggleCartModal}
                    className="relative flex items-center p-2 rounded-full bg-blue-300 hover:bg-blue-100"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6 text-gray-700"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 3h2l.4 2M7 13h10l1.4-7H6.6L7 13zm-4 0h18M6 17a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4z"
                        />
                    </svg>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {cartItems.length}
                    </span>
                </button>
            </div>

            {!showHighlightedPage ? (
                <main id="main-content" className="flex h-screen items-center justify-center p-2">
                    <h1 id="page-title" className={`${lusitana.className} mb-2 text-lg`}></h1>
                    <MousePosition />
                    {/*<GazeEventChecker gazeEvents={data} />*/}

                    <div className="flex w-full h-full max-w-screen-xxl">
                        <div id="image-gallery" className="flex-1 h-full p-2">
                        <Carousel
                            showArrows={true}
                            infiniteLoop={true}
                            showThumbs={false}
                            className="h-full"
                            selectedItem={activeImageIndex}
                            onChange={(index) => setActiveImageIndex(index)} // Actualiza el índice
                        >
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

                                                <fieldset
                                                    id="size-fieldset"
                                                    aria-label="Choose a size"
                                                    className="mt-1"
                                                >
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
                                                                    selectedSize.name === size.name
                                                                        ? 'ring-2 ring-indigo-500 border-indigo-500' // Resaltar la talla seleccionada
                                                                        : 'border-gray-300',
                                                                    'group relative flex items-center justify-center rounded-md border px-2 py-1 text-xs font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1 sm:py-3'
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
                                                type="button"
                                                onClick={handleAddToCart} // Función que se ejecutará al hacer clic
                                                className="mt-2 flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-1 text-xs font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                            >
                                                Añadir al carrito
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
                        <h2 className="text-sm font-bold mb-2"> Elementos con puntos coincidentes:</h2>
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

                    

                    {/* Botones para calibración y recolección de puntos de mirada */}
                    <div id="controls" className="fixed bottom-4 flex gap-4">
                        <button
                            id="calibrationButton"
                            onClick={iniciarCalibracion}
                            className="rounded-md bg-red-500 px-4 py-2 text-white"
                            disabled={calibrationComplete}
                        >
                            Iniciar Calibración
                        </button>
                        <button
                            id="collectButton"
                            onClick={handleRecolectarPuntos}
                            className="rounded-md bg-green-500 px-4 py-2 text-white"
                            disabled={!calibrationComplete}
                        >
                            Comenzar Tarea
                        </button>

                        {/* Modal */}
                        {isModalOpen && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white p-4 rounded-md shadow-lg text-center">
                                    <h2 className="text-lg font-bold mb-4">Ingrese el código de la tarea</h2>

                                    {/* Campo para ingresar el código de la tarea */}
                                    <input
                                        type="text"
                                        value={taskCode}
                                        onChange={(e) => setTaskCode(e.target.value)}
                                        className="border p-2 rounded w-full"
                                        placeholder="Código de tarea"
                                        disabled={!!taskInstruction} // Deshabilitar si ya se muestra la instrucción
                                    />

                                    {/* Muestra la instrucción de la tarea si se encuentra */}
                                    {taskInstruction && (
                                        <div className="mt-6 p-4 rounded-md border-2 border-green-500 bg-green-50">
                                            <h3 className="text-lg font-semibold text-green-700 mb-2">Instrucción de la Tarea</h3>
                                            <p className="text-sm text-green-600">
                                                {taskInstruction}
                                            </p>
                                        </div>
                                    )}

                                    {/* Botones para enviar el código o comenzar la tarea */}
                                    <div className="flex justify-center mt-4 gap-2">
                                        {taskInstruction ? (
                                            <button
                                                onClick={() => {
                                                    handleCloseModal(); // Cierra el modal
                                                    iniciarRecoleccion(); // Comienza la recolección
                                                }}
                                                className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                                            >
                                                Empezar Tarea
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleStartTask} // Valida el código e inicia la tarea
                                                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                                            >
                                                Enviar Código
                                            </button>
                                        )}
                                        
                                    </div>


                                </div>
                            </div>
                        )}


                        <button
                            id="showPointsButton"
                            onClick={toggleGazePoints}
                            className="rounded-md bg-yellow-500 px-4 py-2 text-white"
                        >
                            O
                        </button>
                        {/* Botón adicional */}


                        <button onClick={handleCompleteTask} className="inline-block rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                        Terminar Tarea
                        </button>
                    </div>
                    {taskDuration !== null && (
                        <div className="mt-4 text-center">
                            <p className="text-lg font-bold text-blue-600">
                                Tiempo Total: {taskDuration} segundos
                            </p>
                        </div>
                    )}


                    {/* Contenedor para mostrar los puntos de mirada */}
                    {showGazePoints && (
                    <div id="gazePoints" className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden border-2 border-lightblue">
                        {gazeDataArray.map((point, index) => (
                            <div
                                key={index}
                                className="gazePoint"
                                style={{
                                    position: 'absolute',
                                    left: `${point.x}px`,
                                    top: `${point.y}px`,
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: 'red',
                                    borderRadius: '50%',
                                    transform: 'translate(-50%, -50%)'
                                }}
                            ></div>
                        ))}
                    </div>
                    )}
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
            {isCartOpen && (
                <>
                    {/* Fondo oscuro detrás del modal */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={toggleCartModal}
                    ></div>

                    {/* Contenido del modal */}
                    <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg z-50">
                        <div className="p-4">
                            <h2 className="text-lg font-bold">Carrito</h2>
                            <ul className="divide-y divide-gray-200">
                                {cartItems.map((item: CartItem, index) => (
                                    <li key={index} className="flex items-center gap-4 p-2">
                                        <img
                                            src={item.image}
                                            alt={item.alt} // Usa el alt correspondiente
                                            className="w-12 h-12 rounded"
                                        />
                                        <div>
                                            <p className="font-medium">{item.product}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.alt} {/* Muestra el alt como descripción */}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Color: {item.color}, Talla: {item.size}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-4 flex items-center justify-between">
                                <button
                                    onClick={() => alert("Checkout")}
                                    className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 mr-2"
                                >
                                    Checkout
                                </button>
                                <button
                                    onClick={() => {
                                        setCartItems([]); // Limpia el carrito
                                        sessionStorage.removeItem("cartItems"); // Limpia también en sessionStorage
                                    }}
                                    className="flex items-center justify-center rounded-md bg-red-500 p-2 hover:bg-red-600 focus:outline-none"
                                    title="Limpiar carrito" // Tooltip para accesibilidad
                                >
                                    <TrashIcon className="h-5 w-5 text-white" />
                                </button>
                            </div>



                            <button
                                onClick={toggleCartModal}
                                className="mt-2 w-full text-indigo-600 underline"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}