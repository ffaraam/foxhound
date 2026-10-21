# Nueva postulación — revisión

Dirección: Editorial greeting, seed 1984644157. Sin nuevos sorteos.
Pregunta de la pantalla: ¿Cómo registro la postulación que envié?
Identidad: fondo hueso, marca marrón y un pequeño acento verde. El registro de cada envío es el elemento propio de Foxhound.

Se revisaron las capturas completas y los primeros pantallazos a 1440, 768 y 390 px. El formulario domina la pantalla; sus campos, botón y márgenes se alinean. En móvil la navegación se reduce a la marca, porque por ahora existe una sola función. No hay cifras, gráficos ni datos ficticios que conciliar.

La inspección terminó con 0 FAIL y 2 WARN: el color hueso es una decisión explícita del usuario; los textos de 12 px son ayuda y metadatos, mientras los campos y sus etiquetas usan 14 px. La confirmación usa texto seguro y anuncia el resultado mediante una región de estado accesible.

Límites: todavía no existe la lista ni la edición. La fuente se carga desde Google Fonts con una alternativa del sistema si no hay conexión. El almacenamiento está restringido al navegador y origen actuales.

Verificación funcional en Chromium: campos vacíos; fecha futura; recorte de espacios; guardado con estado enviado; segundo envío vacío; anexado sin sobrescribir; nombres con marcado mostrados como texto; conservación tras recarga; protección ante almacenamiento corrupto. Todas pasaron.
