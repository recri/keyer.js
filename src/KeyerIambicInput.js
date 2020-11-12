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
import { KeyerIambicKeyer } from './KeyerIambicKeyer.js';

export class KeyerIambicInput extends KeyerIambicKeyer {

  constructor(context, input) {
    super(context, input);
    this.rawDitOn = false;
    this.rawDahOn = false;
  }
  
  // handlers for focus and key events
  onfocus() { this.start(); }

  onblur() { this.stop(); }

  keyEvent(type, onOff) {
    if (type === 'left') this.keyset(true, onOff);
    if (type === 'right') this.keyset(false, onOff);
  }

  // common handlers
  keyset(key, on) {
    // console.log(`iambic ${key}, ${on}`);
    if (key) {
      this.rawDitOn = on;
      this.input.emit('key:dit', on, this.currentTime);
    } else {
      this.rawDahOn = on;
      this.input.emit('key:dah', on, this.currentTime);
    }
    this.clock();
  }

  start() { this.startClock(); }

  stop() {
    this.rawDitOn = false;
    this.rawDahOn = false;
    this.clock();
    this.cancel();
    this.stopClock();
  }

}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
