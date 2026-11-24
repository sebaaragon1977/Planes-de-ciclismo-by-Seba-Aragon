# RutaViva — tu ruta real, en el rodillo

App web gratuita para rodillo smart: cargá un track **GPX** (por ejemplo, exportado de Garmin) o elegí una de las **rutas famosas**, y pedaleala en **3D** con relieve y foto satelital. El rodillo cambia la resistencia según la pendiente. También corre **entrenamientos estructurados en modo ERG** (.json o .zwo de Zwift).

**Usala acá:** https://sebaaragon1977.github.io/Planes-de-ciclismo-by-Seba-Aragon/

## Qué tiene
- Registro gratis con email, país y ciudad (link de acceso por mail; quedás conectado en ese navegador).
- Español, inglés y portugués.
- **🌍 Rutas famosas**: 33 recorridos (Alpe d'Huez, Stelvio, Mont Ventoux, Tourmalet, Angliru, Gran Fondo 7 Lagos, Mendoza, Villa Carlos Paz, San Luis, Punta del Este y más). Los marcados *aprox.* son aproximados.
- Paisaje mejorado: cielo con nubes, balizas, arbustos y mojones de kilómetro.
- Carteles al costado de la ruta cada 3 a 5 minutos (se configuran en `carteles.json`).
- Botón para dejar tu opinión.

## Requisitos
- **Google Chrome o Edge** (Mac, Windows, Linux o Android). Safari, Firefox e iPhone no permiten Bluetooth web.
- Rodillo smart **Bluetooth FTMS** (Wahoo, Tacx, Elite, Saris, Zwift Hub…) o **ANT+ FE-C** con pendrive USB (por ejemplo, Bkool).
- Opcional: pulsómetro Bluetooth.

## Uso rápido
1. Registrate y entrá con el link que te llega por mail.
2. Cargá tus datos en el panel: peso, FTP y umbral de pulso.
3. **🌍 Rutas famosas**, **📂 Cargar GPX** o **🏋️ Cargar entrenamiento** (`demo_3x5_200W.json` es un ejemplo).
4. **🔗 Conectar rodillo** (primero prueba ANT+, después Bluetooth).
5. Pedaleá: arranca sola. Al terminar podés **exportar el TCX** y subirlo a Garmin Connect o Strava.

## Carteles
Editá `carteles.json`. Para una marca, agregá un objeto con `"tipo": "imagen"`, un `"id"` y `"imagen": "carteles/archivo.png"` (proporción 2:1). Las vistas de cada cartel aparecen en `estadisticas.html`.

Imágenes satelitales © Esri, Maxar, Earthstar Geographics · Relieve: AWS Terrain Tiles (Mapzen) · Trazados de rutas © colaboradores de OpenStreetMap (ODbL).

Hecha por Sebastián Aragón.
