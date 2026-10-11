import {test,expect} from "@playwright/test";
test("La Última Función abre, activa controles y muestra pistas",async({page},testInfo)=>{
  const failures:string[]=[];
  page.on("pageerror",e=>failures.push(e.message));
  await page.goto("/?nombre=Martina&evento=La%20fiesta%20de%20Martina&fecha=24%2F10%2F2026");
  await expect(page.getByRole("heading",{name:/LA ÚLTIMA.*FUNCIÓN/i})).toBeVisible();
  await expect(page.getByText("Martina",{exact:false})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath("01-entrada.png")});
  const entry=page.getByRole("button",{name:/ABRIR LAS PUERTAS/i});
  await expect(entry).toBeEnabled({timeout:12000});
  await entry.click();
  await expect(page.locator(".mission-title")).toContainText("La butaca reservada");
  await expect(page.locator(".three-canvas")).toBeVisible();
  await page.getByRole("button",{name:/UNA PISTA/i}).click();
  await expect(page.getByText(/FILA 3 · ASIENTO 8/)).toBeVisible();
  await page.getByRole("button",{name:/VOLVER A LA FUNCIÓN/i}).click();
  await page.screenshot({path:testInfo.outputPath("02-teatro.png")});
  expect(failures).toEqual([]);
});