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
import type { HTMLTemplateResult } from 'lit';
import { property, customElement } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';

import { keyerLogo } from './keyer-logo.js';
import { Keyer } from './Keyer.js';

//
// prefix global constant functions and data
//

interface Map {
  [key: string]: any | undefined;
}

// const straightKeyArrow = '\u23f7';
// const leftKeyArrow = '\u23f4';
// const rightKeyArrow = '\u23f5';

// const shownSymbol = '\u23f7';
// const hiddenSymbol = '\u23f5';

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
/* eslint-disable prefer-regex-literals */
const morseRegExp = new RegExp('^[A-Za-z0-9.,?/*+!@$&()-=+"\':; ]$');
/* eslint-enable prefer-regex-literals */

const isMorse = (c: string) => morseRegExp.test(c);

//
// property database
// stores lit-element properties() values as .lit
// stores default values as .value
//
const controls: Map = {
  running: {
    type: 'toggle',
    lit: { type: Boolean },
    label: '',
    on: pauseSymbol,
    off: playSymbol,
    title: 'Run or pause the web audio rendering engine.',
  },
  speed: {
    type: 'spinner',
    lit: { type: Number },
    value: 20,
    label: 'Speed',
    min: 10,
    max: 150,
    step: 1,
    unit: 'WPM',
    size: 4,
    title: 'The speed of the characters in words/minute (WPM).',
  },
  farnsworth: 'speed',
  gain: {
    type: 'spinner',
    lit: { type: Number },
    value: -26,
    label: 'Gain',
    min: -50,
    max: 10,
    step: 1,
    unit: 'dB',
    size: 4,
    title: 'The volume relative to full scale.',
  },
  pitch: {
    type: 'spinner',
    lit: { type: Number },
    value: 700,
    label: 'Pitch',
    min: 250,
    max: 2000,
    step: 1,
    unit: 'Hz',
    size: 4,
    title: 'The frequency of the keying tone.',
  },
  weight: {
    type: 'spinner',
    lit: { type: Number },
    value: 50,
    label: 'Weight',
    min: 25,
    max: 75,
    step: 0.1,
    unit: '%',
    size: 4,
    title: 'The relative weight of marks and spaces.',
  },
  ratio: {
    type: 'spinner',
    lit: { type: Number },
    value: 50,
    label: 'Ratio',
    min: 25,
    max: 75,
    step: 0.1,
    unit: '%',
    size: 4,
    title: 'The relative length of dits and dahs.',
  },
  compensation: {
    type: 'spinner',
    lit: { type: Number },
    value: 0,
    label: 'Compensation',
    min: -15,
    max: 15,
    step: 0.1,
    unit: '%',
    size: 5,
    title: 'A final fudge factor on element timing.',
  },
  rise: {
    type: 'spinner',
    lit: { type: Number },
    value: 4,
    label: 'Rise',
    min: 1,
    max: 10,
    step: 0.1,
    unit: 'ms',
    size: 3,
    title: 'The rise time of keyed elements.',
  },
  fall: {
    type: 'spinner',
    lit: { type: Number },
    value: 4,
    label: 'Fall',
    min: 1,
    max: 10,
    step: 0.1,
    unit: 'ms',
    size: 3,
    title: 'The fall time of the keyed signal.',
  },
  envelope: {
    type: 'options',
    lit: { type: String },
    value: 'hann',
    label: '',
    options: 'envelopes',
    title: 'The first window function for the keying envelope.',
  },
  envelope2: {
    type: 'options',
    lit: { type: String },
    value: 'rectangular',
    label: '',
    options: 'envelopes',
    title: 'The second window function for the keying envelope.',
  },
  shape: {
    label: 'Envelope',
    type: 'envelope',
    envelope1: 'envelope',
    envelope2: 'envelope2',
    title: 'The keying envelope is the product of two window functions.',
  },
  paddleKeyer: {
    type: 'options',
    lit: { type: String },
    value: 'nd7pa-b',
    label: 'Keyer',
    options: 'paddleKeyers',
    title: 'The keyer that translates paddle events into key events.',
  },
  paddleSwapped: {
    type: 'toggle',
    lit: { type: Boolean },
    value: false,
    label: 'Swapped',
    on: 'true',
    off: 'false',
    title: 'Should the paddles be swapped.',
  },
  straightKey: {
    type: 'options',
    lit: { type: String },
    value: 'ControlLeft',
    label: 'Straight',
    options: 'shiftKeys',
    title: 'Keyboard shift key that activates the straight key.',
  },
  leftPaddleKey: {
    type: 'options',
    lit: { type: String },
    value: 'AltRight',
    label: 'Left',
    options: 'shiftKeys',
    title: 'Keyboard shift key that activates the left paddle.',
  },
  rightPaddleKey: {
    type: 'options',
    lit: { type: String },
    value: 'ControlRight',
    label: 'Right',
    options: 'shiftKeys',
    title: 'Keyboard shift key that activates the right paddle.',
  },
  straightMidi: {
    type: 'options',
    lit: { type: String },
    value: 'None',
    label: 'Straight',
    options: 'midiNotes',
    title: 'MIDI note that activates the straight key.',
  },
  leftPaddleMidi: {
    type: 'options',
    lit: { type: String },
    value: 'None',
    label: 'Left',
    options: 'midiNotes',
    title: 'MIDI note that activates the left paddle.',
  },
  rightPaddleMidi: {
    type: 'options',
    lit: { type: String },
    value: 'None',
    label: 'Right',
    options: 'midiNotes',
    title: 'MIDI note that activates the right paddle.',
  },

  inputSpeed: 'speed',
  inputFarnsworth: 'speed',
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
    label: '',
    type: 'envelope',
    envelope1: 'inputEnvelope',
    envelope2: 'inputEnvelope2',
    title: 'The keying envelope is the product of two window functions.',
  },
  requestedSampleRate: {
    type: 'options',
    lit: { type: Number },
    value: '48000',
    label: 'Requested sample rate',
    options: 'sampleRates',
    title: 'Request web audio to run at a specific sample rate.',
  },
  scopeRunning: {
    type: 'toggle',
    lit: { type: Boolean },
    value: false,
    label: '',
    on: 'Stop',
    off: 'Run',
    title: 'Whether the scope is capturing and displaying samples.',
  },
  scopeTrigger: {
    type: 'options',
    lit: { type: String },
    value: 'none',
    label: 'Trigger',
    options: 'scopeTriggers',
    title: 'Whether the scope is looking for a trigger transition.',
  },
  scopeTriggerChannel: {
    type: 'options',
    lit: { type: String },
    value: 'none',
    label: 'Channel',
    options: 'scopeChannels',
    title: 'The channel the scope examines for the trigger.',
  },
  scopeHold: {
    type: 'options',
    lit: { type: String },
    value: '1s',
    label: 'Hold',
    options: 'scopeHolds',
    title: 'The hold off time after a trigger.',
  },
  scopeTimeScale: {
    type: 'options',
    lit: { type: String },
    value: '10ms/div',
    label: 'Time',
    options: 'scopeTimeScales',
    title: 'The amount of time represented on the scope horizontal scale.',
  },
  scopeSource1: {
    type: 'options',
    lit: { type: String },
    value: 'none',
    label: 'Source',
    options: 'scopeSources',
    title: 'The source of the signal on this channel',
  },
  scopeVerticalScale1: {
    type: 'options',
    lit: { type: String },
    value: '200mFS/div',
    label: 'Scale',
    options: 'scopeVerticalScales',
    title: 'The vertical scale on this channel.',
  },
  scopeVerticalOffset1: {
    type: 'spinner',
    lit: { type: Number },
    value: 0,
    label: 'Offset',
    min: -4,
    max: 4,
    step: 0.1,
    unit: 'div',
    size: 4,
    title: 'The vertical offset on this channel.',
  },
  scopeSource2: 'scopeSource1',
  scopeVerticalScale2: 'scopeVerticalScale1',
  scopeVerticalOffset2: 'scopeVerticalOffset1',
  scopeSource3: 'scopeSource1',
  scopeVerticalScale3: 'scopeVerticalScale1',
  scopeVerticalOffset3: 'scopeVerticalOffset1',
  scopeSource4: 'scopeSource1',
  scopeVerticalScale4: 'scopeVerticalScale1',
  scopeVerticalOffset4: 'scopeVerticalOffset1',

  // read only context values
  state: { lit: { type: String } },
  sampleRate: { lit: { type: Number } },
  currentTime: { lit: { type: Number } },
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

