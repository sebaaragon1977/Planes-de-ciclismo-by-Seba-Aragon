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
- **📋 Mis salidas**: cada salida queda guardada con distancia, tiempo, desnivel, velocidad, pulso, potencia (media, máxima y normalizada), cadencia y energía. Se guarda al llegar o con **🏁 Terminar y guardar** si cortás antes, y te llega el resumen por mail. Desde el historial podés repetir la ruta.
- **🏆 Ranking por ruta**: mejor tiempo de cada ciclista (salidas completas desde el km 0), con su apodo y la bandera de su país.
- **Elegí dónde largar**: tocá o arrastrá la altimetría de abajo antes de iniciar.
- **Arcos inflables de largada y llegada** con vallas, banderas y público que alienta. Textos y colores en `arcos.json` (espacio para publicidad).
- **Pruebas y zonas**: test de FTP de 20 minutos y test de FC máxima y umbral, en un óvalo plano; te calcula las zonas de potencia y de pulso. **🎯 Calibrar a cero**: soltás los pedales y calibra solo.
- **Encuentros en la ruta**: ves a los demás en el 3D y en la altimetría, el aviso de rebufo, y cuando están a la vista (menos de 150 m) pueden activar una videollamada chiquita que se corta sola al alejarse.
- **Cuenta con mail y clave**: te registrás una vez (mail, país, provincia o estado y clave), verificás el mail y después entrás con mail y clave.
- **Instalable como app** desde Chrome o Edge (botón 📲 en el panel).

Contacto: sebaaragon1977@gmail.com

## Requisitos
- **Google Chrome o Edge** (Mac, Windows, Linux o Android). Safari, Firefox e iPhone no permiten Bluetooth web.
- Rodillo smart **Bluetooth FTMS** (Wahoo, Tacx, Elite, Saris, Zwift Hub…) o **ANT+ FE-C** con pendrive USB (por ejemplo, Bkool).
- Opcional: pulsómetro Bluetooth.

## Uso rápido
1. Registrate y entrá con el link que te llega por mail.
2. Cargá tus datos en el panel: peso, FTP y umbral de pulso.
3. **🌍 Rutas famosas**, **📂 Cargar GPX** o **🏋️ Cargar entrenamiento** (`demo_3x5_200W.json` es un ejemplo).
4. **🔗 Conectar rodillo** (primero prueba ANT+, después Bluetooth).
5. Pedaleá: arranca sola. Al terminar se guarda en **📋 Mis salidas** y podés **exportar el TCX** para Garmin Connect o Strava.

## Mail con el resumen
La función `supabase/functions/resumen-salida` manda el mail desde aragonapps1@gmail.com. Necesita el secreto `SMTP_PASS` (contraseña de aplicación de Gmail) en Supabase → Edge Functions → Secrets.

## Carteles
Editá `carteles.json`. Para una marca, agregá un objeto con `"tipo": "imagen"`, un `"id"` y `"imagen": "carteles/archivo.png"` (proporción 2:1). Las vistas de cada cartel aparecen en `estadisticas.html`.

Imágenes satelitales © Esri, Maxar, Earthstar Geographics · Relieve: AWS Terrain Tiles (Mapzen) · Trazados de rutas © colaboradores de OpenStreetMap (ODbL).

Hecha por Sebastián Aragón.
