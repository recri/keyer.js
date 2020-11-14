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

// delegate to KeyerInput
export class KeyerInputDelegate extends KeyerEvent {

  constructor(context, input) {
    super(context);
    this.input = input;
  }

  get keySounds() { return this.input.keySounds; }

  get keySlews() { return this.input.keySlews; }
  
  get cursor() { return this.input.cursor; }

  keyStraight(onoff) { return this.input.keyStraight(onoff); }
			    
  keyElement(elen, slen) { return this.input.keyElement(elen, slen); }
  
  keyOnAt(time) { this.input.keyOnAt(time); }

  keyOffAt(time) { this.input.keyOffAt(time); }

  keyHoldFor(time) { return this.input.keyHoldFor(time); }

  cancel() { this.input.cancel(); }
  
  get perRawDit() { return this.input.perRawDit; }
  
  get perDit() { return this.input.perDit; }

  get perDah() { return this.input.perDah; }

  get perIes() { return this.input.perIes; }

  get perIls() { return this.input.perIls; }

  get perIws() { return this.input.perIws; }

  get rise() { return this.input.rise; }

  get fall() { return this.input.fall; }
  
  
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
