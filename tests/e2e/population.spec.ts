/// <reference lib="dom" />
import {readFile} from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import {expect,test,type Page} from "@playwright/test";

const go=(page:Page,name:string)=>page.getByRole("navigation",{name:"人口探究步骤"}).getByRole("button",{name:new RegExp(name)}).click();
const chooseCountry=(page:Page,name:string)=>page.locator(".population-density-cell").filter({hasText:name}).click();

test("population records density, weighted scale evidence, and exports actual records",async({page})=>{
  await page.goto("/topics/world-population-map");
  await expect(page.getByRole("heading",{name:"人口与区域",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"面积也要一起比较",exact:true}).click();
  await expect(page.getByRole("button",{name:"面积也要一起比较",exact:true})).toHaveAttribute("aria-pressed","true");
  await go(page,"总量与密度");
  await chooseCountry(page,"澳大利亚");
  await page.getByRole("button",{name:"记录该国数据",exact:true}).click();
  await chooseCountry(page,"孟加拉国");
  await page.getByRole("button",{name:"记录该国数据",exact:true}).click();
  await expect(page.locator(".population-reading-grid")).toContainText("1,319.2");
  await go(page,"尺度比较");
  await expect(page.getByRole("combobox",{name:"合并实验第一个国家"})).toHaveValue("AUS");
  await expect(page.getByRole("combobox",{name:"合并实验第二个国家"})).toHaveValue("BGD");
  await expect(page.locator(".population-combination-readings")).toContainText("25.3");
  await expect(page.locator(".population-combination-readings")).toContainText("661.3");
  await page.getByRole("button",{name:"记录这组尺度实验",exact:true}).click();
  await go(page,"证据解释");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(4);
  await page.getByRole("button",{name:"显示讨论参考",exact:true}).click();
  await expect(page.locator(".population-answer")).toContainText(/不能说明.*均匀/);
  await expect(page.locator(".population-answer")).toContainText("相关不等于因果");
  const downloadEvent=page.waitForEvent("download");
  await page.getByRole("button",{name:"导出 JSON ↓",exact:true}).click();
  const download=await downloadEvent;
  const data=JSON.parse(await readFile((await download.path())!,"utf8")) as {prediction:string;countryRecords:unknown[];pairRecords:{weightedDensityPerKm2:number;simpleAverageDensityPerKm2:number}[]};
  expect(data.prediction).toBe("面积也要一起比较");
  expect(data.countryRecords).toHaveLength(2);
  expect(data.pairRecords).toHaveLength(1);
  expect(data.pairRecords[0]!.weightedDensityPerKm2).toBeCloseTo(25.33,1);
  expect(data.pairRecords[0]!.simpleAverageDensityPerKm2).toBeCloseTo(661.32,1);
  await page.getByRole("link",{name:"课堂展示",exact:true}).click();
  await expect(page).toHaveURL(/mode=classroom/);
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(4);
  await page.getByRole("button",{name:"移除 澳大利亚与孟加拉国尺度记录",exact:true}).click();
  await expect(page.getByRole("button",{name:"显示讨论参考",exact:true})).toBeDisabled();
  await page.getByRole("button",{name:"重置实验",exact:true}).click();
  await expect(page.getByRole("button",{name:"面积也要一起比较",exact:true})).toHaveAttribute("aria-pressed","false");
  await go(page,"证据解释");
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("population blocks duplicate combinations and remains offline without WebGL",async({page,context})=>{
  const requests:string[]=[];
  page.on("request",request=>{if(new URL(request.url()).hostname!=="127.0.0.1")requests.push(request.url());});
  await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=(()=>null) as typeof HTMLCanvasElement.prototype.getContext;});
  await page.goto("/topics/world-population-map?mode=classroom");
  await go(page,"尺度比较");
  await expect(page.getByRole("combobox",{name:"合并实验第二个国家"}).getByRole("option",{name:"澳大利亚"})).toHaveAttribute("disabled", "");
  await page.getByRole("combobox",{name:"合并实验第一个国家"}).selectOption("BGD");
  await expect(page.getByRole("combobox",{name:"合并实验第二个国家"})).toHaveValue("AUS");
  await expect(page.getByRole("button",{name:"记录这组尺度实验",exact:true})).toBeEnabled();
  await context.setOffline(true);
  await go(page,"证据解释");
  expect(requests).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("population stages are accessible and have no horizontal overflow",async({page})=>{
  await page.goto("/topics/world-population-map?mode=classroom");
  for(const stage of ["提出预测","总量与密度","尺度比较","证据解释"]){
    await go(page,stage);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  }
});

test("population classroom board fits projection and toggles fullscreen",async({page,isMobile})=>{
  test.skip(isMobile,"Projection and fullscreen are desktop-specific");
  await page.setViewportSize({width:1366,height:768});
  await page.goto("/topics/world-population-map?mode=classroom");
  for(const stage of ["总量与密度","尺度比较"]){
    await go(page,stage);
    const board=await page.locator(".population-board").boundingBox();
    expect(board!.y+board!.height).toBeLessThanOrEqual(768);
  }
  await page.getByRole("button",{name:"全屏投影",exact:true}).click();
  await expect(page.getByRole("button",{name:"退出全屏",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"退出全屏",exact:true}).click();
});

test("population metric ranking, matched evidence and transfer question",async({page})=>{
 await page.goto('/topics/world-population-map?mode=classroom');await expect(page.locator('.population-density-grid')).not.toContainText('km²');await go(page,'总量与密度');await page.getByRole('button',{name:'人口密度',exact:true}).click();await expect(page.locator('.population-ranking-list li').nth(1)).toContainText('荷兰');await page.getByRole('button',{name:'人口总量',exact:true}).click();await expect(page.locator('.population-ranking-list li').nth(1)).toContainText('日本');
 await chooseCountry(page,'澳大利亚');await page.getByRole('button',{name:'记录该国数据',exact:true}).click();await chooseCountry(page,'荷兰');await page.getByRole('button',{name:'记录该国数据',exact:true}).click();await go(page,'尺度比较');await page.getByRole('button',{name:'记录这组尺度实验',exact:true}).click();await go(page,'证据解释');await expect(page.getByRole('button',{name:'显示讨论参考',exact:true})).toBeDisabled();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'只看国家平均密度就够了',exact:true}).click();await expect(page.locator('.population-transfer')).toContainText('不能定位内部聚集区');await page.getByRole('button',{name:'更细尺度的人口分布资料',exact:true}).click();await expect(page.locator('.population-transfer')).toContainText('自然、历史与经济证据');
});
