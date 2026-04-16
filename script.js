let map, marker;
let lesionadosCount = 0;

// Elementos del DOM
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

function init() {
    // 1. Inicializar el mapa
    // Inicializar mapa (Usando un filtro de contraste para que las letras se vean un poco más)
    map = L.map('map').setView([-32.8895, -68.8458], 13);

    // Capa de mapa con mayor nitidez
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
        attribution: '© OpenStreetMap',
        maxZoom: 19,
        className: 'map-tiles' // Clase CSS para aplicar filtros
    }).addTo(map);

    // 2. Intentar obtener la ubicación actual
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const pos = [latitude, longitude];
                map.setView(pos, 16);
                if (marker) marker.setLatLng(pos);
                else marker = L.marker(pos).addTo(map);
                document.getElementById('lat').value = latitude.toFixed(6);
                document.getElementById('lng').value = longitude.toFixed(6);
                actualizarMapa(latitude, longitude);
            },
            (error) => console.warn("Error geolocalización:", error.message),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    }

    // 3. Evento de clic en el mapa
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (marker) marker.setLatLng(e.latlng);
        else marker = L.marker(e.latlng).addTo(map);
        document.getElementById('lat').value = lat.toFixed(6);
        document.getElementById('lng').value = lng.toFixed(6);
        if(document.getElementById('no-mapa').checked) return;
        actualizarMapa(e.latlng.lat, e.latlng.lng);
    });

    // 4. Poner fecha de hoy por defecto
    const fechaInput = document.getElementById('siniestro-fecha');
    if(fechaInput) fechaInput.valueAsDate = new Date();
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

function toggleMapa(checked) {
    const container = document.getElementById('map-container');
    const latInp = document.getElementById('lat');
    const lngInp = document.getElementById('lng');
    
    if (checked) {
        container.style.display = 'none';
        latInp.value = "0.0";
        lngInp.value = "0.0";
    } else {
        container.style.display = 'block';
        map.invalidateSize(); // Refresca el mapa al volver a mostrarlo
    }
}

// Lógica de coordenadas automáticas por punto de recorrido
ramalSelect.addEventListener('change', function() {
    const value = this.value;
    // Limpiar colores de ida/vuelta
    this.classList.remove('bg-ida', 'bg-vuelta');
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption.classList.contains('opcion-ida')) this.classList.add('bg-ida');
    else if (selectedOption.classList.contains('opcion-vuelta')) this.classList.add('bg-vuelta');

    // Buscar si el punto seleccionado tiene coordenadas fijas (se limpia el punto del ";" o ">")
    for (let clave in COORDENADAS_FIJAS) {
        if (value.includes(clave)) {
            actualizarMapa(COORDENADAS_FIJAS[clave][0], COORDENADAS_FIJAS[clave][1]);
            break;
        }
    }
});

// --- FUNCION PDF ---
function generarPDF() {
    const elemento = document.getElementById('form-to-print');
    const opt = {
        margin: 10,
        filename: `Siniestro_${document.getElementById('unidad-interno').value || 'Informe'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Ocultar botones antes de imprimir
    document.querySelector('.button-group').style.visibility = 'hidden';
    
    html2pdf().set(opt).from(elemento).save().then(() => {
        document.querySelector('.button-group').style.visibility = 'visible';
    });
}

// --- EVENTOS DE RECORRIDO ---
// ... (se mantienen las funciones de cambiarLesionados y enviarWhatsApp del código original) ...
// Nota: en enviarWhatsApp() actualicé la URL de Google Maps que tenías escrita (tenía un 0 extra)
function enviarWhatsApp() {
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? (el.value || "S/D") : "S/D";
    };
    
    let textoLesionados = "";
    document.querySelectorAll('.lesionado-card').forEach((card, i) => {
        textoLesionados += `%0A*Lesionado ${i+1}:*%0A` +
            `- Nombre: ${card.querySelector('.L-nombre').value || "S/D"}%0A` +
            `- DNI: ${card.querySelector('.L-dni').value || "S/D"}%0A` +
            `- Tel: ${card.querySelector('.L-tel').value || "S/D"}%0A` +
            `- Dir: ${card.querySelector('.L-dir').value || "S/D"}%0A`;
    });

    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;
    const linkMapa = (lat === "0.0") ? "Zona rural (Sin coordenadas)" : `https://www.google.com/maps?q=${lat},${lng}`;

    const mensaje = 
        `*INFORME DE SINIESTRO*%0A` +
        `----------------------------------------%0A` +
        `*CHOFER:* ${getVal('chofer-nombre')}%0A` +
        `*LEGAJO:* ${getVal('chofer-legajo')}%0A%0A` +
        `*UNIDAD:* ${getVal('unidad-interno')} | *PATENTE:* ${getVal('unidad-patente')}%0A%0A` +
        `*LUGAR:* ${getVal('siniestro-lugar')}%0A` +
        `*MAPA:* ${linkMapa}%0A%0A` +
        `*RELATO:* ${getVal('siniestro-relato')}`;

    window.open(`https://wa.me/5492616147829?text=${mensaje}`, '_blank');
}

// Mantener listeners de grupos/líneas del script original
grupoSelect.addEventListener('change', function() {
    const grupoElegido = this.value;
    lineaInput.value = '';
    datalistLineas.innerHTML = '';
    ramalContainer.style.display = 'none';
    
    if (grupoElegido && DB_RECORRIDOS[grupoElegido]) {
        lineaInput.disabled = false;
        lineaInput.placeholder = "Escribe o selecciona línea...";
        const lineas = DB_RECORRIDOS[grupoElegido].recorridos;
        for (const nroLinea in lineas) {
            const option = document.createElement('option');
            option.value = nroLinea;
            datalistLineas.appendChild(option);
        }
    } else {
        lineaInput.disabled = true;
    }
    } else { lineaInput.disabled = true; }
});

