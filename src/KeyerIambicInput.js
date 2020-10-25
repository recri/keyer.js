import { KeyerIambicKeyer } from './KeyerIambicKeyer.js';

export class KeyerIambicInput extends KeyerIambicKeyer {
  // handlers for focus and key events
  onfocus() {
    this.start();
  }

  onblur() {
    this.stop();
  }

  keydown(key) {
    this.keyset(key, true);
  }

  keyup(key) {
    this.keyset(key, false);
  }

  // handler for MIDI
  /* eslint no-bitwise: ["error", { "allow": ["&", "^"] }] */
  onmidievent(event) {
    if (event.data.length === 3) {
      // console.log("onmidievent "+event.data[0]+" "+event.data[1]+" "+event.data[2].toString(16));
      switch (event.data[0] & 0xf0) {
        case 0x90:
          this.keyset((event.data[1] & 1) ^ 1, event.data[2] !== 0);
          break;
        case 0x80:
          this.keyset((event.data[1] & 1) ^ 1, false);
          break;
        default:
          break;
      }
    }
  }

  // common handlers
  keyset(key, on) {
    // console.log(`keyset(${key}, ${on})`);
    if (key) {
      this.rawDitOn = on;
      this.emit('key:dit', on, this.context.currentTime);
    } else {
      this.rawDahOn = on;
      this.emit('key:dah', on, this.context.currentTime);
    }
    this.clock();
  }

  start() {
    this.startClock();
  }

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
