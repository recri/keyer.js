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

// audio shift keying worklet
// build and communicate rise / fall ramps to processor

import { KeyerRamp } from './KeyerRamp.js';

export class KeyerASKWorklet extends AudioWorkletNode {

  constructor(context, name) {
    super(context, name);
    this.sampleRate = context.sampleRate;
    this.port.onmessage = (e) => this.onmessage(e);
    this.port.onmessageerror = (e) => this.onmessageerror(e);
    this.onprocessorerror = (e) => this.onprocessorerror(e);
    this._envelope = 'hann';
    this._envelope2 = 'rectangular';
    this._rise = 4;
    this._ramps = KeyerRamp.ramps();
    this._update('_fall', 4, true, true);
  }

  onmessage(e) {
    console.log(`KeyerASKWorklet message '${e}'`);
    this.message = e;
  }

  onmessageerror(e) {
    console.log(`KeyerASKWorklet messageerror '${e}'`);
    this.messageError = e;
  }

  onprocessorerror(e) {
    console.log(`KeyerASKWorklet processorerror '${e}'`);
    this.processorError = e;
  }

  _update(prop, val, riseChanges, fallChanges) {
    this[prop] = val;
    if (riseChanges) {
      const n = Math.floor((this.rise / 1000.0) * this.sampleRate);
      const rise = new Float32Array(n);
      for (let i = 0; i < n; i += 1)
	rise[i] = KeyerRamp.rise2(this.envelope, this.envelope2, n-1, i);
      console.log(`riseChanges ${this.rise} rise time ${this.sampleRate} samples/sec makes ${n} samples, first ${rise[0]}, last ${rise[n-1]}`);
      this.port.postmessage(['rise', rise]);
    }
    if (fallChanges) {
      const n = Math.floor((this.fall / 1000.0) * this.sampleRate);
      const fall = new Float32Array(n);
      for (let i = 0; i < n; i += 1)
	fall[i] = KeyerRamp.fall(this.envelope, this.envelope2, n-1, i);
      console.log(`fallChanges ${this.fall} fall time ${this.sampleRate} samples/sec makes ${n} samples, first ${fall[0]}, last ${fall[n-1]}`);
      this.port.postmessage(['fall', fall]);
    }
  }
  
  set envelope(v) { this._update('_envelope', v, true, true); }
  
  get envelope() { return this._envelope; }

  set envelope2(v) { this._update('_envelope2', v, true, true); }

  get envelope2() { return this._envelope2; }

  set rise(v) { this._update('_rise', v, true, false); }

  get rise() { return this._rise; }

  set fall(v) { this._update('_fall', v, false, true); }

  get fall() { return this._fall; }

  get ramps() { return this._ramps; }
		
}


