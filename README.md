# Foxhound

Rastreador personal de postulaciones laborales desarrollado con **HTML, CSS y JavaScript puro**, sin frameworks ni backend. Permite organizar los envíos de CV, seguir sus estados y guardar los detalles de cada oportunidad.

## Funcionalidades

- **Nueva postulación:** empresa, rol, fecha de envío y nota opcional. Los campos principales son obligatorios y se rechazan fechas futuras.
- **Calendario personalizado:** meses en español, navegación entre meses, acceso a hoy y selección con teclado. Flechas para moverse, PageUp/PageDown para cambiar de mes, Enter/Espacio para seleccionar y Escape para cerrar. Si el navegador no admite diálogos modales, conserva el selector nativo.
- **Mis postulaciones:** historial ordenado por fecha de envío, con empresa, rol, fecha, estado y nota. Incluye un mensaje cuando no hay registros.
- **Estados:** Enviado, En proceso, Rechazado y Oferta. Los cambios se guardan automáticamente y se confirman en la fila.
- **Notas editables:** hasta 2000 caracteres, con saltos de línea. Se pueden agregar o editar desde el historial, guardar o cancelar. Guardar una nota vacía la elimina. Si el guardado falla, el borrador permanece disponible.
- **Guardar resumen en PDF:** desde Resumen → Guardar PDF, elegir «Guardar como PDF» en el diálogo del navegador. Incluye métricas, gráficos, últimas postulaciones y fecha de generación, con diseño A4. La copia conserva los datos del momento; no es un respaldo del historial completo.
- **Resumen:** total de postulaciones, empresas contactadas y envíos de los últimos 30 días; distribución por estado, actividad de las últimas seis semanas y las tres postulaciones más recientes.
- **Diseño responsive:** navegación y formularios adaptados a escritorio, tablet y celular.

El indicador **«en movimiento»** representa las postulaciones en Enviado o En proceso sobre el total. Las semanas del gráfico comienzan el lunes y la última está en curso. Las empresas se cuentan sin distinguir mayúsculas ni espacios exteriores.

## Ejecutar localmente

Solo necesitás un navegador moderno y un servidor de archivos estáticos. Una opción es Python 3:

```sh
git clone https://github.com/ffaraam/foxhound.git
cd foxhound
python3 -m http.server 8000 --bind 127.0.0.1
```

Abrí [http://127.0.0.1:8000](http://127.0.0.1:8000). No hace falta instalar paquetes ni compilar la aplicación.

## Guardado de datos

Los registros se guardan en `localStorage`, bajo la clave `foxhound.applications`. Las postulaciones, sus estados y sus notas se conservan al recargar. Los cambios entre pestañas del mismo origen actualizan las vistas; una nota abierta en edición mantiene su borrador.

Los datos pertenecen al **mismo navegador y origen**: `localhost:8000` y `127.0.0.1:8000` son orígenes distintos, al igual que puertos diferentes. No hay cuentas, backend ni sincronización entre dispositivos. Borrar los datos del navegador elimina los registros. Los datos guardados no se incluyen en el repositorio.

Los errores de lectura ofrecen reintento sin sobrescribir los registros. Los cambios de estado y notas identifican cada postulación por su ID y conservan sus demás campos. Las notas se muestran como texto, sin interpretar HTML.

## Identidad visual

| Color | Hexadecimal | Uso |
| --- | --- | --- |
| Blanco hueso | `#F3F0E8` | Fondo principal |
| Marrón Foxhound | `#8E643E` | Marca y acciones |
| Verde pradera | `#A2C65A` | Ofertas y acentos de datos |

El logo representa un foxhound americano. La interfaz usa **Instrument Sans**, cargada desde Google Fonts, con una fuente del sistema como alternativa si no hay conexión. Los gráficos del dashboard están dibujados en SVG con JavaScript.

## Archivos principales

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` / `app.js` | Formulario, validación y creación de postulaciones |
| `calendar.js` | Calendario personalizado y navegación con teclado |
| `postulaciones.html` / `postulaciones.js` | Historial, cambios de estado y edición de notas |
| `resumen.html` / `resumen.js` | Métricas, gráficos y postulaciones recientes |
| `styles.css` | Identidad visual y diseño responsive |
| `assets/` | Logo y recursos de marca |
| `tests/` | Pruebas de aceptación y calendario |

## Pruebas

Las pruebas automatizadas requieren **Node.js 22 o superior, Chrome/Chromium y el cliente CDP de Taste Skill**; estos requisitos corresponden a las pruebas, no a la aplicación. Consultá [tests/README.md](tests/README.md) para configurar el cliente.

Con el servidor local iniciado, ejecutá desde la raíz:

```sh
node tests/acceptance.mjs
node tests/calendar.mjs
```

La suite de aceptación cubre los **10 criterios de HU1 a HU5 y generales**: formulario, guardado, historial, estado vacío, selector de estado, actualización inmediata, notas editables, resumen, persistencia y demo sin errores. También verifica campos vacíos y fechas futuras. La prueba de calendario incluye teclado, años bisiestos y adaptación a móvil.

Las pruebas usan un perfil temporal aislado y no modifican las postulaciones de tu navegador habitual. El reporte, los resultados JSON y las capturas de aceptación se generan en `test-results/acceptance/`, carpeta excluida de Git. La suite fue verificada en Chrome; no se afirma compatibilidad probada con otros navegadores.
