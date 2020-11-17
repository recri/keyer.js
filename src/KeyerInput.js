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
import { KeyerPlayer } from './KeyerPlayer.js';
import { KeyerNoneInput } from './KeyerNoneInput.js';
import { KeyerStraightInput } from './KeyerStraightInput.js';
import { KeyerPaddleInput } from './KeyerPaddleInput.js';

// translate keyup/keydown into keyed oscillator sidetone
export class KeyerInput extends KeyerPlayer {
  constructor(context) {
    super(context);

    this.none = new KeyerNoneInput(context, this);
    this.straight = new KeyerStraightInput(context, this);
    this.paddle = new KeyerPaddleInput(context, this, 'none');

    this.sources = [];
    this._key = 'none';
    this.key = 'none';
    this.touched = false;	// prefer touch over mouse event
  }

  get keyers() { return this.paddle.keyers; }
  
  get keyer() { return this.paddle.keyer; }

  set keyer(v) { this.paddle.keyer = v; }
  
  onmidi(type, note) { 
    let onOff;
    switch (type) {
    case 'on': onOff = true; break;
    case 'off': onOff = false; break;
    default:
      console.log(`unexpected midi event ${type} ${note}`);
      return;
    }
    if (note === this.straightMidi) this.keyEvent('straight', onOff);
    if (note === this.leftPaddleMidi) this.keyEvent('left', onOff);
    if (note === this.rightPaddleMidi) this.keyEvent('right', onOff);
  }

  keyboardKey(e, onOff) {
    // console.log(`keyboardKey(${e.code}, ${onOff})`);
    if (e.code === this.straightKey) this.keyEvent('straight', onOff);
    if (e.code === this.leftPaddleKey) this.keyEvent('left', onOff);
    if (e.code === this.rightPaddleKey) this.keyEvent('right', onOff);
  }

  touchKey(e, type, onOff) { this.touched = true; this.keyEvent(type, onOff); }
  
  mouseKey(e, type, onOff) { if ( ! this.touched) this.keyEvent(type, onOff); }
  
  // handlers defer to selected input type in 'paddle', 'straight', and more to come
  get key() { return this._key; }

  set key(key) {
    this.onblur();
    this._key = key;
    this.onfocus();
  }

  onblur() { this[this._key].onblur(); }

  onfocus() { this[this._key].onfocus(); }

  keyEvent(type, onOff) { 
    if (this.swapped) 
      this[this._key].keyEvent({ left: 'right', right: 'left', straight: 'straight' }[type], onOff)
    else
      this[this._key].keyEvent(type, onOff);
  }
}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
