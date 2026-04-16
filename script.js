let map, marker;
let lesionadosCount = 0;

// Coordenadas fijas solicitadas
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
const capaCheckbox = document.getElementById('capa-checkbox');

function init() {
    map = L.map('map').setView([-32.8895, -68.8458], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
        className: 'map-tiles'
    }).addTo(map);

    map.on('click', (e) => {
        if(checkboxNoMapa.checked) return;
        actualizarMapa(e.latlng.lat, e.latlng.lng);
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

// Bloquea/Desbloquea Mapa y Checkbox
function setEstadoBloqueo(bloquear) {
    if (bloquear) {
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.off('click');
        document.getElementById('map').style.opacity = "0.6";
        document.getElementById('map').style.cursor = "not-allowed";
        
        // Bloquear checkbox rural
        checkboxNoMapa.checked = false;
        checkboxNoMapa.disabled = true;
        capaCheckbox.style.opacity = "0.5";
        document.getElementById('map-container').style.display = 'block';
    } else {
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.on('click', (e) => {
            if(!checkboxNoMapa.checked) actualizarMapa(e.latlng.lat, e.latlng.lng);
        });
        document.getElementById('map').style.opacity = "1";
        document.getElementById('map').style.cursor = "crosshair";
        
        checkboxNoMapa.disabled = false;
        capaCheckbox.style.opacity = "1";
    }
}

function toggleMapa(checked) {
    const container = document.getElementById('map-container');
    if (checked) {
        container.style.display = 'none';
        document.getElementById('lat').value = "0.0";
        document.getElementById('lng').value = "0.0";
    } else {
        container.style.display = 'block';
        map.invalidateSize();
    }
}

// Limpiar Recorrido al hacer un solo clic
lineaInput.addEventListener('click', function() {
    this.value = '';
    ramalContainer.style.display = 'none';
    setEstadoBloqueo(false); 
});

// Detectar selección de Línea o Punto de Control
lineaInput.addEventListener('input', function() {
    const val = this.value.toUpperCase();
    let encontrado = false;

    // Verificar si es punto fijo
    for (let clave in COORDENADAS_FIJAS) {
        if (val.includes(clave)) {
            actualizarMapa(COORDENADAS_FIJAS[clave][0], COORDENADAS_FIJAS[clave][1]);
            encontrado = true;
            break;
        }
    }
    setEstadoBloqueo(encontrado);

    // Cargar ramales si es una línea común
    const puntos = DB_RECORRIDOS[grupoSelect.value]?.recorridos[this.value];
    if (puntos) {
        ramalSelect.innerHTML = '<option value="">-- Selecciona punto --</option>';
        puntos.forEach(p => {
            const opt = document.createElement('option');
            opt.textContent = p.replace(';', ' - ');
            opt.value = p;
            if (p.includes('>IDA')) opt.classList.add('opcion-ida');
            else if (p.includes('>VUELTA')) opt.classList.add('opcion-vuelta');
            ramalSelect.appendChild(opt);
        });
        ramalContainer.style.display = 'block';
    } else {
        ramalContainer.style.display = 'none';
    }
});

// PDF
function generarPDF() {
    const elemento = document.getElementById('form-to-print');
    const opt = {
        margin: 10,
        filename: `Siniestro_${document.getElementById('unidad-interno').value || 'Informe'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    document.querySelector('.button-group').style.visibility = 'hidden';
    html2pdf().set(opt).from(elemento).save().then(() => {
        document.querySelector('.button-group').style.visibility = 'visible';
    });
}

// WhatsApp
function enviarWhatsApp() {
    const getVal = (id) => document.getElementById(id)?.value || "S/D";
    const lat = getVal('lat');
    const lng = getVal('lng');
    const linkMapa = (lat === "0.0") ? "Zona rural" : `https://www.google.com/maps?q=${lat},${lng}`;

    const mensaje = `*INFORME DE SINIESTRO*%0A*CHOFER:* ${getVal('chofer-nombre')}%0A*INTERNO:* ${getVal('unidad-interno')}%0A*LUGAR:* ${getVal('siniestro-lugar')}%0A*MAPA:* ${linkMapa}`;
    window.open(`https://wa.me/5492616147829?text=${mensaje}`, '_blank');
}

// Carga inicial de datos
grupoSelect.addEventListener('change', function() {
    lineaInput.value = '';
    datalistLineas.innerHTML = '';
    if (this.value && DB_RECORRIDOS[this.value]) {
        lineaInput.disabled = false;
        for (const nro in DB_RECORRIDOS[this.value].recorridos) {
            const opt = document.createElement('option');
            opt.value = nro;
            datalistLineas.appendChild(opt);
        }
    }
});

function cambiarLesionados(delta) {
    const contenedor = document.getElementById('lista-lesionados');
    if (delta > 0) {
        lesionadosCount++;
        const div = document.createElement('div');
        div.className = 'lesionado-card';
        div.id = `lesionado-${lesionadosCount}`;
        div.innerHTML = `<h4>Lesionado ${lesionadosCount}</h4><div class=\"field-row\"><div class=\"field\"><label>Nombre:</label><input type=\"text\" class=\"L-nombre\"></div><div class=\"field\"><label>DNI:</label><input type=\"number\" class=\"L-dni\"></div></div>`;
        contenedor.appendChild(div);
    } else if (lesionadosCount > 0) {
        document.getElementById(`lesionado-${lesionadosCount}`).remove();
        lesionadosCount--;
    }
    document.getElementById('cant-lesionados').innerText = lesionadosCount;
}

document.addEventListener('DOMContentLoaded', init);