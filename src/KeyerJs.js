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

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["divBeforeInput","touchKeyRender"] }] */
/* eslint no-param-reassign: ["error", { "props": false }] */

import { LitElement, html, css } from 'lit-element';
import { keyerLogo } from './keyer-logo.js';
import { Keyer } from './Keyer.js';

// default values for properties
const defaults = {
  // properties that are local to this
  requestedSampleRate: '48000',
  qrq: false,
  displaySettings: true,
  displayOutput: true,
  displayAdvanced: false,
  displayInputKey: false,
  displayManualAdvanced: false,
  displayMisc: false,
  displayScope: false,
  displayStatus: true,
  displayAbout: false,
  displayLicense: false,
  displayTouchStraight: false,
  displayTouchPaddle: false,
  // properties that delegate to this.keyer.output
  pitch: 700,
  gain: -26,
  weight: 50,
  ratio: 50,
  compensation: 0,
  rise: 4,
  fall: 4,
  envelope: 'hann',
  envelope2: 'rectangular',
  speed: 20,
  // properties that delegate to this.keyer.input
  paddleKeyer: 'nd7pa-b',
  straightKey: 'ControlLeft',
  straightMidi: 'None',
  swapped: false,
  leftPaddleKey: 'AltRight',
  rightPaddleKey: 'ControlRight',
  leftPaddleMidi: 'None',
  rightPaddleMidi: 'None',
  // properties that delegate to this.keyer.input
  inputPitch: 700,
  inputGain: -26,
  inputWeight: 50,
  inputRatio: 50,
  inputCompensation: 0,
  inputRise: 4,
  inputFall: 4,
  inputEnvelope: 'hann',
  inputEnvelope2: 'rectangular',
  inputSpeed: 20,
  // properties that delegate to this.keyer.scope
  scopeTarget: 'input-output',
  scopeTimeScale: '10ms/div',
  scopeVerticalScale: '200mFS/div',
  scopeTimeOffset: 0,
  scopeHoldTime: '1s',
  scopeLength: 1,
}

// wpm speed limits
const qrqStep = 1;
const qrsStep = 1;
const qrqMax = 150;
const qrsMax = 50;
const qrqMin = 10;
const qrsMin = 10;

// menu indicators
const hiddenMenuIndicator = html`<span>&#x23f5;</span>`;
const shownMenuIndicator = html`<span>&#x23f7;</span>`;
// const uncheckedCheckBox = html`<span>&#x2610;</span>`;
// const checkedCheckBox = html`<span>&#x2611;</span>`;

// const straightKeyArrow = html`<span>&#x23f7;</span>`;
// const leftKeyArrow = html`<span>&#x23f4;</span>`;
// const rightKeyArrow = html`<span>&#x23f5;</span>`;

const playSymbol = html`<span>&#x23f5;</span>`;
const pauseSymbol = html`<span>&#x23f8;</span>`;

// toggle between on and off
const isOn = (onOff) => onOff === true;
const isOff = (onOff) => onOff === false;
const isOnOff = (onOff) => isOn(onOff) || isOff(onOff);
const toggleOnOff = (onOff) => isOnOff(onOff) ? ! onOff : console.log(`toggleOnOff '${onOff}' `);

// always force default values, because I don't trust what's stored, yet
const alwaysForceDefault = false;

// parse JSON and return undefined on error
const JSONparse = (value) => { try { return JSON.parse(value); } catch(e) { return undefined; } }

// grab a value from localStorage or return the default value
const controlDefault = (control, defaultValue, forceDefault) => {
  const localValue = JSONparse(localStorage[control])
  const value = forceDefault || alwaysForceDefault || localValue === undefined ? defaultValue : localValue;
  localStorage[control] = JSON.stringify(value);
  return value;
}
const controlSave = (control, newValue) => { localStorage[control] = JSON.stringify(newValue); }

// list of left/right qualified shift keys
const shiftKeys = ['None','ShiftLeft','ControlLeft','AltLeft','AltRight','ControlRight','ShiftRight'];
const isShiftKey = (value) => shiftKeys.includes(value);

// list of sampleRates
const sampleRates = ['8000', '32000', '44100', '48000', '96000', '192000' ]
const isSampleRate = (value) => sampleRates.includes(value);

