let map, marker;
const grupoSelect = document.getElementById('grupo-select');
const lineaInput = document.getElementById('linea-input');
const datalistLineas = document.getElementById('lineas');
const ramalSelect = document.getElementById('ramal-select');
const ramalContainer = document.getElementById('container-ramal');

function init() {
    // --- LÓGICA DEL MAPA ---
    map = L.map('map').setView([-32.8895, -68.8458], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (marker) marker.setLatLng(e.latlng);
        else marker = L.marker(e.latlng).addTo(map);
        
        document.getElementById('lat').value = lat.toFixed(6);
        document.getElementById('lng').value = lng.toFixed(6);
    });
}

// PASO 1: Al seleccionar el GRUPO
grupoSelect.addEventListener('change', function() {
    const grupoElegido = this.value;
    
    // Limpiar campos hijos
    lineaInput.value = '';
    datalistLineas.innerHTML = '';
    ramalContainer.style.display = 'none';
    
    if (grupoElegido && DB_RECORRIDOS[grupoElegido]) {
        lineaInput.disabled = false;
        lineaInput.placeholder = "Escribe o selecciona línea...";
        
        // Cargar SOLO las líneas del grupo seleccionado
        const lineas = DB_RECORRIDOS[grupoElegido].recorridos;
        for (const nroLinea in lineas) {
            const option = document.createElement('option');
            option.value = nroLinea;
            datalistLineas.appendChild(option);
        }
    } else {
        lineaInput.disabled = true;
        lineaInput.placeholder = "Primero selecciona un grupo...";
    }
});

// PASO 2: Al escribir/seleccionar la LÍNEA
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

            // --- AQUÍ SE ASIGNAN LOS COLORES ---
            if (punto.includes('>IDA')) {
                el.classList.add('opcion-ida');
            } else if (punto.includes('>VUELTA')) {
                el.classList.add('opcion-vuelta');
            }
            
            ramalSelect.appendChild(el);
        });

        ramalContainer.style.display = 'block';
    } else {
        ramalContainer.style.display = 'none';
    }
});

// Limpiar el input al hacer clic para mostrar todos los recorridos de nuevo
lineaInput.addEventListener('click', function() {
    this.value = ''; // Borra el texto actual
    ramalContainer.style.display = 'none'; // Esconde el ramal hasta que elija uno nuevo
});

// NUEVO: Cambiar el color del selector principal al elegir un ramal
ramalSelect.addEventListener('change', function() {
    // Limpiamos colores previos
    this.classList.remove('bg-ida', 'bg-vuelta');
    
    const selectedOption = this.options[this.selectedIndex];
    
    if (selectedOption.classList.contains('opcion-ida')) {
        this.classList.add('bg-ida');
    } else if (selectedOption.classList.contains('opcion-vuelta')) {
        this.classList.add('bg-vuelta');
    }
});

window.onload = init;