/// <reference lib="dom" />
import { expect, test } from '@playwright/test';
import { selectedSlugs } from '../../src/topics/selected/selection';

test('production selected lesson directory exposes all ten entries', async ({page}) => {
 await page.goto('/geoquest/');
 await expect(page.locator('.home-selected a')).toHaveCount(10);
 for(const slug of selectedSlugs) await expect(page.locator(`.home-selected a[href="/geoquest/topics/${slug}"]`)).toBeVisible();
});

for(const slug of selectedSlugs) test(`${slug}: production deep link, refresh and offline comparison`, async ({page,context,baseURL}) => {
 const failures:string[]=[];
 page.on('pageerror',e=>failures.push(e.message));
 page.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
 page.on('request',r=>{if(r.url().startsWith('http')&&new URL(r.url()).origin!==new URL(baseURL!).origin)failures.push(r.url());});
 const response=await page.goto(`/geoquest/topics/${slug}?mode=classroom`);
 expect(response?.status()).toBe(200);
 await expect(page.locator('.selected-heading h1')).toBeVisible();
 await page.reload();
 await expect(page.locator('.selected-figure svg')).toBeVisible();
 await context.setOffline(true);
 await page.getByRole('button',{name:'记录条件与结果',exact:true}).click();
 await page.getByRole('button',{name:/^试验：/}).click();
 await expect(page.locator('.selected-changes')).toContainText('改变 1 项');
 await page.getByRole('button',{name:'记录条件与结果',exact:true}).click();
 await page.getByRole('button',{name:'退出课堂',exact:true}).click();
 await expect(page).toHaveURL(new RegExp(`/geoquest/topics/${slug}$`));
 await expect(page.locator('.selected-evidence tbody tr')).toHaveCount(2);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(failures).toEqual([]);
 expect(await context.cookies()).toEqual([]);
});
