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
import { KeyerNd7paKeyer } from './KeyerNd7paKeyer.js';
import { KeyerVk6phKeyer } from './KeyerVk6phKeyer.js';

export class KeyerIambicInput extends KeyerInputDelegate {

  constructor(context, input, keyer) {
    super(context, input);
    switch (keyer) {
    case 'nd7pa-a': this.keyer = new KeyerNd7paKeyer(context, input, 'A'); break;
    case 'nd7pa-b': this.keyer = new KeyerNd7paKeyer(context, input, 'B'); break;
    case 'vk5ph-a': this.keyer = new KeyerVk6phKeyer(context, input, 'A'); break;
    case 'vk6ph-b': this.keyer = new KeyerVk6phKeyer(context, input, 'B'); break;
    case 'vk6ph-s': this.keyer = new KeyerVk6phKeyer(context, input, 'S'); break;
    default:	    this.keyer = new KeyerNd7paKeyer(context, input, 'B'); break;
    }
    this.input.on('change:timing', () => this.changeTiming());
    this.ditOn = false;
    this.dahOn = false;
    this.tick = 0.1;		// timer, 1/16 dit, updated in changeTiming
    this.running = false;
    this.lastTick = this.currentTime;
    this.changeTiming();
  }
  
  // change timing, update the clock timer
  changeTiming() { this.tick = this.perRawDit/16; }

  startClock() {
    this.lastTick = this.currentTime;
    this.running = true;
    this.startTick();
  }

  stopClock() { this.running = false; }

  endTick() {
    this.clock();
    if (this.running) this.startTick();
  }

  startTick() { this.after(this.tick, () => this.endTick()); }

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
      this.ditOn = on;
      this.input.emit('key:dit', on, this.currentTime);
    } else {
      this.dahOn = on;
      this.input.emit('key:dah', on, this.currentTime);
    }
    this.clock();
  }

  clock() {
    const time = this.currentTime;
    const tick = time-this.lastTick;
    this.keyer.clock(this.ditOn, this.dahOn, tick);
    this.lastTick = time;
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
