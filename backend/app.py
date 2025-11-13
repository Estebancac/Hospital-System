from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import numpy as np
import random
from collections import Counter
import os

app = Flask(__name__)

# Configurar CORS para permitir requests desde Netlify
CORS(app, resources={
    r"/api/*": {
        "origins": ["*"],  
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# ============================================================================
# FUNCIONES DEL ALGORITMO KNN Y K-MEANS
# ============================================================================

def calcular_distancia_euclidiana(punto1, punto2):
    """Calcula la distancia euclidiana entre dos puntos."""
    return np.sqrt((punto1[0] - punto2[0])**2 + (punto1[1] - punto2[1])**2)


def encontrar_k_vecinos(punto, datos_entrenamiento, k):
    """Encuentra los K vecinos más cercanos a un punto dado."""
    distancias = []
    
    for posicion, etiqueta in datos_entrenamiento:
        dist = calcular_distancia_euclidiana(punto, posicion)
        distancias.append((dist, etiqueta))
    
    distancias.sort(key=lambda x: x[0])
    vecinos = [etiqueta for _, etiqueta in distancias[:k]]
    
    return vecinos


def predecir_knn(punto, datos_entrenamiento, k):
    """Predice la clase de un punto usando KNN."""
    vecinos = encontrar_k_vecinos(punto, datos_entrenamiento, k)
    contador = Counter(vecinos)
    clase_predicha = contador.most_common(1)[0][0]
    return clase_predicha


def calcular_k_optimo(num_casas, num_hospitales):
    """Calcula el valor K óptimo."""
    max_k = min(15, num_casas // 2)
    k_sugerido = max(3, min(2 * num_hospitales + 1, max_k))
    
    if k_sugerido % 2 == 0:
        k_sugerido += 1
    
    return k_sugerido


def distribuir_casas(m, num_casas):
    """Distribuye casas aleatoriamente en posiciones únicas de la matriz."""
    posiciones_disponibles = [(i, j) for i in range(m) for j in range(m)]
    casas = random.sample(posiciones_disponibles, num_casas)
    return casas


def ubicar_hospitales_optimamente(casas, num_hospitales, m):
    """Determina las ubicaciones óptimas para los hospitales usando K-Means."""
    casas_array = np.array(casas)
    
    # Inicializar centroides
    indices_iniciales = random.sample(range(len(casas)), num_hospitales)
    centroides = casas_array[indices_iniciales].astype(float)
    
    max_iteraciones = 100
    tolerancia = 0.001
    iteraciones = 0
    
    for iteracion in range(max_iteraciones):
        asignaciones = []
        for casa in casas_array:
            distancias = [calcular_distancia_euclidiana(casa, c) for c in centroides]
            cluster = np.argmin(distancias)
            asignaciones.append(cluster)
        
        asignaciones = np.array(asignaciones)
        
        nuevos_centroides = np.zeros_like(centroides)
        for k in range(num_hospitales):
            puntos_cluster = casas_array[asignaciones == k]
            if len(puntos_cluster) > 0:
                nuevos_centroides[k] = puntos_cluster.mean(axis=0)
            else:
                nuevos_centroides[k] = casas_array[random.randint(0, len(casas)-1)]
        
        cambio = np.abs(centroides - nuevos_centroides).max()
        centroides = nuevos_centroides
        iteraciones = iteracion + 1
        
        if cambio < tolerancia:
            break
    
    # Ajustar a posiciones enteras
    posiciones_ocupadas = set(casas)
    hospitales = []
    
    for centroide in centroides:
        pos_propuesta = (int(round(centroide[0])), int(round(centroide[1])))
        pos_propuesta = (
            max(0, min(m-1, pos_propuesta[0])),
            max(0, min(m-1, pos_propuesta[1]))
        )
        
        if pos_propuesta in posiciones_ocupadas:
            pos_propuesta = encontrar_posicion_libre_cercana(pos_propuesta, posiciones_ocupadas, m)
        
        hospitales.append(pos_propuesta)
        posiciones_ocupadas.add(pos_propuesta)
    
    return hospitales, iteraciones


def encontrar_posicion_libre_cercana(posicion, ocupadas, m):
    """Encuentra la posición libre más cercana a una posición dada."""
    radio = 1
    while radio < m:
        for i in range(-radio, radio + 1):
            for j in range(-radio, radio + 1):
                nueva_pos = (posicion[0] + i, posicion[1] + j)
                
                if 0 <= nueva_pos[0] < m and 0 <= nueva_pos[1] < m:
                    if nueva_pos not in ocupadas:
                        return nueva_pos
        radio += 1
    
    for i in range(m):
        for j in range(m):
            if (i, j) not in ocupadas:
                return (i, j)
    
    return posicion


def calcular_metricas(casas, hospitales, k_value):
    """Calcula métricas de evaluación del sistema."""
    distancias_minimas = []
    asignaciones = [0] * len(hospitales)
    asignaciones_reales = []
    
    for casa in casas:
        distancias = [calcular_distancia_euclidiana(casa, h) for h in hospitales]
        dist_min = min(distancias)
        hospital_cercano = distancias.index(dist_min)
        
        distancias_minimas.append(dist_min)
        asignaciones[hospital_cercano] += 1
        asignaciones_reales.append(hospital_cercano)
    
    # Métricas básicas
    distancia_promedio = float(np.mean(distancias_minimas))
    distancia_maxima = float(np.max(distancias_minimas))
    desviacion_std = float(np.std(distancias_minimas))
    cv_balance = float(np.std(asignaciones) / np.mean(asignaciones)) if np.mean(asignaciones) > 0 else 0
    
    # Calcular F1-Score usando KNN
    datos_entrenamiento = [(casa, asignaciones_reales[i]) for i, casa in enumerate(casas)]
    k_efectivo = min(k_value, len(casas) - 1)
    predicciones = []
    
    for i, casa in enumerate(casas):
        datos_sin_actual = [datos_entrenamiento[j] for j in range(len(casas)) if j != i]
        prediccion = predecir_knn(casa, datos_sin_actual, k_efectivo)
        predicciones.append(prediccion)
    
    # Calcular métricas por hospital
    precision_por_hospital = []
    recall_por_hospital = []
    f1_por_hospital = []
    
    for h in range(len(hospitales)):
        tp = sum(1 for real, pred in zip(asignaciones_reales, predicciones) if real == h and pred == h)
        fp = sum(1 for real, pred in zip(asignaciones_reales, predicciones) if real != h and pred == h)
        fn = sum(1 for real, pred in zip(asignaciones_reales, predicciones) if real == h and pred != h)
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        precision_por_hospital.append(float(precision))
        recall_por_hospital.append(float(recall))
        f1_por_hospital.append(float(f1))
    
    f1_macro = float(np.mean(f1_por_hospital))
    accuracy = sum(1 for real, pred in zip(asignaciones_reales, predicciones) if real == pred) / len(casas)
    
    return {
        'distancia_promedio': round(distancia_promedio, 2),
        'distancia_maxima': round(distancia_maxima, 2),
        'desviacion_std': round(desviacion_std, 2),
        'coeficiente_variacion': round(cv_balance, 3),
        'asignaciones': asignaciones,
        'f1_score_macro': round(f1_macro, 4),
        'accuracy': round(accuracy, 4),
        'precision_por_hospital': [round(p, 3) for p in precision_por_hospital],
        'recall_por_hospital': [round(r, 3) for r in recall_por_hospital],
        'f1_por_hospital': [round(f, 3) for f in f1_por_hospital]
    }


# ============================================================================
# RUTAS DE LA API
# ============================================================================

@app.route('/')
def index():
    """Renderiza la página principal."""
    return render_template('index.html')


@app.route('/api/generar', methods=['POST'])
def generar_distribucion():
    """Genera la distribución de casas y hospitales."""
    try:
        data = request.json
        m = int(data['tamaño_matriz'])
        num_casas = int(data['num_casas'])
        num_hospitales = int(data['num_hospitales'])
        k_manual = data.get('k_manual', None)
        
        # Validaciones
        if m <= 0 or num_casas <= 0 or num_hospitales <= 0:
            return jsonify({'error': 'Todos los valores deben ser positivos'}), 400
        
        if num_casas + num_hospitales > m * m:
            return jsonify({'error': f'No hay suficiente espacio. Necesitas {num_casas + num_hospitales} posiciones pero solo hay {m*m} disponibles'}), 400
        
        # Calcular K óptimo
        k_optimo = calcular_k_optimo(num_casas, num_hospitales)
        k_usado = int(k_manual) if k_manual else k_optimo
        
        # Generar distribución
        casas = distribuir_casas(m, num_casas)
        hospitales, iteraciones = ubicar_hospitales_optimamente(casas, num_hospitales, m)
        
        # Calcular métricas
        metricas = calcular_metricas(casas, hospitales, k_usado)
        
        return jsonify({
            'success': True,
            'casas': casas,
            'hospitales': hospitales,
            'metricas': metricas,
            'k_optimo': k_optimo,
            'k_usado': k_usado,
            'iteraciones': iteraciones,
            'tamaño_matriz': m
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/recalcular_k', methods=['POST'])
def recalcular_con_k():
    """Recalcula métricas con un valor K diferente."""
    try:
        data = request.json
        casas = [tuple(c) for c in data['casas']]
        hospitales = [tuple(h) for h in data['hospitales']]
        k_value = int(data['k_value'])
        
        metricas = calcular_metricas(casas, hospitales, k_value)
        
        return jsonify({
            'success': True,
            'metricas': metricas,
            'k_usado': k_value
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)