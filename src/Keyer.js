import { KeyerOutput } from './KeyerOutput.js';
import { KeyerDecode } from './KeyerDecode.js';
import { KeyerInput } from './KeyerInput.js';
import { KeyerMicrophone } from './KeyerMicrophone.js';

const USE_DETONER = false; // decode from sidetone
const USE_DETIMER = false; // decode from transitions

// combine inputs and outputs
export class Keyer {
  constructor(params) {
    this.enabled = false;
    this.context = new AudioContext();
    this.output = new KeyerOutput(this.context);
    this.outputDecoder = new KeyerDecode(this.context);
    this.input = new KeyerInput(this.context);
    this.inputDecoder = new KeyerDecode(this.context);
    this.microphone = new KeyerMicrophone(this.context);
    this.progress = { itemsPerSession: 5, repsPerItem: 5 };

    // decode from elements, except for decoding straight key
    // output decoder wiring
    if (USE_DETONER) {
      this.output.on('change:pitch', pitch => this.outputDecoder.onchangepitch(pitch) );
      this.outputDecoder.onchangepitch(this.output.pitch);
      this.output.connect(this.outputDecoder.target);
      this.outputDecoder.connect(this.context.destination);
    } else if (USE_DETIMER) {
      this.output.connect(this.context.destination);
      this.output.on( 'transition', this.outputDecoder.ontransition, this.outputDecoder );
    } else {
      this.output.connect(this.context.destination);
      this.output.on( 'element', this.outputDecoder.onelement, this.outputDecoder );
    }

    // input decoder wiring
    if (USE_DETONER) {
      this.input.straight.on('change:pitch', pitch => this.inputDecoder.onchangepitch(pitch) );
      this.input.iambic.on('change:pitch', pitch => this.inputDecoder.onchangepitch(pitch) );
      this.inputDecoder.onchangepitch(this.input.pitch);
      this.input.connect(this.inputDecoder.target);
      this.inputDecoder.connect(this.context.destination);
    } else if (USE_DETIMER) {
      this.input.connect(this.context.destination);
      this.input.straight.on( 'transition', this.inputDecoder.ontransition, this.inputDecoder );
      this.input.iambic.on( 'transition', this.inputDecoder.ontransition, this.inputDecoder );
    } else {
      this.input.connect(this.context.destination);
      this.input.straight.on( 'transition', this.inputDecoder.ontransition, this.inputDecoder );
      this.input.iambic.on( 'element', this.inputDecoder.onelement, this.inputDecoder );
    }

    this.table = this.output.table;
    this.outputDecoder.table = this.table;
    this.inputDecoder.table = this.table;

    // console.log("station", params);
    if (params) this.setParams(params);
    else this.setDefaults();
  }

    // parameters
  static defaults = {
    inputPitch: 622.25 /* Eb5 */,
    outputPitch: 523.25 /* C5 */,

    inputGain: -26,
    inputWpm: 15,
    inputRise: 4,
    inputFall: 4,
    inputDah: 3,
    inputIes: 1,
    inputIls: 3,
    inputIws: 7,
    inputMidi: 'none',
    inputSwapped: false,
    inputType: 'iambic',

    outputGain: -26,
    outputWpm: 15,
    outputRise: 4,
    outputFall: 4,
    outputDah: 3,
    outputIes: 1,
    outputIls: 3,
    outputIws: 7,

    itemsPerSession: 5,
    repsPerItem: 5,
  };

  getParams() {
    const params = {};
    for (const name of Object.keys(Keyer.defaults)) {
      params[name] = this[name];
    }
    return params;
  }

  setParams(params) {
    for (const name of Object.keys(params)) {
      this[name] = params[name];
    }
  }

  setDefaults() { this.setParams(Keyer.defaults); }

  // useful actions
  outputSend(text) { this.output.send(text); }

  outputCancel() { this.output.keyOff(); }

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
  get inputPitch() { return this.input.pitch; }

  set inputPitch(v) { this.input.pitch = v; }

  get gain() { return this.inputGain; }

  set gain(v) { this.inputGain = v; this.outputGain = v; }

  get rise() { return this.inputRise; }

  set rise(v) { this.inputRise = v; this.outputRise = v; }

  get fall() { return this.inputFall; }

  set fall(v) { this.inputFall = v; this.outputFall = v; }

  get wpm() { return this.inputWpm; }

  set wpm(v) { this.inputWpm = v; this.outputWpm = v; }

  get dah() { return this.inputDah; }

  set dah(v) { this.inputDah = v; this.outputDah = v; }

  get ies() { return this.inputIes; }

  set ies(v) { this.inputIes = v; this.outputIes = v; }

  get ils() { return this.inputIls; }

  set ils(v) { this.inputIls = v; this.outputIls = v; }

  get iws() { return this.inputIws; }

  set iws(v) { this.inputIws = v; this.outputIws = v; }

  get gainDB() { return this.inputGain; }

  set gainDB(v) { this.inputGain = v; this.outputGain = v; }

  get riseMs() { return this.inputRise; }

  set riseMs(v) { this.inputRise = v; this.outputRise = v; }

  get fallMs() { return this.inputFall; }

  set fallMs(v) { this.inputFall = v; this.outputFall = v; }

  get inputGain() { return this.input.gain; }

  set inputGain(v) { this.input.gain = v; }

  get inputRise() { return this.input.rise; }

  set inputRise(v) { this.input.rise = v; }

  get inputFall() { return this.input.fall; }

  set inputFall(v) { this.input.fall = v; }

  get inputWpm() { return this.input.wpm; }

  set inputWpm(v) { this.input.wpm = v; }

  get inputDah() { return this.input.dah; }

  set inputDah(v) { this.input.dah = v; }

  get inputIes() { return this.input.ies; }

  set inputIes(v) { this.input.ies = v; }

  get inputIls() { return this.input.ils; }

  set inputIls(v) { this.input.ils = v; }

  get inputIws() { return this.input.iws; }

  set inputIws(v) { this.input.iws = v; }

  get inputMidi() { return this.input.midi; }

  set inputMidi(v) { this.input.midi = v; }

  get inputSwapped() { return this.input.swapped; }

  set inputSwapped(v) { this.input.swapped = v; }

  get inputType() { return this.input.type; }

  set inputType(v) { this.input.type = v; }

  get outputPitch() { return this.output.pitch; }

  set outputPitch(v) { this.output.pitch = v; }

  get outputGain() { return this.output.gain; }

  set outputGain(v) { this.output.gain = v; }

  get outputWpm() { return this.output.wpm; }

  set outputWpm(v) { this.output.wpm = v; }

  get outputRise() { return this.output.rise; }

  set outputRise(v) { this.output.rise = v; }

  get outputFall() { return this.output.fall; }

  set outputFall(v) { this.output.fall = v; }

  get outputDah() { return this.output.dah; }

  set outputDah(v) { this.output.dah = v; }

  get outputIes() { return this.output.ies; }

  set outputIes(v) { this.output.ies = v; }

  get outputIls() { return this.output.ils; }

  set outputIls(v) { this.output.ils = v; }

  get outputIws() { return this.output.iws; }

  set outputIws(v) { this.output.iws = v; }

  get inputGainDB() { return this.inputGain; }

  set inputGainDB(v) { this.inputGain = v; }

  get inputRiseMs() { return this.inputRise; }

  set inputRiseMs(v) { this.inputRise = v; }

  get inputFallMs() { return this.inputFall; }

  set inputFallMs(v) { this.inputFall = v; }

  get outputGainDB() { return this.outputGain; }

  set outputGainDB(v) { this.outputGain = v; }

  get outputRiseMs() { return this.outputRise; }

  set outputRiseMs(v) { this.outputRise = v; }

  get outputFallMs() { return this.outputFall; }

  set outputFallMs(v) { this.outputFall = v; }

  get itemsPerSession() { return this.progress.itemsPerSession; }

  set itemsPerSession(v) { this.progress.itemsPerSession = v; }

  get repsPerItem() { return this.progress.repsPerItem; }

  set repsPerItem(v) { this.progress.repsPerItem = v; }

  static async createAudioProcessor(context, source, name) {
    try {
      await context.resume();
      await context.audioWorklet.addModule(source);
    } catch(e) {
      return null;
    }
    return new AudioWorkletNode(context, name);
  }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
