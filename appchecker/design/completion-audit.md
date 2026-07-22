# Auditoría de implementación

Fecha: 22 de julio de 2026

## Estado por fase

| Fase | Estado | Evidencia actual |
| --- | --- | --- |
| Sauna a capacidad 2 | Comprobado | `SERVICES.sauna.capacity = 2`; migración limita los lockers a S-01 y S-02; prueba de capacidad concurrente. |
| Therapy | Comprobado | Consultorios Ruby, Topacio y Onyx; descripción libre obligatoria; entrada, salida y duración persistidas; no se asigna un cuarto consultorio. |
| Precios | Comprobado | Configuración normaliza y guarda tipos de Therapy; el precio vigente aparece en Ingresos y Reportes. |
| Miembros | Comprobado | Correo eliminado; nombre, WhatsApp, edad, plan, servicios y vigencia validados; ID `CMBI-####` y credencial digital. |
| Ticket y WhatsApp | Comprobado | El modo de impresión limita la salida al ticket; al cerrar sesión se forma un enlace `wa.me` con servicio, duración, fecha y vigencia. |
| Reportes | Comprobado | Columnas solicitadas, filtros por fecha/servicio, orden por fecha y CSV con BOM, punto y coma y saltos CRLF para Excel. |
| Seguridad y respaldo | Comprobado | Estado cifrado con AES-GCM en IndexedDB; migración elimina el registro anterior en texto plano; respaldo cifrado manual/diario/semanal y restauración con clave. |
| Marca | Implementado, QA visual pendiente | Nombre, metadatos, logo, favicon y colores CMBI aplicados. El navegador interno bloqueó la inspección de localhost, por lo que falta una captura actual en escritorio y móvil. |

## Verificación automática

- `npm test`: 28 pruebas en 9 archivos.
- `npm run build`: compilación Vite completada.
- `npm audit --audit-level=moderate`: 0 vulnerabilidades.
- Servidor local: `http://127.0.0.1:4173/`.

La captura `dashboard-implementation.jpg` es histórica y no prueba la versión actual. No debe sustituirse la validación visual pendiente por el resultado del build o por las pruebas DOM.
