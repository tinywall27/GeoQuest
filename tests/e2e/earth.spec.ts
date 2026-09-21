/// <reference lib="dom" />
import {readFile} from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import {expect,test,type Page} from "@playwright/test";
const go=(page:Page,name:string)=>page.getByRole("navigation",{name:"地球探究步骤"}).getByRole("button",{name:new RegExp(name)}).click();
const record=(page:Page)=>page.getByRole("button",{name:"记录此情景",exact:true}).click();

test("earth lesson joins observed day-night changes to four controlled seasonal records",async({page})=>{
  await page.goto("/topics/earth-motion-lab");
  await expect(page.getByRole("heading",{name:"地球与太阳",exact:true})).toBeVisible();
  const canvas=page.locator('canvas[data-earth="ready"]');await expect(canvas).toBeVisible();
  await expect(page.locator(".earth-sun-reading")).toHaveCount(0);
  await page.getByRole("button",{name:"地球自转",exact:true}).click();await go(page,"跟随一天");
  await expect(page.locator(".earth-current")).toContainText("白昼");
  await page.getByRole("button",{name:"记录这个时刻",exact:true}).click();
  const before=await canvas.screenshot();
  await page.getByRole("button",{name:"00:00",exact:true}).click();
  await expect(canvas).toHaveAttribute("data-light","黑夜");
  await expect(page.locator(".earth-current")).toContainText("-50.0");
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  await page.getByRole("button",{name:"跟随 P 点",exact:true}).click();
  await page.getByRole("button",{name:"记录这个时刻",exact:true}).click();
  await expect(page.getByRole("button",{name:"移除 12:00 白昼记录"})).toBeVisible();
  await page.getByRole("button",{name:"06:00",exact:true}).click();await expect(canvas).toHaveAttribute("data-light","晨昏交界");
  await go(page,"比较一年");await record(page);
  await expect(page.getByRole("navigation",{name:"地球探究步骤"}).getByRole("button",{name:/比较一年/})).toHaveAttribute("aria-current","step");
  await page.getByRole("button",{name:"十二月至日",exact:true}).click();await record(page);
  await page.getByRole("button",{name:"0° 对照实验",exact:true}).click();
  await expect(page.getByRole("img",{name:"北纬 40°理论昼长12.0小时，夜长12.0小时"})).toBeVisible();await record(page);
  await page.getByRole("button",{name:"六月至日",exact:true}).click();await record(page);
  await go(page,"证据解释");
  await expect(page.getByRole("table")).toContainText("14.8");await expect(page.getByRole("table")).toContainText("9.2");
  await page.getByRole("button",{name:"显示讨论参考",exact:true}).click();
  await expect(page.locator(".earth-answer")).toContainText("两次昼长都为 12.0 h");
  await page.getByRole("button",{name:"较短，两半球变化相反",exact:true}).click();
  await expect(page.getByText("对。请再从证据表找出一对数字支持解释。")).toBeVisible();
  const event=page.waitForEvent("download");await page.getByRole("button",{name:"导出实验记录 JSON ↓"}).click();
  const download=await event;expect(download.suggestedFilename()).toBe("GeoQuest-地球与太阳-实验记录.json");
  const data=JSON.parse(await readFile((await download.path())!,"utf8")) as {dayObservations:unknown[];seasonObservations:unknown[];prediction:string};
  expect(data.dayObservations).toHaveLength(2);expect(data.seasonObservations).toHaveLength(4);expect(data.prediction).toBe("地球自转");
  await page.getByRole("button",{name:"移除 十二月至日 23.4度 40纬度记录"}).click();
  await expect(page.locator(".earth-answer")).toHaveCount(0);await expect(page.getByRole("button",{name:"显示讨论参考",exact:true})).toBeDisabled();
  await page.getByRole("link",{name:"课堂展示",exact:true}).click();await expect(page).toHaveURL(/mode=classroom/);await expect(page.getByRole("table").getByRole("row")).toHaveCount(4);
  await page.getByRole("button",{name:"重置实验",exact:true}).click();await go(page,"证据解释");await expect(page.getByRole("table")).toHaveCount(0);
});

