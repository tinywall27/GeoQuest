/// <reference lib="dom" />
import {readFile} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import {test,expect,type Page} from '@playwright/test';
const go=(p:Page,n:string)=>p.getByRole('navigation',{name:'水土探究步骤'}).getByRole('button',{name:new RegExp(n)}).click();
const record=(p:Page)=>p.getByRole('button',{name:'记录整场结果',exact:true}).click();
test('water classroom connects slope comparison to storage evidence and exports actual records',async({page})=>{
 await page.goto('/topics/loess-soil-water');await expect(page.getByRole('heading',{name:'水土与流域',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'仍会产流，但分配改变',exact:true}).click();await go(page,'坡面对照');
 await expect(page.getByRole('img',{name:/A 坡，植被覆盖20%/})).toBeVisible();await expect(page.locator('.water-event')).toContainText('20,400');await record(page);
 await page.getByRole('button',{name:'80% B 坡',exact:true}).click();await expect(page.locator('.water-event')).toContainText('12,400');await record(page);
 await go(page,'证据解释');await expect(page.getByRole('button',{name:'显示讨论参考',exact:true})).toBeDisabled();
 await go(page,'流域调蓄');await expect(page.getByRole('button',{name:'80%',exact:true})).toHaveAttribute('aria-pressed','true');
 const figure=page.getByRole('img',{name:/虚构流域示意/}),before=await figure.screenshot();
 await page.getByRole('button',{name:'120 分',exact:true}).click();await expect(figure).toHaveAttribute('aria-label',/入流0.00、出流0.83/);expect((await figure.screenshot()).equals(before)).toBe(false);
 await page.getByRole('button',{name:'8 小时',exact:true}).click();await expect(page.getByRole('img',{name:/下游流量过程/})).toHaveAttribute('aria-label',/横轴0至480分钟/);await page.getByRole('button',{name:'前 2 小时',exact:true}).click();await expect(page.getByRole('slider',{name:'观察时间'})).toHaveValue('12');await expect(page.getByRole('img',{name:/下游流量过程/})).toHaveAttribute('aria-label',/横轴0至120分钟/);
 await expect(page.locator('.water-readings')).toContainText('12,400');await expect(page.locator('.water-readings')).toContainText('2,750');await record(page);
 await go(page,'证据解释');await page.getByRole('button',{name:'显示讨论参考',exact:true}).click();await expect(page.locator('.water-answer')).toContainText('暂存的水没有消失');
 const event=page.waitForEvent('download');await page.getByRole('button',{name:'导出实验记录 JSON ↓'}).click();const dl=await event;
 const data=JSON.parse(await readFile((await dl.path())!,'utf8')) as {prediction:string;records:{runoff:number;discharged:number;storage:number;frames:unknown[]}[]};
 expect(data.prediction).toBe('仍会产流，但分配改变');expect(data.records).toHaveLength(3);for(const r of data.records){expect(r.frames).toHaveLength(49);expect(r.runoff).toBeCloseTo(r.discharged+r.storage,6);}
 await page.getByRole('link',{name:'课堂展示',exact:true}).click();await expect(page.getByRole('table').getByRole('row')).toHaveCount(4);
 await page.getByRole('button',{name:'移除 30:80:12000 记录'}).click();await expect(page.locator('.water-answer')).toHaveCount(0);await expect(page.getByRole('button',{name:'显示讨论参考',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'重置实验',exact:true}).click();await expect(page.getByRole('button',{name:'仍会产流，但分配改变',exact:true})).toHaveAttribute('aria-pressed','false');await go(page,'证据解释');await expect(page.getByRole('table')).toHaveCount(0);
});
test('water exposes finite capacity overflow and rejects confounded comparisons',async({page})=>{
 await page.goto('/topics/loess-soil-water?mode=classroom');await go(page,'坡面对照');await record(page);
 await page.getByRole('combobox',{name:'总雨量'}).selectOption('60');await page.getByRole('button',{name:'80% B 坡',exact:true}).click();await record(page);
 await go(page,'证据解释');await expect(page.getByRole('button',{name:'显示讨论参考',exact:true})).toBeDisabled();
 await go(page,'流域调蓄');await page.getByRole('button',{name:'3 千m³',exact:true}).click();await expect(page.locator('.water-spill')).toContainText('已蓄满');
 await expect(page.getByRole('img',{name:/虚构流域示意/})).toHaveAttribute('aria-label',/暂存3,000/);
 await page.getByRole('button',{name:'120 分',exact:true}).click();await expect(page.locator('.water-spill')).toHaveCount(0);
 await page.getByRole('button',{name:'无滞蓄',exact:true}).click();await expect(page.getByRole('img',{name:/虚构流域示意/})).toHaveAttribute('aria-label',/入流0.00、出流0.00/);
});
test('water operates offline and without WebGL, with motion and keyboard alternatives',async({page,context})=>{
 const requests:string[]=[];page.on('request',r=>{if(new URL(r.url()).hostname!=='127.0.0.1')requests.push(r.url());});
 await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=(()=>null) as typeof HTMLCanvasElement.prototype.getContext;});
 await page.goto('/topics/loess-soil-water?mode=classroom');await go(page,'流域调蓄');await context.setOffline(true);
 await expect(page.getByRole('button',{name:'播放过程',exact:true})).toBeDisabled();await page.getByRole('slider',{name:'观察时间',exact:true}).press('End');await expect(page.locator('.water-readings')).toContainText('480 分钟');await record(page);
 await go(page,'证据解释');await expect(page.getByRole('table')).toBeVisible();expect(requests).toEqual([]);expect(await context.cookies()).toEqual([]);
});
test('water stages are accessible and have no page overflow',async({page})=>{
 await page.goto('/topics/loess-soil-water?mode=classroom');
 for(const stage of ['提出预测','坡面对照','流域调蓄','证据解释']){await go(page,stage);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);}
});
test('water projection fits, plays only on request and enters fullscreen',async({page,isMobile})=>{
 test.skip(isMobile,'Classroom projection and fullscreen are desktop-specific');await page.setViewportSize({width:1366,height:768});
 await page.goto('/topics/loess-soil-water?mode=classroom');
 for(const stage of ['坡面对照','流域调蓄']){await go(page,stage);const b=await page.locator('.water-board').boundingBox();expect(b!.y).toBeGreaterThanOrEqual(68);expect(b!.y+b!.height).toBeLessThanOrEqual(768);}
 await page.getByRole('button',{name:'0 分',exact:true}).click();await page.getByRole('button',{name:'播放过程',exact:true}).click();await expect(page.getByRole('slider',{name:'观察时间'})).not.toHaveValue('0');await page.getByRole('button',{name:'暂停过程',exact:true}).click();
 await page.getByRole('button',{name:'全屏投影',exact:true}).click();await expect(page.getByRole('button',{name:'退出全屏',exact:true})).toBeVisible();await page.getByRole('button',{name:'退出全屏',exact:true}).click();
});
