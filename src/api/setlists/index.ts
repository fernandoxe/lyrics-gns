import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { BROWSER_DATA_PATH, FILES_PATH, SETLIST_PATHS } from '../../config';
import { BrowserContext, chromium } from 'playwright';
import fs from 'fs';

export const setlists = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  fastify.get('/', async (request, reply) => {
    // const albums = await saveSetlists(SETLIST_PATHS);
    // reply.send({albums});
    const info = getInfo('files/setlists');
    reply.send({info});
  });
};

const getInfo = (folder: string) => {
  const files = fs.readdirSync(folder);
  const info = files.map((file) => {
    const data = fs.readFileSync(`${folder}/${file}`, 'utf8');
    const date = file.split('.')[0];
    const json = JSON.parse(data);
    return json;
  });
  return info;
};

const saveSetlists = async (setlistsPaths: string[]) => {
  const browser = await chromium.launchPersistentContext(BROWSER_DATA_PATH, { headless: true});

  // const setlists = [];
  for (let i = 0; i < setlistsPaths.length; i++) {
    const element = setlistsPaths[i];
    
    const setlist = await saveSetlist(element, browser);

    // setlists.push(setlist);

    // await saveSetlistJson(setlists);
    await saveSetlistJson(setlist);

    await new Promise(resolve => setTimeout(resolve, 3000));
  }


  await browser.close();
};

const saveSetlist = async (setlist: string, browser: BrowserContext) => {
  const page = await browser.newPage();

  await page.goto(setlist, {waitUntil: 'domcontentloaded'});

  const date = await page.locator('.dateBlockContainer').evaluate((element: any) => {
    const months: {[key: string]: string} = {
      JAN: '01',
      FEB: '02',
      MAR: '03',
      APR: '04',
      MAY: '05',
      JUN: '06',
      JUL: '07',
      AUG: '08',
      SEP: '09',
      OCT: '10',
      NOV: '11',
      DEC: '12',
    };
    const [month, day, year] = element.innerText.split('\n');
    const formattedDate = `${year}-${months[month.toUpperCase()]}-${day.padStart(2, '0')}`;
    return formattedDate;
  });
  // console.log('date', date);
  
  const title = await page.locator('h1').evaluate((element: any) => {
    const artist = element.querySelector('strong span').innerText;
    const stadium = element.querySelector('span > span').innerText;
    return [
      artist,
      stadium
    ];
  });
  // console.log('title', title);

  // const tracks = await page.locator('.setlistParts.song .songPart').evaluateAll(elements => {
  //   return elements.map((element: any) => element.innerText);
  // });
  // console.log('tracks', tracks);

  const setlistInfo = await page.locator('.setlistList p.info').evaluateAll(elements => {
    const infoItems = elements.map((element: any) => element.innerText || null);
    return infoItems.filter((item: any) => item !== null);
  });
  // console.log('setlistInfo', setlistInfo);
  
  // let times = {
  //   origin: null,
  //   doors: null,
  //   start: null,
  //   scheduled: null,
  //   end: null,
  // };
  // try {
  //   times = await page.locator('.setTimesTimeline.hidden-xs .times').evaluate((element: any) => {
  //     const origin = element.querySelector('.origin > div:first-child .mainTime');
  //     const doors = element.querySelector('.doors strong');
  //     const start = element.querySelector('.start strong');
  //     const scheduled = element.querySelector('.scheduled strong');
  //     const end = element.querySelector('.end strong');
  //     return {
  //       origin: origin?.innerText || null,
  //       doors: doors?.innerText || null,
  //       start: start?.innerText || null,
  //       scheduled: scheduled?.innerText || null,
  //       end: end?.innerText || null,
  //     };
  //   });
  // } catch (error) {
  //   console.log('error', error);
  // }
  // console.log('times', times);
 
  let surpriseSongs: any;
  try {
    surpriseSongs = await page.locator('.setlistList:not([class*=" "])').evaluate((element: any, l) => {
      const title: any = Array.from(element.querySelectorAll('li')).find((li: any) => li.innerText.toLowerCase().includes('surprise'));
      const ss1 = title.nextElementSibling;
      const ss2 = ss1.nextElementSibling;
      const notes1: any = [];
      const notes2 : any = [];
      ss1.querySelectorAll('.infoPart').forEach((info: any) => notes1.push(info.innerText));
      ss2.querySelectorAll('.infoPart').forEach((info: any) => notes2.push(info.innerText));

      const karma: any = [];
      const karmaLi: any = Array.from(element.querySelectorAll('li')).find((li: any) => li.innerText.toLowerCase().includes('karma'));
      karmaLi.querySelectorAll('.infoPart').forEach((info: any) => karma.push(info.innerText));
      
      const midnightRain: any = [];
      const midnightRainLi: any = Array.from(element.querySelectorAll('li')).find((li: any) => li.innerText.toLowerCase().includes('midnight rain'));
      midnightRainLi.querySelectorAll('.infoPart').forEach((info: any) => midnightRain.push(info.innerText));
      
      return {
        guitar: notes1.filter((x: any) => x),
        piano: notes2.filter((x: any) => x),
        karma: karma.filter((x: any) => x),
        midnightRain: midnightRain.filter((x: any) => x),
      };
    });
  } catch (error) {
    console.log(date, error);
  }

  // await page.waitForTimeout(500000);
  await page.close();

  return {
    date,
    stadium: title[1],
    // tracks,
    setlistInfo,
    surpriseSongs: {
      guitar: surpriseSongs.guitar,
      piano: surpriseSongs.piano,
    },
    karma: surpriseSongs.karma,
    midnightRain: surpriseSongs.midnightRain,
    // times,
  };
};

const saveSetlistJson = async (setlist: any) => {
  const setlistString = JSON.stringify(setlist, null, 2);
  const path = `${FILES_PATH}/setlists/${setlist.date}.json`;
  if(!fs.existsSync(path)) {
    fs.writeFileSync(path, setlistString);
  }
};