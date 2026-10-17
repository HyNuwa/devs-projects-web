# Fuentes de precarga del catálogo (cambio `alcance-por-facultad`)

Propósito: listar las unidades académicas ("facultades") de 13 universidades nacionales argentinas para precargar el catálogo, usando únicamente sitios oficiales de cada universidad.

Fecha de verificación: 2026-10-12.

Convenciones:

- "Nombre corto" es slug-safe (solo letras ASCII y dígitos, único dentro de la universidad sin distinguir mayúsculas). Si la sigla no figura en la página oficial que lista las facultades, se marca "(propuesto)".
- Se incluyen "escuelas superiores" e "institutos" solo cuando la universidad los lista al mismo nivel que sus facultades; en cada caso se aclara en una nota. Se excluyen colegios, escuelas de nivel medio o primario, hospitales y departamentos.
- Los nombres cortos de universidad (UNJU, UNSa, UNT, UNCA, UNSE, UBA, UNC, UNLP, UTN, UNR, UNCuyo, UNL, UNNE) son únicos sin distinguir mayúsculas.

Revisión: el 12 de octubre de 2026 el responsable del proyecto aprobó la lista con las decisiones de la sección «Decisiones de la revisión». Los nombres cortos marcados «(propuesto)» quedan aceptados; desde el cambio `catalogo-editable` se corrigen en la pestaña Catálogo del panel, y el nombre corto anterior sigue redirigiendo. Estas tablas reflejan la carga inicial, no el estado actual del catálogo. La migración `20261014010000_catalog_preload` carga exactamente las filas de estas tablas.

---

## 1. Universidad Nacional de Jujuy (UNJU)

