# ================================================================ 4 · ESCRIBIR UNA EXPERIENCIA
# Campos que todavia no existen en el esquema (van marcados en el canvas): nota de promocion,
# temas, preparacion (desde cuando y horas por dia), profesores en la mesa y tiempo del final.

def opcion(texto, activa=False, ancho=None):
    w = f'flex: 1;' if ancho is None else ''
    if activa:
        return f'<span style="{w} display: inline-flex; align-items: center; justify-content: center; gap: 7px; background: #D6E5FB; border: 2px solid {NAVY}; border-radius: 10px; padding: 9px 12px; font-size: 13.5px; font-weight: 800; white-space: nowrap;">{ico("check", 14, BTN, 2.8)}{texto}</span>'
    return f'<span style="{w} display: inline-flex; align-items: center; justify-content: center; background: #FFFFFF; border: 1.5px solid #CFC5B0; border-radius: 10px; padding: 10px 12px; font-size: 13.5px; font-weight: 700; color: {TEXT2}; white-space: nowrap;">{texto}</span>'

def fila_opciones(opciones, activa):
    return '<div style="display: flex; gap: 8px;">' + ''.join(opcion(o, o == activa) for o in opciones) + '</div>'

def campo(etiqueta, contenido, marca='opcional', ayuda=''):
    tag = (f'<span style="font-size: 11px; font-weight: 800; color: #B31450;">OBLIGATORIO</span>' if marca == 'obligatorio'
           else f'<span style="font-size: 11px; font-weight: 700; color: {MUTED};">Opcional</span>')
    extra = f'<div style="margin-top: 7px; font-size: 12px; font-weight: 600; color: {MUTED};">{ayuda}</div>' if ayuda else ''
    return (f'<div><div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px;">'
            f'<span style="font-size: 14px; font-weight: 800;">{etiqueta}</span>{tag}</div>{contenido}{extra}</div>')

def bloque(num, titulo, contenido, sub=''):
    s = f'<span style="font-size: 12.5px; font-weight: 600; color: {MUTED};">{sub}</span>' if sub else ''
    return f'''      <div style="{CARD} padding: 20px 22px;">
        <div style="display: flex; align-items: center; gap: 11px; margin-bottom: 16px;">
          <span style="width: 28px; height: 28px; border-radius: 999px; background: {NAVY}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800;">{num}</span>
          <h2 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.03em;">{titulo}</h2>{s}
        </div>
        {contenido}
      </div>
'''

def selector(texto):   # desplegable a lo ancho del campo
    return (f'<span style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 10px 12px; font-size: 14px; font-weight: 700;">'
            f'{texto}{ico("abajo", 13, NAVY, 2.4)}</span>')

def stepper(valor, sufijo=''):
    suf = f'<span style="font-size: 13.5px; font-weight: 700; color: {MUTED};">{sufijo}</span>' if sufijo else ''
    return (f'<span style="display: inline-flex; align-items: center; gap: 10px;">'
            f'<span style="display: inline-flex; align-items: center; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; overflow: hidden;">'
            f'<span aria-label="Restar" style="width: 36px; height: 38px; display: flex; align-items: center; justify-content: center; border-right: 1.5px solid #E4DCCB; font-size: 18px; font-weight: 800;">−</span>'
            f'<span style="min-width: 46px; text-align: center; font-size: 17px; font-weight: 800;">{valor}</span>'
            f'<span aria-label="Sumar" style="width: 36px; height: 38px; display: flex; align-items: center; justify-content: center; border-left: 1.5px solid #E4DCCB; font-size: 18px; font-weight: 800;">+</span>'
            f'</span>{suf}</span>')

