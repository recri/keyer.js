import { KeyerInputDelegate } from './KeyerInputDelegate.js';

export class KeyerStraightInput extends KeyerInputDelegate {

  constructor(context, input) {
    super(context, input);
    this.active = false;
    this.rawKeyOn = false;
    this.keyOn = false;
    this.rampEnd = this.currentTime
    this.on('end:ramp', () => this.keyset(this.rawKeyOn));
  }

  onfocus() { this.active = true; }

  onblur() { this.active = false; this.keyset(false); }

  keyset(on) {
    this.rawKeyOn = on;
    if (this.rawKeyOn !== this.keyOn) {
      if (this.cursor < this.rampEnd) {
	// We received a new keystate before the previous keystate got started.
	// When we reach the end of the ramp on or off we will receive the event
	// in the handler set in the constructor, and apply the new rawKeyOn
	// value at that time.
      } else {
	this.keyOn = this.rawKeyOn;
	if (this.keyOn) {
	  this.rampEnd = this.cursor + this.rise/1000.0;
	  this.keyOnAt(this.cursor);
	} else {
	  this.rampEnd = this.cursor + this.fall/1000.0;
	  this.keyOffAt(this.cursor);
	}
      }
    }
  }

  keyEvent(type, onOff) { if (type === 'straight' && this.active) this.keyset(onOff); }

}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
