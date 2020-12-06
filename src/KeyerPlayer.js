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
import { KeyerASKWorklet } from './KeyerASKWorklet.js';

const gainLinear = (decibel) => 10 ** (decibel / 20);

// not used
// const gainDecibel = (linear) => Math.log10(linear) * 20;

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
    this.weight = 50;
    this.ratio = 50;
    this.compensation = 0;
    this.speed = 20;
    
    // initialize the key
    this.key = this.context.createConstantSource();
    this.key.offset.value = 0;
    
    // initialize the audio shift keyer
    this.ask = new KeyerASKWorklet(context, 'keyer-ask-processor', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] }, this);
    // console.log(`KeyerPlayer typeof this.ask = ${typeof this.ask}`);

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
    this.key.connect(this.ask);
    this.oscillator.connect(this.ramp);
    this.ask.connect(this.ramp.gain);
    this.ramp.connect(this.volume);
    
    // start
    this.oscillator.start();
    this.key.start();
  }

  // connect our output samples to somewhere
  // this never gets called?
  connect(target) { this.volume.connect(target); }

  disconnect(target) { this.volume.disconnect(target); }

  set pitch(hertz) { this.oscillator.frequency.value = hertz; }

  get pitch() { return this.oscillator.frequency.value; }

  set gain(gain) { this._gain = gain; this.volume.gain.value = gainLinear(gain); }

  get gain() { return this._gain; }

  set rise(ms) { this.ask.rise = ms; }

  get rise() { return this.ask.rise; }

  set fall(ms) { this.ask.fall = ms; }

  get fall() { return this.ask.fall; }

  set envelope(env) { this.ask.envelope = env; }

  get envelope() { return this.ask.envelope; }

  set envelope2(env) { this.ask.envelope2 = env; }

  get envelope2() { return this.ask.envelope2; }

  get envelopes() { return this.ask.ramps; }

  set speed(v) { this.updateTiming('_speed', v); }

  get speed() { return this._speed; }

  set weight(v) { this.updateTiming('_weight', v); }

  get weight() { return this._weight; }

  set ratio(v) { this.updateTiming('_ratio', v); }

  get ratio() { return this._ratio; }
  
  set compensation(v) { this.updateTiming('_compensation', v); }

  get compensation() { return this._compensation; }

  set cursor(seconds) { this._cursor = seconds; }

  get cursor() { this._cursor = Math.max(this._cursor, this.currentTime); return this._cursor; }

  updateTiming(control, value) {
    // console.log(`updateTiming this[${control}] = ${value}`);
    this[control] = value;
    const dit = 60.0 / (this._speed * 50); // seconds/dit
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

  // straight key something on or off, right now
  set keyStraight(onOff) { this.key.offset.setValueAtTime(onOff ? 1 : 0, this.currentTime); }

  get keyStraight() { return this.key.offset.value === 1; }
  
  // play a dit or dah at the cursor
  // and the trailing inter-element space
  // return the cursor value at the end of the space
  keyElement(elen, slen) {
    this.keyOnAt(this.cursor);
    this.keyHoldFor(elen);
    this.keyOffAt(this.cursor);
    this.keyHoldFor(slen);
  }
  
  // schedule the key on at time
  keyOnAt(time) { this.key.offset.setValueAtTime(1, time); }

  // schedule the key off at the cursor
  keyOffAt(time) { this.key.offset.setValueAtTime(0, time); }

  // advance the cursor by seconds, effectively holdin the last scheduled key state for seconds
  keyHoldFor(seconds) { this.cursor += seconds; return this.cursor; }

  // cancel all scheduled key transitions
  cancel() {
    // console.log("cancel at ", this.currentTime);
    this.key.offset.cancelScheduledValues(this.currentTime);
    this.key.offset.value = 0;
  }
}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
