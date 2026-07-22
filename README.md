# Service Control CMBI

Aplicación local para controlar accesos, sesiones e ingresos de Alberca, Gimnasio, Sauna y Therapy.

## Ejecutar

```bash
npm install
npm run dev
```

La terminal mostrará la URL local. El proyecto fue validado en `http://127.0.0.1:4173/`.

## Perfiles de demostración

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| Recepción | `recepcion` | `recep123` |
| Supervisor | `supervisor` | `super123` |
| Gerencia | `admin` | `admin123` |

Son credenciales locales de demostración. Una instalación real debe autenticar contra un servidor y no incluir contraseñas en el cliente.

## Incluido en esta versión

- Dashboard responsive con ocupación real derivada de las sesiones locales.
- Búsqueda de miembros por nombre, ID o teléfono.
- Validación de vigencia, servicios contratados, capacidad y sesión duplicada.
- Check-in, salida y asignación/liberación automática de lockers o consultorios.
- Therapy con consultorios Ruby, Topacio y Onyx, una sesión por consultorio y descripción libre del tratamiento.
- Gestión de miembros con nombre, WhatsApp, edad, plan, servicios, vigencia y credencial digital.
- Lockers disponibles, ocupados y en mantenimiento.
- Reportes permanentes por fecha, servicio y miembro; CSV compatible con Excel e impresión.
- Ticket de sesión limitado a miembro, servicio, entrada y locker/consultorio; resumen de salida por `wa.me`.
- Precios configurables de Therapy reflejados en Ingresos y Reportes.
- Permisos visibles por rol.
- Ingresos exclusivos de Gerencia, cifrados con AES-GCM 256 y una clave local derivada con PBKDF2 (310,000 iteraciones).
- Estado local cifrado con AES-GCM en IndexedDB, con migración de los datos anteriores en texto plano.
- Respaldo JSON cifrado manual, diario o semanal, descargado por el navegador y restaurable desde Configuración.

## Límites actuales

- SICKAR Enterprise todavía no está conectado: faltan contrato de API, autenticación, cola offline y resolución de conflictos.
- La impresión usa el diálogo del navegador. ESC/POS por USB o red requiere un adaptador local o una capa nativa.
- El login local no ofrece seguridad de producción; los roles protegen la experiencia, no sustituyen autorización del lado servidor.
- IndexedDB es almacenamiento por navegador y dispositivo. No hay sincronización multiestación ni base de datos en la nube.
- Los respaldos programados se generan al abrir la aplicación cuando venció el intervalo y requieren que el navegador permita la descarga.
- Alertas nativas, PDF dedicado y empaquetado PWA/Capacitor quedan para una fase posterior.

## Verificación

```bash
npm test
npm run build
npm audit --audit-level=moderate
```

La referencia visual original está en [`design/dashboard-concept.png`](design/dashboard-concept.png). La captura en [`design/dashboard-implementation.jpg`](design/dashboard-implementation.jpg) compara el concepto con la implementación actual.