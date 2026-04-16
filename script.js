let map, marker;
let lesionadosCount = 0;

// Coordenadas fijas para bloqueo automático
const COORDENADAS_FIJAS = {
    "CONTROL SAN MARTIN Y 5 ABRIL": [-32.985566, -68.782253],
    "CONTROL TROPERO Y 5 ABRIL": [-32.987591, -68.780913],
    "QUEDA Bº AMUPE": [-33.001162, -68.758262],
    "QUEDA EST.GUTIERREZ": [-32.958955, -68.783622],
    "QUEDE TERMINAL": [-32.895239, -68.830288],
    "CONTROL RODEO": [-32.936751, -68.732997],
    "QUEDA RECOARO": [-33.041453, -68.833136],
    "QUEDA BºC.SOÑADA": [-33.034928, -68.765966],
    "CONTROL CORRALITOS": [-32.859662, -68.662657]
};

const grupoSelect = document.getElementById('grupo-select');
const lineaInput = document.getElementById('linea-input');
const datalistLineas = document.getElementById('lineas');
const ramalSelect = document.getElementById('ramal-select');
const ramalContainer = document.getElementById('container-ramal');
const checkboxNoMapa = document.getElementById('no-mapa');
const mapaDiv = document.getElementById('map');

function initMap() {
    map = L.map('map').setView([-32.8895, -68.8458], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    map.on('click', function(e) {
        if (mapaDiv.style.pointerEvents !== 'none' && !checkboxNoMapa.checked) {
            actualizarMapa(e.latlng.lat, e.latlng.lng);
        }
    });
    document.getElementById('siniestro-fecha').valueAsDate = new Date();
}

function actualizarMapa(lat, lng) {
    const pos = [lat, lng];
    map.setView(pos, 17);
    if (marker) marker.setLatLng(pos);
    else marker = L.marker(pos).addTo(map);
    document.getElementById('lat').value = lat.toFixed(6);
    document.getElementById('lng').value = lng.toFixed(6);
}

function setBloqueoPuntoFijo(bloquear) {
    if (bloquear) {
        mapaDiv.style.pointerEvents = 'none';
        mapaDiv.style.opacity = '0.6';
        mapaDiv.classList.add('map-bloqueado');
        if(checkboxNoMapa) {
            checkboxNoMapa.checked = false;
            checkboxNoMapa.disabled = true;
            checkboxNoMapa.closest('.checkbox-container').style.opacity = '0.5';
        }
    } else {
        mapaDiv.style.pointerEvents = 'auto';
        mapaDiv.style.opacity = '1';
        mapaDiv.classList.remove('map-bloqueado');
        if(checkboxNoMapa) {
            checkboxNoMapa.disabled = false;
            checkboxNoMapa.closest('.checkbox-container').style.opacity = '1';
        }
    }
}

// Evento: Cambio de Grupo
grupoSelect.addEventListener('change', function() {
    lineaInput.value = '';
    datalistLineas.innerHTML = '';
    ramalContainer.style.display = 'none';
    setBloqueoPuntoFijo(false);

    if (this.value && DB_RECORRIDOS[this.value]) {
        lineaInput.disabled = false;
        const opciones = Object.keys(DB_RECORRIDOS[this.value].recorridos);
        opciones.forEach(rec => {
            const opt = document.createElement('option');
            opt.value = rec;
            datalistLineas.appendChild(opt);
        });
    } else {
        lineaInput.disabled = true;
    }
});

// Evento: Selección de Recorrido y Bloqueo
lineaInput.addEventListener('input', function() {
    const val = this.value;
    const grupo = grupoSelect.value;

    if (COORDENADAS_FIJAS[val]) {
        actualizarMapa(COORDENADAS_FIJAS[val][0], COORDENADAS_FIJAS[val][1]);
        setBloqueoPuntoFijo(true);
    } else {
        setBloqueoPuntoFijo(false);
    }

    // Cargar Ramales
    const puntos = DB_RECORRIDOS[grupo]?.recorridos[val];
    if (puntos && puntos.length > 0) {
        ramalSelect.innerHTML = '<option value="">-- Selecciona punto del recorrido --</option>';
        puntos.forEach(p => {
            const el = document.createElement('option');
            el.textContent = p.replace(';', ' - ');
            el.value = p;
            ramalSelect.appendChild(el);
        });
        ramalContainer.style.display = 'block';
    } else {
        ramalContainer.style.display = 'none';
    }
});

function toggleMapa(checked) {
    const container = document.getElementById('map-container');
    if (checked) {
        container.style.display = 'none';
        document.getElementById('lat').value = "0";
        document.getElementById('lng').value = "0";
    } else {
        container.style.display = 'block';
        setTimeout(() => map.invalidateSize(), 200);
    }
}

function cambiarLesionados(delta) {
    const contenedor = document.getElementById('lista-lesionados');
    const displayCount = document.getElementById('cant-lesionados');
    if (delta > 0) {
        lesionadosCount++;
        const div = document.createElement('div');
        div.className = 'lesionado-card';
        div.id = `lesionado-${lesionadosCount}`;
        div.innerHTML = `<h4>Lesionado ${lesionadosCount}</h4><div class="field-row"><div class="field"><label>Nombre:</label><input type="text"></div><div class="field"><label>DNI:</label><input type="number"></div></div>`;
        contenedor.appendChild(div);
    } else if (lesionadosCount > 0) {
        document.getElementById(`lesionado-${lesionadosCount}`).remove();
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
    const element = document.getElementById('form-to-print');
    html2pdf().from(element).save('siniestro.pdf');
}

document.addEventListener('DOMContentLoaded', initMap);