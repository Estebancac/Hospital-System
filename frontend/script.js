// ============================================================================
// CONFIGURACIÓN DE API
// ============================================================================

// 🚨 IMPORTANTE: Primero despliega el backend en Render, luego actualiza esta URL
// 
// PASO 1: Despliega backend en Render
// PASO 2: Copia la URL que Render te da (ejemplo: https://hospital-knn-api-abcd.onrender.com)
// PASO 3: Reemplaza la línea de abajo con tu URL real
// PASO 4: Haz commit y push
// PASO 5: Despliega frontend en Netlify
//
// Ejemplo de URL de Render:
// const API_URL = 'https://hospital-knn-api-abcd.onrender.com';

const API_URL = 'https://hospital-system-ouf5.onrender.com';  // ← REEMPLAZAR CON TU URL DE RENDER

// Para desarrollo local, usa:
// const API_URL = 'http://localhost:5000';

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

let currentData = null;
let canvas, ctx;
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeCanvas();
    initializeEventListeners();
    updateKManualSlider();
    updateKComparisonSlider();
    checkAPIConnection();
});

async function checkAPIConnection() {
    try {
        const response = await fetch(`${API_URL}/api/health`, {
            method: 'GET',
        });
        if (response.ok) {
            console.log('✅ Conexión con API exitosa');
        } else {
            console.warn('⚠️ API respondió pero con error');
            showToast('Advertencia: Problemas con la conexión API', 'warning');
        }
    } catch (error) {
        console.error('❌ No se pudo conectar con la API');
        showToast('Error: No se puede conectar con el servidor. Verifica la URL de la API.', 'error');
    }
}