@customElement('keyer-js')
export class KeyerJs extends LitElement {
  // miscellany
  _running: boolean = false;

  keyer: Keyer | null = null;

  keyboardFocused: boolean = false;

  static startSections = ['start', 'about', 'license', 'colophon'];

  static startSelected = ['start', 'about'];

  static runSections = [
    'entry',
    'touchButtons',
    'keyboardSettings',
    'advancedKeyboardSettings',
    'manualSettings',
    'advancedManualSettings',
    'miscSettings',
    'scope',
    'status',
    'controls',
    'locals',
    'about',
    'license',
    'colophon',
  ];

  static runSelected = ['entry', 'keyboardSettings'];

  @property({ type: Array }) sections: string[] = KeyerJs.startSections;

  @property({ type: Array }) selected: string[] = KeyerJs.startSelected;

  // top level state
  @property({ type: Boolean })
  get running() {
    return this._running;
  }

  set running(v) {
    // console.log(`set running = ${v}, running is ${this.running}`);
    const oldValue = this._running;
    if (v !== this._running) {
      this._running = v;
      if (v) {
        // console.log(`calling resume`);
        this.keyer!.context.resume();
        // this cures need to twiddle the gain to get iambic keying to work
        // I wish I understood why
        // this.gain += 1;
        // this.gain -= 1;
      } else {
        this.keyer!.context.suspend();
      }
      this.requestUpdate('running', oldValue);
    }
    // console.log(`set running = ${v}, running is now ${this.running} and state is ${this.keyer!.context.state}`);
  }

  // principal keyer controls
  @property({ type: Number })
  set speed(v) {
    if (this.keyer) this.keyer!.output.speed = v;
  }

  get speed() {
    return this.keyer
      ? this.keyer!.output.speed
      : KeyerJs.getControl('speed').value;
  }

  @property({ type: Number })
  set gain(v) {
    if (this.keyer) {
      this.keyer!.output.gain = v;
      // console.log(`setting gain to ${v}`);
      // console.trace();
    }
  }

  get gain() {
    return this.keyer
      ? this.keyer!.output.gain
      : KeyerJs.getControl('gain').value;
  }

  @property({ type: Number })
  set pitch(v) {
    if (this.keyer) this.keyer!.output.pitch = v;
  }

  get pitch() {
    return this.keyer
      ? this.keyer!.output.pitch
      : KeyerJs.getControl('pitch').value;
  }

  @property({ type: Number })
  set farnsworth(v) {
    if (this.keyer) this.keyer!.output.farnsworth = v;
  }

  get farnsworth() {
    return this.keyer
      ? this.keyer!.output.farnsworth
      : KeyerJs.getControl('farnsworth').value;
  }

  @property({ type: Number })
  set weight(v) {
    if (this.keyer) this.keyer!.output.weight = v;
  }

  get weight() {
    return this.keyer
      ? this.keyer!.output.weight
      : KeyerJs.getControl('weight').value;
  }

  @property({ type: Number })
  set ratio(v) {
    if (this.keyer) this.keyer!.output.ratio = v;
  }

  get ratio() {
    return this.keyer
      ? this.keyer!.output.ratio
      : KeyerJs.getControl('ratio').value;
  }

  @property({ type: Number })
  set compensation(v) {
    if (this.keyer) this.keyer!.output.compensation = v;
  }

  get compensation() {
    return this.keyer
      ? this.keyer!.output.compensation
      : KeyerJs.getControl('compensation').value;
  }

  @property({ type: Number })
  set rise(v) {
    if (this.keyer) this.keyer!.output.rise = v;
  }

  get rise() {
    return this.keyer
      ? this.keyer!.output.rise
      : KeyerJs.getControl('rise').value;
  }

  @property({ type: Number })
  set fall(v) {
    if (this.keyer) this.keyer!.output.fall = v;
  }

  get fall() {
    return this.keyer
      ? this.keyer!.output.fall
      : KeyerJs.getControl('fall').value;
  }

  @property({ type: String })
  set envelope(v) {
    if (this.keyer) this.keyer!.output.envelope = v;
  }

  get envelope() {
    return this.keyer
      ? this.keyer!.output.envelope
      : KeyerJs.getControl('envelope').value;
  }

  @property({ type: String })
  set envelope2(v) {
    if (this.keyer) this.keyer!.output.envelope2 = v;
  }

  get envelope2() {
    return this.keyer
      ? this.keyer!.output.envelope2
      : KeyerJs.getControl('envelope2').value;
  }

