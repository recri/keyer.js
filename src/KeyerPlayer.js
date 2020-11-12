import { KeyerEvent } from './KeyerEvent.js';
import { KeyerRamp } from './KeyerRamp.js';

const gainLinear = (decibel) => 10 ** (decibel / 20);

const gainDecibel = (linear) => Math.log10(linear) * 20;

// translate keyup/keydown into keyed sidetone
// this layer handles keying the oscillator
// so it knows the frequency, the volume,
// the keying envelope, rise time, and fall time
export class KeyerPlayer extends KeyerEvent {
  constructor(context) {
    super(context);

    // where we are in the sample time stream
    this.cursor = this.currentTime;

    // initialize parameters
    this.state = 'off';
    this._envelope = 'hann';
    this._envelope2 = 'rectangular';
    this._rise = 4;
    this._fall = 4;
    this.updateRise();
    this.updateFall();
    this.weight = 50;
    this.ratio = 50;
    this.compensation = 0;
    this.wpm = 20;

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

  set gain(gain) { this.volume.gain.value = gainLinear(gain); }

  get gain() { return gainDecibel(this.volume.gain.value); }

  set rise(ms) { this._rise = ms; this.updateRise(); }

  get rise() { return this._rise; }

  set fall(ms) { this._fall = ms; this.updateFall(); }

  get fall() { return this._fall; }

  set envelope(env) { this._envelope = env; this.updateRise(); this.updateFall(); }

  get envelope() { return this._envelope; }

  set envelope2(env) { this._envelope2 = env; this.updateRise(); this.updateFall(); }

  get envelope2() { return this._envelope2; }

  static get envelopes() { return KeyerRamp.ramps; }

  set wpm(v) { this._wpm = v; this.updateTiming(); }

  get wpm() { return this._wpm; }

  set weight(v) { this._weight = v; this.updateTiming(); }

  get weight() { return this._weight; }

  set ratio(v) { this._ratio = v; this.updateTiming(); }

  get ratio() { return this._ratio; }
  
  set compensation(v) { this._compensation = v; this.updateTiming(); }

  get compensation() { return this._compensation; }

  set cursor(seconds) { this._cursor = seconds; }

  get cursor() {
    this._cursor = Math.max(this._cursor, this.currentTime);
    return this._cursor;
  }

  updateRise() { 
    const n = Math.round((this.rise / 1000.0) * this.sampleRate);
    this._riseCurve = new Float32Array(n);
    for (let i = 0; i < n; i += 1)
      this._riseCurve[i] = KeyerRamp.rise(this.envelope, n-1, i);
    // console.log(`updateRise ${this.rise} rise time ${this.sampleRate} samples/sec makes ${n} samples`);
  }

  updateFall() { 
    const n = Math.round((this.fall / 1000.0) * this.sampleRate);
    this._fallCurve = new Float32Array(n);
    for (let i = 0; i < n; i += 1)
      this._fallCurve[i] = KeyerRamp.fall(this.envelope, n-1, i);
    // console.log(`updateFall ${this.rise} rise time ${this.sampleRate} samples/sec makes ${n} samples`);
  }

  updateTiming() {
    const dit = 60.0 / (this.wpm * 50); // seconds/dit
    const microsPerDit = dit * 1e6;
    const r = (this._ratio-50)/100.0;
    const w = (this._weight-50)/100.0;
    const c = 1000.0 * this._compensation / microsPerDit;
    // console.log(`updateTiming r ${r} w ${w} c ${c} dit ${dit}`);
    this.perRawDit = dit;
    this.perDit = dit*(1+r+w+c);
    this.perDah = dit*(3-r+w+c);
    this.perIes = dit*(1  -w-c);
    this.perIls = dit*(3  -w-c); 
    this.perIws = dit*(7  -w-c);
    this.emit('change:timing');
  }

  rampEnded(e, riseFall) { this.emit('end:ramp', riseFall); }
  
  riseEnded(e) {
    this._state = 'on';
    this.rampEnded(e, 'rise');
  }

  fallEnded(e) {
    this._state = 'off';
    this.rampEnded(e, 'fall');
  }

  // schedule the key on at time
  keyOnAt(time) {
    const t = Math.max(time, this.currentTime);
    // console.log(`keyOnAt now+${t-this.currentTime} seconds ${this._riseCurve.length} sample ramp`);
    // console.log(`keyOnAt now+${(t-this.currentTime)*this.sampleRate} samples`);
    // console.log(this._riseCurve);
    const dtime = this._riseCurve.length / this.sampleRate;
    this._state = 'rise';
    this.ramp.gain.setValueCurveAtTime(this._riseCurve, t, dtime);
    this.when(t+dtime, e => this.riseEnded(e))
    this.cursor = t;
    this.emit('transition', 1, t);
  }

  // schedule the key off at time
  keyOffAt(time) {
    const t = Math.max(time, this.currentTime);
    // console.log(`keyOffAt now+${t-this.currentTime} seconds`);
    // console.log(`keyOffAt now+${(t-this.currentTime)*this.sampleRate} samples`);
    const dtime = this._fallCurve.length / this.sampleRate;
    this._state = 'fall'
    this.ramp.gain.setValueCurveAtTime(this._fallCurve, t, dtime);
    this.when(t+dtime, e => this.fallEnded(e))
    this.cursor = t;
    this.emit('transition', 0, t);
  }

  // hold the last scheduled key state for seconds
  keyHoldFor(seconds) {
    // console.log(`state ${this.state} keyHoldFor ${seconds} sec at cursor ${this.cursor} sec at time ${this.currentTime} sec`);
    // console.log(`keyHoldFor until ${(this.cursor+seconds)/this.sampleRate} samples at ${this.currentTime/$this.sampleRate} samples`);
    this.cursor += seconds;
    return this.cursor;
  }

  // cancel all scheduled key transitions
  // should probably cancel all pending text and transition events, too.
  // this will cause a click if we were sounding
  cancel() {
    // console.log("cancel at ", this.currentTime);
    this.ramp.gain.cancelScheduledValues((this.cursor = this.currentTime));
    // this.ramp.gain.setValueCurveAtTime(this._fallCurve, this.currentTime, this.fall / 1000.0);
    this.ramp.gain.value = 0;
  }
}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
