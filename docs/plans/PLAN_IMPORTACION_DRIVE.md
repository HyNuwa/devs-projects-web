# Plan: importación rápida desde Google Drive

> **Estado:** idea, sin grilling ni cambio OpenSpec (octubre 2026).
> **Origen:** investigación propia del dueño del proyecto.
> **Depende de:** `PLAN_ALMACENAMIENTO_OBJETOS.md` (dónde quedan los archivos) y del cambio `instituciones` (ADR 0002), porque cada materia pertenece a una facultad.
> **Relacionado:** `docs/README_PUNTOS_E_INSIGNIAS.md`, `docs/README_MODERACION.md`, ADR 0001.

## 1. Idea

Un estudiante que ya tiene sus apuntes ordenados en Drive pega el enlace de una carpeta compartida. DevsProject recorre las subcarpetas, propone a qué materia y tipo corresponde cada archivo, y el estudiante revisa la propuesta y confirma. Después, el backend importa todo de a poco, en segundo plano, mientras el estudiante puede cerrar la página y volver a ver el progreso.

## 2. Qué existe hoy

- `GoogleDriveStorageService.importFromFolder(folderId)` lista hasta 100 archivos de una carpeta y devuelve la lista cruda. No pagina, no recorre subcarpetas y no la llama nadie.
- La subida normal (`POST /materials`) hace todo dentro del request: staging, controles, revisión previa y publicación.
- **No hay colas de trabajos.** Redis existe, pero solo para contar el rate limit.
- **Límite actual de 10 materiales por cuenta cada 24 h** (`assertUploadLimit`): una importación masiva lo choca de frente.
- Duplicados: sha256 exacto dentro de la misma materia.

## 3. Alcance del MVP

1. **Solo carpetas públicas** («cualquier persona con el enlace»), leídas con una API key de Google y sin que el estudiante conecte su cuenta. Según guías de la comunidad, con una API key solo se puede leer contenido compartido públicamente. Hay que confirmar los parámetros contra la referencia oficial de `files.list` de Drive v3.
2. **Descubrimiento:** se recorren las subcarpetas en forma recursiva, con la paginación de `files.list`. Se calcula cuántos archivos hay y cuánto pesan («420 archivos, ~1,8 GB»), y se descarta lo que no cumple las extensiones o los 25 MB. Los Docs, Sheets y Slides nativos se exportan a PDF o XLSX.
3. **Propuesta de clasificación sin IA:**
   - la materia sale del nombre de la carpeta, comparado contra las materias de la carrera elegida;
   - el tipo sale de palabras clave en el nombre de la carpeta o del archivo («parcial», «final», «tp», «resumen»);
   - el ciclo lectivo sale de un año en el nombre.
   - Lo que no se reconoce queda «sin asignar», y el estudiante lo corrige o lo excluye.
4. **Revisión:** una pantalla con el árbol detectado, donde se puede corregir la materia, el tipo y el ciclo por carpeta o por archivo y excluir lo que no corresponde. Incluye una **confirmación de derechos para compartir**.
5. **Importación en segundo plano:** un trabajo por archivo en una cola (BullMQ sobre el Redis existente, a evaluar contra una tabla de trabajos en Postgres). Cada trabajo:
   - descarga el archivo;
   - aplica los mismos controles que una subida normal;
   - lo guarda en el almacenamiento;
   - crea el material.
   - Tiene reintentos automáticos.
   - Guarda el id de Drive de origen, así no se importa dos veces y se puede reanudar.
6. **Progreso:** una pantalla con lo importado, lo pendiente y lo fallido (con el motivo), y la opción de reintentar.

**Para más adelante:**
- **Carpetas privadas con OAuth:** recorrer una carpeta privada entera necesita `drive.readonly`, un scope restringido que exige la verificación de Google y una evaluación de seguridad.
- **Clasificación asistida por IA** a partir del contenido de los PDFs, siempre con revisión humana antes de publicar.

## 4. Conflictos con reglas existentes

El grilling tiene que resolverlos antes de proponer el cambio.

- **Puntos.** 300 materiales a +10 dan 3.000 puntos, o sea nivel 9 de un día para otro y sin señal de que sirvieron, lo que contradice «calidad antes que cantidad» (README de puntos, §1). Opciones:
  - los materiales importados suman solo sus «Me sirvió», sin `MATERIAL_PUBLISHED`;
  - un tope diario de `MATERIAL_PUBLISHED`;
  - otorgar los +10 cuando el material recibe su primer «Me sirvió».
- **Insignias.** Primera luz y el bono pionero toman el primer material por fecha de creación, una limitación que ya se conoce. Una importación masiva acapararía esos reconocimientos en todas las materias vacías de golpe. Kit completo, Archivo histórico y Trotamaterias se ganarían en un solo paso.
- **Moderación** (ADR 0001, publicación inmediata). Cientos de archivos públicos de golpe pueden traer datos personales, material con copyright de cátedras o duplicados. Opciones:
  - toda importación pasa por revisión previa;
  - se publica de a poco, por ejemplo N por día;
  - moderación revisa una muestra antes de liberar el resto.
- **Límite de subidas.** Hay que decidir si la importación tiene su propio cupo, por ejemplo uno mayor para cuentas con privilegios de confianza, o si respeta los 10 por día y se reparte en varios días.
- **Derechos.** Que la carpeta sea pública no significa que quien la comparte tenga derecho a republicarla. Hace falta la confirmación explícita, el retiro como para cualquier material, y quizá excluir exámenes con datos de alumnos.
- **Autoría.** Si la carpeta es de otra persona (por ejemplo, la carpeta de un curso), el material queda a nombre de quien importa. Hay que decidir si se permite o si se exige ser dueño de los archivos.
- **Duplicados.** Hoy el control es exacto por materia. Importar la carpeta que ya circula entre todo el curso va a chocar con lo que otros subieron: esos archivos se omiten y se informan en el progreso.

## 5. Preguntas para el grilling

- ¿Cuántos puntos dan los materiales importados (§4)?
- ¿Se publican al instante, se escalonan o pasan por revisión previa?
- ¿Cuántos archivos como máximo por importación y por cuenta?
- ¿Solo se importa a la propia facultad o carrera (ADR 0002)?
- ¿Se exige que quien importa sea dueño de los archivos de Drive? La API devuelve el propietario.
- ¿Cola con BullMQ o tabla de trabajos en Postgres? Se decide junto con el plan de almacenamiento, porque las conversiones también necesitan un worker.
- ¿Se conserva la estructura de carpetas como dato (por ejemplo, para agrupar en «Mis envíos») o solo se usa para clasificar?
