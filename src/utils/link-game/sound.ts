import { Howl } from 'howler';
import eliminateUrl from '/sound/eliminate.mp3';
import selectedUrl from '/sound/selected.mp3';
import successUrl from '/sound/success.mp3';

const eliminateSound = new Howl({
  src: [eliminateUrl]
});
const selectedSound = new Howl({
  src: [selectedUrl]
});
const successSound = new Howl({
  src: [successUrl]
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
