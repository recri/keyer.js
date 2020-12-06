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

    10/12/2016, Rick Koch / N1GP, I adapted Phil's verilog code from
                the openHPSDR Hermes iambic.v implementation to build
                and run on a raspberry PI 3.

    1/7/2017,   N1GP, adapted to work with Jack Audio, much better timing.

    8/3/2018,   Roger Critchlow / AD5DZ/1, I adapted Rick's adaptation to
		run when clocked at specified microseconds per tick, as
		necessary when running inside a jack frame processor callback.
		Rick's code from https://github.com/n1gp/iambic-keyer
--------------------------------------------------------------------------------
This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Library General Public
License as published by the Free Software Foundation; either
version 2 of the License, or (at your option) any later version.
This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Library General Public License for more details.
You should have received a copy of the GNU Library General Public
License along with this library; if not, write to the
Free Software Foundation, Inc., 51 Franklin St, Fifth Floor,
Boston, MA  02110-1301, USA.
--------------------------------------------------------------------------------


---------------------------------------------------------------------------------
        Copywrite (C) Phil Harman VK6PH May 2014
---------------------------------------------------------------------------------

        The code implements an Iambic CW keyer.  The following features are supported:

                * Variable speed control from 1 to 60 WPM
                * Dot and Dash memory
                * Straight, Bug, Iambic Mode A or B Modes
                * Variable character weighting
                * Automatic Letter spacing
                * Paddle swap

        Dot and Dash memory works by registering an alternative paddle closure whilst a paddle is pressed.
        The alternate paddle closure can occur at any time during a paddle closure and is not limited to being
        half way through the current dot or dash. This feature could be added if required.

        In Straight mode, closing the DASH paddle will result in the output following the input state.  This enables a
        straight morse key or external Iambic keyer to be connected.

        In Bug mode closing the dot paddle will send repeated dots.

        The difference between Iambic Mode A and B lies in what the keyer does when both paddles are released. In Mode A the
        keyer completes the element being sent when both paddles are released. In Mode B the keyer sends an additional
        element opposite to the one being sent when the paddles are released.

        This only effects letters and characters like C, period or AR.

        Automatic Letter Space works as follows: When enabled, if you pause for more than one dot time between a dot or dash
        the keyer will interpret this as a letter-space and will not send the next dot or dash until the letter-space time has been met.
        The normal letter-space is 3 dot periods. The keyer has a paddle event memory so that you can enter dots or dashes during the
        inter-letter space and the keyer will send them as they were entered.

        Speed calculation -  Using standard PARIS timing, dot_period(mS) = 1200/WPM
*/

/* eslint no-bitwise: ["error", { "allow": ["|="] }] */
const CHECK = 0;
const PREDOT = 1;
const PREDASH = 2;
const SENDDOT = 3;
const SENDDASH = 4;
const DOTDELAY = 5;
const DASHDELAY = 6;
const DOTHELD = 7;
const DASHHELD = 8;
const LETTERSPACE = 9;

const KEYER_STRAIGHT = 'S';
const KEYER_MODE_A = 'A';
const KEYER_MODE_B = 'B';

class KeyerPaddleVk6phProcessor extends AudioWorkletProcessor {

  constructor() {
    super();
    this.port.onmessage = (e) => this.onmessage(e);
    this.port.onmessageerror = (e) => this.onmessageerror(e);

    this.dotMemory = 0;
    this.dashMemory = 0;
    this.keyState = CHECK;
    this.kdelay = 0;
    this.dotDelay = 0;
    this.dashDelay = 0;
    this.kdot = 0;
    this.kdash = 0;
    this.mode = KEYER_MODE_B;
    this.spacing = 0;
    this.keyerOut = 0;

    this.zeroes = new Float32Array(128);
  }
  
  onmessage(e) {
    // console.log(`KeyerPaddleVk6phProcessor message ${e}`);
    const [message, ...data] = e.data;
    switch (message) {
    case 'timing': 
      [ this.perSample, this.perRawDit, this.perDit, this.perDah, this.perIes, this.perIls, this.perIws ] = data; 
      break;
    case 'mode': [this.mode] = data; break;
    default: console.log(`KeyerPaddleVk6phProcessor message? ${e.data}`); break;
    }
  }
  
