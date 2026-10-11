import {test,expect} from "@playwright/test";
test("La Última Función abre, activa controles y muestra pistas",async({page},testInfo)=>{
  test.setTimeout(160000);
  const failures:string[]=[];
  page.on("pageerror",e=>failures.push(e.message));
  await page.goto("/?nombre=Martina&evento=La%20fiesta%20de%20Martina&fecha=24%2F10%2F2026");
  await expect(page.getByRole("heading",{name:/LA ÚLTIMA.*FUNCIÓN/i})).toBeVisible();
  await expect(page.getByText("Martina",{exact:false})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath("01-entrada.png")});
  const entry=page.getByRole("button",{name:/ABRIR LAS PUERTAS/i});
  await expect(entry).toBeEnabled({timeout:12000});
  await entry.click();
  // The theatrical letter is mandatory. Time must NOT run while reading.
  const letter=page.getByRole("dialog",{name:/La función que nunca terminó/i});
  await expect(letter).toBeVisible();
  await expect(letter).toContainText("Ochenta y tres espectadores desaparecieron");
  await expect(letter).toContainText("FILA 3");
  await expect(letter).toContainText("ASIENTO 8");
  await expect(page.locator(".mission-title")).toHaveCount(0);
  await page.waitForTimeout(900);
  await expect(page.locator(".timer")).toHaveCount(0);
  await page.screenshot({path:testInfo.outputPath("01b-carta-mision.png")});
  await letter.getByRole("button",{name:/ENTENDÍ MI MISIÓN/i}).click();
  await expect(page.locator(".mission-title")).toContainText("La butaca reservada");
  await expect(page.locator(".mission-objective")).toContainText("fila 3, asiento 8");
  await page.getByRole("button",{name:/VER MI MISIÓN/i}).click();
  const reminder=page.getByRole("dialog",{name:/La función que nunca terminó/i});
  await expect(reminder).toBeVisible();
  await reminder.getByRole("button",{name:/VOLVER AL TEATRO/i}).click();
  await expect(reminder).toHaveCount(0);
  await expect(page.locator(".three-canvas")).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>(window as any).__BELLADONNA_QA__?.seatNumbers?.()),{timeout:10000})
    .toMatchObject({rows:8,perRow:10,numbered:80,digits:10,target:"FILA 3 · ASIENTO 8"});
  await page.getByRole("button",{name:/UNA PISTA/i}).click();
  await expect(page.getByText(/Las filas están señalizadas junto al pasillo central/)).toBeVisible();
  await page.getByRole("button",{name:/VOLVER A LA FUNCIÓN/i}).click();
  await page.screenshot({path:testInfo.outputPath("02-teatro.png")});
  expect(failures).toEqual([]);
});