# 📜 DEVs PROJECT — Reglas, Convenciones y Arquitectura

> **Rol del Desarrollador / IA:** Actúa como un Senior Full Stack Developer especializado en NestJS y Next.js. No solo debes generar código funcional, sino también mantener una arquitectura limpia, escalable y fácil de mantener. Antes de escribir código, piensa si existe una forma más simple, reutilizable o mantenible.

---

## 🏗️ 1. Principios Generales

- **Visión a largo plazo:** Escribe código pensando en un proyecto que crecerá durante años.
- **Legibilidad > Brevedad:** Prioriza la legibilidad sobre escribir menos líneas. El código se lee 10 veces más de lo que se escribe.
- **KISS (Keep It Simple, Stupid):** Evita complejidad innecesaria y sobreingeniería.
- **DRY (Don't Repeat Yourself):** Si una funcionalidad ya existe, reutilízala. Si encuentras código duplicado, propón un refactor antes de crear otro.
- **SOLID:** Aplica los principios SOLID cuando sea aplicable (especialmente Single Responsibility y Dependency Inversion).

---

## ♻️ 2. Reutilización

Antes de crear cualquier nueva pieza de código (función, servicio, helper, hook, componente, DTO, Repository, módulo), **verifica si ya existe algo que haga lo mismo**.

> 🚫 **Regla de oro:** Nunca dupliques lógica solamente porque el contexto sea diferente. Extrae la lógica a un lugar común (`packages/shared`, `common/utils`, `hooks/shared`, etc.).

---

## 🏷️ 3. Convenciones de Nombres (Naming)

Los nombres deben representar la **RESPONSABILIDAD** del código, nunca el contexto desde donde fue solicitado o la UI que lo renderiza.

### ❌ Incorrecto vs ✅ Correcto

**Ejemplo Frontend:** Solicitud: *"Haz una vista retro de materias"*
- ❌ `MateriasRetro.tsx`, `useRetroSubjects()`, `getRetroSubjects()`
- ✅ `SubjectsPage.tsx`, `SubjectsList.tsx`, `useSubjects()`, `getSubjects()`
> *El término "Retro" pertenece únicamente al diseño. No aporta significado al dominio y genera ruido.*

**Ejemplo Backend (Contexto):** Solicitud: *"Permitir cambiar contraseña desde el perfil."*
- ❌ `changePasswordFromProfile()`, `ProfilePasswordService`
- ✅ `changePassword()`, `PasswordService`, `AuthController`
> *El backend no debe conocer desde qué pantalla proviene una petición.*

**Ejemplo Backend (Autorización):** Solicitud: *"Eliminar usuario desde el panel administrador."*
- ❌ `deleteUserByAdmin()`, `AdminDeleteUserService`
- ✅ `deleteUser()` (protegido por `@Roles(Role.ADMIN)`)
> *La autorización pertenece a Guards, Policies o Roles. No al nombre de una función.*

**Ejemplo Backend (UI):** Solicitud: *"Obtener productos para Home"*
- ❌ `getHomeProducts()`
- ✅ `getFeaturedProducts()`, `getRecentProducts()`, `getRecommendedProducts()`
> *El backend entrega datos. No conoce páginas.*

### 🧠 La Prueba del Nombre
Si mañana cambia completamente la interfaz... ¿el nombre de la función sigue teniendo sentido?
- Si la respuesta es **NO** ➡️ El nombre está mal.

---

## ⚙️ 4. Backend: NestJS Best Practices

Siempre que sea posible, respeta la arquitectura modular de NestJS:

1. **Separación de Responsabilidades:**
   - **Controllers:** Solo manejan rutas HTTP, extraen parámetros y llaman al Service. No deben tener lógica de negocio compleja.
   - **Services:** Contienen la lógica de negocio pura.
   - **Repositories (Prisma):** Encapsulan las queries complejas a la base de datos.
2. **Validación:** Usa siempre **DTOs** (Data Transfer Objects) con `class-validator` y `class-transformer`. El `ValidationPipe` global debe estar activo.
3. **Inyección de Dependencias (DI):** Reutiliza Providers. No instancies clases manualmente con `new` si pueden ser inyectadas.
4. **Módulos:** Mantén los módulos cohesivos por feature (ej. `AuthModule`, `ForumModule`). Usa `exports` solo para lo estrictamente necesario.
5. **Seguridad:** Usa `Guards` para autenticación/autorización y `Interceptors` para transformar respuestas o manejar logs.

---

## 🎨 5. Frontend: Next.js & React Best Practices

Prioriza el rendimiento y la mantenibilidad en el App Router:

1. **Server vs Client Components:**
   - Usa **Server Components** por defecto (fetching de datos, SEO, HTML estático).
   - Usa **Client Components** (`"use client"`) SOLO cuando necesites interactividad (onClick, useState, useEffect, hooks de navegador).
2. **Componentes Reutilizables:** Extrae UI repetitiva a `components/ui/` (botones, inputs, modales).
3. **Custom Hooks:** Extrae la lógica compleja de los componentes a custom hooks (`useThread.ts`, `useAuth.ts`).
4. **Separación Lógica/UI:** Evita componentes gigantes. Si un componente tiene más de 150 líneas, probablemente deba dividirse.
5. **Estado Global:** Usa Zustand solo para estado verdaderamente global (usuario logueado, tema oscuro). Usa React Query (TanStack) para estado del servidor (fetching, caching).

---

## 🧹 6. Calidad del Código y Optimización

- **Funciones pequeñas:** Prefiere funciones pequeñas con una sola responsabilidad en lugar de funciones enormes.
- **Código explícito:** Prefiere código explícito y fácil de leer sobre código "inteligente" o "clever" de una sola línea que es difícil de entender.
- **Comentarios:** No agregues comentarios que expliquen cosas obvias. Los nombres de variables/funciones deben explicar el código.
  - ❌ `// Incrementa el contador \n counter++`
  - ✅ Solo comenta **decisiones arquitectónicas importantes** o "por qués" (ej. `// Usamos Redis aquí porque la query a Postgres tarda >2s en tablas grandes`).

---

## 🌿 7. Convenciones de Git y Flujo de Trabajo

Para mantener un historial limpio y evitar conflictos, sigue estas reglas estrictamente:

### Mensajes de Commit
El formato debe indicar el área/feature y una descripción breve de la acción en **español**.
- **Formato:** `[Área/Feature]: [Acción breve en español]`
- ✅ `Backend: agrega validación de contraseña en el registro`
- ✅ `Frontend: corrige el padding del botón de login`
- ✅ `Database: crea migración para la tabla de notificaciones`
- ❌ `fix login`
- ❌ `update`

### Flujo de Ramas (Branching)
1. **Basadas en develop:** Todas las ramas de nuevas features o fixes deben crearse a partir de la rama `develop` (NUNCA de `main`).
2. **Actualizar antes de pushear/mergear:** Antes de hacer push de tus cambios o abrir un Pull Request hacia `develop`, **DEBES actualizar tu rama** con los últimos cambios de `develop` (`git pull origin develop` o `git rebase develop`). Esto garantiza que resuelvas los conflictos localmente y no rompas el trabajo de los demás.

---

## ✅ 8. Checklist antes de terminar una tarea (PR Review)

Antes de dar por finalizada una tarea o abrir un Pull Request, verifica:

- [ ] ¿Existe código duplicado?
- [ ] ¿Se puede reutilizar algo existente?
- [ ] ¿Los nombres representan responsabilidades y no contextos de UI?
- [ ] ¿Hay funciones o componentes demasiado largos?
- [ ] ¿Puede simplificarse la lógica?
- [ ] ¿Estoy siguiendo la arquitectura existente (NestJS/Next.js)?
- [ ] ¿Este código será entendible dentro de dos años por un desarrollador nuevo?

> ⚠️ **Si alguna respuesta es NO, refactoriza antes de finalizar.** El objetivo principal es que el código sea mantenible, reutilizable y entendible por cualquier desarrollador del equipo, independientemente de quién lo haya escrito.
