function init() {
    // --- LÓGICA DEL MAPA ---
    map = L.map('map').setView([-32.8895, -68.8458], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (marker) marker.setLatLng(e.latlng);
        else marker = L.marker(e.latlng).addTo(map);
        
        document.getElementById('lat').value = lat.toFixed(6);
        document.getElementById('lng').value = lng.toFixed(6);
    });

    // IMPORTANTE: Llamar a la función para que cargue las líneas de recorridos.js
    cargarLineas(); 
}

  let map, marker;

// --- LÓGICA DE LOS DESPLEGABLES ---
const grupoSelect = document.getElementById('grupo-select');
const lineaInput = document.getElementById('linea-input');
const ramalSelect = document.getElementById('ramal-select');
const ramalContainer = document.getElementById('container-ramal');

// Evento cuando el usuario escribe o selecciona una Línea
lineaInput.addEventListener('input', function() {
    const grupoElegido = grupoSelect.value;
    const lineaElegida = this.value;
    
    // Si no hay grupo o línea, escondemos el selector de ramal
    if (!grupoElegido || !lineaElegida) {
        ramalContainer.style.display = 'none';
        return;
    }

    // Buscamos los puntos (ramales) en nuestra base de datos
    const puntosEncontrados = DB_RECORRIDOS[grupoElegido]?.recorridos[lineaElegida];

    if (puntosEncontrados) {
        // Limpiamos el selector de ramales
        ramalSelect.innerHTML = '<option value="">-- Selecciona un punto del recorrido --</option>';
        
        // Llenamos el selector con los datos del array
        puntosEncontrados.forEach(punto => {
            const el = document.createElement('option');
            
            // Reemplazamos el ";" por " - " para que se vea limpio (ej: "1 - CONTROL")
            el.textContent = punto.replace(';', ' - '); 
            el.value = punto;
            ramalSelect.appendChild(el);
        });

        // Mostramos el contenedor del ramal
        ramalContainer.style.display = 'block';
    } else {
        // Si la línea escrita no existe, escondemos el selector
        ramalContainer.style.display = 'none';
    }
});

// Inicializar la carga de líneas al cargar el script
cargarLineas()

window.onload = init;