  // iambic keyer
  @property({ type: Array })
  get paddleKeyers() {
    return this.keyer ? this.keyer!.input.keyers : [];
  }

  @property({ type: String })
  set paddleKeyer(v) {
    if (this.keyer) this.keyer!.input.keyer = v;
  }

  get paddleKeyer() {
    return this.keyer
      ? this.keyer!.input.keyer
      : KeyerJs.getControl('paddleKeyer').value;
  }

  @property({ type: Boolean })
  set paddleSwapped(v) {
    if (this.keyer) this.keyer!.input.swapped = v;
  }

  get paddleSwapped() {
    return this.keyer
      ? this.keyer!.input.swapped
      : KeyerJs.getControl('paddleSwapped').value;
  }

  @property({ type: String })
  set straightKey(v) {
    if (this.keyer) this.keyer!.input.straightKey = v;
  }

  get straightKey() {
    return this.keyer
      ? this.keyer!.input.straightKey
      : KeyerJs.getControl('straightKey').value;
  }

  @property({ type: String })
  set leftPaddleKey(v) {
    if (this.keyer) this.keyer!.input.leftPaddleKey = v;
  }

  get leftPaddleKey() {
    return this.keyer
      ? this.keyer!.input.leftPaddleKey
      : KeyerJs.getControl('leftPaddleKey').value;
  }

  @property({ type: String })
  set rightPaddleKey(v) {
    if (this.keyer) this.keyer!.input.rightPaddleKey = v;
  }

  get rightPaddleKey() {
    return this.keyer
      ? this.keyer!.input.rightPaddleKey
      : KeyerJs.getControl('rightPaddleKey').value;
  }

  @property({ type: String })
  set straightMidi(v) {
    if (this.keyer) this.keyer!.input.straightMidi = v;
  }

  get straightMidi() {
    return this.keyer
      ? this.keyer!.input.straightMidi
      : KeyerJs.getControl('straightMidi').value;
  }

  @property({ type: String })
  set leftPaddleMidi(v) {
    if (this.keyer) this.keyer!.input.leftPaddleMidi = v;
  }

  get leftPaddleMidi() {
    return this.keyer
      ? this.keyer!.input.leftPaddleMidi
      : KeyerJs.getControl('leftPaddleMidi').value;
  }

  @property({ type: String })
  set rightPaddleMidi(v) {
    if (this.keyer) this.keyer!.input.rightPaddleMidi = v;
  }

  get rightPaddleMidi() {
    return this.keyer
      ? this.keyer!.input.rightPaddleMidi
      : KeyerJs.getControl('rightPaddleMidi').value;
  }

  // input keyer minimum properties
  @property({ type: Number })
  set inputSpeed(v) {
    if (this.keyer) this.keyer!.input.speed = v;
  }

  get inputSpeed() {
    return this.keyer
      ? this.keyer!.input.speed
      : KeyerJs.getControl('inputSpeed').value;
  }

  @property({ type: Number })
  set inputGain(v) {
    if (this.keyer) {
      this.keyer!.input.gain = v;
      // console.log(`setting inputGain to ${v}`);
    }
  }

  get inputGain() {
    return this.keyer
      ? Math.round(this.keyer!.input.gain)
      : KeyerJs.getControl('inputGain').value;
  }

  @property({ type: Number })
  set inputPitch(v) {
    if (this.keyer) this.keyer!.input.pitch = v;
  }

  get inputPitch() {
    return this.keyer
      ? this.keyer!.input.pitch
      : KeyerJs.getControl('inputPitch').value;
  }

  @property({ type: Number })
  set inputFarnsworth(v) {
    if (this.keyer) this.keyer!.input.farnsworth = v;
  }

  get inputFarnsworth() {
    return this.keyer
      ? this.keyer!.input.farnsworth
      : KeyerJs.getControl('inputFarnsworth').value;
  }

  @property({ type: Number })
  set inputWeight(v) {
    if (this.keyer) this.keyer!.input.weight = v;
  }

  get inputWeight() {
    return this.keyer
      ? this.keyer!.input.weight
      : KeyerJs.getControl('inputWeight').value;
  }

  @property({ type: Number })
  set inputRatio(v) {
    if (this.keyer) this.keyer!.input.ratio = v;
  }

  get inputRatio() {
    return this.keyer
      ? this.keyer!.input.ratio
      : KeyerJs.getControl('inputRatio').value;
  }

  @property({ type: Number })
  set inputCompensation(v) {
    if (this.keyer) this.keyer!.input.compensation = v;
  }

  get inputCompensation() {
    return this.keyer
      ? this.keyer!.input.compensation
      : KeyerJs.getControl('inputCompensation').value;
  }

  @property({ type: Number })
  set inputRise(v) {
    if (this.keyer) this.keyer!.input.rise = v;
  }

  get inputRise() {
    return this.keyer
      ? this.keyer!.input.rise
      : KeyerJs.getControl('inputRise').value;
  }

  @property({ type: Number })
  set inputFall(v) {
    if (this.keyer) this.keyer!.input.fall = v;
  }

  get inputFall() {
    return this.keyer
      ? this.keyer!.input.fall
      : KeyerJs.getControl('inputFall').value;
  }

  @property({ type: Array })
  get envelopes() {
    return this.keyer ? this.keyer!.output.envelopes : [];
  }

  @property({ type: String })
  set inputEnvelope(v) {
    if (this.keyer) this.keyer!.input.envelope = v;
  }

  get inputEnvelope() {
    return this.keyer
      ? this.keyer!.input.envelope
      : KeyerJs.getControl('inputEnvelope').value;
  }

  @property({ type: String })
  set inputEnvelope2(v) {
    if (this.keyer) this.keyer!.input.envelope2 = v;
  }

  get inputEnvelope2() {
    return this.keyer
      ? this.keyer!.input.envelope2
      : KeyerJs.getControl('inputEnvelope2').value;
  }

  // miscellany
  @property({ type: Number }) requestedSampleRate = '48000';

  // scope
  @property({ type: Boolean })
  set scopeRunning(v) {
    if (this.keyer) this.keyer!.scope.running = v;
  }

  get scopeRunning() {
    return this.keyer ? this.keyer!.scope.running : false;
  }

  @property({ type: Array })
  get scopeTriggers() {
    return this.keyer ? this.keyer!.scope.triggers : [];
  }

  @property({ type: String })
  set scopeTrigger(v) {
    if (this.keyer) this.keyer!.scope.trigger = v;
  }

