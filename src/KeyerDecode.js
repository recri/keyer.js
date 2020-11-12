//
// keyer.js - a progressive web app for morse code
// Copyright (c) 2020 Roger E Critchlow Jr, Charlestown, MA, USA
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// 
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
