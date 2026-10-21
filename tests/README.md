# Pruebas de aceptación

Requisitos: Node.js 22 o superior, Chrome/Chromium y el cliente CDP de Taste Skill. No requiere paquetes npm. El script busca el cliente en `~/.codex/skills/taste-skill/scripts/lib/cdp.mjs`; se puede indicar otra ubicación con `FOXHOUND_CDP`.

Con Foxhound servido en `http://127.0.0.1:8000/`, ejecutar desde la raíz:

```sh
node tests/acceptance.mjs
```

Opciones: `FOXHOUND_URL` para otra URL y `FOXHOUND_TEST_OUTPUT` para otra carpeta de resultados. El script devuelve código 0 si todos los criterios y las comprobaciones adicionales pasan; 1 en caso contrario.

Usa un perfil de navegador temporal y separado. El flujo de aceptación escribe por teclado, hace clic en botones, cambia estados con el teclado y recarga páginas. No altera el almacenamiento de tu navegador habitual. Guarda reporte Markdown, resultados JSON y capturas en `test-results/acceptance/`.

Verifica los diez criterios solicitados (HU1 a HU5 y generales), además de campos vacíos y fecha futura. Captura excepciones JavaScript, `console.error` y respuestas HTTP fallidas de recursos locales. Los errores de recursos externos se registran por separado. HU4 cubre la nota al crear una postulación y su visualización; no edición posterior.
