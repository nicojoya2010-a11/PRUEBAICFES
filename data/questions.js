const areaInfo = [
  { id: "lectura", name: "Lectura Crítica", short: "LEC", accent: "#ef4444" },
  { id: "matematicas", name: "Matemáticas", short: "MAT", accent: "#2563eb" },
  { id: "sociales", name: "Sociales y Ciudadanas", short: "SOC", accent: "#16a34a" },
  { id: "ciencias", name: "Ciencias Naturales", short: "CIE", accent: "#0891b2" },
  { id: "ingles", name: "Inglés", short: "ING", accent: "#7c3aed" }
];

function formatMoney(value) {
  return `$${Math.round(value).toLocaleString("es-CO")}`;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function fraction(numerator, denominator) {
  const divisor = gcd(numerator, denominator);
  return `${numerator / divisor}/${denominator / divisor}`;
}

function makeOptions(correct, distractors, seed) {
  const values = [correct, ...distractors].map((value) => String(value));
  const unique = [];
  const fallbackOptions = [
    "No se puede determinar con la información dada.",
    "La información presentada es insuficiente.",
    "La opción cambia el sentido del enunciado.",
    "El enunciado no permite sostener esa conclusión."
  ];

  values.forEach((value) => {
    if (!unique.includes(value)) {
      unique.push(value);
    }
  });

  for (const fallback of fallbackOptions) {
    if (unique.length >= 4) {
      break;
    }
    if (!unique.includes(fallback)) {
      unique.push(fallback);
    }
  }

  const base = unique.slice(0, 4);
  const shift = seed % base.length;
  const options = base.slice(shift).concat(base.slice(0, shift));

  return {
    options,
    answer: options.indexOf(String(correct))
  };
}

function addQuestion(list, areaId, skill, difficulty, context, prompt, correct, distractors, explanation) {
  const area = areaInfo.find((item) => item.id === areaId);
  const number = list.filter((item) => item.areaId === areaId).length + 1;
  const { options, answer } = makeOptions(correct, distractors, number);

  list.push({
    id: `${area.short}-${String(number).padStart(3, "0")}`,
    areaId,
    area: area.name,
    skill,
    difficulty,
    context,
    prompt,
    options,
    answer,
    explanation
  });
}

function buildLectura(list) {
  const passages = [
    {
      title: "Huertas escolares",
      text: "En un colegio urbano se abrió una huerta en el patio central. Al principio fue vista como una actividad decorativa; luego, los estudiantes comenzaron a medir el uso del agua, a comparar semillas y a vender parte de la cosecha en la tienda escolar. La huerta no reemplazó las clases de ciencias ni de matemáticas, pero las volvió más cercanas. Sin embargo, algunos docentes advirtieron que el proyecto solo tendría sentido si se mantenía como un espacio de investigación y no como una moda de semestre.",
      main: "La huerta escolar es valiosa cuando funciona como un espacio de aprendizaje sostenido.",
      inference: "El proyecto exige continuidad para producir aprendizajes reales.",
      intent: "Defender una iniciativa escolar, señalando una condición para que no pierda sentido.",
      phrase: "Sin embargo",
      phraseFunction: "Introduce una advertencia que matiza los beneficios del proyecto.",
      weaken: "Después del primer mes, ningún curso volvió a registrar datos ni a cuidar los cultivos."
    },
    {
      title: "Biblioteca digital",
      text: "La biblioteca del municipio compró tabletas para prestar libros digitales. La noticia fue celebrada como una prueba de modernización, aunque la asistencia no aumentó durante los primeros meses. La bibliotecaria observó que muchos jóvenes no necesitaban más pantallas, sino orientación para elegir qué leer y espacios para conversar sobre los textos. Por eso creó clubes de lectura mixtos: algunos libros se leían en papel y otros en formato digital.",
      main: "La tecnología mejora la lectura solo si se acompaña de mediación y conversación.",
      inference: "El acceso a dispositivos no garantiza por sí solo el hábito lector.",
      intent: "Cuestionar una idea simplista de modernización cultural.",
      phrase: "aunque",
      phraseFunction: "Contrasta el entusiasmo inicial con un resultado limitado.",
      weaken: "Tras entregar las tabletas, la asistencia subió sin necesidad de talleres ni clubes."
    },
    {
      title: "Movilidad",
      text: "La alcaldía propuso cerrar una avenida los domingos para uso de ciclistas y peatones. Los comerciantes temieron vender menos, mientras varios vecinos celebraron la posibilidad de caminar sin carros. Un mes después, las ventas de algunos cafés aumentaron y las quejas por ruido disminuyeron. Aun así, el informe recomienda evaluar rutas alternas para no trasladar la congestión a calles pequeñas.",
      main: "Una medida de movilidad puede traer beneficios, pero requiere evaluación de sus efectos secundarios.",
      inference: "La política pública debe considerar a distintos grupos afectados.",
      intent: "Presentar un balance prudente sobre una intervención urbana.",
      phrase: "Aun así",
      phraseFunction: "Introduce una precaución después de mencionar resultados positivos.",
      weaken: "El cierre produjo congestión severa en todos los barrios y no generó ningún uso peatonal."
    },
    {
      title: "Datos personales",
      text: "Una aplicación gratuita ofrecía filtros para fotos a cambio de registrar la ubicación de sus usuarios. Muchos aceptaron sin leer las condiciones, porque el servicio parecía inofensivo. Meses después se descubrió que la empresa vendía patrones de desplazamiento a firmas de publicidad. El caso muestra que la privacidad no siempre se pierde por imposición; a veces se entrega por desconocimiento.",
      main: "El uso irreflexivo de servicios digitales puede poner en riesgo la privacidad.",
      inference: "Aceptar términos sin comprenderlos puede tener consecuencias no visibles al inicio.",
      intent: "Advertir sobre una práctica cotidiana en entornos digitales.",
      phrase: "a veces",
      phraseFunction: "Amplía la explicación al mostrar una forma menos evidente de perder privacidad.",
      weaken: "La aplicación nunca recolectó ubicación ni compartió información con terceros."
    },
    {
      title: "Agua comunitaria",
      text: "En una vereda, la comunidad decidió reparar el acueducto antes de pedir maquinaria nueva. Los habitantes revisaron fugas, limpiaron el tanque y organizaron turnos de mantenimiento. Cuando llegó el apoyo de la gobernación, ya existía un diagnóstico claro. La obra avanzó más rápido porque la ayuda externa encontró una comunidad organizada, no una comunidad pasiva.",
      main: "La organización local puede hacer más eficaz el apoyo institucional.",
      inference: "La comunidad no esperó soluciones externas para actuar.",
      intent: "Resaltar el valor de la participación comunitaria en la solución de problemas.",
      phrase: "porque",
      phraseFunction: "Explica la causa de la rapidez con que avanzó la obra.",
      weaken: "La comunidad rechazó participar y la obra solo avanzó cuando llegó personal externo."
    },
    {
      title: "Memoria histórica",
      text: "El museo local abrió una sala con testimonios de víctimas del conflicto armado. Algunos visitantes preguntaron por qué se insistía en hechos dolorosos si el pueblo quería mirar al futuro. La guía respondió que recordar no significa quedarse detenido, sino reconocer responsabilidades y evitar que el silencio vuelva normal la violencia. La sala no busca cerrar la discusión, sino impedir que se borren sus preguntas.",
      main: "La memoria histórica permite comprender el pasado para construir una convivencia más responsable.",
      inference: "Olvidar hechos violentos puede dificultar la reparación social.",
      intent: "Justificar la importancia pública de conservar testimonios dolorosos.",
      phrase: "sino",
      phraseFunction: "Corrige una interpretación y propone una idea alternativa.",
      weaken: "Los testimonios fueron inventados y no correspondían a experiencias reales del pueblo."
    },
    {
      title: "Alimentación escolar",
      text: "El menú escolar cambió las bebidas azucaradas por jugos sin azúcar y frutas enteras. Varios estudiantes se quejaron durante la primera semana, pero el equipo de nutrición acompañó el cambio con talleres sobre energía, concentración y hábitos. Al final del mes, el rechazo disminuyó. La experiencia sugiere que una norma alimentaria funciona mejor cuando también se explica su propósito.",
      main: "Los cambios de hábitos son más aceptados cuando se acompañan de información pertinente.",
      inference: "La resistencia inicial puede reducirse mediante educación y diálogo.",
      intent: "Mostrar que una medida saludable necesita acompañamiento pedagógico.",
      phrase: "pero",
      phraseFunction: "Contrapone la queja inicial con la estrategia de acompañamiento.",
      weaken: "Los talleres confundieron a los estudiantes y aumentaron el rechazo durante todo el año."
    },
    {
      title: "Tecnología en clase",
      text: "Un profesor permitió usar celulares para consultar fuentes durante un debate. La actividad fracasó cuando varios estudiantes copiaron la primera respuesta que encontraron. En la siguiente sesión, el profesor pidió comparar tres fuentes, identificar autores y justificar cuál era más confiable. Entonces los celulares dejaron de ser una distracción automática y se volvieron una herramienta de lectura crítica.",
      main: "La tecnología educativa requiere criterios de uso para aportar al aprendizaje.",
      inference: "Consultar información no equivale a evaluarla críticamente.",
      intent: "Diferenciar el acceso a información de la formación de criterio.",
      phrase: "Entonces",
      phraseFunction: "Señala el resultado de modificar la estrategia de trabajo.",
      weaken: "Los estudiantes evaluaron fuentes con rigor desde la primera sesión, sin orientación alguna."
    },
    {
      title: "Emprendimiento local",
      text: "Un grupo de jóvenes empezó a vender mermeladas hechas con frutas de la región. Al comienzo copiaron etiquetas de marcas famosas para parecer más profesionales. Una asesora les explicó que la confianza no nace de imitar, sino de comunicar origen, calidad y responsabilidad. Rediseñaron la marca con historias de productores locales y sus ventas crecieron lentamente, pero con clientes más fieles.",
      main: "Un emprendimiento local puede fortalecerse cuando construye una identidad propia.",
      inference: "La autenticidad puede ser más valiosa que aparentar prestigio ajeno.",
      intent: "Valorar una estrategia comercial basada en identidad y confianza.",
      phrase: "sino",
      phraseFunction: "Reemplaza una idea equivocada por una recomendación central.",
      weaken: "Al copiar etiquetas de marcas famosas, el negocio ganó confianza estable y reconocimiento legal."
    },
    {
      title: "Deporte e inclusión",
      text: "El torneo intercolegiado exigía equipos mixtos, pero algunos capitanes dejaban a las niñas en la banca durante todo el partido. La regla parecía incluyente en el papel, aunque no cambiaba la práctica. Después se agregó una condición: todos los integrantes debían participar al menos un tiempo completo. La inclusión dejó de ser un requisito formal y empezó a notarse en la cancha.",
      main: "Una norma incluyente debe transformar la práctica, no solo aparecer en el reglamento.",
      inference: "La igualdad formal puede ser insuficiente si no se verifica su cumplimiento.",
      intent: "Criticar una inclusión aparente y proponer un criterio más efectivo.",
      phrase: "aunque",
      phraseFunction: "Marca una oposición entre la regla escrita y lo que ocurría realmente.",
      weaken: "Desde el inicio, todos los jugadores participaron por igual sin necesidad de ajustar reglas."
    }
  ];

  passages.forEach((passage, index) => {
    const context = `${passage.title}\n\n${passage.text}`;
    addQuestion(list, "lectura", "Comprensión global", "Básico", context, "¿Cuál es la idea central del texto?", passage.main, [
      "El texto presenta una anécdota sin relación con un problema general.",
      "El texto defiende que toda innovación debe rechazarse por sus riesgos.",
      "El texto se limita a describir una actividad sin tomar posición."
    ], "La idea central recoge el punto que organiza todo el texto, no solo un detalle del caso.");

    addQuestion(list, "lectura", "Inferencia", "Medio", context, "De acuerdo con el texto, se puede inferir que:", passage.inference, [
      "El problema queda resuelto de manera automática.",
      "La opinión de una sola persona basta para validar la conclusión.",
      "La situación descrita no tiene relación con decisiones colectivas."
    ], "La inferencia se apoya en información implícita del texto y evita exagerar lo que se afirma.");

    addQuestion(list, "lectura", "Intención comunicativa", "Medio", context, "La intención principal del autor es:", passage.intent, [
      "Ordenar al lector que acepte una conclusión sin argumentos.",
      "Narrar un hecho aislado sin relacionarlo con una reflexión.",
      "Presentar datos inconexos para confundir al lector."
    ], "La intención se reconoce por el propósito que cumplen los ejemplos y comentarios del autor.");

    addQuestion(list, "lectura", "Estructura textual", "Medio", context, `En el texto, la expresión "${passage.phrase}" cumple la función de:`, passage.phraseFunction, [
      "Repetir exactamente la misma idea anterior.",
      "Cerrar el texto sin aportar relación lógica.",
      "Introducir un ejemplo que no se conecta con la tesis."
    ], "Los conectores muestran relaciones de contraste, causa, consecuencia o corrección entre ideas.");

    addQuestion(list, "lectura", "Evaluación crítica", index % 2 === 0 ? "Avanzado" : "Medio", context, "¿Cuál afirmación debilitaría mejor la postura del texto?", passage.weaken, [
      "Un lector dijo que el tema le parecía interesante.",
      "La experiencia fue comentada en una reunión informal.",
      "El caso ocurrió en una institución con nombre propio."
    ], "Para debilitar una postura se requiere una afirmación que contradiga una razón clave del texto.");
  });
}

function buildMatematicas(list) {
  const discounts = [10, 15, 20, 25, 30, 12, 18, 22, 35, 40];
  discounts.forEach((discount, i) => {
    const price = 28000 + i * 4500;
    const finalPrice = price * (100 - discount) / 100;
    addQuestion(list, "matematicas", "Numérico-variacional", i < 4 ? "Básico" : "Medio", "", `Un libro cuesta ${formatMoney(price)} y tiene un descuento del ${discount} %. ¿Cuánto se paga al aplicar el descuento?`, formatMoney(finalPrice), [
      formatMoney(price + finalPrice * discount / 100),
      formatMoney(price - discount),
      formatMoney(price * (1 + discount / 100))
    ], `Se paga el ${100 - discount} % del precio: ${formatMoney(price)} * ${(100 - discount) / 100} = ${formatMoney(finalPrice)}.`);
  });

  for (let i = 0; i < 10; i += 1) {
    const x = i + 2;
    const a = 2 + (i % 4);
    const b = 5 + i;
    const c = a * x + b;
    addQuestion(list, "matematicas", "Álgebra", i < 5 ? "Básico" : "Medio", "", `Si ${a}x + ${b} = ${c}, ¿cuál es el valor de x?`, x, [
      x + 1,
      x - 1,
      c - b
    ], `Primero se resta ${b}: ${a}x = ${c - b}. Luego se divide entre ${a}: x = ${x}.`);
  }

  for (let i = 0; i < 10; i += 1) {
    if (i % 2 === 0) {
      const width = 6 + i;
      const height = 4 + i / 2;
      const area = width * height;
      addQuestion(list, "matematicas", "Geométrico-métrico", "Medio", "", `Un rectángulo mide ${width} cm de largo y ${height} cm de ancho. ¿Cuál es su área?`, `${area} cm²`, [
        `${2 * (width + height)} cm²`,
        `${width + height} cm²`,
        `${width * height / 2} cm²`
      ], "El área de un rectángulo se calcula multiplicando largo por ancho.");
    } else {
      const base = 8 + i;
      const height = 5 + i;
      const area = base * height / 2;
      addQuestion(list, "matematicas", "Geométrico-métrico", "Medio", "", `Un triángulo tiene base de ${base} cm y altura de ${height} cm. ¿Cuál es su área?`, `${area} cm²`, [
        `${base * height} cm²`,
        `${base + height} cm²`,
        `${2 * (base + height)} cm²`
      ], "El área de un triángulo es base por altura dividido entre 2.");
    }
  }

  for (let i = 0; i < 10; i += 1) {
    const base = 8 + i;
    if (i % 2 === 0) {
      const data = [base, base + 2, base + 6, base + 8, base + 9];
      const mean = base + 5;
      addQuestion(list, "matematicas", "Aleatorio", i < 6 ? "Básico" : "Medio", "", `Las notas de un estudiante son ${data.join(", ")}. ¿Cuál es el promedio?`, mean, [
        mean + 1,
        data[2],
        data[data.length - 1] - data[0]
      ], "El promedio es la suma de los datos dividida entre la cantidad de datos.");
    } else {
      const data = [base, base + 1, base + 4, base + 7, base + 10];
      const median = base + 4;
      addQuestion(list, "matematicas", "Aleatorio", "Medio", "", `Los tiempos registrados fueron ${data.join(", ")} minutos. ¿Cuál es la mediana?`, median, [
        base + 5,
        data[0],
        data[data.length - 1]
      ], "La mediana es el dato central cuando los valores están ordenados.");
    }
  }

  for (let i = 0; i < 5; i += 1) {
    const red = 2 + i;
    const blue = 3 + i;
    const green = 5;
    const total = red + blue + green;
    addQuestion(list, "matematicas", "Probabilidad", "Medio", "", `En una bolsa hay ${red} fichas rojas, ${blue} azules y ${green} verdes. Si se saca una ficha al azar, ¿cuál es la probabilidad de que sea roja?`, fraction(red, total), [
      fraction(blue, total),
      fraction(green, total),
      fraction(red + blue, total)
    ], "La probabilidad es casos favorables sobre casos posibles.");
  }

  for (let i = 0; i < 5; i += 1) {
    const m = i + 2;
    const b = i + 3;
    const x = i + 4;
    const value = m * x + b;
    addQuestion(list, "matematicas", "Funciones", i < 3 ? "Medio" : "Avanzado", "", `Para la función f(x) = ${m}x + ${b}, ¿cuál es el valor de f(${x})?`, value, [
      value + m,
      value - b,
      m + x + b
    ], `Se reemplaza x por ${x}: f(${x}) = ${m} * ${x} + ${b} = ${value}.`);
  }
}

function buildSociales(list) {
  const scenarios = [
    {
      title: "Río contaminado",
      text: "Habitantes de un barrio detectan malos olores en el río y sospechan que una fábrica vierte residuos sin tratamiento.",
      right: "El derecho a un ambiente sano y la responsabilidad de proteger bienes colectivos.",
      action: "Organizar evidencias, presentar derecho de petición y solicitar intervención de la autoridad ambiental.",
      mechanism: "Una veeduría ciudadana que haga seguimiento a las respuestas oficiales.",
      interpretation: "Un conflicto entre actividad económica, salud pública y protección ambiental.",
      solution: "Exigir control institucional sin desconocer el debido proceso de la empresa."
    },
    {
      title: "Presupuesto escolar",
      text: "La comunidad educativa debe decidir si prioriza laboratorios, biblioteca o escenarios deportivos con recursos limitados.",
      right: "La participación democrática en decisiones que afectan a la comunidad.",
      action: "Abrir deliberación con estudiantes, familias y docentes antes de votar prioridades.",
      mechanism: "El gobierno escolar como espacio de representación y discusión.",
      interpretation: "Un problema de asignación de recursos escasos entre necesidades legítimas.",
      solution: "Definir criterios públicos y revisar la decisión con información verificable."
    },
    {
      title: "Noticia falsa",
      text: "Durante una campaña local circula una cadena que acusa a una candidata sin pruebas y pide reenviarla masivamente.",
      right: "El derecho a recibir información veraz y la responsabilidad de no afectar la honra.",
      action: "Verificar la fuente antes de compartir y promover una rectificación si es falsa.",
      mechanism: "La denuncia ante autoridades electorales o plataformas de verificación.",
      interpretation: "Un riesgo para la deliberación democrática por desinformación.",
      solution: "Contrastar datos y proteger el debate público de acusaciones infundadas."
    },
    {
      title: "Trabajo juvenil",
      text: "Una tienda ofrece empleo a estudiantes menores de edad con jornadas nocturnas y sin autorización familiar.",
      right: "La protección especial de niños, niñas y adolescentes frente a condiciones laborales inadecuadas.",
      action: "Solicitar orientación a una autoridad laboral o de protección de infancia.",
      mechanism: "La intervención del Ministerio de Trabajo o la comisaría de familia según el caso.",
      interpretation: "Una tensión entre necesidad económica y garantía de derechos.",
      solution: "Permitir alternativas formativas y seguras que no vulneren la educación ni la salud."
    },
    {
      title: "Parque público",
      text: "Un conjunto residencial cercó parte de un parque que era usado por vecinos de distintos sectores.",
      right: "El uso colectivo del espacio público y la igualdad de acceso.",
      action: "Solicitar a la alcaldía verificar la legalidad del cerramiento.",
      mechanism: "Una acción popular si se afecta un derecho colectivo.",
      interpretation: "Un conflicto entre intereses privados y bienes de uso común.",
      solution: "Restituir el acceso público y acordar reglas de cuidado compartido."
    },
    {
      title: "Consulta previa",
      text: "Una obra vial atravesaría territorio de una comunidad étnica sin que sus autoridades hayan sido escuchadas.",
      right: "El derecho a la participación y a la consulta previa de comunidades étnicas.",
      action: "Suspender decisiones de fondo hasta realizar un proceso de consulta adecuado.",
      mechanism: "La consulta previa como procedimiento de diálogo y concertación.",
      interpretation: "Un caso donde el desarrollo de infraestructura debe respetar diversidad cultural.",
      solution: "Ajustar el proyecto con participación informada de la comunidad afectada."
    },
    {
      title: "Impuestos locales",
      text: "El municipio propone aumentar un impuesto para financiar atención en salud, pero algunos ciudadanos piden conocer el destino exacto del dinero.",
      right: "El control ciudadano sobre el uso de recursos públicos.",
      action: "Solicitar información presupuestal clara y participar en audiencias públicas.",
      mechanism: "La rendición de cuentas como práctica de transparencia.",
      interpretation: "Una relación entre tributación, bienes públicos y confianza institucional.",
      solution: "Publicar metas, costos y mecanismos de seguimiento del gasto."
    },
    {
      title: "Protesta estudiantil",
      text: "Estudiantes marchan por transporte escolar. La autoridad permite la protesta, pero exige que no se bloquee la entrada a un hospital.",
      right: "La libertad de expresión y reunión, limitada por derechos de otras personas.",
      action: "Acordar un recorrido que haga visible la demanda sin impedir servicios esenciales.",
      mechanism: "La concertación entre manifestantes y autoridades civiles.",
      interpretation: "Un equilibrio entre protesta legítima y protección de otros derechos.",
      solution: "Garantizar la manifestación con medidas proporcionales de seguridad."
    },
    {
      title: "Desplazamiento",
      text: "Una familia llega a la ciudad después de abandonar su vereda por amenazas de un grupo armado.",
      right: "La protección y reparación de víctimas del conflicto armado.",
      action: "Orientar a la familia para declarar los hechos y acceder a rutas de atención.",
      mechanism: "El registro y la atención institucional a víctimas.",
      interpretation: "Una consecuencia social del conflicto que exige respuesta estatal integral.",
      solution: "Garantizar atención humanitaria, educación y acompañamiento jurídico."
    },
    {
      title: "Precio de alimentos",
      text: "Una sequía reduce la cosecha de papa y en pocas semanas el precio sube en las plazas de mercado.",
      right: "La seguridad alimentaria como preocupación social y económica.",
      action: "Analizar oferta, demanda y medidas de apoyo a productores y consumidores.",
      mechanism: "Políticas públicas de abastecimiento y apoyo agropecuario.",
      interpretation: "Un cambio de precios asociado a menor oferta de un producto básico.",
      solution: "Evitar especulación y fortalecer canales de distribución sin culpar a un solo actor."
    }
  ];

  scenarios.forEach((scenario, index) => {
    const context = `${scenario.title}\n\n${scenario.text}`;
    addQuestion(list, "sociales", "Pensamiento social", "Básico", context, "El derecho o principio más relacionado con la situación es:", scenario.right, [
      "La eliminación de toda forma de participación comunitaria.",
      "La prioridad absoluta de intereses privados sin control público.",
      "La obligación de resolver conflictos mediante rumores."
    ], "La respuesta identifica el principio constitucional o social que organiza el caso.");

    addQuestion(list, "sociales", "Interpretación y análisis", "Medio", context, "La acción ciudadana más adecuada sería:", scenario.action, [
      "Actuar solo con base en comentarios no verificados.",
      "Impedir cualquier diálogo con las instituciones.",
      "Suponer que el problema no afecta a nadie más."
    ], "Una acción adecuada combina participación, información y respeto por los procedimientos.");

    addQuestion(list, "sociales", "Ciudadanía", "Medio", context, "¿Qué mecanismo o institución corresponde mejor al caso?", scenario.mechanism, [
      "Una decisión secreta sin registro ni responsables.",
      "Un acuerdo informal que ignore las normas vigentes.",
      "La sustitución de las autoridades por opiniones en redes."
    ], "Los mecanismos democráticos permiten tramitar conflictos sin desconocer derechos.");

    addQuestion(list, "sociales", "Análisis de perspectivas", index % 3 === 0 ? "Avanzado" : "Medio", context, "La situación se entiende mejor como:", scenario.interpretation, [
      "Un hecho aislado que no involucra intereses sociales.",
      "Un problema que solo puede resolverse con castigos inmediatos.",
      "Una dificultad causada por una única persona sin contexto."
    ], "El análisis social reconoce actores, intereses, derechos y condiciones del contexto.");

    addQuestion(list, "sociales", "Pensamiento reflexivo", "Avanzado", context, "Una decisión compatible con el Estado social de derecho sería:", scenario.solution, [
      "Aplicar una solución que favorezca a un grupo y silencie a los demás.",
      "Evitar cualquier control público sobre la decisión tomada.",
      "Resolver el caso sin información, participación ni garantías."
    ], "El Estado social de derecho exige proteger derechos, deliberar y justificar las decisiones públicas.");
  });
}

function buildCiencias(list) {
  const phenomena = [
    {
      title: "Crecimiento de plantas",
      text: "Un grupo cultiva plantas iguales con la misma cantidad de agua, pero cambia las horas de luz diaria.",
      variable: "Las horas de luz diaria.",
      hypothesis: "Si una planta recibe más luz dentro de un rango adecuado, entonces puede aumentar su crecimiento.",
      conclusion: "La luz influye en el crecimiento si las demás condiciones se mantienen controladas.",
      concept: "Fotosíntesis y control de variables.",
      control: "Usar plantas de la misma especie y mantener igual agua, suelo y tamaño de matera."
    },
    {
      title: "Péndulo",
      text: "Se mide el tiempo que tarda un péndulo en oscilar usando cuerdas de diferentes longitudes.",
      variable: "La longitud de la cuerda.",
      hypothesis: "Si aumenta la longitud de la cuerda, entonces cambia el periodo de oscilación.",
      conclusion: "La longitud es un factor que afecta el tiempo de oscilación del péndulo.",
      concept: "Movimiento periódico.",
      control: "Soltar el péndulo desde el mismo ángulo en cada prueba."
    },
    {
      title: "Acidez del suelo",
      text: "Un laboratorio compara muestras de suelo y encuentra que algunas tienen pH bajo y menor crecimiento de ciertas plantas.",
      variable: "El pH del suelo.",
      hypothesis: "Si el pH se aleja del rango tolerado por la planta, entonces su crecimiento disminuye.",
      conclusion: "La acidez puede limitar la disponibilidad de nutrientes para algunas especies.",
      concept: "pH y nutrición vegetal.",
      control: "Comparar plantas de la misma especie bajo condiciones de agua y luz semejantes."
    },
    {
      title: "Especie invasora",
      text: "En una laguna aparece un pez introducido que se reproduce rápido y consume alimento de especies nativas.",
      variable: "La presencia del pez introducido.",
      hypothesis: "Si aumenta la población invasora, entonces puede disminuir la población de especies nativas.",
      conclusion: "La competencia por recursos puede alterar el equilibrio del ecosistema.",
      concept: "Relaciones ecológicas y competencia.",
      control: "Monitorear poblaciones antes y después de la introducción en zonas comparables."
    },
    {
      title: "Circuito eléctrico",
      text: "Se arma un circuito con una pila y bombillos. Al agregar más bombillos en serie, disminuye el brillo.",
      variable: "El número de bombillos conectados en serie.",
      hypothesis: "Si se agregan bombillos en serie, entonces la resistencia total aumenta y el brillo disminuye.",
      conclusion: "En serie, los componentes comparten la corriente disponible.",
      concept: "Resistencia eléctrica y circuitos en serie.",
      control: "Usar la misma pila y bombillos del mismo tipo en cada montaje."
    },
    {
      title: "Cambio de estado",
      text: "Una muestra de hielo se calienta hasta convertirse en agua líquida y luego en vapor.",
      variable: "La temperatura suministrada al sistema.",
      hypothesis: "Si se entrega suficiente energía térmica, entonces la sustancia cambia de estado.",
      conclusion: "Los cambios de estado se relacionan con la energía y el movimiento de partículas.",
      concept: "Estados de la materia y calor.",
      control: "Medir temperatura y tiempo con instrumentos iguales durante todo el proceso."
    },
    {
      title: "Vacunación",
      text: "Después de una campaña de vacunación, baja el número de casos graves de una enfermedad en la población.",
      variable: "La proporción de personas vacunadas.",
      hypothesis: "Si aumenta la vacunación, entonces disminuyen los casos graves en la población protegida.",
      conclusion: "La vacunación prepara al sistema inmune y reduce riesgos colectivos.",
      concept: "Respuesta inmune y prevención.",
      control: "Comparar grupos con datos de edad, exposición y condiciones similares."
    },
    {
      title: "Erosión",
      text: "Dos laderas reciben lluvia intensa: una conserva vegetación y la otra fue talada recientemente.",
      variable: "La cobertura vegetal de la ladera.",
      hypothesis: "Si se reduce la vegetación, entonces aumenta la pérdida de suelo por escorrentía.",
      conclusion: "Las raíces y la cobertura vegetal ayudan a disminuir la erosión.",
      concept: "Erosión y protección del suelo.",
      control: "Comparar laderas con pendiente y tipo de suelo semejantes."
    },
    {
      title: "Ósmosis",
      text: "Rodajas de papa se colocan en agua pura y en agua con mucha sal; luego se comparan sus masas.",
      variable: "La concentración de sal en el agua.",
      hypothesis: "Si aumenta la concentración de sal externa, entonces puede salir agua de las células de la papa.",
      conclusion: "El agua se mueve a través de membranas según diferencias de concentración.",
      concept: "Ósmosis.",
      control: "Usar rodajas del mismo tamaño y medir la masa antes y después del mismo tiempo."
    },
    {
      title: "Clima local",
      text: "Durante diez años se registra aumento de temperatura promedio y reducción de lluvias en una región.",
      variable: "La temperatura promedio y la precipitación anual registradas.",
      hypothesis: "Si cambian los patrones de temperatura y lluvia, entonces se afectan cultivos y disponibilidad de agua.",
      conclusion: "Las tendencias climáticas se analizan con series de datos de varios años.",
      concept: "Variabilidad climática y análisis de datos.",
      control: "Usar mediciones comparables tomadas con métodos consistentes durante varios años."
    }
  ];

  phenomena.forEach((item, index) => {
    const context = `${item.title}\n\n${item.text}`;
    addQuestion(list, "ciencias", "Indagación", "Básico", context, "En esta investigación, la variable que se modifica o analiza principalmente es:", item.variable, [
      "La opinión de los observadores.",
      "El nombre del lugar donde se realiza la prueba.",
      "Un dato que no cambia ni se registra."
    ], "La variable principal es el factor que se manipula o se compara para estudiar su efecto.");

    addQuestion(list, "ciencias", "Explicación de fenómenos", "Medio", context, "¿Cuál hipótesis se ajusta mejor a la situación?", item.hypothesis, [
      "Si se ignoran las mediciones, entonces el resultado será más confiable.",
      "Si no se controla ningún factor, entonces se puede asegurar la causa.",
      "Si se repite una palabra científica, entonces la hipótesis queda comprobada."
    ], "Una hipótesis relaciona una condición con un posible efecto observable.");

    addQuestion(list, "ciencias", "Uso comprensivo del conocimiento", index % 4 === 0 ? "Avanzado" : "Medio", context, "La conclusión más razonable es:", item.conclusion, [
      "No se puede relacionar ningún factor con lo observado.",
      "El resultado depende únicamente del azar y no requiere datos.",
      "La explicación debe basarse en preferencias personales."
    ], "La conclusión debe apoyarse en los datos descritos y no excederlos.");

    addQuestion(list, "ciencias", "Conceptos científicos", "Medio", context, "El concepto científico más relacionado con el caso es:", item.concept, [
      "Clasificación de textos literarios.",
      "Normas de tránsito urbano.",
      "Cálculo de intereses bancarios."
    ], "El concepto conecta el fenómeno observado con un modelo o principio científico.");

    addQuestion(list, "ciencias", "Diseño experimental", "Avanzado", context, "Para mejorar la validez del estudio conviene:", item.control, [
      "Cambiar todos los factores al mismo tiempo.",
      "Registrar solo los datos que confirmen la idea inicial.",
      "Evitar repetir el experimento para ahorrar tiempo."
    ], "Controlar variables permite comparar resultados con mayor confianza.");
  });
}

function buildIngles(list) {
  const readings = [
    {
      title: "Science fair",
      text: "Laura is preparing a small robot for the school science fair. She will test it on Friday and present it on Monday.",
      main: "She will present a robot at the school science fair.",
      vocabPrompt: "In the text, the word \"preparing\" is closest in meaning to:",
      vocab: "getting ready",
      grammarPrompt: "Choose the correct sentence.",
      grammar: "Laura will test the robot on Friday.",
      functionPrompt: "A classmate says, \"Good luck with your presentation.\" The best answer is:",
      functionAnswer: "Thank you. I hope it goes well.",
      completionPrompt: "Complete: Laura is interested ___ technology.",
      completion: "in"
    },
    {
      title: "Lost wallet",
      text: "Tom found a wallet near the bus stop. He took it to the school office because there was an ID card inside.",
      main: "He gave the wallet to the school office.",
      vocabPrompt: "In the text, \"found\" means:",
      vocab: "discovered",
      grammarPrompt: "Choose the correct sentence.",
      grammar: "Tom found a wallet near the bus stop.",
      functionPrompt: "The owner says, \"Thanks for returning it.\" The best answer is:",
      functionAnswer: "You're welcome.",
      completionPrompt: "Complete: The wallet was ___ the bus stop.",
      completion: "near"
    },
    {
      title: "Rainy hike",
      text: "Marta wanted to go hiking, but it started to rain heavily. She stayed home and read a book about national parks.",
      main: "She stayed home because the weather was bad.",
      vocabPrompt: "In the text, \"heavily\" describes rain that is:",
      vocab: "very strong",
      grammarPrompt: "Choose the correct sentence.",
      grammar: "It started to rain heavily.",
      functionPrompt: "Marta says, \"Maybe we can hike next weekend.\" The best reply is:",
      functionAnswer: "Sure, let's check the weather first.",
      completionPrompt: "Complete: Marta read a book ___ national parks.",
      completion: "about"
    },
    {
      title: "New neighbor",
      text: "A new family moved into the apartment next door. Sara baked cookies and introduced herself in the afternoon.",
      main: "Sara welcomed the new neighbors.",
      vocabPrompt: "In the text, \"introduced herself\" means:",
      vocab: "said who she was",
      grammarPrompt: "Choose the correct sentence.",
      grammar: "A new family moved into the apartment.",
      functionPrompt: "The neighbor says, \"Nice to meet you.\" The best answer is:",
      functionAnswer: "Nice to meet you too.",
      completionPrompt: "Complete: Sara lives next ___ the new family.",
      completion: "to"
    },
    {
      title: "Healthy lunch",
      text: "Daniel usually bought chips for lunch. This week he is bringing fruit, rice and chicken because he wants more energy for soccer practice.",
      main: "He changed his lunch to feel better during practice.",
      vocabPrompt: "In the text, \"usually\" means:",
      vocab: "most of the time",
      grammarPrompt: "Choose the correct sentence.",
      grammar: "Daniel is bringing fruit this week.",
      functionPrompt: "A friend asks, \"Why did you change your lunch?\" The best answer is:",
      functionAnswer: "Because I want more energy for practice.",
      completionPrompt: "Complete: Daniel wants energy ___ soccer practice.",
      completion: "for"
    },
    {
      title: "Library card",
      text: "Emma needs a library card to borrow books. The librarian asked her to fill out a form and show her student ID.",
      main: "Emma must complete a form and show an ID to get a library card.",
      vocabPrompt: "In the text, \"borrow\" means:",
      vocab: "take and return later",
      grammarPrompt: "Choose the correct sentence.",
      grammar: "Emma needs a library card.",
      functionPrompt: "The librarian asks, \"Can I see your ID?\" The best answer is:",
      functionAnswer: "Yes, here it is.",
      completionPrompt: "Complete: She has to fill ___ a form.",
      completion: "out"
    },
    {
      title: "Broken phone",
      text: "Kevin dropped his phone and the screen broke. He cannot buy a new one, so he will take it to a repair shop.",
      main: "He plans to repair his phone.",
      vocabPrompt: "In the text, \"repair\" means:",
      vocab: "fix",
      grammarPrompt: "Choose the correct sentence.",
      grammar: "Kevin will take it to a repair shop.",
      functionPrompt: "The technician says, \"It will be ready tomorrow.\" The best answer is:",
      functionAnswer: "Great, thank you.",
      completionPrompt: "Complete: Kevin dropped his phone ___ the floor.",
      completion: "on"
    },
    {
      title: "Art contest",
      text: "Nina painted a picture of her town and sent it to an art contest. She felt nervous, but her teacher encouraged her.",
      main: "Nina entered an art contest with a painting of her town.",
      vocabPrompt: "In the text, \"encouraged\" means:",
      vocab: "gave confidence",
      grammarPrompt: "Choose the correct sentence.",
      grammar: "Nina painted a picture of her town.",
      functionPrompt: "Nina says, \"I'm nervous about the contest.\" The best reply is:",
      functionAnswer: "Your painting is good. You can do it.",
      completionPrompt: "Complete: Nina sent her picture ___ the contest.",
      completion: "to"
    },
    {
      title: "Morning train",
      text: "The train leaves at 6:30 a.m. Pablo arrived at the station at 6:20, so he had enough time to buy a ticket.",
      main: "Pablo arrived before the train left.",
      vocabPrompt: "In the text, \"enough\" means:",
      vocab: "sufficient",
      grammarPrompt: "Choose the correct sentence.",
      grammar: "The train leaves at 6:30 a.m.",
      functionPrompt: "A passenger asks, \"What time does the train leave?\" The best answer is:",
      functionAnswer: "It leaves at 6:30.",
      completionPrompt: "Complete: Pablo arrived ___ the station early.",
      completion: "at"
    },
    {
      title: "Weekend project",
      text: "Sofia and her brother are building a birdhouse this weekend. They bought wood yesterday and will paint it blue tomorrow.",
      main: "They are making and painting a birdhouse.",
      vocabPrompt: "In the text, \"bought\" means:",
      vocab: "purchased",
      grammarPrompt: "Choose the correct sentence.",
      grammar: "They will paint it blue tomorrow.",
      functionPrompt: "Sofia asks, \"Can you help me paint it?\" The best answer is:",
      functionAnswer: "Of course. What time should I come?",
      completionPrompt: "Complete: They are building a birdhouse ___ the weekend.",
      completion: "on"
    }
  ];

  readings.forEach((reading, index) => {
    const context = `${reading.title}\n\n${reading.text}`;
    addQuestion(list, "ingles", "Reading comprehension", "Básico", context, "What is the text mainly about?", reading.main, [
      "A person who refuses to do anything.",
      "A place that is never mentioned in the text.",
      "A problem with no possible solution."
    ], "La idea principal resume la situación completa, no un dato suelto.");

    addQuestion(list, "ingles", "Vocabulary", "Básico", context, reading.vocabPrompt, reading.vocab, [
      "to forget",
      "very expensive",
      "without a reason"
    ], "La palabra se interpreta por el contexto de la oración.");

    addQuestion(list, "ingles", "Grammar", index % 2 === 0 ? "Medio" : "Básico", context, reading.grammarPrompt, reading.grammar, [
      reading.grammar.replace("will", "will to").replace("is", "are"),
      "She are going yesterday.",
      "They has a good idea."
    ], "La respuesta conserva el tiempo verbal y la concordancia correctos.");

    addQuestion(list, "ingles", "Communicative function", "Medio", context, reading.functionPrompt, reading.functionAnswer, [
      "No, I don't know your name.",
      "Yesterday is very blue.",
      "I never speak to people."
    ], "La respuesta adecuada cumple la función comunicativa de la situación.");

    addQuestion(list, "ingles", "Sentence completion", "Medio", context, reading.completionPrompt, reading.completion, [
      "by",
      "from",
      "under"
    ], "La preposición correcta depende de la expresión usada en la frase.");
  });
}

function getQuestionBank() {
  const list = [];
  buildLectura(list);
  buildMatematicas(list);
  buildSociales(list);
  buildCiencias(list);
  buildIngles(list);
  return list;
}

function getMeta() {
  const questions = getQuestionBank();
  return {
    sourceNote: "Banco original de práctica inspirado en competencias Saber 11. No corresponde a preguntas oficiales del ICFES.",
    areas: areaInfo.map((area) => ({
      ...area,
      count: questions.filter((question) => question.areaId === area.id).length
    })),
    total: questions.length
  };
}

module.exports = {
  getQuestionBank,
  getMeta,
  getAreaInfo: () => areaInfo.map((area) => ({ ...area }))
};
