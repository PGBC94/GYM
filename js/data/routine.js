// Rutina Full Body A/B/C (extraída del prototipo)
export const ROUTINE = {
  A: { name:"Día A", focus:"Sentadilla · empuje horizontal · jalón",
    ex:[
      {id:"goblet",   name:"Sentadilla goblet", machine:"Mancuerna sujeta al pecho", sets:3, reps:"10-12", rest:"90 s",
       tip:"Pies a la anchura de hombros, baja con el pecho alto hasta que los muslos queden paralelos al suelo. Empuja con todo el pie."},
      {id:"dbbench",  name:"Press de banca con mancuernas", machine:"Banco ajustable en plano + mancuernas", sets:3, reps:"10-12", rest:"90 s",
       tip:"Omóplatos juntos y apoyados en el banco. Baja las mancuernas hasta la altura del pecho con los codos a unos 45° del cuerpo."},
      {id:"latpull",  name:"Jalón al pecho", machine:"Máquina de jalón (Precor)", sets:3, reps:"10-12", rest:"90 s",
       tip:"Agarre algo más ancho que los hombros. Lleva la barra a la parte alta del pecho sacando pecho; no te balancees."},
      {id:"legcurl",  name:"Curl femoral", machine:"Máquina extensión / curl de pierna", sets:3, reps:"12", rest:"60 s",
       tip:"Rodilla alineada con el eje de la máquina. Sube rápido, baja en 2-3 segundos."},
      {id:"dbpress",  name:"Press de hombros sentado", machine:"Banco ajustable vertical + mancuernas", sets:2, reps:"10-12", rest:"60 s",
       tip:"Respaldo casi vertical. Empuja sin arquear la zona lumbar; termina con los brazos estirados sin bloquear los codos."},
      {id:"facepull", name:"Face pull con cuerda", machine:"Polea doble (functional trainer), polea alta", sets:2, reps:"15", rest:"60 s",
       tip:"Tira de la cuerda hacia la cara separando las manos. Ideal para la postura y los hombros."},
      {id:"plank",    name:"Plancha", machine:"Suelo / esterilla", sets:3, reps:"30 s", rest:"45 s", unit:"s",
       tip:"Codos bajo los hombros, glúteos apretados, cuerpo en línea recta. Anota los segundos en la columna de repeticiones."}
    ],
    finisher:{id:"cardioA", name:"Caminata en cinta inclinada", detail:"12 min · inclinación 8-10 % · ritmo en el que puedas hablar con esfuerzo"} },
  B: { name:"Día B", focus:"Bisagra de cadera · remo · empuje inclinado",
    ex:[
      {id:"rdl",      name:"Peso muerto rumano con mancuernas", machine:"Mancuernas", sets:3, reps:"10", rest:"90 s",
       tip:"Rodillas ligeramente flexionadas. Lleva la cadera atrás con la espalda neutra hasta notar estiramiento en los isquios; sube apretando glúteos."},
      {id:"cablerow", name:"Remo en polea baja", machine:"Polea doble, poleas abajo (de pie o rodilla en el suelo)", sets:3, reps:"12", rest:"90 s",
       tip:"Tira llevando los codos hacia atrás y junta los omóplatos al final. Mantén el torso quieto."},
      {id:"incline",  name:"Press inclinado con mancuernas", machine:"Banco ajustable a 30°", sets:3, reps:"10-12", rest:"90 s",
       tip:"Inclinación baja (30°). Mismo patrón que el press plano, enfocado en la parte alta del pecho."},
      {id:"legext",   name:"Extensión de cuádriceps", machine:"Máquina extensión / curl de pierna", sets:3, reps:"12-15", rest:"60 s",
       tip:"Rodilla alineada con el eje. Sube hasta casi estirar, aguanta 1 segundo arriba y baja controlando."},
      {id:"lunge",    name:"Zancada estática con mancuernas", machine:"Mancuernas", sets:2, reps:"10 / pierna", rest:"60 s",
       tip:"Un pie adelante y otro atrás; baja vertical hasta que la rodilla de atrás casi toque el suelo. Anota las reps por pierna."},
      {id:"hyper",    name:"Hiperextensiones", machine:"Banco romano a 45°", sets:2, reps:"12-15", rest:"60 s",
       tip:"Cadera justo por encima del cojín. Baja con la espalda recta y sube hasta alinear el cuerpo; no hiperextiendas arriba."},
      {id:"pallof",   name:"Press Pallof", machine:"Polea doble a la altura del pecho", sets:2, reps:"10 / lado", rest:"45 s",
       tip:"De lado a la polea, empuja el agarre al frente y resiste el giro. Trabaja el core sin cargar la espalda."}
    ],
    finisher:{id:"cardioB", name:"Intervalos en bicicleta", detail:"10 min · 30 s fuerte + 60 s suave, repetir"} },
  C: { name:"Día C", focus:"Glúteo · espalda unilateral · hombro y brazos",
    ex:[
      {id:"sumo",     name:"Sentadilla sumo con mancuerna", machine:"Mancuerna sujeta entre las piernas", sets:3, reps:"12", rest:"90 s",
       tip:"Pies más abiertos que los hombros y puntas hacia fuera. Las rodillas siguen la dirección de los pies."},
      {id:"dbrow",    name:"Remo a una mano con mancuerna", machine:"Banco ajustable plano + mancuerna", sets:3, reps:"10-12 / lado", rest:"60 s",
       tip:"Mano y rodilla apoyadas en el banco. Lleva la mancuerna hacia la cadera, no hacia el hombro."},
      {id:"cablefly", name:"Aperturas en polea", machine:"Polea doble, poleas a la altura del hombro", sets:3, reps:"12-15", rest:"60 s",
       tip:"Codos ligeramente flexionados y fijos. Junta las manos delante del pecho en un arco amplio."},
      {id:"hipthrust",name:"Hip thrust con mancuerna", machine:"Espalda apoyada en el banco + mancuerna sobre la cadera", sets:3, reps:"12", rest:"90 s",
       tip:"Parte alta de la espalda en el banco, pies firmes. Sube la cadera hasta alinear tronco y muslos y aprieta glúteos 1 segundo."},
      {id:"legcurl",  name:"Curl femoral", machine:"Máquina extensión / curl de pierna", sets:2, reps:"12", rest:"60 s",
       tip:"Igual que el Día A. Intenta igualar o superar el peso de esa sesión."},
      {id:"lateral",  name:"Elevaciones laterales", machine:"Mancuernas ligeras", sets:2, reps:"12-15", rest:"45 s",
       tip:"Sube los brazos hasta la altura de los hombros con los codos un poco flexionados. Usa poco peso y controla."},
      {id:"curltri",  name:"Curl de bíceps + extensión de tríceps", machine:"Polea doble (barra abajo / cuerda arriba)", sets:2, reps:"12 + 12", rest:"60 s",
       tip:"Superserie: un set de curl en la polea baja y sin descanso uno de extensión en la polea alta. Anota el peso del curl."}
    ],
    finisher:{id:"cardioC", name:"Cuerdas de batalla o elíptica", detail:"8 rondas de 20 s de cuerdas + 40 s de descanso, o 12 min de elíptica"} }
};
export const EX_INDEX = {};
Object.values(ROUTINE).forEach(d=>d.ex.forEach(e=>{ if(!EX_INDEX[e.id]) EX_INDEX[e.id]=e; }));