  onmessageerror(e) {
    console.log(`KeyerPaddleVk6phProcessor message error ${e.data}`);
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
  
  clock(kdot, kdash, ticks) {
    this.kdelay += ticks;
    switch(this.keyState) {
    case CHECK:		// check for key press
      if (this.mode === KEYER_STRAIGHT) { // Straight/External key or bug
	if (kdash) {	// send manual dashes
	  this.keyerOut = 1;
	  this.keyState = CHECK;
	} else if (kdot)	// and automatic dots
	  this.keyState = PREDOT;
	else {
	  this.keyerOut = 0;
	  this.keyState = CHECK;
	}
      } else if (kdot)
	this.keyState = PREDOT;
      else if (kdash)
	this.keyState = PREDASH;
      else {
	this.keyerOut = 0;
	this.keyState = CHECK;
      }
      break;
    case PREDOT:	   // need to clear any pending dots or dashes
      this.keyState = SENDDOT;
      this.kdelay = 0;
      this.dotMemory = 0;
      this.dashMemory = 0;
      break;
    case PREDASH:
      this.keyState = SENDDASH;
      this.kdelay = 0;
      this.dotMemory = 0;
      this.dashMemory = 0;
      break;
      // dot paddle  pressed so set this.keyerOut high for time dependant on speed
      // also check if dash paddle is pressed during this time
    case SENDDOT:
      this.keyerOut = 1;
      if (this.kdelay >= this.perDit) {
	this.kdelay = 0;
	this.keyerOut = 0;
	this.keyState = DOTDELAY; // add inter-character spacing of one dot length
      }
      // if Mode A and both paddels are relesed then clear dash memory
      if (!kdot && !kdash) {
	if (this.mode === KEYER_MODE_A)
	  this.dashMemory = 0;
      } else 
	this.dashMemory |= kdash;	// set dash memory
      break;
      // dash paddle pressed so set this.keyerOut high for time dependant on 3 x dot delay and weight
      // also check if dot paddle is pressed during this time
    case SENDDASH:
      this.keyerOut = 1;
      if (this.kdelay >= this.perDah) {
	this.kdelay = 0;
	this.keyerOut = 0;
	this.keyState = DASHDELAY; // add inter-character spacing of one dot length
      }
      // if Mode A and both padles are relesed then clear dot memory
      if (!kdot && !kdash) {
	if (this.mode === KEYER_MODE_A)
	  this.dotMemory = 0;
      } else
	this.dotMemory |= kdot;	// set dot memory
      break;
      // add dot delay at end of the dot and check for dash memory, then check if paddle still held
    case DOTDELAY:
      if (this.kdelay >= this.perIes) {
	if(!kdot && this.mode === KEYER_STRAIGHT)   // just return if in bug mode
	  this.keyState = CHECK;
	else if (this.dashMemory) // dash has been set during the dot so service
	  this.keyState = PREDASH;
	else 
	  this.keyState = DOTHELD; // dot is still active so service
      }
      this.dashMemory = kdash;	// set dash memory
      break;
    case DASHDELAY: // add dot delay at end of the dash and check for dot memory, then check if paddle still held
      if (this.kdelay >= this.perIes) {
	if (this.dotMemory) // dot has been set during the dash so service
	  this.keyState = PREDOT;
	else 
	  this.keyState = DASHHELD; // dash is still active so service
      }
      this.dotMemory = kdot;	// set dot memory 
      break;
    case DOTHELD: // check if dot paddle is still held, if so repeat the dot. Else check if Letter space is required
      if (kdot)	// dot has been set during the dash so service
	this.keyState = PREDOT;
      else if (kdash)	// has dash paddle been pressed
	this.keyState = PREDASH;
      else if (this.spacing) { // Letter space enabled so clear any pending dots or dashes
	this.dotMemory = 0;
	this.dashMemory = 0;
	this.kdelay = 0;
	this.keyState = LETTERSPACE;
      } else
	this.keyState = CHECK;
      break;
    case DASHHELD: // check if dash paddle is still held, if so repeat the dash. Else check if Letter space is required
      if (kdash)   // dash has been set during the dot so service
	this.keyState = PREDASH;
      else if (kdot)		// has dot paddle been pressed
	this.keyState = PREDOT;
      else if (this.spacing) { // Letter space enabled so clear any pending dots or dashes
	this.dotMemory = 0;
	this.dashMemory = 0;
	this.kdelay = 0;
	this.keyState = LETTERSPACE;
      } else
	this.keyState = CHECK;
      break;
    case LETTERSPACE: // Add remainder of letter space (3 x dot delay) to end of character and check if a paddle is pressed during this time.
      if (this.kdelay >= this.perIls-this.perIes) {
	if (this.dotMemory) // check if a dot or dash paddle was pressed during the delay.
	  this.keyState = PREDOT;
	else if (this.dashMemory)
	  this.keyState = PREDASH;
	else
	  this.keyState = CHECK; // no memories set so restart
      }
      // save any key presses during the letter space delay
      this.dotMemory |= kdot;
      this.dashMemory |= kdash;
      break;
    default:
      this.keyState = CHECK;
      break;
    }
    
    return this.keyerOut;
  }

}

registerProcessor('keyer-paddle-vk6ph-processor', KeyerPaddleVk6phProcessor);
