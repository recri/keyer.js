import { KeyerPlayer } from './KeyerPlayer.js';

export class KeyerStraightInput extends KeyerPlayer {
  constructor(context) {
    super(context);
    this.raw_key_on = false;
    this.is_on = false;
    this.keycodes = [ 'AltRight', 'ControlRight', 'ShiftRight', 'AltLeft', 'ControlLeft', 'ShiftLeft' ];
    this.key = 'ControlRight';
    this.rampEnd = this.context.currentTime
  }

  keyset(on) {
    this.raw_key_on = on;
    if (this.raw_key_on !== this.is_on) {
      if (this.cursor < this.rampEnd) {
	this.on('ramp-end', () => this.keyset(this.raw_key_on));
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

  keydown(e) { if (e.code === this.keycode) this.keyset(true); }

  keyup(e) { if (e.code === this.keycode) this.keyset(false); }

  /* eslint class-methods-use-this: ["error", { "exceptMethods": ["onfocus"] }] */
  onfocus() {}

  onblur() { this.keyset(false); }

  // handlers for MIDI
  /* eslint no-bitwise: ["error", { "allow": ["&"] }] */
  onmidievent(event) {
    if (event.data.length === 3) {
      // console.log("onmidievent "+event.data[0]+" "+event.data[1]+" "+event.data[2].toString(16));
      switch (event.data[0] & 0xf0) {
      case 0x90:
        this.keyset(event.data[2] !== 0);
        break;
      case 0x80:
        this.keyset(false);
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