def numero_unidad(valor, unidad, despues=''):
    d = f'<span style="font-size: 13.5px; font-weight: 700; color: {MUTED};">{despues}</span>' if despues else ''
    return (f'<span style="display: inline-flex; align-items: center; gap: 8px;">'
            f'<span style="width: 58px; text-align: center; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 9px 0; font-size: 16px; font-weight: 800;">{valor}</span>'
            f'<span style="display: inline-flex; align-items: center; gap: 10px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 10px 12px; font-size: 14px; font-weight: 700;">{unidad}{ico("abajo", 13, NAVY, 2.4)}</span>{d}</span>')

def escala(nombre, valor):
    cajas = ''.join(
        (f'<span style="width: 38px; height: 36px; display: flex; align-items: center; justify-content: center; background: #D6E5FB; border: 2px solid {NAVY}; border-radius: 9px; font-size: 14px; font-weight: 800;">{i}</span>'
         if i == valor else
         f'<span style="width: 38px; height: 36px; display: flex; align-items: center; justify-content: center; background: #FFFFFF; border: 1.5px solid #CFC5B0; border-radius: 9px; font-size: 14px; font-weight: 700; color: {TEXT2};">{i}</span>')
        for i in range(1, 6))
    return (f'<div style="display: flex; align-items: center; gap: 12px;"><span style="width: 72px; font-size: 13.5px; font-weight: 800;">{nombre}</span>'
            f'<span style="font-size: 11.5px; font-weight: 700; color: {MUTED};">fácil</span><div style="display: flex; gap: 6px;">{cajas}</div>'
            f'<span style="font-size: 11.5px; font-weight: 700; color: {MUTED};">difícil</span></div>')

def chip_borrable(texto):
    return (f'<span style="display: inline-flex; align-items: center; gap: 7px; background: #ECF2FE; border: 1.5px solid {NAVY}; border-radius: 8px; padding: 5px 8px 5px 10px; font-size: 13px; font-weight: 700;">'
            f'{texto}<span aria-label="Quitar" style="font-size: 14px; font-weight: 800; color: {MUTED};">×</span></span>')

def chip_sugerido(texto):
    return (f'<span style="display: inline-flex; align-items: center; gap: 5px; background: #FFFFFF; border: 1.5px dashed #B9AE96; border-radius: 8px; padding: 5px 10px; font-size: 12.5px; font-weight: 700; color: {TEXT2};">+ {texto}</span>')

def ideas(lista):
    return (f'<div style="display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 10px;"><span style="font-size: 12px; font-weight: 700; color: {MUTED}; align-self: center;">Ideas:</span>'
            + ''.join(chip(t, '#FFFFFF', TEXT2).replace('background: #FFFFFF;', 'background: #FFFFFF; border: 1.5px dashed #CFC5B0;') for t in lista) + '</div>')

def area_texto(texto):
    return (f'<div style="position: relative; background: #FFFFFF; border: 2px solid {NAVY}; border-radius: 13px; padding: 14px 16px 30px 16px; min-height: 110px; box-sizing: border-box; font-size: 14.5px; line-height: 1.55; font-weight: 500; color: {NAVY};">{texto}'
            f'<span style="display: inline-block; width: 2px; height: 17px; background: {BTN}; vertical-align: -3px; margin-left: 1px;"></span>'
            f'<span style="position: absolute; right: 14px; bottom: 9px; font-size: 11.5px; font-weight: 700; color: {MUTED};">{len(texto)} / 2000</span></div>'
            f'<div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: {MUTED};">Sin nombres de compañeros ni datos personales. Criticá la cursada o el examen, no a las personas.</div>')

