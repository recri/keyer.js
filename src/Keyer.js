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
    
    // nodeinfo('scope', this.scope.analyser);
    // nodeinfo('destination', this.context.destination);
    // nodeinfo('oscillator', this.output.oscillator);
    // nodeinfo('ramp', this.output.ramp);
    
    // decode from transitions
    // output decoder wiring
    this.output.connect(this.scope.analyser);
    // this.output.on('element', (elt, timeEnded) => this.outputDecoder.onelement(elt, timeEnded));
    this.output.on('transition', (onoff, time) => this.outputDecoder.ontransition(onoff, time));

    // input decoder wiring
    if (USE_DETONER) {
      this.input.on('change:pitch', pitch => this.inputDecoder.onchangepitch(pitch));
      this.inputDecoder.onchangepitch(this.input.pitch);
      this.input.connect(this.inputDecoder.target);
      this.inputDecoder.connect(this.scope.analyser);
    } else if (USE_DETIMER) {
      this.input.connect(this.scope.analyser);
      this.input.on('transition', (onoff, time) => this.inputDecoder.ontransition(onoff, time));
    } else {
      this.input.connect(this.scope.analyser);
      this.input.on('transition', (onoff, time) => this.inputDecoder.ontransition(onoff, time));
      // this.input.on('element', (elt, timeEnded) => this.inputDecoder.onelement(elt, timeEnded));
    }
    this.scope.analyser.connect(this.context.destination);

    this.table = this.output.table;
    this.outputDecoder.table = this.table;
    this.inputDecoder.table = this.table;
  }
}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
