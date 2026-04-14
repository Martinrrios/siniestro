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
const datalistLineas = document.getElementById('lineas');

// 1. Cuando cambia el Grupo (G200 o G800)
grupoSelect.addEventListener('change', function() {
    const grupoElegido = this.value;
    
    // Limpiar y resetear el input de líneas
    lineaInput.value = '';
    datalistLineas.innerHTML = '';
    
    if (grupoElegido && DB_RECORRIDOS[grupoElegido]) {
        lineaInput.disabled = false;
        lineaInput.placeholder = "Escribe o selecciona línea...";
        
        // Cargar solo las líneas de ese grupo
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

// 2. Modificar el evento de búsqueda de la línea
lineaInput.addEventListener('input', function() {
    const grupoElegido = grupoSelect.value;
    const lineaElegida = this.value;
    
    if (!grupoElegido || !lineaElegida) return;

    const puntosEncontrados = DB_RECORRIDOS[grupoElegido].recorridos[lineaElegida];

    if (puntosEncontrados) {
        ramalSelect.innerHTML = '<option value="">-- Selecciona un punto --</option>';
        puntosEncontrados.forEach(punto => {
            const el = document.createElement('option');
            el.textContent = punto.replace(';', ' - '); 
            el.value = punto;
            ramalSelect.appendChild(el);
        });
        ramalContainer.style.display = 'block';
    } else {
        ramalContainer.style.display = 'none';
    }
});

// Inicializar la carga de líneas al cargar el script
cargarLineas()

window.onload = init;