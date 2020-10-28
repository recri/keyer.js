import { KeyerTable } from './KeyerTable.js';
import { KeyerTimer } from './KeyerTimer.js';

// translate text into keyed sidetone
// extends the oscillator with a code table and timings for the elements of the code
export class KeyerOutput extends KeyerTimer {
  constructor(context) {
    super(context);
    // translation table
    this.table = new KeyerTable();
    // initialize the pending queue
    this.idle = true;
    this.pending = [];
    this.lastch = null;
  }

  unsend(ch) { if (ch !== this.pending.pop()) console.log(`lost unsend ${ch}`); }

  send(ch) {
    this.pending.push(ch);
    if (this.idle) this.sendPending();
  }

  sendPending() {
    if (this.lastch !== null) 
      this.emit('sent', this.lastch);
    if (this.pending.length === 0) {
      this.idle = true;
      this.lastch = null;
      return;
    }
    // not apparently idle, 
    // probably a race here
    this.idle = false;
    let time = this.cursor;
    const ch = this.pending.shift();
    if (ch === ' ' || ch === '\t' || ch === "\n") {
      // inter-word space
      if (this.lastch === ' ' || this.lastch === '\t' || this.lastch === "\n") {
	// repeated inter-word space
	time = this.sendIws(time)
      } else {
	// inter-word space after character
	// reduce by inter-letter space already queued
	time = this.extendToIws(time);
      }
    } else {
      // translate character to dits and dahs and trailing inter-letter space
      for (const c of this.table.encode(ch).split('')) {
	if (c === '.') { 	// send a dit
	  time = this.sendDit(time);
	} else if (c === '-') {	// send a dah
	  time = this.sendDah(time);
	} else if (c === ' ') {
	  time = this.extendToIls(time);
	} else {
	  console.log(`why is {$c} in the code table for ${ch}?`);
	}
      }
    }
    this.lastch = ch
    this.emit('sending', ch);
    const timer = this.context.createConstantSource();
    timer.onended = () => this.sendPending();
    timer.start(this.context.currentTime)
    timer.stop(time-this._perDah);
  }

  cancelPending() {
    this.keyOff();
    this.pending.forEach(ch => this.emit('skipped', ch));
    this.pending = [];
  }

}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
