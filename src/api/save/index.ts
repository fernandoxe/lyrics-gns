import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { BrowserContext, chromium } from 'playwright';
import { ALBUMS, ARTIST_NAME, BASE_URL, BROWSER_DATA_PATH, FILES_PATH } from '../../config';
import fs from 'fs';

export const save = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  fastify.get('/album/:id', async (request, reply) => {
    const { id } = <any>request.params;
    let albums;
    if (!id) {
      albums = await saveAlbums(ALBUMS);
    } else {
      albums = await saveAlbums([id]);
    }
    reply.send({ albums });
  });
};

const saveAlbums = async (albums: string[]) => {
  const browser = await chromium.launchPersistentContext(BROWSER_DATA_PATH, { headless: false });

  const savedAlbums = [];
  for (let i = 0; i < albums.length; i++) {
    const element = albums[i];

    const album = await saveAlbum(element, browser);

    await saveFile(JSON.stringify(album, null, 2), `${FILES_PATH}/${ARTIST_NAME}`, `${album.title}.json`);

    savedAlbums.push(album);
  }

  await browser.close();

  return savedAlbums;
}

const saveAlbum = async (album: string, browser: BrowserContext) => {
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/albums/${ARTIST_NAME}/${album}`, { waitUntil: 'domcontentloaded' });

  const trackList = await page.locator('album-tracklist-row a').evaluateAll((elements) => {
    return elements.map((element) => {
      return {
        href: element.getAttribute('href') || '',
        title: element.querySelector('h3')?.childNodes[0].textContent || '',
      };
    });
  });

  const title = await page.locator('h1').evaluate((element) => element.textContent || '');

  await page.close();

  const tracks = trackList.map((track) => ({ ...track, title: normalizeTitle(track.title) }));

  const savedTracks = await saveTracks(tracks, browser);

  const newAlbum = {
    title: normalizeTitle(title),
    tracks: savedTracks,
  };

  return newAlbum;
};

const saveTracks = async (tracks: { href: string; title: string; }[], browser: BrowserContext) => {
  const savedTracks = [];
  for (let i = 0; i < tracks.length; i++) {
    const element = tracks[i];

    const track = await saveTrack(element, browser);

    savedTracks.push(track);
  }
  return savedTracks;
}

const saveTrack = async (track: { href: string; title: string; }, browser: BrowserContext) => {
  const page = await browser.newPage();

  await page.goto(track.href, { waitUntil: 'domcontentloaded' });

  let lyricsContainer: string[] = [];

  try {
    lyricsContainer = await page.locator('#lyrics-root')
      .evaluate((element) => {
        const lyricsDiv = document.createElement('div');

        const lyrics = element.querySelectorAll('[data-lyrics-container]');
        lyrics.forEach(lyric => {
          if (lyric.textContent?.trim() === '') return;

          const lyricsHeader = lyric.querySelector('div[class*="LyricsHeader__Container"]');
          if (lyricsHeader) lyricsHeader.remove();

          lyricsDiv.append(lyric);
          lyricsDiv.append(document.createElement('br'));
        });
        document.querySelector('body')?.append(lyricsDiv);
        window.getSelection()?.selectAllChildren(lyricsDiv);
        const text = window.getSelection()?.toString();
        return text?.split('\n') || [];
      });
  } catch (error: any) {
    console.log(error);
    lyricsContainer = [error, error.message];
  }

  await page.close();

  const newTrack = {
    title: track.title,
    lyrics: lyricsContainer.map(normalizeText),
  };

  return newTrack;
};

export const saveFile = async (data: string, path: string, filename: string) => {
  const filepath = `${path}/${filename}`;
  if (!fs.existsSync(path)) await fs.promises.mkdir(path, { recursive: true });
  await fs.promises.writeFile(filepath, data);
};

const normalizeTitle = (text: string) => {
  return normalizeText(text).replace(/\n/g, '').replace(/\s+/g, ' ').trim();
};

const normalizeText = (text: string) => {
  return text
    .replace(/’/g, '\'')
    .replace(/е/g, 'e')
    .replace(/\u2005/g, ' ')
    .replace(/\u205F/g, ' ')
    .replace(/\u200B/g, '')
    .replace(/\u00A0/g, ' ')
    .trim();
};

const concatWithSeparator = (array: string[][], separator: string) => {
  return array.reduce((acc, val) => acc.concat(val, separator), []).slice(0, -1);
};