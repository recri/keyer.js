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
import { KeyerTable } from './KeyerTable.js';
import { KeyerPlayer } from './KeyerPlayer.js';

// translate text into keyed sidetone
// extends the oscillator with a code table and timings for the elements of the code
export class KeyerOutput extends KeyerPlayer {

  constructor(context) {
    super(context);
    // translation table
    this.table = new KeyerTable();
    // initialize the pending queue
    this.idle = true;
    this.pending = [];
    this.skipped = [];
    this.lastch = null;
  }

  unsend() { const chr = this.pending.pop(); this.emit('unsent', chr); }

  send(ch) {
    // console.log(`output send '${ch}' idle ${this.idle} pending.length ${this.pending.length}`);
    // this.dumpProperties();
    this.pending.push(ch);
    if (this.idle) this.sendPending();
  }

  sendPending() {
    // console.log(`sendPending lastch '${this.lastch}' pending ${this.pending.length}`);
    if (this.lastch !== null) 
      this.emit('sent', this.lastch);
    if (this.pending.length === 0) {
      if (this.skipped.length > 0) {
	// console.log(`cancelPending skipping ${skipped.length} characters`);
	this.skipped.forEach(ch => this.emit('skipped', ch));
	this.skipped = [];
      }
      this.idle = true;
      this.lastch = null;
      return;
    }
    // not apparently idle, 
    // but probably a race here
    this.idle = false;
    const ch = this.pending.shift();
    if (ch === ' ' || ch === '\t' || ch === "\n") {
      // inter-word space
      if (this.lastch === ' ' || this.lastch === '\t' || this.lastch === "\n") {
	// repeated inter-word space
	this.emit('element', '\t', this.keyHoldFor(this.perIws));
      } else {
	// inter-word space after character
	// reduce by inter-letter space already queued
	this.emit('element', '\t', this.keyHoldFor(this.perIws-this.perIls));
      }
    } else {
      // translate character to dits and dahs and trailing inter-letter space
      // time starts at cursor could all be cursor
      for (const c of this.table.encode(ch).split('')) {
	if (c === '.') { 	// send a dit
	  const t = this.keyElement(this.perDit, this.perIes);
	  this.emit('element', '.', t-this.perIes)
	  this.emit('element', '', t);
	} else if (c === '-') {	// send a dah
	  const t = this.keyElement(this.perDah, this.perIes);
	  this.emit('element', '-', t-this.perIes)
	  this.emit('element', '', t);
	} else if (c === ' ') {
	  // reduce by inter-element space already queued
	  const t = this.keyHoldFor(this.perIls-this.perIes);
	  this.emit('element', ' ', t);
	} else {
	  console.log(`why is {$c} in the code table for ${ch}?`);
	}
      }
    }
    this.lastch = ch
    this.emit('sending', ch);
    this.when(this.cursor-this.perDah, () => this.sendPending());
  }

  cancelPending() {
    // this will probably make a crunch
    this.skipped = this.pending
    this.pending = [];
  }

}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
