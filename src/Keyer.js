import { KeyerEvent } from './KeyerEvent.js';
import { KeyerOutput } from './KeyerOutput.js';
import { KeyerDecode } from './KeyerDecode.js';
import { KeyerInput } from './KeyerInput.js';
import { KeyerMicrophone } from './KeyerMicrophone.js';

const USE_DETONER = false; // decode from sidetone
const USE_DETIMER = false;  // decode from transitions

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

    // decode from elements, except for decoding straight key
    // output decoder wiring
    this.output.connect(this.context.destination);
    this.output.on('element', this.outputDecoder.onelement, this.outputDecoder);

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
    this.weight = 50;
    this.ratio = 50;
    this.compensation = 0;
    this.rise = 4;
    this.fall = 4;
    this.dah = 3;
    this.ies = 1;
    this.ils = 3;
    this.iws = 7;
    this.swapped = false;
    this.inputKeyer = 'iambic';
    this.inputSources = ['keyboard'];
    this.inputMidi = 'none';
    this.leftPaddleKey = 'AltRight';
    this.rightPaddleKey = 'ControlRight';
    this.straightKey = 'ControlRight';
    this.leftPaddleMidi = 'none';
    this.rightPaddleMidi = 'none';
    this.straightMidi = 'none';

    this.qrq = 'off';
  }

  // keyboard handlers
  /* eslint class-methods-use-this: ["error", { "exceptMethods": ["keydown","keyup","keypress"] }] */
  keydown(e) { this.input.keydown(e); }

  keyup(e) { this.input.keyup(e); }

  keypress(e) { this.outputSend(e.key); }

  // useful actions
  outputSend(text) { this.output.send(text); }

  outputUnsend(text) { this.output.unsend(text); }

  outputCancel() { this.output.cancelPending(); }

  outputDecoderOnLetter(callback, context) { this.outputDecoder.on('letter', callback, context); }

  outputDecoderOffLetter(callback, context) { this.outputDecoder.off('letter', callback, context); }

  inputMidiOnRefresh(callback, context) { this.input.midiOnRefresh(callback, context); }

  inputMidiRefresh() { this.input.midiRefresh(); }

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

  set weight(v) { this.input.weight = v; this.output.weight = v; }

  get weight() { return this.output.weight; }

  set ratio(v) { this.input.ratio = v; this.output.ratio = v; }

  get ratio() { return this.output.ratio; }
  
  set compensation(v) { this.input.compensation = v; this.output.compensation = v; }

  get compensation() { return this.output.compensation; }
  
  get rise() { return this.output.rise; }

  set rise(v) { this.input.rise = v; this.output.rise = v; }

  get fall() { return this.output.fall; }

  set fall(v) { this.input.fall = v; this.output.fall = v; }

  get speed() { return this.output.wpm; }

  set speed(v) { this.input.wpm = v; this.output.wpm = v; }

  get swapped() { return this.input.swapped ? 'on' : 'off'; }

  set swapped(v) { this.input.swapped = v === 'on'; }

  set inputKeyer(v) { this.input.keyer = v; }

  get inputKeyer() { return this.input.keyer; }

  set inputSources(v) { this.input.sources = v; }

  get inputSources() { return this.input.sources; }

  set inputMidi(v) { this.input.midi = v; }

  get inputMidi() { return this.input.midi; }
  
  get inputMidiNames() { return this.input.midiNames; }
  
  set leftPaddleKey(v) { this.input.leftPaddleKey = v; }

  get leftPaddleKey() { return this.input.leftPaddleKey; }

  set rightPaddleKey(v) { this.input.rightPaddleKey = v; }

  get rightPaddleKey() { return this.input.rightPaddleKey; }

  set straightKey(v) { this.input.straightKey = v; }

  get straightKey() { return this.input.straightKey; }

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
