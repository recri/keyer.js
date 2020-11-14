//
// keyer.js - a progressive web app for morse code
// Copyright (c) 2020 Roger E Critchlow Jr, Charlestown, MA, USA
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// 

import { KeyerEvent } from './KeyerEvent.js';
import { KeyerRamp } from './KeyerRamp.js';

const gainLinear = (decibel) => 10 ** (decibel / 20);

const gainDecibel = (linear) => Math.log10(linear) * 20;

// translate keyup/keydown into keyed sidetone
// this layer handles keying the oscillator
// so it knows the frequency, the volume,
// the keying envelope, rise time, and fall time
//
// we cannot start another ramp while a ramp is playing,
// it would sound awful, and the audio engine throws an
// exception if we even try.
// hence every keying event should specify the time and
// extent of the event, and the cursor is advanced from
// the time by the extent.  and every keying event should
// check to see that it's requested time does not encroach
// on the previous event, by checking that time >= cursor.

export class KeyerPlayer extends KeyerEvent {
  constructor(context) {
    super(context);

    // where we are in the sample time stream
    this.cursor = this.currentTime;

    // initialize parameters
    this.keySounds = false;
    this.keySlews = false;
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

  rampEnded(e, riseFall) { this.keySlews = false; this.emit('end:ramp', riseFall); }
  
  riseEnded(e) { this.rampEnded(e, 'rise'); }

  fallEnded(e) { this.rampEnded(e, 'fall'); }

  // straight key something on or off
  keyStraight(onOff) {
    if (this.cursor > this.currentTime) {
      this.straightMem = onOff;
      this.when(this.cursor, () => this.rekeyStraight());
    } else if (this.straightKey !== onOff) {
      this.straightKey = onOff;
      if (onOff) {
	this.keyOnAt(this.cursor);
	this.keyHoldFor(2*this.rise/1000.0); // maybe better this.perDit?
      } else {
	this.keyOffAt(this.cursor);
	this.keyHoldFor(2*this.fall/1000.0); // maybe better this.Ies?
      }
      this.when(this.cursor, () => this.rekeyStraight());
    }
  }

  // revisit the straight key state
  rekeyStraight() { this.keyStraight(this.straightMem); }
  
  // play a dit or dah at the cursor
  // and the trailing inter-element space
  // return the cursor value at the end of the space
  keyElement(elen, slen) {
    this.keyOnAt(this.cursor);
    this.keyHoldFor(elen);
    this.keyOffAt(this.cursor);
    return this.keyHoldFor(slen);
  }
  
  // schedule the key on at time
  keyOnAt(time) {
    if (time < this.cursor) return false;
    const t = Math.max(time, this.currentTime);
    // console.log(`keyOnAt now+${t-this.currentTime} seconds ${this._riseCurve.length} sample ramp`);
    // console.log(`keyOnAt now+${(t-this.currentTime)*this.sampleRate} samples`);
    // console.log(this._riseCurve);
    const dtime = this._riseCurve.length / this.sampleRate;
    this.keySounds = true;
    this.keySlews = true;
    this.ramp.gain.setValueCurveAtTime(this._riseCurve, t, dtime);
    this.when(t+dtime, e => this.riseEnded(e))
    this.cursor = t;
    this.emit('transition', 1, t);
    return true;
  }

  // schedule the key off at the cursor
  keyOffAt(time) {
    if (time < this.cursor) return false;
    const t = Math.max(time, this.currentTime);
    // console.log(`keyOffAt now+${t-this.currentTime} seconds`);
    // console.log(`keyOffAt now+${(t-this.currentTime)*this.sampleRate} samples`);
    const dtime = this._fallCurve.length / this.sampleRate;
    this.keySounds = false;
    this.keySlews = true;
    this.ramp.gain.setValueCurveAtTime(this._fallCurve, t, dtime);
    this.when(t+dtime, e => this.fallEnded(e))
    this.cursor = t;
    this.emit('transition', 0, t);
    return true
  }

  // advance the cursor by seconds, effectively holdin the last scheduled key state for seconds
  keyHoldFor(seconds) {
    // console.log(`state ${this.keySounds} keyHoldFor ${seconds} sec at cursor ${this.cursor} sec at time ${this.currentTime} sec`);
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
