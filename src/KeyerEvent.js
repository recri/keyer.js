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
export class KeyerEvent {

  constructor(audioContext) {
    this.context = audioContext;
    this.events = [];
  }

  // delegate to context
  
  get currentTime() { return this.context.currentTime; }

  get sampleRate() { return this.context.sampleRate; }

  get baseLatency() { return this.context.baseLatency; }
  
  /**
   *  on: listen to events
   */
  on(type, func) {
    // console.log(`on ${type} ${func}`);
    (this.events[type] = this.events[type] || []).push(func);
  }

  /**
   *  Off: stop listening to event / specific callback
   */
  off(type, func) {
    // console.log('off', type, func);
    if (!type) this.events = [];
    const list = this.events[type] || [];
    let i = func ? list.length : 0;
    while (i > 0) {
      i -= 1;
      if (func === list[i]) list.splice(i, 1);
    }
  }

  /**
   * Emit: send event, callbacks will be triggered
   */
  emit(type, ...args) {
    const list = this.events[type] || [];
    // console.log(`emit '${type}' (${args}) listeners ${list.length}`);
    list.forEach(f => f.apply(window, args));
  }

  /**
   * After: fire an event at some seconds into the future.
   * using the web audio sample timer.
   */
  after(dtime, func) { this.when(this.currentTime+dtime, func); }
    
  /**
   * When: fire an event at a specified time.
   * using the web audio sample timer.
   */
  when(time, func) {
    const timer = this.context.createConstantSource();
    timer.onended = func;
    timer.start();
    timer.stop(Math.max(time,this.currentTime+1/this.sampleRate));
  }

}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
