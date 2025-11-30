import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { chromium, webkit } from 'playwright';
import { splitInVerses } from '../services';
import { join } from 'path';

export const open = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  fastify.get('/', async (request, reply) => {
    openBrowser();
    reply.send({ok: true});
  });
  fastify.get('/split', async (request, reply) => {
    splitInVerses(join(__dirname, '../../files/Taylor-swift'));
    reply.send({ok: true});
  });
};

const openBrowser = async () => {
  const browser = await chromium.launch({ headless: false });

  // const context = await browser.newContext();

  for (let i = 0; i < 10; i++) {
    const page = await browser.newPage();
  
    await page.goto('https://www.allaccess.com.ar/event/taylor-swift-the-eras-tour', {waitUntil: 'domcontentloaded'});
  }

  // await new Promise(resolve => setTimeout(resolve, 500000));

  await browser.close();
};
