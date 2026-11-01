# DevsProject: materias y cursos

Este cambio se implementa sobre `develop`, con NestJS, Prisma y PostgreSQL. La base existente tiene usuarios con IDs enteros. Las entidades educativas nuevas usan UUID.

- **Materia**: unidad académica que puede estar en varios planes de estudio. Organiza el contexto de uno o varios cursos, pero puede existir sin cursos.
- **Curso formativo**: contenido educativo con estado editorial DRAFT/PUBLISHED/ARCHIVED, compuesto por secciones y clases. Puede vincularse a una materia.
- **Sección**: grupo ordenado de clases de un curso.
- **Clase**: unidad de aprendizaje con texto y/o archivos privados de Drive.
- **Inscripción**: relación entre usuario y curso; su estado activo habilita la lectura de clases de cursos publicados.
- **Archivo de clase**: adjunto privado relacionado con una clase. La API autoriza acceso por inscripción o gestión administrativa; el identificador de Drive queda en el servidor.
- **Permiso**: capacidad por acción derivada del rol vigente en la base de datos. No se acepta el rol declarado por el cliente como autorización.

La referencia tipo Udemy orienta la organización educativa. El frontend de cursos, pagos, video, quizzes y seguimiento de progreso no están incluidos en este cambio de backend.