def tipo_y_materia(activo):
    def tarjeta(clave, icono, titulo, texto):
        if clave == activo:
            return (f'<div style="background: #D6E5FB; border: 2px solid {NAVY}; border-radius: 13px; padding: 15px 16px; display: flex; gap: 12px;">{ico(icono, 22, BTN, 2)}'
                    f'<div><div style="font-size: 15px; font-weight: 800;">{titulo}</div><div style="margin-top: 3px; font-size: 12.5px; line-height: 1.4; font-weight: 500; color: {TEXT2};">{texto}</div></div>'
                    f'<span style="margin-left: auto; width: 22px; height: 22px; border-radius: 999px; background: {BTN}; border: 1.5px solid {NAVY}; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">{ico("check", 13, "#FFFFFF", 3)}</span></div>')
        return (f'<div style="background: #FFFFFF; border: 1.5px solid #CFC5B0; border-radius: 13px; padding: 15px 16px; display: flex; gap: 12px;">{ico(icono, 22, MUTED, 2)}'
                f'<div><div style="font-size: 15px; font-weight: 800;">{titulo}</div><div style="margin-top: 3px; font-size: 12.5px; line-height: 1.4; font-weight: 500; color: {TEXT2};">{texto}</div></div>'
                f'<span style="margin-left: auto; width: 22px; height: 22px; border-radius: 999px; border: 1.5px solid #CFC5B0; flex-shrink: 0;"></span></div>')
    return (f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">'
            + tarjeta('cursada', 'calendario', 'Reseña de cursada', 'Cómo fue cursarla: clases, parciales, cómo terminaste.')
            + tarjeta('final', 'birrete', 'Experiencia de final', 'Una mesa concreta: formato, qué tomaron, cómo te fue.')
            + f'''</div>
        <div style="margin-top: 14px; display: flex; align-items: center; gap: 12px; background: #F1EEE4; border-radius: 11px; padding: 11px 14px;">
          <span style="font-size: 11px; font-weight: 800; color: {BLUE}; background: #ECF2FE; border-radius: 6px; padding: 3px 7px;">06</span>
          <span style="font-size: 14.5px; font-weight: 800;">Análisis Matemático II</span><span style="font-size: 12.5px; font-weight: 600; color: {MUTED};">Ing. Informática · 1° año</span>
          <a href="#cambiar" style="margin-left: auto; font-size: 12.5px; font-weight: 700; color: {BLUE};">Cambiar materia</a>
        </div>''')

def publicacion():
    return f'''<div style="display: flex; align-items: center; gap: 14px; background: #FDF3E5; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 14px 16px;">
          <span style="width: 46px; height: 26px; border-radius: 999px; background: {BTN}; border: 1.5px solid {NAVY}; position: relative; flex-shrink: 0;"><span style="position: absolute; right: 3px; top: 3px; width: 17px; height: 17px; border-radius: 999px; background: #FFFFFF;"></span></span>
          <div><div style="font-size: 15px; font-weight: 800;">Publicar como anónimo</div><div style="margin-top: 3px; font-size: 12.5px; line-height: 1.45; font-weight: 500; color: {TEXT2};">Se muestra como «Anónimo» y no se cuenta en tu perfil público. Vos y el equipo de moderación siguen sabiendo que es tuya.</div></div>
          {ico('candado', 20, NAVY, 2)}
        </div>
        <div style="margin-top: 16px; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 12.5px; line-height: 1.4; font-weight: 600; color: {MUTED}; max-width: 360px;">Se publica al instante. Si alguien la reporta y no cumple las normas, moderación puede retirarla.</span>
          <span style="margin-left: auto; display: flex; gap: 10px;">{boton('Cancelar', primario=False)}{boton('Publicar experiencia', 'check')}</span>
        </div>'''

def encabezado_escribir():
    return breadcrumb(['Experiencias', 'Análisis Matemático II', 'Escribir experiencia']) + f'''
  <section style="flex-shrink: 0; padding: 26px 64px 0 64px;">
    {eyebrow('Tu experiencia')}
    <h1 style="margin: 14px 0 0 0; font-size: 64px; line-height: 0.92; font-weight: 800; letter-spacing: -0.055em; color: {NAVY};">Contá cómo <span style="color: {BLUE};">te fue</span><span style="color: {ORANGE};">.</span></h1>
    <p style="margin: 14px 0 0 0; font-size: 16.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Te lleva tres minutos y le ahorra un cuatrimestre de dudas a alguien.</p>
  </section>
'''

