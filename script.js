

let map, marker;

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

    // IMPORTANTE: Llamar a la función para que cargue las líneas de recorridos.js
    cargarLineas(); 
}

   // --- LÓGICA DE LOS DESPLEGABLES ---
const lineaInput = document.getElementById('linea-input');
const datalistLineas = document.getElementById('lineas');
const ramalContainer = document.getElementById('container-ramal');
const ramalSelect = document.getElementById('ramal-select');

// 1. Poblar el datalist de Líneas automáticamente desde DB_RECORRIDOS
function cargarLineas() {
    if (typeof DB_RECORRIDOS === 'undefined') return;
    datalistLineas.innerHTML = ''; 
    
    for (const grupo in DB_RECORRIDOS) {
        const lineas = DB_RECORRIDOS[grupo].recorridos;
        for (const nroLinea in lineas) {
            const option = document.createElement('option');
            option.value = nroLinea;
            datalistLineas.appendChild(option);
        }
    }
}

// 2. Evento cuando el usuario selecciona una línea
lineaInput.addEventListener('input', function() {
    const seleccion = this.value;
    let puntosEncontrados = null;

    // Buscar la línea en todos los grupos de la base de datos
    for (const grupo in DB_RECORRIDOS) {
        if (DB_RECORRIDOS[grupo].recorridos[seleccion]) {
            puntosEncontrados = DB_RECORRIDOS[grupo].recorridos[seleccion];
            break;
        }
    }

    if (puntosEncontrados) {
        ramalSelect.innerHTML = '<option value="">-- Selecciona un punto del recorrido --</option>';
        
        puntosEncontrados.forEach(punto => {
            const el = document.createElement('option');
            
            // MODIFICACIÓN: Ahora reemplazamos el ";" por " - " para que figure el número delante
            // Ejemplo: "1;CONTROL MAIPU" se convierte en "1 - CONTROL MAIPU"
            el.textContent = punto.replace(';', ' - '); 
            
            el.value = punto;
            ramalSelect.appendChild(el);
        });

        ramalContainer.style.display = 'block';
    } else {
        ramalContainer.style.display = 'none';
    }
});

// Inicializar la carga de líneas al cargar el script
cargarLineas()

window.onload = init;