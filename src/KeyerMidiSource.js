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

/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint no-bitwise: ["error", { "allow": ["&","|","<<"] }] */
/* eslint class-methods-use-this: ["error", { "exceptMethods": ["shorten","lengthen"] }] */

import { KeyerEvent } from './KeyerEvent.js';
/*
 ** The MIDI interface may need to be enabled in chrome://flags,
 ** but even then it may not implement everything needed.
 **
 ** This works in chrome-stable as of 2020-11-04, Version 86.0.4240.111 (Official Build) (64-bit)
 */

export class KeyerMidiSource extends KeyerEvent {
  constructor(context) {
    super(context);
    this.midiAccess = null; // global MIDIAccess object
    this.midi = 'none';	    // selected midi device
    this.notesCache = [];   // notes received on each device
    this.refresh();
  }

  onmidimessage(name, e) { 
    // accumulate the NoteOn/NoteOff events seen channel:note
    if (e.data.length === 3) {
      const note = `${1+(e.data[0]&0x0F)}:${e.data[1]}`; // channel:note 
      let event = null;
      switch (e.data[0] & 0xf0) {
      case 0x90:		// note on
	event = e.data[2] === 0 ? 'off' : 'on';
	break;
      case 0x80:		// note off
	event = 'off';
        break;
      default:
        return;
      }
      if (this.notesCache[name][note] === undefined) {
	// console.log(`adding midi:note ${name} ${note} to notesCache`);
	this.notesCache[name][note] = true;
	this.emit('midi:notes');
      }
      if (name === this.midi && name !== 'none')
	this.emit('midi:event', event, note);
    }
  }
  
  // shortened names would be nice.
  shorten(name) { return name; }

  lengthen(name) { return name; }

  get names() { return this.rawnames.map(name => this.shorten(name)); }
  
  get rawnames() { return ['none'].concat(this.midiAccess ? this.inputs.map(input => input.name) : []); }
  
  get inputs() { return this.midiAccess ? Array.from(this.midiAccess.inputs.values()) : []; }

  get outputs() { return this.midiAccess ? Array.from(this.midiAccess.outputs.values()) : []; }

  get notes() { return this.midi && this.notesCache[this.midi] ? Array.from(Object.keys(this.notesCache[this.midi])) : []; }

  rebind() {
    const { notesCache } = this;
    this.notesCache = []
    this.inputs.forEach(input => {
      const name = this.shorten(input.name);
      // console.log(`rebind ${name}`);
      this.notesCache[name] = notesCache[name] || [];
      input.onmidimessage = e => this.onmidimessage(name, e)
    });
  }

  onStateChange() { 
    this.emit('midi:names', this.names);
    this.rebind()
  }
  
  onMIDISuccess(midiAccess) {
    this.midiAccess = midiAccess;
    this.midiAccess.onstatechange = (event) => this.onStateChange(event);
    this.emit('midi:names', this.names);
    this.rebind();
  }

  onMIDIFailure() {
    this.midiAccess = null;
    this.emit('midi:names', this.names);
  }

  refresh() {
    if (navigator.requestMIDIAccess) {
      navigator
        .requestMIDIAccess({ sysex: false })
        .then((...args) => this.onMIDISuccess(...args), (...args) => this.onMIDIFailure(...args));
    } else {
      console.log("no navigator.requestMIDIAccess found");
    }
  }

}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