def consejos(titulo, items):
    filas = ''.join(f'<span style="display: flex; gap: 8px;">{ico("check", 15, "#1F7A37", 2.6)}<span>{t}</span></span>' for t in items)
    return f'''      <div style="position: relative; {CARD} padding: 18px 20px; overflow: hidden;">
        <h3 style="margin: 0; font-size: 17px; font-weight: 800; letter-spacing: -0.02em;">{titulo}</h3>
        <div style="margin-top: 11px; display: flex; flex-direction: column; gap: 9px; font-size: 13px; line-height: 1.45; font-weight: 500; color: {TEXT2}; max-width: 240px;">{filas}</div>
        <img src="gato-escribe.png" alt="" style="position: absolute; right: -16px; bottom: -10px; width: 118px; height: auto;">
      </div>
'''

def pagina_formulario(bloques, previa):
    return encabezado_escribir() + f'''
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px; display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 28px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 14px;">
{bloques}    </div>
    <aside style="display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">{ico('ojo', 15, MUTED, 2)}ASÍ SE VA A VER</div>
{previa}    </aside>
  </section>
'''

# ---------------------------------------------------------------- reseña de cursada (estado: promociono)
def p_escribir_cursada():
    texto = 'Los parciales son largos y toman todo lo de las guías. Arrancá con series desde la primera semana y no faltes a las consultas de los viernes: así la promocioné.'
    contexto = f'''<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 22px;">
          {campo('Ciclo lectivo', selector('2025'), 'obligatorio')}
          {campo('Profesor/a', selector('Prof. A. Gómez'))}
          <div style="grid-column: span 2;">{campo('Franja horaria', fila_opciones(['Mañana', 'Tarde', 'Noche', 'No indico'], 'Tarde'))}</div>
          <div style="grid-column: span 2;">{campo('Situación de cursada', fila_opciones(['Primera cursada', 'Primera recursada', 'Segunda o más', 'Prefiero no responder'], 'Primera cursada'), 'obligatorio')}</div>
        </div>'''
    # al elegir Promocion, el campo se extiende para pedir la nota
    resultado = f'''<div>
            {fila_opciones(['Promoción', 'Regular', 'Libre'], 'Promoción')}
            <div style="position: relative; margin-top: 12px; background: #ECF2FE; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 18px;">
              <span aria-hidden="true" style="position: absolute; top: -8px; left: 14%; width: 13px; height: 13px; background: #ECF2FE; border-left: 1.5px solid {NAVY}; border-top: 1.5px solid {NAVY}; transform: rotate(45deg);"></span>
              <div><div style="font-size: 14px; font-weight: 800;">¿Con qué nota promocionaste?</div><div style="margin-top: 3px; font-size: 12px; font-weight: 600; color: {MUTED};">Aparece solo si elegís Promoción.</div></div>
              {stepper('8', '/ 10')}
              <span style="margin-left: auto; font-size: 11px; font-weight: 700; color: {MUTED};">Opcional</span>
            </div>
          </div>'''
    niveles = fila_opciones(['Muy baja', 'Baja', 'Media', 'Alta', 'Muy alta'], 'Alta')
    estrellas_in = ''.join(f'<svg width="30" height="30" viewBox="0 0 24 24" fill="{"#E9B949" if i < 4 else "#FFFFFF"}" stroke="{NAVY if i < 4 else "#CFC5B0"}" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9z"></path></svg>' for i in range(5))
    como = f'''<div style="display: flex; flex-direction: column; gap: 18px;">
          {campo('Resultado de la cursada', resultado, 'obligatorio')}
          {campo('¿Qué tan difícil te resultó?', niveles)}
          {campo('¿La recomendarías cursar así?', f'<div style="display: flex; align-items: center; gap: 6px;">{estrellas_in}<span style="margin-left: 8px; font-size: 13px; font-weight: 700; color: {TEXT2};">4 de 5</span></div>', 'obligatorio')}
        </div>'''
    bloques = (bloque(1, '¿Qué querés contar?', tipo_y_materia('cursada')) + bloque(2, 'Contexto de la cursada', contexto)
               + bloque(3, 'Cómo terminó', como) + bloque(4, 'Tu experiencia', ideas(['¿Qué te sirvió?', '¿Cómo son los parciales?', '¿Qué harías distinto?']) + area_texto(texto))
               + bloque(5, 'Publicación', publicacion()))
    previa = f'''      <article style="{CARD} padding: 18px 20px; box-shadow: 5px 5px 0 {NAVY};">
        <div style="display: flex; align-items: center; gap: 12px;">
          {avatar('av-crema.png', 42)}
          <div><div style="font-size: 14.5px; font-weight: 800;">Anónimo</div><div style="font-size: 12px; font-weight: 600; color: #7A8296;">Reseña de cursada · ahora</div></div>
          <div style="margin-left: auto; display: flex; gap: 2px;">{estrellas(4, 15)}</div>
        </div>
        <h3 style="margin: 13px 0 0 0; font-size: 17px; font-weight: 800; letter-spacing: -0.025em;">Análisis Matemático II</h3>
        <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">{chip('Ciclo 2025')}{chip('Tarde')}{chip('Prof. A. Gómez')}{chip('Primera cursada')}{resultado_chip('Promoción', '8')}{chip('Dificultad alta')}</div>
        <p style="margin: 12px 0 0 0; font-size: 14px; line-height: 1.55; font-weight: 500; color: #4B5265;">“{texto}”</p>
      </article>
''' + consejos('Una buena reseña...', ['cuenta qué te sirvió y qué no.', 'describe cómo son los parciales.', 'deja un consejo concreto para quien viene.'])
    return header_logueado() + pagina_formulario(bloques, previa)

