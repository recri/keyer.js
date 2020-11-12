import { KeyerPlayer } from './KeyerPlayer.js';
import { KeyerNoneInput } from './KeyerNoneInput.js';
import { KeyerStraightInput } from './KeyerStraightInput.js';
import { KeyerIambicInput } from './KeyerIambicInput.js';
import { KeyerMidiSource } from './KeyerMidiSource.js';

// translate keyup/keydown into keyed oscillator sidetone
export class KeyerInput extends KeyerPlayer {
  constructor(context) {
    super(context);

    this.midiSource = new KeyerMidiSource(context);
    this.midiSource.on('midi:event', (type, note) => this.onmidi(type, note));

    this.none = new KeyerNoneInput(context, this);
    this.straight = new KeyerStraightInput(context, this);
    this.paddle = new KeyerIambicInput(context, this);

    this.sources = [];
    this._key = 'none';
    this.key = 'none';
    this.midi = 'none';
    this.touched = false;	// prefer touch over mouse event

    this._straightKey = 'ControlRight';
    this._leftPaddleKey = 'AltRight';
    this._rightPaddleKey = 'ControlRight';
    this._straightMidi = '1:1';
    this._leftPaddleMidi = '1:0';
    this._rightPaddleMidi = '1:1';

    this.swapped = false;
  }

  set straightKey(v) { this._straightKey = v; }

  get straightKey() { return this._straightKey; }

  set leftPaddleKey(v) { this._leftPaddleKey = v; }

  get leftPaddleKey() { return this._leftPaddleKey; }

  set rightPaddleKey(v) { this._rightPaddleKey = v; }

  get rightPaddleKey() { return this._rightPaddleKey; }

  set straightMidi(v) { this._straightMidi = v; }

  get straightMidi() { return this._straightMidi; }

  set leftPaddleMidi(v) { this._leftPaddleMidi = v; }

  get leftPaddleMidi() { return this._leftPaddleMidi; }

  set rightPaddleMidi(v) { this._rightPaddleMidi = v; }

  get rightPaddleMidi() { return this._rightPaddleMidi; }

  onmidi(type, note) { 
    let onOff;
    if (type === 'refresh') 
      return;
    if (type === 'on')
      onOff = true;
    else if (type === 'off')
      onOff = false;
    else {
      console.log(`unexpected midi event ${type} ${note}`);
      return;
    }
    if (note === this._straightMidi) this.keyEvent('straight', onOff);
    if (note === this._leftPaddleMidi) this.keyEvent('left', onOff);
    if (note === this._rightPaddleMidi) this.keyEvent('right', onOff);
  }

  kbdKey(e, onOff) {
    if (e.code === this._straightKey) this.keyEvent('straight', onOff);
    if (e.code === this._leftPaddleKey) this.keyEvent('left', onOff);
    if (e.code === this._rightPaddleKey) this.keyEvent('right', onOff);
  }

  touchKey(e, type, onOff) { this.touched = true; this.keyEvent(type, onOff); }
  
  mouseKey(e, type, onOff) { if ( ! this.touched) this.keyEvent(type, onOff); }
  
  midiRefresh() { this.midiSource.refresh(); }

  // handlers defer to selected input type in 'paddle', 'straight', and more to come
  get key() { return this._key; }

  set key(key) {
    this.onblur();
    this._key = key;
    this.onfocus();
  }

  onblur() { this[this._key].onblur(); }

  onfocus() { this[this._key].onfocus(); }

  keyEvent(type, onOff) { 
    if (this.swapped) 
      this[this._key].keyEvent({ left: 'right', right: 'left', straight: 'straight' }[type], onOff)
    else
      this[this._key].keyEvent(type, onOff);
  }
  
  // properties of midiSource
  get midi() { return this.midiSource.midi; }
  
  set midi(v) { this.midiSource.midi = v; }

  get midiNames() { return this.midiSource.names; }

  get midiNotes() { return this.midiSource.notes; }
  
}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
