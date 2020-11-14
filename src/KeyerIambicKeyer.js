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

import { KeyerInputDelegate } from './KeyerInputDelegate.js';

// keyer states
const IDLE = 0; // waiting for a paddle closure
const DIT = 1; // making a dit or the space after
const DAH = 2; // making a dah or the space after

// translate iambic paddle events into keyup/keydown events
export class KeyerIambicKeyer extends KeyerInputDelegate {

  constructor(context, input) {
    super(context, input);
    // state variables
    this.keyerState = IDLE; // the keyer state
    this.ditPending = false; // memory for dit seen while playing a dah
    this.dahPending = false; // memory for dah seen while playing a dit
    this.timer = 0; // seconds counting down to next decision
    this.modeB = true;

    // timer, 1/4 dit of samples
    this._tick = 0.1;
    this._running = false;

    this.rawDitOn = false;
    this.rawDahOn = false;
    this.lastTick = this.currentTime;

    this.input.on('change:timing', () => this.changeTiming());
  }

  // update the clock timer
  changeTiming() { this._tick = this.perRawDit/4; }

  startClock() {
    // console.log("start_clock");
    this.lastTick = this.currentTime;
    this._running = true;
    this.startTick();
  }

  stopClock() {
    // console.log("stop_clock");
    this._running = false;
  }

  restartClock() {
    // console.log("restart_clock");
    this.stopClock();
    this.startClock();
  }

  endTick() {
    this.clock();
    if (this._running) this.startTick();
  }

  startTick() { 
    this.after(this._tick, () => this.endTick());
  }

  transition(state, len) {
    // emit a space
    if (this.keyerState === IDLE) {
      if (this.timer > -((this.perIes + this.perIls) / 2 - this.perIes)) {
        // the timer has not reached the boundary between ies and ils
        this.input.emit('element', '', this.cursor);
      } else if (
        this.timer > -((this.perIls + this.perIws) / 2 - this.perIes)
      ) {
        // the timer has not reached the boundary between ils and iws
        this.input.emit('element', ' ', this.cursor);
      } else {
        // the timer has reached the iws boundary
        this.input.emit('element', '\t', this.cursor);
      }
      this.restartClock();
    } else {
      this.input.emit('element', '', this.cursor);
    }

    // emit the element itself
    this.input.emit('element', state === DIT ? '.' : '-', this.cursor + len);

    // mark the new state
    this.keyerState = state;

    // reset the timer, count down to length of element plus inter-element space
    if (this.timer < 0) this.timer = 0;
    this.timer += len + this.perIes;

    // schedule the element and the inter-element space
    // this could simply be keyOn,holdFor,keyOff,holdFor
    // all at the cursor
    this.keyElement(len, this.perIes);
  }

  clock() {
    const ditOn = this.rawDitOn;
    const dahOn = this.rawDahOn;

    // compute time
    const now = this.currentTime;
    const ticks = now - this.lastTick;
    this.lastTick = now;

    // console.log("clock dit", dit_on, "dah", dah_on, "ticks", ticks);

    // update timer
    this.timer -= ticks;

    // keyer state machine
    if (this.keyerState === IDLE) {
      // from IDLE start a dit or a dah
      if (ditOn) this.transition(DIT, this.perDit);
      else if (dahOn) this.transition(DAH, this.perDah);
    } else if (this.timer <= this.perIes / 2) {
      // halfway through the interelement space
      // decide and schedule the next element
      if (this.keyerState === DIT) {
	// finishing a DIT, then do a DAH, or another DIT, or IDLE
        if (this.dahPending || dahOn) this.transition(DAH, this.perDah);
        else if (this.ditOn) this.transition(DIT, this.perDit);
        else this.keyerState = IDLE;
      } else if (this.keyerState === DAH) {
	// finishing a DAH, then do a DIT, or another DAH, or IDLE
        if (this.ditPending || ditOn) this.transition(DIT, this.perDit);
        else if (this.dahOn) this.transition(DAH, this.perDah);
        else this.keyerState = IDLE;
      }
    }

    if (this.modeB) {
      // *****************  dit pending state machine   *********************
      this.ditPending = this.ditPending
	? this.keyerState !== DIT
	: ditOn &&
        this.keyerState === DAH &&
        this.timer < this.perDah / 3 + this.perIes;

      // ******************  dah pending state machine   *********************
      this.dahPending = this.dahPending
	? this.keyerState !== DAH
	: dahOn &&
        this.keyerState === DIT &&
        this.timer < this.perDit / 2 + this.perIes;
    }
  }

}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