// application color scheme, from material design color tool
// const colorPrimary = css`#1d62a7`;
// const colorPLight = css`#5b8fd9`;
// const colorPDark  = css`#003977`;
// const colorSecondary = css`#9e9e9e`;
// const colorSLight = css`#cfcfcf`;
// const colorSDark =  css`#707070`;

export class KeyerJs extends LitElement {

  // declare LitElement properties
  // don't know why defaults aren't bundled into this

  static get properties() {
    return {
      // properties from open-wc template
      title: { type: String },
      page: { type: String },
      // properties of keyer output
      pitch: { type: Number },
      gain: { type: Number },
      speed: { type: Number },
      weight: { type: Number },
      ratio: { type: Number },
      compensation: { type: Number },
      rise: { type: Number },
      fall: { type: Number },
      envelope: { type: String },
      envelope2: { type: String },
      // properties of keyer input
      swapped: { type: Boolean },
      paddleKeyer: { type: String },
      straightKey: { type: String },
      leftPaddleKey: { type: String },
      rightPaddleKey: { type: String },
      straightMidi: { type: String },
      leftPaddleMidi: { type: String },
      rightPaddleMidi: { type: String },
      // more propeties of keyer.input
      inputPitch: { type: Number },
      inputGain: { type: Number },
      inputSpeed: { type: Number },
      inputWeight: { type: Number },
      inputRatio: { type: Number },
      inputCompensation: { type: Number },
      inputRise: { type: Number },
      inputFall: { type: Number },
      inputEnvelope: { type: String },
      inputEnvelope2: { type: String },
      // miscellaneous
      requestedSampleRate: { type: Number },
      // properties of scope
      scopeRunning: { type: Boolean },
      scopeHoldStep: { type: String },
      scopeTarget: { type: String },
      scopeTimeScale: { type: String },
      scopeVerticalScale: { type: String },
      scopeTimeOffset: { type: Number },
      scopeHoldTime: { type: String },
      scopeLength: { type: Number },
      // properties read only from this.keyer.context
      state: { type: String },
      sampleRate: { type: Number },
      currentTime: { type: Number },
      baseLatency: { type: Number },
      // properties that are local
      qrq: { type: Boolean },
      displayTouchStraight: { type: Boolean },
      displayTouchPaddle: { type: Boolean },
      displaySettings: { type: Boolean },
      displayStatus: { type: Boolean },
      displayOutput: { type: Boolean },
      displayAdvanced: { type: Boolean },
      displayInputKey: { type: Boolean },
      displayManualAdvanced: { type: Boolean },
      displayMisc: { type: Boolean },
      displayLicense: { type: Boolean },
      displayScope: { type: Boolean },
      displayAbout: { type: Boolean },
      // property computed
      running: { type: Boolean },
      // properties refreshed on notification
      midiNames: { type: Array },
      midiNotes: { type: Array },
      paddleKeyers: { type: Array },
      // display widget
      content: { type: Object },
      finished: { type: Array },
      pending: { type: Array },
    };
  }

  // keyer properties for output
  set pitch(v) { this.keyer.output.pitch = v; }

  get pitch() { return this.keyer.output.pitch; }

  set gain(v) { this.keyer.output.gain = v; }
  
  get gain() { return Math.round(this.keyer.output.gain); }

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
  
  // input properties
  set swapped(v) {  this.keyer.input.swapped = v; }

  get swapped() { return this.keyer.input.swapped; }

  get paddleKeyers() { return this.keyer.input.keyers; }

  set paddleKeyer(v) { this.keyer.input.keyer = v; }

  get paddleKeyer() { return this.keyer.input.keyer; }

  set straightKey(v) { this.keyer.input.straightKey = v; }

  get straightKey() { return this.keyer.input.straightKey; }

  set leftPaddleKey(v) { this.keyer.input.leftPaddleKey = v; }

  get leftPaddleKey() { return this.keyer.input.leftPaddleKey; }

  set rightPaddleKey(v) { this.keyer.input.rightPaddleKey = v; }

  get rightPaddleKey() { return this.keyer.input.rightPaddleKey; }

