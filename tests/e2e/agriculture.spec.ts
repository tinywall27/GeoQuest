/// <reference lib="dom" />
import {readFile} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import {test,expect,type Page} from '@playwright/test';
const go=async(p:Page,s:string)=>p.getByRole('navigation',{name:'农业探究步骤'}).getByRole('button',{name:new RegExp(s)}).click();
async function baseline(p:Page){await go(p,'雨热对照');await p.getByRole('button',{name:'原时序',exact:true}).click();await p.getByRole('button',{name:'记录整季结果',exact:true}).click();await p.getByRole('button',{name:'晚到 20 天',exact:true}).click();await p.getByRole('button',{name:'记录整季结果',exact:true}).click();}
test('农业完整课堂：同雨量早期缺口、晚播取舍与真实导出',async({page})=>{
 await page.goto('/topics/south-asia-monsoon?mode=classroom');await page.getByRole('button',{name:'总雨量相同，幼苗期也相同',exact:true}).click();await baseline(page);
 await expect(page.locator('.farm-readings')).toContainText('20.0 mm');await expect(page.locator('.farm-readings')).toContainText('74.0 mm');
 await go(page,'方案取舍');await page.getByLabel('播种日',{exact:true}).selectOption('40');await expect(page.locator('.farm-readings')).toContainText('10 天');await page.getByRole('button',{name:'记录整季结果',exact:true}).click();
 await go(page,'证据解释');await page.getByRole('button',{name:'显示讨论参考',exact:true}).click();await expect(page.locator('.farm-answer')).toContainText('0.0 变为 20.0 mm');
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:/导出实验记录/}).click();const path=await(await dl).path();const data=JSON.parse(await readFile(path!,'utf8')) as {records:{days:unknown[];coldDays:number;rain:number;input:{sow:number}}[]};
 expect(data.records).toHaveLength(3);expect(data.records[2].days).toHaveLength(180);expect(data.records[2].coldDays).toBe(10);expect(data.records[0].rain).toBeCloseTo(320);expect(data.records[2].input.sow).toBe(40);
 await page.getByRole('link',{name:'退出课堂',exact:true}).click();await expect(page.getByRole('table')).toContainText('40');await page.getByRole('button',{name:'移除 20:40:maize:0 记录',exact:true}).click();await expect(page.getByRole('button',{name:'显示讨论参考',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'重置实验',exact:true}).click();await go(page,'证据解释');await expect(page.getByRole('table')).toHaveCount(0);
});
test('农业单变量证据门槛、有限补灌与时段独立',async({page})=>{
 await page.goto('/topics/south-asia-monsoon');await baseline(page);await go(page,'方案取舍');await page.getByLabel('播种日',{exact:true}).selectOption('40');await page.getByLabel('补灌总量',{exact:true}).selectOption('60');await page.getByRole('button',{name:'记录整季结果',exact:true}).click();await go(page,'证据解释');await expect(page.getByRole('button',{name:'显示讨论参考',exact:true})).toBeDisabled();
 await go(page,'方案取舍');await page.getByLabel('补灌总量',{exact:true}).selectOption('60');await expect(page.locator('.farm-readings')).toContainText('14.0 mm');await expect(page.locator('.farm-readings')).toContainText('60.0 / 60 mm');const old=await page.locator('.farm-readings').innerText();await page.getByRole('button',{name:'第 130–139 天',exact:true}).click();expect(await page.locator('.farm-readings').innerText()).toBe(old);await page.getByRole('button',{name:'记录整季结果',exact:true}).click();await go(page,'雨热对照');await expect(page.locator('.farm-readings')).toContainText('0.0 / 0 mm');await go(page,'证据解释');await expect(page.getByRole('button',{name:'显示讨论参考',exact:true})).toBeEnabled();
});
test('农业四环节可访问、手机无横向溢出',async({page})=>{
 await page.goto('/topics/south-asia-monsoon?mode=classroom');for(const s of ['提出预测','雨热对照','方案取舍','证据解释']){await go(page,s);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
test('农业断网、无WebGL与键盘操作',async({page,context})=>{
 await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=(()=>null) as typeof HTMLCanvasElement.prototype.getContext;});
 const external:string[]=[];page.on('request',r=>{if(new URL(r.url()).hostname!=='127.0.0.1')external.push(r.url());});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/topics/south-asia-monsoon');await go(page,'雨热对照');await context.setOffline(true);await page.getByRole('slider',{name:'观察时段'}).press('ArrowRight');await expect(page.getByText('查看第 40–49 天', {exact:false})).toBeVisible();await page.getByRole('button',{name:'原时序',exact:true}).click();await page.getByRole('button',{name:'记录整季结果',exact:true}).click();expect(external).toEqual([]);expect(await context.cookies()).toEqual([]);
});
test('农业1366投影：图表与记录按钮同屏',async({page,isMobile})=>{test.skip(isMobile,'投影仅桌面');await page.setViewportSize({width:1366,height:768});await page.goto('/topics/south-asia-monsoon?mode=classroom');await go(page,'方案取舍');const rect=await page.getByRole('button',{name:'记录整季结果',exact:true}).boundingBox();expect(rect!.y+rect!.height).toBeLessThanOrEqual(768);await page.getByRole('button',{name:'切换全屏',exact:true}).click();await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);await page.getByRole('button',{name:'切换全屏',exact:true}).click();});
