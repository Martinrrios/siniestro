let map, marker;
let lesionadosCount = 0;

// Elementos del DOM
const grupoSelect = document.getElementById('grupo-select');
const lineaInput = document.getElementById('linea-input');
const datalistLineas = document.getElementById('lineas');
const ramalSelect = document.getElementById('ramal-select');
const ramalContainer = document.getElementById('container-ramal');

function init() {
    // 1. Inicializar el mapa
    map = L.map('map').setView([-32.8895, -68.8458], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
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
    });

    // 4. Poner fecha de hoy por defecto
    const fechaInput = document.getElementById('siniestro-fecha');
    if(fechaInput) fechaInput.valueAsDate = new Date();
}

// --- EVENTOS DE RECORRIDO ---

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
});

lineaInput.addEventListener('input', function() {
    const grupoElegido = grupoSelect.value;
    const lineaElegida = this.value;
    if (!grupoElegido || !lineaElegida) return;

    const puntosEncontrados = DB_RECORRIDOS[grupoElegido]?.recorridos[lineaElegida];
    if (puntosEncontrados) {
        ramalSelect.innerHTML = '<option value="">-- Selecciona un punto del recorrido --</option>';
        puntosEncontrados.forEach(punto => {
            const el = document.createElement('option');
            el.textContent = punto.replace(';', ' - '); 
            el.value = punto;
            if (punto.includes('>IDA')) el.classList.add('opcion-ida');
            else if (punto.includes('>VUELTA')) el.classList.add('opcion-vuelta');
            ramalSelect.appendChild(el);
        });
        ramalContainer.style.display = 'block';
    } else {
        ramalContainer.style.display = 'none';
    }
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
        contenedor.appendChild(div);
    } else if (lesionadosCount > 0) {
        const ultimo = document.getElementById(`lesionado-${lesionadosCount}`);
        if(ultimo) ultimo.remove();
        lesionadosCount--;
    }
    displayCount.innerText = lesionadosCount;
}

// --- ENVÍO DE DATOS ---

function enviarWhatsApp() {
    const getVal = (id) => document.getElementById(id).value || "No informado";
    
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
        `*CHOFER:* ${getVal('chofer-nombre')} (Leg: ${getVal('chofer-legajo')})%0A` +
	`*LEGAJO:* ${getVal('chofer-legajo')}%0A` +
        `*FECHA:* ${getVal('siniestro-fecha')}%0A` +
	`*HORA:* ${getVal('siniestro-hora')}%0A` +
        `*UNIDAD:* ${getVal('unidad-interno')}%0A` +
	`*PATENTE:* ${getVal('unidad-patente')}%0A%0A` +
        
        `*DATOS DEL RECORRIDO*%0A` +
        `*Grupo:* ${getVal('grupo-select')}%0A` +
        `*Línea:* ${getVal('linea-input')}%0A%0A` +
               

	`*LUGAR DEL SINIESTRO*%0A` +
	`*Lugar:* ${getVal('siniestro-lugar')} ${getVal('ramal-select')} (;${lat}, ${lng})%0A`+
        `*Sentido:* ${getVal('sentido-select')}%0A%0A` +
	`*UBICACIÓN:* https://www.google.com/maps?q=${lat},${lng}%0A%0A`;
        
        `*POLICÍA Nº ACTA:* ${getVal('policia-datos')}%0A%0A` +
        
        `*TERCERO INVOLUCRADO*%0A` +
        `*Apellido y Nombre:* ${getVal('tercero-nombre')}%0A` +
	`*Dni:* ${getVal('tercero-dni')}%0A` +
	`*Teléfono:* ${getVal('tercero-tel')}%0A` +
	`*Domicilio:* ${getVal('tercero-dir')}%0A` +
        `*Vehículo:* ${getVal('tercero-marca')} ${getVal('tercero-modelo')} (Pat: ${getVal('tercero-dominio')})%0A` +
        `*Seguro:* ${getVal('tercero-seguro')}%0A%0A` +
        
        `*LESIONADOS (${lesionadosCount}):*${textoLesionados}%0A` +
        
        `*RELATO:*%0A${getVal('siniestro-relato')}%0A%0A` +
        
        `*UBICACIÓN:* https://www.google.com/maps?q=${lat},${lng}`;

    const telefono = "5492616147829"; 
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
}

// Inicialización única
document.addEventListener('DOMContentLoaded', init);