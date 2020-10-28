import { KeyerTimer } from './KeyerTimer.js';

// keyer states
const IDLE = 0; // waiting for a paddle closure
const DIT = 1; // making a dit or the space after
const DAH = 2; // making a dah or the space after

// translate iambic paddle events into keyup/keydown events
export class KeyerIambicKeyer extends KeyerTimer {
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

  constructor(context) {
    super(context);
    // state variables
    this.keyerState = IDLE; // the keyer state
    this.ditPending = false; // memory for dit seen while playing a dah
    this.dahPending = false; // memory for dah seen while playing a dit
    this.timer = 0; // seconds counting down to next decision

    // parameters
    this._swapped = false; // true if paddles are swapped

    // timer, 1/4 dit of samples
    this._buffer = null;
    this._source = null;
    this._running = false;

    this.rawDitOn = false;
    this.rawDahOn = false;
    this.lastTick = this.context.currentTime;

    this.on('updateTiming', this.updateTimerBuffer, this)
  }

  // update the clock timer
  updateTimerBuffer() {
    this._buffer = this.context.createBuffer(
      1,
      Math.floor((this.context.sampleRate * this._perRawDit) / 4),
      this.context.sampleRate
    );
  }

  startClock() {
    // console.log("start_clock");
    this.lastTick = this.context.currentTime;
    this._running = true;
    this.startTick();
  }

  stopClock() {
    // console.log("stop_clock");
    this._running = false;
    if (this._source) this._source.stop();
  }

  restartClock() {
    // console.log("restart_clock");
    this.stopClock();
    this.startClock();
  }

  endTick() {
    this._source = null;
    this.clock();
    if (this._running) this.startTick();
  }

  startTick() {
    this._source = this.context.createBufferSource();
    this._source.buffer = this._buffer;
    this._source.onended =  () => this.endTick();
    this._source.connect(this.context.destination); // not sure why I needed this, but it doesn't help
    this._source.start();
  }

  transition(state, len) {
    // emit a space
    if (this.keyerState === IDLE) {
      if (this.timer > -((this._perIes + this._perIls) / 2 - this._perIes)) {
        // the timer has not reached the boundary between ies and ils
        this.emit('element', '', this.cursor);
      } else if (
        this.timer > -((this._perIls + this._perIws) / 2 - this._perIes)
      ) {
        // the timer has not reached the boundary between ils and iws
        this.emit('element', ' ', this.cursor);
      } else {
        // the timer has reached the iws boundary
        this.emit('element', '\t', this.cursor);
      }
      this.restartClock();
    } else {
      this.emit('element', '', this.cursor);
    }

    // emit the element itself
    this.emit('element', state === DIT ? '.' : '-', this.cursor + len);

    // mark the new state
    this.keyerState = state;

    // reset the timer, count down to length of element plus inter-element space
    if (this.timer < 0) this.timer = 0;
    this.timer += len + this._perIes;

    // schedule the element and the inter-element space
    const time = this.cursor;
    this.keyOnAt(time);
    this.keyOffAt(time + len);
    this.keyHoldFor(this._perIes);
  }

  clock() {
    const ditOn = this._swapped ? this.rawDahOn : this.rawDitOn;
    const dahOn = this._swapped ? this.rawDitOn : this.rawDahOn;

    // compute time
    const now = this.context.currentTime;
    const ticks = now - this.lastTick;
    this.lastTick = now;

    // console.log("clock dit", dit_on, "dah", dah_on, "ticks", ticks);

    // update timer
    this.timer -= ticks;

    // keyer state machine
    if (this.keyerState === IDLE) {
      if (ditOn) this.transition(DIT, this._perDit);
      else if (dahOn) this.transition(DAH, this._perDah);
    } else if (this.timer <= this._perIes / 2) {
      if (this.keyerState === DIT) {
        if (this.dahPending || dahOn) this.transition(DAH, this._perDah);
        else if (this.ditOn) this.transition(DIT, this._perDit);
        else this.keyerState = IDLE;
      } else if (this.keyerState === DAH) {
        if (this.ditPending || ditOn) this.transition(DIT, this._perDit);
        else if (this.dahOn) this.transition(DAH, this._perDah);
        else this.keyerState = IDLE;
      }
    }

    // *****************  dit pending state machine   *********************
    this.ditPending = this.ditPending
      ? this.keyerState !== DIT
      : ditOn &&
        this.keyerState === DAH &&
        this.timer < this._perDah / 3 + this._perIes;

    // ******************  dah pending state machine   *********************
    this.dahPending = this.dahPending
      ? this.keyerState !== DAH
      : dahOn &&
        this.keyerState === DIT &&
        this.timer < this._perDit / 2 + this._perIes;
  }

  // swap the dit and dah paddles
  set swapped(swapped) { this._swapped = swapped; }

  get swapped() { return this._swapped; }

}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
