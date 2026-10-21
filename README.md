# Foxhound

Rastreador personal de postulaciones laborales, hecho con HTML, CSS y JavaScript puro.

## Abrir la aplicación

Desde esta carpeta, ejecutá `python3 -m http.server 8000` y abrí http://localhost:8000.

## Primera funcionalidad

El formulario permite guardar empresa, rol y fecha de envío. Los campos son obligatorios y la fecha no puede estar en el futuro. Cada postulación comienza en estado `enviado`.

Los registros se guardan en `localStorage`, bajo la clave `foxhound.applications`, y se conservan entre visitas al mismo origen y navegador. No hay servidor ni sincronización entre dispositivos. Borrar los datos del navegador elimina los registros. Si los datos existentes no se pueden leer, la aplicación evita sobrescribirlos.

## Historial de postulaciones

En `postulaciones.html`, la sección **Mis postulaciones** lista todos los registros de `foxhound.applications`, ordenados por fecha de envío descendente (y fecha de creación para desempatar). Muestra empresa, rol, fecha y estado. La navegación está disponible en escritorio y celular. Incluye un estado vacío y otro de error, con reintento y sin modificar los datos almacenados.

## Cambiar el estado

Desde **Mis postulaciones**, cada registro tiene un selector con Enviado, En proceso, Rechazado y Oferta. El cambio se guarda automáticamente y muestra una confirmación en la fila. Si falla el guardado, vuelve al estado anterior e informa el error. Cada cambio identifica el registro por su ID y lee los datos actuales antes de escribir para conservar los demás campos y registros.

## Nota por postulación

El formulario permite agregar una nota opcional de hasta 2000 caracteres. Se guarda en el campo `notes` del registro y aparece debajo de los datos de cada postulación en el historial, conservando los saltos de línea. Las postulaciones antiguas sin nota muestran «Sin nota». El contenido se muestra como texto, sin interpretar HTML, y se conserva al cambiar el estado. Si falla el guardado, el formulario conserva también la nota.

## Resumen

La sección **Resumen** (`resumen.html`) combina total de postulaciones, empresas contactadas (sin distinguir mayúsculas y espacios exteriores) y envíos de los últimos 30 días incluido hoy. Un gráfico circular muestra la distribución por estado y el porcentaje «en movimiento» (Enviado + En proceso sobre el total). El gráfico de actividad agrupa los envíos de las últimas seis semanas por lunes, con la última semana en curso; excluye fechas futuras e inválidas. El panel de últimos pasos muestra las tres postulaciones más recientes.

Los gráficos se dibujan en SVG con JavaScript puro. Las cifras se calculan desde los registros, muestran ceros reales y se actualizan al volver a la página o cambiar datos en otra pestaña. Los estados desconocidos se incluyen en la distribución y se informan para corregirlos. Los errores de lectura ofrecen reintento sin sobrescribir los datos.
