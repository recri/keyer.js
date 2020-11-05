import { KeyerIambicKeyer } from './KeyerIambicKeyer.js';

export class KeyerIambicInput extends KeyerIambicKeyer {

  constructor(context, input) {
    super(context, input);
    this.rawDitOn = false;
    this.rawDahOn = false;
  }
  
  // handlers for focus and key events
  onfocus() { this.start(); }

  onblur() { this.stop(); }

  keyEvent(type, onOff) {
    if (type === 'left') this.keyset(true, onOff);
    if (type === 'right') this.keyset(false, onOff);
  }

  // common handlers
  keyset(key, on) {
    // console.log(`iambic ${key}, ${on}`);
    if (key) {
      this.rawDitOn = on;
      this.emit('key:dit', on, this.currentTime);
    } else {
      this.rawDahOn = on;
      this.emit('key:dah', on, this.currentTime);
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