/** Escalón de peso por ejercicio (kg) para los botones −/+ y la sugerencia de subida.
 *  Mancuernas: 2 kg · máquinas y poleas: 2,5 kg · plancha: lastre 0 (se cuentan segundos). */
export const INC = {
  goblet:2, dbbench:2, latpull:2.5, legcurl:2.5, dbpress:2, facepull:2.5, plank:2.5,
  rdl:2, cablerow:2.5, incline:2, legext:2.5, lunge:2, hyper:2.5, pallof:2.5,
  sumo:2, dbrow:2, cablefly:2.5, hipthrust:2, lateral:1, curltri:2.5
};
/** Descanso en segundos a partir del texto "90 s" */
export const restSec = e => parseInt(String(e.rest)) || 60;
/** Límite inferior y superior del rango de repeticiones ("10-12", "12", "10 / pierna", "12 + 12", "30 s") */
export function repRange(e){
  const nums = String(e.reps).match(/\d+/g)?.map(Number) || [10];
  if (/-/.test(e.reps)) return [nums[0], nums[1]];
  return [nums[0], nums[0]];
}
export const DAYS = ["A","B","C"];
export const DAY_TAG = { A:"Sentadilla", B:"Bisagra", C:"Glúteo" };
/** Nombres cortos para resúmenes (historial) */
export const SHORT = {
  goblet:"Goblet", dbbench:"Press banca", latpull:"Jalón", legcurl:"Curl femoral", dbpress:"Press hombro", facepull:"Face pull", plank:"Plancha",
  rdl:"Peso muerto rumano", cablerow:"Remo polea", incline:"Press inclinado", legext:"Extensión cuádriceps", lunge:"Zancada", hyper:"Hiperextensión", pallof:"Pallof",
  sumo:"Sumo", dbrow:"Remo 1 mano", cablefly:"Aperturas", hipthrust:"Hip thrust", lateral:"Laterales", curltri:"Curl + tríceps"
};