  get scopeTrigger() {
    return this.keyer
      ? this.keyer!.scope.trigger
      : KeyerJs.getControl('scopeTrigger').value;
  }

  @property({ type: String })
  set scopeTriggerChannel(v) {
    if (this.keyer) this.keyer!.scope.triggerChannel = v;
  }

  get scopeTriggerChannel() {
    return this.keyer
      ? this.keyer!.scope.triggerChannel
      : KeyerJs.getControl('scopeTriggerChannel').value;
  }

  @property({ type: Array })
  get scopeChannels() {
    return this.keyer ? this.keyer!.scope.channels : [];
  }

  @property({ type: String })
  set scopeHold(v) {
    if (this.keyer) this.keyer!.scope.hold = v;
  }

  get scopeHold() {
    return this.keyer
      ? this.keyer!.scope.hold
      : KeyerJs.getControl('scopeHold').value;
  }

  @property({ type: Array })
  get scopeHolds() {
    return this.keyer ? this.keyer!.scope.holds : [];
  }

  @property({ type: String })
  set scopeTimeScale(v) {
    if (this.keyer) this.keyer!.scope.timeScale = v;
  }

  get scopeTimeScale() {
    return this.keyer
      ? this.keyer!.scope.timeScale
      : KeyerJs.getControl('scopeTimeScale').value;
  }

  @property({ type: Array })
  get scopeTimeScales() {
    return this.keyer ? this.keyer!.scope.timeScales : [];
  }

  // scope channel properties
  @property({ type: Array })
  get scopeSources() {
    return this.keyer ? this.keyer!.scope.sources : [];
  }

  @property({ type: String })
  set scopeSource1(v) {
    if (this.keyer) this.keyer!.scope.channel(1).source = v;
  }

  get scopeSource1() {
    return this.keyer
      ? this.keyer!.scope.channel(1).source
      : KeyerJs.getControl('scopeSource1').value;
  }

  @property({ type: String })
  set scopeVerticalScale1(v) {
    if (this.keyer) this.keyer!.scope.channel(1).verticalScale = v;
  }

  get scopeVerticalScale1() {
    return this.keyer
      ? this.keyer!.scope.channel(1).verticalScale
      : KeyerJs.getControl('scopeVerticalScale1').value;
  }

  @property({ type: Number })
  set scopeVerticalOffset1(v) {
    if (this.keyer) this.keyer!.scope.channel(1).verticalOffset = v;
  }

  get scopeVerticalOffset1() {
    return this.keyer
      ? this.keyer!.scope.channel(1).verticalOffset
      : KeyerJs.getControl('scopeVerticalOffset1').value;
  }

  @property({ type: String })
  set scopeSource2(v) {
    if (this.keyer) this.keyer!.scope.channel(2).source = v;
  }

  get scopeSource2() {
    return this.keyer
      ? this.keyer!.scope.channel(2).source
      : KeyerJs.getControl('scopeSource2').value;
  }

  @property({ type: String })
  set scopeVerticalScale2(v) {
    if (this.keyer) this.keyer!.scope.channel(2).verticalScale = v;
  }

  get scopeVerticalScale2() {
    return this.keyer
      ? this.keyer!.scope.channel(2).verticalScale
      : KeyerJs.getControl('scopeVerticalScale2').value;
  }

  @property({ type: Number })
  set scopeVerticalOffset2(v) {
    if (this.keyer) this.keyer!.scope.channel(2).verticalOffset = v;
  }

  get scopeVerticalOffset2() {
    return this.keyer
      ? this.keyer!.scope.channel(2).verticalOffset
      : KeyerJs.getControl('scopeVerticalOffset2').value;
  }

  @property({ type: String })
  set scopeSource3(v) {
    if (this.keyer) this.keyer!.scope.channel(3).source = v;
  }

  get scopeSource3() {
    return this.keyer
      ? this.keyer!.scope.channel(3).source
      : KeyerJs.getControl('scopeSource3').value;
  }

  @property({ type: String })
  set scopeVerticalScale3(v) {
    if (this.keyer) this.keyer!.scope.channel(3).verticalScale = v;
  }

  get scopeVerticalScale3() {
    return this.keyer
      ? this.keyer!.scope.channel(3).verticalScale
      : KeyerJs.getControl('scopeVerticalScale3').value;
  }

  @property({ type: Number })
  set scopeVerticalOffset3(v) {
    if (this.keyer) this.keyer!.scope.channel(3).verticalOffset = v;
  }

  get scopeVerticalOffset3() {
    return this.keyer
      ? this.keyer!.scope.channel(3).verticalOffset
      : KeyerJs.getControl('scopeVerticalOffset3').value;
  }

  @property({ type: String })
  set scopeSource4(v) {
    if (this.keyer) this.keyer!.scope.channel(4).source = v;
  }

  get scopeSource4() {
    return this.keyer
      ? this.keyer!.scope.channel(4).source
      : KeyerJs.getControl('scopeSource4').value;
  }

  @property({ type: String })
  set scopeVerticalScale4(v) {
    if (this.keyer) this.keyer!.scope.channel(4).verticalScale = v;
  }

  get scopeVerticalScale4() {
    return this.keyer
      ? this.keyer!.scope.channel(4).verticalScale
      : KeyerJs.getControl('scopeVerticalScale4').value;
  }

  @property({ type: Number })
  set scopeVerticalOffset4(v) {
    if (this.keyer) this.keyer!.scope.channel(4).verticalOffset = v;
  }

  get scopeVerticalOffset4() {
    return this.keyer
      ? this.keyer!.scope.channel(4).verticalOffset
      : KeyerJs.getControl('scopeVerticalOffset4').value;
  }

  // read only keyer.context values
  @property({ type: String })
  get state() {
    return this.keyer ? this.keyer!.context.state : '';
  }

  @property({ type: Number })
  get sampleRate() {
    return this.keyer ? this.keyer!.sampleRate : 0;
  }

  @property({ type: Number })
  get currentTime() {
    return this.keyer ? this.keyer!.currentTime : 0;
  }

  @property({ type: Number })
  get baseLatency() {
    return this.keyer ? this.keyer!.baseLatency : 0;
  }

  // read only midi flag
  @property({ type: Boolean }) midiAvailable: boolean = false;

  // read only values supplying options lists
  // most are constant, midiNotes changes

  // shift keys which can be used as key simulators
  // in truth, if I ignored repeats, then any key would work
  @property({ type: Array }) shiftKeys = [
    'None',
    'ShiftLeft',
    'ControlLeft',
    'AltLeft',
    'AltRight',
    'ControlRight',
    'ShiftRight',
  ];

