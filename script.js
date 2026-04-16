let map, marker;
let lesionadosCount = 0;

// Objeto de coordenadas (Normalizamos las claves para facilitar la búsqueda)
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
const capaCheckbox = document.getElementById('capa-checkbox');

function init() {
    map = L.map('map').setView([-32.8895, -68.8458], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    map.on('click', (e) => {
        if(!checkboxNoMapa.disabled && !checkboxNoMapa.checked) {
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

// FUNCION DE BLOQUEO ROBUSTA
function setEstadoBloqueo(bloquear) {
    if (bloquear) {
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.off('click');
        document.getElementById('map').style.opacity = "0.5";
        document.getElementById('map').style.pointerEvents = "none"; // Impide cualquier interacción
        
        checkboxNoMapa.checked = false;
        checkboxNoMapa.disabled = true;
        capaCheckbox.style.background = "#ebebeb";
        capaCheckbox.style.opacity = "0.6";
        document.getElementById('map-container').style.display = 'block';
    } else {
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        document.getElementById('map').style.opacity = "1";
        document.getElementById('map').style.pointerEvents = "auto";
        
        checkboxNoMapa.disabled = false;
        capaCheckbox.style.background = "#f8f9fa";
        capaCheckbox.style.opacity = "1";
    }
}

// NORMALIZADOR PARA COMPARAR SIN ERRORES (Quita acentos, comillas y símbolos)
function normalizar(texto) {
    return texto.toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9]/g, "");
}

// EVENTO DE SELECCIÓN EN RECORRIDO
lineaInput.addEventListener('input', function() {
    const valOriginal = this.value;
    const valLimpio = normalizar(valOriginal);
    let encontrado = false;

    // Comparar contra coordenadas fijas
    for (let clave in COORDENADAS_FIJAS) {
        if (valLimpio.includes(normalizar(clave))) {
            actualizarMapa(COORDENADAS_FIJAS[clave][0], COORDENADAS_FIJAS[clave][1]);
            encontrado = true;
            break;
        }
    }

    setEstadoBloqueo(encontrado);

    // Cargar Ramales si es una línea numérica
    const puntos = DB_RECORRIDOS[grupoSelect.value]?.recorridos[valOriginal];
    if (puntos) {
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
    if (checked) {
        container.style.display = 'none';
        document.getElementById('lat').value = "0.0";
        document.getElementById('lng').value = "0.0";
    } else {
        container.style.display = 'block';
        map.invalidateSize();
    }
}

// PDF y WhatsApp (Funciones básicas)
function generarPDF() {
    const elemento = document.getElementById('form-to-print');
    html2pdf().from(elemento).save(`Siniestro_${Date.now()}.pdf`);
}

function enviarWhatsApp() {
    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;
    const mensaje = `Informe de Siniestro - Ubicación: https://www.google.com/maps?q=${lat},${lng}`;
    window.open(`https://wa.me/5492616147829?text=${encodeURIComponent(mensaje)}`, '_blank');
}

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
        div.id = `les-${lesionadosCount}`;
        div.innerHTML = `<label>Lesionado ${lesionadosCount}:</label><input type="text" placeholder="Nombre">`;
        contenedor.appendChild(div);
    } else if (lesionadosCount > 0) {
        document.getElementById(`les-${lesionadosCount}`).remove();
        lesionadosCount--;
    }
    document.getElementById('cant-lesionados').innerText = lesionadosCount;
}

document.addEventListener('DOMContentLoaded', init);