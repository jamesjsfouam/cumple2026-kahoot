# Cumple 2026 · Kahoot en vivo

## Estructura

- `index.html`: panel de James, vista Kahoot y pantalla del anfitrión.
- `css/styles.css`: estilos compartidos.
- `js/app.js`: preguntas, puntajes, sincronización MQTT y telemetría.

## Cómo usarlo

1. Abre `index.html` desde un servidor web local o desde GitHub Pages.
2. En la vista **Pantalla Show en Vivo**, James inicia cada carta.
3. Comparte el HTML de amigos desde el botón de descarga.
4. Los jugadores escriben su nombre y pulsan **Entrar a la partida**.
5. James controla el inicio, la revelación y el avance; las respuestas aparecen en el panel de telemetría.

La sincronización usa MQTT sobre WebSockets y el PIN de sala configurado en el editor. El archivo descargado para amigos incrusta los estilos y el código para conservar la apariencia del Kahoot.

## Experiencia de jugador

- Cada jugador elige un personaje/avatar antes de entrar.
- Las preguntas y respuestas tienen animaciones de entrada.
- La música ambiental sintetizada se puede activar o desactivar; comienza después de entrar a la partida.
- Al terminar aparece un podio con los tres mejores jugadores y sus personajes.
