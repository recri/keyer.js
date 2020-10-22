import { KeyerEvent } from './KeyerEvent.js';

//
// translate keyed audio tone to keyup/keydown events
//
export class KeyerDetone extends KeyerEvent {
  /*
   ** The Goertzel filter detects the power of a specified frequency
   ** very efficiently.
   **
   ** This is based on http://en.wikipedia.org/wiki/Goertzel_algorithm
   ** and the video presentation of CW mode for the NUE-PSK modem
   ** at TAPR DCC 2011 by George Heron N2APB and Dave Collins AD7JT.
   */
  constructor(context) {
    super();
    this.context = context;
    this.scriptNode = this.context.createScriptProcessor(1024, 1, 1);
    this.center = 600;
    this.bandwidth = 100;
    this.coeff = 0;
    this.s = new Float32Array(4);
    this.block_size = 0;
    this.i = 0;
    this.power = 0;
    this.maxPower = 0;
    this.oldPower = 0;
    this.dtime = 0;
    this.onoff = 0;

    // setup
    this.setCenterAndBandwidth(this.center, this.bandwidth);
    this.dtime = 1.0 / this.context.sampleRate;
    this.scriptNode.onaudioprocess = audioProcessingEvent =>
      this.onAudioProcess(audioProcessingEvent);
  }

  setCenterAndBandwidth(center, bandwidth) {
    if (center > 0 && center < this.context.sampleRate / 4) {
      this.center = center;
    } else {
      this.center = 600;
    }
    if (bandwidth > 0 && bandwidth > this.context.sampleRate / 4) {
      this.bandwidth = bandwidth;
    } else {
      this.bandwidth = 50;
    }
    this.coeff =
      2 * Math.cos((2 * Math.PI * this.center) / this.context.sampleRate);
    this.block_size = this.context.sampleRate / this.bandwidth;
    this.i = this.block_size;
    this.s[0] = 0;
    this.s[1] = 0;
    this.s[3] = 0;
    this.s[4] = 0;
  }

  detoneProcess(x) {
    /* eslint no-bitwise: ["error", { "allow": ["&"] }] */
    this.s[this.i & 3] =
      x + this.coeff * this.s[(this.i + 1) & 3] - this.s[(this.i + 2) & 3];
    this.i -= 1;
    if (this.i < 0) {
      this.power =
        this.s[1] * this.s[1] +
        this.s[0] * this.s[0] -
        this.coeff * this.s[0] * this.s[1];
      this.i = this.block_size;
      this.s[0] = 0;
      this.s[1] = 0;
      this.s[2] = 0;
      this.s[3] = 0;
      return 1;
    }
    return 0;
  }

  emitTransition(transition, time) {
    return () => this.emit('transition', transition, time);
  }

  onAudioProcess(audioProcessingEvent) {
    const { inputBuffer, outputBuffer } = audioProcessingEvent;
    const inputData = inputBuffer.getChannelData(0);
    const outputData = outputBuffer.getChannelData(0);
    let time = audioProcessingEvent.playbackTime;
    // console.log("onAudioProcess "+inputBuffer.length+" samples at "+time);
    // rewritten to decouple the transition processing from the audio buffer processing
    // using setTimeout(..., 0);
    for (let sample = 0; sample < inputBuffer.length; sample += 1) {
      outputData[sample] = inputData[sample];
      if (this.detoneProcess(inputData[sample])) {
        this.maxPower = Math.max(this.power, this.maxPower);
        const threshold = this.maxPower / 2;
        if (this.onoff === 0 && this.power > threshold) {
          this.onoff = 1;
          const myTime = time;
          setTimeout(() => this.emit('transition', 1, myTime), 0);
        } else if (this.onoff === 1 && this.power < threshold) {
          this.onoff = 0;
          const myTime = time;
          setTimeout(() => this.emit('transition', 0, myTime), 0);
        }
      }
      time += this.dtime;
    }
    setTimeout(() => this.emit('buffer', inputData, time), 0); // don't understand what this does
  }

  connect(node) {
    this.scriptNode.connect(node);
  }

  get target() {
    return this.scriptNode;
  }

  onchangepitch(pitch) {
    this.setCenterAndBandwidth(pitch, this.bandwidth);
  }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
