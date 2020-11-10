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
    let time = this.cursor;
    const ch = this.pending.shift();
    if (ch === ' ' || ch === '\t' || ch === "\n") {
      // inter-word space
      if (this.lastch === ' ' || this.lastch === '\t' || this.lastch === "\n") {
	// repeated inter-word space
	time = this.keyHoldFor(this.perIws);
	this.emit('element', '\t', time);
      } else {
	// inter-word space after character
	// reduce by inter-letter space already queued
	time = this.keyHoldFor(this.perIws-this.perIls); 
	this.emit('element', '\t', time);
      }
    } else {
      // translate character to dits and dahs and trailing inter-letter space
      for (const c of this.table.encode(ch).split('')) {
	if (c === '.') { 	// send a dit
	  this.keyOnAt(time);
	  time = this.keyHoldFor(this.perDit);
	  this.keyOffAt(time);
	  this.emit('element', '.', time);
	  time = this.keyHoldFor(this.perIes);
	  this.emit('element', '', time);
	} else if (c === '-') {	// send a dah
	  this.keyOnAt(time);
	  time = this.keyHoldFor(this.perDah);
	  this.keyOffAt(time);
	  this.emit('element', '-', time);
	  time = this.keyHoldFor(this.perIes);
	  this.emit('element', '', time);
	} else if (c === ' ') {
	  // reduce by inter-element space already queued
	  time = this.keyHoldFor(this.perIls-this.perIes);
	  this.emit('element', ' ', time);
	} else {
	  console.log(`why is {$c} in the code table for ${ch}?`);
	}
      }
    }
    this.lastch = ch
    this.emit('sending', ch);
    this.when(time-this.perDah, () => this.sendPending());
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
