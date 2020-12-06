//
// keyer.js - a progressive web app for morse code
// Copyright (c) 2020 Roger E Critchlow Jr, Charlestown, MA, USA
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// 

/* eslint no-param-reassign: ["error", { "props": false }] */

import { LitElement, html, css } from 'lit-element';
import { keyerLogo } from './keyer-logo.js';
import { Keyer } from './Keyer.js';

//
// prefix global constant functions and data
//

// const straightKeyArrow = '\u23f7';
// const leftKeyArrow = '\u23f4';
// const rightKeyArrow = '\u23f5';

const shownSymbol = '\u23f7';
const hiddenSymbol = '\u23f5';

const playSymbol = '\u23f5';
const pauseSymbol = '\u23f8';

const uncheckedCheckBox = '\u2610';
const checkedCheckBox = '\u2611';

// always force default values, because I don't trust what's stored, yet
const alwaysForceDefault = false;

// application color scheme, from material design color tool
// const colorPrimary = css`#1d62a7`;
// const colorPLight = css`#5b8fd9`;
// const colorPDark  = css`#003977`;
// const colorSecondary = css`#9e9e9e`;
// const colorSLight = css`#cfcfcf`;
// const colorSDark =  css`#707070`;

//
// property database
// stores lit-element properties() values as .lit
// stores default values as .value
//
const controls = {
  running: { 
    type: 'toggle', lit: { type: Boolean}, 
    label: '',  on: pauseSymbol, off: playSymbol,
    title: 'Run or pause the web audio rendering engine.'
  },
  displaySettings: {
    type: 'folder', lit: {type: Boolean}, value: true,
    label: 'Settings', level: 2, 
    title: 'Settings that control the behavior of keyer.js.'
  },
  displayKeyboardSettings: { 
    type: 'folder', lit: { type: Boolean}, value: true,
    label: 'Keyboard Keyer', level: 3, 
    title: 'Settings for keyboard keying.'
  },
  displayAdvancedKeyboardSettings: { 
    type: 'folder', lit: { type: Boolean}, value: false,
    label: 'More Keyboard Keyer', level: 4, 
    title: 'Additional settings for keyboard keying.'
  },
  displayManualSettings: {
    type: 'folder', lit: { type: Boolean}, value: false, 
    label: 'Manual Keyer', level: 3, 
    title: 'Settings for manually keying.'
  },
  displayAdvancedManualSettings: {
    type: 'folder', lit: { type: Boolean}, value: false, 
    label: 'More Manual Options', level: 4, 
    title: 'Additional settings for manual keying.'
  },
  displayMiscSettings: {
    type: 'folder', lit: { type: Boolean}, value: false, 
    label: 'More Options', level: 3, 
    title: "Other settings."
  },
  displayScope: {
    type: 'folder', lit: { type: Boolean}, value: false,
    label: 'Scope', level: 2, 
    title: 'An oscilloscope for observing keyer.js.'
  },
  displayStatus: {
    type: 'folder', lit: { type: Boolean}, value: true,
    label: 'Status', level: 2, 
    title: 'Status information about the operation of web audio.'
  },
  displayAbout: {
    type: 'folder', lit: { type: Boolean}, value: false,
    label: 'About', level: 2, 
    title: 'What keyer.js does and how it works.'
  },
  displayLicense: { 
    type: 'folder', lit: { type: Boolean}, value: false,
    label: 'License', level: 2, 
    title: 'How keyer.js is licensed.'
  },
  displayColophon: {
    type: 'folder', lit: { type: Boolean}, value: false,
    label: 'Colophon', level: 2, 
    title: 'How Keyer.js was built.'
  },
  displayTouchStraight: { 
    lit: { type: Boolean }, value: false,
  },
  displayTouchPaddle: {
    lit: { type: Boolean }, value: false,
  },
  speed: {
    type: 'spinner', lit: { type: Number }, value: 20,
    label: 'Speed', min: 10, max: 150, step: 1, unit: 'WPM', size: 4,
    title: 'The speed of the characters in words/minute (WPM).'
  },
  gain: { 
    type: 'spinner', lit: { type: Number }, value: -26,
    label: 'Gain', min: -50, max: 10, step: 1, unit: 'dB', size: 4,
    title: 'The volume relative to full scale.'
  },
  pitch: { 
    type: 'spinner', lit: { type: Number }, value: 700,
    label: 'Pitch', min: 250, max: 2000, step: 1, unit: 'Hz', size: 4,
    title: 'The frequency of the keying tone.'
  },
  weight: { 
    type: 'spinner', lit: { type: Number }, value: 50,
    label: 'Weight', min: 25, max: 75, step: 0.1, unit: '%', size: 4,
    title: 'The relative weight of marks and spaces.'
  },
  ratio: { 
    type: 'spinner', lit: { type: Number }, value: 50,
    label: 'Ratio', min: 25, max: 75, step: 0.1, unit: '%', size: 4,
    title: 'The relative length of dits and dahs.'
  },
  compensation: { 
    type: 'spinner', lit: { type: Number }, value: 0,
    label: 'Compensation', min: -15, max: 15, step: 0.1, unit: '%', size: 5,
    title: 'A final fudge factor on element timing.'
  },
  rise: { 
    type: 'spinner', lit: { type: Number }, value: 4,
    label: 'Rise', min: 1, max: 10, step: 0.1, unit: 'ms', size: 3,
    title: 'The rise time of keyed elements.'
  },
  fall: { 
    type: 'spinner', lit: { type: Number }, value: 4,
    label: 'Fall', min: 1, max: 10, step: 0.1, unit: 'ms', size: 3,
    title: 'The fall time of the keyed signal.'
  },
  envelope: {
    type: 'options', lit: { type: String }, value: 'hann',
    label: '', options: 'envelopes',
    title: 'The first window function for the keying envelope.'
  },
  envelope2: {
    type: 'options', lit: { type: String }, value: 'rectangular',
    label: '', options: 'envelopes',
    title: 'The second window function for the keying envelope.'
  },
  shape: {
    label: 'Envelope', type: 'envelope',
    envelope1: 'envelope', envelope2: 'envelope2',
    title: 'The keying envelope is the product of two window functions.'
  },
  paddleKeyer: {
    type: 'options', lit: { type: String }, value: 'nd7pa-b',
    label: 'Keyer', options: 'paddleKeyers',
    title: 'The keyer that translates paddle events into key events.'
  },
  paddleSwapped: {
    type: 'toggle', lit: { type: Boolean }, value: false,
    label: 'Swapped', on: 'true', off: 'false',
    title: 'Should the paddles be swapped.'
  },
  straightKey: {
    type: 'options', lit: { type: String }, value: 'ControlLeft',
    label: 'Straight', options: 'shiftKeys',
    title: 'Keyboard shift key that activates the straight key.'
  },
  leftPaddleKey: {
    type: 'options', lit: { type: String }, value: 'AltRight',
    label: 'Left', options: 'shiftKeys',
    title: 'Keyboard shift key that activates the left paddle.'
  },
  rightPaddleKey: {
    type: 'options', lit: { type: String }, value: 'ControlRight',
    label: 'Right', options: 'shiftKeys',
    title: 'Keyboard shift key that activates the right paddle.'
  },
  straightMidi: {
    type: 'options', lit: { type: String }, value: 'None', 
    label: 'Straight', options: 'midiNotes',
    title: 'MIDI note that activates the straight key.'
  },
  leftPaddleMidi: {
    type: 'options', lit: { type: String }, value: 'None',
    label: 'Left', options: 'midiNotes',
    title: 'MIDI note that activates the left paddle.'
  },
  rightPaddleMidi: {
    type: 'options', lit: { type: String }, value: 'None',
    label: 'Right', options: 'midiNotes',
    title: 'MIDI note that activates the right paddle.'
  },
  
  inputSpeed: 'speed',
  inputPitch: 'pitch',
  inputGain: 'gain',
  inputWeight: 'weight',
  inputRatio: 'ratio',
  inputCompensation: 'compensation',
  inputRise: 'rise',
  inputFall: 'fall',
  inputEnvelope: 'envelope',
  inputEnvelope2: 'envelope2',

  inputShape: {
    label: '', type: 'envelope',
    envelope1: 'inputEnvelope', envelope2: 'inputEnvelope2',
    title: 'The keying envelope is the product of two window functions.'
  },
  requestedSampleRate: {
    type: 'options', lit: { type: Number }, value: '48000',
    label: 'Requested sample rate', options: 'sampleRates',
    title: 'Request web audio to run at a specific sample rate.'
  },
  scopeRunning: { 
    type: 'toggle', lit: { type: Boolean }, value: false, 
    label: '', on: 'Stop', off: 'Run',
    title: 'Whether the scope is capturing and displaying samples.'
  },
  scopeTrigger: {
    type: 'options', lit: { type: String }, value: 'none', 
    label: 'Trigger', options: 'scopeTriggers',
    title: 'Whether the scope is looking for a trigger transition.'
  },
  scopeTriggerChannel: { 
    type: 'options', lit: { type: String }, value: 'none', 
    label: 'Channel', options: 'scopeChannels',
    title: 'The channel the scope examines for the trigger.'
  },
  scopeHold: {
    type: 'options', lit: { type: String }, value: '1s',
    label: 'Hold', options: 'scopeHolds',
    title: 'The hold off time after a trigger.'
  },
  scopeTimeScale: { 
    type: 'options', lit: { type: String }, value: '10ms/div',
    label: 'Time', options: 'scopeTimeScales',
    title: 'The amount of time represented on the scope horizontal scale.'
  },
  scopeEnable1: {
    type: 'check', lit: { type: Boolean }, value: false,
    label: 'ch1',
    title: 'Whether this channel is enabled for capture.'
  },
  scopeSource1: {
    type: 'options', lit: { type: String }, value: 'none',
    label: 'Source', options: 'scopeSources',
    title: 'The source of the signal on this channel'
  },
  scopeVerticalScale1: {
    type: 'options', lit: { type: String }, value: '200mFS/div',
    label: 'Vertical', options: 'scopeVerticalScales',
    title: 'The vertical scale on this channel.'
  },
  scopeEnable2: {
    type: 'check', lit: { type: Boolean }, value: false,
    label: 'ch2',
    title: 'Whether this channel is enabled.'
  },
  scopeSource2: 'scopeSource1',
  scopeVerticalScale2: 'scopeVerticalScale1',

  // read only context values
  state: { lit: { type: String } },
  sampleRate: { lit: { type: Number } },
  currentTime: { lit: { type: Number }  },
  baseLatency: { lit: { type: Number } },
  
  // read only midi flag
  midiAvailable: { lit: { type: Boolean } },
  
  // read only values supplying options lists
  // most are constant, midiNotes changes
  envelopes: { lit: { type: Array } },
  paddleKeyers: { lit: { type: Array } },
  shiftKeys: { lit: { type: Array } },
  midiNotes: { lit: { type: Array } },
  sampleRates: { lit: { type: Array } },
  scopeTriggers: { lit: { type: Array } },
  scopeChannels: { lit: { type: Array } },
  scopeHolds: { lit: { type: Array } },
  scopeTimeScales: { lit: { type: Array } },
  scopeSources: { lit: { type: Array } },
  scopeVerticalScales: { lit: { type: Array } },

  // tty window content
  content: { lit: { type: Object } },
  finished: { lit: { type: Array } },
  pending: { lit: { type: Array } },
}; 