function initializeCanvas() {
    canvas = document.getElementById('mapCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 600;
}

function initializeEventListeners() {
    // Generate button
    document.getElementById('generateBtn').addEventListener('click', generateDistribution);
    
    // K toggle
    document.getElementById('kAutoToggle').addEventListener('change', toggleKMode);
    
    // K manual slider
    document.getElementById('kManual').addEventListener('input', updateKManualSlider);
    
    // Zoom controls
    document.getElementById('zoomInBtn').addEventListener('click', () => zoom(1.2));
    document.getElementById('zoomOutBtn').addEventListener('click', () => zoom(0.8));
    document.getElementById('resetViewBtn').addEventListener('click', resetView);
    
    // Canvas drag
    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', drag);
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('mouseleave', endDrag);
    
    // Canvas wheel zoom
    canvas.addEventListener('wheel', wheelZoom);
    
    // Window resize
    window.addEventListener('resize', () => {
        if (currentData) {
            initializeCanvas();
            drawMap();
        }
    });
}

// ============================================================================
// K MODE TOGGLE
// ============================================================================

function toggleKMode() {
    const isAuto = document.getElementById('kAutoToggle').checked;
    const autoSection = document.getElementById('kAutoSection');
    const manualSection = document.getElementById('kManualSection');
    
    if (isAuto) {
        autoSection.classList.add('active');
        manualSection.classList.remove('active');
    } else {
        autoSection.classList.remove('active');
        manualSection.classList.add('active');
    }
}

function updateKManualSlider() {
    const slider = document.getElementById('kManual');
    const value = document.getElementById('kManualValue');
    value.textContent = slider.value;
}

function updateKComparisonSlider() {
    const slider = document.getElementById('kComparison');
    const value = document.getElementById('kComparisonValue');
    value.textContent = slider.value;
}

// ============================================================================
// API CALLS
// ============================================================================

async function generateDistribution() {
    const matriz = parseInt(document.getElementById('matriz').value);
    const casas = parseInt(document.getElementById('casas').value);
    const hospitales = parseInt(document.getElementById('hospitales').value);
    const kAuto = document.getElementById('kAutoToggle').checked;
    const kManual = kAuto ? null : parseInt(document.getElementById('kManual').value);
    
    // Validaciones
    if (matriz <= 0 || casas <= 0 || hospitales <= 0) {
        showToast('Todos los valores deben ser positivos', 'error');
        return;
    }
    
    if (casas + hospitales > matriz * matriz) {
        showToast(`No hay suficiente espacio. Necesitas ${casas + hospitales} posiciones pero solo hay ${matriz * matriz} disponibles`, 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/api/generar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tamaño_matriz: matriz,
                num_casas: casas,
                num_hospitales: hospitales,
                k_manual: kManual
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentData = data;
            
            // Update K display
            document.getElementById('kOptimoDisplay').textContent = data.k_optimo;
            document.getElementById('kComparison').value = data.k_usado;
            document.getElementById('kComparisonValue').textContent = data.k_usado;
            
            // Show sections
            document.getElementById('vizSection').style.display = 'block';
            document.getElementById('metricsSection').style.display = 'grid';
            
            // Draw map
            resetView();
            drawMap();
            
            // Update metrics
            updateMetrics(data.metricas, data.k_usado);
            
            showToast('✅ Distribución generada exitosamente', 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Error al conectar con el servidor. Verifica que la API esté activa.', 'error');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

async function recalcularConK() {
    if (!currentData) {
        showToast('Primero genera una distribución', 'warning');
        return;
    }
    
    const kValue = parseInt(document.getElementById('kComparison').value);
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/api/recalcular_k`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                casas: currentData.casas,
                hospitales: currentData.hospitales,
                k_value: kValue
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateMetrics(data.metricas, data.k_usado);
            showToast(`Métricas recalculadas con K=${kValue}`, 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Error al recalcular métricas', 'error');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

// ============================================================================
// CANVAS DRAWING
// ============================================================================

function drawMap() {
    if (!currentData) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Apply transformations
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    const m = currentData.tamaño_matriz;
    const cellSize = Math.min(canvas.width, canvas.height) / m * 0.9;
    const startX = (canvas.width - cellSize * m) / 2 / scale;
    const startY = (canvas.height - cellSize * m) / 2 / scale;
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1 / scale;
    for (let i = 0; i <= m; i++) {
        ctx.beginPath();
        ctx.moveTo(startX, startY + i * cellSize);
        ctx.lineTo(startX + m * cellSize, startY + i * cellSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(startX + i * cellSize, startY);
        ctx.lineTo(startX + i * cellSize, startY + m * cellSize);
        ctx.stroke();
    }
    
    // Draw houses
    currentData.casas.forEach(casa => {
        const x = startX + casa[1] * cellSize + cellSize / 2;
        const y = startY + casa[0] * cellSize + cellSize / 2;
        
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, cellSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw house emoji
        ctx.font = `${cellSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏠', x, y);
    });
    
    // Draw hospitals
    currentData.hospitales.forEach(hospital => {
        const x = startX + hospital[1] * cellSize + cellSize / 2;
        const y = startY + hospital[0] * cellSize + cellSize / 2;
        
        // Draw connection lines to nearby houses
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.lineWidth = 2 / scale;
        currentData.casas.forEach(casa => {
            const dist = Math.sqrt(
                Math.pow(casa[0] - hospital[0], 2) + 
                Math.pow(casa[1] - hospital[1], 2)
            );
            if (dist < m * 0.15) {
                const casaX = startX + casa[1] * cellSize + cellSize / 2;
                const casaY = startY + casa[0] * cellSize + cellSize / 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(casaX, casaY);
                ctx.stroke();
            }
        });
        
        // Draw hospital marker
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 3 / scale;
        ctx.beginPath();
        ctx.arc(x, y, cellSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw hospital emoji
        ctx.font = `${cellSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏥', x, y);
    });
    
    ctx.restore();
}

// ============================================================================
// CANVAS CONTROLS
// ============================================================================

function zoom(factor) {
    const oldScale = scale;
    scale *= factor;
    scale = Math.max(0.5, Math.min(scale, 10));
    
    const scaleChange = scale / oldScale;
    offsetX = canvas.width / 2 - (canvas.width / 2 - offsetX) * scaleChange;
    offsetY = canvas.height / 2 - (canvas.height / 2 - offsetY) * scaleChange;
    
    drawMap();
}

function wheelZoom(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    zoom(zoomFactor);
}

function resetView() {
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    drawMap();
}

function startDrag(e) {
    isDragging = true;
    dragStartX = e.clientX - offsetX;
    dragStartY = e.clientY - offsetY;
    canvas.style.cursor = 'grabbing';
}

function drag(e) {
    if (!isDragging) return;
    
    offsetX = e.clientX - dragStartX;
    offsetY = e.clientY - dragStartY;
    drawMap();
}

function endDrag() {
    isDragging = false;
    canvas.style.cursor = 'grab';
}

// ============================================================================
// METRICS UPDATE
// ============================================================================

function updateMetrics(metricas, kUsado) {
    // Distance metrics
    document.getElementById('distPromedio').textContent = metricas.distancia_promedio;
    document.getElementById('distMaxima').textContent = metricas.distancia_maxima;
    document.getElementById('distDesviacion').textContent = metricas.desviacion_std;
    
    // KNN metrics
    document.getElementById('kUsado').textContent = kUsado;
    document.getElementById('accuracy').textContent = (metricas.accuracy * 100).toFixed(2) + '%';
    document.getElementById('f1Score').textContent = metricas.f1_score_macro;
    
    // Progress bars
    document.getElementById('accuracyBar').style.width = (metricas.accuracy * 100) + '%';
    document.getElementById('f1Bar').style.width = (metricas.f1_score_macro * 100) + '%';
    
    // Balance metrics
    const balancePercentage = ((1 - metricas.coeficiente_variacion) * 100).toFixed(1);
    document.getElementById('balancePercentage').textContent = balancePercentage + '%';
    document.getElementById('coefVariacion').textContent = metricas.coeficiente_variacion;
    
    drawBalanceChart(balancePercentage);
    
    // Hospital distribution
    updateHospitalDistribution(metricas);
}

function drawBalanceChart(percentage) {
    const canvas = document.getElementById('balanceChart');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 50;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 10;
    ctx.stroke();
    
    // Progress arc
    const progress = (percentage / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progress);
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();
}

function updateHospitalDistribution(metricas) {
    const container = document.getElementById('hospitalDistribution');
    container.innerHTML = '';
    
    metricas.asignaciones.forEach((casas, index) => {
        const item = document.createElement('div');
        item.className = 'hospital-item';
        item.innerHTML = `
            <h4>🏥 Hospital ${index + 1}</h4>
            <div class="hospital-stats">
                <span><strong>Casas:</strong> ${casas}</span>
                <span><strong>Precision:</strong> ${metricas.precision_por_hospital[index]}</span>
                <span><strong>Recall:</strong> ${metricas.recall_por_hospital[index]}</span>
                <span><strong>F1-Score:</strong> ${metricas.f1_por_hospital[index]}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

// ============================================================================
// UI HELPERS
// ============================================================================

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.toggle('active', show);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}