import fs from 'fs';
import path from 'path';

// return the file names in path except index.mjs
const getFiles = (dir) => {
  return fs.readdirSync(dir).filter((file) => file !== 'index.mjs' && file !== 'splitted');
};

// return the track titles from json, the files is in this format
// {title: string, tracks: {title: string, lyrics: string}[]}
const getTracks = (file) => {
  const data = fs.readFileSync(file);
  return {
    title: JSON.parse(data).title,
    tracks: JSON.parse(data).tracks.map((track) => track.title)
  };
};

const normalizeTitles = (files) => {
  return files.map((file) => {
    return file.replace('(Taylor\'s Version)', '');
  });
};

const files = getFiles('files/Taylor-swift');
const all = [];
for(let i = 0; i < files.length; i++){
  const file = files[i];
  const tracks = getTracks(`files/Taylor-swift/${file}`);
  all.push(tracks);
}
console.log(all);
