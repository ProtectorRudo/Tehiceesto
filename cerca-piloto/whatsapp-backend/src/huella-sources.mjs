/** Source-checked editorial material. No stories invented by a generative model. */
export const FOUNDATIONS=Object.freeze({
 infant:{name:'Harvard: Serve and Return',url:'https://developingchild.harvard.edu/key-concept/serve-and-return/'},
 child:{name:'American Academy of Pediatrics: juego compartido y comunicación',url:'https://www.healthychildren.org/Spanish/family-life/power-of-play/Paginas/how-shared-play-can-build-communication-skills.aspx'},
 teen:{name:'American Academy of Pediatrics: escuchar a adolescentes',url:'https://www.healthychildren.org/Spanish/family-life/family-dynamics/communication-discipline/Paginas/How-to-Communicate-with-a-Teenager.aspx'}
});
export const foundationFor=age=>FOUNDATIONS[age<=2?'infant':age<=10?'child':'teen'];

/** Real cases from UNICEF original articles, independently checked 2026-11-19.
 * The three paragraphs make a documentary narrative: an actual challenge,
 * the family's actual decisions, and the observed outcome. We do not invent
 * dialogue, motives, feelings, scenes, or guaranteed causal effects.
 */
export const VERIFIED_STORIES=Object.freeze([
 {id:'naomi',minAge:0,maxAge:2,title:'Silvia y Naomi: aprender a mirarse de nuevo',
  paragraphs:[
   'En Ucayali, Perú, Silvia Hernández volvió a tener una bebé después de once años. Su hija se llamaba Naomi. Silvia tenía miedo de hacerle daño al sostenerla y atravesó dificultades importantes con la lactancia. Cuidarla no estaba siendo tan sencillo como había imaginado.',
   'Buscó ayuda en el centro de salud de Shirambari. Allí conoció a Berita Sifuentes, una enfermera que la acompañó con paciencia. Además de atender las dificultades de salud, Berita le mostró cómo observar las señales de Naomi, mirarla, hablarle y jugar juntas durante las consultas.',
   'Con el acompañamiento sanitario, la alimentación de Naomi mejoró. Silvia también empezó a compartir juegos y miradas con ella. La historia no habla de una mamá perfecta: cuenta cómo pedir ayuda y descubrir el lenguaje de una bebé abrió un nuevo espacio de encuentro.'
  ],
  idea:'Esta semana, elegí un momento tranquilo para seguir la atención de tu bebé. No busques una reacción: simplemente acompañá lo que ya le interesa.',
  source:'UNICEF América Latina y el Caribe · 3/9/2021',
  url:'https://www.unicef.org/lac/en/stories/new-approach-to-childcare-transforms-the-lives-of-children-in-peru'},
 {id:'boongkie',minAge:3,maxAge:10,title:'Boongkie y la princesa que cambió de cuento',
  paragraphs:[
   'En 2020, Santi trabajaba desde su casa en Tailandia. Su hija Boongkie tenía seis años y, al verlo en casa, quería jugar con él. Pero Santi también debía cumplir con su trabajo. Tenía delante dos necesidades reales y no podía atenderlas de la misma manera al mismo tiempo.',
   'Se le ocurrió una propuesta: Boongkie podía inventar su propio libro de cuentos y mostrárselo cuando él terminara de trabajar. Ella eligió La bella durmiente y la transformó a su manera: en su versión, el peligro ya no era una bruja, sino el coronavirus.',
   'Cuando compartieron la historia, Santi descubrió una nueva forma de acercarse a la imaginación de su hija. UNICEF publicó su experiencia como ejemplo de tiempo compartido en medio de las dificultades del confinamiento. La solución no fue un gran paseo: fue darle lugar a una idea propia.'
  ],
  idea:'Si tu hijo disfruta crear, invitá una historia o un dibujo suyo y escuchá cómo lo imaginó. No hace falta corregir ni mejorar el resultado.',
  source:'UNICEF Tailandia · 11/5/2020',
  url:'https://www.unicef.org/thailand/stories/sleeping-beauty-and-covid-19-childs-creativity-unleashed'},
 {id:'hazem',minAge:3,maxAge:10,title:'Hazem: cuando el juego volvió a tener lugar en casa',
  paragraphs:[
   'En Alejandría, Egipto, Mona y Elsayed trabajaban muchas horas para darle un buen futuro a Hazem, su hijo de cuatro años. Pero llegaban cansados y el niño pasaba mucho tiempo con el teléfono o la tableta. En el jardín, su maestra Eman notó que Hazem se aislaba y tenía conflictos con otros chicos.',
   'Eman conversó con sus padres y los invitó a talleres de crianza positiva y juego. Al principio dudaron, pero decidieron participar. Después comenzaron a reservar momentos para jugar con Hazem, escuchar lo que sentía y hacerlo participar en decisiones sencillas de la casa. También redujeron las pantallas y cambiaron los castigos por más comunicación.',
   'La familia contó que Hazem empezó a disfrutar más los ratos juntos. En el jardín también se observaron cambios: compartía actividades, se relacionaba con otros niños e hizo un amigo llamado Hassan. Es la historia de esta familia, no una promesa de que todas vivirán los mismos resultados.'
  ],
  idea:'Elegí una rutina de esta semana y hacé lugar a una decisión pequeña de tu hijo: qué preparar juntos o cómo empezar una actividad, por ejemplo.',
  source:'UNICEF Egipto · 17/3/2025',
  url:'https://www.unicef.org/egypt/stories/hazems-transformation'},
 {id:'karim',minAge:0,maxAge:15,title:'Karim y Karma: la edad que no impidió escuchar',
  paragraphs:[
   'Karim Harraz, de Egipto, cumplió treinta años el mismo día que su hija Karma cumplió tres. Cuando todavía no era padre, pensaba que los hombres tenían poco lugar en la crianza durante los primeros años y que recién más adelante podrían conectar con sus hijos.',
   'La llegada de Karma cambió esa idea. Desde que ella tenía apenas unas semanas, Karim comenzó a notar sus gestos, sonidos, estados de ánimo y maneras propias de ser. También comprendió que necesitaba cuidar su forma de reaccionar, porque sus acciones podían convertirse en un ejemplo para ella.',
   'Al contar su historia a UNICEF, Karim explicó que buscaba pedirle opinión a Karma y darle espacio para participar de las decisiones según su edad. Descubrió que la crianza no consistía solo en enseñarle cosas a su hija: también podía aprender a escucharla.'
  ],
  idea:'Pensá en una elección cotidiana y preguntate qué parte puede decidir tu hijo según su edad. Después observá qué te muestra su respuesta.',
  source:'UNICEF Egipto · 25/6/2018',
  url:'https://www.unicef.org/egypt/stories/turning-thirty-turning-three'}
]);

