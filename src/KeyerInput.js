import { KeyerStraightInput } from './KeyerStraightInput.js';
import { KeyerIambicInput } from './KeyerIambicInput.js';
import { KeyerMidiInput } from './KeyerMidiInput.js';
import { KeyerKeyboardInput } from './KeyerKeyboardInput.js';

// translate keyup/keydown into keyed oscillator sidetone
export class KeyerInput {
  constructor(context) {
    this.straight = new KeyerStraightInput(context);
    this.iambic = new KeyerIambicInput(context);
    this.midiInput = new KeyerMidiInput();
    this.keyboardInput = new KeyerKeyboardInput();
    this._type = null;
    this.midiInput.on('refresh', this.midiOnRefresh, this);
    this.type = 'straight';
  }

  connect(target) {
    this.straight.connect(target);
    this.iambic.connect(target);
  }

  // handlers defer to selected input type in 'iambic', 'straight', and more to come
  onblur() { if (this._type) this[this._type].onblur(); }

  onfocus() { this[this._type].onfocus(); }

  onmidievent(e) { this[this._type].onmidievent(e); }

  keydown(e) { this[this._type].keydown(e); }

  keyup(e) { this[this._type].keyup(e); }

  // type handling
  get type() { return this._type; }

  set type(type) {
    this.onblur();
    this._type = type;
    this.onfocus();
  }

  midiOnRefresh() {
    this.midiInput.rebind(event => this.onmidievent(event));
  }

  midiRefresh() { this.midiInput.refresh(); }

  midiNames() { return this.midiInput.names(); }

  // properties of keyer
  get pitch() { return this.iambic.pitch; }

  set pitch(hertz) { this.straight.pitch = hertz; this.iambic.pitch = hertz; }

  get gain() { return this.iambic.gain; }

  set gain(gain) { 
    // console.log(`KeyerInput set gain ${gain}`);
    this.iambic.gain = gain; this.straight.gain = gain; 
  }

  get rise() { return this.iambic.rise; }

  set rise(ms) { this.iambic.rise = ms; this.straight.rise = ms; }

  get fall() { return this.iambic.fall; }

  set fall(ms) { this.iambic.fall = ms; this.straight.fall = ms; }

  get wpm() { return this.iambic.wpm; }

  set wpm(wpm) { this.iambic.wpm = wpm; }

  get dah() { return this.iambic.dah; }

  set dah(dah) { this.iambic.dah = dah; }

  get ies() { return this.iambic.ies; }

  set ies(ies) { this.iambic.ies = ies; }

  get ils() { return this.iambic.ils; }

  set ils(ils) { this.iambic.ils = ils; }

  get iws() { return this.iambic.iws; }

  set iws(iws) { this.iambic.iws = iws; }

  get swapped() { return this.iambic.swapped; }

  set swapped(swapped) { this.iambic.swapped = swapped; }
}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
