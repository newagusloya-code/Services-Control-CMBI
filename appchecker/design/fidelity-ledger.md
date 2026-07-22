# Revisión de fidelidad visual de la base original

> Esta bitácora y `dashboard-implementation.jpg` documentan la versión anterior al cambio a Service Control CMBI. La implementación actual conserva la estructura, pero añade Therapy, Configuración y la nueva paleta; requiere una captura nueva antes de considerar cerrada la verificación visual.

Concepto: `dashboard-concept.png`  
Implementación: `dashboard-implementation.jpg`  
Viewport comparado: 1536 x 1024

| Punto | Evidencia del concepto | Evidencia implementada | Resultado |
| --- | --- | --- | --- |
| Composición | Sidebar fija, topbar, ocupación en tres columnas, flujo central, tabla y rail derecho | La captura conserva las mismas cinco regiones y proporciones generales | Coincide |
| Copia principal | CheckSport, Control de acceso, navegación, Registrar acceso, Sesiones activas y Actividad de hoy | Etiquetas y orden iguales; el usuario cambia según el rol activo | Coincide |
| Paleta | Verde profundo, esmeralda, cian, ámbar/rojo y blanco | Mismos roles de color, sin gradientes ni decoración ajena | Coincide |
| Contenedores | Layout abierto, radios pequeños, bordes finos y pocos paneles | Radios de 6-8 px, borde de 1 px y cards solo en áreas funcionales | Coincide |
| Iconos | Trazos simples y consistentes para navegación y servicios | `lucide-react`, trazo 1.75-1.8 px y metáforas equivalentes | Coincide |
| Tipografía | Sans compacta tipo Inter/Geist y controles densos | Pila Inter/system con jerarquía compacta y tracking 0 | Coincide |
| Datos visibles | Conteos de demostración fijos; ocupación suma 53 mientras el rail indica 9 activas | Conteos, estados y alertas se derivan del estado local | Desviación intencional por consistencia funcional |
| Responsive | Continuación móvil implícita | Verificado a 390 x 844; menú lateral, bandas apiladas y tablas desplazables | Ampliado |

## Correcciones realizadas durante QA

- Se eliminó el cruce entre la ficha de miembro y el rail de actividad en anchos intermedios.
- Se contuvo el ancho de las tablas en móvil y se mantuvo su desplazamiento interno.
- Se añadió vigencia predeterminada de un año al alta de miembro para evitar formularios incompletos.
- Se ajustó el nombre accesible del control de perfil en móvil.

No quedan diferencias visuales materiales que impidan usar el concepto como referencia de continuidad. Las diferencias de conteos, alertas y estados son producto del estado real de la aplicación, no valores dibujados.
