let map, marker;
let lesionadosCount = 0;

// Coordenadas fijas que coinciden con recorridos.js
const COORDENADAS_FIJAS = {
    "CONTROL SAN MARTIN Y 5 ABRIL": [-32.985566, -68.782253],
    "CONTROL TROPERO Y 5 ABRIL": [-32.987591, -68.780913],
    "QUEDA Bº AMUPE": [-33.001162, -68.758262],
    "QUEDA EST.GUTIERREZ": [-32.958955, -68.783622],
    "CONTROL RODEO": [-32.936751, -68.732997],
    "QUEDA RECOARO": [-33.041453, -68.833136],
    "QUEDA BºC.SOÑADA": [-33.034928, -68.765966],
    "CONTROL CORRALITOS": [-32.859662, -68.662657],
    "TERMINAL": [-32.895239, -68.830288]
};

const grupoSelect = document.getElementById('grupo-select');
const lineaInput = document.getElementById('linea-input');
const datalistLineas = document.getElementById('lineas');
const ramalSelect = document.getElementById('ramal-select');
const ramalContainer = document.getElementById('container-ramal');
const checkboxNoMapa = document.getElementById('no-mapa');

function init() {
    map = L.map('map').setView([-32.8895, -68.8458], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    map.on('click', (e) => {
        if (!checkboxNoMapa.checked && document.getElementById('map').style.pointerEvents !== 'none') {
            actualizarMapa(e.latlng.lat, e.latlng.lng);
        }
    });
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

function setEstadoBloqueo(bloquear) {
    const mapaDiv = document.getElementById('map');
    if (bloquear) {
        map.dragging.disable();
        mapaDiv.style.opacity = "0.5";
        mapaDiv.style.pointerEvents = "none";
        checkboxNoMapa.disabled = true;
    } else {
        map.dragging.enable();
        mapaDiv.style.opacity = "1";
        mapaDiv.style.pointerEvents = "auto";
        checkboxNoMapa.disabled = false;
    }
}

// CARGAR RECORRIDOS AL SELECCIONAR GRUPO
grupoSelect.addEventListener('change', function() {
    lineaInput.value = '';
    datalistLineas.innerHTML = '';
    ramalContainer.style.display = 'none';
    setEstadoBloqueo(false);

    if (this.value && DB_RECORRIDOS[this.value]) {
        lineaInput.disabled = false;
        const recorridos = DB_RECORRIDOS[this.value].recorridos;
        Object.keys(recorridos).forEach(nombre => {
            const opt = document.createElement('option');
            opt.value = nombre;
            datalistLineas.appendChild(opt);
        });
    } else {
        lineaInput.disabled = true;
    }
});

// DETECTAR SELECCIÓN Y BLOQUEO
lineaInput.addEventListener('input', function() {
    const val = this.value;
    // Si el valor está en coordenadas fijas, bloqueamos
    if (COORDENADAS_FIJAS[val]) {
        actualizarMapa(COORDENADAS_FIJAS[val][0], COORDENADAS_FIJAS[val][1]);
        setEstadoBloqueo(true);
    } else {
        setEstadoBloqueo(false);
    }

    // Cargar Ramales
    const puntos = DB_RECORRIDOS[grupoSelect.value]?.recorridos[val];
    if (puntos && puntos.length > 0) {
        ramalSelect.innerHTML = '<option value="">-- Selecciona punto --</option>';
        puntos.forEach(p => {
            const opt = document.createElement('option');
            opt.textContent = p.replace(';', ' - ');
            opt.value = p;
            ramalSelect.appendChild(opt);
        });
        ramalContainer.style.display = 'block';
    } else {
        ramalContainer.style.display = 'none';
    }
});

function toggleMapa(checked) {
    const container = document.getElementById('map-container');
    container.style.display = checked ? 'none' : 'block';
    if (!checked) setTimeout(() => map.invalidateSize(), 200);
}

function enviarWhatsApp() {
    const getVal = (id) => document.getElementById(id).value;
    const msg = `Siniestro: ${getVal('chofer-nombre')} - Lugar: ${getVal('siniestro-lugar')} - Ubicación: https://www.google.com/maps?q=${getVal('lat')},${getVal('lng')}`;
    window.open(`https://wa.me/5492616147829?text=${encodeURIComponent(msg)}`);
}

document.addEventListener('DOMContentLoaded', init);