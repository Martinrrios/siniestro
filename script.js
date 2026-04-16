let map, marker;
let lesionadosCount = 0;

// Coordenadas fijas para bloqueo automático
const COORDENADAS_FIJAS = {
    "SAN MARTIN": [-32.985566, -68.782253],
    "TROPERO": [-32.987591, -68.780913],
    "AMUPE": [-33.001162, -68.758262],
    "GUTIERREZ": [-32.958955, -68.783622],
    "TERMINAL": [-32.895239, -68.830288],
    "RODEO": [-32.936751, -68.732997],
    "RECOARO": [-33.041453, -68.833136],
    "SONADA": [-33.034928, -68.765966],
    "CORRALITOS": [-32.859662, -68.662657]
};

// Elementos del DOM
const grupoSelect = document.getElementById('grupo-select');
const lineaInput = document.getElementById('linea-input');
const datalistLineas = document.getElementById('lineas');
const ramalSelect = document.getElementById('ramal-select');
const ramalContainer = document.getElementById('container-ramal');
const checkboxNoMapa = document.getElementById('no-mapa');
const wrapperCheckbox = document.getElementById('capa-checkbox');

// 1. INICIALIZACIÓN DEL MAPA
function init() {
    map = L.map('map').setView([-32.8895, -68.8458], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    map.on('click', (e) => {
        // Solo permite marcar si el mapa no está bloqueado por punto fijo o checkbox
        const estaBloqueado = document.getElementById('map').style.pointerEvents === 'none';
        if (!estaBloqueado && !checkboxNoMapa.checked) {
            actualizarMapa(e.latlng.lat, e.latlng.lng);
        }
    });

    // Fecha actual por defecto
    document.getElementById('siniestro-fecha').valueAsDate = new Date();
}

function actualizarMapa(lat, lng) {
    const pos = [lat, lng];
    map.setView(pos, 16);
    if (marker) marker.setLatLng(pos);
    else marker = L.marker(pos).addTo(map);
    document.getElementById('lat').value = lat.toFixed(6);
    document.getElementById('lng').value = lng.toFixed(6);
}

// 2. NORMALIZACIÓN DE TEXTO (Para comparar sin errores)
function normalizar(t) {
    if (!t) return "";
    return t.toString().toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quita acentos
        .replace(/[^A-Z0-9]/g, ""); // Quita símbolos y espacios
}

// 3. FUNCIÓN DE BLOQUEO/DESBLOQUEO
function setEstadoBloqueo(bloquear) {
    const mapaDiv = document.getElementById('map');
    if (bloquear) {
        map.dragging.disable();
        map.touchZoom.disable();
        map.scrollWheelZoom.disable();
        mapaDiv.style.opacity = "0.5";
        mapaDiv.style.pointerEvents = "none";
        if(checkboxNoMapa) checkboxNoMapa.disabled = true;
        if(wrapperCheckbox) wrapperCheckbox.classList.add('disabled');
    } else {
        map.dragging.enable();
        map.touchZoom.enable();
        map.scrollWheelZoom.enable();
        mapaDiv.style.opacity = "1";
        mapaDiv.style.pointerEvents = "auto";
        if(checkboxNoMapa) checkboxNoMapa.disabled = false;
        if(wrapperCheckbox) wrapperCheckbox.classList.remove('disabled');
    }
}

// 4. EVENTO: CAMBIO DE GRUPO (Carga los recorridos)
grupoSelect.addEventListener('change', function() {
    lineaInput.value = '';
    datalistLineas.innerHTML = '';
    ramalContainer.style.display = 'none';
    setEstadoBloqueo(false);

    if (this.value && DB_RECORRIDOS[this.value]) {
        lineaInput.disabled = false;
        lineaInput.placeholder = "Seleccione o escriba el recorrido...";
        
        const recorridos = DB_RECORRIDOS[this.value].recorridos;
        Object.keys(recorridos).forEach(nombre => {
            const opt = document.createElement('option');
            opt.value = nombre;
            datalistLineas.appendChild(opt);
        });
    } else {
        lineaInput.disabled = true;
        lineaInput.placeholder = "Seleccione grupo primero...";
    }
});

// 5. EVENTO: SELECCIÓN DE RECORRIDO (Bloqueo y Ramales)
lineaInput.