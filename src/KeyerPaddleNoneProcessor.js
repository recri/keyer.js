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

// audio shift keying processor
// convert stream of 0's and 1's on input
// into gain stream for an oscillator
// smoothly ramp on, on, ramp off, off

class KeyerPaddleNoneProcessor extends AudioWorkletProcessor {

  constructor() {
    super();
    this.port.onmessage = (e) => this.onmessage(e);
    this.port.onmessageerror = (e) => this.onmessageerror(e);
    this.mode = 'B';
    this.zeroes = new Float32Array(128);
  }
  
  onmessage(e) {
    // console.log(`KeyerPaddleNoneProcessor message ${e}`);
    const [message, ...data] = e.data;
    switch (message) {
    case 'timing': [ this.perSample, this.perRawDit, this.perDit, this.perDah, this.perIes, this.perIls, this.perIws ] = data; break;
    case 'mode': [this.mode] = data; break;
    default: console.log(`KeyerPaddleNoneProcessor message? ${e.data}`); break;
    }
  }
  
  onmessageerror(e) {
    console.log(`KeyerPaddleNoneProcessor message error ${e.data}`);
    this.messageError = e
  }

  process (inputs, outputs) {
    const output = outputs[0][0];
    const input0 = inputs[0][0] || this.zeroes;
    const input1 = inputs[1][0] || this.zeroes;
    for (let i = 0; i < output.length; i += 1) {
      output[i] = KeyerPaddleNoneProcessor.clock(input0[i] !== 0, input1[i] !== 0, this.perSample);
    }
    return true;
  }
  
  static clock(dit, dah /* , tick */) {
    return dit || dah ? 1 : 0;
  }
}

registerProcessor('keyer-paddle-none-processor', KeyerPaddleNoneProcessor);
