import {test,expect} from "@playwright/test";

type QA={action:(a:string)=>void;getPhase:()=>string};
const action=async(page:import("@playwright/test").Page,target:string)=>{
  await page.evaluate((name)=>{const q=(window as any).__BELLADONNA_QA__ as QA;q.action(name);},target);
};
const expectPhase=async(page:import("@playwright/test").Page,p:string)=>{
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.getPhase?.())).toBe(p);
};
test("recorrido completo: butaca, iluminación, proyector y gran revelación",async({page},testInfo)=>{
  test.setTimeout(230000); // Real models and full playthrough in software-rendered browser.
  const errors:string[]=[];page.on("pageerror",err=>errors.push(err.message));
  await page.goto("/?nombre=Martina&evento=Fiesta%20de%20cumplea%C3%B1os&fecha=24%2F10%2F2026&hora=21%3A00&lugar=Sal%C3%B3n%20Belladonna");
  await page.getByRole("button",{name:/ABRIR LAS PUERTAS/}).click();
  const letter=page.getByRole("dialog",{name:/La función que nunca terminó/i});
  await expect(letter).toBeVisible();
  await expect(letter).toContainText("FILA 3");
  await expect(letter).toContainText("ASIENTO 8");
  await expect(page.locator(".timer")).toHaveCount(0);
  await page.screenshot({path:testInfo.outputPath("01b-carta-mision.png")});
  await letter.getByRole("button",{name:/ENTENDÍ MI MISIÓN/i}).click();
  await expectPhase(page,"inicio");
  // No basta con que compile: el humano skinned debe cargar y disponer de ambas animaciones.
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.character?.()),{timeout:45000}).toEqual({
    human:true,idle:true,walk:true
  });
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.cinema?.()),{timeout:60000}).toMatchObject({
    projectorModel:true,director:true,velvetPBR:true,act:"inicio"
  });
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.seatNumbers?.()),{timeout:10000})
    .toMatchObject({rows:8,perRow:10,numbered:80,digits:10,target:"FILA 3 · ASIENTO 8"});
  expect(await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.viewRowSignage?.())).toBe(true);
  await page.screenshot({path:testInfo.outputPath("04-filas-senalizadas.png")});
  expect(await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.viewNumberedSeat?.())).toBe(true);
  await page.screenshot({path:testInfo.outputPath("05-asiento-3-8.png")});
  // The warning references a real upper gallery, not empty ceiling.
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.boxes?.()),{timeout:10000})
    .toMatchObject({count:2,labels:[true,true]});
  expect(await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.viewBox?.())).toBe(true);
  await page.screenshot({path:testInfo.outputPath("06-palco-visible.png")});
  // The actor must never enter the raised stage or float at a changed root Y.
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.usherGround?.()),{timeout:15000})
    .toMatchObject({safe:true,stageBoundary:-11.12});
  // The old CG placeholder must be gone: the actual GLB skeleton wears
  // a stage uniform with a separately rigged cap, and looks toward the visitor.
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.usher?.()),{timeout:50000})
    .toMatchObject({headBone:true,periodCap:true});
  expect(await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.viewUsher?.())).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.usher?.()?.eyeContact),{timeout:12000}).toBe(true);
  await page.screenshot({path:testInfo.outputPath("03-acomodador.png")});
  await action(page,"butaca");await expectPhase(page,"luces");
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.usherGround?.()?.safe),{timeout:12000}).toBe(true);
  // Physical electrical circuit: cannot activate anything before finding
  // and inserting the ceramic fuse in the actual 3D electrical cabinet.
  await action(page,"ambar");await expectPhase(page,"luces");
  await action(page,"fusible");await expectPhase(page,"luces");
  await action(page,"portafusible");
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.mechanics?.()?.fuseInstalled)).toBe(true);
  // La secuencia errónea debe bloquear la progresión.
  await action(page,"azul");await expectPhase(page,"luces");
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.mechanics?.()))
    .toMatchObject({consoleButtons:3,consoleSocketBlocking:false,circuitsActive:0});
  // A real finger taps the center of the 3D amber disc. This catches the
  // previous defect: the fuse socket intercepts the tap on Android.
  expect(await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.aim?.("ambar"))).toBe(true);
  await page.waitForTimeout(150);
  await page.screenshot({path:testInfo.outputPath("09-consola-botones-fusible.png")});
  const switchCanvas=page.locator(".three-canvas");
  const rect=await switchCanvas.boundingBox();
  expect(rect).not.toBeNull();
  await switchCanvas.click({position:{x:rect!.width/2,y:rect!.height/2}});
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.mechanics?.()?.circuitsActive),{timeout:8000}).toBe(1);
  for(const a of ["azul","rojo"])await action(page,a);
  await expectPhase(page,"proyector");
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.usherGround?.()?.safe),{timeout:12000}).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.cinema?.()?.act)).toBe("proyector");
  // A second human, not a floating primitive silhouette, is present in the
  // physical balcony and disappears when the player actually looks at it.
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.mechanics?.()?.boxFigure),{timeout:45000}).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.mechanics?.()?.boxVisible),{timeout:10000}).toBe(true);
  expect(await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.viewFigure?.())).toBe(true);
  await page.screenshot({path:testInfo.outputPath("07-figura-palco-1.png")});
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.mechanics?.()?.boxSeen),{timeout:20000}).toBe(true);
  // Genuine cinematic surprise: silence, an appearance physically behind the
  // player, then a reaction only when the camera turns toward the usher.
  expect(await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.forceWarning())).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.warningCues?.()),{timeout:12000}).toBeGreaterThan(0);
  expect(await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.advanceWarning())).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.warning?.().stage),{timeout:8000}).toBe("apparition");
  expect(await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.turnBehind())).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.warning?.().seen),{timeout:8000}).toBe(true);
  expect(await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.finishWarning())).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.warning?.().stage),{timeout:8000}).toBe("resolved");
  // The projector cannot start with only the numerical code:
  // the reel must be found, installed and the lens calibrated.
  await action(page,"proyector");await expectPhase(page,"proyector");
  await action(page,"bobina");await action(page,"montar");
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.mechanics?.()?.reelMounted)).toBe(true);
  await action(page,"enfoque");await action(page,"enfoque");
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.mechanics?.()?.focus)).toBe(2);
  expect(await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.viewMechanical?.())).toBe(true);
  await page.screenshot({path:testInfo.outputPath("08-maquina-enfoque-bobina.png")});
  // The cabinet now has three physical 3D number wheels, not a popup.
  // Tap the *actual rendered 3D number wheel* to test the mobile pointer raycast.
  const aimed=await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.aim?.("rueda1"));
  expect(aimed).toBe(true);
  await page.waitForTimeout(200);
  const canvas=page.locator(".three-canvas");
  await canvas.click({position:{x:(await canvas.boundingBox())!.width/2,y:(await canvas.boundingBox())!.height/2}});
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.wheels?.()[0])).toBe(1);
  for(const [index,turns] of [[1,2],[2,1],[3,7]]){
    for(let j=0;j<turns;j++)await action(page,"rueda"+index);
  }
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.wheels?.())).toEqual([3,1,7]);
  await action(page,"proyector");
  await expectPhase(page,"telon");
  await action(page,"telon");
  await expectPhase(page,"final");
  await expect(page.getByRole("heading",{name:/VOS ERAS/i})).toBeVisible({timeout:12000});
  await expect(page.locator(".invitation-ticket")).toContainText("Martina");
  await expect(page.locator(".invitation-ticket")).toContainText("Fiesta de cumpleaños");
  expect(errors).toEqual([]);
});
