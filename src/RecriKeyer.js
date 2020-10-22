import { LitElement, html, css } from 'lit-element';
import { keyerLogo } from './keyer-logo.js';
import { Keyer } from './Keyer.js';

export class RecriKeyer extends LitElement {
  static defaults = {

    inputPitch: 622.25 /* Eb5 */,
    inputGain: -26,
    inputRise: 4,
    inputFall: 4,

    inputWpm: 15,
    inputDah: 3,
    inputIes: 1,
    inputIls: 3,
    inputIws: 7,

    inputMidi: 'none',
    inputSwapped: false,
    inputType: 'iambic',

    outputPitch: 523.25 /* C5 */,
    outputGain: -26,
    outputRise: 4,
    outputFall: 4,

    outputWpm: 15,
    outputDah: 3,
    outputIes: 1,
    outputIls: 3,
    outputIws: 7,

    itemsPerSession: 5,
    repsPerItem: 5,
  }
  
  constructor() {
    super();
    this.keyer = new Keyer(RecriKeyer.defaults);
  }

  static get properties() {
    return {
      title: { type: String },
      page: { type: String },
      inputPitch: 622.25 /* Eb5 */,
      outputPitch: 523.25 /* C5 */,

      inputGain: { type: Number },
      inputWpm: { type: Number },
      inputRise: { type: Number },
      inputFall: { type: Number },
      inputDah: { type: Number },
      inputIes: { type: Number },
      inputIls: { type: Number },
      inputIws: { type: Number },
      inputMidi: { type: String },
      inputSwapped: { type: Boolean },
      inputType: { type: String },

      outputGain: { type: Number },
      outputWpm: { type: Number },
      outputRise: { type: Number },
      outputFall: { type: Number },
      outputDah: { type: Number },
      outputIes: { type: Number },
      outputIls: { type: Number },
      outputIws: { type: Number },

      itemsPerSession: { type: Number },
      repsPerItem: { type: Number }

    };
  }

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

      .app-footer {
        font-size: calc(12px + 0.5vmin);
        align-items: center;
      }

      .app-footer a {
        margin-left: 5px;
      }
    `;
  }

  render() {
    return html`
      <main>
        <div class="logo">${keyerLogo}</div>
        <h1>keyer.js</h1>

        <p>Edit <code>src/RecriKeyer.js</code> and save to reload.</p>
	<button data-playing="false" role="switch" aria-checked="false" @click={this.playPause}>
	  <span>Play/Pause</span>
	</button>
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

  playPause() {
    console.log("play/pause clicked");
    if (this.keyer.context.state === 'suspended') {
      this.keyer.context.resume();
    }
    this.keyer.enabled = ! this.keyer.enabled;
  }

}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
