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

/* global currentTime, sampleRate */
class KeyerASKProcessor extends AudioWorkletProcessor {

  constructor() {
    super();
    this.keyOn = false;		// key off
    this.keyOut = 0;		// output value for this.keyOn
    this.ramping = false;	// not rising nor falling
    this.holding = false;	// holding key state beyond end of rise/fall
    this.holdCount = 0;		// samples remaining in hold
    this.ramp = null;		// the currently active ramp
    this.rampIndex = 0;		// index into ramp values
    this.rise = Float32Array.of(0.0, 1.0); // square rise ramp
    this.fall = Float32Array.of(1.0, 0.0); // square fall ramp
    this.hold = 1;			   // sample hold after ramp
    this.port.onmessage = (e) => this.onmessage(e);
    this.port.onmessageerror = (e) => this.onmessageerror(e);
    this.zeroes = new Float32Array(128);
  }
  
  onmessage(e) {
    // console.log(`KeyerASKProcessor message ${e}`);
    const [message, data] = e.data;
    switch (message) {
    case 'rise': this.rise = data; break;
    case 'fall': this.fall = data; break;
    // case 'hold': this.hold = Math.floor(data * sampleRate); break;
    default: console.log(`KeyerASKProcessor message? ${e.data}`); break;
    }
  }
  
  onmessageerror(e) {
    console.log(`KeyerASKProcessor message error ${e.data}`);
    this.messageError = e
  }

  process (inputs, outputs) {
    const output = outputs[0][0];
    const input = inputs[0][0] || this.zeroes;
    // man, this was really stupid
    // console.log(`process typeof(inputs[0][0]) = ${typeof(inputs[0][0])}`);
    // console.log(`process inputs ${inputs}`);
    // console.log(`process inputs[0] ${inputs[0]}`);
    // console.log(`process inputs[0][0] ${inputs[0][0]}`);
    // console.log(`process inputs[0][0][0] ${inputs[0][0][0]}`);
    // return false;
    for (let i = 0; i < output.length; i += 1) {
      if (this.ramping) {
	// slewing gain up or down
	// continue ramping input according to ramp
	output[i] = this.ramp[this.rampIndex];
	this.rampIndex += 1;
	if (this.rampIndex >= this.ramp.length) {
	  // end of ramp
	  this.port.postMessage([ this.keyOn ? 'end:rise' : 'end:fall', currentTime+i/sampleRate ]);
	  this.ramping = false;
	  this.ramp = null;
	  this.rampIndex = 0;
	  // start hold period
	  this.holding = true;
	  this.holdCount = this.hold;
	}
      } else {
	output[i] = this.keyOut;
	if (this.holding) {
	  this.holding = (this.holdCount -= 1) >= 0;
	} else if (this.keyOn !== (input[i] >= 1)) {
	  // transition
	  this.keyOn = ! this.keyOn;
	  this.keyOut = this.keyOn ? 1 : 0;
	  this.ramp = this.keyOn ? this.rise : this.fall;
	  this.port.postMessage([ 'transition', this.keyOut, currentTime+i/sampleRate ]);
	  this.ramping = true;
	  this.rampIndex = 0;
	}
      }
    }
    return true;
  }
}

registerProcessor('keyer-ask-processor', KeyerASKProcessor);
