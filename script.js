let map, marker;
const grupoSelect = document.getElementById('grupo-select');
const lineaInput = document.getElementById('linea-input');
const datalistLineas = document.getElementById('lineas');
const ramalSelect = document.getElementById('ramal-select');
const ramalContainer = document.getElementById('container-ramal');

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
}

// PASO 1: Al seleccionar el GRUPO
grupoSelect.addEventListener('change', function() {
    const grupoElegido = this.value;
    
    // Limpiar campos hijos
    lineaInput.value = '';
    datalistLineas.innerHTML = '';
    ramalContainer.style.display = 'none';
    
    if (grupoElegido && DB_RECORRIDOS[grupoElegido]) {
        lineaInput.disabled = false;
        lineaInput.placeholder = "Escribe o selecciona línea...";
        
        // Cargar SOLO las líneas del grupo seleccionado
        const lineas = DB_RECORRIDOS[grupoElegido].recorridos;
        for (const nroLinea in lineas) {
            const option = document.createElement('option');
            option.value = nroLinea;
            datalistLineas.appendChild(option);
        }
    } else {
        lineaInput.disabled = true;
        lineaInput.placeholder = "Primero selecciona un grupo...";
    }
});

// PASO 2: Al escribir/seleccionar la LÍNEA
lineaInput.addEventListener('input', function() {
    const grupoElegido = grupoSelect.value;
    const lineaElegida = this.value;
    
    if (!grupoElegido || !lineaElegida) return;

    // Buscar los puntos dentro del grupo seleccionado
    const puntosEncontrados = DB_RECORRIDOS[grupoElegido]?.recorridos[lineaElegida];

    if (puntosEncontrados) {
        ramalSelect.innerHTML = '<option value="">-- Selecciona un punto del recorrido --</option>';
        puntosEncontrados.forEach(punto => {
            const el = document.createElement('option');
            el.textContent = punto.replace(';', ' - '); // Formato "1 - CONTROL"
            el.value = punto;
            ramalSelect.appendChild(el);
        });
        ramalContainer.style.display = 'block'; // PASO 3: Mostrar Ramal
    } else {
        ramalContainer.style.display = 'none';
    }
});

window.onload = init;