export class KeyerJs extends LitElement {

  // declare the controls of the ui
  static get controls() { return controls; }

  // extract LitElement properties from controls
  static get properties() { 
    if ( ! KeyerJs._properties) {
      KeyerJs._properties = {};
      Object.keys(KeyerJs.controls)
	.filter(x => 'lit' in KeyerJs.getControl(x))
	.forEach(x => { KeyerJs._properties[x] = KeyerJs.getControl(x).lit });
    }
    return KeyerJs._properties;
  }

  // get the control object for a control
  // implement single string value indicates
  // indirect to the control named by the string
  static getControl(control) {
    const c = KeyerJs.controls[control];
    if (c && typeof c === 'string')
      return KeyerJs.controls[c];
    return c;
  }
  
  // property getters and setters

  // properties of web audio context
  set running(v) { 
    // console.log(`set running = ${v}, running is ${this.running}`);
    if (v !== this._running) {
      this._running = v;
      if (v) {
	// console.log(`calling resume`);
	this.keyer.context.resume();
	// this cures need to twiddle the gain to get iambic keying to work
	// I wish I understood why
	this.gain += 1;
	this.gain -= 1;
      } else {
	this.keyer.context.suspend(); 
      }
    }
    // console.log(`set running = ${v}, running is now ${this.running} and state is ${this.keyer.context.state}`);
  }

