# Verificación frontend — 2026-09-02

- Alcance: tarea OpenSpec 9.2.
- Entorno: frontend local; artefactos completos en `%TEMP%/devsproject-9.2-frontend/`.
- Política: ESLint se ejecutó sin `--fix`.

## Resultado

**Aprobado: cero errores sin resolver.**

| Grupo | Comando | Exit | Resultado resumido |
| --- | --- | --- | --- |
| Lint | `pnpm --filter frontend lint` | 0 | Sin errores; 6 warnings preexistentes fuera de este cambio. |
| Tipos | `pnpm --filter frontend exec tsc --noEmit` | 0 | Sin diagnósticos. |
| Compilación | `pnpm --filter frontend build` | 0 | Producción compilada y 23 rutas generadas. |
| Componente focalizado | `pnpm --filter frontend test -- src/components/community/CommunityDetailPage.test.tsx` | 0 | 1 archivo, 7 tests aprobados. |
| Suite estándar | `pnpm --filter frontend test` | 0 | 35 archivos y 114 tests aprobados en 27,34 s. |

## Correcciones encontradas durante la verificación

1. `tsc` reveló que dos aserciones de `CommunityDetailPage.test.tsx` pasaban `string | null` a Testing Library. El contrato público permite relatos nulos y el componente ya representa ese estado; los fixtures de estas pruebas, en cambio, siempre usan relatos no nulos. Se extrajeron ambas cadenas como fixtures `string` explícitos. El tipo de dominio no cambió.
2. La suite paralela hizo que los flujos más largos de `userEvent` en `ReviewForm` y `ExamForm` superaran el timeout global de 5 s. Cada archivo pasó aislado y la suite completa pasó con una prueba de 10 s. Se configuró `testTimeout: 10_000` en `vitest.config.mts`; el comando estándar volvió a aprobar la suite completa.

## Warnings conocidos

- Dos parámetros `codigo` sin usar en rutas de formulario.
- Una imagen HTML sin `next/image` en `ThreadCard`.
- Un `router` sin usar en `MaterialCreateForm`.
- Un advisory de React Compiler para `react-hook-form` en `MaterialDetail`.
- Una expresión sin efecto en el contrato de respuesta de material.
- Next.js detecta dos lockfiles al elegir el workspace root durante `build`.

Ninguno produjo error, fue introducido por esta tarea ni bloquea los recorridos que se verificarán en 9.3 y 9.4.
