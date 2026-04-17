let map, marker;
let lesionadosCount = 0;

// Diccionario de coordenadas fijas (debe coincidir con recorridos.js)
const COORDENADAS_FIJAS = {
    "CONTROL-SAN-MARTIN-Y-5-ABRIL": [-32.985566, -68.782253],
    "CONTROL-TROPERO-Y-5-ABRIL": [-32.987591, -68.780913],
    "QUEDA-B-AMUPE": [-33.001162, -68.758262],
    "QUEDA-EST.GUTIERREZ": [-32.958955, -68.783622],
    "QUEDE-TERMINAL": [-32.895239, -68.830288],
    "CONTROL-RODEO": [-32.936751, -68.732997],
    "QUEDA-RECOARO": [-33.041453, -68.833136],
    "QUEDA-B-C.SOÑADA": [-33.034928, -68.765966],
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
    map = L.map('map').setView([-32.8895, -68.8458], 20);
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
        mapDiv.style.opacity = '0.6';
        mapDiv.classList.add('map-bloqueado');
        checkboxNoMapa.checked = false;
        checkboxNoMapa.disabled = true;
        checkboxNoMapa.parentElement.style.opacity = "0.5";
    } else {
        mapDiv.style.pointerEvents = 'auto';
        mapDiv.style.opacity = '1';
        mapDiv.classList.remove('map-bloqueado');
        checkboxNoMapa.disabled = false;
        checkboxNoMapa.parentElement.style.opacity = "1";
    }
}

// 1. Al hacer click/focus, se borra el contenido para mostrar el datalist
lineaInput.addEventListener('focus', function() {
    this.value = '';
    gestionarBloqueo(false);
    ramalContainer.style.display = 'none';
});

