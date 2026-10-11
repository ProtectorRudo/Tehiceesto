import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
  testDir:"./tests",timeout:160000,retries:1,workers:process.env.CI?1:undefined,reporter:"list",
  use:{baseURL:"http://127.0.0.1:4173",trace:"retain-on-failure",screenshot:"only-on-failure"},
  projects:[
    {name:"Android vertical",use:{...devices["Pixel 7"],browserName:"chromium",launchOptions:{args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}}},
    {name:"Desktop",use:{...devices["Desktop Chrome"],launchOptions:{args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}}}
  ],
  webServer:{command:"npm run dev -- --host 127.0.0.1 --port 4173",url:"http://127.0.0.1:4173",reuseExistingServer:!process.env.CI,timeout:120000}
});