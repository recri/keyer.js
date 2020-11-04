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
    this.midiSource.on('refresh', this.midiOnRefresh, this);

    this.none = new KeyerNoneInput(context, this);
    this.straight = new KeyerStraightInput(context, this);
    this.iambic = new KeyerIambicInput(context, this);

    this.inputs = ['none', 'straight', 'iambic'];
    this._keyer = 'none';
    this.keyer = 'none';
    this.midi = 'none';
  }

  // handlers defer to selected input type in 'iambic', 'straight', and more to come
  onblur() { this[this._keyer].onblur(); }

  onfocus() { this[this._keyer].onfocus(); }

  onmidievent(e) { this[this._keyer].onmidievent(e); }

  keydown(e) { this[this._keyer].keydown(e); }

  keyup(e) { this[this._keyer].keyup(e); }

  midiOnRefresh() { this.midiSource.rebind(e => this.onmidievent(e)); }

  midiRefresh() { this.midiSource.refresh(); }

  // properties of midiSource
  get midi() { return this.midiSource.midi; }
  
  set midi(v) { this.midiSource.midi = v; }

  get midiNames() { return this.midiSource.names; }

  get midiNotes() { return this.midiSource.notes; }
  
  get keyer() { return this._keyer; }

  set keyer(keyer) {
    this.onblur();
    this._keyer = keyer;
    this.onfocus();
  }

  set leftPaddleKey(v) { this.iambic.leftKey = v; }

  get leftPaddleKey() { return this.iambic.leftKey; }

  set rightPaddleKey(v) { this.iambic.rightKey = v; }

  get rightPaddleKey() { return this.iambic.rightKey; }

  set straightKey(v) { this.straight.key = v; }

  get straightKey() { return this.straight.key; }

}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
