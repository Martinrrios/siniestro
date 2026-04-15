let map, marker;
const grupoSelect = document.getElementById('grupo-select');
const lineaInput = document.getElementById('linea-input');
const datalistLineas = document.getElementById('lineas');
const ramalSelect = document.getElementById('ramal-select');
const ramalContainer = document.getElementById('container-ramal');

function init() {
    // 1. Inicializar el mapa con una vista por defecto (Mendoza)
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

                // Centrar el mapa y hacer zoom en la ubicación actual
                map.setView(pos, 16);

                // Colocar el marcador automáticamente en la ubicación actual
                if (marker) marker.setLatLng(pos);
                else marker = L.marker(pos).addTo(map);

                // Llenar los campos de latitud y longitud
                document.getElementById('lat').value = latitude.toFixed(6);
                document.getElementById('lng').value = longitude.toFixed(6);
            },
            (error) => {
                console.warn("Error de geolocalización o permiso denegado:", error.message);
                // Si falla o deniega, el mapa simplemente queda en la vista por defecto
            },
            {
                enableHighAccuracy: true, // Usa el GPS para mayor precisión
                timeout: 5000,
                maximumAge: 0
            }
        );
    }

    // 3. Mantener el evento de clic para corregir la ubicación manualmente
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

// Forzar apertura de la lista con un solo clic
lineaInput.addEventListener('mousedown', function() {
    this.value = ''; // Borra el contenido
    
    // Si el campo estaba deshabilitado, no hacemos nada
    if(this.disabled) return;

    // Pequeño retardo para asegurar que el navegador procese el borrado 
    // y despliegue la lista completa
    setTimeout(() => {
        const event = new Event('input', { bubbles: true });
        this.dispatchEvent(event);
    }, 1);
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

function enviarWhatsApp() {
    const grupo = document.getElementById('grupo-select').value;
    const linea = document.getElementById('linea-input').value;
    const ramal = document.getElementById('ramal-select').value;
    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;
    
    // Crear el link de Google Maps con la ubicación marcada
    const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

    const mensaje = `*INFORME DE SINIESTRO*%0A` +
                    `----------------------------%0A` +
                    `*Grupo:* ${grupo}%0A` +
                    `*Línea:* ${linea}%0A` +
                    `*Ramal:* ${ramal}%0A` +
                    `*Ubicación:* ${googleMapsLink}`;

    const telefono = "5492616147829"; // Reemplaza con tu número
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
}

function enviarWhatsApp() {
    // 1. Obtener los valores de los campos
    const grupo = document.getElementById('grupo-select').value;
    const linea = document.getElementById('linea-input').value;
    const ramal = document.getElementById('ramal-select').value;
    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;

    // Validar que los campos básicos estén llenos
    if (!grupo || !linea || !lat) {
        alert("Por favor, selecciona Grupo, Recorrido y marca la ubicación en el mapa.");
        return;
    }

    // 2. Crear el enlace de Google Maps
    // Usamos el formato de búsqueda directa para que abra el pin exacto
    const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

    // 3. Construir el mensaje (usando %0A para saltos de línea)
    const mensaje = 
        `*INFORME DE SINIESTRO*%0A` +
        `----------------------------%0A` +
        `*Grupo:* ${grupo}%0A` +
        `*Línea:* ${linea}%0A` +
        `*Ramal:* ${ramal}%0A` +
        `*Coordenadas:* ${lat}, ${lng}%0A%0A` +
        `*Ubicación en Mapa:*%0A${googleMapsLink}`;

    // 4. Configurar el número (Formato: 549 + área + número)
    const telefono = "549261XXXXXXX"; // <--- REEMPLAZA CON TU NÚMERO AQUÍ

    // 5. Abrir WhatsApp
    const url = `https://wa.me/${telefono}?text=${mensaje}`;
    window.open(url, '_blank');
}

window.onload = init;