lineaInput.addEventListener('input', function() {
    const grupoElegido = grupoSelect.value;
    const lineaElegida = this.value;
    if (!grupoElegido || !lineaElegida) return;

    const puntosEncontrados = DB_RECORRIDOS[grupoElegido]?.recorridos[lineaElegida];
    if (puntosEncontrados) {
        ramalSelect.innerHTML = '<option value="">-- Selecciona un punto del recorrido --</option>';
@@ -86,109 +178,24 @@ lineaInput.addEventListener('input', function() {
            ramalSelect.appendChild(el);
        });
        ramalContainer.style.display = 'block';
    } else {
        ramalContainer.style.display = 'none';
    }
    } else { ramalContainer.style.display = 'none'; }
});

ramalSelect.addEventListener('change', function() {
    this.classList.remove('bg-ida', 'bg-vuelta');
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption.classList.contains('opcion-ida')) this.classList.add('bg-ida');
    else if (selectedOption.classList.contains('opcion-vuelta')) this.classList.add('bg-vuelta');
});

// --- FUNCIONES DE LESIONADOS ---

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
                <div class="field"><label>Nombre:</label><input type="text" class="L-nombre"></div>
                <div class="field"><label>DNI:</label><input type="number" class="L-dni"></div>
            </div>
            <div class="field-row">
                <div class="field"><label>Teléfono:</label><input type="tel" class="L-tel"></div>
                <div class="field"><label>Dirección:</label><input type="text" class="L-dir"></div>
            </div>
        `;
        div.innerHTML = `<h4>Lesionado ${lesionadosCount}</h4><div class="field-row"><div class="field"><label>Nombre:</label><input type="text" class="L-nombre"></div><div class="field"><label>DNI:</label><input type="number" class="L-dni"></div></div>`;
        contenedor.appendChild(div);
    } else if (lesionadosCount > 0) {
        const ultimo = document.getElementById(`lesionado-${lesionadosCount}`);
        if(ultimo) ultimo.remove();
        document.getElementById(`lesionado-${lesionadosCount}`).remove();
        lesionadosCount--;
    }
    displayCount.innerText = lesionadosCount;
}

// --- ENVÍO DE DATOS ---

function enviarWhatsApp() {
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? (el.value || "S/D") : "Campo no encontrado";
    };
    
    // Bloque de Lesionados
    let textoLesionados = "";
    const cards = document.querySelectorAll('.lesionado-card');
    cards.forEach((card, i) => {
        textoLesionados += `%0A*Lesionado ${i+1}:*%0A` +
            `- Nombre: ${card.querySelector('.L-nombre').value || "S/D"}%0A` +
            `- DNI: ${card.querySelector('.L-dni').value || "S/D"}%0A` +
            `- Tel: ${card.querySelector('.L-tel').value || "S/D"}%0A` +
            `- Dir: ${card.querySelector('.L-dir').value || "S/D"}%0A`;
    });

    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;

    const mensaje = 
        `*INFORME DE SINIESTRO*%0A` +
        `----------------------------------------%0A` +
        `*CHOFER:* ${getVal('chofer-nombre')}%0A` +
        `*LEGAJO:* ${getVal('chofer-legajo')}%0A` +
        `*FECHA:* ${getVal('siniestro-fecha')}%0A` +
        `*HORA:* ${getVal('siniestro-hora')}%0A` +
        `*UNIDAD:* ${getVal('unidad-interno')}%0A` +
        `*PATENTE:* ${getVal('unidad-patente')}%0A%0A` +
        
        `*DATOS DEL RECORRIDO*%0A` +
        `*Grupo:* ${getVal('grupo-select')}%0A` +
        `*Línea:* ${getVal('linea-input')}%0A%0A` +
               
        `*LUGAR DEL SINIESTRO*%0A` +
        `*Lugar:* ${getVal('siniestro-lugar')} ${getVal('ramal-select')}%0A` +
        `*Sentido:* ${getVal('sentido-select')}%0A%0A` +
        
        `*POLICIA ACTA:* ${getVal('policia-datos')}%0A%0A` +
        
        `*TERCERO INVOLUCRADO*%0A` +
        `*Apellido y Nombre:* ${getVal('tercero-nombre')}%0A` +
        `*Dni:* ${getVal('tercero-dni')}%0A` +
        `*Telefono:* ${getVal('tercero-tel')}%0A` +
        `*Domicilio:* ${getVal('tercero-dir')}%0A` +
        `*Vehiculo:* ${getVal('tercero-marca')} ${getVal('tercero-modelo')}%0A` +
	`*Dominio:* ${getVal('tercero-dir')}%0A` +
        `*Seguro:* ${getVal('tercero-dominio')}%0A%0A` +
        
        `*LESIONADOS (${lesionadosCount}):*${textoLesionados}%0A` +
        
        `*RELATO:*%0A${getVal('siniestro-relato')}%0A%0A` +
        
        `*UBICACIÓN:* https://www.google.com/maps?q=${lat},${lng}`;

    const telefono = "5492616147829"; 
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
}

// Inicialización única al cargar el DOM
document.addEventListener('DOMContentLoaded', init);