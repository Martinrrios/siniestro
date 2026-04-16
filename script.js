let map, marker;
let lesionadosCount = 0;

// 1. Coordenadas fijas para bloqueo automático
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

// 2. Referencias al DOM
const grupoSelect = document.getElementById('grupo-select');
const lineaInput = document.getElementById('linea-input');
const datalistLineas = document.getElementById('lineas');
const ramalSelect = document.getElementById('ramal-select');
const ramalContainer = document.getElementById('container-ramal');
const checkboxNoMapa = document.getElementById('no-mapa');

// 3. Inicialización del Mapa
function initMap() {
    map = L.map('map').setView([-32.8895, -68.8458], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    map.on('click', function(e) {
        // Solo permite marcar si el mapa no está bloqueado (por punto fijo o checkbox)
        const isLocked = document.getElementById('map').style.pointerEvents === 'none';
        if (!isLocked && (!checkboxNoMapa || !checkboxNoMapa.checked)) {
            actualizarMapa(e.latlng.lat, e.latlng.lng);
        }
    });

    // Fecha por defecto
    const fechaInput = document.getElementById('siniestro-fecha');
    if(fechaInput) fechaInput.valueAsDate = new Date();
}

function actualizarMapa(lat, lng) {
    const pos = [lat, lng];
    map.setView(pos, 16);
    if (marker) {
        marker.setLatLng(pos);
    } else {
        marker = L.marker(pos).addTo(map);
    }
    document.getElementById('lat').value = lat.toFixed(6);
    document.getElementById('lng').value = lng.toFixed(6);
}

// 4. Gestión de Bloqueo del Mapa
function setEstadoBloqueo(bloquear) {
    const mapaDiv = document.getElementById('map');
    if (bloquear) {
        mapaDiv.style.opacity = "0.5";
        mapaDiv.style.pointerEvents = "none";
        if (checkboxNoMapa) checkboxNoMapa.disabled = true;
    } else {
        mapaDiv.style.opacity = "1";
        mapaDiv.style.pointerEvents = "auto";
        if (checkboxNoMapa) checkboxNoMapa.disabled = false;
    }
}

// 5. EVENTO: Cambio de Grupo (Carga Recorridos)
grupoSelect.addEventListener('change', function() {
    const grupo = this.value;
    lineaInput.value = '';
    datalistLineas.innerHTML = '';
    ramalContainer.style.display = 'none';
    setEstadoBloqueo(false);

    if (grupo && DB_RECORRIDOS[grupo]) {
        lineaInput.disabled = false;
        lineaInput.placeholder = "Seleccione o escriba el recorrido...";
        
        // Cargar las claves del objeto recorridos del grupo seleccionado
        const recorridosDisponibles = Object.keys(DB_RECORRIDOS[grupo].recorridos);
        recorridosDisponibles.forEach(rec => {
            const opt = document.createElement('option');
            opt.value = rec;
            datalistLineas.appendChild(opt);
        });
    } else {
        lineaInput.disabled = true;
        lineaInput.placeholder = "Seleccione grupo primero...";
    }
});

// 6. EVENTO: Selección de Recorrido (Puntos Fijos y Ramales)
lineaInput.addEventListener('input', function() {
    const seleccion = this.value;
    const grupo = grupoSelect.value;

    // Verificar si es un punto fijo para bloquear el mapa
    if (COORDENADAS_FIJAS[seleccion]) {
        actualizarMapa(COORDENADAS_FIJAS[seleccion][0], COORDENADAS_FIJAS[seleccion][1]);
        setEstadoBloqueo(true);
    } else {
        setEstadoBloqueo(false);
    }

    // Cargar ramales (puntos intermedios)
    const puntos = DB_RECORRIDOS[grupo]?.recorridos[seleccion];
    if (puntos && puntos.length > 0) {
        ramalSelect.innerHTML = '<option value="">-- Selecciona un punto del recorrido --</option>';
        puntos.forEach(punto => {
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

// 7. Gestión de Lesionados
function cambiarLesionados(delta) {
    const contenedor = document.getElementById('lista-lesionados');
    const displayCount = document.getElementById('cant-lesionados');
    if (delta > 0) {
        lesionadosCount++;
        const div = document.createElement('div');
        div.className = 'lesionado-card';
        div.id = `lesionado-${lesionadosCount}`;
        div.innerHTML = `
            <h4>Lesionado ${lesionadosCount}</h4>
            <div class="field-row">
                <div class="field"><label>Nombre:</label><input type="text"></div>
                <div class="field"><label>DNI:</label><input type="number"></div>
            </div>`;
        contenedor.appendChild(div);
    } else if (lesionadosCount > 0) {
        document.getElementById(`lesionado-${lesionadosCount}`).remove();
        lesionadosCount--;
    }
    if(displayCount) displayCount.innerText = lesionadosCount;
}

// 8. Utilidades: WhatsApp y PDF
function enviarWhatsApp() {
    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;
    const chofer = document.getElementById('chofer-nombre').value;
    const texto = `Informe de Siniestro - Chofer: ${chofer} - Ubicación: https://www.google.com/maps?q=${lat},${lng}`;
    window.open(`https://wa.me/5492616147829?text=${encodeURIComponent(texto)}`);
}

function generarPDF() {
    const element = document.getElementById('form-to-print');
    const opt = { margin: 0.5, filename: 'siniestro.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    html2pdf().set(opt).from(element).save();
}

function toggleMapa(checked) {
    const mapDiv = document.getElementById('map-container');
    if(checked) {
        mapDiv.style.display = 'none';
        document.getElementById('lat').value = "0";
        document.getElementById('lng').value = "0";
    } else {
        mapDiv.style.display = 'block';
        setTimeout(() => map.invalidateSize(), 200);
    }
}

// Iniciar
document.addEventListener('DOMContentLoaded', initMap);