# ---------------------------------------------------------------- experiencia de final
TEMAS = ['Integrales dobles', 'Series de potencias', 'Teorema de Green']

def p_escribir_final():
    texto = 'Fueron tres ejercicios y una pregunta de teoría. El de integrales dobles era casi igual a uno de los finales viejos. Corrigieron en el día y nos explicaron los errores.'
    mesa = f'''<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 22px;">
          {campo('Período', selector('Diciembre'), 'obligatorio')}
          {campo('Año', selector('2024'), 'obligatorio')}
          <div style="grid-column: span 2;">{campo('Formato', fila_opciones(['Escrito', 'Oral', 'Mixto'], 'Escrito'), 'obligatorio')}</div>
          {campo('Profesores en la mesa', stepper('3', 'profesores'))}
          {campo('Tiempo para resolverlo', numero_unidad('3', 'horas'), ayuda='Si fue oral, cuánto duró tu examen.')}
        </div>'''
    como = f'''<div style="display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px 22px; align-items: start;">
          {campo('Resultado', fila_opciones(['Aprobado', 'Desaprobado', 'Prefiero no decir'], 'Aprobado'), 'obligatorio')}
          {campo('Nota', stepper('7', '/ 10'), 'obligatorio')}
          <div style="grid-column: span 2; margin-top: -8px; font-size: 12px; font-weight: 600; color: {MUTED};">Si elegís «Prefiero no decir», no se pide la nota.</div>
          <div style="grid-column: span 2;">{campo('Dificultad del final', '<div style="display: flex; flex-direction: column; gap: 10px;">' + escala('Teoría', 4) + escala('Práctica', 3) + '</div>')}</div>
        </div>'''
    temas = f'''<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; background: #FFFFFF; border: 2px solid {NAVY}; border-radius: 13px; padding: 10px 12px;">
          {''.join(chip_borrable(t) for t in TEMAS)}
          <span style="font-size: 14px; font-weight: 500; color: {MUTED};">Escribí un tema y presioná Enter…</span>
        </div>
        <div style="margin-top: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 7px;">
          <span style="font-size: 12px; font-weight: 700; color: {MUTED};">Los cargaron otros en esta materia:</span>
          {chip_sugerido('Integrales de línea')}{chip_sugerido('Ecuaciones diferenciales')}{chip_sugerido('Series de Fourier')}
        </div>'''
    preparacion = f'''<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 22px;">
          {campo('¿Con cuánto tiempo empezaste a estudiar?', numero_unidad('3', 'semanas', 'antes'))}
          {campo('¿Cuánto le dedicabas por día?', numero_unidad('1', 'hora', 'en promedio'))}
        </div>
        <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 8px; background: #F0F7C9; border-radius: 9px; padding: 7px 12px; font-size: 13px; font-weight: 700;">{ico('reloj', 15, '#5A7A00', 2.2)}Unas 21 horas de estudio en total</div>'''
    bloques = (bloque(1, '¿Qué querés contar?', tipo_y_materia('final')) + bloque(2, 'La mesa', mesa)
               + bloque(3, 'Cómo te fue', como) + bloque(4, 'Temas que tomaron', temas, 'Opcional · así otros saben qué estudiar')
               + bloque(5, 'Preparación', preparacion, 'Opcional')
               + bloque(6, 'Tu experiencia', ideas(['¿Qué te preguntaron?', '¿Cómo corrigieron?', '¿Qué te hubiera servido saber?']) + area_texto(texto))
               + bloque(7, 'Publicación', publicacion()))
    dato = lambda ic, t: f'<span style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: {TEXT2};">{ico(ic, 15, BTN, 2.1)}{t}</span>'
    previa = f'''      <article style="{CARD} padding: 18px 20px; box-shadow: 5px 5px 0 {NAVY};">
        <div style="display: flex; align-items: center; gap: 12px;">
          {avatar('av-birrete.png', 42)}
          <div><div style="font-size: 14.5px; font-weight: 800;">Anónimo</div><div style="font-size: 12px; font-weight: 600; color: #7A8296;">Experiencia de final · ahora</div></div>
        </div>
        <h3 style="margin: 13px 0 0 0; font-size: 17px; font-weight: 800; letter-spacing: -0.025em;">Análisis Matemático II</h3>
        <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">{chip('Mesa de diciembre 2024')}{chip('Escrito')}{resultado_chip('Aprobado', '7')}</div>
        <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 7px;">
          {dato('gente', 'Mesa de 3 profesores · 3 horas')}
          {dato('reloj', 'Preparación: 3 semanas, 1 h por día')}
          {dato('pulso', 'Teoría 4/5 · Práctica 3/5')}
        </div>
        <div style="margin-top: 12px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">TEMAS</div>
        <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 6px;">{''.join(chip(t, '#ECF2FE', '#2B4C8C') for t in TEMAS)}</div>
        <p style="margin: 12px 0 0 0; font-size: 14px; line-height: 1.55; font-weight: 500; color: #4B5265;">“{texto}”</p>
      </article>
''' + consejos('Una buena experiencia de final...', ['cuenta qué temas tomaron.', 'dice cómo se preparó y cuánto le llevó.', 'avisa qué le hubiera servido saber antes.'])
    return header_logueado() + pagina_formulario(bloques, previa)

PAGINAS = [
    ('Experiencias.dc.html', 'DevsProject · Experiencias', lambda: p_portada(), 1590, True),
    ('ExperienciasConSesion.dc.html', 'DevsProject · Experiencias (con sesión)', lambda: p_con_sesion(), 700, False),
    ('ExperienciasMateria.dc.html', 'DevsProject · Experiencias de Análisis Matemático II', lambda: p_materia(), 1700, True),
    ('EscribirExperiencia.dc.html', 'DevsProject · Escribir reseña de cursada', lambda: p_escribir_cursada(), 1900, True),
    ('EscribirFinal.dc.html', 'DevsProject · Escribir experiencia de final', lambda: p_escribir_final(), 2300, True),
]