  get running() { return this._running; }
  
  get currentTime() { return this.keyer.currentTime; }

  get sampleRate() { return this.keyer.sampleRate; }

  get baseLatency() { return this.keyer.baseLatency; }

  get state() { return this.keyer.context.state; }
  
  get midiAvailable() { return this.keyer.midiSource.midiAvailable; }
  
  get midiNotes() { return this.keyer.midiSource.notes; }
  
  // keyboard keyer properties
  set pitch(v) { this.keyer.output.pitch = v; }

  get pitch() { return this.keyer.output.pitch; }

  set gain(v) { this.keyer.output.gain = v; }
  
  get gain() { return this.keyer.output.gain; }

  set speed(v) { this.keyer.output.speed = v; }

  get speed() { return this.keyer.output.speed; }

  set weight(v) { this.keyer.output.weight = v; }

  get weight() { return this.keyer.output.weight; }

  set ratio(v) { this.keyer.output.ratio = v; }

  get ratio() { return this.keyer.output.ratio; }

  set compensation(v) { this.keyer.output.compensation = v; }

  get compensation() { return this.keyer.output.compensation; }

  set rise(v) { this.keyer.output.rise = v; }

  get rise() { return this.keyer.output.rise; }

  set fall(v) {  this.keyer.output.fall = v; }

  get fall() { return this.keyer.output.fall; }

  set envelope(v) { this.keyer.output.envelope = v; }

  get envelope() { return this.keyer.output.envelope; }

  set envelope2(v) { this.keyer.output.envelope2 = v; }

  get envelope2() { return this.keyer.output.envelope2; }

  get envelopes() { return this.keyer.output.envelopes; }
  
  // keyer properties for manual keyer
  set paddleSwapped(v) {  this.keyer.input.swapped = v; }

  get paddleSwapped() { return this.keyer.input.swapped; }

  get paddleKeyers() { return this.keyer.input.keyers; }

  set paddleKeyer(v) { this.keyer.input.keyer = v; }

  get paddleKeyer() { return this.keyer.input.keyer; }

  set straightKey(v) { this.keyer.input.straightKey = v; }

  get straightKey() { return this.keyer.input.straightKey; }

  set leftPaddleKey(v) { this.keyer.input.leftPaddleKey = v; }

  get leftPaddleKey() { return this.keyer.input.leftPaddleKey; }

  set rightPaddleKey(v) { this.keyer.input.rightPaddleKey = v; }

  get rightPaddleKey() { return this.keyer.input.rightPaddleKey; }

  set straightMidi(v) { this.keyer.input.straightMidi = v; }

