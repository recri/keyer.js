import { KeyerTable } from './KeyerTable.js';
import { KeyerPlayer } from './KeyerPlayer.js';

// translate text into keyed sidetone
// extends the oscillator with a code table and timings for the elements of the code
export class KeyerOutput extends KeyerPlayer {
  constructor(context) {
    super(context);
    this.table = new KeyerTable();
    this.dah = 3; // dah length in dits
    this.ies = 1; // interelement space in dits
    this.ils = 3; // interletter space in dits
    this.iws = 7; // interword space in dits
    this.wpm = 20; // words per minute
  }

  set wpm(wpm) {
    this.dit = 60.0 / (Math.max(5, Math.min(100, wpm)) * 50);
  }

  get wpm() {
    return 60 / (this.dit * 50);
  }

  /* eslint no-continue: "warn" */
  send(string) {
    const code = this.table.encode(string);
    let time = this.cursor;
    for (let i = 0; i < code.length; i += 1) {
      let c = code.charAt(i);
      switch (c) {
        case ' ': // inter-letter space at the beginning
          time = this.keyHoldFor(this.ils * this.dit);
          this.emit('element', c, time);
          continue;
        case '\t': // inter-word space at the beginning
          time = this.keyHoldFor(this.iws * this.dit);
          this.emit('element', c, time);
          continue;
        case '.':
          this.keyOnAt(time);
          time = this.keyHoldFor(this.dit);
          this.keyOffAt(time);
          this.emit('element', c, time);
          break;
        case '-':
          this.keyOnAt(time);
          time = this.keyHoldFor(this.dah * this.dit);
          this.keyOffAt(time);
          this.emit('element', c, time);
          break;
        default:
          continue;
      }
      if (i + 1 === code.length) {
        time = this.keyHoldFor(this.ies * this.dit);
        this.emit('element', '', time);
        continue;
      }
      c = code.charAt(i + 1);
      switch (c) {
        case '.':
        case '-':
          time = this.keyHoldFor(this.ies * this.dit);
          this.emit('element', '', time);
          continue;
        case ' ':
        case '\t':
        default:
          continue;
      }
    }
  }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
