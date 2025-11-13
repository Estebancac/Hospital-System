# 🏥 Sistema de Ubicación Óptima de Hospitales

Sistema web full-stack para optimizar la ubicación de hospitales usando algoritmos K-Nearest Neighbors (KNN) y K-Means desde cero.

**🌐 Demo en Vivo:** [Ver Demo](https://tu-app.netlify.app) *(Actualiza con tu URL)*

## 🏗️ Arquitectura

```
┌─────────────────┐      HTTPS/JSON     ┌──────────────────┐
│                 │ ◄─────────────────► │                  │
│  Frontend       │                     │   Backend API    │
│  (Netlify)      │                     │   (Render)       │
│                 │                     │                  │
│  • HTML/CSS/JS  │                     │  • Flask         │
│  • Canvas       │                     │  • NumPy         │
│  • Visualización│                     │  • KNN/K-Means   │
└─────────────────┘                     └──────────────────┘
```

## 📁 Estructura del Proyecto

```
hospital-knn-system/
│
├── backend/               # API Flask
│   ├── app.py            # Servidor + Algoritmos
│   ├── requirements.txt  # Dependencias Python
│   └── render.yaml       # Config Render
│
├── frontend/             # Interfaz Web
│   ├── index.html       # HTML principal
│   ├── style.css        # Estilos modernos
│   ├── script.js        # Lógica + Canvas
│   └── netlify.toml     # Config Netlify
│
├── .gitignore
├── README.md
└── DEPLOY.md            # Guía de despliegue
```

## ✨ Características

### 🎨 Frontend (Netlify)
- ✅ Interfaz moderna con glassmorphism
- ✅ Canvas HTML5 interactivo (zoom, pan)
- ✅ Control dinámico de K (automático/manual)
- ✅ Visualización en tiempo real
- ✅ Responsive design

### 🔧 Backend (Render)
- ✅ API RESTful con Flask
- ✅ KNN implementado desde cero
- ✅ K-Means para clustering
- ✅ Métricas completas (F1, Accuracy, etc.)
- ✅ CORS configurado

## 🚀 Despliegue

### Opción 1: Ver en Producción (Recomendado)

**Frontend:** https://tu-app.netlify.app  
**API:** https://hospital-knn-api.onrender.com

### Opción 2: Desarrollo Local

```bash
# 1. Clonar repositorio
git clone https://github.com/TU-USUARIO/hospital-knn-system.git
cd hospital-knn-system

# 2. Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
# Backend corriendo en http://localhost:5000

# 3. Frontend (en otra terminal)
cd ../frontend
# Abrir index.html en navegador
# O usar un servidor local:
python -m http.server 8000
# Frontend en http://localhost:8000
```

### Opción 3: Desplegar tu Propia Versión

📖 **Guía completa:** Ver [DEPLOY.md](DEPLOY.md)

**Resumen rápido:**

1. **Backend en Render:**
   - Conecta tu repo de GitHub
   - Root directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `gunicorn app:app`

2. **Frontend en Netlify:**
   - Conecta tu repo de GitHub
   - Base directory: `frontend`
   - Publish directory: `.`
   - Actualiza `API_URL` en `script.js`

## 🎮 Cómo Usar

1. **Configurar Parámetros:**
   - Tamaño de matriz (5-1000)
   - Número de casas
   - Número de hospitales

2. **Elegir Modo K:**
   - **Automático:** K = 2 × hospitales + 1
   - **Manual:** Slider de 1-51 (solo impares)

3. **Generar Distribución:**
   - Clic en "Generar Distribución"
   - Algoritmo calcula posiciones óptimas

4. **Explorar Resultados:**
   - Zoom/Pan en el mapa
   - Ver métricas detalladas
   - Experimentar con diferentes K

## 📊 Métricas Implementadas

### Distancia
- Promedio casa-hospital
- Distancia máxima
- Desviación estándar

### KNN
- **Accuracy:** Precisión general
- **F1-Score:** Balance precision/recall
- **Precision/Recall:** Por hospital

### Balance
- Coeficiente de variación
- Distribución de casas por hospital
- Gráfico circular de eficiencia

## 🛠️ Tecnologías

| Categoría | Tecnología |
|-----------|-----------|
| **Backend** | Flask, NumPy, Gunicorn |
| **Frontend** | HTML5, CSS3, Vanilla JS |
| **Deploy** | Render (API), Netlify (Web) |
| **Algoritmos** | KNN, K-Means (desde cero) |

## 📈 Algoritmos Implementados

### K-Means (Ubicación de Hospitales)
```python
# Clustering de casas
# Iteración hasta convergencia
# Optimización de centroides
# Ajuste a posiciones válidas
```

### KNN (Validación)
```python
# K vecinos más cercanos
# Validación cruzada leave-one-out
# Métricas: Precision, Recall, F1
```

## 🎨 Diseño UI/UX

- **Glassmorphism:** Efectos de vidrio moderno
- **Gradientes:** Púrpura → Azul vibrante
- **Animaciones:** Transiciones suaves
- **Iconos:** Font Awesome 6
- **Responsive:** Mobile-friendly

## 🐛 Solución de Problemas

### Backend lento (primera request)
**Causa:** Plan gratuito de Render se duerme  
**Solución:** Espera 30-60 segundos o usa plan pagado

### Error CORS
**Causa:** API no permite tu dominio  
**Solución:** Actualiza CORS en `backend/app.py`

### Canvas no se muestra
**Causa:** JavaScript bloqueado o API_URL incorrecta  
**Solución:** Verifica consola (F12) y URL en `script.js`

## 📄 API Endpoints

### GET `/api/health`
Verificar estado de la API
```json
{
  "status": "healthy",
  "message": "API is running correctly"
}
```

### POST `/api/generar`
Generar nueva distribución
```json
{
  "tamaño_matriz": 50,
  "num_casas": 200,
  "num_hospitales": 10,
  "k_manual": null
}
```

### POST `/api/recalcular_k`
Recalcular métricas con K diferente
```json
{
  "casas": [[0,1], [2,3], ...],
  "hospitales": [[5,5], [10,10], ...],
  "k_value": 7
}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m '✨ Add nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es de código abierto y está disponible para fines educativos.

## 👤 Autor

**Esteban Guzman**  
GitHub: [@tu-usuario](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- Implementación educativa de KNN y K-Means
- Sin uso de sklearn u otras librerías de ML
- Diseño inspirado en tendencias modernas de UI

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!

📧 ¿Preguntas? Abre un [Issue](https://github.com/tu-usuario/hospital-knn-system/issues)