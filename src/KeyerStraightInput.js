import { KeyerPlayer } from './KeyerPlayer.js';

export class KeyerStraightInput extends KeyerPlayer {
  constructor(context) {
    super(context);
    this.raw_key_on = false;
    this.is_on = false;
    this.keycodes = [ 'AltRight', 'ControlRight', 'ShiftRight', 'AltLeft', 'ControlLeft', 'ShiftLeft' ];
    this.keycode = 'ShiftRight';
  }

  keyset(key, on) {
    this.raw_key_on = on;
    if (this.raw_key_on !== this.is_on) {
      this.is_on = this.raw_key_on;
      if (this.is_on) this.keyOnAt(this.cursor);
      else this.keyOffAt(this.cursor);
    }
  }

  keydown(key) { this.keyset(e.code === this.keycode, true); }

  keyup(key) { this.keyset(e.code === this.keycode, false); }

  /* eslint class-methods-use-this: ["error", { "exceptMethods": ["onfocus"] }] */
  onfocus() {}

  onblur() { this.keyset(0, false); }

  // handlers for MIDI
  /* eslint no-bitwise: ["error", { "allow": ["&"] }] */
  onmidievent(event) {
    if (event.data.length === 3) {
      // console.log("onmidievent "+event.data[0]+" "+event.data[1]+" "+event.data[2].toString(16));
      switch (event.data[0] & 0xf0) {
      case 0x90:
        this.keyset(0, event.data[2] !== 0);
        break;
      case 0x80:
        this.keyset(0, false);
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
