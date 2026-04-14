// --- 1. Inicialización de Variables ---
let map, marker;
const grupoSelect = document.getElementById('grupo-select');
const lineaInput = document.getElementById('linea-input');
const datalistLineas = document.getElementById('lineas');
const ramalSelect = document.getElementById('ramal-select');
const ramalContainer = document.getElementById('container-ramal');

// --- 2. Iniciar el Mapa (Leaflet) ---
function init() {
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

// --- 3. Lógica de Cascada (Grupo -> Recorrido -> Ramal) ---

// PASO 1: Al cambiar el GRUPO
grupoSelect.addEventListener('change', function() {
    const grupo = this.value;
    
    // Resetear todo lo siguiente
    lineaInput.value = '';
    lineaInput.disabled = !grupo;
    datalistLineas.innerHTML = '';
    ramalContainer.style.display = 'none';
    ramalSelect.innerHTML = '';

    if (grupo && DB_RECORRIDOS[grupo]) {
        lineaInput.placeholder = "Escribe o selecciona línea...";
        const lineas = DB_RECORRIDOS[grupo].recorridos;
        
        // Llenar el datalist con las líneas del grupo
        for (const nro in lineas) {
            const opt = document.createElement('option');
            opt.value = nro;
            datalistLineas.appendChild(opt);
        }
    } else {
        lineaInput.placeholder = "Primero selecciona un grupo...";
    }
});

// PASO 2: Al seleccionar el RECORRIDO (Línea)
lineaInput.addEventListener('input', function() {
    const grupo = grupoSelect.value;
    const linea = this.value;

    if (grupo && linea && DB_RECORRIDOS[grupo]?.recorridos[linea]) {
        const puntos = DB_RECORRIDOS[grupo].recorridos[linea];
        
        // Limpiar y llenar el selector de RAMAL
        ramalSelect.innerHTML = '<option value="">-- Selecciona una opción --</option>';
        puntos.forEach(punto => {
            const opt = document.createElement('option');
            opt.value = punto;
            opt.textContent = punto.replace(';', ' - '); // Formato: "1 - CONTROL"
            ramalSelect.appendChild(opt);
        });

        // Mostrar el último paso
        ramalContainer.style.display = 'block';
    } else {
        ramalContainer.style.display = 'none';
    }
});

// Llamar a init al cargar la página
window.onload = init;