  get straightMidi() { return this.keyer.input.straightMidi; }

  set leftPaddleMidi(v) { this.keyer.input.leftPaddleMidi = v; }

  get leftPaddleMidi() { return this.keyer.input.leftPaddleMidi; }

  set rightPaddleMidi(v) { this.keyer.input.rightPaddleMidi = v; }

  get rightPaddleMidi() { return this.keyer.input.rightPaddleMidi; }

  // manual keyer properties
  set inputPitch(v) { this.keyer.input.pitch = v; }

  get inputPitch() { return this.keyer.input.pitch; }

  set inputGain(v) { this.keyer.input.gain = v; }
  
  get inputGain() { return Math.round(this.keyer.input.gain); }

  set inputSpeed(v) { this.keyer.input.speed = v; }

  get inputSpeed() { return this.keyer.input.speed; }

  set inputWeight(v) { this.keyer.input.weight = v; }

  get inputWeight() { return this.keyer.input.weight; }

  set inputRatio(v) { this.keyer.input.ratio = v; }

  get inputRatio() { return this.keyer.input.ratio; }

  set inputCompensation(v) { this.keyer.input.compensation = v; }

  get inputCompensation() { return this.keyer.input.compensation; }

  set inputRise(v) { this.keyer.input.rise = v; }

  get inputRise() { return this.keyer.input.rise; }

  set inputFall(v) {  this.keyer.input.fall = v; }

  get inputFall() { return this.keyer.input.fall; }

  set inputEnvelope(v) { this.keyer.input.envelope = v; }

  get inputEnvelope() { return this.keyer.input.envelope; }

  set inputEnvelope2(v) { this.keyer.input.envelope2 = v; }

  get inputEnvelope2() { return this.keyer.input.envelope2; }

  // scope properties
  set scopeRunning(v) { this.keyer.scope.running = v; }
  
  get scopeRunning() { return this.keyer.scope.running; }
  
  set scopeTimeScale(v) { this.keyer.scope.timeScale = v; }

  get scopeTimeScale() { return this.keyer.scope.timeScale; }

  get scopeTimeScales() { return this.keyer.scope.timeScales; }
  
  get scopeTriggers() { return this.keyer.scope.triggers; }
  
  set scopeTrigger(v) { this.keyer.scope.trigger = v; }

  get scopeTrigger() { return this.keyer.scope.trigger; }
  
  get scopeChannels() { return this.keyer.scope.channels; }
  
  set scopeTriggerChannel(v) { this.keyer.scope.triggerChannel = v; }

  get scopeTriggerChannel() { return this.keyer.scope.triggerChannel; }
  
  get scopeHolds() { return this.keyer.scope.holds; }
  
  set scopeHold(v) { this.keyer.scope.hold = v; }

  get scopeHold() { return this.keyer.scope.hold; }
  
  get scopeSources() { return this.keyer.scope.sources; }

  get scopeVerticalScales() { return this.keyer.scope.verticalScales; }
  
  setScopeChannel(control, channel, value) { this.keyer.scope.channel(channel)[control] = value; }

  getScopeChannel(control, channel) { return this.keyer.scope.channel(channel)[control]; }
  
  set scopeSource1(v) { this.keyer.scope.channel(1).source = v; }

  get scopeSource1() { return this.keyer.scope.channel(1).source; }
  
  set scopeSource2(v) { this.keyer.scope.channel(2).source = v; }

  get scopeSource2() { return this.keyer.scope.channel(2).source; }

  set scopeVerticalScale1(v) { this.keyer.scope.channel(1).verticalScale = v; }

  get scopeVerticalScale1() { return this.keyer.scope.channel(1).verticalScale; }

  set scopeVerticalScale2(v) { this.keyer.scope.channel(2).verticalScale = v; }

  get scopeVerticalScale2() { return this.keyer.scope.channel(2).verticalScale; }

  constructor() {
    super();
    this.keyer = null;
    // only initialize the properties neede for startup
    this.displayAbout = false;
    this.displayLicense = false;
    this.displayColophon = false;
  }

  async start() {
    // start the engine

    // retrieve the preferred sample rate
    this.controlSetDefaultValue('requestedSampleRate', false);

    // create the audio context
    const context = new AudioContext({ sampleRate: parseInt(this.requestedSampleRate, 10) })

    // load the worklet processors
    await context.audioWorklet.addModule('src/KeyerASKProcessor.js');
    await context.audioWorklet.addModule('src/KeyerPaddleNoneProcessor.js');
    await context.audioWorklet.addModule('src/KeyerPaddleNd7paProcessor.js');
    await context.audioWorklet.addModule('src/KeyerPaddleVk6phProcessor.js');
    
    // build the keyer
    this.keyer = new Keyer(context);

    // load some constants into the instance
    // shift keys which can be used as key simulators
    // in truth, if I ignored repeats, then any key would work
    this.shiftKeys = ['None','ShiftLeft','ControlLeft','AltLeft','AltRight','ControlRight','ShiftRight'];
    // list of acceptable sample rates 
    this.sampleRates = ['8000', '32000', '44100', '48000', '96000', '192000', '384000' ];

    // using localStorage to persist defaults between sessions
    // defaults set at top of file
    this.controlSetDefaultValues(false);
    
    this.running = true;

    this.clear();

    this.validate();
    
    // this.keyer.outputDecoder.on('letter', (ltr, code) => console.log(`output '${ltr}' '${code}'`));
    this.keyer.inputDecoder.on('letter', (ltr) =>  this.onkeyed(ltr));
    this.keyer.output.on('sent', ltr => this.onsent(ltr));
    this.keyer.output.on('unsent', ltr => this.onunsent(ltr));
    this.keyer.output.on('skipped', ltr => this.onskipped(ltr));

    this.keyer.midiSource.on('midi:notes', () => this.requestUpdate('midiNotes', []));
    
    document.addEventListener('keydown', (e) => this.keyer.input.keyboardKey(e, true));
    document.addEventListener('keyup', (e) => this.keyer.input.keyboardKey(e, false));
  }
  
