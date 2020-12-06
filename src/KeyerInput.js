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
import { KeyerPaddleWorklet } from './KeyerPaddleWorklet.js';

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
    if (this.swapped) {
      this.left.connect(this.paddle, 0, 1);
      this.right.connect(this.paddle, 0, 0);
    } else {
      this.left.connect(this.paddle, 0, 0);
      this.right.connect(this.paddle, 0, 1);
    }
    this.paddle.connect(this.ask);
  }
  
  get keyer() { return this._keyer; }
  
  //
  get swapped() { return this._swapped; }
  
  set swapped(v) { 
    if (this.swapped !== v) {
      this._swapped = v;
      if (this.paddle) {
	this.left.disconnect(this.paddle);
	this.right.disconnect(this.paddle);
	if (v) {
	  this.left.connect(this.paddle, 0, 1);
	  this.right.connect(this.paddle, 0, 0);
	} else {
	  this.left.connect(this.paddle, 0, 0);
	  this.right.connect(this.paddle, 0, 1);
	}
      }
    }
  }

  //
  onmidi(note, onOff) { 
    // console.log(`onmidi ${type} ${note} ${onOff}`);
    if (note === this.straightMidi) this.keyStraight = onOff;
    if (note === this.leftPaddleMidi) this.keyLeft = onOff;
    if (note === this.rightPaddleMidi) this.keyRight = onOff;
  }

  keyboardKey(e, onOff) {
    // console.log(`keyboardKey(${e.code}, ${onOff})`);
    if (e.code === this.straightKey) this.keyStraight = onOff;
    if (e.code === this.leftPaddleKey) this.keyLeft = onOff;
    if (e.code === this.rightPaddleKey) this.keyRight = onOff;
  }

  touchKey(e, type, onOff) {
    this.touched = true;
    switch (type) {
    case 'straight': this.keyStraight = onOff; break;
    case 'left': this.keyLeft = onOff; break;
    case 'right': this.keyRight = onOff; break;
    default: console.log(`keyEvent unknown type ${type}`); break;
    }
  }
  
  mouseKey(e, type, onOff) {
    if ( ! this.touched) {
      switch (type) {
      case 'straight': this.keyStraight = onOff; break;
      case 'left': this.keyLeft = onOff; break;
      case 'right': this.keyRight = onOff; break;
      default: console.log(`keyEvent unknown type ${type}`); break;
      }
      this.keyEvent(type, onOff);
    }
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