test("earth keeps polar night signed, zero tilt neutral and mismatched evidence separate",async({page})=>{
  await page.goto("/topics/earth-motion-lab?mode=classroom");await go(page,"比较一年");await record(page);
  await page.getByRole("combobox",{name:"南北对照纬度"}).selectOption("80");await page.getByRole("button",{name:"十二月至日",exact:true}).click();
  await expect(page.locator(".earth-sun-reading")).toContainText("-13.4");
  await expect(page.getByRole("img",{name:"北纬 80°理论昼长0.0小时，夜长24.0小时"})).toBeVisible();
  await expect(page.getByRole("img",{name:"南纬 80°理论昼长24.0小时，夜长0.0小时"})).toBeVisible();
  await record(page);await go(page,"证据解释");await expect(page.getByRole("button",{name:"显示讨论参考",exact:true})).toBeDisabled();
  await go(page,"比较一年");await page.getByRole("button",{name:"0° 对照实验",exact:true}).click();
  await expect(page.getByRole("img",{name:"北纬 80°理论昼长12.0小时，夜长12.0小时"})).toBeVisible();
  await page.getByRole("slider",{name:"公转位置",exact:true}).press("End");await record(page);await go(page,"证据解释");await expect(page.getByRole("table")).toContainText("三月分点");
});

test("earth works offline without third-party requests and respects reduced motion",async({page,context})=>{
  const requests:string[]=[];page.on("request",r=>{if(new URL(r.url()).hostname!=="127.0.0.1")requests.push(r.url());});
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/topics/earth-motion-lab?mode=classroom");await expect(page.locator('canvas[data-earth="ready"]')).toBeVisible();await context.setOffline(true);
  await go(page,"跟随一天");await expect(page.getByRole("button",{name:"播放自转",exact:true})).toBeDisabled();await page.getByRole("slider",{name:"地方太阳时",exact:true}).press("Home");await expect(page.locator(".earth-current")).toContainText("黑夜");
  await go(page,"比较一年");await page.getByRole("button",{name:"0° 对照实验",exact:true}).click();await record(page);
  expect(requests).toEqual([]);expect(await context.cookies()).toEqual([]);
});

test("earth retains diagrams and all evidence without WebGL",async({page})=>{
  await page.addInitScript(()=>{
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const native=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){return type==="webgl"||type==="webgl2"?null:Reflect.apply(native,this,[type,...args]) as RenderingContext|null;} as typeof native;
  });
  await page.goto("/topics/earth-motion-lab");await expect(page.getByText("当前设备无法显示三维地球")).toBeVisible();
  await go(page,"跟随一天");await page.getByRole("button",{name:"00:00",exact:true}).click();await expect(page.getByRole("img",{name:/太阳高度曲线/})).toBeVisible();
  await go(page,"比较一年");await record(page);await page.getByRole("button",{name:"十二月至日",exact:true}).click();await record(page);await go(page,"证据解释");await expect(page.getByRole("table")).toContainText("9.2");
});

test("earth controls and lesson stages stay accessible on desktop and mobile",async({page})=>{
  await page.goto("/topics/earth-motion-lab?mode=classroom");await expect(page.locator('canvas[data-earth="ready"]')).toBeVisible();
  for(const step of ["提出预测","跟随一天","比较一年","证据解释"]){await go(page,step);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);}
});

test("earth projection shows its controls, animates only on request and restores the camera",async({page,isMobile})=>{
  test.skip(isMobile,"Projection, fullscreen and mouse camera are desktop-specific");
  await page.setViewportSize({width:1366,height:768});await page.goto("/topics/earth-motion-lab?mode=classroom");const canvas=page.locator('canvas[data-earth="ready"]');await expect(canvas).toBeVisible();
  await go(page,"跟随一天");const board=await page.locator(".earth-board").boundingBox();expect(board!.y+board!.height).toBeLessThanOrEqual(768);
  const hour=page.getByRole("slider",{name:"地方太阳时",exact:true});await expect(hour).toHaveValue("12");await page.getByRole("button",{name:"播放自转",exact:true}).click();await expect(hour).not.toHaveValue("12");await page.getByRole("button",{name:"暂停自转",exact:true}).click();await expect(page.getByRole("button",{name:"播放自转",exact:true})).toHaveAttribute("aria-pressed","false");
  await go(page,"比较一年");const second=await page.locator(".earth-board").boundingBox();expect(second!.y+second!.height).toBeLessThanOrEqual(768);
  const image=await canvas.screenshot(),box=await canvas.boundingBox();await page.mouse.move(box!.x+box!.width*.5,box!.y+box!.height*.45);await page.mouse.down();await page.mouse.move(box!.x+box!.width*.7,box!.y+box!.height*.65,{steps:8});await page.mouse.up();expect((await canvas.screenshot()).equals(image)).toBe(false);
  await page.getByRole("button",{name:"复位视角",exact:true}).click();expect((await canvas.screenshot()).equals(image)).toBe(true);
  await page.getByRole("button",{name:"全屏投影",exact:true}).click();await expect(page.getByRole("button",{name:"退出全屏",exact:true})).toBeVisible();await page.getByRole("button",{name:"退出全屏",exact:true}).click();
});