  @property({ type: Array }) midiNotes = [];

  @property({ type: Array }) sampleRates = [
    '8000',
    '32000',
    '44100',
    '48000',
    '96000',
    '192000',
    '384000',
  ];

  @property({ type: Array })
  get scopeVerticalScales() {
    return this.keyer ? this.keyer!.scope.verticalScales : [];
  }

  // tty window content
  @property({ type: Object }) content: HTMLTemplateResult = html``;

  @property({ type: Array }) finished: any[] = [];

  @property({ type: Array }) pending: string[] = [];

  // declare the controls of the ui
  static get controls() {
    return controls;
  }

  // extract LitElement properties from controls
  //    static get properties() {
  //	if ( ! KeyerJs._properties) {
  //	    KeyerJs._properties = {};
  //	    Object.keys(KeyerJs.controls)
  //		.filter(x => 'lit' in KeyerJs.getControl(x))
  //		.forEach(x => { KeyerJs._properties[x] = KeyerJs.getControl(x).lit });
  //	}
  //	return KeyerJs._properties;
  //    }

  // get the control object for a control
  // implement single string value indicates
  // indirect to the control named by the string
  static getControl(control: string) {
    const c = KeyerJs.controls[control];
    if (c && typeof c === 'string') return KeyerJs.controls[c];
    return c;
  }

  // property getters and setters
  // keyer properties for manual keyer
  // manual keyer properties
  // scope properties

  setScopeChannel(control: string, channel: number, value: number | string) {
    if (this.keyer) this.keyer!.scope.channel(channel)[control] = value;
  }

  getScopeChannel(control: string, channel: number) {
    return this.keyer ? this.keyer!.scope.channel(channel)[control] : 0;
  }

  constructor() {
    super();
    this._running = false;
    this.keyer = null;
    // only initialize the properties neede for startup
    this.sections = KeyerJs.startSections;
    this.selected = KeyerJs.startSelected;
  }

  async start() {
    // start the engine

    // retrieve the preferred sample rate
    this.controlSetDefaultValue('requestedSampleRate', false);

    // create the audio context
    const context = new AudioContext({
      sampleRate: parseInt(this.requestedSampleRate, 10),
    });

    // load the worklet processors
    await context.audioWorklet.addModule('src/KeyerASKProcessor.js');
    await context.audioWorklet.addModule('src/KeyerPaddleNoneProcessor.js');
    await context.audioWorklet.addModule('src/KeyerPaddleNd7paProcessor.js');
    await context.audioWorklet.addModule('src/KeyerPaddleVk6phProcessor.js');

    // build the keyer
    this.keyer = new Keyer(context);

    // set the section lists
    this.sections = KeyerJs.runSections;
    this.selected = KeyerJs.runSelected;

    // load some constants into the instance

    // using localStorage to persist defaults between sessions
    // defaults set at top of file
    this.controlSetDefaultValues(false);

    this.running = true;

    this.clear();

    // this.keyer!.outputDecoder.on('letter', (ltr, code) => console.log(`output '${ltr}' '${code}'`));
    this.keyer!.inputDecoder.on('letter', (ltr: string) => this.onkeyed(ltr));
    this.keyer!.output.on('sent', (ltr: string) => this.onsent(ltr));
    this.keyer!.output.on('unsent', (ltr: string) => this.onunsent(ltr));
    this.keyer!.output.on('skipped', (ltr: string) => this.onskipped(ltr));

    this.keyer!.midiSource.on('midi:notes', () =>
      this.requestUpdate('midiNotes', []),
    );

    document.addEventListener('keydown', (e: Event) =>
      this.keyer!.input.keyboardKey(e, true),
    );
    document.addEventListener('keyup', (e: Event) =>
      this.keyer!.input.keyboardKey(e, false),
    );
  }

  //
  // teletype window
  //
  onFocus() {
    // console.log("keyboard focus");
    this.keyboardFocused = true;
    this.updateContent(); // show cursor
  }

  onBlur() {
    // console.log("keyboard blur");
    this.keyboardFocused = false;
    this.updateContent(); // hide cursor
  }

  updated(/* propertiesChanged */) {
    if (this.keyboardFocused) {
      // scroll the div up if the cursor goes off bottom of div
      const keyboard = this.renderRoot.querySelector(
        '.keyboard',
      ) as HTMLElement;
      const cursor = this.renderRoot.querySelector('.blinker') as HTMLElement;
      const fromBottom =
        cursor!.offsetTop +
        cursor.offsetHeight -
        keyboard.offsetTop -
        keyboard.offsetHeight;
      if (fromBottom > 0) keyboard!.scrollTop += cursor!.offsetHeight;
    }
    if (this.keyer && this.keyer!.scope && !this.keyer!.scope.enabled) {
      if (this.selected.includes('scope')) {
        const canvas = this.renderRoot.querySelector('canvas');
        if (canvas) this.keyer!.scope.enable(true, canvas);
      } else {
        this.keyer!.scope.enable(false, null);
      }
    }
  }

  processFinished() {
    return this.finished.map(tagText => {
      const [tag, text] = tagText;
      return html`<span class="${tag}">${text}</span>`;
    });
  }

  blinkenCursen() {
    return this.keyboardFocused
      ? html`<span class="blinker">|</span>`
      : html`<span class="blinker"></span>`;
  }

  updateContent() {
    this.content = html`${this.processFinished()}<span class="pending"
        >${this.pending.join('')}</span
      >${this.blinkenCursen()}`;
  }

  appendFinished(tag: string, text: string) {
    if (this.finished.length === 0) this.finished.push([tag, text]);
    else {
      const [ltag, ltext] = this.finished[this.finished.length - 1];
      if (tag === ltag)
        this.finished[this.finished.length - 1] = [tag, `${ltext}${text}`];
      else this.finished.push([tag, text]);
    }
  }

  // this is for input keyed manually as opposed to typed on the keyboard
  // it has the same presentation as sent by default
  onkeyed(ltr: string) {
    this.appendFinished('sent', ltr.toLowerCase());
    this.updateContent();
  }