  // validate that our lists of options are actual options
  // and that default values are chosen from the same lists
  // also use the functions we define for this purpose
  validate() {
    for (const k of Object.keys(KeyerJs.properties))
      if (KeyerJs.properties[k].type === Boolean && this[k] !== true && this[k] !== false)
	console.log(`property '${k}' failed validate '${this[k]}' is not Boolean value`);
  }
	       
  //
  // teletype window
  //
  onfocus() {
    // console.log("keyboard focus");
    this.keyboardFocused = true;
    this.updateContent();	// show cursor
  }

  onblur() { 
    // console.log("keyboard blur");
    this.keyboardFocused = false;
    this.updateContent();	// hide cursor
  }

  updated(/* propertiesChanged */) { 
    if (this.keyboardFocused) {
      // scroll the div up if the cursor goes off bottom of div
      const keyboard = this.shadowRoot.querySelector('.keyboard');
      const cursor = this.shadowRoot.querySelector('.blinker');
      const fromBottom = cursor.offsetTop+cursor.offsetHeight-keyboard.offsetTop-keyboard.offsetHeight;
      if (fromBottom > 0) keyboard.scrollTop += cursor.offsetHeight;
    }
    if (this.keyer && this.keyer.scope && this.keyer.scope.enabled !== this.displayScope) {
      if (this.displayScope) {
	const canvas = this.shadowRoot.querySelector("canvas");
	if (canvas) this.keyer.scope.enable(this.displayScope, canvas);
      } else {
	this.keyer.scope.enable(false, null);
      }
    }
  }
  
  processFinished() {
    return this.finished.map(tagText => { const [tag,text] = tagText; return html`<span class="${tag}">${text}</span>`; });
  }

  blinkenCursen() {
    return this.keyboardFocused ? html`<span class="blinker">|</span>` : html`<span class="blinker"></span>`;
  }
  
  updateContent() {
    this.content = html`${this.processFinished()}<span class="pending">${this.pending.join('')}</span>${this.blinkenCursen()}`;
  }
  
  appendFinished(tag, text) {
    if (this.finished.length === 0)
      this.finished.push([tag, text]);
    else {
      const [ltag, ltext] = this.finished[this.finished.length-1];
      if (tag === ltag)
	this.finished[this.finished.length-1] = [tag, `${ltext}${text}`];
      else
	this.finished.push([tag, text]);
    }
  }
  
  // this is for input keyed manually as opposed to typed on the keyboard
  // it has the same presentation as sent by default
  onkeyed(ltr) {
    this.appendFinished('sent', ltr.toLowerCase());
    this.updateContent();
  }
  
