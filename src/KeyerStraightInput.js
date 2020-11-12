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

import { KeyerInputDelegate } from './KeyerInputDelegate.js';

export class KeyerStraightInput extends KeyerInputDelegate {

  constructor(context, input) {
    super(context, input);
    this.active = false;
    this.rawKeyOn = false;
    this.keyOn = false;
    this.bounceEnd = this.cur
    this.rampEnd = this.currentTime;
    this.input.on('end:ramp', () => this.keyset(this.rawKeyOn));
  }

  onfocus() { this.active = true; }

  onblur() { this.active = false; this.keyset(false); }

  keyset(on) {
    this.rawKeyOn = on;
    if (this.cursor < this.rampEnd) {
      // If we receive a new keystate while the previous keystate is
      // ramping up or down, we simply set the rawKeyOn and handle it
      // when the end:ramp event is received.
    } else if (this.rawKeyOn !== this.keyOn) {
      this.keyOn = this.rawKeyOn;
      if (this.keyOn) {
	this.rampEnd = this.cursor + 2*this.rise/1000.0;
	this.keyOnAt(this.cursor);
      } else {
	this.rampEnd = this.cursor + 2*this.fall/1000.0;
	this.keyOffAt(this.cursor);
      }
    }
  }

  keyEvent(type, onOff) { if (type === 'straight' && this.active) this.keyset(onOff); }

}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
