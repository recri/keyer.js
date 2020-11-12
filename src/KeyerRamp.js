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

//
// construct key envelope ramps from window functions and products of window functions
// the rise ramp is formed from the first half of the window, and the fall ramp is
// formed from the second half of the window.
// The 'hann' window is the raised cosine function.
//

import { KeyerWindow } from './KeyerWindow.js';

const ramp = (type, size, k, ...args) => KeyerWindow.window(type, size*2, k, ...args);
const ramp2 = (type1, type2, size, k, ...args) => ramp(type1, size, k, ...args) * ramp(type2, size, k, ...args);

export class KeyerRamp { 
  static get ramps() { return KeyerWindow.windows; }
  
  static rise(type, size, k, ...args) { return ramp(type, size, k, ...args); }

  static fall(type, size, k, ...args) { return ramp(type, size, size+k, ...args); }

  static rise2(type1, type2, size, k, ...args) { return ramp2(type1, type2, size, k, ...args) }

  static fall2(type1, type2, size, k, ...args) { return ramp2(type1, type2, size, size+k, ...args); }
}