  ttyKeydown(e) { 
    // may need to handle ctrl-V for paste
    // may need to preventDefault on Space to avoid autoscroll
    // may need to catch Escape as cancel key
    // console.log(`ttyKeydown '${e.key}'`);
    if (e.isComposing || e.altKey || e.metaKey || e.ctrlKey) {
      // log.textContent = `keydown code ${e.code} key ${e.key} CAMS ${e.ctrlKey} ${e.altKey} ${e.metaKey} ${e.shiftKey}`;
    } else if (e.key.length === 1 && /^[A-Za-z0-9.,?/*+!@$&()-=+"':; ]$/.test(e.key)) {
      this.pending.push(e.key);
      this.keyer.output.send(e.key);
      this.updateContent();
      if (e.key === ' ') e.preventDefault();
    } else if (e.key === 'Backspace') {
      this.keyer.output.unsend(e.data);
      // this.pending.pop(); the pop happens when the unsent confirmation comes back
      this.updateContent();
    } else if (e.key === 'Enter') {
      this.pending.push('\n');
      this.keyer.output.send('\n');
      this.updateContent();
    } else if (e.key === 'Escape') {
      this.cancel();
    }
  }

  clear() { 
    this.finished = [['sent','']];
    this.pending = [];
    this.updateContent();
  }

  cancel() {
    this.keyer.output.cancel();
    this.keyer.output.cancelPending();
    this.updateContent();
  }

  onsent(ltr) {
    const chr = this.pending.shift();
    if (ltr !== chr) { console.log(`onsent ${ltr} not first in pending ${chr}`); }
    this.appendFinished('sent', ltr);
    this.updateContent()
  }

  onunsent(ltr) {
    const chr = this.pending.pop()
    if (ltr !== chr) { console.log(`onunsent ${ltr} not last in pending ${chr}`); }
    this.updateContent();
  }

  onskipped(ltr) {
    const chr = this.pending.shift();
    if (ltr !== chr) { console.log(`onskipped ${ltr} not first in pending ${chr}`); }
    this.appendFinished('skipped', chr);
    this.updateContent()
  }
  
  // control manipulation
  controlSetDefaultValue(control, forceDefault) {
    const JSONparse = (value) => { 
      try { return JSON.parse(value); }
      catch(e) { return undefined; }
    }
    const controlDefault = (defaultValue) => {
      const localValue = JSONparse(localStorage[control]);
      const value = forceDefault || alwaysForceDefault || localValue === undefined ? defaultValue : localValue;
      localStorage[control] = JSON.stringify(value);
      return value;
    }
    if ('value' in KeyerJs.getControl(control))
      this[control] = controlDefault(KeyerJs.getControl(control).value);
  }

  controlSetDefaultValues(forceDefault) {
    Object.keys(KeyerJs.controls).forEach(control => this.controlSetDefaultValue(control, forceDefault));
  }

  controlUpdate(control, oldv, newv) {
    this[control] = newv;
    const c = KeyerJs.getControl(control);
    if ('value' in c) localStorage[control] = JSON.stringify(newv);
    if ('lit' in c) this.requestUpdate(control, oldv);
    switch (control) {
    case 'requestedSampleRate':
      this.start();
      break;
    default:
      break;
    }
  }

  controlToggle(control) { this.controlUpdate(control, this[control], ! this[control]); }

  controlSelect(control, e) { this.controlUpdate(control, this[control], e.target.value); }
  
  scopeResize() {
    if (this.displayScope) {
      this.keyer.scope.enable(false, null, null);
      const canvas = this.shadowRoot.querySelector("canvas");
      if (canvas) this.keyer.scope.enable(this.displayScope, canvas);
    }
  }

  // styles
  static get styles() {
    return css`
      :host {
        min-height: 100vh;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        font-size: calc(10px + 2vmin);
        color: black;
        margin: 0;
        text-align: center;
      }
      .h1 { font-size: 2em; margin: .33em 0; }
      .h2 { font-size: 1.5em; margin: .38em 0; }
      .h3 { font-size: 1.17em; margin: .42em 0; }
      .h5 { font-size: .83em; margin: .75em 0; }
      .h6 { font-size: .75em; margin: .84em 0; }
      .h1, .h2, .h3, .h4, .h5, .h6 { 
	font-weight: bolder;
	width: 60%;
	text-align: left;
      }
      main {
        flex-grow: 1;
      }
      .logo > svg {
        margin-left: 5%;
        max-width: 90%;
        margin-top: 16px;
      }
      div.hidden, div.group.hidden {
	display: none;
      }
      button, select, input {
        font-size: calc(10px + 2vmin);
      }
      input[type="number"][size="5"] {
	 width: 3.25em;
      }
      input[type="number"][size="4"] {
	 width: 2.5em;
      }
      input[type="number"][size="3"] {
	 width: 2em;
      }
      div.panel {
	margin: auto;
	width: 90%;
      }
      div.subpanel {
	margin: auto;
	width: 100%;
      }
      div.keyboard {
        display: inline-block;
        padding: 10px;
        text-align: left;
	white-space: pre-wrap;
        margin-top: 16px;
	margin: auto;
	width: 90%;
        height: 300px;
	overflow-wrap: break-word;
        overflow-y: auto;
        border: 1px solid #9e9e9e;
        color: #000000;
      }
      div.group {
	display: inline-block;
      }
      .sent {
        color: #888;
      }
      .keyed {
	color: #aaaa;
      }
      .skipped {
        color: #888;
        text-decoration: line-through;
      }

      .blinker {
	font-weight: 100;
	color: #2E3D48;
	-webkit-animation: 1s blink step-end infinite;
	animation: 1s blink step-end infinite;
      }

      @-webkit-keyframes "blink" {
        from, to {
          color: transparent;
        }
        50% {
          color: black;
        }
      }

      @keyframes "blink" {
	from, to {
	  color: transparent;
	}
	50% {
	  color: black;
	}
      }

      div.scope canvas {
	width: 90%;
	height: 400px;
	border: 1px solid black;
	background: #fff;
	background-size: 50px 50px;
	background-image:
	    linear-gradient(to right, grey 1px, transparent 1px),
	    linear-gradient(to bottom, grey 1px, transparent 1px);
      }

      .app-footer {
        font-size: calc(12px + 0.5vmin);
        align-items: center;
      }

      .app-footer a {
        margin-left: 5px;
      }
    `;
  }

  // render a section of the user interface
  displayRender(control) {

    switch (control) {

    case 'displayTouchStraight': return html``; // FIX.ME

    case 'displayTouchPaddle': return html``; // FIX.ME

    case 'displayKeyboardSettings': 
      return html`
	${this.controlRender('speed')},
	${this.controlRender('gain')},
	${this.controlRender('pitch')},
	${this.controlRender('displayAdvancedKeyboardSettings')}
	`;

    case 'displayAdvancedKeyboardSettings':
      return html`
	${this.controlRender('weight')},
	${this.controlRender('ratio')},
	${this.controlRender('compensation')}
	<br/>
	${this.controlRender('rise')},
	${this.controlRender('fall')}
	<br/>
	${this.controlRender('shape')}
      `;
    case 'displayManualSettings':
      return html`
	<div class="group" title="Paddle options.">Paddles:
	  ${this.controlRender('paddleKeyer')}
	  ${this.controlRender('paddleSwapped')}
	</div><br/>
	<div class="group" title="Keyboard keys used for manual keying.">Keyboard:
	  ${this.controlRender('straightKey')}
	  ${this.controlRender('leftPaddleKey')}
	  ${this.controlRender('rightPaddleKey')}
        </div><br/>
	<div class="group ${this.midiAvailable?'':' hidden'}" title="MIDI device notes used for manual keying.">MIDI:	
	  ${this.controlRender('straightMidi')}
	  ${this.controlRender('leftPaddleMidi')}
	  ${this.controlRender('rightPaddleMidi')}
        </div><br/>
	${this.controlRender('inputSpeed')}
	${this.controlRender('inputGain')}
	${this.controlRender('inputPitch')}
	${this.controlRender('displayAdvancedManualSettings')}
      `;

    case 'displayAdvancedManualSettings':
      return html`
	${this.controlRender('inputWeight')},
	${this.controlRender('inputRatio')},
	${this.controlRender('inputCompensation')}
	<br/>
	${this.controlRender('inputRise')},
	${this.controlRender('inputFall')}
	<br/>
	${this.controlRender('inputShape')}
      `;

    case 'displayMiscSettings':
      return html`
	${this.controlRender('requestedSampleRate')}
	<br/>
	<label>Reset default values: 
	  <button @click=${() => this.controlSetDefaultValues(true)}>Reset</button>
	</label>
	`;

    case 'displaySettings':
      return html`
	${this.controlRender('displayKeyboardSettings')}
	${this.controlRender('displayManualSettings')}
	${this.controlRender('displayMiscSettings')}
	`;

    case 'displayScope':
      return html`
	<div class="scope"><canvas @resize=${this.scopeResize}></canvas></div>
	${this.controlRender('scopeRunning')}
	${this.controlRender('scopeTrigger')}
	${this.controlRender('scopeTriggerChannel')}
	${this.controlRender('scopeHold')}
	<br/>
	${this.controlRender('scopeTimeScale')}
	<br/>
	<b>ch1</b> 
	${this.controlRender('scopeSource1')}
	${this.controlRender('scopeVerticalScale1')}
	<br/>
	<b>ch2</b>
	${this.controlRender('scopeSource2')}
	${this.controlRender('scopeVerticalScale2')}
	`;

    case 'displayStatus':
      return html`
	State: ${this.state}<br/>
	Sample rate: ${this.sampleRate}<br/>
	Current time: ${this.currentTime.toFixed(3)}<br/>
	Base latency: ${this.baseLatency.toFixed(3)}<br/>
	Midi available: ${this.midiAvailable}<br/>`;
      
    case 'displayAbout':
      return html`
	<p>
	  <b>Keyer.js</b> implements a morse code keyer in a web page.
	  The text window translates typed text into morse code which 
	  plays on the browser's audio output.
	  Keyboard keys and MIDI notes can be interpreted as switch 
	  closures for directly keying morse.
	  Directly keyed input is played on the browser's audio output
	  and decoded into the text window.
	</p><p>
	  The <b>Settings</b> panel controls the generated morse code
	  and other aspects of the prog.
	</p><p>
	  The <b>Status</b> panel shows the status of the web audio,
	  the time since the system started, the sample rate, the
	  estimated latency, and whether MIDI is available.
	</p><p>
	  The <b>Scope</b> panel allows the wave forms of the keyer to be displayed.
	</p><p>
	  This <b>About</b> panel gives a brief introduction to the app.
	</p><p>
	  The <b>License</b> panel describes the licenscing of the app.
	</p>
	`;

    case 'displayLicense':
      return html`
	<p>
	  keyer.js - a progressive web app for morse code
	</p><p>
	  Copyright (c) 2020 Roger E Critchlow Jr, Charlestown, MA, USA
	</p><p>
	  This program is free software: you can redistribute it and/or modify
	  it under the terms of the GNU General Public License as published by
	  the Free Software Foundation, either version 3 of the License, or
	  (at your option) any later version.
	</p><p>
	  This program is distributed in the hope that it will be useful,
	  but WITHOUT ANY WARRANTY; without even the implied warranty of
	  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	  GNU General Public License for more details.
	</p><p>
	  You should have received a copy of the GNU General Public License
	  along with this program.  If not, see <a href="https://www.gnu.org/licenses/">gnu.org/licenses</a>.
	</p>
	`;

    case 'displayColophon':
      return html`
	<p>
	  keyer.js was written with emacs on a laptop running Ubuntu.
	</p><p>
	  The algorithms in keyer.js were developed for <a href="https://github.com/recri/keyer">keyer</a>,
	  a collection of software defined radio software built using Jack, Tcl, and C.
	</p><p>
	  The polymer project, the PWA starter kit, open-wc, lit-element, lit-html, web audio, web MIDI.
	</p><p>
	  The source for <a href="https://github.com/recri/keyer.js">keyer.js</a>
	</p>
	`;
    default: 
      return html`<h1>There is no ${control} case in displayRender<h1>`;
    }
  }

  // render a user interface control element
  controlRender(control) {
    const ctl = KeyerJs.getControl(control);
    if ( ! ctl) return html`<h1>No controlRender for ${control}</h1>`;
    switch (ctl.type) {
      // folder is a label button which shows or hides content
    case 'folder': {
      const {level, label, title} = ctl;
      const pclass = level === 2 ? 'panel' : 'subpanel';
      const dclass = `${pclass} ${this[control] ? '' : 'hidden'}`;
      return html`
	<div class="${pclass}" title="${title}">
	  <button class="h${level}" @click=${() => this.controlToggle(control)}>
	    ${this[control] ? shownSymbol : hiddenSymbol} ${label}
	  </button}>
	</div>
	<div class="${dclass}">${this.displayRender(control)}</div>
      `;
    }
      // slider adjusts a number between a min and a max by step
    case 'slider': {
      const {min, max, step, label, unit, title} = ctl;
      return html`
	<div class="group" title="${title}">
	  <input
	    type="range"
	    name="${control}" 
	    min="${min}"
	    max="${max}"
	    step="${step}"
	    .value=${this[control]}
	    @input=${(e) => this.controlSelect(control, e)}>
	  <label for="${control}">${label} ${this[control]} (${unit})</label>
	</div>
      `;
  }

      // spinner adjusts a number between a min and a max by step
    case 'spinner': {
      const {min, max, step, label, unit, size, title} = ctl;
      return html`
	<div class="group" title="${title}">
	  <label for="${control}">${label}
	    <input
	      type="number"
	      name="${control}" 
	      min="${min}"
	      max="${max}"
	      step="${step}"
	      size="${size}"
	      .value=${this[control]}
	      @input=${(e) => this.controlSelect(control, e)}>
	    (${unit})
	  </label>
	</div>
      `;
    }
      // options displays a list of options for selection
    case 'options': {
      const {options, label, title} = ctl;
      return html`
	<div class="group" title="${title}"><label for="${control}">${label}
	  <select
	    name="${control}"
	    .value=${this[control]} 
	    @change=${(e) => this.controlSelect(control, e)}>
	      ${this[options].map(x => html`<option .value=${x} ?selected=${x === this[control]}>${x}</option>`)}
	  </select>
	</label></div>
      `;
    }
      // a toggle button shows one of two labels
    case 'toggle': {
      const {label, on, off, title} = ctl;
      return html`
	<div class="group" title="${title}"><label for="${control}">${label}
	  <button
	    name="${control}"
	    role="switch" 
	    aria-checked=${this[control]} 
	    @click=${() => this.controlToggle(control)}>
	    ${this[control] ? on : off}
	  </button></label></div>
      `;
    }
      // an envelope shows two lists of envelope functions
    case 'envelope': {
      const {label, envelope1, envelope2, title} = ctl;
      return html`
	<div class="group" title="${title}"><label>${label}: 
	  ${this.controlRender(envelope1)} * ${this.controlRender(envelope2)}
	</label></div>
      `;
    }
      // a check button shows a label with a filled or unfilled checkbox
    case 'check': {
      const {label, title} = ctl;
      return html`
	<div class="group" title="${title}"><button
	    role="switch" 
	    aria-checked=${this[control]} 
	    @click=${() => this.controlToggle(control)}>
	    ${this[control] ? checkedCheckBox : uncheckedCheckBox} ${label}
	  </button></div>
	`;
    }
    default:
      return html`<h1>No controlRender for ${control} with type ${ctl.type}`;
    }
  }
  
  render() {
    const startup = () => html`
        <div>
          <button class="start" @click=${this.start}><span>${playSymbol}</span></button>
	  <br/>
	  <h2>Press play to start the keyer.</h2>
	  <p>Browsers shouldn't start audio without an user gesture.</p>
	</div>`;
    const main = () => html`
        <div class="keyboard" tabindex="0" @keydown=${this.ttyKeydown} @focus=${this.onfocus} @blur=${this.onblur}>${this.content}</div>
        <div class="panel">
	  ${this.controlRender('running')}
	  <button @click=${this.clear}><span>Clear</span></button>
	  <button @click=${this.cancel}><span>Cancel</span></button>
	</div>
	${this.controlRender('displaySettings')}
	${this.controlRender('displayScope')}
	${this.controlRender('displayStatus')}
	`;
    return html`
      <main>
        <div class="logo">${keyerLogo}</div>
        <div><h1>keyer.js</h1></div>
	${this.keyer === null ? startup() : main()}
	${this.controlRender('displayAbout')}
	${this.controlRender('displayLicense')}
	${this.controlRender('displayColophon')}
      </main>

      <p class="app-footer">
        🚽 Made with thanks to
        <a target="_blank" rel="noopener noreferrer"
           href="https://github.com/open-wc" >open-wc</a>.
      </p>
    `;
  }
}