  ttyKeydown(e: KeyboardEvent) {
    // may need to handle ctrl-V for paste
    // may need to preventDefault on Space to avoid autoscroll
    // may need to catch Escape as cancel key
    // console.log(`ttyKeydown '${e.key}'`);
    if (e.isComposing || e.altKey || e.metaKey || e.ctrlKey) {
      // log.textContent = `keydown code ${e.code} key ${e.key} CAMS ${e.ctrlKey} ${e.altKey} ${e.metaKey} ${e.shiftKey}`;
    } else if (isMorse(e.key)) {
      this.pending.push(e.key);
      this.keyer!.output.send(e.key);
      this.updateContent();
      if (e.key === ' ') e.preventDefault();
    } else if (e.key === 'Backspace') {
      this.keyer!.output.unsend(); // e.data
      // this.pending.pop(); the pop happens when the unsent confirmation comes back
      this.updateContent();
    } else if (e.key === 'Enter') {
      this.pending.push('\n');
      this.keyer!.output.send('\n');
      this.updateContent();
    } else if (e.key === 'Escape') {
      this.cancel();
    }
  }

  clear() {
    this.finished = [['sent', '']];
    this.pending = [];
    this.updateContent();
  }

  cancel() {
    this.keyer!.output.cancel();
    this.keyer!.output.cancelPending();
    this.updateContent();
  }

  onsent(ltr: string) {
    const chr = this.pending.shift();
    if (ltr !== chr) {
      console.log(`onsent ${ltr} not first in pending ${chr}`);
    }
    this.appendFinished('sent', ltr);
    this.updateContent();
  }

  onunsent(ltr: string) {
    const chr = this.pending.pop();
    if (ltr !== chr) {
      console.log(`onunsent ${ltr} not last in pending ${chr}`);
    }
    this.updateContent();
  }

  onskipped(ltr: string) {
    const chr = this.pending.shift();
    if (chr) {
      if (ltr !== chr) {
        console.log(`onskipped ${ltr} not first in pending ${chr}`);
      }
      this.appendFinished('skipped', chr);
      this.updateContent();
    }
  }

  // control manipulation
  controlSetDefaultValue(control: string, forceDefault: boolean) {
    const JSONparse = (value: string) => {
      try {
        return JSON.parse(value);
      } catch (e) {
        return undefined;
      }
    };
    const controlDefault = (defaultValue: any) => {
      const localValue = JSONparse(localStorage[control]);
      const value =
        forceDefault || alwaysForceDefault || localValue === undefined
          ? defaultValue
          : localValue;
      localStorage[control] = JSON.stringify(value);
      return value;
    };
    if ('value' in KeyerJs.getControl(control)) {
      (this as Map)[control] = controlDefault(
        KeyerJs.getControl(control).value,
      );
    }
  }

  controlSetDefaultValues(forceDefault: boolean) {
    Object.keys(KeyerJs.controls).forEach(control =>
      this.controlSetDefaultValue(control, forceDefault),
    );
  }

  controlUpdate(
    control: string,
    oldv: number | string | boolean,
    newv: number | string | boolean,
  ) {
    (this as Map)[control] = newv;
    const c = KeyerJs.getControl(control);
    if ('value' in c) localStorage[control] = JSON.stringify(newv);
    if ('lit' in c) this.requestUpdate(control, oldv);
    if (control === 'requestedSampleRate') this.start();
  }

  controlToggle(control: string) {
    this.controlUpdate(
      control,
      (this as Map)[control],
      !(this as Map)[control],
    );
  }

  controlSelect(control: string, e: Event) {
    this.controlUpdate(
      control,
      (this as Map)[control],
      (e.target as any).value,
    );
  }

