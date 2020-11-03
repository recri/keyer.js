/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint no-bitwise: ["error", { "allow": ["&","|","<<"] }] */
import { KeyerEvent } from './KeyerEvent.js';
/*
 ** The MIDI interface may need to be enabled in chrome://flags,
 ** but even then it may not implement everything needed.
 **
 ** This mostly works in chrome-unstable as of 2015-04-16, Version 43.0.2357.18 dev (64-bit).
 ** but
 **  1) does not detect hot plugged MIDI devices, only those that are present when
 **  chrome is launched; or maybe it does, but not reliably;
 **  2) the supplied event timestamp has no value;
 **  3) the list of MIDI devices may become stale, ie they're there, they worked once, but they
 **  don't work now even though the browser continues to list them;
 */

export class KeyerMidiSource extends KeyerEvent {
  constructor(context) {
    super(context);
    this.midiOptions = { sysex: false };
    this.midiAccess = null; // global MIDIAccess object
    this._midi = null;
    this._notes = []
    this.refresh();
  }

  onmidievent(e) { 
    this.emit('midi:event', e);
    // accumulate the NoteOn/NoteOff events seen channel:note
    if (e.data.length === 3) {
      // console.log("onmidievent "+event.data[0]+" "+event.data[1]+" "+event.data[2].toString(16));
      const note = (e.data[0]<<16)|(e.data[1]<<8);
      switch (e.data[0] & 0xf0) {
      case 0x90:		// note on
	if (e.data[2] === 0)
	  this.emit('midi:noteoff', note);
	else 
	  this.emit('midi:noteon', note);
	break;
      case 0x80:		// note off
	this.emit('midi:noteoff', note)
        break;
      default:
        return;
      }
      this._notes[note] += 1;
    }
  }
  
  set midi(v) {
    if (this._midi && this.midiAccess)
      this.inputsvalues().forEach(
	x => { if (x.name === this._midi) x.onmidimessage = null; }
      );
    this._midi = v;
    this._notes = []
    if (v && this.midiAccess)
      this.inputsvalues().forEach(
	x => { if (x.name === v) x.onmidimessage = e => this.onmidievent(e); }
      );
  }

  get midi() { return this._midi; }
  
  get names() { return ['none'].concat(this.midiAccess ? this.inputsvalues.map(x => x.name) : []); }
  
  get inputsvalues() { return this.midiAccess ? Array.from(this.midiAccess.inputs.values()) : []; }

  get notes() { return this._notes; }

  onStateChange() { this.emit('midi:refresh', this.names); }
  
  onMIDISuccess(midiAccess) {
    this.midiAccess = midiAccess;
    this.midiAccess.onstatechange = (event) => this.onStateChange(event);
    this.emit('midi:refresh', this.names);
  }

  onMIDIFailure() {
    this.midiAccess = null;
    this.emit('midi:refresh', this.names);
  }

  refresh() {
    if (navigator.requestMIDIAccess) {
      navigator
        .requestMIDIAccess()
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
