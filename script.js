let map, marker;
let lesionadosCount = 0;

// Diccionario con guiones (debe ser idéntico a recorridos.js)
const COORDENADAS_FIJAS = {
    "CONTROL-SAN-MARTIN-Y-5-ABRIL": [-32.985566, -68.782253],
    "CONTROL-TROPERO-Y-5-ABRIL": [-32.987591, -68.780913],
    "QUEDA-B-AMUPE": [-33.001162, -68.758262],
    "QUEDA-EST-GUTIERREZ": [-32.958955, -68.783622],
    "TERMINAL": [-32.895239, -68.830288],
    "CONTROL-RODEO": [-32.936751, -68.732997],
    "QUEDA-RECOARO": [-33.041453, -68.833136],
    "QUEDA-B-C-SOÑADA": [-33.034928, -68.765966],
    "CONTROL-CORRALITOS": [-32.859662, -68.662657]
};

const grupoSelect = document.getElementById('grupo-select');
const lineaInput = document.getElementById('linea-input');
const datalistLineas = document.getElementById('lineas');
const ramalSelect = document.getElementById('ramal-select');
const ramalContainer = document.getElementById('container-ramal');
const checkboxNoMapa = document.getElementById('no-mapa');
const mapDiv = document.getElementById('map');

function initMap() {
    map = L.map('map').setView([-32.8895, -68.8458], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    map.on('click', (e) => {
        if (mapDiv.style.pointerEvents !== 'none' && !checkboxNoMapa.checked) {
            actualizarMapa(e.latlng.lat, e.latlng.lng);
        }
    });
}

function actualizarMapa(lat, lng) {
    const pos = [lat, lng];
    map.setView(pos, 17);
    if (marker) marker.setLatLng(pos);
    else marker = L.marker(pos).addTo(map);
    document.getElementById('lat').value = lat.toFixed(6);
    document.getElementById('lng').value = lng.toFixed(6);
}

function gestionarBloqueo(fijo) {
    if (fijo) {
        mapDiv.style.pointerEvents = 'none';
        mapDiv.style.opacity = '0.7';
        mapDiv.style.border = '4px solid #ffc107';
        checkboxNoMapa.checked = false;
        checkboxNoMapa.disabled = true;
    } else {
        mapDiv.style.pointerEvents = 'auto';
        mapDiv.style.opacity = '1';
        mapDiv.style.border = '1px solid #ddd';
        checkboxNoMapa.disabled = false;
    }
}

// Escuchar cuando el usuario elige una opción
lineaInput.addEventListener('input', function() {
    const seleccion = this.value.trim(); // Toma el valor con guiones
    const grupo = grupoSelect.value;

    // Si la opción elegida existe en nuestro diccionario de coordenadas
    if (COORDENADAS_FIJAS[seleccion]) {
        const coords = COORDENADAS_FIJAS[seleccion];
        actualizarMapa(coords[0], coords[1]);
        gestionarBloqueo(true);
    } else {
        gestionarBloqueo(false);
    }

    // Cargar ramales si la línea tiene datos
    const puntos = DB_RECORRIDOS[grupo]?.recorridos[seleccion];
    if (puntos && puntos.length > 0) {
        ramalSelect.innerHTML = '<option value="">-- Seleccionar punto --</option>';
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

grupoSelect.addEventListener('change', function() {
    lineaInput.value = '';
    datalistLineas.innerHTML = '';
    ramalContainer.style.display = 'none';
    gestionarBloqueo(false);
    if (this.value && DB_RECORRIDOS[this.value]) {
        lineaInput.disabled = false;
        Object.keys(DB_RECORRIDOS[this.value].recorridos).forEach(rec => {
            const opt = document.createElement('option');
            opt.value = rec;
            datalistLineas.appendChild(opt);
        });
    } else {
        lineaInput.disabled = true;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    document.getElementById('siniestro-fecha').valueAsDate = new Date();
});

function toggleMapa(checked) {
    document.getElementById('map-container').style.display = checked ? 'none' : 'block';
    if(!checked) setTimeout(() => map.invalidateSize(), 200);
}

function cambiarLesionados(delta) {
    const contenedor = document.getElementById('lista-lesionados');
    const displayCount = document.getElementById('cant-lesionados');
    if (delta > 0) {
        lesionadosCount++;
        const div = document.createElement('div');
        div.className = 'lesionado-card';
        div.id = `les-${lesionadosCount}`;
        div.innerHTML = `<h4>Lesionado ${lesionadosCount}</h4><div class="field-row"><input type="text" placeholder="Nombre"><input type="number" placeholder="DNI"></div>`;
        contenedor.appendChild(div);
    } else if (lesionadosCount > 0) {
        document.getElementById(`les-${lesionadosCount}`).remove();
        lesionadosCount--;
    }
    displayCount.innerText = lesionadosCount;
}

function enviarWhatsApp() {
    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;
    const msg = `Siniestro: https://www.google.com/maps?q=${lat},${lng}`;
    window.open(`https://wa.me/5492616147829?text=${encodeURIComponent(msg)}`);
}

function generarPDF() {
    html2pdf().from(document.getElementById('form-to-print')).save('siniestro.pdf');
}