// Base de datos de opciones
const opcionesRecorrido = {
    "200": ["2-AZUL;--IDA", "2-ROJO;--IDA", "2-AMARILLO;--IDA"],
    "201": ["2-PERAS;--IDA", "2-MANZANAS;--IDA", "2-NARANJAS;--IDA"]
};

let map, marker;

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

    // --- LÓGICA DE LOS DESPLEGABLES ---
    const lineaInput = document.getElementById('linea-input');
    const ramalContainer = document.getElementById('container-ramal');
    const ramalSelect = document.getElementById('ramal-select');

    lineaInput.addEventListener('input', function() {
        const seleccion = this.value;
        if (opcionesRecorrido[seleccion]) {
            // Llenar el select de ramales
            ramalSelect.innerHTML = '<option value="">-- Selecciona una opción --</option>';
            opcionesRecorrido[seleccion].forEach(opt => {
                const el = document.createElement('option');
                el.value = el.textContent = opt;
                ramalSelect.appendChild(el);
            });
            ramalContainer.style.display = 'block';
        } else {
            ramalContainer.style.display = 'none';
        }
    });
}

window.onload = init;