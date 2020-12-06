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

// iambic keyer

/*
** This has been stripped down to the minimal iambic state machine
** from the AVR sources that accompany the article in QEX March/April
** 2012, and the length of the dah and inter-element-space has been
** made into configurable multiples of the dit clock.
**
** And then, I added element events to allow easy decoding.
*/
/*
 * newkeyer.c  an electronic keyer with programmable outputs
 * Copyright (C) 2012 Roger L. Traylor
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
// newkeyer.c
// R. Traylor
// 3.19.2012
// iambic keyer
// keyer states

const IDLE =     0;  // waiting for a paddle closure 
const DIT =      1;  // making a dit 
const DAH =      2;  // making a dah  
const DIT_DLY =  3;  // intersymbol delay, one dot time
const DAH_DLY =  4;  // intersymbol delay, one dot time

class KeyerPaddleNd7paProcessor extends AudioWorkletProcessor {

  constructor() {
    super();
    this.port.onmessage = (e) => this.onmessage(e);
    this.port.onmessageerror = (e) => this.onmessageerror(e);
    this.mode = 'B';
    this.keyerState = IDLE;  // the keyer state
    this.ditPending = false; // memory for dit seen while playing a dah
    this.dahPending = false; // memory for dah seen while playing a dit
    this.timer = 0;	     // seconds counting down to next decision
    this.zeroes = new Float32Array(128);
  }
  
  onmessage(e) {
    // console.log(`KeyerPaddleNd7paProcessor message ${e.data}`);
    const [message, ...data] = e.data;
    switch (message) {
    case 'timing': 
      [ this.perSample, this.perRawDit, this.perDit, this.perDah, this.perIes, this.perIls, this.perIws ] = data; 
      break;
    case 'mode': [this.mode] = data; break;
    default: console.log(`KeyerPaddleNd7paProcessor message? ${e.data}`); break;
    }
  }
  
  onmessageerror(e) {
    console.log(`KeyerPaddleNd7paProcessor message error ${e.data}`);
    this.messageError = e
  }

  process (inputs, outputs) {
    const output = outputs[0][0];
    const input0 = inputs[0][0] || this.zeroes;
    const input1 = inputs[1][0] || this.zeroes;
    for (let i = 0; i < output.length; i += 1) {
      output[i] = this.clock(input0[i] !== 0, input1[i] !== 0, this.perSample);
    }
    return true;
  }
  
  clock(ditOn, dahOn, ticks) {
    let keyOut = 0;

    // update timer
    this.timer -= ticks;
    const timerExpired = this.timer <= 0;

    // keyer state machine   
    if (this.keyerState === IDLE) {
      keyOut = 0;
      if (ditOn) {
	this.timer = this.perDit;
	this.keyerState = DIT
      } else if (dahOn) {
	this.timer = this.perDah;
	this.keyerState = DAH;
      }       
    } else if (this.keyerState === DIT) {
      keyOut = 1; 
      if ( timerExpired ) {
	this.timer = this.perIes;
	this.keyerState = DIT_DLY;
      }  
      if (this.mode === 'A' && !ditOn && !dahOn)
	this.dahPending = false;
    } else if (this.keyerState === DAH) {
      keyOut = 1; 
      if ( timerExpired ) {
	this.timer = this.perIes;
	this.keyerState = DAH_DLY;
      }  
      if (this.mode === 'A' && !ditOn && !dahOn)
	this.ditPending = false;
    } else if (this.keyerState === DIT_DLY) {
      keyOut = 0;  
      if ( timerExpired ) {
	if ( this.dahPending ) { 
	  this.timer = this.perDah;
	  this.keyerState = DAH;
	} else {
	  this.keyerState = IDLE;
	}
      }
    } else if (this.keyerState === DAH_DLY) {
      keyOut = 0; 
      if ( timerExpired ) {
        if ( this.ditPending ) {
	  this.timer = this.perDit; 
	  this.keyerState = DIT;
	} else {
	  this.keyerState = IDLE;
	}
      }
    }

    // not sure why these have these timing constraints, curtis mode B
    // would be (ditOn && (this.keyerState === DAH || this.keyerState === DAH_DLY))
    // *****************  dit pending state machine   *********************
    this.ditPending = this.ditPending ?
      this.keyerState !== DIT :
      (ditOn && ((this.keyerState === DAH) || (this.keyerState === DAH_DLY)));
      
    // ******************  dah pending state machine   *********************
    this.dahPending = this.dahPending ?
      this.keyerState !== DAH :
      (dahOn && ((this.keyerState === DIT) || (this.keyerState === DIT_DLY)));

    return keyOut;
  }
}

registerProcessor('keyer-paddle-nd7pa-processor', KeyerPaddleNd7paProcessor);
