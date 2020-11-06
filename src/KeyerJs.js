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
  envelope: 'raised-cosine',
  speed: 20,
  qrq: 'off',
  inputKeyer: 'iambic',
  inputSource: ['keyboard'],
  inputMidi: 'none',
  straightKey: 'ControlRight',
  straightMidi: '1:1',
  swapped: 'off',
  leftPaddleKey: 'AltRight',
  rightPaddleKey: 'ControlRight',
  leftPaddleMidi: '1:0',
  rightPaddleMidi: '1:1',
  // properties that are local
  displayTouchKey: 'off',
  displaySettings: 'on',
  displayAdvanced: 'off',
  displayInputKeys: 'off',
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

// force default values
const forceDefault = true;

// grab a value from localStorage or return the default value
// had fits trying to use Booleans here, which is why they're all 'on'||'off' instead
const defaultControl = (control, defaultValue) => {
  const value = localStorage[control] === undefined || typeof(localStorage[control]) === 'undefined' || forceDefault ?
	defaultValue : localStorage[control];
  localStorage[control] = value;
  return value;
}
const saveControl = (control, newValue) => { localStorage[control] = newValue; }

// generate a list of <option>name</option> html templates
const templateOptions = (names, selected) => names.map(x => html`<option value=${x} ?selected=${x === selected}>${x}</option>`);

// generate a list of <input type="checkbox"></input> html templates
const templateAlternates = (names, selected, handler) => names.map(x => {
  const isSelected = selected.includes(x);
  const checkBox = isSelected ? checkedCheckBox : uncheckedCheckBox;
  return html`<button role="switch" aria-checked=${isSelected} @click=${e => handler(e,x)}>${checkBox} ${x}</button>`;
});

// list of left/right qualified shift keys
const shiftKeys = ['None','ShiftLeft','ControlLeft','AltLeft','AltRight','ControlRight','ShiftRight'];

// generate a list of shift key <option>name</option> html templates
const shiftKeyOptions = (selected) => templateOptions(shiftKeys, selected);
const isShiftKey = (value) => shiftKeys.includes(value);

// list of valid inputKeys
const inputKeyers = [ 'none', 'straight', 'iambic' ];
const isInputKeyer = (value) => inputKeyers.includes(value);

