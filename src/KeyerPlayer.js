import { KeyerEvent } from './KeyerEvent.js';
import { KeyerRamp } from './KeyerRamp.js';

// translate keyup/keydown into keyed sidetone
// this layer handles keying the oscillator
// so it knows the frequency, the volume,
// the keying envelope, rise time, and fall time
export class KeyerPlayer extends KeyerEvent {
  constructor(context) {
    super(context);

    // where we are in the sample time stream
    this.curpos = 0;

    // initialize parameters
    this._rise = 4;
    this._fall = 4;
    this.envelopes = KeyerRamp.ramps;
    this._envelope = 'raised-cosine';
    this.updateRise();
    this.updateFall();

    // initialize the oscillator
    this.oscillator = this.context.createOscillator();
    this.oscillator.type = 'sine';

    // initialize the wave shaper
    this.ramp = this.context.createGain();
    this.ramp.gain.value = 0;

    // initialize the output gain
    this.volume = this.context.createGain();
    this.volume.gain.value = 0;

    // connect
    this.oscillator.connect(this.ramp);
    this.ramp.connect(this.volume);

    // start
    this.oscillator.start();
  }

  // connect our output samples to somewhere
  // this never gets called?
  connect(target) { this.volume.connect(target); }

  set pitch(hertz) { this.oscillator.frequency.value = hertz; }

  get pitch() { return this.oscillator.frequency.value; }

  static gainLinear(gainDecibel) { return 10 ** (gainDecibel / 20); }

  static gainDecibel(gainLinear) { return Math.log10(gainLinear) * 20; }

  set gain(gain) { this.volume.gain.value = KeyerPlayer.gainLinear(gain); }

  get gain() { return KeyerPlayer.gainDecibel(this.volume.gain.value); }

  set rise(ms) { if (this.rise !== ms) { this._rise = ms; this.updateRise(); } }

  get rise() { return this._rise; }

  set fall(ms) { if (this._fall !== ms) { this._fall = ms; this.updateFall(); } }

  get fall() { return this._fall; }

  set envelope(env) { if (this._envelope !== env) { this._envelope = env; this.updateRise(); this.updateFall(); } }

  get envelope() { return this._envelope; }

  set cursor(seconds) { this.curpos = seconds; }

  get cursor() {
    this.curpos = Math.max(this.curpos, this.context.currentTime);
    return this.curpos;
  }

  updateRise() { 
    const n = Math.round((this.rise / 1000.0) * this.context.sampleRate);
    this._riseCurve = new Float32Array(n);
    for (let i = 0; i < n; i += 1)
      this._riseCurve[i] = KeyerRamp.rise(this.envelope, n-1, i);
  }

  updateFall() { 
    const n = Math.round((this.fall / 1000.0) * this.context.sampleRate);
    this._fallCurve = new Float32Array(n);
    for (let i = 0; i < n; i += 1)
      this._fallCurve[i] = KeyerRamp.fall(this.envelope, n-1, i);
  }

  rampEnded(e, riseFall) { this.emit('end:ramp', riseFall); }
  
  timeout(start, extent, handler) {
    const timer = this.context.createConstantSource();
    timer.onended = handler;
    timer.start(start);
    timer.stop(start+extent);
  }

  // schedule the key on at time
  keyOnAt(time) {
    // console.log(`keyOnAt now+${time-this.context.currentTime} seconds`);
    // console.log(`keyOnAt now+${(time-this.context.currentTime)*this.context.sampleRate} samples`);
    const dtime = this._riseCurve.length / this.context.sampleRate;
    this.ramp.gain.setValueCurveAtTime(this._riseCurve, time, dtime);
    this.timeout(time, dtime, e => this.rampEnded(e, 'rise'))
    this.cursor = time;
    this.emit('transition', 1, time);
  }

  // schedule the key off at time
  keyOffAt(time) {
    // console.log(`keyOffAt now+${time-this.context.currentTime} seconds`);
    // console.log(`keyOffAt now+${(time-this.context.currentTime)*this.context.sampleRate} samples`);
    const dtime = this._fallCurve.length / this.context.sampleRate;
    this.ramp.gain.setValueCurveAtTime(this._fallCurve, time, dtime);
    this.timeout(time, dtime, e => this.rampEnded(e, 'fall'))
    this.cursor = time;
    this.emit('transition', 0, time);
  }

  // hold the last scheduled key state for seconds
  keyHoldFor(seconds) {
    // console.log("keyHoldFor until", this.cursor+seconds, "at", this.context.currentTime);
    this.cursor += seconds;
    return this.cursor;
  }

  // cancel all scheduled key transitions
  // should probably cancel all pending text and transition events, too.
  // this will cause a click if we were sounding
  cancel() {
    // console.log("cancel at ", this.context.currentTime);
    this.ramp.gain.cancelScheduledValues((this.cursor = this.context.currentTime));
    // this.ramp.gain.setValueCurveAtTime(this._fallCurve, this.context.currentTime, this.fall / 1000.0);
    this.ramp.gain.value = 0;
  }
}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
