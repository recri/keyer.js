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

/*
  Copyright (C) 2018 by Roger E Critchlow Jr, Charlestown, MA, USA.

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307 USA
*/

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

/* eslint no-nested-ternary: "warn" */
/* eslint no-multi-assign: "warn" */
/* eslint no-lonely-if: "warn" */
/* eslint no-continue: "warn" */

import { KeyerInputDelegate } from './KeyerInputDelegate.js';

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
// const KEYER_MODE_B = 'B';

export class KeyerVk6phKeyer extends KeyerInputDelegate {

  constructor(context, input, mode) {
    super(context, input);
    this.dotMemory = false;
    this.dashMemory = false;
    this.keyState = CHECK;
    this.kdelay = 0;
    this.cwKeyerMode = mode;
    this.cwKeyerSpacing = true;
    this.keyerOut = false;
    this.changeTiming()
    this.input.on('change:timing', () => this.changeTiming());
  }
  
  get dotDelay() { return this.perDit; }

  get dashDelay() { return this.perDah; }
  
  clock(ditOn, dahOn, ticks) {
    
    this.kdelay += ticks;

    while (this.kdelay >= 0) {
      switch(this.keyState) {
      case CHECK:		// check for key press
	if (this.cwKeyerMode === KEYER_STRAIGHT) { // Straight/External key or bug
	  if (dahOn) {	// send manual dashes
	    if ( ! this.keyerOut) {
	      this.keyerOut = true;
	      // keyOn, holdFor
	      // this.keyState = CHECK;
	    }
	  } else if (ditOn) {	// and automatic dots
	    this.keyState = PREDOT;
	    continue;
	  } else {
	    if (this.keyerOut) {
	      this.keyerOut = false; 
	      // keyOff, holdFor ies
	      this.keyState = DOTDELAY;
	      this.kdelay = 0;
	      continue;
	    }
	    this.keyState = CHECK;
	  }
	} else {
	  if (ditOn) {
	    this.keyState = PREDOT;
	    continue;
	  } else if (dahOn) {
	    this.keyState = PREDASH;
	    continue;
	  } else {
	    this.keyerOut = false;
	    this.keyState = CHECK;
	  }
	}
	return;
      case PREDOT:	   // need to clear any pending dots or dashes
	this.keyState = SENDDOT;
	this.dotMemory = this.dashMemory = false;
	this.element(this.perDit);
	this.kdelay = 0;
	continue;
      case PREDASH:
	this.keyState = SENDDASH;
	this.dotMemory = this.dashMemory = false;
	this.element(this.perDah);
	this.kdelay = 0;
	continue;
	// dot paddle  pressed so set keyer_out high for time dependant on speed
	// also check if dash paddle is pressed during this time
      case SENDDOT:
	this.keyerOut = true;
	if (this.kdelay >= this.perDit) {
	  this.kdelay -= this.perDit;
	  this.keyerOut = false;
	  this.keyState = DOTDELAY; // add inter-character spacing of one dot length
	  continue;
	}
	// if Mode A and both paddles are released then clear dash memory
	if (!ditOn && !dahOn) {
	  if (this.cwKeyerMode === KEYER_MODE_A)
	    this.dashMemory = false;
	} else
	  this.dashMemory ||= dahOn;	// set dash memory
	return;
	// dash paddle pressed so set keyer_out high for time dependant on 3 x dot delay and weight
	// also check if dot paddle is pressed during this time
      case SENDDASH:
	this.keyerOut = true;
	if (this.kdelay >= this.perDah) {
	  this.kdelay -= this.perDah;
	  this.keyerOut = false;
	  this.keyState = DASHDELAY; // add inter-character spacing of one dot length
	  continue;
	}
	// if Mode A and both paddles are relesed then clear dot memory
	if (!ditOn && !dahOn) {
	  if (this.cwKeyerMode === KEYER_MODE_A)
	    this.dotMemory = false;
	} else
	  this.dotMemory ||= ditOn;	// set dot memory
	return;
	// add dot delay at end of the dot and check for dash memory, then check if paddle still held
      case DOTDELAY:
	if (this.kdelay >= this.perIes) {
	  this.kdelay -= this.perIes;
	  if(!ditOn && this.cwKeyerMode === KEYER_STRAIGHT)   // just return if in bug mode
	    this.keyState = CHECK;			    // should goto top
	  else if (this.dashMemory) // dash has been set during the dot so service
	    this.keyState = PREDASH;
	  else 
	    this.keyState = DOTHELD; // dot is still active so service
	  continue;
	}
	this.dashMemory = dahOn;	// set dash memory
	return;
      case DASHDELAY: // add dot delay at end of the dash and check for dot memory, then check if paddle still held
	if (this.kdelay >= this.perIes) {
	  this.kdelay -= this.perIes
	  if (this.dotMemory) // dot has been set during the dash so service
	    this.keyState = PREDOT;
	  else 
	    this.keyState = DASHHELD; // dash is still active so service
	  continue;
	}
	this.dotMemory = ditOn;	// set dot memory 
	return;
      case DOTHELD: // check if dot paddle is still held, if so repeat the dot. Else check if Letter space is required
	if (ditOn)  // dot has been set during the dash so service
	  this.keyState = PREDOT;
	else if (dahOn)		// has dash paddle been pressed
	  this.keyState = PREDASH;
	else if (this.cwKeyerSpacing) { // Letter space enabled so clear any pending dots or dashes
	  this.dotMemory = this.dashMemory = false;
	  this.keyState = LETTERSPACE;
	} else
	  this.keyState = CHECK;
	continue;
      case DASHHELD: // check if dash paddle is still held, if so repeat the dash. Else check if Letter space is required
	if (dahOn)   // dash has been set during the dot so service
	  this.keyState = PREDASH;
	else if (ditOn)		// has dot paddle been pressed
	  this.keyState = PREDOT;
	else if (this.cwKeyerSpacing) { // Letter space enabled so clear any pending dots or dashes
	  this.dotMemory = this.dashMemory = false;
	  this.keyState = LETTERSPACE;
	} else
	  this.keyState = CHECK;
	continue;
      case LETTERSPACE: // Add remainder of letter space (3 x dot delay) to end of character and check if a paddle is pressed during this time.
	if (this.kdelay >= this.perIls-this.perIes) {
	  if (this.dotMemory) // check if a dot or dash paddle was pressed during the delay.
	    this.keyState = PREDOT;
	  else if (this.dashMemory)
	    this.keyState = PREDASH;
	  else
	    this.keyState = CHECK; // no memories set so restart
	  continue;
	}
	// save any key presses during the letter space delay
	this.dotMemory ||= ditOn;
	this.dashMemory ||= dahOn;
	return;
      default:
	this.keyState = CHECK;
	return;
      }
    }
  }

  element(len) {
    const time = this.cursor;
    this.keyOnAt(time);
    this.keyOffAt(time + len);
    this.keyHoldFor(this.perIes);
  }

}
