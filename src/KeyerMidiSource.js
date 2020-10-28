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
    this.midi = null; // global MIDIAccess object
    this.refresh();
  }

  onMIDISuccess(midiAccess) {
    this.midi = midiAccess;
    this.midi.onstatechange = (event) => this.onStateChange(event);
    this.emit('refresh', this.names());
  }

  onMIDIFailure() {
    this.midi = null;
    this.emit('refresh', this.names());
  }

  onStateChange() { this.emit('refresh', this.names()); }
  
  rebind(handler) { this.names().forEach( (name) => this.connect(name, handler) ); }
  
  names() { return Array.from(this.midi.inputs.values()).map(x => x.name) }

  connect(name, handler) {
    if (name && name !== 'none' && this.midi) {
      for (const x of this.midi.inputs.values()) {
        if (x.name === name) {
          // console.log(`installing handler for ${name}`);
          x.onmidimessage = handler;
        }
      }
    }
  }

  disconnect(name) {
    if (name && name !== 'none' && this.midi) {
      for (const x of this.midi.inputs.values()) {
        if (x.name === name) {
          // console.log(`uninstalling handler for ${name}`);
          x.onmidimessage = null;
        }
      }
    }
  }

  refresh() {
    if (navigator.requestMIDIAccess) {
      navigator
        .requestMIDIAccess()
        .then((...args) => this.onMIDISuccess(...args), (...args) => this.onMIDIFailure(...args));
    } else {
      // console.log("no navigator.requestMIDIAccess found");
    }
  }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
