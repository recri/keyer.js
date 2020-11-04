import { KeyerIambicKeyer } from './KeyerIambicKeyer.js';

export class KeyerIambicInput extends KeyerIambicKeyer {
  constructor(context, keyertimer) {
    super(context, keyertimer);
    this.keycodes = [ 'AltRight', 'ControlRight', 'ShiftRight', 'AltLeft', 'ControlLeft', 'ShiftLeft' ];
    this.leftKey = 'AltRight';
    this.rightKey = 'ControlRight';
  }

  // handlers for focus and key events
  onfocus() { this.start(); }

  onblur() { this.stop(); }

  keydown(e) { 
    if (e.code === this.leftKey) this.keyset(true, true);
    if (e.code === this.rightKey) this.keyset(false, true);
  }

  keyup(e) { 
    if (e.code === this.leftKey) this.keyset(true, false);
    if (e.code === this.rightKey) this.keyset(false, false);
  }

  // handler for MIDI
  /* eslint no-bitwise: ["error", { "allow": ["&", "^"] }] */
  onmidievent(e) {
    if (e.data.length === 3) {
      // console.log("onmidievent "+e.data[0]+" "+e.data[1]+" "+e.data[2].toString(16));
      switch (e.data[0] & 0xf0) {
      case 0x90:
        this.keyset((e.data[1] & 1) === 0, e.data[2] !== 0);
        break;
      case 0x80:
        this.keyset((e.data[1] & 1) === 0, false);
          break;
        default:
          break;
      }
    }
  }

  // common handlers
  keyset(key, on) {
    // console.log(`iambic ${key}, ${on}`);
    if (key) {
      this.rawDitOn = on;
      this.emit('key:dit', on, this.context.currentTime);
    } else {
      this.rawDahOn = on;
      this.emit('key:dah', on, this.context.currentTime);
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