  set straightMidi(v) { this.keyer.straightMidi = v; }

  get straightMidi() { return this.keyer.straightMidi; }

  set leftPaddleMidi(v) { this.keyer.input.leftPaddleMidi = v; }

  get leftPaddleMidi() { return this.keyer.input.leftPaddleMidi; }

  set rightPaddleMidi(v) { this.keyer.input.rightPaddleMidi = v; }

  get rightPaddleMidi() { return this.keyer.input.rightPaddleMidi; }

  // input keyer properties
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
  
  set scopeTarget(v) { this.keyer.scopeTarget = v; }

  get scopeTarget() { return this.keyer.scopeTarget; }
  
  get scopeTargets() { return this.keyer.scopeTargets; }
  
  get scopeHoldSteps() { return this.keyer.scope.holdSteps; }

  set scopeHoldStep(v) { this.keyer.scope.holdStep = v; }

  get scopeHoldStep() { return this.keyer.scope.holdStep; }
  
  set scopeTimeScale(v) { this.keyer.scope.timeScale = v; }

  get scopeTimeScale() { return this.keyer.scope.timeScale; }

  get scopeTimeScales() { return this.keyer.scope.timeScales; }
  
  set scopeVerticalScale(v) { this.keyer.scope.verticalScale = v; }

  get scopeVerticalScale() { return this.keyer.scope.verticalScale; }

  get scopeVerticalScales() { return this.keyer.scope.verticalScales; }
  
  set scopeTimeOffset(v) { this.keyer.scope.timeOffset = v; }

  get scopeTimeOffset() { return this.keyer.scope.timeOffset; }

  get scopeHoldTimes() { return this.keyer.scope.holdTimes; }

  set scopeHoldTime(v) { this.keyer.scope.holdTime = v; }

  get scopeHoldTime() { return this.keyer.scope.holdTime; }

  set scopeLength(v) { this.keyer.scope.length = v; }

  get scopeLength() { return this.keyer.scope.length; }

  get scopeLengths() { return this.keyer.scope.lengths; }
  
  // get properties delegated to this.keyer.context
  get currentTime() { return this.keyer.currentTime; }

  get sampleRate() { return this.keyer.sampleRate; }

  get baseLatency() { return this.keyer.baseLatency; }

  get state() { return this.keyer.context.state; }
  
  constructor() {
    super();
    this.keyer = null;
  }

  controlSetDefaultValue(control, forceDefault) {
    this[control] = controlDefault(control, defaults[control], forceDefault);
  }

  controlSetDefaultValues(forceDefault) {
    Object.keys(defaults).forEach(control => this.controlSetDefaultValue(control, forceDefault));
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

    // this was for debugging the need to twiddle the gain to get iambic or straight keying to work
    // this.keyer.input.on('change:gain', g => console.log(`straight change:gain ${g}`), window);
    // this.keyer.output.on('change:gain', g => console.log(`output change:gain ${g}`), window);
    // default property values
    // using localStorage to persist defaults between sessions
    // defaults set at top of file
    this.controlSetDefaultValues(false);
    
    this.running = this.keyer.context.state !== 'suspended';

    this.clear();

    this.validate();
    
    // this.keyer.outputDecoder.on('letter', (ltr, code) => console.log(`output '${ltr}' '${code}'`));
    this.keyer.inputDecoder.on('letter', (ltr) =>  this.onkeyed(ltr));
    this.keyer.output.on('sent', ltr => this.onsent(ltr));
    this.keyer.output.on('unsent', ltr => this.onunsent(ltr));
    this.keyer.output.on('skipped', ltr => this.onskipped(ltr));
    // this.keyer.midiSource.on('midi:names', () => this.onmidinames());
    this.keyer.midiSource.on('midi:notes', () => this.onmidinotes());
    
    document.addEventListener('keydown', (e) => this.keyer.input.keyboardKey(e, true));
    document.addEventListener('keyup', (e) => this.keyer.input.keyboardKey(e, false));
  }
  
