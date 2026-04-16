let map, marker;
let lesionadosCount = 0;

// Coordenadas para puntos de control (Bloqueo automático)
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

function initMap() {
    map = L.map('map').setView([-32.8895, -68.8458], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    map.on('click', function(e) {
        if (document.getElementById('map').style.pointerEvents !== 'none' && !checkboxNoMapa.checked) {
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
        mapaDiv.style.opacity = "0.5";
        mapaDiv.style.pointerEvents = "none";
        checkboxNoMapa.disabled = true;
    } else {
        mapaDiv.style.opacity = "1";
        mapaDiv.style.pointerEvents = "auto";
        checkboxNoMapa.disabled = false;
    }
}

// CARGA DE RECORRIDOS SEGÚN GRUPO
grupoSelect.addEventListener('change', function() {
    const grupo = this.value;
    lineaInput.value = '';
    datalistLineas.innerHTML = '';
    ramalContainer.style.display = 'none';
    setEstadoBloqueo(false);

    if (grupo && DB_RECORRIDOS[grupo]) {
        lineaInput.disabled = false;
        // Acceder a DB_RECORRIDOS[G800].recorridos
        const opciones = Object.keys(DB_RECORRIDOS[grupo].recorridos);
        opciones.forEach(nombre => {
            const opt = document.createElement('option');
            opt.value = nombre;
            datalistLineas.appendChild(opt);
        });
    } else {
        lineaInput.disabled = true;
    }
});

// DETECTAR SELECCIÓN DE LÍNEA O PUNTO FIJO
lineaInput.addEventListener('input', function() {
    const val = this.value;
    const grupo = grupoSelect.value;

    if (COORDENADAS_FIJAS[val]) {
        actualizarMapa(COORDENADAS_FIJAS[val][0], COORDENADAS_FIJAS[val][1]);
        setEstadoBloqueo(true);
    } else {
        setEstadoBloqueo(false);
    }

    const puntos = DB_RECORRIDOS[grupo]?.recorridos[val];
    if (puntos && puntos.length > 0) {
        ramalSelect.innerHTML = '<option value="">-- Selecciona punto --</option>';
        puntos.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p.replace(';', ' - ');
            ramalSelect.appendChild(opt);
        });
        ramalContainer.style.display = 'block';
    } else {
        ramalContainer.style.display = 'none';
    }
});

function toggleMapa(checked) {
    const mapDiv = document.getElementById('map-container');
    if (checked) {
        mapDiv.style.display = 'none';
        document.getElementById('lat').value = "0";
        document.getElementById('lng').value = "0";
    } else {
        mapDiv.style.display = 'block';
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
    const element = document.getElementById('form-to-print');
    html2pdf().from(element).save('siniestro.pdf');
}

document.addEventListener('DOMContentLoaded', initMap);