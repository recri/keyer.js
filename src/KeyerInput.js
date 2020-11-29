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

/*
** code for adapter retrieved from 
** https://www.amateurradio.com/single-lever-and-ultimatic-adapter/
** November 13, 2020
** Posted 17 January 2014 | by Sverre LA3ZA
** Rewritten to encode state|left|right into a 3 bit integer
** and which indexes a table of outputs to be decoded.
** original code contains this attribution:
       Direct implementation of table 3 in "K Schmidt (W9CF)
       "An ultimatic adapter for iambic keyers"
       http://fermi.la.asu.edu/w9cf/articles/ultimatic/ultimatic.html
       with the addition of the Single-paddle emulation mode
*/ 

import { KeyerPlayer } from './KeyerPlayer.js';
import { KeyerPaddleWorklet } from './KeyerPaddleWorklet.js';

/* eslint no-bitwise: ["error", { "allow": ["&","|"] }] */

// translate keyup/keydown into keyed oscillator sidetone
export class KeyerInput extends KeyerPlayer {
  constructor(context) {
    super(context);

    this.left = context.createConstantSource();
    this.right = context.createConstantSource();
    this.left.offset.value = 0;
    this.right.offset.value = 0;
    this.left.start();
    this.right.start();
    
    this.keyerList = [ 'none', 'nd7pa-a', 'nd7pa-b', 'vk6ph-a', 'vk6ph-b', 'vk6ph-s' ]
    this.keyer = 'nd7pa-b';
    this.paddle = null;

    this.adapterKeyLeft = false;
    this.adapterKeyRight = false;
    this.adapterTables = {
      none:	      { 0:0, 1:1, 2:2, 3:3 },
      ultimatic:      { 0:0, 1:1, 2:6, 3:2, 4:0, 5:1, 6:6, 7:5 },
      'single lever': { 0:0, 1:1, 2:6, 3:1, 4:0, 5:1, 6:6, 7:6 }
    };
				
    this.adapter = 'none';
    this.swapped = false;
    
    this.touched = false;	// prefer touch over mouse event
  }

  // paddle keyer management
  createPaddleWorklet(name, mode) {
    const paddle = new KeyerPaddleWorklet(this.context, name, { numberOfInputs: 2, numberOfOutputs: 1, outputChannelCount: [1] }, this);
    paddle.mode = mode;
    return paddle;
  }

  get keyers() { return this.keyerList; }
  
  set keyer(keyer) {
    if (this.paddle) {
      this.paddle.disconnect(this.ask);
      this.left.disconnect(this.paddle);
      this.right.disconnect(this.paddle);
      this.paddle = null;
    }
    switch (keyer) {
    case 'none':    this.paddle = this.createPaddleWorklet('keyer-paddle-none-processor', 'A'); break;
    case 'nd7pa-a': this.paddle = this.createPaddleWorklet('keyer-paddle-nd7pa-processor', 'A'); break;
    case 'nd7pa-b': this.paddle = this.createPaddleWorklet('keyer-paddle-nd7pa-processor', 'B'); break;
    case 'vk6ph-a': this.paddle = this.createPaddleWorklet('keyer-paddle-vk6ph-processor', 'A'); break;
    case 'vk6ph-b': this.paddle = this.createPaddleWorklet('keyer-paddle-vk6ph-processor', 'B'); break;
    case 'vk6ph-s': this.paddle = this.createPaddleWorklet('keyer-paddle-vk6ph-processor', 'S'); break;
    default:	    console.log(`invalid keyer ${keyer}`); return;
    }
    this._keyer = keyer;
    this.left.connect(this.paddle, 0, 0);
    this.right.connect(this.paddle, 0, 1);
    this.paddle.connect(this.ask);
  }
  
  get keyer() { return this._keyer; }
  
  //
  onmidi(note, onOff) { 
    // console.log(`onmidi ${type} ${note} ${onOff}`);
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
  
  mouseKey(e, type, onOff) { if ( ! this.touched) { this.keyEvent(type, onOff); } }
  
  keyEvent(type, onOff) { 
    switch (type) {
    case 'straight': this.keyStraight = onOff; break;
    case 'left': 
      this.adapterKeyLeft = onOff; 
      this.adapt(this.adapterState, this.adapterKeyLeft, this.adapterKeyRight);
      break;
    case 'right':
      this.adapterKeyRight = onOff;
      this.adapt(this.adapterState, this.adapterKeyLeft, this.adapterKeyRight);
      break;
    default: console.log(`keyEvent unknown type ${type}`); break;
    }
  }

  // the paddle adapter maps the low 2 or 3 bits in several ways
  // map 'none' maps the low 2 bits into themselves
  // map 'ultimatic' maps the low 3 bits into an ultimatic key
  // map 'single lever' maps the low 3 bits into a single lever key
  // the swapped table is either none or maps the low 2 bits into each other

  set swapped(v) { 
    this._swapped = v; 
    this.adapterSwap = v ? { 0:0, 1:2, 2:1, 3:3 } : this.adapterTables.none;
  }

  get swapped() { return this._swapped; }
  
  get adapters() { return Object.keys(this.adapterTables); }

  set adapter(v) { 
    // console.log(`set adapter ${v} table ${this.adapterTables[v]}`);
    this._adapter = v;
    this.adapterTable = this.adapterTables[v];
    this.adapterState = false;
  }

  get adapter() { return this._adapter; }
  
  adapt(s, l, r) {
    // console.log(`s ${s} l ${l} r ${r} adapterTable ${this.adapterTable}`);
    // compute the ultimatic transition
    const encode = ((s?4:0)|(l?2:0)|(r?1:0));	     // encode state and keys into 0:7
    const slr = this.adapterTable[encode];	     // transform encoded input to output
    const ns = ((slr&4)===4);			     // decode output state
    this.adapterState = ns;			     // save output state
    const keys =  this.adapterSwap[slr&3];	     // map output keys to swapped or not
    const nl = ((keys&2)===2);			     // decode output left key
    if (nl !== this.leftKey) this.keyLeft = nl;	     // key left output
    const nr = ((keys&1)===1);			     // decode output right key
    if (nr !== this.rightKey) this.keyRight = nr;    // key right output
  }

  set keyLeft(onOff) { this.left.offset.setValueAtTime(onOff ? 1 : 0, this.currentTime); }

  get keyLeft() { return this.left.offset.value !== 0; }
  
  set keyRight(onOff) { this.right.offset.setValueAtTime(onOff ? 1 : 0, this.currentTime); }

  get keyRight() { return this.right.offset.value !== 0; }
  
}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
