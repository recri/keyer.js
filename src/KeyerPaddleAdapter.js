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

/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint no-bitwise: ["error", { "allow": ["&","|"] }] */

export class KeyerPaddleAdapter {
  constructor() {
    this.adapterState = false;
    this.adapterKeyLeft = false;
    this.adapterKeyRight = false;
    this.adapterTable = null;
    this.adapterTables = {
      none:	      { 0:0, 1:1, 2:2, 3:3 },
      ultimatic:      { 0:0, 1:1, 2:6, 3:2, 4:0, 5:1, 6:6, 7:5 },
      'single lever': { 0:0, 1:1, 2:6, 3:1, 4:0, 5:1, 6:6, 7:6 }
    };
    this.adapter = 'none';
  }

  get adapters() { return Object.keys(this.adapterTables); }

  set adapter(v) { 
    // console.log(`set adapter ${v} table ${this.adapterTables[v]}`);
    this._adapter = v;
    this.adapterTable = this.adapterTables[v];
    this.adapterState = false;
  }

  get adapter() { return this._adapter; }
  
  keyEvent(type, onOff, keyer) { 
    switch(type) {
    case 'left': this.adapterKeyLeft = onOff; break;
    case 'right': this.adapterKeyRight = onOff; break;
    default: console.log(`type ${type} in adapter keyEvent`);
    }
    const s = this.adapterState;
    const l = this.adapterKeyLeft;
    const r = this.adapterKeyRight;
    const encode = ((s?4:0)|(l?2:0)|(r?1:0)); // encode state and keys into 0:7
    const slr = this.adapterTable[encode]; // transform encoded input to output
    const ns = ((slr&4)===4);	// decode output state
    this.adapterState = ns;	// save output state
    const nl = ((slr&2)===2);	// decode output left key
    if (nl !== keyer.leftKey) keyer.keyLeft = nl; // key left output
    const nr = ((slr&1)===1);	// decode output right key
    if (nr !== keyer.rightKey) keyer.keyRight = nr; // key right output
  }
}
