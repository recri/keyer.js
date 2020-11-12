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
  // properties that delegate to this.keyer
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
  qrq: 'off',
  inputKey: 'paddle',
  paddleKeyer: 'iambic',
  inputSources: ['keyboard'],
  inputMidi: 'none',
  straightKey: 'ControlRight',
  straightMidi: '1:1',
  swapped: 'off',
  leftPaddleKey: 'AltRight',
  rightPaddleKey: 'ControlRight',
  leftPaddleMidi: '1:0',
  rightPaddleMidi: '1:1',
  requestedSampleRate: '48000',
  // properties that are local
  displayTouchKey: 'off',
  displaySettings: 'on',
  displayOutput: 'on',
  displayAdvanced: 'off',
  displayInputKey: 'off',
  displayMisc: 'off',
  displayStatus: 'on',
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
const uncheckedCheckBox = html`<span>&#x2610;</span>`;
const checkedCheckBox = html`<span>&#x2611;</span>`;

const straightKeyArrow = html`<span>&#x23f7;</span>`;
const leftKeyArrow = html`<span>&#x23f4;</span>`;
const rightKeyArrow = html`<span>&#x23f5;</span>`;

const playSymbol = html`<span>&#x23f5;</span>`;
const pauseSymbol = html`<span>&#x23f8;</span>`;

// toggle between on and off
const toggleOnOff = (onOff) => ({ on: 'off', off: 'on' }[onOff]);
const isOn = (onOff) => onOff === 'on';
const isOff = (onOff) => onOff === 'off';
const isOnOff = (onOff) => isOn(onOff) || isOff(onOff);

// grab a value from localStorage or return the default value
// had fits trying to use Booleans here, which is why they're all 'on'||'off' instead
const alwaysForceDefault = true;

const defaultControl = (control, defaultValue, forceDefault) => {
  const value = localStorage[control] === undefined || typeof(localStorage[control]) === 'undefined' || forceDefault || alwaysForceDefault ?
	defaultValue : JSON.parse(localStorage[control]);
  localStorage[control] = JSON.stringify(value);
  return value;
}
const saveControl = (control, newValue) => { localStorage[control] = JSON.stringify(newValue); }

// generate a list of <option>name</option> html templates
const templateOptions = (names, selected) => names ? names.map(x => html`<option value=${x} ?selected=${x === selected}>${x}</option>`) : html``;

// generate a list of <input type="checkbox"></input> html templates
const templateAlternates = (names, selected, handler) => names.map(x => {
  const isSelected = selected.includes(x);
  const checkBox = isSelected ? checkedCheckBox : uncheckedCheckBox;
  return html`<label><button role="switch" aria-checked=${isSelected} @click=${e => handler(e,x)}>${checkBox}</button>  ${x} </label>`;
});

// list of left/right qualified shift keys
const shiftKeys = ['None','ShiftLeft','ControlLeft','AltLeft','AltRight','ControlRight','ShiftRight'];

// generate a list of shift key <option>name</option> html templates
const shiftKeyOptions = (selected) => templateOptions(shiftKeys, selected);
const isShiftKey = (value) => shiftKeys.includes(value);

// list of valid inputKeys
const inputKeys = [ 'none', 'straight', 'paddle' ];
const isInputKey = (value) => inputKeys.includes(value);

// list of valid paddle input keyers
const paddleKeyers = [ 'iambic' ];
const isPaddleKeyer = (value) => paddleKeyers.includes(value);

