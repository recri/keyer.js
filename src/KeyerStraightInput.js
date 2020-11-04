import { KeyerInputDelegate } from './KeyerInputDelegate.js';

export class KeyerStraightInput extends KeyerInputDelegate {

  constructor(context, input) {
    super(context, input);
    this.active = false;
    this.raw_key_on = false;
    this.is_on = false;
    this.keycodes = [ 'AltRight', 'ControlRight', 'ShiftRight', 'AltLeft', 'ControlLeft', 'ShiftLeft' ];
    this.key = 'ControlRight';
    this.rampEnd = this.context.currentTime
    this.on('end:ramp', () => this._keyset(this.raw_key_on));
  }

  _keyset(on) {
    this.raw_key_on = on;
    if (this.raw_key_on !== this.is_on) {
      if (this.cursor < this.rampEnd) {
	// We received a new keystate before the previous keystate got started.
	// When we reach the end of the ramp on or off we will receive the event
	// in the handler set in the constructor, and apply the new raw_key_on
	// value at that time.
      } else {
	this.is_on = this.raw_key_on;
	if (this.is_on) {
	  this.rampEnd = this.cursor + this.rise/1000.0;
	  this.keyOnAt(this.cursor);
	} else {
	  this.rampEnd = this.cursor + this.fall/1000.0;
	  this.keyOffAt(this.cursor);
	}
      }
    }
  }

  keydown(e) { if (this.active && (e.code === this.key)) this._keyset(true); }

  keyup(e) { if (this.active && (e.code === this.key)) this._keyset(false); }

  /* eslint class-methods-use-this: ["error", { "exceptMethods": ["onfocus"] }] */
  onfocus() { this.active = true; }

  onblur() { this.active = false; this._keyset(false); }

  // handlers for MIDI
  /* eslint no-bitwise: ["error", { "allow": ["&"] }] */
  onmidievent(event) {
    if (this.active && event.data.length === 3) {
      // console.log("onmidievent "+event.data[0]+" "+event.data[1]+" "+event.data[2].toString(16));
      switch (event.data[0] & 0xf0) {
      case 0x90:
        this._keyset(event.data[2] !== 0);
        break;
      case 0x80:
        this._keyset(false);
        break;
      default:
        break;
      }
    }
  }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
