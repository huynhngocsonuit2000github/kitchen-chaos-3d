"""Synthesize and encode the original Burger Town music and room ambience."""
import math
import random
import struct
import subprocess
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RATE = 22050
BEAT = .5
DURATION = 16
TAU = math.tau

def note(pitch, time, length):
    if not 0 <= time <= length:
        return 0
    frequency = 440 * 2 ** ((pitch - 69) / 12)
    envelope = min(1, time / .014) * max(0, 1 - time / length) ** 2
    phase = frequency * time * TAU
    return envelope * (math.sin(phase) + .27 * math.sin(phase * 2) + .12 * math.sin(phase * 3))

def music(time):
    step = int(time / BEAT)
    chord = ((48, 55, 64, 67), (45, 52, 60, 64), (41, 48, 57, 60), (43, 50, 59, 65))[step // 8]
    melody = (2, 3, 1, 3, 2, 1, 2, 3)
    bass = note(chord[0] + (7 if step % 4 == 2 else 0), time % (2 * BEAT), .84)
    upper = note(chord[melody[step % len(melody)]], time % BEAT, .42)
    return .27 * bass + .14 * upper

rng = random.Random(42)
def room(time, state):
    state[0] = .96 * state[0] + .04 * rng.uniform(-1, 1)
    seam = min(1, time / .2, (DURATION - time) / .2)
    return seam * (.32 * state[0] + .018 * math.sin(TAU * 61 * time))

source = ROOT / 'assets/source'
output = ROOT / 'assets/runtime/audio'
source.mkdir(parents=True, exist_ok=True)
output.mkdir(parents=True, exist_ok=True)
state = [0]
for name, synth in [('service-music', music), ('room-tone', lambda t: room(t, state))]:
    raw = source / (name + '.wav')
    with wave.open(str(raw), 'wb') as audio:
        audio.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        audio.writeframes(b''.join(struct.pack('<h', round(32767 * synth(i / RATE))) for i in range(RATE * DURATION)))
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(raw),
                    '-c:a', 'libvorbis', '-q:a', '4', str(output / (name + '.ogg'))], check=True)
