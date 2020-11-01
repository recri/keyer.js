/* eslint class-methods-use-this: ["error", { "exceptMethods": ["divBeforeInput","divChange","touchKeyRender"] }] */
/* eslint no-param-reassign: ["error", { "props": false }] */

import { LitElement, html, css } from 'lit-element';
import { keyerLogo } from './keyer-logo.js';
import { Keyer } from './Keyer.js';

// default values for properties
const defaults = {
  pitch: 700,
  gain: -26,
  weight: 50,
  ratio: 50,
  compensation: 0,
  rise: 4,
  fall: 4,
  speed: 20,
  qrq: 'off',
  inputKeyer: 'iambic',
  straightKey: 'ControlRight',
  swapped: 'off',
  leftPaddleKey: 'AltRight',
  rightPaddleKey: 'ControlRight',

  displaySettings: 'on',
  displayStatus: 'on',
  displayTouchKey: 'off',
  displayAdvanced: 'off',
  displayInputKeys: 'off'
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

// toggle between block and none
const toggleOnOff = (onOff) => ({ on: 'off', off: 'on' }[onOff]);

// force default values
const forceDefault = true;

// grab a value from localStorage or return the default value
const defaultControl = (control, defaultValue) => {
  // if (localStorage[control] === undefined) {
  // console.log(`defaultControl localStorage[${control}] is undefined, default to ${defaultValue}`);
  // } else {
  //  console.log(`defaultControl localStorage[${control}] is defined, using ${localStorage[control]}`);
  // }
  const value = localStorage[control] === undefined || typeof(localStorage[control]) === 'undefined' || forceDefault ?
	defaultValue : localStorage[control];
  localStorage[control] = value;
  return value;
}

const saveControl = (control, newValue) => { localStorage[control] = newValue; }

// is this a shift key
const isshift = (key) => key === 'Control' || key === 'Alt' || key === 'Shift';

// generate a list of <option>name</option> html templates
const templateOptions = (names) => names.map(x => html`<option>${x}</option>`);

// list of left/right qualified shift keys
const shiftKeys = ['None','ShiftLeft','ControlLeft','AltLeft','AltRight','ControlRight','ShiftRight'];

// generate a list of shift key <option>name</option> html templates
const shiftKeyOptions = () => templateOptions(shiftKeys);

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
      pitch: { type: Number },
      gain: { type: Number },
      speed: { type: Number },
      qrq: { type: String },
      weight: { type: Number },
      ratio: { type: Number },
      compensation: { type: Number },
      rise: { type: Number },
      fall: { type: Number },
      midi: { type: String },
      swapped: { type: String },
      inputKeyer: { type: String },
      leftPaddleKey: { type: String },
      rightPaddleKey: { type: String },
      straightKey: { type: String },

      displayTouchKey: { type: String },
      displaySettings: { type: String },
      displayStatus: { type: String },
      displayAdvanced: { type: String },
      displayInputKeys: { type: String },

      running: { type: Boolean }
    };
  }

  // setter with updateRequest
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

  set swapped(v) {  this.updateControl('swapped', v); }

  get swapped() { return this.keyer.swapped; }

  set inputKeyer(v) { this.updateControl('inputKeyer', v); }

  get inputKeyer() { return this.keyer.inputKeyer; }

  set straightKey(v) { this.updateControl('straightKey', v); }

  get straightKey() { return this.keyer.straightKey; }

  set leftPaddleKey(v) { this.updateControl('leftPaddleKey', v); }

  get leftPaddleKey() { return this.keyer.leftPaddleKey; }

  set rightPaddleKey(v) { this.updateControl('rightPaddleKey', v); }

  get rightPaddleKey() { return this.keyer.rightPaddleKey; }

  constructor() {
    super();
    // start the engine
    this.keyer = new Keyer(new AudioContext());
    // this was for debugging the need to twiddle the gain to get iambic or straight keying to work
    // this.keyer.input.straight.on('change:gain', g => console.log(`straight change:gain ${g}`), window);
    // this.keyer.input.iambic.on('change:gain', g => console.log(`iambic change:gain ${g}`), window);
    // this.keyer.output.on('change:gain', g => console.log(`output change:gain ${g}`), window);

    // default property values
    // using localStorage to persist defaults between sessions
    // defaults set at top of file
    Object.keys(defaults).forEach(control => { this[control] = defaultControl(control, defaults[control]) })

    // this.leftPaddleMidi = defaultControl('leftPaddleMidi', leftPaddleMidiDefault);
    // this.rightPaddleMidi = defaultControl('rightPaddleMidi', rightPaddleMidiDefault);
    // this.straightMidi = defaultControl('straightMidi', straightMidiDefault);
    // this.touchPaddle = defaultControl('touchPaddle', touchPaddleDefault);
    // this.touchStraight = defaultControl('touchStraight', touchStraightDefault);

    this.running = this.keyer.context.state !== 'suspended';
    this.text = [['sent', ''], ['pending', '']];

    // this.keyer.outputDecoderOnLetter((ltr, code) => console.log(`output '${ltr}' '${code}'`));
    // this.keyer.inputDecoderOnLetter((ltr, code) => console.log(`input '${ltr}' '${code}'`));
    // this.keyer.output.on('sent', ltr => console.log(`sent '${ltr}'`));
  }

  // e.key -> Control | Alt | Shift
  // e.location -> 1 for Left, 2 for Right
  // e.code -> (Control | Alt | Shift) (Left | Right)
  keydown(e) {
    if (isshift(e.key)) {
      // console.log(`keydown e.key ${e.key} e.location ${e.location} e.code ${e.code}`);
      this.keyer.keydown(e);
    }
  }

  keyup(e) {
    if (isshift(e.key)) this.keyer.keyup(e);
  }

  keypress(e) {
    // console.log(`keypress e.key ${e.key}`);
    this.text = this.text.concat([['pending', e.key]]);
    this.keyer.keypress(e);
  }

  divBeforeInput(e) {
    switch (e.inputType) {
    case 'insertText': break;
    case 'deleteContentBackward': break;
    case 'insertFromPaste': break;
    case 'insertParagraph': break;
    default:
      console.log('divBeforeInput:');
      console.log(e);
      break;
    }
  }

  divInput(e) {
    switch (e.inputType) {
    case 'insertText':
      this.keyer.outputSend(e.data); break; // e.data inserted
    case 'insertParagraph':
      break;
    case 'deleteContentBackward':
      this.keyer.outputUnsend(e.data); break; // e.data deleted
    case 'deleteByCut':
      this.keyer.outputUnsend(e.data); break; // e.data is null
    case 'insertFromPaste':
      break; // e.data is null
    case 'insertFromDrop':
      break; // e.data is null
    default:
      console.log('divInput:');
      console.log(e);
      break;
    }
  }

  divChange(e) {
    console.log("divChange:");
    console.log(e);
  }

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

  clear() { this.text = [['sent',''],['pending','']]; }

  cancel() { this.keyer.outputCancel(); }

  toggleControl(control) { 
    this[control] = (this[control] === 'off' ? 'on' : 'off');
    saveControl(control, this[control]);
  }

  toggleQrq() {
    // console.log(`toggleQrq qrq ${this.qrq}`);
    this.toggleControl('qrq');
    if (this.qrq === 'on') {
      this.speed = Math.max(qrqMin, qrqStep * Math.floor(this.speed/qrqStep));
    } else {
      this.speed = Math.min(this.speed, qrsMax);
    }
  }

  toggleSwapped() { this.toggleControl('swapped'); }
  
  selectControl(control, e) { 
    console.log(`selectControl('${control}', ${e.target.value})`);
    this[control] = e.target.value;
    saveControl(control, e.target.value);
  }
  
  selectInputKeyer(e) { this.selectControl('inputKeyer', e); }
  
  selectStraightKey(e) { this.selectControl('straightKey', e); }
  
  selectLeftPaddleKey(e) { this.selectControl('leftPaddleKey', e); }
  
  selectRightPaddleKey(e) { this.selectControl('rightPaddleKey', e); }
  
  selectGain(e) { this.selectControl('gain', e); }

  selectPitch(e) { this.selectControl('pitch', e); }

  selectSpeed(e) { this.selectControl('speed', e); }

  selectRise(e) { this.selectControl('rise', e); }

  selectFall(e) { this.selectControl('fall', e); }

  selectWeight(e) { this.selectControl('weight', e); }

  selectRatio(e) { this.selectControl('ratio', e); }

  selectCompensation(e) { this.selectControl('compensation', e); }
    
  // display panel selectors
  toggleTouchKey() { this.displayTouchKey = toggleOnOff(this.displayTouchKey); }

  toggleSettings() { console.log("toggleSettings"); this.displaySettings = toggleOnOff(this.displaySettings); }

  toggleAdvanced() { this.displayAdvanced = toggleOnOff(this.displayAdvanced); }

  toggleInputKeys() { this.displayInputKeys = toggleOnOff(this.displayInputKeys); }

  toggleStatus() { this.displayStatus = toggleOnOff(this.displayStatus); }

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

      button > span {
        font-size: calc(10px + 2vmin);
      }
      select {
        font-size: calc(10px + 2vmin);
      }

      div.keyboard {
        display: inline-block;
        padding: 10px;
        text-align: left;
        margin-top: 16px;
        width: 90%;
        margin-left: 5%;
        margin-right: 5%;
        height: 300px;
        overflow-y: auto;
        border: inset;
        border-color: #9e9e9e;
        border-width: 5px;
        color: #000000;
      }
      .sent {
        color: #888;
      }
      .skip {
        text-decoration: line-through;
      }

      .hidden {
        display: none;
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
    if (this.displayTouchKey === 'on')
      switch (this.inputKeyer) {
      case 'straight':
	return html`
	  <button class="key" @click=${this.touchKey}></button>
	`;
      case 'iambic': 
	return html`
	  <button class="key" @click=${this.touchLeftKey}></button>
	  <button class="key" @click=${this.touchRightKey}></button>
	`;
      default:
	console.log(`touchKeyRender this.displayTouchKey ${this.displayTouchKey}`);
	return html``;
      }
    return html``;
  }

  advancedRender() {
    if (this.displayAdvanced === 'off')
      return html``;
    return html`
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
	</div>`;
  }

  inputKeysRender() {
    if (this.displayInputKeys === 'off')
      return html``;
    return html`
	<div>
	  <label>Input keyer:
	    <select .value=${this.inputKeyer} @change=${this.selectInputKeyer}>
	      <option>none</option>
	      <option>straight</option>
	      <option>iambic</option>
	    </select>
	  </label>
	</div>
	<!-- straight input keyer settings -->
	<h4>Straight Key</h4>
	<div>
	  <label>Straight key:
            <select .value=${this.straightKey} @change=${this.selectStraightKey}>
	      ${shiftKeyOptions()}
	    </select>
	  </label>
        </div>
	<!-- input keyer settings, iambic -->
	<h4>Iambic Key</h4>
	<div>
	  <label>Swap paddles: 
            <button role="switch" aria-checked=${this.swapped === 'on'} @click=${this.toggleSwapped}>
	      <span>${this.swapped}</span>
	    </button>
	  </label>
	</div>
	<div>
	  <label>Left paddle key:
            <select .value=${this.leftPaddleKey} @change=${this.selectLeftPaddleKey}>
	      ${shiftKeyOptions()}
	    </select>
	  </label>
	</div>
	<div>
	  <label>Right paddle key:
            <select .value=${this.rightPaddleKey} @change=${this.selectRightPaddleKey}>
	      ${shiftKeyOptions()}
	    </select>
	  </label>
	</div>
      </div>`;
  }

  settingsRender() {
    console.log(`settingsRender this.displaySettings === '${this.displaySettings}'`);
    if (this.displaySettings === 'off')
      return html``;
    return html`
      <div>
	<!-- basic keyboard output settings -->
	<div>
	  <input type="range" id="speed" name="speed" min=${this.qrq === 'on' ? qrqMin : qrsMin} max=${this.qrq === 'on' ? qrqMax : qrsMax}
	  .value=${this.speed} step=${this.qrq === 'on' ? qrqStep : qrsStep} @input=${this.selectSpeed}>
	  <label for="speed">Speed ${this.speed} (WPM)</label>
	  <button role="switch" aria-checked=${this.qrq === 'on'} @click=${this.toggleQrq}>
	    <span>${this.qrq === 'on' ? 'QRQ' : 'QRS'}</span>
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
	<!-- advanced keyboard output settings -->
	<h3 @click=${this.toggleAdvanced}>
	  ${this.displayAdvanced === 'off' ? hiddenMenuIndicator : shownMenuIndicator} Advanced
	</h3>
	${this.advancedRender()}
	<!-- input keyer selection --->
	<h3 @click=${this.toggleInputKeys}>
	  ${this.displayInputKeys === 'off' ? hiddenMenuIndicator : shownMenuIndicator} Input Keys
	</h3>
	${this.inputKeysRender()}
    `;
  }

  statusRender() {
    console.log(`statusRender this.displayStatus === '${this.displayStatus}'`);
    if (this.displayStatus === 'off')
      return html``;
    return html`
      <div>
	Sample rate: ${this.keyer.context.sampleRate}<br/>
	Current time: ${this.keyer.context.currentTime}<br/>
	Base latency: ${this.keyer.context.baseLatency}<br/>
      </div>
    `;
  }

  render() {
    return html`
      <main>
        <div class="logo">${keyerLogo}</div>
        <div><h1>keyer.js</h1></div>
        <div>
          <button role="switch" aria-checked=${this.running} @click=${this.playPause}>
	    <span>${this.running ? 'Pause' : 'Play'}</span>
	  </button>
	  <button @click=${this.clear}>
	    <span>Clear</span>
	  </button>
	  <button @click=${this.cancel}>
	    <span>Cancel</span>
	  </button>
	  <div class="keyboard" contenteditable="true" @input=${this.divInput} @beforeinput=${this.divBeforeInput} @keydown=${this.keydown} @keyup=${this.keyup}>
	    <span class="sent">Sent text <span class="skip"> Skipped text </span><br>More sent text </span> and text to be sent<br> and more to send
	  </div>
	</div>
	<div>
	  ${this.touchKeyRender()}
	</div>
	<h2 @click=${this.toggleSettings}>
	<div>
	  ${this.displaySettings === 'off' ? hiddenMenuIndicator : shownMenuIndicator} Settings
	</div>
	</h2>
	<div>
	  <!-- settings block -->
	  ${this.settingsRender()}
	</div>
        <h2 @click=${this.toggleStatus}>
	  ${this.displayStatus === 'off' ? hiddenMenuIndicator : shownMenuIndicator} Status
	</h2>
	<div>
	  ${this.statusRender()}
	</div>
      </main>

      <p class="app-footer">
        🚽 Made with love by
        <a target="_blank" rel="noopener noreferrer"
           href="https://github.com/open-wc" >open-wc</a>.
      </p>
    `;
  }
}
