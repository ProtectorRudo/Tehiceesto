/** HUELLA's source-checked editorial references. Never use model-fabricated citations. */
export const FOUNDATIONS=Object.freeze({
 infant:{name:'Harvard: Serve and Return',url:'https://developingchild.harvard.edu/key-concept/serve-and-return/'},
 child:{name:'American Academy of Pediatrics: juego compartido y comunicación',url:'https://www.healthychildren.org/Spanish/family-life/power-of-play/Paginas/how-shared-play-can-build-communication-skills.aspx'},
 teen:{name:'American Academy of Pediatrics: escuchar a adolescentes',url:'https://www.healthychildren.org/Spanish/family-life/family-dynamics/communication-discipline/Paginas/How-to-Communicate-with-a-Teenager.aspx'}
});
export const foundationFor=age=>FOUNDATIONS[age<=2?'infant':age<=10?'child':'teen'];
// These are brief summaries of independently published UNICEF stories, not synthetic testimonials.
// Content reviewed against the original public article on 2026-11-19.
export const VERIFIED_STORIES=Object.freeze([
 {id:'naomi',minAge:0,maxAge:2,title:'Silvia y Naomi: el juego también es cuidado',
  text:'UNICEF contó la experiencia de Silvia Hernández y su bebé Naomi, en Perú. Durante encuentros de salud, aprendieron a observarse, hablarse y jugar cara a cara. El padre de Naomi también participa, aunque tiene poco tiempo disponible. Lo valioso: estar presente en interacciones sencillas, sin convertirlas en una exigencia.',
  idea:'Hoy podés observar qué llama la atención de tu bebé y acompañarlo un momento, sin forzar respuestas.',
  source:'UNICEF América Latina',url:'https://www.unicef.org/lac/en/stories/new-approach-to-childcare-transforms-the-lives-of-children-in-peru'},
 {id:'boongkie',minAge:3,maxAge:10,title:'Boongkie y el cuento que creó para su papá',
  text:'UNICEF Tailandia publicó cómo Santi, un padre que trabajaba desde casa, invitó a su hija Boongkie, de seis años, a inventar un libro de cuentos y enseñárselo al final del día. Ella reinterpretó La bella durmiente con su propia imaginación. La idea nació de buscar un encuentro real, incluso teniendo poco tiempo.',
  idea:'Una creación de tu hijo puede ser una invitación a conocer su manera de pensar, no una tarea para corregir.',
  source:'UNICEF Tailandia',url:'https://www.unicef.org/thailand/stories/sleeping-beauty-and-covid-19-childs-creativity-unleashed'},
 {id:'hazem',minAge:3,maxAge:10,title:'La familia de Hazem cambió sus momentos cotidianos',
  text:'UNICEF Egipto documentó cómo los padres de Hazem participaron en talleres de crianza positiva y decidieron reservar tiempo para jugar y conversar con él. También revisaron sus hábitos de disciplina. Sus padres describieron una convivencia diferente. Es una experiencia particular, no una garantía de resultados para todas las familias.',
  idea:'Elegí una rutina habitual y pensá cómo convertirla en un momento compartido, sin buscar obediencia como premio.',
  source:'UNICEF Egipto',url:'https://www.unicef.org/egypt/stories/hazems-transformation'},
 {id:'karim',minAge:0,maxAge:15,title:'Karim aprendió a escuchar desde que Karma era bebé',
  text:'UNICEF Egipto entrevistó a Karim Harraz, padre de Karma. Contó cómo descubrió desde sus primeros meses que su hija tenía expresiones y preferencias propias, y cómo ser padre lo llevó a observar su temperamento y pedirle opinión al crecer. Su testimonio invita a pensar cuánto podemos aprender al escuchar.',
  idea:'Buscá una decisión pequeña y auténtica en la que tu hijo pueda participar según su edad.',
  source:'UNICEF Egipto',url:'https://www.unicef.org/egypt/stories/turning-thirty-turning-three'}
]);
export function verifiedStoryFor(state,weekKey){
 const ages=(state.children||[]).map(c=>Number(c.age)||0);
 const max=Math.max(0,...ages);
 const candidates=VERIFIED_STORIES.filter(x=>max>=x.minAge&&max<=x.maxAge);
 const bank=candidates.length?candidates:VERIFIED_STORIES.filter(x=>x.id==='karim');
 const weekNo=Math.floor(Date.parse(weekKey+'T12:00:00Z')/604800000);
 return bank[weekNo%bank.length];
}
export function formatVerifiedStory(story){
 if(!VERIFIED_STORIES.some(x=>x.id===story?.id&&x.url===story.url))throw Error('unverified_story');
 return ['🌱 HUELLA · Historia real','*'+story.title+'*',story.text,'Para tu familia: '+story.idea,'Fuente: '+story.source+' · '+story.url].join('\n\n');
}