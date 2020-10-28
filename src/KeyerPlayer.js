import { KeyerEvent } from './KeyerEvent.js';

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
    this.rise = 4;
    this.fall = 4;
    this.envelope = 'raised-cosine';

    // initialize the oscillator
    this.oscillator = this.context.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.start();

    // initialize the wave shaper
    this.wave = this.context.createGain();
    this.wave.gain.value = 0;

    // initialize the gain
    this.volume = this.context.createGain();
    this.gain = 0;

    // connect
    this.oscillator.connect(this.wave);
    this.wave.connect(this.volume);
  }

  // connect our output samples to somewhere
  // this never gets called?
  connect(target) { this.volume.connect(target); }

  set pitch(hertz) {
    this.oscillator.frequency.value = hertz;
    this.emit('change:pitch', hertz);
  }

  get pitch() { return this.oscillator.frequency.value; }

  static gainLinear(gainDecibel) { return 10 ** (gainDecibel / 20); }

  static gainDecibel(gainLinear) { return Math.log10(gainLinear) * 20; }

  set gain(gain) {
    // console.log(`set gain ${gain} -> ${KeyerPlayer.gainLinear(gain)} -> ${KeyerPlayer.gainDecibel(KeyerPlayer.gainLinear(gain))}`);
    this.volume.gain.value = KeyerPlayer.gainLinear(gain);
    this.emit('change:gain');
  }

  get gain() { return KeyerPlayer.gainDecibel(this.volume.gain.value); }

  set rise(ms) { this._rise = ms || 4; }

  get rise() { return this._rise; }

  set fall(ms) { this._fall = ms || 4; }

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

  // update rise and fall curves
  updateRiseFall() {
    this._riseCurve = KeyerPlayer.riseCurve();
    this._fallCurve = KeyerPlayer.fallCurve();
  }

  static riseCurve() {
    const n = 64;
    const curve = new Float32Array(n + 1);
    const max = 1.0;
    for (let i = 0; i <= n; i += 1)
      curve[i] = (max * (1 + Math.cos(Math.PI + (i * Math.PI) / n))) / 2;
    return curve;
  }

  static fallCurve() {
    const n = 64;
    const curve = new Float32Array(n + 1);
    const max = 1.0;
    for (let i = 0; i <= n; i += 1)
      curve[i] = (max * (1 + Math.cos((i * Math.PI) / n))) / 2;
    return curve;
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
    this.wave.gain.setValueCurveAtTime(this._riseCurve, time, this.rise / 1000.0);
    this.cursor = time;
    this.emit('transition', 1, time);
  }

  // schedule the key off at time
  keyOffAt(time) {
    // console.log("keyOffAt", time, " at ", this.context.currentTime)
    this.wave.gain.setValueCurveAtTime(this._fallCurve, time, this.fall / 1000.0);
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
    this.volume.gain.cancelScheduledValues((this.cursor = this.context.currentTime));
    this.volume.gain.value = 0;
  }
}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
