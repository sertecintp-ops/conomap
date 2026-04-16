// 1. INICIALIZAR EL MAPA
const map = new maplibregl.Map({
    container: 'map',
    center: [-70.2528, -18.0146], // Centro de Tacna
    zoom: 14,
    minZoom: 12,
    maxZoom: 19,
    style: {
        version: 8,
        sources: {
            'lotes-tacna': {
                type: 'vector',
                // Llama a tu carpeta de teselas generada offline
                tiles: [window.location.origin + '/tiles/{z}/{x}/{y}.pbf'],
                minzoom: 12,
                maxzoom: 19
            }
        },
        layers: [
            {
                id: 'background',
                type: 'background',
                paint: { 'background-color': '#f4f4f4' }
            },
            {
                id: 'lotes-fill',
                type: 'fill',
                source: 'lotes-tacna',
                'source-layer': 'tacna_lotes', // Debe coincidir con lo generado por Tippecanoe
                paint: {
                    'fill-color': '#e0e0e0',
                    'fill-outline-color': '#999999'
                }
            },
            {
                id: 'lotes-labels',
                type: 'symbol',
                source: 'lotes-tacna',
                'source-layer': 'tacna_lotes',
                minzoom: 16, // Solo mostrar textos al acercarse
                layout: {
                    'text-field': ['get', 'texto_lote'], 
                    'text-size': 12,
                    'text-allow-overlap': false
                },
                paint: {
                    'text-color': '#333333',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 1
                }
            }
        ]
    }
});

// 2. AÑADIR CONTROLES (Navegación y GPS)
map.addControl(new maplibregl.NavigationControl(), 'top-right');

const geolocate = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserLocation: true
});
map.addControl(geolocate, 'top-right');

// 3. LÓGICA DEL BUSCADOR
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let locationsData = [];

// Cargar el JSON estático una sola vez
fetch('/search-index.json')
    .then(response => response.json())
    .then(data => {
        locationsData = data;
    })
    .catch(error => console.error("Error cargando el índice de búsqueda:", error));

// Escuchar lo que el usuario escribe
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    searchResults.innerHTML = ''; // Limpiar resultados anteriores
    
    if (query.length > 2) {
        // Filtrar y tomar solo los primeros 5 resultados
        const filtered = locationsData.filter(loc => 
            loc.nombre.toLowerCase().includes(query)
        ).slice(0, 5);

        if (filtered.length > 0) {
            searchResults.style.display = 'block';
            
            // Crear la lista visual
            filtered.forEach(loc => {
                const li = document.createElement('li');
                li.textContent = loc.nombre;
                
                // Al hacer clic, volar a esa ubicación
                li.addEventListener('click', () => {
                    map.flyTo({
                        center: [loc.lng, loc.lat],
                        zoom: 17,
                        essential: true
                    });
                    
                    // Limpiar el buscador
                    searchInput.value = loc.nombre;
                    searchResults.style.display = 'none';
                });
                
                searchResults.appendChild(li);
            });
        } else {
            searchResults.style.display = 'none';
        }
    } else {
        searchResults.style.display = 'none';
    }
});

// Ocultar resultados si se hace clic fuera del buscador
document.addEventListener('click', (e) => {
    if (!document.getElementById('search-container').contains(e.target)) {
        searchResults.style.display = 'none';
    }
});
