import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { z } from 'zod';
import { selectedSlugs } from '../../src/topics/selected/selection';

for (const slug of selectedSlugs) {
 test(`${slug}: 试讲流程、撤提示、独立题及离线操作`, async ({page, context}, testInfo) => {
  const external: string[] = [];
  page.on('request', r => {if (!['127.0.0.1','localhost'].includes(new URL(r.url()).hostname)) external.push(r.url());});
  if (testInfo.project.name.startsWith('desktop')) await page.setViewportSize({width:1366,height:768});
  else await page.setViewportSize({width:360,height:640});
  await page.goto(`/topics/${slug}?mode=classroom`);
  await expect(page.locator('.selected-heading h1')).toBeVisible();
  await expect(page.locator('.selected-figure svg')).toBeVisible();
  await expect(page.locator('.selected-task')).toContainText('学会什么');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  const baseline = await page.locator('.selected-readings').innerText();
  await page.getByRole('button',{name:'记录条件与结果',exact:true}).click();
  await page.getByRole('button',{name:/对照与记录/}).click();
  await page.getByLabel('学习支持',{exact:true}).selectOption('方法提示');
  await context.setOffline(true);
  await page.getByRole('button',{name:/^试验：/}).click();
  await expect(page.locator('.selected-changes')).toContainText('改变 1 项');
  const current = await page.locator('.selected-readings').innerText();
  // Wind-direction experiment intentionally preserves numerical altitude metrics.
  if(slug!=='mountain-rain-shadow') expect(current).not.toEqual(baseline);
  else await expect(page.locator('.selected-feedback')).toContainText('东坡迎风');
  await page.getByRole('button',{name:'记录条件与结果',exact:true}).click();
  await expect(page.locator('.selected-evidence tbody tr')).toHaveCount(2);
  await expect(page.locator('.selected-evidence')).toContainText('示范支持');
  await expect(page.locator('.selected-evidence')).toContainText('方法提示');
  await page.getByRole('button',{name:'退出课堂',exact:true}).click();
  await expect(page.locator('.selected-evidence tbody tr')).toHaveCount(2);
  await page.getByRole('button',{name:/独立检验/}).click();
  await expect(page.locator('.selected-board')).toHaveCount(0);
  await expect(page.locator('.selected-support')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'深入探究',exact:true})).toHaveCount(0);
  const fields = page.locator('.selected-independent fieldset');
  await expect(fields).toHaveCount(2);
  for (let n=0;n<2;n++) {
   const field=fields.nth(n);
   await expect(field.getByRole('status')).toHaveCount(0);
   await field.getByRole('radio').first().check();
   await expect(field.getByRole('status')).toHaveCount(0);
   await field.getByRole('button',{name:`提交第 ${n+1} 题`}).click();
   await expect(field.getByRole('status')).toContainText(n===0?'已暂存作答':'首次作答');
  }
  await fields.first().getByRole('button',{name:'重新作答（记录已看反馈）'}).click();
  await fields.first().getByRole('radio').nth(1).check();
  await fields.first().getByRole('button',{name:'提交第 1 题'}).click();
  await expect(fields.first().getByRole('status')).toContainText('已看反馈后的重答');
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'导出本课证据 JSON'}).click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe(`${slug}-evidence.json`);
  await download.saveAs(testInfo.outputPath(`${slug}.json`));
  const {readFile}=await import('node:fs/promises');
  const evidence=z.object({records:z.array(z.unknown()),attempts:z.array(z.object({priorFeedback:z.boolean(),reviewedSupportDuringAttempt:z.boolean()}))}).parse(JSON.parse(await readFile(testInfo.outputPath(`${slug}.json`),'utf8')) as unknown);
  expect(evidence.records).toHaveLength(2);
  expect(evidence.attempts).toHaveLength(3);
  expect(evidence.attempts[2]?.priorFeedback).toBe(true);
  expect(evidence.attempts[0]?.reviewedSupportDuringAttempt).toBe(false);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  expect(external).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  await context.setOffline(false);
  await page.reload();
  await expect(page.locator('.selected-evidence')).toContainText('0 / 12');
  const axe = await new AxeBuilder({page}).include('.selected-lab').analyze();
  expect(axe.violations).toEqual([]);
 });
}

test('独立检验途中回看帮助会写入证据，答案不提前显示', async ({page},testInfo) => {
 await page.goto('/topics/water-transfer');
 await page.getByRole('button',{name:/独立检验/}).click();
 await expect(page.getByRole('heading',{name:'深入探究',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:/对照与记录/}).click();
 await page.getByRole('button',{name:/独立检验/}).click();
 for(let n=0;n<2;n++){
  await page.locator('.selected-independent fieldset').nth(n).getByRole('radio').first().check();
  await page.getByRole('button',{name:`提交第 ${n+1} 题`}).click();
  if(n===0) await expect(page.getByText('可调80−40=40；损耗4；到水36；缺口50−36=14。守恒：80=40+4+36。',{exact:true})).toHaveCount(0);
 }
 await expect(page.getByText('本次提交前曾回看模型或提示。',{exact:true})).toHaveCount(2);
 const promise=page.waitForEvent('download');
 await page.getByRole('button',{name:'导出本课证据 JSON'}).click();
 await (await promise).saveAs(testInfo.outputPath('support.json'));
 const {readFile}=await import('node:fs/promises');
 const evidence=z.object({attempts:z.array(z.object({reviewedSupportDuringAttempt:z.boolean()}))}).parse(JSON.parse(await readFile(testInfo.outputPath('support.json'),'utf8')) as unknown);
 expect(evidence.attempts.every(a=>a.reviewedSupportDuringAttempt)).toBe(true);
});