- Ciudad: San Salvador de Jujuy.
- Fuente: [https://www.unju.edu.ar/](https://www.unju.edu.ar/)


| Facultad                                           | Nombre corto      | Fuente                                                                       |
| -------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| Facultad de Ciencias Agrarias                      | FCA (propuesto)   | [https://www.fca.unju.edu.ar/](https://www.fca.unju.edu.ar/)                 |
| Facultad de Ciencias Económicas                    | FCE (propuesto)   | [https://www.fce.unju.edu.ar/](https://www.fce.unju.edu.ar/)                 |
| Facultad de Humanidades y Ciencias Sociales        | FHyCS (propuesto) | [https://www.fhycs.unju.edu.ar/](https://www.fhycs.unju.edu.ar/)             |
| Facultad de Ingeniería                             | FI (propuesto)    | [https://www.fi.unju.edu.ar/](https://www.fi.unju.edu.ar/)                   |
| Escuela de Minas                                   | ESCMI (propuesto) | [https://escmi.unju.edu.ar/](https://escmi.unju.edu.ar/)                     |
| Escuela Superior de Ciencias Jurídicas y Políticas | ESCJP (propuesto) | [https://escuelajuridica.unju.edu.ar/](https://escuelajuridica.unju.edu.ar/) |
| Escuela Superior de Salud                          | ESS               | [https://escuelasalud.unju.edu.ar/](https://escuelasalud.unju.edu.ar/)       |


Nota: la portada de la UNJU lista estas escuelas al mismo nivel que las facultades (unidades académicas), por eso se incluyen. La portada lista además una "Escuela de Formación Profesional" (oferta de educación profesional), que se excluye por no ser unidad académica equivalente a una facultad.

## 2. Universidad Nacional de Salta (UNSa)

- Ciudad: Salta.
- Fuente: [https://www.unsa.edu.ar/facultades/](https://www.unsa.edu.ar/facultades/) (también [https://www.unsa.edu.ar/index.php/facultades/](https://www.unsa.edu.ar/index.php/facultades/))


| Facultad                                              | Nombre corto      | Fuente                                                                                       |
| ----------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| Facultad de Ciencias Económicas, Jurídicas y Sociales | FCEJS (propuesto) | [https://economicas.unsa.edu.ar/web/index.php](https://economicas.unsa.edu.ar/web/index.php) |
| Facultad de Ciencias Exactas                          | FCEx (propuesto)  | [https://web.exa.unsa.edu.ar/](https://web.exa.unsa.edu.ar/)                                 |
| Facultad de Humanidades                               | FH (propuesto)    | [https://hum.unsa.edu.ar/](https://hum.unsa.edu.ar/)                                         |
| Facultad de Ingeniería                                | FI (propuesto)    | [https://ing.unsa.edu.ar/](https://ing.unsa.edu.ar/)                                         |
| Facultad de Ciencias Naturales                        | FCN (propuesto)   | [https://www.unsa.edu.ar/facultades/](https://www.unsa.edu.ar/facultades/)                   |
| Facultad de Ciencias de la Salud                      | FCS (propuesto)   | [http://fsalud.unsa.edu.ar/salud/](http://fsalud.unsa.edu.ar/salud/)                         |
| Facultad Regional Multidisciplinar Tartagal           | FRMT (propuesto)  | [https://www.unsa.edu.ar/facultades/](https://www.unsa.edu.ar/facultades/)                   |
| Facultad Regional Orán                                | FRO (propuesto)   | [https://www.unsa.edu.ar/facultades/](https://www.unsa.edu.ar/facultades/)                   |


Nota: la portada indica "8 Facultades", coincidente con esta lista. La URL de Ciencias de la Salud es http (la página oficial no ofrece https verificado).

## 3. Universidad Nacional de Tucumán (UNT)

- Ciudad: San Miguel de Tucumán.
- Fuente: [https://www.unt.edu.ar/expount/facultades-y-escuelas/](https://www.unt.edu.ar/expount/facultades-y-escuelas/)

URL base de cada ficha: `https://www.unt.edu.ar/expount/facultades-y-escuelas/<slug>/`.


| Facultad                                       | Nombre corto      | Fuente                                                                                                                                                                                                     |
| ---------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Facultad de Agronomía, Zootecnia y Veterinaria | FAZV (propuesto)  | [https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-agronomia-zootecnia-y-veterinaria/](https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-agronomia-zootecnia-y-veterinaria/) |
| Facultad de Ciencias Naturales                 | FCN (propuesto)   | [https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-ciencias-naturales/](https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-ciencias-naturales/)                               |
| Facultad de Psicología                         | FPsi (propuesto)  | [https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-psicologia/](https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-psicologia/)                                               |
| Facultad de Arquitectura y Urbanismo           | FAU (propuesto)   | [https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-arquitectura-y-urbanismo/](https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-arquitectura-y-urbanismo/)                   |
| Facultad de Derecho                            | FD (propuesto)    | [https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-derecho/](https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-derecho/)                                                     |
| Facultad de Artes                              | FA (propuesto)    | [https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-artes/](https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-artes/)                                                         |
| Facultad de Educación Física                   | FEF (propuesto)   | [https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-educacion-fisica/](https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-educacion-fisica/)                                   |
| Facultad de Bioquímica, Química y Farmacia     | FBQF (propuesto)  | [https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-bioquimica-quimica-y-farmacia/](https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-bioquimica-quimica-y-farmacia/)         |
| Facultad de Ciencias Económicas                | FCE (propuesto)   | [https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-ciencias-economicas/](https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-ciencias-economicas/)                             |
| Facultad de Medicina                           | FM (propuesto)    | [https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-medicina/](https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-medicina/)                                                   |
| Facultad de Ciencias Exactas y Tecnología      | FACET (propuesto) | [https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-ciencias-exactas-y-tecnologia/](https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-ciencias-exactas-y-tecnologia/)         |
| Facultad de Odontología                        | FO (propuesto)    | [https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-odontologia/](https://www.unt.edu.ar/expount/facultades-y-escuelas/facultad-de-odontologia/)                                             |
| Facultad de Filosofía y Letras                 | FFyL (propuesto)  | [https://www.unt.edu.ar/expount/facultades-y-escuelas/filosofia-y-letras/](https://www.unt.edu.ar/expount/facultades-y-escuelas/filosofia-y-letras/)                                                       |
| Escuela de Cine, Video y Televisión            | ECVT (propuesto)  | [https://www.unt.edu.ar/expount/facultades-y-escuelas/escuela-de-cine-video-y-television/](https://www.unt.edu.ar/expount/facultades-y-escuelas/escuela-de-cine-video-y-television/)                       |
| Instituto Superior de Música                   | ISM (propuesto)   | [https://www.unt.edu.ar/expount/facultades-y-escuelas/instituto-superior-de-musica/](https://www.unt.edu.ar/expount/facultades-y-escuelas/instituto-superior-de-musica/)                                   |


Nota: la UNT lista facultades, escuelas e institutos en la misma página. Se incluyen la Escuela de Cine y el Instituto Superior de Música por ser unidades de nivel superior. Se excluyen Escuela y Liceo Vocacional Sarmiento, Instituto Técnico y Escuela de Bellas Artes (nivel medio / pre-universitario; ver Dudas). La ficha de Filosofía y Letras aparece sin el prefijo "Facultad de".

## 4. Universidad Nacional de Catamarca (UNCA)

- Ciudad: San Fernando del Valle de Catamarca.
- Fuente: [https://www.unca.edu.ar/](https://www.unca.edu.ar/)


| Facultad                                            | Nombre corto    | Fuente                                                               |
| --------------------------------------------------- | --------------- | -------------------------------------------------------------------- |
| Facultad de Ciencias Agrarias                       | FCA | [https://agrarias.unca.edu.ar/](https://agrarias.unca.edu.ar/)       |
| Facultad de Ciencias Exactas y Naturales            | FCEN | [https://exactas.unca.edu.ar/](https://exactas.unca.edu.ar/)         |
| Facultad de Ciencias de la Salud                    | FCS | [https://salud.unca.edu.ar/](https://salud.unca.edu.ar/)             |
| Facultad de Ciencias Económicas y de Administración | FCEyA | [http://eco.unca.edu.ar/](http://eco.unca.edu.ar/)                   |
| Facultad de Humanidades                             | FH | [https://huma.unca.edu.ar/](https://huma.unca.edu.ar/)               |
| Facultad de Tecnología y Ciencias Aplicadas         | FTyCA | [https://tecno.unca.edu.ar/](https://tecno.unca.edu.ar/)             |
| Facultad de Derecho                                 | FD | [https://derecho.unca.edu.ar/](https://derecho.unca.edu.ar/)         |
| Escuela de Arqueología                              | EDA | [https://arqueologia.unca.edu.ar/](https://arqueologia.unca.edu.ar/) |


Nota: la Escuela de Arqueología figura en la portada junto a las facultades y se incluye por ese motivo. La URL de Económicas es solo http.

## 5. Universidad Nacional de Santiago del Estero (UNSE)

- Ciudad: Santiago del Estero.
- Fuente: [https://www.unse.edu.ar/](https://www.unse.edu.ar/)


| Facultad                                                 | Nombre corto       | Fuente                                                     |
| -------------------------------------------------------- | ------------------ | ---------------------------------------------------------- |
| Facultad de Agronomía y Agroindustrias                   | FAyA (propuesto)   | [https://faya.unse.edu.ar](https://faya.unse.edu.ar)       |
| Facultad de Ciencias Forestales                          | FCF (propuesto)    | [https://fcf.unse.edu.ar/](https://fcf.unse.edu.ar/)       |
| Facultad de Ciencias Exactas y Tecnologías               | FCEyT (propuesto)  | [https://fce.unse.edu.ar/](https://fce.unse.edu.ar/)       |
| Facultad de Ciencias Médicas                             | FCM (propuesto)    | [http://www.fcm.unse.edu.ar/](http://www.fcm.unse.edu.ar/) |
| Facultad de Humanidades, Ciencias Sociales y de la Salud | FHCSyS (propuesto) | [https://fhu.unse.edu.ar/](https://fhu.unse.edu.ar/)       |


Nota: la URL de Ciencias Médicas es solo http.

## 6. Universidad de Buenos Aires (UBA)

- Ciudad: Ciudad Autónoma de Buenos Aires.
- Fuente: [https://www.uba.ar/facultades](https://www.uba.ar/facultades)

La página oficial muestra los nombres sin el prefijo "Facultad de"; se lo antepone. Fuente de cada fila: `https://www.uba.ar/carreras/<n>`.


| Facultad                                     | Nombre corto      | Fuente                                                           |
| -------------------------------------------- | ----------------- | ---------------------------------------------------------------- |
| Facultad de Agronomía                        | FAUBA (propuesto) | [https://www.uba.ar/carreras/1](https://www.uba.ar/carreras/1)   |
| Facultad de Arquitectura, Diseño y Urbanismo | FADU (propuesto)  | [https://www.uba.ar/carreras/2](https://www.uba.ar/carreras/2)   |
| Facultad de Ciencias Económicas              | FCE (propuesto)   | [https://www.uba.ar/carreras/3](https://www.uba.ar/carreras/3)   |
| Facultad de Ciencias Exactas y Naturales     | FCEN (propuesto)  | [https://www.uba.ar/carreras/4](https://www.uba.ar/carreras/4)   |
| Facultad de Ciencias Sociales                | FSOC (propuesto)  | [https://www.uba.ar/carreras/5](https://www.uba.ar/carreras/5)   |
| Facultad de Ciencias Veterinarias            | FVET (propuesto)  | [https://www.uba.ar/carreras/6](https://www.uba.ar/carreras/6)   |
| Facultad de Derecho                          | FD (propuesto)    | [https://www.uba.ar/carreras/7](https://www.uba.ar/carreras/7)   |
| Facultad de Farmacia y Bioquímica            | FFyB (propuesto)  | [https://www.uba.ar/carreras/8](https://www.uba.ar/carreras/8)   |
| Facultad de Filosofía y Letras               | FFyL (propuesto)  | [https://www.uba.ar/carreras/9](https://www.uba.ar/carreras/9)   |
| Facultad de Ingeniería                       | FIUBA (propuesto) | [https://www.uba.ar/carreras/10](https://www.uba.ar/carreras/10) |
| Facultad de Medicina                         | FMED (propuesto)  | [https://www.uba.ar/carreras/11](https://www.uba.ar/carreras/11) |
| Facultad de Odontología                      | FOUBA (propuesto) | [https://www.uba.ar/carreras/12](https://www.uba.ar/carreras/12) |
| Facultad de Psicología                       | FPSI (propuesto)  | [https://www.uba.ar/carreras/13](https://www.uba.ar/carreras/13) |


Nota: la página lista "Ciencias Médicas" en el puesto 11; el nombre institucional habitual es Facultad de Medicina (ver Dudas).

## 7. Universidad Nacional de Córdoba (UNC)

- Ciudad: Córdoba.
- Fuente: [https://www.unc.edu.ar/académicas/facultades-de-la-unc](https://www.unc.edu.ar/académicas/facultades-de-la-unc)


| Facultad                                                 | Nombre corto    | Fuente                                                               |
| -------------------------------------------------------- | --------------- | -------------------------------------------------------------------- |
| Facultad de Arquitectura, Urbanismo y Diseño             | FAUD            | [https://faud.unc.edu.ar/](https://faud.unc.edu.ar/)                 |
| Facultad de Artes                                        | FA (propuesto)  | [http://artes.unc.edu.ar/](http://artes.unc.edu.ar/)                 |
| Facultad de Ciencias Agropecuarias                       | FCA (propuesto) | [http://www.agro.unc.edu.ar/](http://www.agro.unc.edu.ar/)           |
| Facultad de Ciencias de la Comunicación                  | FCC (propuesto) | [http://www.fcc.unc.edu.ar/](http://www.fcc.unc.edu.ar/)             |
| Facultad de Ciencias Económicas                          | FCE (propuesto) | [http://www.eco.unc.edu.ar/](http://www.eco.unc.edu.ar/)             |
| Facultad de Ciencias Exactas, Físicas y Naturales        | FCEFyN          | [https://fcefyn.unc.edu.ar/](https://fcefyn.unc.edu.ar/)             |
| Facultad de Ciencias Médicas                             | FCM             | [http://www.fcm.unc.edu.ar/](http://www.fcm.unc.edu.ar/)             |
| Facultad de Ciencias Químicas                            | FCQ             | [http://www.fcq.unc.edu.ar/](http://www.fcq.unc.edu.ar/)             |
| Facultad de Ciencias Sociales                            | FCS (propuesto) | [http://sociales.unc.edu.ar/](http://sociales.unc.edu.ar/)           |
| Facultad de Derecho                                      | FD (propuesto)  | [http://www.derecho.unc.edu.ar/](http://www.derecho.unc.edu.ar/)     |
| Facultad de Filosofía y Humanidades                      | FFyH            | [http://www.ffyh.unc.edu.ar/](http://www.ffyh.unc.edu.ar/)           |
| Facultad de Lenguas                                      | FL (propuesto)  | [http://www.lenguas.unc.edu.ar/](http://www.lenguas.unc.edu.ar/)     |
| Facultad de Matemática, Astronomía, Física y Computación | FAMAF           | [http://www.famaf.unc.edu.ar/](http://www.famaf.unc.edu.ar/)         |
| Facultad de Odontología                                  | FO (propuesto)  | [https://odo.unc.edu.ar/](https://odo.unc.edu.ar/)                   |
| Facultad de Psicología                                   | FP (propuesto)  | [http://www.psicologia.unc.edu.ar](http://www.psicologia.unc.edu.ar) |


Nota: las siglas sin "(propuesto)" salvo FAUD surgen de los dominios oficiales de cada facultad, no de la página de listado.

## 8. Universidad Nacional de La Plata (UNLP)

- Ciudad: La Plata.
- Fuente: [https://unlp.edu.ar/institucional/unlp/facultades\_y\_colegios-83-5083/](https://unlp.edu.ar/institucional/unlp/facultades_y_colegios-83-5083/)


| Facultad                                           | Nombre corto      | Fuente                                                                       |
| -------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| Facultad de Arquitectura y Urbanismo               | FAU (propuesto)   | [http://www.fau.unlp.edu.ar](http://www.fau.unlp.edu.ar)                     |
| Facultad de Artes                                  | FBA (propuesto)   | [http://www.fba.unlp.edu.ar](http://www.fba.unlp.edu.ar)                     |
| Facultad de Ciencias Agrarias y Forestales         | FCAyF (propuesto) | [http://www.agro.unlp.edu.ar](http://www.agro.unlp.edu.ar)                   |
| Facultad de Ciencias Astronómicas y Geofísicas     | FCAG (propuesto)  | [http://www.fcaglp.unlp.edu.ar](http://www.fcaglp.unlp.edu.ar)               |
| Facultad de Ciencias Económicas                    | FCE (propuesto)   | [http://www.econo.unlp.edu.ar](http://www.econo.unlp.edu.ar)                 |
| Facultad de Ciencias Exactas                       | FCEx (propuesto)  | [http://www.exactas.unlp.edu.ar](http://www.exactas.unlp.edu.ar)             |
| Facultad de Ciencias Jurídicas y Sociales          | FCJyS (propuesto) | [http://www.jursoc.unlp.edu.ar](http://www.jursoc.unlp.edu.ar)               |
| Facultad de Ciencias Médicas                       | FCM (propuesto)   | [http://www.med.unlp.edu.ar](http://www.med.unlp.edu.ar)                     |
| Facultad de Ciencias Naturales y Museo             | FCNyM (propuesto) | [http://www.fcnym.unlp.edu.ar](http://www.fcnym.unlp.edu.ar)                 |
| Facultad de Ciencias Veterinarias                  | FCV (propuesto)   | [http://www.fcv.unlp.edu.ar](http://www.fcv.unlp.edu.ar)                     |
| Facultad de Humanidades y Ciencias de la Educación | FAHCE (propuesto) | [http://www.fahce.unlp.edu.ar](http://www.fahce.unlp.edu.ar)                 |
| Facultad de Informática                            | FInfo (propuesto) | [http://www.info.unlp.edu.ar](http://www.info.unlp.edu.ar)                   |
| Facultad de Ingeniería                             | FIng (propuesto)  | [http://www.ing.unlp.edu.ar](http://www.ing.unlp.edu.ar)                     |
| Facultad de Odontología                            | FOLP (propuesto)  | [http://www.folp.unlp.edu.ar](http://www.folp.unlp.edu.ar)                   |
| Facultad de Periodismo y Comunicación Social       | FPyCS (propuesto) | [http://www.perio.unlp.edu.ar](http://www.perio.unlp.edu.ar)                 |
| Facultad de Psicología                             | FPsi (propuesto)  | [http://www.psico.unlp.edu.ar](http://www.psico.unlp.edu.ar)                 |
| Facultad de Trabajo Social                         | FTS (propuesto)   | [http://www.trabajosocial.unlp.edu.ar](http://www.trabajosocial.unlp.edu.ar) |


Nota: la página separa "Facultades" de "Colegios" (5 colegios/escuelas de nivel pre-universitario, excluidos). Las URL de las facultades figuran con http en la página.

## 9. Universidad Tecnológica Nacional (UTN)

- Ciudad: sede del Rectorado en Ciudad Autónoma de Buenos Aires; 30 Facultades Regionales en todo el país.
- Fuente: [https://www.utn.edu.ar/es/la-universidad/sedes](https://www.utn.edu.ar/es/la-universidad/sedes)

Las URL figuran con http en la página oficial.


| Facultad                                        | Nombre corto       | Fuente                                                                   |
| ----------------------------------------------- | ------------------ | ------------------------------------------------------------------------ |
| Facultad Regional Avellaneda                    | FRA                | [http://www.fra.utn.edu.ar/](http://www.fra.utn.edu.ar/)                 |
| Facultad Regional Bahía Blanca                  | FRBB               | [http://www.frbb.utn.edu.ar](http://www.frbb.utn.edu.ar)                 |
| Facultad Regional Buenos Aires                  | FRBA               | [http://www.frba.utn.edu.ar](http://www.frba.utn.edu.ar)                 |
| Facultad Regional Chubut                        | FRCH               | [http://www.frch.utn.edu.ar/](http://www.frch.utn.edu.ar/)               |
| Facultad Regional Concepción del Uruguay        | FRCU               | [http://www.frcu.utn.edu.ar](http://www.frcu.utn.edu.ar)                 |
| Facultad Regional Concordia                     | FRCON              | [http://www.frcon.utn.edu.ar](http://www.frcon.utn.edu.ar)               |
| Facultad Regional Córdoba                       | FRC                | [http://www.frc.utn.edu.ar/](http://www.frc.utn.edu.ar/)                 |
| Facultad Regional Delta                         | FRD                | [http://www.frd.utn.edu.ar](http://www.frd.utn.edu.ar)                   |
| Facultad Regional General Pacheco               | FRGP               | [http://www.frgp.utn.edu.ar](http://www.frgp.utn.edu.ar)                 |
| Facultad Regional Haedo                         | FRH                | [http://www.frh.utn.edu.ar/](http://www.frh.utn.edu.ar/)                 |
| Facultad Regional La Plata                      | FRLP               | [http://www.frlp.utn.edu.ar](http://www.frlp.utn.edu.ar)                 |
| Facultad Regional La Rioja                      | FRLR               | [http://www.frlr.utn.edu.ar](http://www.frlr.utn.edu.ar)                 |
| Facultad Regional Mar del Plata                 | FRMDP (propuesto)  | [http://www.mdp.utn.edu.ar](http://www.mdp.utn.edu.ar)                   |
| Facultad Regional Mendoza                       | FRM                | [http://www4.frm.utn.edu.ar](http://www4.frm.utn.edu.ar)                 |
| Facultad Regional Neuquén                       | FRN                | [http://www.frn.utn.edu.ar](http://www.frn.utn.edu.ar)                   |
| Facultad Regional Paraná                        | FRP                | [http://www.frp.utn.edu.ar](http://www.frp.utn.edu.ar)                   |
| Facultad Regional Rafaela                       | FRRA               | [http://www.frra.utn.edu.ar](http://www.frra.utn.edu.ar)                 |
| Facultad Regional Reconquista                   | FRRQ               | [http://www.frrq.utn.edu.ar](http://www.frrq.utn.edu.ar)                 |
| Facultad Regional Resistencia                   | FRRE               | [http://www.frre.utn.edu.ar](http://www.frre.utn.edu.ar)                 |
| Facultad Regional Rosario                       | FRRO               | [http://www.frro.utn.edu.ar](http://www.frro.utn.edu.ar)                 |
| Facultad Regional San Francisco                 | FRSFCO (propuesto) | [http://www.sanfrancisco.utn.edu.ar](http://www.sanfrancisco.utn.edu.ar) |
| Facultad Regional San Nicolás                   | FRSN               | [http://www.frsn.utn.edu.ar](http://www.frsn.utn.edu.ar)                 |
| Facultad Regional San Rafael                    | FRSR               | [http://www.frsr.utn.edu.ar](http://www.frsr.utn.edu.ar)                 |
| Facultad Regional Santa Cruz                    | FRSC               | [http://www.frsc.utn.edu.ar](http://www.frsc.utn.edu.ar)                 |
| Facultad Regional Santa Fe                      | FRSF               | [http://www.frsf.utn.edu.ar](http://www.frsf.utn.edu.ar)                 |
| Facultad Regional Tierra del Fuego (Río Grande) | FRTDF              | [http://www.frtdf.utn.edu.ar](http://www.frtdf.utn.edu.ar)               |
| Facultad Regional Trenque Lauquen               | FRTL               | [http://www.frtl.utn.edu.ar](http://www.frtl.utn.edu.ar)                 |
| Facultad Regional Tucumán                       | FRT                | [http://frt.utn.edu.ar](http://frt.utn.edu.ar)                           |
| Facultad Regional Venado Tuerto                 | FRVT               | [http://www.frvt.utn.edu.ar](http://www.frvt.utn.edu.ar)                 |
| Facultad Regional Villa María                   | FRVM               | [http://www.frvm.utn.edu.ar](http://www.frvm.utn.edu.ar)                 |


Nota: las siglas FR + código se infieren de los dominios oficiales (frXX.utn.edu.ar), que son las que usa la propia UTN. La página también lista el INSPT (Instituto Nacional Superior del Profesorado Técnico) y el Centro Los Reyunos; no se incluyen por no ser Facultades Regionales.

## 10. Universidad Nacional de Rosario (UNR)

- Ciudad: Rosario.
- Fuente: [https://unr.edu.ar/facultades/](https://unr.edu.ar/facultades/)


| Facultad                                                  | Nombre corto        | Fuente                                                                                                                                       |
| --------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Facultad de Ciencias Agrarias                             | FCA (propuesto)     | [https://unr.edu.ar/ciencias-agrarias/](https://unr.edu.ar/ciencias-agrarias/)                                                               |
| Facultad de Arquitectura, Planeamiento y Diseño           | FAPyD (propuesto)   | [https://unr.edu.ar/arquitectura-planeamiento-y-diseno/](https://unr.edu.ar/arquitectura-planeamiento-y-diseno/)                             |
| Facultad de Ciencias Bioquímicas y Farmacéuticas          | FCByF (propuesto)   | [https://unr.edu.ar/facultad-de-ciencias-bioquimicas-y-farmaceuticas/](https://unr.edu.ar/facultad-de-ciencias-bioquimicas-y-farmaceuticas/) |
| Facultad de Derecho                                       | FD (propuesto)      | [https://unr.edu.ar/derecho/](https://unr.edu.ar/derecho/)                                                                                   |
| Facultad de Ciencias Económicas y Estadística             | FCEyE (propuesto)   | [https://unr.edu.ar/ciencias-economicas-y-estadistica/](https://unr.edu.ar/ciencias-economicas-y-estadistica/)                               |
| Facultad de Humanidades y Artes                           | FHyA (propuesto)    | [https://unr.edu.ar/humanidades-y-artes/](https://unr.edu.ar/humanidades-y-artes/)                                                           |
| Facultad de Ciencias Exactas, Ingeniería y Agrimensura    | FCEIA (propuesto)   | [https://unr.edu.ar/ciencias-exactas-ingenieria-y-agrimensura/](https://unr.edu.ar/ciencias-exactas-ingenieria-y-agrimensura/)               |
| Facultad de Ciencias Médicas                              | FCM (propuesto)     | [https://unr.edu.ar/ciencias-medicas/](https://unr.edu.ar/ciencias-medicas/)                                                                 |
| Facultad de Ciencias del Movimiento Humano y del Cuidado  | FAMHyC (propuesto)  | [https://famhyc.unr.edu.ar/](https://famhyc.unr.edu.ar/)                                                                                     |
| Facultad de Psicología                                    | FPsi (propuesto)    | [https://unr.edu.ar/psicologia/](https://unr.edu.ar/psicologia/)                                                                             |
| Facultad de Ciencia Política y Relaciones Internacionales | FCPolit (propuesto) | [https://unr.edu.ar/ciencia-politica-y-rrii/](https://unr.edu.ar/ciencia-politica-y-rrii/)                                                   |
| Facultad de Odontología                                   | FO (propuesto)      | [https://unr.edu.ar/odontologia/](https://unr.edu.ar/odontologia/)                                                                           |
| Facultad de Ciencias Veterinarias                         | FCV (propuesto)     | [https://unr.edu.ar/facultad-de-ciencias-veterinarias/](https://unr.edu.ar/facultad-de-ciencias-veterinarias/)                               |


Nota: se excluyen las escuelas de nivel medio (Agrotécnica, Superior de Comercio, Preuniversitaria), el Instituto Politécnico Superior y el Centro de Estudios Interdisciplinarios.

## 11. Universidad Nacional de Cuyo (UNCuyo)

- Ciudad: Mendoza.
- Fuente: [https://www.uncuyo.edu.ar/uacademicas](https://www.uncuyo.edu.ar/uacademicas)


| Facultad                                      | Nombre corto      | Fuente                                                                 |
| --------------------------------------------- | ----------------- | ---------------------------------------------------------------------- |
| Facultad de Ciencias Políticas y Sociales     | FCPyS (propuesto) | [https://fcp.uncuyo.edu.ar/](https://fcp.uncuyo.edu.ar/)               |
| Facultad de Educación                         | FEdu (propuesto)  | [https://educacion.uncuyo.edu.ar/](https://educacion.uncuyo.edu.ar/)   |
| Facultad de Artes y Diseño                    | FAD               | [https://fad.uncuyo.edu.ar/](https://fad.uncuyo.edu.ar/)               |
| Facultad de Ciencias Agrarias                 | FCA               | [https://fca.uncuyo.edu.ar/](https://fca.uncuyo.edu.ar/)               |
| Facultad de Ciencias Aplicadas a la Industria | FCAI              | [https://fcai.uncuyo.edu.ar/](https://fcai.uncuyo.edu.ar/)             |
| Facultad de Ciencias Económicas               | FCE               | [https://fce.uncuyo.edu.ar/](https://fce.uncuyo.edu.ar/)               |
| Facultad de Ciencias Médicas                  | FCM               | [https://fcm.uncuyo.edu.ar/](https://fcm.uncuyo.edu.ar/)               |
| Facultad de Derecho                           | FD (propuesto)    | [https://derecho.uncuyo.edu.ar/](https://derecho.uncuyo.edu.ar/)       |
| Facultad de Filosofía y Letras                | FFyL              | [https://ffyl.uncuyo.edu.ar/](https://ffyl.uncuyo.edu.ar/)             |
| Facultad de Ingeniería                        | FI (propuesto)    | [https://ingenieria.uncuyo.edu.ar/](https://ingenieria.uncuyo.edu.ar/) |
| Facultad de Odontología                       | FO (propuesto)    | [http://www.fodonto.uncuyo.edu.ar/](http://www.fodonto.uncuyo.edu.ar/) |
| Facultad de Ciencias Exactas y Naturales      | FCEN              | [https://fcen.uncuyo.edu.ar/](https://fcen.uncuyo.edu.ar/)             |
| Instituto Universitario de Seguridad Pública  | IUSP              | [https://iusp.uncuyo.edu.ar/](https://iusp.uncuyo.edu.ar/)             |
| Instituto Balseiro                            | IB                | [https://www.ib.edu.ar/](https://www.ib.edu.ar/)                       |
| Instituto Tecnológico Universitario           | ITU               | [https://itu.uncuyo.edu.ar/](https://itu.uncuyo.edu.ar/)               |


Nota: la página lista facultades, institutos y escuelas en un mismo directorio; se incluyen los 3 institutos de nivel superior. El Instituto Balseiro tiene dominio propio (ib.edu.ar). Se excluyen colegios y escuelas secundarias/primarias (Zapata, CUC, Agricultura, Magisterio, Liceo, DAD, Vera Arenas) y el Colegio de Lenguas Extranjeras. El prefijo "Facultad de" se antepone a nombres que la página muestra sin él. Las siglas no figuran en la página; las no marcadas surgen de los subdominios oficiales.

## 12. Universidad Nacional del Litoral (UNL)

- Ciudad: Santa Fe.
- Fuente: [https://www.unl.edu.ar/](https://www.unl.edu.ar/)


| Facultad                                     | Nombre corto    | Fuente                                                     |
| -------------------------------------------- | --------------- | ---------------------------------------------------------- |
| Facultad de Arquitectura, Diseño y Urbanismo | FADU            | [http://www.fadu.unl.edu.ar/](http://www.fadu.unl.edu.ar/) |
| Facultad de Bioquímica y Ciencias Biológicas | FBCB            | [http://www.fbcb.unl.edu.ar/](http://www.fbcb.unl.edu.ar/) |
| Facultad de Ciencias Agrarias                | FCA             | [http://www.fca.unl.edu.ar](http://www.fca.unl.edu.ar)     |
| Facultad de Ciencias Económicas              | FCE             | [http://www.fce.unl.edu.ar](http://www.fce.unl.edu.ar)     |
| Facultad de Ciencias Jurídicas y Sociales    | FCJS            | [http://www.fcjs.unl.edu.ar](http://www.fcjs.unl.edu.ar)   |
| Facultad de Ciencias Médicas                 | FCM             | [http://www.fcm.unl.edu.ar](http://www.fcm.unl.edu.ar)     |
| Facultad de Ciencias Veterinarias            | FCV             | [http://www.fcv.unl.edu.ar](http://www.fcv.unl.edu.ar)     |
| Facultad de Humanidades y Ciencias           | FHUC            | [http://www.fhuc.unl.edu.ar](http://www.fhuc.unl.edu.ar)   |
| Facultad de Ingeniería Química               | FIQ             | [http://www.fiq.unl.edu.ar](http://www.fiq.unl.edu.ar)     |
| Facultad de Ingeniería y Ciencias Hídricas   | FICH            | [http://www.fich.unl.edu.ar](http://www.fich.unl.edu.ar)   |
| Instituto Superior de Música                 | ISM             | [https://www.unl.edu.ar/](https://www.unl.edu.ar/)         |
| Escuela Superior de Sanidad                  | ESS (propuesto) | [https://www.unl.edu.ar/](https://www.unl.edu.ar/)         |


Nota: la portada lista, junto a las unidades académicas, el Instituto Superior de Música (ISM) y una Escuela Superior (ESS), que se incluyen como unidades de nivel superior. Se excluyen los centros universitarios (CU-GA, CURA, CURS). Las URL de las facultades son http.

## 13. Universidad Nacional del Nordeste (UNNE)

- Ciudad: Corrientes (sede central; también Resistencia).
- Fuente: [https://www.unne.edu.ar/estudiar/facultades/](https://www.unne.edu.ar/estudiar/facultades/)


| Facultad                                               | Nombre corto       | Fuente                                                                     |
| ------------------------------------------------------ | ------------------ | -------------------------------------------------------------------------- |
| Facultad de Arquitectura y Urbanismo                   | FAU                | [https://www.arq.unne.edu.ar/](https://www.arq.unne.edu.ar/)               |
| Facultad de Artes, Diseño y Ciencias de la Cultura     | FADyCC             | [https://www.artes.unne.edu.ar/](https://www.artes.unne.edu.ar/)           |
| Facultad de Ciencias Agrarias                          | FCA (propuesto)    | [https://www.agr.unne.edu.ar/](https://www.agr.unne.edu.ar/)               |
| Facultad de Ciencias Económicas                        | FCE (propuesto)    | [https://www.eco.unne.edu.ar/](https://www.eco.unne.edu.ar/)               |
| Facultad de Ciencias Exactas y Naturales y Agrimensura | FACENA             | [https://exa.unne.edu.ar](https://exa.unne.edu.ar)                         |
| Facultad de Ciencias Veterinarias                      | FCV (propuesto)    | [https://vet.unne.edu.ar](https://vet.unne.edu.ar)                         |
| Facultad de Derecho y Ciencias Sociales y Políticas    | FDCSyP (propuesto) | [https://www.dch.unne.edu.ar/](https://www.dch.unne.edu.ar/)               |
| Facultad de Humanidades                                | FH (propuesto)     | [https://hum.unne.edu.ar/](https://hum.unne.edu.ar/)                       |
| Facultad de Ingeniería                                 | FI (propuesto)     | [https://www.ing.unne.edu.ar/](https://www.ing.unne.edu.ar/)               |
| Facultad de Medicina                                   | FM (propuesto)     | [http://www.med.unne.edu.ar/](http://www.med.unne.edu.ar/)                 |
| Facultad de Odontología                                | FOUNNE (propuesto) | [http://odn.unne.edu.ar/](http://odn.unne.edu.ar/)                         |
| Instituto de Ciencias Criminalísticas y Criminología   | ICCC (propuesto)   | [http://criminalisticas.unne.edu.ar/](http://criminalisticas.unne.edu.ar/) |


Nota: el Instituto de Ciencias Criminalísticas y Criminología aparece en la misma página que las facultades y se incluye con ese criterio. FAU, FADyCC y FACENA surgen de nombres de archivo de logos de la página oficial (no de texto visible). URLs de Medicina, Odontología y el Instituto: solo http.

---

## Decisiones de la revisión

1. **Escuelas e institutos:** se cargan los que la universidad lista al mismo nivel que sus facultades (UNJU, UNT, UNCA, UNCuyo, UNL, UNNE), porque dictan carreras de nivel superior. Se excluyen los de nivel medio o preuniversitario.
2. **UNJU:** se usan los nombres de los sitios propios de cada escuela («Escuela Superior de Salud», «Escuela Superior de Ciencias Jurídicas y Políticas»), no las versiones abreviadas de la portada.
3. **UNSa:** las 8 facultades, con las dos regionales (Tartagal y Orán), como indica la portada.
4. **UNT:** «Filosofía y Letras» es facultad. Se incluyen la Escuela de Cine, Video y Televisión y el Instituto Superior de Música; se excluyen el Instituto Técnico, la Escuela de Bellas Artes y la Escuela y Liceo Sarmiento.
5. **UNCA:** «Facultad de Ciencias de la Salud» como nombre completo, y siglas habituales en lugar de las de tres letras: FCA, FCEN, FCS, FCEyA, FH, FTyCA, FD y EDA.
6. **UNSE:** FCEyT para Ciencias Exactas y Tecnologías, para no chocar con FCE.
7. **UBA:** «Facultad de Medicina» (FMED) en lugar de la etiqueta «Ciencias Médicas» del listado.
8. **UNLP:** FInfo para Informática y FIng para Ingeniería; FBA para Artes, por su sigla histórica.
9. **UTN:** las 30 facultades regionales. La sede de Río Grande es la Facultad Regional Tierra del Fuego (FRTDF), distinta de la Facultad Regional San Rafael (FRSR); «Bahía Blanca» lleva su tilde correcta.
10. **UNR:** 13 facultades, con Psicología; el listado prima sobre el «12 facultades» de la portada.
11. **Siglas sacadas de subdominios o de nombres de archivo de logos** (UNC, UNCuyo, UNNE, UTN): válidas para la precarga.
12. **Enlaces:** se prefiere `https` cuando el sitio lo soporta. Las fuentes de esta página son referencia; el catálogo solo guarda enlaces a planes de estudio, que deben ser `https`.

---

Plan de estudios de Ingeniería Informática (Facultad de Ingeniería, UNJU): [https://www.fi.unju.edu.ar/carreras/perfil-alcance/ing-informatica.html](https://www.fi.unju.edu.ar/carreras/perfil-alcance/ing-informatica.html). El plan de cada carrera de la FI está en su página de fi.unju.edu.ar; esta incluye los planes 2010 y 2022 con su transición. Es la única carrera cargada hoy.