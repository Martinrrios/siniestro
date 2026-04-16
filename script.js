let map, marker;

const COORDENADAS_FIJAS = {
    "SAN MARTIN Y 5 ABRIL": [-32.985566, -68.782253],
    "TROPERO Y 5 ABRIL": [-32.987591, -68.780913],
    "AMUPE": [-33.001162, -68.758262],
    "GUTIERREZ": [-32.958955, -68.783622],
    "TERMINAL": [-32.895239, -68.830288],
    "RODEO": [-32.936751, -68.732997],
    "RECOARO": [-33.041453, -68.833136],
    "SONADA": [-33.034928, -68.765966],
    "CORRALITOS": [-32.859662, -68.662657]
};

const grupoSelect = document.getElementById('grupo-select');
const lineaInput = document.getElementById('linea-input');
const datalistLineas = document.getElementById('lineas');
const ramalSelect = document.getElementById('ramal-select');
const ramalContainer = document.getElementById('container-ramal');
const checkboxNoMapa = document.getElementById('no-mapa');
const wrapperCheckbox = document.getElementById('capa-checkbox');

function init() {
    map = L.map('map').setView([-32.8895, -68.8458], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    map.on('click', (e) => {
        if (!checkboxNoMapa.disabled && !checkboxNoMapa.checked) {
            actualizarMapa(e.latlng.lat, e.latlng.lng);
        }
    });
}

function actualizarMapa(lat, lng) {
    const pos = [lat, lng];
    map.setView(pos, 16);
    if (marker) marker.setLatLng(pos);
    else marker = L.marker(pos).addTo(map);
    document.getElementById('lat').value = lat.toFixed(6);
    document.getElementById('lng').value = lng.toFixed(6);
}

function normalizar(t) {
    return t.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "");
}

function setEstadoBloqueo(bloquear) {
    const mapaDiv = document.getElementById('map');
    if (bloquear) {
        map.dragging.disable();
        map.touchZoom.disable();
        map.scrollWheelZoom.disable();
        mapaDiv.style.opacity = "0.5";
        mapaDiv.style.pointerEvents = "none"; // ESTO BLOQUEA TODO
        checkboxNoMapa.checked = false;
        checkboxNoMapa.disabled = true;
        wrapperCheckbox.classList.add('disabled');
    } else {
        map.dragging.enable();
        map.touchZoom.enable();
        map.scrollWheelZoom.enable();
        mapaDiv.style.opacity = "1";
        mapaDiv.style.pointerEvents = "auto"; // ESTO LIBERA TODO
        checkboxNoMapa.disabled = false;
        wrapperCheckbox.classList.remove('disabled');
    }
}

grupoSelect.addEventListener('change', function() {
    lineaInput.value = '';
    lineaInput.disabled = !this.value;
    datalistLineas.innerHTML = '';
    ramalContainer.style.display = 'none';
    setEstadoBloqueo(false);

    if (this.value && DB_RECORRIDOS[this.value]) {
        for (const nro in DB_RECORRIDOS[this.value].recorridos) {
            const opt = document.createElement('option');
            opt.value = nro;
            datalistLineas.appendChild(opt);
        }
    }
});

lineaInput.addEventListener('input', function() {
    const val = this.value;
    const valLimpio = normalizar(val);
    let esFijo = false;

    for (let clave in COORDENADAS_FIJAS) {
        if (valLimpio.includes(normalizar(clave))) {
            actualizarMapa(COORDENADAS_FIJAS[clave][0], COORDENADAS_FIJAS[clave][1]);
            esFijo = true;
            break;
        }
    }

    setEstadoBloqueo(esFijo);

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

lineaInput.addEventListener('click', function() {
    this.value = '';
    setEstadoBloqueo(false);
    ramalContainer.style.display = 'none';
});

function toggleMapa(checked) {
    const container = document.getElementById('map-container');
    container.style.display = checked ? 'none' : 'block';
    if (!checked) setTimeout(() => map.invalidateSize(), 100);
}

document.addEventListener('DOMContentLoaded', init);