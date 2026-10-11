import {test,expect} from "@playwright/test";

type QA={action:(a:string)=>void;getPhase:()=>string};
const action=async(page:import("@playwright/test").Page,target:string)=>{
  await page.evaluate((name)=>{const q=(window as any).__BELLADONNA_QA__ as QA;q.action(name);},target);
};
const expectPhase=async(page:import("@playwright/test").Page,p:string)=>{
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.getPhase?.())).toBe(p);
};
test("recorrido completo: butaca, iluminación, proyector y gran revelación",async({page})=>{
  test.setTimeout(160000); // Real models and full playthrough in software-rendered browser.
  const errors:string[]=[];page.on("pageerror",err=>errors.push(err.message));
  await page.goto("/?nombre=Martina&evento=Fiesta%20de%20cumplea%C3%B1os&fecha=24%2F10%2F2026&hora=21%3A00&lugar=Sal%C3%B3n%20Belladonna");
  await page.getByRole("button",{name:/ABRIR LAS PUERTAS/}).click();
  await expectPhase(page,"inicio");
  // No basta con que compile: el humano skinned debe cargar y disponer de ambas animaciones.
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.character?.()),{timeout:45000}).toEqual({
    human:true,idle:true,walk:true
  });
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.cinema?.()),{timeout:60000}).toMatchObject({
    projectorModel:true,director:true,velvetPBR:true,act:"inicio"
  });
  await action(page,"butaca");await expectPhase(page,"luces");
  // La secuencia errónea debe bloquear la progresión.
  await action(page,"azul");await expectPhase(page,"luces");
  for(const a of ["ambar","azul","rojo"])await action(page,a);
  await expectPhase(page,"proyector");
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.cinema?.()?.act)).toBe("proyector");
  // Genuine cinematic surprise: silence, an appearance physically behind the
  // player, then a reaction only when the camera turns toward the usher.
  expect(await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.forceWarning())).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.warningCues?.()),{timeout:12000}).toBeGreaterThan(0);
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.warning?.().stage),{timeout:15000}).toBe("apparition");
  expect(await page.evaluate(()=>(window as any).__BELLADONNA_QA__?.turnBehind())).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.warning?.().seen),{timeout:8000}).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.warning?.().stage),{timeout:12000}).toBe("resolved");
  // The cabinet now has three physical 3D number wheels, not a popup.
  await action(page,"proyector");
  await expectPhase(page,"proyector");
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
