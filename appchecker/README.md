# CheckSport / Appchecker

Primera versión funcional de una aplicación local para controlar accesos a alberca, gimnasio y sauna.

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
- Check-in, salida y asignación/liberación automática de lockers.
- Gestión de miembros con planes, servicios, vigencia y confirmación de borrado.
- Lockers disponibles, ocupados y en mantenimiento.
- Reportes por fecha, servicio y miembro; exportación CSV e impresión.
- Permisos visibles por rol.
- Ingresos exclusivos de Gerencia, cifrados con AES-GCM 256 y una clave local derivada con PBKDF2 (310,000 iteraciones).
- Persistencia en IndexedDB. Los datos no salen del navegador.

## Límites actuales

- SICKAR Enterprise todavía no está conectado: faltan contrato de API, autenticación, cola offline y resolución de conflictos.
- La impresión usa el diálogo del navegador. ESC/POS por USB o red requiere un adaptador local o una capa nativa.
- El login local no ofrece seguridad de producción; los roles protegen la experiencia, no sustituyen autorización del lado servidor.
- IndexedDB es almacenamiento por navegador y dispositivo. No hay sincronización multiestación ni respaldo automático.
- Alertas nativas, PDF dedicado y empaquetado PWA/Capacitor quedan para una fase posterior.

## Verificación

```bash
npm test
npm run build
npm audit --audit-level=moderate
```

La referencia visual está en [`design/dashboard-concept.png`](design/dashboard-concept.png) y la última captura de implementación en [`design/dashboard-implementation.jpg`](design/dashboard-implementation.jpg).
