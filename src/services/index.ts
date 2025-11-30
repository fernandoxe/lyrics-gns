import fs from 'fs';

export const joinLyrics = (folder: string) => {
  // read every json file in the folder and join the array
  // then save it to a json file
  const files = fs.readdirSync(folder);
  files.map((file) => {
    const data = fs.readFileSync(`${folder}/${file}`, 'utf8');
    const json = JSON.parse(data);
    const tracks = json.tracks;
    const newTracks = tracks.map((track: any) => {
      const lyrics = track.lyrics;
      const newLyrics = lyrics.join('\n');
      return { ...track, lyrics: newLyrics };
    });
    const newJson = { ...json, tracks: newTracks };
    const newJsonString = JSON.stringify(newJson, null, 2);
    if(!fs.existsSync(`${folder}/joined`)) {
      fs.mkdirSync(`${folder}/joined`);
    }
    fs.writeFileSync(`${folder}/joined/${file}`, newJsonString);
  });
};

export const splitInVerses = (folder: string) => {
  const files = fs.readdirSync(folder);
  files.forEach((file) => {
    if(file === 'splitted') return;
    const data = fs.readFileSync(`${folder}/${file}`, 'utf8');
    const json = JSON.parse(data);
    const tracks = json.tracks;
    const newTracks = tracks.map((track: any) => {
      const newLyrics = track.lyrics.join('\n');
      const verses = newLyrics.split('\n\n');
      const newVerses = verses.map((verse: string) => {
        const verseName = verse.substring(1, verse.indexOf(']'));
        return { name: verseName, verse };
      });
      return { ...track, verses: newVerses, lyrics: newLyrics };
    });
    const newJson = { ...json, tracks: newTracks };
    const newJsonString = JSON.stringify(newJson, null, 2);

    if(!fs.existsSync(`${folder}/splitted`)) {
      fs.mkdirSync(`${folder}/splitted`);
    }
    fs.writeFileSync(`${folder}/splitted/${file}`, newJsonString);
  });
};