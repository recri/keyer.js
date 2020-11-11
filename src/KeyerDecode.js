import { KeyerDetime } from './KeyerDetime.js';

// translate dit dah strings to text
export class KeyerDecode extends KeyerDetime {
  constructor(context) {
    super(context);
    this.table = null;
    this.elements = [];
    this.elementTimeout = null;

    this.on('element', (elt, timeEnded) => this.onelement(elt, timeEnded));
  }

  elementTimeoutFun() {
    this.elementTimeout = null;
    if (this.elements.length > 0) {
      const code = this.elements.join('');
      const ltr = this.table.decode(code) || '\u25a1';
      // console.log('decode.emit.letter timeout', ltr, code);
      this.emit('letter', ltr, code);
      this.elements = [];
    }
  }

  onelement(elt, timeEnded) {
    // console.log('decode.onelement("'+elt+'", '+timeEnded+')');
    if (this.elementTimeout) {
      clearTimeout(this.elementTimeout);
      this.elementTimeout = null;
    }
    if (elt === '') {
      return;
    }
    if (elt === '.' || elt === '-') {
      this.elements.push(elt);
      this.elementTimeout = setTimeout((...args) => this.elementTimeoutFun(...args), 1000 * (timeEnded - this.context.currentTime) + 250 );
      return;
    }
    if (this.elements.length > 0) {
      const code = this.elements.join('');
      const ltr = this.table.decode(code) || '\u25a1';
      // console.log('decode.emit.letter space', ltr, code);
      this.emit('letter', ltr, code);
      this.elements = [];
    }
    if (elt === '\t') {
      this.emit('letter', ' ', elt);
    }
  }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
