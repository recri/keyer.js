import { LitElement, html, css } from 'lit-element';
import { keyerLogo } from './keyer-logo.js';
import { Keyer } from './Keyer.js';

export class RecriKeyer extends LitElement {
  // default property values
  static defaults = {
    pitch: 700,
    gain: -26,
    rise: 4,
    fall: 4,
    speed: 20,
    midi: 'none',
    swapped: false,
    type: 'iambic',

    itemsPerSession: 5,
    repsPerItem: 5,

    running: false,
    text: [],
  };

  // declare LitElement properties
  static get properties() {
    return {
      title: { type: String },
      page: { type: String },
      pitch: { type: Number },
      gain: { type: Number },
      speed: { type: Number },
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
    this.keyer.pitch = v;
  }

  get pitch() {
    return this.keyer.pitch;
  }

  set gain(v) {
    this.keyer.gain = v;
  }

  get gain() {
    return Math.round(this.keyer.gain);
  }

  set speed(v) {
    this.keyer.speed = v;
  }

  get speed() {
    return this.keyer.speed;
  }

  set rise(v) {
    this.keyer.rise = v;
  }

  get rise() {
    return this.keyer.rise;
  }

  set fall(v) {
    this.keyer.fall = v;
  }

  get fall() {
    return this.keyer.fall;
  }

  set swapped(v) {
    this.keyer.swapped = v;
  }

  get swapped() {
    return this.keyer.swapped;
  }

  set type(v) {
    this.keyer.type = v;
  }

  get type() {
    return this.keyer.type;
  }

  set midi(v) {
    this.keyer.midi = v;
  }

  get midi() {
    return this.keyer.midi;
  }

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
        margin-top: 36px;
        animation: app-logo-spin infinite 20s linear;
      }

      @keyframes app-logo-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
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
    this.keyer = new Keyer(RecriKeyer.defaults);
    this.text = [['sent', '']];
    this.running = this.keyer.context.state !== 'suspended';
  }

  static isshift(key) {
    return key === 'Control' || key === 'Alt' || key === 'Shift';
  }

  keydown(e) {
    // console.log(`keydown e.target.tagName ${e.target.tagName}`);
    if (RecriKeyer.isshift(e.key)) this.keyer.keydown(e);
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

  clear() {
    // console.log("clear clicked");
    this.text = [['sent', '']];
  }

  cancel() {
    // console.log("cancel clicked");
    this.keyer.outputCancel();
  }

  inputChange(handle, control, event) {
    // console.log(`update '${handle}' '${control}' ${event.target.value}`);
    switch (control) {
      case 'pitch':
        this.pitch = event.target.value;
        break;
      case 'gain':
        this.gain = event.target.value;
        break;
      case 'rise':
        this.rise = event.target.value;
        break;
      case 'fall':
        this.fall = event.target.value;
        break;
      case 'speed':
        this.speed = event.target.value;
        break;
      case 'swapped':
        this.swapped = event.target.value;
        break;
      case 'midi':
        this.midi = event.target.value;
        break;
      case 'type':
        this.type = event.target.value;
        break;
      default:
        console.log(`update '${handle}' '${control}' ${event.target.value}`);
        break;
    }
  }

  render() {
    return html`
      <main>
        <div class="logo">${keyerLogo}</div>
	<div>
	<h1>keyer.js</h1>
        <button role="switch" aria-checked=${this.running} @click=${
      this.playPause
    }>
	  <span>${this.running ? 'Pause' : 'Play'}</span>
        </button>
        <button @click=${this.clear}>
	  <span>Clear</span>
        </button>
        <button @click=${this.cancel}>
	  <span>Cancel</span>
        </button>
	<div>
	<div class="keyboard" tabindex="0" @keypress=${this.keypress} @keydown=${
      this.keydown
    }  @keyup=${this.keyup}>
	  ${this.text.map(t => html`<span class="${t[0]}">${t[1]}</span>`)}
	</div>
	<h2>Settings</h2>
	<div>
	  <input type="range" id="speed" name="speed" min="12.5" max="50" .value=${
      RecriKeyer.defaults.wpm
    } step="2.5"
		@change=${function (e) {
      this.inputChange('change', 'speed', e);
    }}
		@input=${function (e) {
      this.inputChange('input', 'speed', e);
    }}
	  >
	  <label for="speed">Speed ${this.speed} (WPM)</label>
	</div>
	<div>
	  <input type="range" id="gain" name="gain" min="-50" max="10" .value=${
      RecriKeyer.defaults.gain
    } step="1"
		@change=${function (e) {
      this.inputChange('change', 'gain', e);
    }}
		@input=${function (e) {
      this.inputChange('input', 'gain', e);
    }}
	  >
	  <label for="gain">Gain ${this.gain} (dB)</label>
	</div>
	<div>
	  <input type="range" id="pitch" name="pitch" min="250" max="2000" .value=${
      RecriKeyer.defaults.pitch
    } step="1"
		@change=${function (e) {
      this.inputChange('change', 'pitch', e);
    }}
		@input=${function (e) {
      this.inputChange('input', 'pitch', e);
    }}
	  >
	  <label for="pitch">Pitch ${this.pitch} (Hz)</label>
	</div>
	<div>
	  <input type="range" id="rise" name="rise" min="1" max="10" .value=${
      RecriKeyer.defaults.rise
    } step="0.1"
		@change=${function (e) {
      this.inputChange('change', 'rise', e);
    }}
		@input=${function (e) {
      this.inputChange('input', 'rise', e);
    }}
	  >
	  <label for="rise">Rise ${this.rise} (ms)</label>
	</div>
	<div>
	  <input type="range" id="fall" name="fall" min="1" max="10" .value=${
      RecriKeyer.defaults.fall
    } step="0.1"
		@change=${function (e) {
      this.inputChange('change', 'fall', e);
    }}
		@input=${function (e) {
      this.inputChange('input', 'fall', e);
    }}
	  >
	  <label for="fall">Fall ${this.fall} (ms)</label>
	</div>
	<h2>Status</h2>
	Sample rate: ${this.keyer.context.sampleRate};<br/>
	Current time: ${this.keyer.context.currentTime};<br/>
	Base latency: ${this.keyer.context.baseLatency};<br/>
      </main>

      <p class="app-footer">
        🚽 Made with love by
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/open-wc"
          >open-wc</a
        >.
      </p>
    `;
  }
}
// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
