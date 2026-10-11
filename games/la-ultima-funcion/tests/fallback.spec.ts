import {test,expect} from "@playwright/test";
test("si el teléfono no soporta WebGL2 la invitación sigue siendo accesible",async({page})=>{
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(...args:any[]){
      if(String(args[0]).startsWith("webgl")||String(args[0])==="experimental-webgl")return null;
      return original.apply(this,args as any);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/?nombre=Valentina&evento=Cumplea%C3%B1os%20de%20Valentina");
  await expect(page.getByRole("button",{name:/VER MI INVITACIÓN SIN 3D/})).toBeVisible();
  await page.getByRole("button",{name:/VER MI INVITACIÓN SIN 3D/}).click();
  await expect(page.locator(".invitation-ticket")).toContainText("Valentina");
  await expect(page.locator(".invitation-ticket")).toContainText("Cumpleaños de Valentina");
});
