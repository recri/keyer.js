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
import { KeyerEvent } from './KeyerEvent.js';
import { KeyerOutput } from './KeyerOutput.js';
import { KeyerDecode } from './KeyerDecode.js';
import { KeyerInput } from './KeyerInput.js';
import { KeyerMidiSource } from './KeyerMidiSource.js';
import { KeyerMicrophone } from './KeyerMicrophone.js';
import { KeyerScope } from './KeyerScope.js';

const USE_DETONER = false; // decode from sidetone
const USE_DETIMER = false;  // decode from transitions

// const nodeinfo = (name, node) => console.log(`${name} #inputs ${node.numberOfInputs} #outputs ${node.numberOfOutputs} #chan ${node.channelCount}`)

// combine inputs and outputs
export class Keyer extends KeyerEvent {

  constructor(context) {
    super(context);


    this.output = new KeyerOutput(this.context);
    this.outputDecoder = new KeyerDecode(this.context);
    this.input = new KeyerInput(this.context);
    this.inputDecoder = new KeyerDecode(this.context);
    this.midiSource = new KeyerMidiSource(this.context);
    this.midiSource.on('midi:event', (type, note) => this.input.onmidi(type, note));
    this.microphone = new KeyerMicrophone(this.context);
    this.scope = new KeyerScope(this.context);
    
    // decode from transitions
    // output decoder wiring
    this.output.connect(this.context.destination);
    // this.output.on('element', (elt, timeEnded) => this.outputDecoder.onelement(elt, timeEnded));
    this.output.on('transition', (onoff, time) => this.outputDecoder.ontransition(onoff, time));

    // input decoder wiring
    if (USE_DETONER) {
      this.input.on('change:pitch', pitch => this.inputDecoder.onchangepitch(pitch));
      this.inputDecoder.onchangepitch(this.input.pitch);
      this.input.connect(this.inputDecoder.target);
      this.inputDecoder.connect(this.context.destination);
    } else if (USE_DETIMER) {
      this.input.connect(this.context.destination);
      this.input.on('transition', (onoff, time) => this.inputDecoder.ontransition(onoff, time));
    } else {
      this.input.connect(this.context.destination);
      this.input.on('transition', (onoff, time) => this.inputDecoder.ontransition(onoff, time));
      // this.input.on('element', (elt, timeEnded) => this.inputDecoder.onelement(elt, timeEnded));
    }

    this._scopeTargets = { 'none': null, 
			   'input-osc': this.input.oscillator,
			   'input-key': this.input.key,
			   'input-ramp': this.input.ask.offset, 
			   'input': this.input.volume,
			   'output-osc': this.output.oscillator,
			   'output-key': this.output.key,
			   'output-ramp': this.output.ask.offset,
			   'output': this.output.volume,
			   'left-key': this.input.left,
			   'right-key': this.input.right,
			   'paddle-out': null,
			   'input-output': null
			 };
    this._scopeTarget = 'none';
    this.table = this.output.table;
    this.outputDecoder.table = this.table;
    this.inputDecoder.table = this.table;
  }

  // scope targets
  get scopeTargets() { return Array.from(Object.keys(this._scopeTargets)); }
  
  get scopeTarget() { return this._scopeTarget; }

  set scopeTarget(target) {
    if (this._scopeTargets[this._scopeTarget] !== null)
      this._scopeTargets[this._scopeTarget].disconnect(this.scope.analyser);
    else
      switch (this._scopeTarget) {
      case 'none': break;
      case 'paddle-out': this.input.paddle.disconnect(this.scope.analyser); break;
      case 'input-output': this.input.volume.disconnect(this.scope.analyser); this.output.volume.disconnect(this.scope.analyser); break;
      default:
	console.log(`unknown this.scopeTarget ${this._scopeTarget}`);
	return;
      }
    if (this._scopeTargets[target] !== null)
      this._scopeTargets[target].connect(this.scope.analyser);
    else
      switch (target) {
      case 'none': break;
      case 'paddle-out': this.input.paddle.connect(this.scope.analyser); break;
      case 'input-output': this.input.volume.connect(this.scope.analyser); this.output.volume.connect(this.scope.analyser); break;
      default:
	console.log(`unknown scope target ${target}`);
	return;
      }
    this._scopeTarget = target;
  }
}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
