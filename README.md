# James Diaz Lopez — CV online

Director of Information Technology | Digital Transformation | IT & Data Strategy.

CV interactivo construido con **React 18** y **Three.js** (red de datos 3D que reacciona al mouse y al scroll).
Incluye versión imprimible: el botón **Descargar CV** genera un PDF A4 de 2 páginas desde el navegador.

## Editar contenido

Todo el texto del CV está en [`src/data/cv.js`](src/data/cv.js) (perfil, competencias, experiencia, educación, idiomas).

## Desarrollo

```bash
npm install
npm start      # http://localhost:3000
npm run build  # genera /build
```

## Despliegue

Cada push a `master` construye y publica en la rama `gh-pages` (GitHub Actions).
