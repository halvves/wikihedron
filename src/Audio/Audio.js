import PinkNoiseNode from "./PinkNoiseNode";
import impulseResponse from "./impulse-response";
import base64ToArrayBuffer from "./base64ToArrayBuffer";

class Audio {
  constructor() {
    // Cycling Chord Number
    this.chordNo = 1;

    // Tonal references
    this.pitches = [
      146,
      165,
      183,
      195,
      220,
      244,
      275,
      293,
      330,
      367,
      391,
      440,
      489,
      550,
      587,
      660,
      734,
      783,
      880,
      978,
      1101,
      1174,
      1321,
      1468,
      1566
    ];

    this.fifths = [[4, 9], [2, 6], [5, 10]];

    this.chords = [
      [5, 7, 11, 13, 14, 16, 18, 20, 22, 23],
      [6, 8, 9, 11, 13, 15, 16, 18, 20, 22],
      [5, 7, 8, 10, 12, 14, 15, 17, 19, 21]
    ];

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.reverb = this.ctx.createConvolver();
    const reverbSoundArrayBuffer = base64ToArrayBuffer(impulseResponse);
    this.ctx.decodeAudioData(
      reverbSoundArrayBuffer,
      buf => {
        this.reverb.buffer = buf;
      },
      e => {
        console.warn("Error when decoding audio data", e);
      }
    );
    this.reverb.connect(this.ctx.destination);

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(670, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(12, this.ctx.currentTime);
    this.filter.connect(this.reverb);

    this.chordChange = this.chordChange.bind(this);
    this.chordChange();

    this.resumeCtx = this.resumeCtx.bind(this);
  }

  chordChange() {
    this.chordNo = this.chordNo === 2 ? 0 : this.chordNo + 1;
    setTimeout(this.chordChange, 8000);
  }

  getRandom(max) {
    return Math.floor(Math.random() * Math.floor(max + 1));
  }

  resumeCtx() {
    this.ctx.resume();
  }

  playUpdate(addition) {
    const { chordNo, chords, ctx, filter, pitches, reverb } = this;
    const freq = pitches[chords[chordNo][parseInt(this.getRandom(9))]];

    let g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);

    let o = ctx.createOscillator();
    o.type = addition ? "sine" : "sawtooth";
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.start(ctx.currentTime);

    o.connect(g);
    g.connect(addition ? reverb : filter);

    o.onended = () => {
      o.disconnect();
      g.disconnect();
      o = null;
      g = null;
    };

    g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.25);
    o.stop(ctx.currentTime + 1.25);
  }

  playNewUser() {
    const { chordNo, ctx, fifths, pitches, reverb } = this;

    let g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);

    let g2 = ctx.createGain();
    g2.gain.setValueAtTime(0, ctx.currentTime);

    let f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(700, ctx.currentTime);
    f.Q.setValueAtTime(3, ctx.currentTime);

    const pad = [
      ctx.createOscillator(),
      ctx.createOscillator(),
      new PinkNoiseNode(ctx)
    ];

    pad.forEach((o, i) => {
      if (i < 2) {
        o.type = "sine";
        o.frequency.setValueAtTime(
          pitches[fifths[chordNo][i]],
          ctx.currentTime
        );
        o.connect(g);
      } else {
        o.connect(g2);
      }
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 5.5);

      o.onended = () => {
        o.disconnect();
        o = null;
        if (i === 1) {
          g.disconnect();
          g = null;
        }
        if (i === 2) {
          g2.disconnect();
          g2 = null;
          f.disconnect();
          f = null;
        }
      };
    });

    g.connect(f);
    g2.connect(f);
    f.connect(reverb);

    g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 1);
    g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 3);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 5.5);
    g2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1);
    g2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 3);
    g2.gain.linearRampToValueAtTime(0, ctx.currentTime + 5.5);
    f.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 1.5);
    f.frequency.linearRampToValueAtTime(1500, ctx.currentTime + 2);
    f.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 2.5);
    f.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 5.5);
  }
}

export default Audio;
