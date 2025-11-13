# 🚀 Guía de Despliegue: Render + Netlify

## 📁 Estructura Final del Proyecto

```
hospital-knn-system/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── render.yaml
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── netlify.toml
│
├── .gitignore
└── README.md
```

---

## 🔧 PARTE 1: Preparar los Archivos

### 1.1 Crear Estructura de Carpetas

```bash
mkdir hospital-knn-system
cd hospital-knn-system

mkdir backend
mkdir frontend
```

### 1.2 Mover Archivos a sus Carpetas

**Backend (carpeta `backend/`):**
- ✅ `app.py` (actualizado con CORS y health check)
- ✅ `requirements.txt` (incluye gunicorn)
- ✅ `render.yaml` (configuración de Render)

**Frontend (carpeta `frontend/`):**
- ✅ `index.html` (sin Flask templates)
- ✅ `style.css` (sin cambios)
- ✅ `script.js` (con API_URL configurable)
- ✅ `netlify.toml` (configuración de Netlify)

### 1.3 Crear .gitignore

```bash
# En la raíz del proyecto
touch .gitignore
```

Contenido:
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
.venv

# Flask
instance/
.webassets-cache

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Netlify
.netlify/
```

---

## 🔴 PARTE 2: Desplegar Backend en Render

### 2.1 Inicializar Git y Subir a GitHub

```bash
# En la raíz del proyecto
git init
git add .
git commit -m "🎉 Initial commit: Backend and Frontend separated"

# Conectar con GitHub (reemplaza TU-USUARIO)
git remote add origin https://github.com/TU-USUARIO/hospital-knn-system.git
git branch -M main
git push -u origin main
```

### 2.2 Crear Cuenta en Render

1. Ve a https://render.com
2. Clic en **"Get Started"**
3. Selecciona **"Sign in with GitHub"**
4. Autoriza a Render acceder a tus repositorios

### 2.3 Crear Web Service en Render

1. **Dashboard** → Clic en **"New +"** → **"Web Service"**

2. **Conectar Repositorio:**
   - Busca `hospital-knn-system`
   - Clic en **"Connect"**

3. **Configurar el Servicio:**
   ```
   Name: hospital-knn-api
   Region: Oregon (US West) o el más cercano
   Branch: main
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn app:app
   ```

4. **Plan:**
   - Selecciona **"Free"** (suficiente para pruebas)
   - ⚠️ Nota: El plan gratuito se duerme después de 15 minutos de inactividad

5. Clic en **"Create Web Service"**

### 2.4 Esperar el Despliegue

- Render comenzará a instalar dependencias y desplegar
- Proceso tarda **5-10 minutos**
- Verás logs en tiempo real
- Cuando termine, verás: **"Your service is live 🎉"**

### 2.5 Obtener URL del Backend

Tu API estará disponible en:
```
https://hospital-knn-api.onrender.com
```

O similar (Render asigna el nombre automáticamente)

### 2.6 Verificar que Funciona

Abre en el navegador:
```
https://hospital-knn-api.onrender.com/api/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "message": "API is running correctly"
}
```

---

## 🔵 PARTE 3: Desplegar Frontend en Netlify

### 3.1 Actualizar URL de la API

**IMPORTANTE:** Antes de desplegar, actualiza `frontend/script.js`:

```javascript
// Línea 8 - Reemplaza con tu URL de Render
const API_URL = 'https://hospital-knn-api.onrender.com';
```

### 3.2 Hacer Commit del Cambio

```bash
git add frontend/script.js
git commit -m "🔧 Update API URL for production"
git push origin main
```

### 3.3 Crear Cuenta en Netlify

1. Ve a https://netlify.com
2. Clic en **"Sign up"**
3. Selecciona **"Sign up with GitHub"**
4. Autoriza a Netlify

### 3.4 Desplegar en Netlify

**Opción A: Desde GitHub (Recomendado)**

1. **Dashboard** → Clic en **"Add new site"** → **"Import an existing project"**

2. **Conectar con GitHub:**
   - Selecciona **"GitHub"**
   - Autoriza si es necesario
   - Busca `hospital-knn-system`
   - Clic en el repositorio

3. **Configurar Build:**
   ```
   Branch to deploy: main
   Base directory: frontend
   Build command: (dejar vacío)
   Publish directory: .
   ```

4. Clic en **"Deploy site"**

**Opción B: Deploy Manual (Más Rápido)**

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# O con yarn
yarn global add netlify-cli

# Login a Netlify
netlify login

# Deploy desde la carpeta frontend
cd frontend
netlify deploy --prod

# Cuando pregunte:
# - Publish directory: . (punto)
# - Create & configure a new site: Yes
# - Team: (selecciona tu team)
# - Site name: hospital-knn-frontend (o el que prefieras)
```