// 2. Lógica al seleccionar o escribir la línea
lineaInput.addEventListener('input', function() {
    const seleccion = this.value.trim();
    const grupo = grupoSelect.value;

    if (COORDENADAS_FIJAS[seleccion]) {
        actualizarMapa(COORDENADAS_FIJAS[seleccion][0], COORDENADAS_FIJAS[seleccion][1]);
        gestionarBloqueo(true);
    } else {
        gestionarBloqueo(false);
    }

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

function toggleMapa(checked) {
    const container = document.getElementById('map-container');
    container.style.display = checked ? 'none' : 'block';
    if (!checked) {
        setTimeout(() => map.invalidateSize(), 200);
    } else {
        document.getElementById('lat').value = "0";
        document.getElementById('lng').value = "0";
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
        div.innerHTML = `
            <h4>Lesionado ${lesionadosCount}</h4>
            <div class="field-row">
                <input type="text" placeholder="Nombre completo">
                <input type="number" placeholder="DNI">
            </div>
            <div class="field-row" style="margin-top:5px;">
                <input type="text" placeholder="Domicilio">
                <input type="tel" placeholder="Teléfono">
            </div>
        `;
        contenedor.appendChild(div);
    } else if (lesionadosCount > 0) {
        document.getElementById(`les-${lesionadosCount}`).remove();
        lesionadosCount--;
    }
    displayCount.innerText = lesionadosCount;
}

function enviarWhatsApp() {
    // 1. Datos del Personal y Unidad
    const nombre = document.getElementById('chofer-nombre').value;
    const legajo = document.getElementById('chofer-legajo').value;
    const fecha = document.getElementById('siniestro-fecha').value;
    const hora = document.getElementById('siniestro-hora').value;
    const unidad = document.getElementById('unidad-numero').value;
    const patente = document.getElementById('unidad-patente').value;

    // 2. Datos de Recorrido y Ubicación
    const grupo = document.getElementById('grupo-select').value;
    const linea = document.getElementById('linea-input').value;
    const ramal = document.getElementById('ramal-select').value;
    const direccionManual = document.getElementById('siniestro-direccion').value;
    const sentido = document.getElementById('siniestro-sentido').value;
    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;
    const acta = document.getElementById('policia-datos').value;

    // 3. Datos del Tercero
    const tNombre = document.getElementById('tercero-nombre').value;
    const tDni = document.getElementById('tercero-dni').value;
    const tTel = document.getElementById('tercero-tel').value;
    const tDom = document.getElementById('tercero-domicilio').value;
    const tMarca = document.getElementById('tercero-marca').value;
    const tModelo = document.getElementById('tercero-modelo').value;
    const tDominio = document.getElementById('tercero-dominio').value;
    const tSeguro = document.getElementById('tercero-seguro').value;

    // 4. Relato
    const relato = document.getElementById('siniestro-relato').value;

    // 5. Procesar Lesionados dinámicamente
    let infoLesionados = "";
    const listaCards = document.querySelectorAll('.lesionado-card');
    
    if (listaCards.length > 0) {
        listaCards.forEach((card, index) => {
            const inputs = card.querySelectorAll('input');
            infoLesionados += `\n   - *Lesionado ${index + 1}:* ${inputs[0].value || 'S/D'}, DNI: ${inputs[1].value || 'S/D'}, Dom: ${inputs[2].value || 'S/D'}, Tel: ${inputs[3].value || 'S/D'}`;
        });
    } else {
        infoLesionados = " Sin lesionados.";
    }

    // CONSTRUCCIÓN DEL MENSAJE
    let mensaje = `*⚠️ INFORME DE SINIESTRO*\n`;
    mensaje += `------------------------------------------\n`;
    mensaje += `*PERSONAL Y UNIDAD*\n`;
    mensaje += `• Chofer: ${nombre} (Legajo: ${legajo})\n`;
    mensaje += `• Unidad: ${unidad} (Patente: ${patente})\n`;
    mensaje += `• Fecha/Hora: ${fecha} - ${hora}hs\n\n`;

    mensaje += `*UBICACIÓN Y RECORRIDO*\n`;
    mensaje += `• Grupo/Línea: ${grupo} - ${linea}\n`;
    mensaje += `• Sentido: ${sentido}\n`;
    //mensaje += `• Lugar: ${direccionManual} + ${ramal} + ${lat},${lng}\n`;
    mensaje += `• Lugar: ${direccionManual};${ramal};${lat}, ${lng}\n`;
    mensaje += `• Acta/Policía: ${acta}\n\n`;

    mensaje += `*TERCERO INVOLUCRADO*\n`;
    mensaje += `• Nombre: ${tNombre} (DNI: ${tDni})\n`;
    mensaje += `• Tel/Dom: ${tTel} / ${tDom}\n`;
    mensaje += `• Vehículo: ${tMarca} ${tModelo} (Patente: ${tDominio})\n`;
    mensaje += `• Seguro/Póliza: ${tSeguro}\n\n`;

    mensaje += `*LESIONADOS (${lesionadosCount}):*${infoLesionados}\n\n`;

    mensaje += `*RELATO:* ${relato}\n\n`;
    
    mensaje += `*MAPA:* https://www.google.com/maps?q=${lat},${lng}`;

    // Envío
    // LÓGICA DE SELECCIÓN DE TELÉFONO
    let nroTelefono = "";

    // Validamos según lo seleccionado en el id 'grupo-select'
    if (grupo === "Grupo 200") {
        nroTelefono = "5492612013938"; // Reemplaza con el número para el Grupo 200
    } else if (grupo === "Grupo 800") {
        nroTelefono = "5492616147829"; // Reemplaza con el número para el Grupo 800
    } else {
        // Opción por defecto o alerta si no hay selección válida
        alert("Por favor, seleccione un grupo válido para enviar el reporte.");
        return; 
    }

    // Envío final
    const url = `https://wa.me/${nroTelefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}




document.addEventListener('DOMContentLoaded', () => {
    initMap();
    document.getElementById('siniestro-fecha').valueAsDate = new Date();
});