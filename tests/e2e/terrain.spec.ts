/// <reference lib="dom" />
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const measure = /测量取证/;
const explain = /解释迁移/;
const read = /读懂山形/;

test("terrain lesson keeps prediction, gates discussion on evidence and uses one profile scale", async ({page}) => {
  await page.goto("/topics/contour-rescue");
  await expect(page.locator('canvas[data-terrain="ready"]')).toBeVisible();
  await expect(page.getByRole("heading", {name:"把等高线，读成一座山。"})).toBeVisible();
  await expect(page.locator(".terrain-numbers")).toHaveCount(0);
  await expect(page.getByText("显示讨论参考",{exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"预测 C 线最大坡度较小"}).click();
  await page.getByRole("button",{name:read}).click();
  await page.getByLabel("等高距",{exact:true}).selectOption("50");
  await expect(page.getByRole("img", {name:/等高距50米/})).toBeVisible();
  await page.getByRole("button",{name:measure}).click();
  await expect(page.getByText("当前路线 · 原预测 C")).toBeVisible();
  await page.getByRole("button", {name:"C 折返线",exact:true}).click();
  await page.getByRole("button",{name:"定位最陡段"}).click();
  await expect(page.getByRole("slider",{name:"沿路线观察"})).not.toHaveValue("0");
  await page.getByRole("slider", {name:"沿路线观察"}).press("End");
  await expect(page.getByText("100%",{exact:true})).toBeVisible();
  const value = await page.locator(".terrain-numbers").innerText();
  await page.getByRole("button",{name:read}).click();
  await page.getByLabel("垂直夸张",{exact:true}).selectOption("2");
  await page.getByRole("button",{name:measure}).click();
  expect(await page.locator(".terrain-numbers").innerText()).toBe(value);
  await page.getByRole("button",{name:"＋ 记入证据"}).click();
  await expect(page.getByRole("button",{name:measure})).toHaveAttribute("aria-current","step");
  await page.getByRole("button",{name:explain}).click();
  await expect(page.getByRole("button",{name:"显示讨论参考"})).toBeDisabled();
  await expect(page.getByRole("table",{name:"已记录路线"})).toContainText("5.45");
  await page.getByRole("button",{name:"B 直达线",exact:true}).click();
  await page.getByRole("button",{name:"＋ 记入证据"}).click();
  await page.getByRole("button",{name:"显示讨论参考"}).click();
  await expect(page.locator(".terrain-answer")).toContainText("不能用这几米就断言");
  // Read rendered SVG endpoints: B must finish at 2.91 km, not at C's 5.45 km.
  const x = async (id:string) => {
    const d=await page.locator(`[data-profile-route="${id}"] path`).getAttribute("d");
    return Number(d!.split("L").at(-1)!.split(",")[0]);
  };
  expect(((await x("B"))-45)/((await x("C"))-45)).toBeCloseTo(2.912472/5.45,3);
  await page.getByRole("button",{name:"表示更细了，山没有变",exact:true}).click();
  await expect(page.getByText("对。比较陡缓前，先确认比例尺与等高距相同。")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button",{name:"导出证据 CSV ↓"}).click();
  expect((await download).suggestedFilename()).toBe("GeoQuest-路线证据.csv");
  await page.getByRole("button",{name:"移除 B 线证据"}).click();
  await expect(page.locator(".terrain-answer")).toHaveCount(0);
  await expect(page.getByRole("button",{name:"显示讨论参考"})).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.getByRole("button",{name:"重置实验"}).click();
  await expect(page.getByRole("button",{name:/提出预测/})).toHaveAttribute("aria-current","step");
  await expect(page.getByRole("button",{name:"预测 C 线最大坡度较小"})).toHaveAttribute("aria-pressed","false");
  await page.getByRole("button",{name:explain}).click();
  await expect(page.getByText("我的路线证据")).toContainText("0 / 3");
});

test("terrain classroom works after disconnecting and never requests third parties", async ({page,context}) => {
  const requests:string[]=[];
  page.on("request",r=>{if(new URL(r.url()).hostname!=="127.0.0.1")requests.push(r.url());});
  await page.goto("/topics/contour-rescue?mode=classroom");
  await expect(page.locator('canvas[data-terrain="ready"]')).toBeVisible();
  await expect(page.getByRole("link",{name:"退出课堂"})).toBeVisible();
  await page.getByRole("button",{name:read}).click();
  await page.getByRole("checkbox",{name:/显示水平切片/}).check();
  await page.getByRole("slider",{name:"切片高度"}).press("End");
  await expect(page.getByText("1000 m",{exact:true})).toBeVisible();
  await context.setOffline(true);
  await page.getByRole("button",{name:measure}).click();
  await page.getByRole("button",{name:"A 西侧登山线",exact:true}).click();
  await expect(page.getByRole("heading",{name:"A 线 · 沿途高程"})).toBeVisible();
  await page.getByRole("button",{name:"俯视",exact:true}).click();
  await expect(page.getByRole("button",{name:"俯视",exact:true})).toHaveAttribute("aria-pressed","true");
  expect(requests).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

test("terrain retains 2D controls without WebGL", async ({page}) => {
  await page.addInitScript(()=>{
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){
      if(type==="webgl2" || type==="webgl")return null;
      return Reflect.apply(original,this,[type,...args]) as RenderingContext | null;
    } as typeof original;
  });
  await page.goto("/topics/contour-rescue");
  await expect(page.getByText("当前设备无法显示三维视图")).toBeVisible();
  await page.getByRole("button",{name:measure}).click();
  await page.getByRole("button",{name:"C 折返线",exact:true}).click();
  await expect(page.getByRole("heading",{name:"C 线 · 沿途高程"})).toBeVisible();
});

test("terrain classroom board fits projection, resets a dragged camera and preserves mode state", async ({page,isMobile}) => {
  test.skip(isMobile,"Projection layout and mouse camera are desktop-specific");
  await page.setViewportSize({width:1366,height:768});
  await page.goto("/topics/contour-rescue?mode=classroom");
  await expect(page.locator('canvas[data-terrain="ready"]')).toBeVisible();
  await page.getByRole("button",{name:measure}).click();
  const board=await page.locator(".terrain-evidence").boundingBox();
  expect(board!.y+board!.height).toBeLessThanOrEqual(768);
  const canvas=page.locator('canvas[data-terrain="ready"]');
  const initial=await canvas.screenshot();
  const box=await canvas.boundingBox();
  await page.mouse.move(box!.x+box!.width*.45,box!.y+box!.height*.45);
  await page.mouse.down();await page.mouse.move(box!.x+box!.width*.7,box!.y+box!.height*.6,{steps:8});await page.mouse.up();
  expect((await canvas.screenshot()).equals(initial)).toBe(false);
  await page.getByRole("button",{name:"复位视角"}).click();
  expect((await canvas.screenshot()).equals(initial)).toBe(true);
  await page.getByRole("button",{name:"＋ 记入证据"}).click();
  const recordedBoard=await page.locator(".terrain-evidence").boundingBox();
  expect(recordedBoard!.y+recordedBoard!.height).toBeLessThanOrEqual(768);
  await page.getByRole("link",{name:"退出课堂"}).click();
  await expect(page.getByRole("button",{name:measure})).toHaveAttribute("aria-current","step");
  await expect(page.getByText("已记录 1 / 3 · 请对照 B、C")).toBeVisible();
  await page.getByRole("button",{name:"全屏投影"}).click();
  await expect(page.getByRole("button",{name:"退出全屏"})).toBeVisible();
  await page.getByRole("button",{name:"退出全屏"}).click();
});

test("terrain has accessible controls and no horizontal overflow in every lesson stage", async ({page}) => {
  await page.goto("/topics/contour-rescue?mode=classroom");
  await expect(page.locator('canvas[data-terrain="ready"]')).toBeVisible();
  for(const name of [/提出预测/,read,measure,explain]) {
    await page.getByRole("button",{name}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  }
});
