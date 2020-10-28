import { KeyerEvent } from './KeyerEvent.js';
import { KeyerOutput } from './KeyerOutput.js';
import { KeyerDecode } from './KeyerDecode.js';
import { KeyerInput } from './KeyerInput.js';
import { KeyerMicrophone } from './KeyerMicrophone.js';

const USE_DETONER = false; // decode from sidetone
const USE_DETIMER = false; // decode from transitions

// combine inputs and outputs
export class Keyer extends KeyerEvent {

  constructor(context) {
    super(context);
    this.enabled = false;
    this.output = new KeyerOutput(this.context);
    this.outputDecoder = new KeyerDecode(this.context);
    this.input = new KeyerInput(this.context);
    this.inputDecoder = new KeyerDecode(this.context);
    this.microphone = new KeyerMicrophone(this.context);
    this.progress = { itemsPerSession: 5, repsPerItem: 5 };

    // decode from elements, except for decoding straight key
    // output decoder wiring
    if (USE_DETONER) {
      this.output.on('change:pitch', pitch => this.outputDecoder.onchangepitch(pitch));
      this.outputDecoder.onchangepitch(this.output.pitch);
      this.output.connect(this.outputDecoder.target);
      this.outputDecoder.connect(this.context.destination);
    } else if (USE_DETIMER) {
      this.output.connect(this.context.destination);
      this.output.on('transition', this.outputDecoder.ontransition, this.outputDecoder);
    } else {
      this.output.connect(this.context.destination);
      this.output.on('element', this.outputDecoder.onelement, this.outputDecoder);
    }

    // input decoder wiring
    if (USE_DETONER) {
      this.input.straight.on('change:pitch', pitch => this.inputDecoder.onchangepitch(pitch));
      this.input.iambic.on('change:pitch', pitch => this.inputDecoder.onchangepitch(pitch));
      this.inputDecoder.onchangepitch(this.input.pitch);
      this.input.connect(this.inputDecoder.target);
      this.inputDecoder.connect(this.context.destination);
    } else if (USE_DETIMER) {
      this.input.connect(this.context.destination);
      this.input.straight.on('transition', this.inputDecoder.ontransition, this.inputDecoder);
      this.input.iambic.on('transition', this.inputDecoder.ontransition, this.inputDecoder);
    } else {
      this.input.connect(this.context.destination);
      this.input.straight.on('transition', this.inputDecoder.ontransition, this.inputDecoder);
      this.input.iambic.on('element', this.inputDecoder.onelement, this.inputDecoder);
    }

    this.table = this.output.table;
    this.outputDecoder.table = this.table;
    this.inputDecoder.table = this.table;

    this.pitch = 700;
    this.gain = -26;
    this.speed = 15;
    this.rise = 4;
    this.fall = 4;
    this.dah = 3;
    this.ies = 1;
    this.ils = 3;
    this.iws = 7;
    this.midi = 'none';
    this.swapped = false;
    this.type = 'iambic';

    this.itemsPerSession = 5;
    this.repsPerItem = 5;
  }

  // parameters

  // keyboard handlers
  /* eslint class-methods-use-this: ["error", { "exceptMethods": ["keydown","keyup","keypress"] }] */
  keydown(e) { this.input.keydown(e); }

  keyup(e) { this.input.keyup(e); }

  keypress(e) { this.outputSend(e.key); }

  // useful actions
  outputSend(text) { this.output.send(text); }

  outputUnsend(text) { this.output.unsend(text); }

  outputCancel() { this.output.cancel(); }

  outputDecoderOnLetter(callback, context) { this.outputDecoder.on('letter', callback, context); }

  outputDecoderOffLetter(callback, context) { this.outputDecoder.off('letter', callback, context); }

  inputMidiOnRefresh(callback, context) { this.input.midiOnRefresh(callback, context); }

  inputMidiRefresh() { this.input.midiRefresh(); }

  inputMidiNames() { return this.input.midiNames(); }

  inputDecoderOnLetter(callback, context) { this.inputDecoder.on('letter', callback, context); }

  inputDecoderOffLetter(callback, context) { this.inputDecoder.off('letter', callback, context); }

  inputKeydown(isleft) { this.input.keydown(isleft); }

  inputKeyup(isleft) { this.input.keyup(isleft); }

  inputFocus() { this.input.onfocus(); }

  inputBlur() { this.input.onblur(); }

  currentTime() { return this.context.currentTime; }

  // direct getters and setters on properties
  // setting input and output the same
  get pitch() { return this.output.pitch; }

  set pitch(v) { this.input.pitch = v; this.output.pitch = v; }

  get gain() { return this.output.gain; }

  set gain(v) { this.input.gain = v; this.output.gain = v; }

  get rise() { return this.output.rise; }

  set rise(v) { this.input.rise = v; this.output.rise = v; }

  get fall() { return this.output.fall; }

  set fall(v) { this.input.fall = v; this.output.fall = v; }

  get speed() { return this.output.wpm; }

  set speed(v) { this.input.wpm = v; this.output.wpm = v; }

  get dah() { return this.output.dah; }

  set dah(v) { this.input.dah = v; this.output.dah = v; }

  get ies() { return this.output.ies; }

  set ies(v) { this.input.ies = v; this.output.ies = v; }

  get ils() { return this.output.ils; }

  set ils(v) { this.input.ils = v; this.output.ils = v; }

  get iws() { return this.output.iws; }

  set iws(v) { this.input.iws = v; this.output.iws = v; }

  get midi() { return this.input.midi; }

  set midi(v) { this.input.midi = v; }

  get swapped() { return this.input.swapped; }

  set swapped(v) { this.input.swapped = v; }

  get type() { return this.input.type; }

  set type(v) { this.input.type = v; }

  static async createAudioProcessor(context, source, name) {
    try {
      await context.resume();
      await context.audioWorklet.addModule(source);
    } catch (e) {
      return null;
    }
    return new AudioWorkletNode(context, name);
  }
}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