// list of valid inputSources
const inputSources = [ 'touch', 'keyboard', 'midi' ];
const isInputSource = (value) => inputSources.includes(value);

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
      inputKeyer: { type: String },
      inputSource: { type: Array },
      inputMidi: { type: String },
      swapped: { type: String },
      straightKey: { type: String },
      leftPaddleKey: { type: String },
      rightPaddleKey: { type: String },
      straightMidi: { type: String },
      leftPaddleMidi: { type: String },
      rightPaddleMidi: { type: String },
      // properties read only from this.keyer.context
      state: { type: String },
      sampleRate: { type: Number },
      currentTime: { type: Number },
      baseLatency: { type: Number },
      // properties that are local
      displayTouchKey: { type: String },
      displaySettings: { type: String },
      displayStatus: { type: String },
      displayAdvanced: { type: String },
      displayInputKeys: { type: String },
      // property computed
      running: { type: Boolean },
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

  static get envelopes() { return Keyer.envelopes; }
  
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

  set inputMidi(v) { this.updateControl('inputMidi', v); }

  get inputMidi() { return this.keyer.inputMidi; }

  get inputMidiNames() { return this.keyer.inputMidiNames; }

  get inputMidiNotes() { return this.keyer.inputMidiNotes; }

  set inputSource(v) { this.updateControl('inputSource', v); }

  get inputSource() { return this.keyer.inputSource; }

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
    this.sent = [];
    this.pending = [];
  }

  start() {
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

    this.running = this.keyer.context.state !== 'suspended';
    this.text = [['sent', ''], ['pending', '']];

    this.validate();
    
    // this.keyer.outputDecoderOnLetter((ltr, code) => console.log(`output '${ltr}' '${code}'`));
    // this.keyer.inputDecoderOnLetter((ltr, code) => console.log(`input '${ltr}' '${code}'`));
    this.keyer.on('sent', ltr => this.onsent(ltr));
    this.keyer.on('unsent', ltr => this.onunsent(ltr));
  }
  
  validate() {
    shiftKeys.forEach(x => isShiftKey(x) || console.log(`shiftKey ${x} failed isShiftKey`));
    inputKeyers.forEach(x => isInputKeyer(x) || console.log(`inputKeyer ${x} failed isInputKeyer`));
    inputSources.forEach(x => isInputSource(x) || console.log(`inputSource ${x} failed isInputSource`));
    ['qrq','swapped','displayTouchKey', 'displaySettings', 'displayAdvanced', 'displayInputKeys', 'displayStatus'].
      forEach(x => isOnOff(this[x]) || console.log(`property '${x}' failed isOnOff: ${this[x]}`));
    ['straightKey', 'leftPaddleKey', 'rightPaddleKey'].
      forEach(x => isShiftKey(this[x]) || console.log(`property '${x}' failed isShiftKey: ${this[x]}`));
    ['inputKeyer'].
      forEach(x => isInputKeyer(this[x]) || console.log(`property '${x}' failed isInputKeyer: ${this[x]}`));
    this.inputSource.forEach(x => isInputSource(x) || console.log(`property 'inputSource' failed isInputSource: '${x}'`));
  }
	       
  // input key events
  // e.key -> Control | Alt | Shift
  // e.location -> 1 for Left, 2 for Right
  // e.code -> (Control | Alt | Shift) (Left | Right)
  keydown(e) { this.keyer.keydown(e); }

  keyup(e) { this.keyer.keyup(e); }

  touchKey(e,type,onOff) { this.keyer.touchKey(e, type, onOff); }
  
  //
  // teletype window
  //
  divBeforeInput(e) {
    this.before = this.shadowRoot.querySelector(".keyboard").innerHTML;
    switch (e.inputType) {
    case 'insertText': 
      break;
    case 'deleteContentBackward':
      break;
    case 'insertFromPaste':
      // console.log(`divBeforeInput ${e.inputType}`);
      break;
    case 'insertParagraph':
      // console.log(`divBeforeInput ${e.inputType}`);
      break;
    default:
      console.log(`divBeforeInput new case ${e.inputType}`);
      console.log(e);
      break;
    }
  }

  divInput(e) {
    this.after = this.shadowRoot.querySelector(".keyboard").innerHTML;
    switch (e.inputType) {
    case 'insertText':
      // console.log(`  insertText ${e.data}`);
      this.pending.push(e.data); // e.data inserted
      this.keyer.outputSend(e.data);
      break;
    case 'insertParagraph':
      // console.log(`divInput ${e.inputType}`);
      // browser inserts <br><br> for first newline
      // because single <br> at end of element does not display
      this.pending.push('\n');
      this.keyer.outputSend('\n');
      break;
    case 'deleteContentBackward':
      // console.log(`divInput ${e.inputType} '${e.data}'`);
      this.keyer.outputUnsend(e.data); break; // e.data deleted
    case 'deleteByCut':
      console.log(`divInput ${e.inputType}`);
      break; // e.data is null
    case 'insertFromPaste':
      console.log(`divInput ${e.inputType}`);
      break; // e.data is null
    case 'insertFromDrop':
      console.log(`divInput ${e.inputType}`);
      break; // e.data is null
    default:
      console.log(`divInput: new type ${e.inputType}`);
      console.log(e);
      break;
    }
  }

  onsent(ltr) {
    const chr = this.pending[0];
    if (ltr === chr) {
      this.pending.shift()
    }
    this.sent.push(chr);
    this.updateKeyboard()
  }

  onunsent(ltr) {
    const chr = this.pending[this.pending.length-1]
    if (ltr === chr) this.pending.pop();
  }

  updateKeyboard() {
    const keyboard = this.shadowRoot.querySelector(".keyboard");
    keyboard.innerHTML = `<span class="sent" contenteditable="false">${this.sent.join('')}</span><span class="pending">${this.pending.join('')}</span>`;
    const range = document.createRange();
    range.selectNodeContents(keyboard);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  
  clear() { 
    this.sent = [];
    this.pending = [];
    this.updateKeyboard();
  }

  cancel() {
    this.keyer.outputCancel();
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
    if (this.inputSource.includes(b))
      this.inputSource = this.inputSource.filter(x => x !== b);
    else
      this.inputSource = this.inputSource.concat(b)
    // console.log(`selectSource ${e} ${b} '${this.inputSource}'`);
    // console.log(e);
  }
   
  selectInputKeyer(e) { this.selectControl('inputKeyer', e); }
  
  selectInputMidi(e) { this.selectControl('inputMidi', e); }
  
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
  
  // display panel selectors
  toggleTouchKey() { this.displayTouchKey = toggleOnOff(this.displayTouchKey); }

  toggleSettings() { this.displaySettings = toggleOnOff(this.displaySettings); }

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

      button, select {
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
    if ( ! this.inputSource.includes('touch'))
      return html``;
    switch (this.inputKeyer) {
    case 'straight':
      return html`
	  <button class="key" @mousedown=${e => this.touchKey(e,'straight',true)} @mouseup=${e => this.touchKey(e,'straight',false)}>${straightKeyArrow}</button>
	`;
    case 'iambic': 
      return html`
	  <button class="key" @mousedown=${e => this.touchKey(e,'left',true)} @mouseup=${e => this.touchKey(e,'left',false)}>${leftKeyArrow}</button>
	  <button class="key" @mousedown=${e => this.touchKey(e,'right',true)} @mouseup=${e => this.touchKey(e,'right',false)}>${rightKeyArrow}</button>
	`;
    default: 
      return html``;
    }
  }

  advancedRender() {
    if (isOff(this.displayAdvanced))
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
	</div>
	<div>
	  <label>Envelope: 
	    <select .value=${this.envelope} @change=${this.selectEnvelope}>
	      ${templateOptions(KeyerJs.envelopes, this.envelope)}
	    </select>
	  </label>
	</div>`;
  }

  inputKeysRender() {
    return isOff(this.displayInputKeys) ?  html`` : [
      html`
	<div>
	  <label>Input keyer:
	    <select .value=${this.inputKeyer} @change=${this.selectInputKeyer}>
	      <option>none</option>
	      <option>straight</option>
	      <option>iambic</option>
	    </select>
	  </label>
	</div>`,
      this.inputKeyer === 'none' ? html`` : html`
	<div>
	  <label>Key sources:
	    ${templateAlternates(inputSources, this.inputSource, (e,s) => this.selectSource(e,s))}
	  </label>
	</div>`,
      ! (this.inputKeyer !== 'none' && this.inputSource.includes('midi')) ? html`` : html`
	<div>
	  <label>Midi interface: 
            <select .value=${this.inputMidi} @change=${this.selectInputMidi}>
	      ${templateOptions(this.inputMidiNames, this.inputMidi)}
	    </select>
	  </label>
	</div>`,
      ! (this.inputKeyer === 'straight' && this.inputSource.includes('keyboard')) ? html`` : html`
	<div>
	  <label>Straight key:
            <select .value=${this.straightKey} @change=${this.selectStraightKey}>
	      ${shiftKeyOptions(this.straightKey)}
	    </select>
	  </label>
        </div>`,
      ! (this.inputKeyer === 'straight' && this.inputSource.includes('midi')) ? html`` : html`
	<div>
	  <label>Straight midi:
            <select .value=${this.straightMidi} @change=${this.selectStraightMidi}>
	      ${templateOptions(this.inputMidiNotes,this.straightMidi)}
	    </select>
	  </label>
        </div>`,
      this.inputKeyer !== 'iambic' ? html`` : html`
	<div>
	  <label>Swap paddles: 
            <button role="switch" aria-checked=${isOn(this.swapped)} @click=${this.toggleSwapped}>
	      <span>${this.swapped}</span>
	    </button>
	  </label>
	</div>`,
      ! (this.inputKeyer === 'iambic' && this.inputSource.includes('keyboard')) ? html`` : html`
	<!-- input keyer settings, iambic, keyboard selection -->
	<div>
	  <label>Left paddle key:
            <select .value=${this.leftPaddleKey} @change=${this.selectLeftPaddleKey}>
	      ${shiftKeyOptions(this.leftPaddleKey)}
	    </select>
	  </label>
	</div>
	<div>
	  <label>Right paddle key:
            <select .value=${this.rightPaddleKey} @change=${this.selectRightPaddleKey}>
	      ${shiftKeyOptions(this.rightPaddleKey)}
	    </select>
	  </label>
	</div>
      </div>`,
      ! (this.inputKeyer === 'iambic' && this.inputSource.includes('midi')) ? html`` : html`
	<!-- input keyer settings, iambic, midi selection -->
	<div>
	  <label>Left paddle midi:
            <select .value=${this.leftPaddleMidi} @change=${this.selectLeftPaddleMidi}>
	      ${templateOptions(this.inputMidiNotes,this.leftPaddleMidi)}
	    </select>
	  </label>
	</div>
	<div>
	  <label>Right paddle midi:
            <select .value=${this.rightPaddleMidi} @change=${this.selectRightPaddleMidi}>
	      ${templateOptions(this.inputMidiNotes,this.rightPaddleMidi)}
	    </select>
	  </label>
	</div>
      </div>`
    ];
  }

  settingsRender() {
    return isOff(this.displaySettings) ? html`` : html`
      <div>
	<!-- basic keyboard output settings -->
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
	<!-- input keyer selection --->
	<h3 @click=${this.toggleInputKeys}>
	  ${isOff(this.displayInputKeys) ? hiddenMenuIndicator : shownMenuIndicator} Input Keys
	</h3>
	${this.inputKeysRender()}
	<!-- advanced keyboard output settings -->
	<h3 @click=${this.toggleAdvanced}>
	  ${isOff(this.displayAdvanced) ? hiddenMenuIndicator : shownMenuIndicator} Advanced
	</h3>
	${this.advancedRender()}
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
	  <div class="keyboard" contenteditable @input=${this.divInput} @beforeinput=${this.divBeforeInput} @keydown=${this.keydown} @keyup=${this.keyup}>
	    <span class="sent" contenteditable="false"></span><span class="pending"></span>
	  </div>
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
