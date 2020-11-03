import { KeyerEvent } from './KeyerEvent.js';
import { KeyerNoneInput } from './KeyerNoneInput.js';
import { KeyerStraightInput } from './KeyerStraightInput.js';
import { KeyerIambicInput } from './KeyerIambicInput.js';
import { KeyerNoneSource } from './KeyerNoneSource.js';
import { KeyerMidiSource } from './KeyerMidiSource.js';
import { KeyerKeyboardSource } from './KeyerKeyboardSource.js';

// translate keyup/keydown into keyed oscillator sidetone
export class KeyerInput extends KeyerEvent {
  constructor(context) {
    super(context);

    this.noneSource = new KeyerNoneSource(context);
    this.midiSource = new KeyerMidiSource(context);
    this.keyboardSource = new KeyerKeyboardSource(context);
    this.midiSource.on('refresh', this.midiOnRefresh, this);

    this.none = new KeyerNoneInput(context);
    this.straight = new KeyerStraightInput(context);
    this.iambic = new KeyerIambicInput(context);
    this.inputs = ['none', 'straight', 'iambic'];
    this._keyer = 'none';
    this.keyer = 'none';
    this.midi = 'none';
  }

  connect(target) {
    this.straight.connect(target);
    this.iambic.connect(target);
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
  
  // properties of keyer
  get pitch() { return this.iambic.pitch; }

  set pitch(hertz) { this.straight.pitch = hertz; this.iambic.pitch = hertz; }

  get gain() { return this.iambic.gain; }

  set gain(gain) { this.iambic.gain = gain; this.straight.gain = gain; }

  set weight(v) { this.iambic.weight = v; }

  get weight() { return this.iambic.weight; }

  set ratio(v) { this.iambic.ratio = v; }

  get ratio() { return this.iambic.ratio; }
  
  set compensation(v) { this.iambic.compensation = v; }

  get compensation() { return this.iambic.compensation; }
  
  get rise() { return this.iambic.rise; }

  set rise(ms) { this.iambic.rise = ms; this.straight.rise = ms; }

  get fall() { return this.iambic.fall; }

  set fall(ms) { this.iambic.fall = ms; this.straight.fall = ms; }

  get wpm() { return this.iambic.wpm; }

  set wpm(wpm) { this.iambic.wpm = wpm; }

  get swapped() { return this.iambic.swapped; }

  set swapped(swapped) { this.iambic.swapped = swapped; }

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
