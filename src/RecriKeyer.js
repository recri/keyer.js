import { LitElement, html, css } from 'lit-element';
import { keyerLogo } from './keyer-logo.js';
import { Keyer } from './Keyer.js';

const qrqStep = 10;
const qrsStep = 1;
const qrqMax = 150;
const qrsMax = 50;
const qrqMin = 50;
const qrsMin = 10;

export class RecriKeyer extends LitElement {

  // declare LitElement properties
  static get properties() {
    return {
      title: { type: String },
      page: { type: String },
      pitch: { type: Number },
      gain: { type: Number },
      speed: { type: Number },
      qrq: { type: Boolean },
      rise: { type: Number },
      fall: { type: Number },
      midi: { type: String },
      swapped: { type: Boolean },
      type: { type: String },

      itemsPerSession: { type: Number },
      repsPerItem: { type: Number },

      running: { type: Boolean },
      text: { type: Array },
    };
  }

  // set and get properties, delegate to keyer
  set pitch(v) { 
    const o = this.keyer.pitch;
    this.keyer.pitch = v;
    this.requestUpdate('pitch', o);
  }

  get pitch() { return this.keyer.pitch; }

  set gain(v) { 
    const o = this.keyer.gain;
    this.keyer.gain = v;
    this.requestUpdate('gain', o);
  }
  
  get gain() { return Math.round(this.keyer.gain); }

  set speed(v) {
    const o = this.keyer.speed;
    this.keyer.speed = v;
    this.requestUpdate('speed', o);
  }

  get speed() { return this.keyer.speed; }

  set rise(v) {
    const o = this.keyer.rise;
    this.keyer.rise = v;
    this.requestUpdate('rise', o);
  }

  get rise() { return this.keyer.rise; }

  set fall(v) { 
    const o = this.keyer.fall;
    this.keyer.fall = v;
    this.requestUpdate('fall', o);
  }

  get fall() { return this.keyer.fall; }

  set swapped(v) { 
    const o = this.keyer.swapped;
    this.keyer.swapped = v;
    this.requestUpdate('swapped', o);
  }

  get swapped() { return this.keyer.swapped; }

  set type(v) {
    const o = this.keyer.type;
    this.keyer.type = v;
    this.requestUpdate('type', o);
  }

  get type() { return this.keyer.type; }

  set midi(v) {
    const o = this.keyer.midi;
    this.keyer.midi = v;
    this.requestUpdate('midi', o);
  }

  get midi() { return this.keyer.midi; }

  // styles
  static get styles() {
    return css`
      :host {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        font-size: calc(10px + 2vmin);
        color: #1a2b42;
        max-width: 960px;
        margin: 0 auto;
        text-align: center;
      }

      main {
        flex-grow: 1;
      }

      .logo > svg {
        margin-top: 16px;
      }

      div.keyboard {
        display: block;
        width: 100%;
        height: 300px;
        overflow-y: auto;
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

  constructor() {
    super();
    // start the engine
    this.keyer = new Keyer();
    // default property values
    this.pitch = 700;
    this.gain = -26;
    this.rise = 4;
    this.fall = 4;
    this.speed = 20;
    this.qrq = false;
    this.midi = 'none';
    this.swapped = false;
    this.type = 'iambic';
    this.itemsPerSession = 5;
    this.repsPerItem = 5;
    this.running = this.keyer.context.state !== 'suspended';
    this.text = [['sent', '']];
  }

  static isshift(key) {
    return key === 'Control' || key === 'Alt' || key === 'Shift';
  }

  keydown(e) {
    // console.log(`keydown e.target.tagName ${e.target.tagName}`);
    if (RecriKeyer.isshift(e.key)) this.keyer.keydown(e);
    // disable space scrolling of page, but keep space in text entry
    if (e.keyCode === 32) {
      this.keypress(e);
      e.preventDefault();
    }
  }

  keyup(e) {
    if (RecriKeyer.isshift(e.key)) this.keyer.keyup(e);
  }

  keypress(e) {
    // console.log(`keypress e.target.tagName ${e.target.tagName}`);
    this.text = this.text.concat([['pending', e.key]]);
    this.keyer.keypress(e);
  }

  playPause() {
    // console.log("play/pause clicked");
    if (this.keyer.context.state === 'suspended') {
      this.keyer.context.resume();
      this.running = true;
    } else {
      this.keyer.context.suspend();
      this.running = false;
    }
  }

  clear() { this.text = [['sent', '']]; }

  cancel() { 
    this.keyer.outputCancel();
    // clear pending queue
  }

  toggleQrq() {
    this.qrq = ! this.qrq
    if (this.qrq) {
      this.speed = Math.max(qrqMin, qrqStep * Math.floor(this.speed/qrqStep));
    } else {
      this.speed = Math.min(this.speed, qrsMax);
    }
  }

  render() {
    return html`
      <main>
        <div class="logo">${keyerLogo}</div>
	<div>
	<h1>keyer.js</h1>
        <button role="switch" aria-checked=${this.running} @click=${this.playPause}>
	  <span>${this.running ? 'Pause' : 'Play'}</span>
        </button>
        <button @click=${this.clear}>
	  <span>Clear</span>
        </button>
        <button @click=${this.cancel}>
	  <span>Cancel</span>
        </button>
	<div>
	<div class="keyboard" tabindex="0" @keypress=${this.keypress} @keydown=${this.keydown}  @keyup=${this.keyup}>
	  ${this.text.map(t => html`<span class="${t[0]}">${t[1]}</span>`)}
	</div>
	<h2>Settings</h2>
	<div>
	  <input type="range" id="speed" name="speed" min=${this.qrq ? qrqMin : qrsMin} max=${this.qrq ? qrqMax : qrsMax}
		.value=${this.speed} step=${this.qrq ? qrqStep : qrsStep}
		@input=${function(e) { this.speed = e.target.value; }}>
	  <label for="speed">Speed ${this.speed} (WPM)</label>
	  <button role="switch" aria-checked=${this.qrq} @click=${this.toggleQrq}>
	    <span>${this.qrq ? 'QRQ' : 'QRS'}</span>
	  </button>
	</div>
	<div>
	  <input type="range" id="gain" name="gain" min="-50" max="10" 
		.value=${this.gain} step="1"
		@input=${function(e) { this.gain = e.target.value; }}>
	  <label for="gain">Gain ${this.gain} (dB)</label>
	</div>
	<div>
	  <input type="range" id="pitch" name="pitch" min="250" max="2000"
		.value=${this.pitch} step="1"
		@input=${function(e) { this.pitch = e.target.value; }}>
	  <label for="pitch">Pitch ${this.pitch} (Hz)</label>
	</div>
	<div>
	  <input type="range" id="rise" name="rise" min="1" max="10" 
		.value=${this.rise} step="0.1"
		@input=${function(e) { this.rise = e.target.value; }}>
	  <label for="rise">Rise ${this.rise} (ms)</label>
	</div>
	<div>
	  <input type="range" id="fall" name="fall" min="1" max="10"
		.value=${this.fall} step="0.1"
		@input=${function(e) { this.fall = e.target.value; }}>
	  <label for="fall">Fall ${this.fall} (ms)</label>
	</div>
	<h2>Status</h2>
	Sample rate: ${this.keyer.context.sampleRate};<br/>
	Current time: ${this.keyer.context.currentTime};<br/>
	Base latency: ${this.keyer.context.baseLatency};<br/>
      </main>

      <p class="app-footer">
        🚽 Made with love by
        <a target="_blank" rel="noopener noreferrer"
          href="https://github.com/open-wc" >open-wc</a>.
      </p>
    `;
  }
}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