  // validate that our lists of options are actual options
  // and that default values are chosen from the same lists
  // also use the functions we define for this purpose
  validate() {
    shiftKeys.forEach(x => isShiftKey(x) || console.log(`shiftKey ${x} failed isShiftKey`));
    sampleRates.forEach(x => isSampleRate(x) || console.log(`sampleRate ${x} failed isSampleRate`));
    ['qrq','swapped', 'displayTouchStraight', 'displayTouchPaddle', 'displaySettings', 'displayOutput', 
     'displayAdvanced', 'displayInputKey', 'displayStatus', 'displayAbout', 'displayLicense',
     'displayScope'].
      forEach(x => isOnOff(this[x]) || console.log(`property '${x}' failed isOnOff: ${this[x]}`));
    ['straightKey', 'leftPaddleKey', 'rightPaddleKey'].
      forEach(x => isShiftKey(this[x]) || console.log(`property '${x}' failed isShiftKey: ${this[x]}`));
    ['requestedSampleRate'].forEach(x => isSampleRate(this[x]) || console.log(`property '${x}' failed isSampleRate '${this[x]}'`));
  }
	       
  // midi information events
  onmidinames() { this.midiNames = this.keyer.midiSource.names; }

  onmidinotes() { this.midiNotes = this.keyer.midiSource.notes; }
  
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
    if (this.keyer && this.keyer.scope && this.displayScope) {
      this.keyer.scope.enable(isOn(this.displayScope), this.shadowRoot.querySelector("canvas"));
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
  
  // play / pause button
  playPause() {
    // console.log("play/pause clicked");
    if (this.keyer.context.state === 'suspended') {
      this.keyer.context.resume();
      this.running = true;
      // this cures need to twiddle the gain to get iambic keying to work
      // I wish I understood why
      this.gain += 1;
      this.gain -= 1;
    } else {
      this.keyer.context.suspend();
      this.running = false;
    }
  }

  controlToggle(control) { 
    const oldv = this[control];
    this[control] = toggleOnOff(this[control]);
    controlSave(control, this[control]);
    this.requestUpdate(control, oldv);
    switch (control) {
    case 'qrq':
      if (isOn(this.qrq)) {
	this.speed = Math.max(qrqMin, qrqStep * Math.floor(this.speed/qrqStep));
      } else {
	this.speed = Math.min(this.speed, qrsMax);
      }
      break;
    default:
      break;
    }
  }

  controlMenuIndicator(control) { return isOff(this[control]) ? hiddenMenuIndicator : shownMenuIndicator; }

  controlGet(control) { return this[control]; }
  
  controlSelect(control, e) { 
    // console.log(`controlSelect('${control}', ${e.target.value})`);
    const oldv = this[control];
    this[control] = e.target.value;
    controlSave(control, e.target.value);
    this.requestUpdate(control, oldv);
    switch (control) {
    case 'requestedSampleRate':
      this.start();
      break;
    default:
      break;
    }
  }
  
  scopeResize() {
    if (isOn(this.displayScope)) {
      this.keyer.scope.enable(false, null, null);
      this.keyer.scope.enable(true, this.shadowRoot.querySelector("canvas"));
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
      .h1 { font-size: 2em; margin: .33em 0 }
      .h2 { font-size: 1.5em; margin: .38em 0 }
      .h3 { font-size: 1.17em; margin: .42em 0 }
      .h5 { font-size: .83em; margin: .75em 0 }
      .h6 { font-size: .75em; margin: .84em 0 }
      .h1, .h2, .h3, .h4, .h5, .h6 { 
	font-weight: bolder;
	width: 50%;
      }
      main {
        flex-grow: 1;
      }
      .logo > svg {
        margin-left: 5%;
        max-width: 90%;
        margin-top: 16px;
      }
      button, select {
        font-size: calc(10px + 2vmin);
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

  sliderRender(control, min, max, step, label, unit) {
    return html`
	  <input
	    type="range"
	    id="${control}"
	    name="${control}" 
	    min="${min}"
	    max="${max}"
	    step="${step}"
	    .value=${this[control]}
	    @input=${(e) => this.controlSelect(control, e)}>
	  <label for="${control}">${label} ${this[control]} (${unit})</label>`;
  }

  optionsRender(control, values, label) {
    const options = values ? 
	  values.map(x => html`<option .value=${x} ?selected=${x === this[control]}>${x}</option>`) :
	  html``;
    return html`
	<label for="${control}">${label}
	  <select
	    name="${control}"
	    .value=${this[control]} 
	    @change=${(e) => this.controlSelect(control, e)}>
	      ${options}
	  </select>
	</label>`;
  }
  
  toggleRender(control, onLabel, offLabel) {
    return html`
	  <button
	    role="switch" 
	    aria-checked=${this[control]} 
	    @click=${() => this.controlToggle(control)}>
	    <span>${this[control] ? onLabel : offLabel}</span>
	  </button>`;
  }
  
  touchKeyRender() {
    return html``;
/*
    if (this.inputKey === 'straight')
      return html`
	  <button class="key" @mousedown=${e => this.keyer.input.mouseKey(e,'straight',true)} 
			      @mouseup=${e => this.keyer.input.mouseKey(e,'straight',false)}
			      @touchstart=${e => this.keyer.input.touchKey(e,'straight',false)}
			      @touchend=${e => this.keyer.input.touchKey(e,'straight',false)}
		>${straightKeyArrow}</button>
	`;
    if (this.inputKey === 'paddle')
      return html`
	  <button class="key" @mousedown=${e => this.keyer.input.mouseKey(e,'left',true)}
			      @mouseup=${e => this.keyer.input.mouseKey(e,'left',false)}
			      @touchstart=${e => this.keyer.input.touchKey(e,'left',false)}
			      @touchend=${e => this.keyer.input.touchKey(e,'left',false)}
		>${leftKeyArrow}</button>
	  <button class="key" @mousedown=${e => this.keyer.input.mouseKey(e,'right',true)}
			      @mouseup=${e => this.keyer.input.mouseKey(e,'right',false)}
			      @touchstart=${e => this.keyer.input.toucheKey(e,'right',false)}
			      @touchend=${e => this.keyer.input.touchKey(e,'right',false)}
		>${rightKeyArrow}</button>
	`;
    return html``;
*/
  }

  // display a section of the user interface if it's enabled
  displayRender(control) {
    if ( ! isOnOff(this[control]))
      return html`<h1>Control ${control} is neither true nor false, ${this[control]}`;
    if (isOff(this[control]))
      return html``;

    switch (control) {

    case 'displayTouchStraight': return html``;

    case 'displayTouchPaddle': return html``;

    case 'displayOutput': 
      return html`
	<div class="group">${isOn(this.qrq) ? 
	  this.sliderRender('speed', qrqMin, qrqMax,  qrqStep, 'Speed', 'WPM') :
	  this.sliderRender('speed', qrsMin, qrsMax,  qrsStep, 'Speed', 'WPM')}</div>
	<div class="group">${this.toggleRender('qrq', 'QRQ', 'QRS')}</div>
	<div class="group">${this.sliderRender('gain', -50, 10, 1, 'Gain', 'dB')}</div>
	<div class="group">${this.sliderRender('pitch', 250, 2000, 1, 'Pitch', 'Hz')}</div>
	<div class="subpanel">${this.headerRender(4, 'displayAdvanced', 'More Options')}</div>
	<div class="subpanel">${this.displayRender('displayAdvanced')}</div>
	`;

    case 'displayAdvanced':
      return html`
	<div class="group">${this.sliderRender('weight', 25, 75, 0.1, 'Weight', '%')}</div>
	<div class="group">${this.sliderRender('ratio', 25, 75, 0.1, 'Ratio', '%')}</div>
	<div class="group">${this.sliderRender('compensation', -15, 15, 0.1, 'Compensation', '%')}</div>
	<br/>
	<div class="group">${this.sliderRender('rise', 1, 10, 0.1, 'Rise', 'ms')}</div>
	<div class="group">${this.sliderRender('fall', 1, 10, 0.1, 'Fall', 'ms')}</div>
	<br/>
	<div class="group"><label>Envelope: 
	  ${this.optionsRender('envelope', this.envelopes, '')} * ${this.optionsRender('envelope2', this.envelopes, '')}
	</label></div>`;

    case 'displayInputKey':
      return html`
	<div class="group">Paddles:
	  <div class="group">${this.optionsRender('paddleKeyer', this.paddleKeyers, 'Keyer: ')}</div>
	  <div class="group">${this.toggleRender('swapped', 'Swapped', 'Not Swapped')}</div>
	</div>
	<div class="group">Keyboard:
	  <div class="group">${this.optionsRender('straightKey', shiftKeys, 'Straight: ')}</div>
	  <div class="group">${this.optionsRender('leftPaddleKey', shiftKeys, 'Left: ')}</div>
	  <div class="group">${this.optionsRender('rightPaddleKey', shiftKeys, 'Right: ')}</div>
        </div>
	<div class="group">MIDI:	
	  <div class="group">${this.optionsRender('straightMidi', this.midiNotes, 'Straight: ')}</div>
	  <div class="group">${this.optionsRender('leftPaddleMidi', this.midiNotes, 'Left: ')}</div>
	  <div class="group">${this.optionsRender('rightPaddleMidi', this.midiNotes, 'Right: ')}</div>
        </div>
	<div class="group">${this.sliderRender('inputSpeed', qrsMin, qrsMax,  qrsStep, 'Speed', 'WPM')}</div>
	<div class="group">${this.sliderRender('inputGain', -50, 10, 1, 'Gain', 'dB')}</div>
	<div class="group">${this.sliderRender('inputPitch', 250, 2000, 1, 'Pitch', 'Hz')}</div>
	<div class="subpanel">${this.headerRender(4, 'displayManualAdvanced', 'More Options')}</div>
	<div class="subpanel">${this.displayRender('displayManualAdvanced')}</div>
	`;

    case 'displayManualAdvanced':
      return html`
	<div class="group">${this.sliderRender('inputWeight', 25, 75, 0.1, 'Weight', '%')}</div>
	<div class="group">${this.sliderRender('inputRatio', 25, 75, 0.1, 'Ratio', '%')}</div>
	<div class="group">${this.sliderRender('inputCompensation', -15, 15, 0.1, 'Compensation', '%')}</div>
	<br/>
	<div class="group">${this.sliderRender('inputRise', 1, 10, 0.1, 'Rise', 'ms')}</div>
	<div class="group">${this.sliderRender('inputFall', 1, 10, 0.1, 'Fall', 'ms')}</div>
	<br/>
	<div class="group"><label>Envelope: 
	  ${this.optionsRender('inputEnvelope', this.envelopes, '')} * ${this.optionsRender('inputEnvelope2', this.envelopes, '')}
	</label></div>`;

    case 'displayMisc':
      return html`
	<div class="group">${this.optionsRender('requestedSampleRate', sampleRates, 'Requested sample rate:')}</div>
	<br/>
	<label>Reset default values: 
	  <button @click=${() => this.controlSetDefaultValues(true)}>Reset</button>
	</label>
	`;

    case 'displaySettings':
      return html`
	<div class="subpanel">${this.headerRender(3, 'displayOutput', 'Keyboard Keyer')}</div>
	<div class="subpanel">${this.displayRender('displayOutput')}</div>
	<div class="subpanel">${this.headerRender(3, 'displayInputKey', 'Manual Keyer')}</div>
	<div class="subpanel">${this.displayRender('displayInputKey')}</div>
	<div class="subpanel">${this.headerRender(3, 'displayMisc', 'More Options')}</div>
	<div class="subpanel">${this.displayRender('displayMisc')}</div>
	`;

    case 'displayScope':
      return html`
	<div class="scope"><canvas @resize=${this.scopeResize}></canvas></div>
	<div class="group">${this.optionsRender('scopeTimeScale', this.scopeTimeScales, 'Time:')}</div>
	<div class="group">${this.optionsRender('scopeVerticalScale', this.scopeVerticalScales, 'Vertical:')}</div>
	<div class="group">${this.toggleRender('scopeRunning', 'Stop', 'Run')}</div>
	<div class="group">${this.sliderRender('scopeTimeOffset', 0, 100, 0.1, 'Time offset', '%')}</div>
	<div class="group">${this.optionsRender('scopeTarget', this.scopeTargets, 'Target:')}</div>
	<div class="group">${this.optionsRender('scopeLength', this.scopeLengths, 'Buffers:')}</div>
	<div class="group">${this.optionsRender('scopeHoldTime', this.scopeHoldTimes, 'Hold time:')}</div>
	`;

    case 'displayStatus':
      return html`
	Sample rate: ${this.sampleRate}<br/>
	Current time: ${this.currentTime.toFixed(3)}<br/>
	Base latency: ${this.baseLatency.toFixed(3)}<br/>`;

    case 'displayAbout':
      return html`
	<p>
	  <b>Keyer.js</b> implements a morse code keyer in a web page.
	  The text window translates typed text into morse code which plays on the browser's audio output.
	  Keyboard keys and MIDI notes can be interpreted as switch closures for directly keying morse.
	  Directly keyed input is played on the browser's audio output and decoded into the text window.
	</p><p>
	  The <b>Settings</b> panel allow full control over the generated morse code.
	</p><p>
	  The <b>Status</b> panel shows status information about the web audio system.
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

    default: 
      return html`<h1>There is no ${control} case in displayRender<h1>`;
    }
  }
  
  headerRender(level, control, label) {
    return html`
	<button class="h${level}"
	  @click=${() => this.controlToggle(control)}>
	    ${this.controlMenuIndicator(control)} ${label}
	</button}>`;
/*    
    switch (level) {
    case 2:
      return html`
	<h2 
	  tabindex="0" 
	  @click=${() => this.controlToggle(control)}>
	    ${this.controlMenuIndicator(control)} ${label}
	</h2}>`;
    case 3:
      return html`
	<h3 
	  tabindex="0" 
	  @click=${() => this.controlToggle(control)}>
	    ${this.controlMenuIndicator(control)} ${label}
	</h3}>`;
    case 4:
      return html`
	<h4 
	  tabindex="0" 
	  @click=${() => this.controlToggle(control)}>
	    ${this.controlMenuIndicator(control)} ${label}
	</h4}>`;
    }
    return html`<h1>headerRender level=${level} isn't written</h1>`;
*/
  }
  
  renderMain() {
    return html`
        <div class="keyboard" tabindex="0" @keydown=${this.ttyKeydown} @focus=${this.onfocus} @blur=${this.onblur}>${this.content}</div>
        <div class="panel">
          <button role="switch" aria-checked=${this.running} @click=${this.playPause}> <span>${this.running ? pauseSymbol : playSymbol}</span></button>
	  <button @click=${this.clear}><span>Clear</span></button>
	  <button @click=${this.cancel}><span>Cancel</span></button>
	</div>
	<div class="panel">${this.headerRender(2, 'displaySettings', 'Settings')}</div>
	<div class="panel">${this.displayRender('displaySettings')}</div>
	<div class="panel">${this.headerRender(2, 'displayScope', 'Scope')}</div>
	<div class="panel">${this.displayRender('displayScope')}</div>
	<div class="panel">${this.headerRender(2, 'displayStatus', 'Status')}</div>
	<div class="panel">${this.displayRender('displayStatus')}</div>
	<div class="panel">${this.headerRender(2, 'displayAbout', 'About')}</div>
	<div class="panel">${this.displayRender('displayAbout')}</div>
	<div class="panel">${this.headerRender(2, 'displayLicense', 'License')}</div>
	<div class="panel">${this.displayRender('displayLicense')}</div>
	<div class="touch straight">${this.displayRender('displayTouchStraight')}</div>
	<div class="touch paddle">${this.displayRender('displayTouchPaddle')}</div>
	`;
  }
  
  renderStartup() {
    return html`
        <div>
          <button class="start" @click=${this.start}>
	    <span>${playSymbol}</span>
	  </button>
	  <br>
	  <h2>Press play to start the keyer.</h2>
	</div>`;
  }

  render() {
    return html`
      <main>
        <div class="logo">${keyerLogo}</div>
        <div><h1>keyer.js</h1></div>
	${this.keyer === null ? this.renderStartup() : this.renderMain()}
      </main>

      <p class="app-footer">
        🚽 Made with thanks to
        <a target="_blank" rel="noopener noreferrer"
           href="https://github.com/open-wc" >open-wc</a>.
      </p>
    `;
  }
}
