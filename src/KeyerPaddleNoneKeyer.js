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
  The none keyer.
*/
import { KeyerInputDelegate } from './KeyerInputDelegate.js';


// translate iambic paddle events into keyup/keydown events
// in the very simplest way
export class KeyerPaddleNoneKeyer extends KeyerInputDelegate {

  constructor(context, input) {
    super(context, input);
    // state variables
    this.key = false;
  }

  clock(ditOn, dahOn) {
    // keyer state machine
    const onoff = ditOn || dahOn;
    if (onoff !== this.key) {
      this.keyStraight(onoff);
      this.key = onoff;
    }
  }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