  scopeResize() {
    if (this.selected.includes('scope')) {
      this.keyer!.scope.enable(false, null);
      const canvas = this.renderRoot.querySelector('canvas');
      if (canvas) this.keyer!.scope.enable(true, canvas);
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
      .h1 {
        font-size: 2em;
        margin: 0.33em 0;
      }
      .h2 {
        font-size: 1.5em;
        margin: 0.38em 0;
      }
      .h3 {
        font-size: 1.17em;
        margin: 0.42em 0;
      }
      .h5 {
        font-size: 0.83em;
        margin: 0.75em 0;
      }
      .h6 {
        font-size: 0.75em;
        margin: 0.84em 0;
      }
      .h1,
      .h2,
      .h3,
      .h4,
      .h5,
      .h6 {
        font-weight: bolder;
        width: 60%;
        text-align: left;
      }
      .logo > svg {
        margin-left: 5%;
        max-width: 90%;
        margin-top: 16px;
      }
      main {
        flex-grow: 1;
        width: 90%;
        margin: auto;
        display: flex;
        flex-flow: column;
      }
      div.hidden,
      div.group.hidden {
        display: none;
      }
      div.shown {
        display: block;
      }
      div.app-bar,
      div.selector,
      div.section,
      div.app-footer {
        width: 90%;
        margin: auto;
      }
      button,
      select,
      input {
        font-size: calc(10px + 2vmin);
      }
      input[type='number'][size='5'] {
        width: 3.25em;
      }
      input[type='number'][size='4'] {
        width: 2.5em;
      }
      input[type='number'][size='3'] {
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
        color: #2e3d48;
        -webkit-animation: 1s blink step-end infinite;
        animation: 1s blink step-end infinite;
      }

      @-webkit-keyframes "blink" {
        from,
        to {
          color: transparent;
        }
        50% {
          color: black;
        }
      }

      @keyframes "blink" {
        from,
        to {
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
        background-image: linear-gradient(to right, grey 1px, transparent 1px),
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

  // render a user interface control element
  controlRender(control: string): HTMLTemplateResult {
    const ctl = KeyerJs.getControl(control);
    if (!ctl) return html`<h1>No controlRender for ${control}</h1>`;
    switch (ctl.type) {
      // slider adjusts a number between a min and a max by step
      case 'slider': {
        const { min, max, step, label, unit, title } = ctl;
        return html` <div
          class="group slider"
          title="${title}"
          style="display: flex; flex-flow: column;"
        >
          <div class="slider-header">${label}</div>
          <div class="slider-main">
            <sl-input
              type="range"
              name="${control}"
              min="${min}"
              max="${max}"
              step="${step}"
              .value=${(this as Map)[control]}
              @sl-input=${(e: Event) => this.controlSelect(control, e)}
            ></sl-input>
          </div>
          <div class="slider-unit">${unit}</div>
        </div>`;
      }

      // spinner adjusts a number between a min and a max by step
      case 'spinner': {
        const { min, max, step, label, unit, title } = ctl; // , size
        return html` <div
          class="group spinner"
          title="${title}"
          style="display: flex; flex-flow: column;"
        >
          <div class="slider-header">${label}</div>
          <div class="slider-main">
            <sl-input
              type="number"
              name="${control}"
              min="${min}"
              max="${max}"
              step="${step}"
              .value=${(this as Map)[control]}
              @sl-input=${(e: Event) => this.controlSelect(control, e)}
            ></sl-input>
          </div>
          <div class="slider-unit">(${unit})</div>
        </div>`;
      }
      // options displays a list of options for selection
      case 'options': {
        const { options, label, title } = ctl;
        return html`
          <div class="group options" title="${title}">
            <div>
              <label for="${control}"
                >${label}
                <select
                  name="${control}"
                  value="${(this as Map)[control]}"
                  @change=${(e: Event) => this.controlSelect(control, e)}
                >
                  ${(this as Map)[options].map(
                    (x: string) =>
                      html`<option
                        .value=${x}
                        ?selected=${x === (this as Map)[control]}
                      >
                        ${x}
                      </option>`,
                  )}
                </select>
              </label>
            </div>
          </div>
        `;
      }
      // a toggle button shows one of two labels
      case 'toggle': {
        const { label, on, off, title } = ctl;
        return html`
          <div class="group" title="${title}">
            <label for="${control}"
              >${label}
              <button
                name="${control}"
                role="switch"
                aria-checked=${(this as Map)[control]}
                @click=${() => this.controlToggle(control)}
              >
                ${(this as Map)[control] ? on : off}
              </button></label
            >
          </div>
        `;
      }
      // an envelope shows two lists of envelope functions
      case 'envelope': {
        const { label, envelope1, envelope2, title } = ctl;
        return html`
          <div class="group" title="${title}">
            <label
              >${label}: ${this.controlRender(envelope1)} *
              ${this.controlRender(envelope2)}
            </label>
          </div>
        `;
      }
      // a check button shows a label with a filled or unfilled checkbox
      case 'check': {
        const { label, title } = ctl;
        return html`
          <div class="group" title="${title}">
            <button
              role="switch"
              aria-checked=${(this as Map)[control]}
              @click=${() => this.controlToggle(control)}
            >
              ${(this as Map)[control] ? checkedCheckBox : uncheckedCheckBox}
              ${label}
            </button>
          </div>
        `;
      }
      default:
        return html`<h1>
          No controlRender for ${control} with type ${ctl.type}
        </h1>`;
    }
  }

  onSelectInput(e: Event) {
    const { value } = e.target as Map;
    // console.log(`onSelectInput choose '${value}'`);
    this.selected = value;
  }

  isShown(control: string) {
    return this.selected.includes(control) ? 'shown' : 'hidden';
  }

  section(control: string) {
    return `section ${control} ${this.isShown(control)}`;
  }

  // use the mouse translations, so they also work with mice
  mouseDown(e: MouseEvent) {
    console.log(`mouseDown ${(e.target as Map).name} in ${this}`);
  }

  mouseUp(e: MouseEvent) {
    console.log(`mouseUp ${(e.target as Map).name} in ${this}`);
  }

  render() {
    const { selected } = this;
    return html`
      <div class="app-bar" style="display: flex; flexflow: row nowrap;">
        <div class="logo">${keyerLogo}</div>
        <div><h1>keyer.js</h1></div>
      </div>

      <main>
        <hr />
        <div class="selector">
          <sl-select
            name="section"
            title="Select the component(s) of the keyer to control."
            .value=${selected}
            @sl-input=${this.onSelectInput}
            multiple
          >
            ${this.sections.map(
              section =>
                html` <sl-option value="${section}"> ${section} </sl-option>`,
            )}
          </sl-select>
        </div>
        <div
          class="${this.section('start')}"
          title="Browsers shouldn't start audio without an user gesture."
        >
          <hr />
          <button class="start" @click=${this.start}>
            <span>${playSymbol}</span>
          </button>
          <br />
          <h2>Press play to start the keyer.</h2>
          <p></p>
        </div>
        <div
          class="${this.section('entry')}"
          title="Keyboard entry area for typing characters to send."
        >
          <hr />
          <div
            class="subsection keyboard"
            tabindex="0"
            @keydown=${this.ttyKeydown}
            @focus=${this.onFocus}
            @blur=${this.onBlur}
          >
            ${this.content}
          </div>
          <div
            class="subsection panel"
            title="Controls for the keyboard entry area."
          >
            ${this.controlRender('running')}
            <button @click=${this.clear}><span>Clear</span></button>
            <button @click=${this.cancel}><span>Cancel</span></button>
          </div>
        </div>
        <div
          class="${this.section('touchButtons')}"
          title="Touch panel buttons keying characters to send."
        >
          <hr />
          <div style="display: flex; flex-flow: row nowrap;">
            ${['KEY', 'DIT', 'DAH'].map(
              label =>
                html`<sl-button
                  name="${label}"
                  pill
                  size="large"
                  @mousedown=${this.mouseDown}
                  @mouseup=${this.mouseUp}
                  @touchstart=${this.mouseDown}
                  @touchend=${this.mouseUp}
                >
                  ${label}
                </sl-button>`,
            )}
          </div>
        </div>
        <div
          class="${this.section('keyboardSettings')}"
          title="Basic settings for keyboard keying."
        >
          <hr />
          <div style="display: flex; flex-flow: row nowrap;">
            ${this.controlRender('speed')} ${this.controlRender('gain')}
            ${this.controlRender('pitch')}
          </div>
        </div>
        <div
          class="${this.section('advancedKeyboardSettings')}"
          title="Timing and envelope settings for keyboard keying."
        >
          <hr />
          <div style="display: flex; flex-flow: row nowrap;">
            ${this.controlRender('weight')} ${this.controlRender('ratio')}
            ${this.controlRender('compensation')}
          </div>
          <div style="display: flex; flex-flow: row nowrap;">
            ${this.controlRender('rise')} ${this.controlRender('fall')}
          </div>
          ${this.controlRender('shape')}
        </div>
        <div
          class="${this.section('manualSettings')}"
          title="Basic settings for manually keying"
        >
          <hr />
          <div style="display: flex; flex-flow: row nowrap;">
            ${this.controlRender('inputSpeed')}
            ${this.controlRender('inputGain')}
            ${this.controlRender('inputPitch')}
          </div>
          <div
            class="group paddle-options"
            title="Paddle options."
            style="display: flex; flex-flow: row nowrap;"
          >
            ${this.controlRender('paddleKeyer')}
            ${this.controlRender('paddleSwapped')}
          </div>
          <br />
          <div
            class="group keybd-keys"
            style="display: flex; flex-flow: row nowrap"
            title="Keyboard keys used for manual keying."
          >
            ${this.controlRender('straightKey')}
            ${this.controlRender('leftPaddleKey')}
            ${this.controlRender('rightPaddleKey')}
          </div>
          <br />
          <div
            class="group midi-notes ${this.midiAvailable ? '' : ' hidden'}"
            style="display: flex; flex-flow: row nowrap"
            title="MIDI device notes used for manual keying."
          >
            ${this.controlRender('straightMidi')}
            ${this.controlRender('leftPaddleMidi')}
            ${this.controlRender('rightPaddleMidi')}
          </div>
          <br />
        </div>
        <div
          class="${this.section('advancedManualSettings')}"
          title="Additional settings for manual keying."
        >
          <hr />
          <div style="display: flex; flex-flow: row nowrap;">
            ${this.controlRender('inputWeight')}
            ${this.controlRender('inputRatio')}
            ${this.controlRender('inputCompensation')}
          </div>
          <div style="display: flex; flex-flow: row nowrap;">
            ${this.controlRender('inputRise')}
            ${this.controlRender('inputFall')}
          </div>
          ${this.controlRender('inputShape')}
        </div>
        <div class="${this.section('miscSettings')}" title="Other settings.">
          <hr />
          ${this.controlRender('requestedSampleRate')}
          <br />
          <label
            >Reset default values:
            <button @click=${() => this.controlSetDefaultValues(true)}>
              Reset
            </button>
          </label>
        </div>
        <div
          class="${this.section('scope')}"
          title="An oscilloscope for observing keyer.js."
        >
          <hr />
          <div class="scope"><canvas @resize=${this.scopeResize}></canvas></div>
          ${this.controlRender('scopeRunning')}
          ${this.controlRender('scopeTrigger')}
          ${this.controlRender('scopeTriggerChannel')}
          ${this.controlRender('scopeHold')}
          <br />
          ${this.controlRender('scopeTimeScale')}
          <br />
          <b>ch1</b>
          ${this.controlRender('scopeSource1')}
          ${this.controlRender('scopeVerticalScale1')}
          ${this.controlRender('scopeVerticalOffset1')}
          <br />
          <b>ch2</b>
          ${this.controlRender('scopeSource2')}
          ${this.controlRender('scopeVerticalScale2')}
          ${this.controlRender('scopeVerticalOffset2')}
          <br />
          <b>ch3</b>
          ${this.controlRender('scopeSource3')}
          ${this.controlRender('scopeVerticalScale3')}
          ${this.controlRender('scopeVerticalOffset3')}
          <br />
          <b>ch4</b>
          ${this.controlRender('scopeSource4')}
          ${this.controlRender('scopeVerticalScale4')}
          ${this.controlRender('scopeVerticalOffset4')}
        </div>

        <div
          class="${this.section('status')}"
          title="Status information about the operation of web audio."
        >
          State: ${this.state}<br />
          Sample rate: ${this.sampleRate}<br />
          Current time: ${this.currentTime.toFixed(3)}<br />
          Base latency: ${this.baseLatency.toFixed(3)}<br />
          Midi available: ${this.midiAvailable}<br />
        </div>
        <hr />
        <div
          class="${this.section('controls')}"
          title="The names and default values of controls."
        >
          ${Object.keys(KeyerJs.controls).map(
            control =>
              html`<div>
                ${control} - ${KeyerJs.getControl(control).value}
              </div>`,
          )}
        </div>
        <hr />
        <div
          class="${this.section('locals')}"
          title="The names and locally stored values of controls."
        >
          ${Object.keys(KeyerJs.controls).map(
            control => html`<div>${control} - ${localStorage[control]}</div>`,
          )}
        </div>
        <hr />
        <div
          class="${this.section('about')}"
          title="What keyer.js does and how it works."
        >
          <p>
            <b>Keyer.js</b> implements a morse code keyer in a web page. The
            text window translates typed text into morse code which plays on the
            browser's audio output. Keyboard keys and MIDI notes can be
            interpreted as switch closures for directly keying morse. Directly
            keyed input is played on the browser's audio output and decoded into
            the text window.
          </p>
          <p>
            The <b>Settings</b> panel controls the generated morse code and
            other aspects of the prog.
          </p>
          <p>
            The <b>Status</b> panel shows the status of the web audio, the time
            since the system started, the sample rate, the estimated latency,
            and whether MIDI is available.
          </p>
          <p>
            The <b>Scope</b> panel allows the wave forms of the keyer to be
            displayed.
          </p>
          <p>This <b>About</b> panel gives a brief introduction to the app.</p>
          <p>The <b>License</b> panel describes the licenscing of the app.</p>
        </div>
        <hr />
        <div
          class="${this.section('license')}"
          title="You have the right to use and modify this software."
        >
          <p>keyer.js - a progressive web app for morse code</p>
          <p>
            Copyright (c) 2020 Roger E Critchlow Jr, Charlestown, MA, USA<br />
            Copyright (c) 2024 Roger E Critchlow Jr, Las Cruces, NM, USA
          </p>
          <p>
            This program is free software: you can redistribute it and/or modify
            it under the terms of the GNU General Public License as published by
            the Free Software Foundation, either version 3 of the License, or
            (at your option) any later version.
          </p>
          <p>
            This program is distributed in the hope that it will be useful, but
            WITHOUT ANY WARRANTY; without even the implied warranty of
            MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
            General Public License for more details.
          </p>
          <p>
            You should have received a copy of the GNU General Public License
            along with this program. If not, see
            <a href="https://www.gnu.org/licenses/">gnu.org/licenses</a>.
          </p>
        </div>
        <hr />
        <div
          class="${this.section('colophon')}"
          title="How Keyer.js was built."
        >
          <p>keyer.js was written with emacs on a laptop running Ubuntu.</p>
          <p>
            The algorithms in keyer.js were developed for
            <a href="https://github.com/recri/keyer">keyer</a>, a collection of
            software defined radio software built using Jack, Tcl, and C.
          </p>
          <p>
            The polymer project, the PWA starter kit, open-wc, lit-element,
            lit-html, web audio, web MIDI.
          </p>
          <p>
            The source for
            <a href="https://github.com/recri/keyer.js">keyer.js</a>
          </p>
        </div>
        <hr />
      </main>
      <div class="app-footer">
        🚽 Made with thanks to
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/open-wc"
          >open-wc</a
        >.
      </div>
    `;
  }
}

// Local Variables:
// mode: JavaScript
// js-indent-level: 2
// End:
