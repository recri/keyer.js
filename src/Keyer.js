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
    // this.output.on('element', (elt, timeEnded) => this.outputDecoder.onelement(elt, timeEnded));
    this.output.on('transition', (onoff, time) => this.outputDecoder.ontransition(onoff, time));

    // input decoder wiring
    if (USE_DETONER) {
      this.input.on('change:pitch', pitch => this.inputDecoder.onchangepitch(pitch));
      this.inputDecoder.onchangepitch(this.input.pitch);
      this.input.connect(this.inputDecoder.target);
      this.inputDecoder.connect(this.context.destination);
    } else if (USE_DETIMER) {
      this.input.connect(this.context.destination);
      this.input.on('transition', (onoff, time) => this.inputDecoder.ontransition(onoff, time));
    } else {
      this.input.connect(this.context.destination);
      this.input.on('transition', (onoff, time) => this.inputDecoder.ontransition(onoff, time));
      // this.input.on('element', (elt, timeEnded) => this.inputDecoder.onelement(elt, timeEnded));
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
    this.envelope = 'hann';
    this.envelope2 = 'rectangular';
    this.swapped = false;
    this.inputKey = 'paddle';
    this.inputSources = ['keyboard'];
    this.inputMidi = 'none';
    this.leftPaddleKey = 'AltRight';
    this.rightPaddleKey = 'ControlRight';
    this.straightKey = 'ControlRight';
    this.leftPaddleMidi = '1:0';
    this.rightPaddleMidi = '1:1';
    this.straightMidi = '1:1';

    this.qrq = 'off';
  }

  // keyboard handlers
  keydown(e) { this.input.kbdKey(e, true); }

  keyup(e) { this.input.kbdKey(e, false); }

  touchKey(e,type,onOff) { this.input.touchKey(e, type, onOff); }
  
  mouseKey(e,type,onOff) { this.input.mouseKey(e, type, onOff); }
  
  // keypress(e) { this.outputSend(e.key); }

  // useful actions
  outputSend(text) { this.output.send(text); }

  outputUnsend() { this.output.unsend(); }

  outputCancel() { this.output.cancelPending(); }

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

  get envelope() { return this.output.envelope; }

  set envelope(v) { this.input.envelope = v; this.output.envelope = v; }
  
  get envelope2() { return this.output.envelope2; }

  set envelope2(v) { this.input.envelope2 = v; this.output.envelope2 = v; }
  
  static get envelopes() { return KeyerOutput.envelopes; }
  
  get speed() { return this.output.wpm; }

  set speed(v) { this.input.wpm = v; this.output.wpm = v; }

  get swapped() { return this.input.swapped ? 'on' : 'off'; }

  set swapped(v) { this.input.swapped = v === 'on'; }

  set inputKey(v) { this.input.key = v; }

  get inputKey() { return this.input.key; }

  set inputSources(v) { this.input.sources = v; }

  get inputSources() { return this.input.sources; }

  set inputMidi(v) { this.input.midi = v; }

  get inputMidi() { return this.input.midi; }
  
  get inputMidiNames() { return this.input.midiNames; }
  
  get inputMidiNotes() { return this.input.midiNotes; }
  
  set leftPaddleKey(v) { this.input.leftPaddleKey = v; }

  get leftPaddleKey() { return this.input.leftPaddleKey; }

  set rightPaddleKey(v) { this.input.rightPaddleKey = v; }

  get rightPaddleKey() { return this.input.rightPaddleKey; }

  set leftPaddleMidi(v) { this.input.leftPaddleMidi = v; }

  get leftPaddleMidi() { return this.input.leftPaddleMidi; }

  set rightPaddleMidi(v) { this.input.rightPaddleMidi = v; }

  get rightPaddleMidi() { return this.input.rightPaddleMidi; }

  set straightKey(v) { this.input.straightKey = v; }

  get straightKey() { return this.input.straightKey; }

  set straightMidi(v) { this.input.straightMidi = v; }

  get straightMidi() { return this.input.straightMidi; }

}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
