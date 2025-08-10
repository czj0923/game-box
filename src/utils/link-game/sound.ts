import { Howl } from 'howler';

const eliminateSound = new Howl({
  src: ['/sound/eliminate.mp3']
});
const selectedSound = new Howl({
  src: ['/sound/selected.mp3']
});
const successSound = new Howl({
  src: ['/sound/success.mp3']
});

function getSound(type: string) {
  const soundMap: { [key: string]: any } = {
    eliminate: eliminateSound,
    selected: selectedSound,
    success: successSound
  };
  return soundMap[type] || null;
}

export { getSound };
