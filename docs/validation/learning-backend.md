# Verificación de materias, cursos, permisos y Drive

Base: `develop`, `ed2fc26`, repositorio `HyNuwa/devs-projects-web`. Implementación con Node 22, pnpm 10 y PostgreSQL 17. No se fusionó main ni se cambió el tipo de identificador de usuarios existentes.

## Resultados

| Comprobación | Resultado |
|---|---|
| Build backend | Correcto; salida de producción `dist/main.js` |
| Jest unitario | 6 suites, 18 pruebas aprobadas |
| Integración PostgreSQL + Drive simulado | 1 suite, 13 pruebas aprobadas |
| ESLint en código afectado | Sin errores ni advertencias |
| Prisma validate | Correcto |
| OpenSpec strict | Correcto |
| Migraciones en base vacía | Correcto |
| Migración con usuario preexistente | Conservó ID 419 y sus datos; bootstrap auditado creó el primer SUPERADMIN |
| Bootstrap repetido | Rechazado, como corresponde |
| Drive real | Pendiente: entorno sin credenciales Google |
| graphify update | No disponible: el comando graphify no está instalado y develop no contiene grafo |

Los logs completos están en `.local-checks/`, ignorados por Git. Las pruebas usaron bases descartables propias; no modificaron una base de despliegue.

## Cobertura de integración

Creación y validación de materias, carreras y planes; relaciones con cursos; permisos por rol vigente; bloqueo de JWT con rol falso; publicación y rollback de estructuras inválidas; aislamiento entre cursos; inscripción idempotente concurrente; revocación inmediata; archivos privados y rangos 200/206/416; descarga deshabilitada; importación única sin borrar origen; recuperación por operationId; staging ausente; errores de stream sanitizados; cambios de rol concurrentes y rollback ante fallo de auditoría; suspensión y silenciamiento conservando lecturas.

## Revisión independiente

Se revisaron autorización, IDs anidados, FKs, persistencia y recuperación de archivos. Se corrigieron los hallazgos confirmados:

- Abrir staging como promesa antes de crear el stream; crear el cuerpo solo después de preparar Drive y cerrar los recursos.
- Validar clave RSA PEM y correo de cuenta de servicio al iniciar.
- Sanitizar fallos asíncronos durante comprobación de firma de archivos importados.
- Aplicar silenciamiento a escrituras, conservando GET/HEAD/OPTIONS, incluso en rutas que usan permisos de gestión.
- Cerrar el pool PostgreSQL al destruir el módulo para no dejar handles tras las pruebas.

El cambio OpenSpec permanece abierto por la prueba externa pendiente. Las pantallas educativas, pagos, video y progreso no forman parte de esta entrega de backend.