/** Alternate among the children's stages, rather than always favoring the oldest. */
export function verifiedStoryFor(state,weekKey){
 const ages=(state.children||[]).map(c=>Number(c.age)).filter(Number.isFinite);
 const weekNo=Math.abs(Math.floor(Date.parse(weekKey+'T12:00:00Z')/604800000));
 const age=ages.length?ages[weekNo%ages.length]:0;
 const candidates=VERIFIED_STORIES.filter(x=>age>=x.minAge&&age<=x.maxAge);
 const bank=candidates.length?candidates:VERIFIED_STORIES.filter(x=>x.id==='karim');
 return bank[Math.floor(weekNo/Math.max(1,ages.length))%bank.length];
}
export function formatVerifiedStory(story){
 const original=VERIFIED_STORIES.find(x=>x.id===story?.id&&x.url===story.url);
 if(!original||!Array.isArray(original.paragraphs)||original.paragraphs.length!==3)throw Error('unverified_story');
 // Use only immutable editorial originals, never caller-provided invented narrative.
 return [
  '📖 HUELLA · Una historia real',
  '*'+original.title+'*',
  ...original.paragraphs,
  '*Lo que esta historia puede inspirarte:* '+original.idea,
  'Historia documentada por '+original.source+'\nFuente original: '+original.url
 ].join('\n\n');
}