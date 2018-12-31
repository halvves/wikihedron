const noiseData = new Float32Array(44100 * 5);
let noiseBuffer = null;

// http://noisehack.com/generate-noise-web-audio-api/
let b0 = 0;
let b1 = 0;
let b2 = 0;
let b3 = 0;
let b4 = 0;
let b5 = 0;
let b6 = 0;

for (let i = 0, imax = noiseData.length; i < imax; i++) {
  const white = Math.random() * 2 - 1;

  b0 = 0.99886 * b0 + white * 0.0555179;
  b1 = 0.99332 * b1 + white * 0.0750759;
  b2 = 0.969 * b2 + white * 0.153852;
  b3 = 0.8665 * b3 + white * 0.3104856;
  b4 = 0.55 * b4 + white * 0.5329522;
  b5 = -0.7616 * b5 - white * 0.016898;

  noiseData[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
  noiseData[i] *= 0.11;
  b6 = white * 0.115926;
}

function PinkNoiseNode(audioContext) {
  const bufferSource = audioContext.createBufferSource();

  if (noiseBuffer === null) {
    noiseBuffer = audioContext.createBuffer(
      1,
      noiseData.length,
      audioContext.sampleRate
    );
    noiseBuffer.getChannelData(0).set(noiseData);
  }

  bufferSource.buffer = noiseBuffer;
  bufferSource.loop = true;

  return bufferSource;
}

// eslint-disable-next-line func-names
PinkNoiseNode.install = function() {
  Object.defineProperty(AudioContext.prototype, "createPinkNoise", {
    value() {
      return new PinkNoiseNode(this);
    },
    enumerable: false,
    writable: false,
    configurable: true
  });
};

export default PinkNoiseNode;
