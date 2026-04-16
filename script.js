let map, marker;
let lesionadosCount = 0;

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

// Función de Normalización (Quita acentos, comillas y símbolos)
function normalizar(t) {
    return t.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "");
}

function setEstadoBloqueo(bloquear) {
    const mapaDiv = document.getElementById('map');
    if (bloquear) {
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.off('click');
        mapaDiv.style.opacity = "0.5";
        mapaDiv.style.pointerEvents = "none";
        
        checkboxNoMapa.checked = false;
        checkboxNoMapa.disabled = true;
        wrapperCheckbox.classList.add('disabled');
        document.getElementById('map-container').style.display = 'block';
    } else {
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        mapaDiv.style.opacity = "1";
        mapaDiv.style.pointerEvents = "auto";
        
        map.off('click');
        map.on('click', (e) => {
            if(!checkboxNoMapa.checked) actualizarMapa(e.latlng.lat, e.latlng.lng);
        });

        checkboxNoMapa.disabled = false;
        wrapperCheckbox.classList.remove('disabled');
    }
}

lineaInput.addEventListener('input', function() {
    const valOriginal = this.value;
    const valLimpio = normalizar(valOriginal);
    let encontrado = false;

    for (let clave in COORDENADAS_FIJAS) {
        if (valLimpio.includes(normalizar(clave))) {
            actualizarMapa(COORDENADAS_FIJAS[clave][0], COORDENADAS_FIJAS[clave][1]);
            encontrado = true;
            break;
        }
    }

    setEstadoBloqueo(encontrado);

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

// PDF y WhatsApp
function generarPDF() {
    const elemento = document.getElementById('form-to-print');
    html2pdf().from(elemento).save(`Informe_${Date.now()}.pdf`);
}

function enviarWhatsApp() {
    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;
    const mensaje = `Siniestro en: https://www.google.com/maps?q=${lat},${lng}`;
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
        div.className = 'lesionado-card';
        div.id = `les-${lesionadosCount}`;
        div.innerHTML = `<h4>Lesionado ${lesionadosCount}</h4><div class="field-row"><div class="field"><label>Nombre:</label><input type="text"></div><div class="field"><label>DNI:</label><input type="number"></div></div>`;
        contenedor.appendChild(div);
    } else if (lesionadosCount > 0) {
        document.getElementById(`les-${lesionadosCount}`).remove();
        lesionadosCount--;
    }
    document.getElementById('cant-lesionados').innerText = lesionadosCount;
}

document.addEventListener('DOMContentLoaded', init);