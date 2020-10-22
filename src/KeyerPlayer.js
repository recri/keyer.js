import { KeyerEvent } from './KeyerEvent.js';

// translate keyup/keydown into keyed sidetone
export class KeyerPlayer extends KeyerEvent {
  constructor(context) {
    super();
    this.context = context;
    this.oscillator = this.context.createOscillator();
    this.key = this.context.createGain();

    // where we are in the sample time stream
    this.curpos = 0;

    // initialize parameters
    this._gain = 0;
    this._rise = 4;
    this._fall = 4;
    this._envelope = 'raised-cosine';
    this.updateRiseFall();
    
    // initialize the oscillator
    this.oscillator.type = 'sine';
    this.oscillator.start();

    // initialize the gain
    this.key.gain.value = 0;
    this.oscillator.connect(this.key);
  }

  set pitch(hertz) {
    this.oscillator.frequency.value = hertz;
    this.emit('change:pitch', hertz);
  }

  get pitch() { return this.oscillator.frequency.value; }

  gainLinear() { return 10 ** (this._gain / 20); }

  set gain(gain) { 
    this._gain = gain;
    this.updateRiseFall();
  }

  get gain() { return this._gain; }

  set rise(ms) { this._rise = (ms || 4); }

  get rise() { return this._rise; }

  set fall(ms) { this._fall = (ms || 4); }

  get fall() { return this._fall; }

  set envelope(env) {
    this._envelope = env;
    this.updateRiseFall();
  }

  get envelope() { return this._envelope; }

  set cursor(seconds) { this.curpos = seconds; }

  get cursor() {
    this.curpos = Math.max(this.curpos, this.context.currentTime);
    return this.curpos;
  }

  // connect our output samples to somewhere
  connect(target) { this.key.connect(target); }

  // update rise and fall curves
  updateRiseFall() {
    this._riseCurve = this.riseCurve()
    this._fallCurve = this.fallCurve();
  }

  riseCurve() {
    const n = 64;
    const curve = new Float32Array(n+1);
    const max = this.gainLinear();
    for (let i = 0; i <= n; i += 1) curve[i] = max*(1+Math.cos(Math.PI+i*Math.PI/n))/2;
    return curve
  }

  fallCurve() {
    const n = 64;
    const curve = new Float32Array(n+1);
    const max = this.gainLinear();
    for (let i = 0; i <= n; i += 1) curve[i] = max*(1+Math.cos(i*Math.PI/n))/2;

    return curve
  }

  // turn the key on now
  keyOn() {
    this.cancel();
    this.keyOnAt(this.context.currentTime);
  }

  // turn the key off now
  keyOff() {
    this.cancel();
    this.offAt(this.context.currentTime);
  }

  // schedule the key on at time
  keyOnAt(time) {
    // console.log("keyOnAt", time, " at ", this.context.currentTime)
    this.key.gain.setValueCurveAtTime(this._riseCurve, time, this.rise/1000.0);
    // this.key.gain.setValueAtTime(0.0, time);
    // this.key.gain.linearRampToValueAtTime(this.ramp.max, time + this.ramp.rise);
    this.cursor = time;
    this.emit('transition', 1, time);
  }

  // schedule the key off at time
  keyOffAt(time) {
    // console.log("keyOffAt", time, " at ", this.context.currentTime)
    this.key.gain.setValueCurveAtTime(this._fallCurve, time, this.fall/1000.0);
    // this.key.gain.setValueAtTime(this.ramp.max, time);
    // this.key.gain.linearRampToValueAtTime(0.0, time + this.ramp.fall);
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
  cancel() {
    // console.log("cancel at ", this.context.currentTime);
    this.key.gain.cancelScheduledValues((this.cursor = this.context.currentTime));
    this.key.gain.value = 0;
  }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