// list of valid inputSources
const inputSources = [ 'touch', 'keyboard', 'midi' ];
const isInputSource = (value) => inputSources.includes(value);

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
  static get properties() {
    return {
      title: { type: String },
      page: { type: String },
      // properties that delegate to this.keyer
      pitch: { type: Number },
      gain: { type: Number },
      speed: { type: Number },
      qrq: { type: String },
      weight: { type: Number },
      ratio: { type: Number },
      compensation: { type: Number },
      rise: { type: Number },
      fall: { type: Number },
      envelope: { type: String },
      envelope2: { type: String },
      inputKey: { type: String },
      inputSources: { type: Array },
      inputMidi: { type: String },
      swapped: { type: String },
      straightKey: { type: String },
      leftPaddleKey: { type: String },
      rightPaddleKey: { type: String },
      straightMidi: { type: String },
      leftPaddleMidi: { type: String },
      rightPaddleMidi: { type: String },
      requestedSampleRate: { type: String },
      // properties read only from this.keyer.context
      state: { type: String },
      sampleRate: { type: Number },
      currentTime: { type: Number },
      baseLatency: { type: Number },
      // properties that are local
      displayTouchKey: { type: String },
      displaySettings: { type: String },
      displayStatus: { type: String },
      displayOutput: { type: String },
      displayAdvanced: { type: String },
      displayInputKey: { type: String },
      displayMisc: { type: String },
      // property computed
      running: { type: Boolean },
      // properties refreshed on notification
      inputMidiNames: { type: Array },
      inputMidiNotes: { type: Array },
      // display widget
      content: { type: Object },
      finished: { type: Array },
      pending: { type: Array },
    };
  }

  // setter with updateRequest
  // all of these controls are delegated to this.keyer
  updateControl(control, newv) {
    // console.log(`updateControl ${control} ${newv}`);
    const oldv = this.keyer[control];
    this.keyer[control] = newv;
    saveControl(control, newv);
    this.requestUpdate(control, oldv);
  }

  // set and get properties, delegate to keyer
  set pitch(v) { this.updateControl('pitch', v); }

  get pitch() { return this.keyer.pitch; }

  set gain(v) { this.updateControl('gain', v); }
  
  get gain() { return Math.round(this.keyer.gain); }

  set speed(v) { this.updateControl('speed', v); }

  get speed() { return this.keyer.speed; }

  set qrq(v) { this.updateControl('qrq', v); }

  get qrq() { return this.keyer.qrq; }
  
  set weight(v) { this.updateControl('weight', v); }

  get weight() { return this.keyer.weight; }

  set ratio(v) { this.updateControl('ratio', v); }

  get ratio() { return this.keyer.ratio; }

  set compensation(v) { this.updateControl('compensation', v); }

  get compensation() { return this.keyer.compensation; }

  set rise(v) { this.updateControl('rise', v); }

  get rise() { return this.keyer.rise; }

  set fall(v) {  this.updateControl('fall', v); }

  get fall() { return this.keyer.fall; }

  set envelope(v) { this.updateControl('envelope', v); }

  get envelope() { return this.keyer.envelope; }

  set envelope2(v) { this.updateControl('envelope2', v); }

  get envelope2() { return this.keyer.envelope2; }

  static get envelopes() { return Keyer.envelopes; }
  
  set swapped(v) {  this.updateControl('swapped', v); }

  get swapped() { return this.keyer.swapped; }

  set inputKey(v) { this.updateControl('inputKey', v); }

  get inputKey() { return this.keyer.inputKey; }

  set paddleKeyer(v) { this.updateControl('paddleKeyer', v); }

  get paddleKeyer() { return this.keyer.paddleKeyer; }

  set straightKey(v) { this.updateControl('straightKey', v); }

  get straightKey() { return this.keyer.straightKey; }

  set leftPaddleKey(v) { this.updateControl('leftPaddleKey', v); }

  get leftPaddleKey() { return this.keyer.leftPaddleKey; }

  set rightPaddleKey(v) { this.updateControl('rightPaddleKey', v); }

  get rightPaddleKey() { return this.keyer.rightPaddleKey; }

  set inputMidi(v) { this.updateControl('inputMidi', v); }

  get inputMidi() { return this.keyer.inputMidi; }

  // get inputMidiNames() { return this.keyer.inputMidiNames; }

  // get inputMidiNotes() { return this.keyer.inputMidiNotes; }

  set inputSources(v) { this.updateControl('inputSources', v); }

  get inputSources() { return this.keyer.inputSources; }

  set straightMidi(v) { this.updateControl('straightMidi', v); }

  get straightMidi() { return this.keyer.straightMidi; }

  set leftPaddleMidi(v) { this.updateControl('leftPaddleMidi', v); }

  get leftPaddleMidi() { return this.keyer.leftPaddleMidi; }

  set rightPaddleMidi(v) { /* console.log(`KeyerJs set rightPaddleMidi ${v}`); */ this.updateControl('rightPaddleMidi', v); }

  get rightPaddleMidi() { return this.keyer.rightPaddleMidi; }

  // get properties delegated to this.keyer.context
  get currentTime() { return this.keyer.currentTime; }

  get sampleRate() { return this.keyer.sampleRate; }

  get baseLatency() { return this.keyer.baseLatency; }

  get state() { return this.keyer.context.state; }
  
  constructor() {
    super();
    this.keyer = null;
  }

  setDefaultValue(control, forceDefault) {
    this[control] = defaultControl(control, defaults[control], forceDefault);
  }

  setDefaultValues(forceDefault) {
    Object.keys(defaults).forEach(control => this.setDefaultValue(control, forceDefault));
  }

  start() {
    // start the engine

    // retrieve the preferred sample rate
    this.setDefaultValue('requestedSampleRate', false);

    // console.log(`start this.requestedSampleRate === ${this.requestedSampleRate}`);
    this.keyer = new Keyer(new AudioContext({ sampleRate: parseInt(this.requestedSampleRate, 10) }));

    // this was for debugging the need to twiddle the gain to get iambic or straight keying to work
    // this.keyer.input.on('change:gain', g => console.log(`straight change:gain ${g}`), window);
    // this.keyer.output.on('change:gain', g => console.log(`output change:gain ${g}`), window);
    // default property values
    // using localStorage to persist defaults between sessions
    // defaults set at top of file
    this.setDefaultValues(false);
    
    this.running = this.keyer.context.state !== 'suspended';

    this.clear();

    this.validate();
    
    // this.keyer.outputDecoder.on('letter', (ltr, code) => console.log(`output '${ltr}' '${code}'`));
    this.keyer.inputDecoder.on('letter', (ltr) =>  this.onkeyed(ltr));
    this.keyer.output.on('sent', ltr => this.onsent(ltr));
    this.keyer.output.on('unsent', ltr => this.onunsent(ltr));
    this.keyer.output.on('skipped', ltr => this.onskipped(ltr));
    this.keyer.input.midiSource.on('midi:names', () => this.onmidinames());
    this.keyer.input.midiSource.on('midi:notes', () => this.onmidinotes());
  }
  
  // validate that our lists of options are actual options
  // and that default values are chosen from the same lists
  // also use the functions we define for this purpose
  validate() {
    shiftKeys.forEach(x => isShiftKey(x) || console.log(`shiftKey ${x} failed isShiftKey`));
    inputKeys.forEach(x => isInputKey(x) || console.log(`inputKey ${x} failed isInputKey`));
    paddleKeyers.forEach(x => isPaddleKeyer(x) || console.log(`paddleKeyer ${x} failed isPaddleKeyer`));
    inputSources.forEach(x => isInputSource(x) || console.log(`inputSource ${x} failed isInputSource`));
    sampleRates.forEach(x => isSampleRate(x) || console.log(`sampleRate ${x} failed isSampleRate`));
    ['qrq','swapped','displayTouchKey', 'displaySettings', 'displayOutput', 'displayAdvanced', 'displayInputKey', 'displayStatus'].
      forEach(x => isOnOff(this[x]) || console.log(`property '${x}' failed isOnOff: ${this[x]}`));
    ['straightKey', 'leftPaddleKey', 'rightPaddleKey'].
      forEach(x => isShiftKey(this[x]) || console.log(`property '${x}' failed isShiftKey: ${this[x]}`));
    ['inputKey'].
      forEach(x => isInputKey(this[x]) || console.log(`property '${x}' failed isInputKey: ${this[x]}`));
    ['paddleKeyer'].
      forEach(x => isPaddleKeyer(this[x]) || console.log(`property '${x}' failed isPaddleKeyer: ${this[x]}`));
    this.inputSources.forEach(x => isInputSource(x) || console.log(`property 'inputSources' failed isInputSource: '${x}'`));
    ['requestedSampleRate'].forEach(x => isSampleRate(this[x]) || console.log(`property '${x}' failed isSampleRate '${this[x]}'`));
  }
	       
  // input key events
  // e.key -> Control | Alt | Shift
  // e.location -> 1 for Left, 2 for Right
  // e.code -> (Control | Alt | Shift) (Left | Right)
  keydown(e) { this.keyer.keydown(e); this.ttyKeydown(e); }

  keyup(e) { this.keyer.keyup(e); }

  touchKey(e,type,onOff) { this.keyer.touchKey(e, type, onOff); }
  
  mouseKey(e,type,onOff) { this.keyer.mouseKey(e, type, onOff); }
  
  // midi information events
  onmidinames() { this.inputMidiNames = this.keyer.inputMidiNames; }

  onmidinotes() { this.inputMidiNotes = this.keyer.inputMidiNotes; }
  
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
      const cursor = this.shadowRoot.querySelector('.blinker');
      if (cursor) cursor.scrollIntoView(false);
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
      this.keyer.outputSend(e.key);
      this.updateContent();
      if (e.key === ' ') e.preventDefault();
    } else if (e.key === 'Backspace') {
      this.keyer.outputUnsend(e.data);
      // this.pending.pop(); the pop happens when the unsent confirmation comes back
      this.updateContent();
    } else if (e.key === 'Enter') {
      this.pending.push('\n');
      this.keyer.outputSend('\n');
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
    this.keyer.outputCancel();
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

  toggleControl(control) { 
    this[control] = toggleOnOff(this[control]);
    saveControl(control, this[control]);
  }

  toggleQrq() {
    // console.log(`toggleQrq qrq ${this.qrq}`);
    this.toggleControl('qrq');
    if (isOn(this.qrq)) {
      this.speed = Math.max(qrqMin, qrqStep * Math.floor(this.speed/qrqStep));
    } else {
      this.speed = Math.min(this.speed, qrsMax);
    }
  }

  toggleSwapped() { this.toggleControl('swapped'); }
  
  selectControl(control, e) { 
    // console.log(`selectControl('${control}', ${e.target.value})`);
    this[control] = e.target.value;
    saveControl(control, e.target.value);
  }
  
  selectSource(e, b) {
    // console.log(`selectSource e ${e} b ${b} sources '${this.inputSources}'`);
    if (this.inputSources.includes(b))
      this.inputSources = this.inputSources.filter(x => x !== b);
    else
      this.inputSources = this.inputSources.concat(b)
    // console.log(`selectSource e ${e} b ${b} sources '${this.inputSources}'`);
    // console.log(e);
  }
   
  selectInputKey(e) { this.selectControl('inputKey', e); }
  
  selectPaddleKeyer(e) { this.selectControl('paddleKeyer', e); }
  
  selectInputMidi(e) { this.selectControl('inputMidi', e); this.requestUpdate('inputMidiNotes', this.inputMidiNotes); }
  
  selectStraightKey(e) { this.selectControl('straightKey', e); }
  
  selectLeftPaddleKey(e) { this.selectControl('leftPaddleKey', e); }
  
  selectRightPaddleKey(e) { this.selectControl('rightPaddleKey', e); }
  
  selectStraightMidi(e) { this.selectControl('straightMidi', e); }
  
  selectLeftPaddleMidi(e) { this.selectControl('leftPaddleMidi', e); }

  selectRightPaddleMidi(e) { this.selectControl('rightPaddleMidi', e); }
  
  selectGain(e) { this.selectControl('gain', e); }

  selectPitch(e) { this.selectControl('pitch', e); }

  selectSpeed(e) { this.selectControl('speed', e); }

  selectRise(e) { this.selectControl('rise', e); }

  selectFall(e) { this.selectControl('fall', e); }

  selectWeight(e) { this.selectControl('weight', e); }

  selectRatio(e) { this.selectControl('ratio', e); }

  selectCompensation(e) { this.selectControl('compensation', e); }
    
  selectEnvelope(e) { this.selectControl('envelope', e); }
  
  selectEnvelope2(e) { this.selectControl('envelope2', e); }
  
  selectRequestedSampleRate(e) { 
    this.selectControl('requestedSampleRate', e);
    this.start();
  }
  
  // display panel selectors
  toggleTouchKey() { this.displayTouchKey = toggleOnOff(this.displayTouchKey); }

  toggleSettings() { this.displaySettings = toggleOnOff(this.displaySettings); }

  toggleOutput() { this.displayOutput = toggleOnOff(this.displayOutput); }

  toggleAdvanced() { this.displayAdvanced = toggleOnOff(this.displayAdvanced); }

  toggleInputKey() { this.displayInputKey = toggleOnOff(this.displayInputKey); }

  toggleMisc() {  this.displayMisc = toggleOnOff(this.displayMisc); }
  
  toggleStatus() { this.displayStatus = toggleOnOff(this.displayStatus); }

  resetDefaultValues() { this.setDefaultValues(true); }
  
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

      div.keyboard {
        display: inline-block;
        padding: 10px;
        text-align: left;
	white-space: pre-wrap;
        margin-top: 16px;
        width: 90%;
        margin-left: 5%;
        margin-right: 5%;
        height: 300px;
	overflow-wrap: break-word;
        overflow-y: auto;
        border: inset;
        border-color: #9e9e9e;
        border-width: 1px;
        color: #000000;
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

      .hidden {
        display: none;
      }

      .blinker {
	font-weight: 100;
	color: #2E3D48;
	-webkit-animation: 1s blink step-end infinite;
	-moz-animation: 1s blink step-end infinite;
	-ms-animation: 1s blink step-end infinite;
	-o-animation: 1s blink step-end infinite;
	animation: 1s blink step-end infinite;
      }

      @keyframes "blink" {
	from, to {
	  color: transparent;
	}
	50% {
	  color: black;
	}
      }

      @-moz-keyframes blink {
	from, to {
	  color: transparent;
	}
	50% {
	  color: black;
	}
      }

      @-webkit-keyframes "blink" {
        from, to {
          color: transparent;
        }
        50% {
          color: black;
        }
      }

      @-ms-keyframes "blink" {
        from, to {
          color: transparent;
        }
        50% {
          color: black;
        }
      }

      @-o-keyframes "blink" {
        from, to {
          color: transparent;
        }
        50% {
          color: black;
        }
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

  touchKeyRender() {
    if ( ! this.inputSources.includes('touch'))
      return html``;
    if (this.inputKey === 'straight')
      return html`
	  <button class="key" @mousedown=${e => this.mouseKey(e,'straight',true)} 
			      @mouseup=${e => this.mouseKey(e,'straight',false)}
			      @touchstart=${e => this.touchKey(e,'straight',false)}
			      @touchend=${e => this.touchKey(e,'straight',false)}
		>${straightKeyArrow}</button>
	`;
    if (this.inputKey === 'paddle')
      return html`
	  <button class="key" @mousedown=${e => this.mouseKey(e,'left',true)}
			      @mouseup=${e => this.mouseKey(e,'left',false)}
			      @touchstart=${e => this.touchKey(e,'left',false)}
			      @touchend=${e => this.touchKey(e,'left',false)}
		>${leftKeyArrow}</button>
	  <button class="key" @mousedown=${e => this.mouseKey(e,'right',true)}
			      @mouseup=${e => this.mouseKey(e,'right',false)}
			      @touchstart=${e => this.toucheKey(e,'right',false)}
			      @touchend=${e => this.touchKey(e,'right',false)}
		>${rightKeyArrow}</button>
	`;
    return html``;
  }

  advancedRender() {
    return isOff(this.displayAdvanced) ? html`` : html`
	<div>
	  <input type="range" id="weight" name="weight" min="25" max="75"
	  .value=${this.weight} step="0.1"
	  @input=${this.selectWeight}>
	  <label for="weight">Weight ${this.weight} (%)</label>
	</div>
	<div>
	  <input type="range" id="ratio" name="ratio" min="25" max="75"
	  .value=${this.ratio} step="0.1"
	  @input=${this.selectRatio}>
	  <label for="ratio">Ratio ${this.ratio} (%)</label>
	</div>
	<div>
	  <input type="range" id="compensation" name="compensation" min="-15" max="15"
	  .value=${this.compensation} step="0.1"
	  @input=${this.selectCompensation}>
	  <label for="compensation">Compensation ${this.compensation} (%)</label>
	</div>
	<div>
	  <input type="range" id="rise" name="rise" min="1" max="10" 
	  .value=${this.rise} step="0.1"
	  @input=${this.selectRise}>
	  <label for="rise">Rise ${this.rise} (ms)</label>
	</div>
	<div>
	  <input type="range" id="fall" name="fall" min="1" max="10"
	  .value=${this.fall} step="0.1"
	  @input=${this.selectFall}>
	  <label for="fall">Fall ${this.fall} (ms)</label>
	</div>
	<div>
	  <label>Envelope: 
	    <select .value=${this.envelope} @change=${this.selectEnvelope}>
	      ${templateOptions(KeyerJs.envelopes, this.envelope)}
	    </select> * 
	    <select .value=${this.envelope2} @change=${this.selectEnvelope2}>
	      ${templateOptions(KeyerJs.envelopes, this.envelope2)}
	    </select>
	  </label>
	</div>
      `;
  }

  outputRender() {
    return isOff(this.displayOutput) ? html`` : html`
	<div>
	  <input type="range" id="speed" name="speed" min=${isOn(this.qrq) ? qrqMin : qrsMin} max=${isOn(this.qrq) ? qrqMax : qrsMax}
	  .value=${this.speed} step=${isOn(this.qrq) ? qrqStep : qrsStep} @input=${this.selectSpeed}>
	  <label for="speed">Speed ${this.speed} (WPM)</label>
	  <button role="switch" aria-checked=${isOn(this.qrq)} @click=${this.toggleQrq}>
	    <span>${isOn(this.qrq) ? 'QRQ' : 'QRS'}</span>
	  </button>
	</div>
	<div>
	  <input type="range" id="gain" name="gain" min="-50" max="10" .value=${this.gain} step="1" @input=${this.selectGain}>
	  <label for="gain">Gain ${this.gain} (dB)</label>
	</div>
	<div>
	  <input type="range" id="pitch" name="pitch" min="250" max="2000" .value=${this.pitch} step="1" @input=${this.selectPitch}>
	  <label for="pitch">Pitch ${this.pitch} (Hz)</label>
	</div>
      `;
  }

  inputKeyRender() {
    return isOff(this.displayInputKey) ?  html`` : [
      html`
	<div>
	  <label>Input key:
	    <select .value=${this.inputKey} @change=${this.selectInputKey}>
	      <option>none</option>
	      <option>straight</option>
	      <option>paddle</option>
	    </select>
	  </label>
	</div>`,
      this.inputKey !== 'paddle' ? html`` : html`
	<div>
	  <label>Swap paddles: 
            <button role="switch" aria-checked=${isOn(this.swapped)} @click=${this.toggleSwapped}>
	      <span>${this.swapped}</span>
	    </button>
	  </label>
	</div>
	<div>
	  <label>Paddle keyer:
            <select .value=${this.paddleKeyer} @change=${this.selectPaddleKeyer}>
	      ${templateOptions(this.paddleKeyers, this.paddleKeyer)}
	    </select>
	  </label>
	</div>`,
      this.inputKey === 'none' ? html`` : html`
	<div>
	  <label>Key sources:</label>
	    ${templateAlternates(inputSources, this.inputSources, (e,s) => this.selectSource(e,s))}
	</div>`,
      ! (this.inputKey === 'straight' && this.inputSources.includes('keyboard')) ? html`` : html`
	<div>
	  <label>Straight keyboard key:
            <select .value=${this.straightKey} @change=${this.selectStraightKey}>
	      ${shiftKeyOptions(this.straightKey)}
	    </select>
	  </label>
        </div>`,
      ! (this.inputKey === 'paddle' && this.inputSources.includes('keyboard')) ? html`` : html`
	<!-- input keyer settings, paddle, keyboard selection -->
	<div>
	  <label>Left paddle keyboard key:
            <select .value=${this.leftPaddleKey} @change=${this.selectLeftPaddleKey}>
	      ${shiftKeyOptions(this.leftPaddleKey)}
	    </select>
	  </label>
	</div>
	<div>
	  <label>Right paddle keyboard key:
            <select .value=${this.rightPaddleKey} @change=${this.selectRightPaddleKey}>
	      ${shiftKeyOptions(this.rightPaddleKey)}
	    </select>
	  </label>
	</div>
      </div>`,
      ! (this.inputKey !== 'none' && this.inputSources.includes('midi')) ? html`` : html`
	<div>
	  <label>Midi interface: 
            <select .value=${this.inputMidi} @change=${this.selectInputMidi}>
	      ${templateOptions(this.inputMidiNames, this.inputMidi)}
	    </select>
	  </label>
	</div>`,
      ! (this.inputKey === 'straight' && this.inputSources.includes('midi')) ? html`` : html`
	<div>
	  <label>Straight midi note:
            <select .value=${this.straightMidi} @change=${this.selectStraightMidi}>
	      ${templateOptions(this.inputMidiNotes, this.straightMidi)}
	    </select>
	  </label>
        </div>`,
      ! (this.inputKey === 'paddle' && this.inputSources.includes('midi')) ? html`` : html`
	<!-- input keyer settings, paddle, midi selection -->
	<div>
	  <label>Left paddle midi note:
            <select .value=${this.leftPaddleMidi} @change=${this.selectLeftPaddleMidi}>
	      ${templateOptions(this.inputMidiNotes, this.leftPaddleMidi)}
	    </select>
	  </label>
	</div>
	<div>
	  <label>Right paddle midi note:
            <select .value=${this.rightPaddleMidi} @change=${this.selectRightPaddleMidi}>
	      ${templateOptions(this.inputMidiNotes, this.rightPaddleMidi)}
	    </select>
	  </label>
	</div>
      </div>`
    ];
  }

  miscRender() {
    return isOff(this.displayMisc) ? html`` : html`
	<div>
	  <label>Requested sample rate:
            <select .value=${this.requestedSampleRate} @change=${this.selectRequestedSampleRate}>
	      ${templateOptions(sampleRates, this.requestedSampleRate)}
	    </select>
	  </label>
	  <br/>
	  <label>Reset default values: 
	    <button @click=${this.resetDefaultValues}>Reset</button>
	  </label>
	</div>
	`;
  }

  settingsRender() {
    return isOff(this.displaySettings) ? html`` : html`
      <div>
	<!-- keyer output settings -->
	<h3 @click=${this.toggleOutput}>
	  ${isOff(this.displayOutput) ? hiddenMenuIndicator : shownMenuIndicator} Keyer Output
	</h3>
	${this.outputRender()}
	<!-- advanced keyboard output settings -->
	<h3 @click=${this.toggleAdvanced}>
	  ${isOff(this.displayAdvanced) ? hiddenMenuIndicator : shownMenuIndicator} More Output
	</h3>
	${this.advancedRender()}
	<!-- input key selection --->
	<h3 @click=${this.toggleInputKey}>
	  ${isOff(this.displayInputKey) ? hiddenMenuIndicator : shownMenuIndicator} Key Input
	</h3>
	${this.inputKeyRender()}
	<!-- audio engine parameters --->
	<h3 @click=${this.toggleMisc}>
	  ${isOff(this.displayMisc) ? hiddenMenuIndicator : shownMenuIndicator} Misc
	</h3>
	${this.miscRender()}
      </div>
    `;
  }

  statusRender() {
    return isOff(this.displayStatus) ?  html`` : html`
      <div>
	Sample rate: ${this.sampleRate}<br/>
	Current time: ${this.currentTime}<br/>
	Base latency: ${this.baseLatency}<br/>
      </div>
    `;
  }

  mainRender() {
    return html`
        <div>
          <button role="switch" aria-checked=${this.running} @click=${this.playPause}>
	    <span>${this.running ? pauseSymbol : playSymbol}</span>
	  </button>
	  <button @click=${this.clear}>
	    <span>Clear</span>
	  </button>
	  <button @click=${this.cancel}>
	    <span>Cancel</span>
	  </button>
	  <div class="keyboard" tabindex="0" @keydown=${this.keydown} @keyup=${this.keyup}
		 @focus=${this.onfocus} @blur=${this.onblur}>${this.content}</div>
	</div>
	<div>
	  ${this.touchKeyRender()}
	</div>
	<h2 @click=${this.toggleSettings}>
	<div>
	  ${isOff(this.displaySettings) ? hiddenMenuIndicator : shownMenuIndicator} Settings
	</div>
	</h2>
	<div>
	  <!-- settings block -->
	  ${this.settingsRender()}
	</div>
        <h2 @click=${this.toggleStatus}>
	  ${isOff(this.displayStatus) ? hiddenMenuIndicator : shownMenuIndicator} Status
	</h2>
	<div>
	  ${this.statusRender()}
	</div>`;
  }
  
  startupRender() {
    return html`
        <div>
          <button class="start" @click=${this.start}>
	    <span>${playSymbol}</span>
	  </button>
	  <h2>Press play to play.</h2>
	</div>`;
  }

  render() {
    return html`
      <main>
        <div class="logo">${keyerLogo}</div>
        <div><h1>keyer.js</h1></div>
	<hr>
	${this.keyer === null ? this.startupRender() : this.mainRender()}
      </main>

      <p class="app-footer">
        🚽 Made with love by
        <a target="_blank" rel="noopener noreferrer"
           href="https://github.com/open-wc" >open-wc</a>.
      </p>
    `;
  }
}
