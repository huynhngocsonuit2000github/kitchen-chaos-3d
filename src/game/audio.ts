import musicUrl from '../../assets/runtime/audio/service-music.ogg?url';
import roomUrl from '../../assets/runtime/audio/room-tone.ogg?url';

export function createAudio() {
  let context: AudioContext | undefined;
  let output: GainNode | undefined;
  let muted = false;
  let voices = 0;
  const music = new Audio(musicUrl);
  const room = new Audio(roomUrl);
  music.loop = room.loop = true;
  music.preload = room.preload = 'none';
  const levels = { master: .72, music: .28, sfx: .65 };
  const levelsChanged = () => {
    music.volume = muted ? 0 : levels.master * levels.music;
    room.volume = muted ? 0 : levels.master * levels.sfx * .16;
    if (output) output.gain.value = muted ? 0 : levels.master * levels.sfx * .50;
  };

  const unlock = () => {
    if (!context) {
      context = new AudioContext();
      output = context.createGain();
      levelsChanged();
      output.connect(context.destination);
    }
    void context.resume().catch(() => undefined);
    void music.play().catch(() => undefined);
    void room.play().catch(() => undefined);
  };

  function cue(kind: 'pickup' | 'place' | 'ready' | 'warn' | 'order' | 'serve' | 'chop' | 'wash' | 'fry') {
    if (!context || !output || context.state !== 'running' || muted || voices >= 6) return;
    const sounds = {
      pickup: [392, 523, .11], place: [193, 117, .10], ready: [784, 1047, .25],
      warn: [252, 177, .29], order: [494, 660, .16], serve: [523, 1047, .33],
      chop: [201, 64, .065], wash: [422, 225, .075], fry: [218, 91, .062],
    };
    const [start, end, duration] = sounds[kind];
    const t = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = kind === 'warn' || kind === 'chop' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(start!, t);
    oscillator.frequency.exponentialRampToValueAtTime(end!, t + duration! * .73);
    envelope.gain.setValueAtTime(.001, t);
    envelope.gain.exponentialRampToValueAtTime(kind === 'fry' ? .08 : .36, t + .013);
    envelope.gain.exponentialRampToValueAtTime(.001, t + duration!);
    oscillator.connect(envelope).connect(output);
    voices++;
    oscillator.onended = () => {
      voices--;
      oscillator.disconnect();
      envelope.disconnect();
    };
    oscillator.start();
    oscillator.stop(t + duration!);
  }

  return {
    unlock,
    cue,
    pause: () => {
      void context?.suspend().catch(() => undefined);
      music.pause();
      room.pause();
    },
    levels,
    levelsChanged,
    set muted(next: boolean) {
      muted = next;
      levelsChanged();
    },
    get muted() { return muted; },
  };
}