### 3.5 Obtener URL del Frontend

Netlify te asignará una URL como:
```
https://hospital-knn-frontend.netlify.app
```

O:
```
https://random-name-123456.netlify.app
```

### 3.6 (Opcional) Personalizar Dominio

1. **Site settings** → **"Change site name"**
2. Ingresa un nombre único: `mi-hospital-knn`
3. Tu URL será: `https://mi-hospital-knn.netlify.app`

---

## ✅ PARTE 4: Verificar que Todo Funciona

### 4.1 Probar la Aplicación

1. Abre tu URL de Netlify en el navegador
2. Ingresa valores en el formulario:
   - Matriz: 30
   - Casas: 50
   - Hospitales: 5
3. Clic en **"Generar Distribución"**
4. Deberías ver el mapa y las métricas

### 4.2 Si hay Errores de CORS

Si ves errores de CORS en la consola del navegador:

**En Render:**
1. Ve a tu servicio
2. **Environment** → **Add Environment Variable**
3. Agrega:
   ```
   Key: CORS_ORIGINS
   Value: https://tu-app.netlify.app
   ```
4. **Save Changes** y espera redespliegue

**En el código `backend/app.py`:**
```python
# Reemplaza esta línea:
"origins": ["*"],

# Con tu dominio específico:
"origins": ["https://tu-app.netlify.app"],
```

### 4.3 Si el Backend está "dormido"

El plan gratuito de Render duerme el servicio después de 15 minutos:
- **Primera request** puede tardar 30-60 segundos
- Requests subsiguientes son rápidas
- Considera el plan pagado ($7/mes) para servicio 24/7

---

## 🔄 PARTE 5: Actualizar la Aplicación

### Backend (Render)

```bash
# Hacer cambios en backend/app.py
git add backend/
git commit -m "🔧 Update backend logic"
git push origin main

# Render detecta el push y redesplega automáticamente
```

### Frontend (Netlify)

```bash
# Hacer cambios en frontend/
git add frontend/
git commit -m "💄 Update UI styles"
git push origin main

# Netlify detecta el push y redesplega automáticamente
```

---

## 📊 PARTE 6: Monitoreo y Logs

### Render Logs

1. Ve a tu servicio en Render
2. Tab **"Logs"**
3. Verás todos los requests y errores en tiempo real

### Netlify Logs

1. Ve a tu sitio en Netlify
2. **Deploys** → Clic en un deploy
3. **Deploy log** muestra el proceso de despliegue

---

## 🐛 Solución de Problemas Comunes

### Error: "Cannot connect to API"

**Causa:** La URL de la API en `script.js` es incorrecta

**Solución:**
```javascript
// Verifica que la URL sea correcta (sin barra al final)
const API_URL = 'https://hospital-knn-api.onrender.com';
```

### Error: "CORS policy blocked"

**Causa:** Backend no permite requests desde tu dominio de Netlify

**Solución:** Actualiza CORS en `backend/app.py`:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://tu-app.netlify.app"],
        # ...
    }
})
```

### Backend muy lento

**Causa:** Plan gratuito de Render se duerme

**Opciones:**
1. Espera 30-60 segundos en la primera request
2. Upgrade a plan pagado ($7/mes)
3. Usa un servicio de "keep-alive" gratuito

### Cambios no se reflejan

**Backend:**
```bash
# Forzar redespliegue
git commit --allow-empty -m "🔄 Force redeploy"
git push origin main
```

**Frontend:**
```bash
# Limpiar caché del navegador
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

---

## 🎯 Checklist Final

- [ ] Backend desplegado en Render
- [ ] Health check funciona: `/api/health`
- [ ] Frontend desplegado en Netlify
- [ ] URL de API actualizada en `script.js`
- [ ] Aplicación carga sin errores
- [ ] Puedes generar distribuciones
- [ ] Métricas se muestran correctamente
- [ ] Canvas zoom/pan funciona
- [ ] Comparador de K funciona

---

## 🎉 ¡Listo!

Tu aplicación está desplegada y disponible en:

**Frontend:** `https://tu-app.netlify.app`
**Backend API:** `https://hospital-knn-api.onrender.com`

Comparte el link del frontend con quien quieras! 🚀

---

## 📞 Soporte

**Render Docs:** https://render.com/docs
**Netlify Docs:** https://docs.netlify.com

**Problemas con GitHub:**
```bash
git status
git log --oneline
```

**Verificar deployments:**
- Render: https://dashboard.render.com
- Netlify: https://app.netlify.com