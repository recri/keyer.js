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

// scope. should be a web component.
// <keyer-scope ...>
//  <keyer-scope-source ...>...</keyer-scope-source>
//  ...
//  <keyer-scope-channel ...>...</keyer-scope-channel>
//  ...
// </keyer-scope>
//
import { KeyerEvent } from './KeyerEvent.js';
import { KeyerScopeSource } from './KeyerScopeSource.js';
import { KeyerScopeChannel } from './KeyerScopeChannel.js';

/* eslint no-nested-ternary: "off" */
export class KeyerScope extends KeyerEvent {

  constructor(context) {
    super(context);
    this.canvas = null;
    this.enabled = false;	// not displayed
    this._running = false;	// not capturing and plotting
    this._sources = {};		// sources available for channels
    this.addSource('none', null, true); // the nil source


    // this is autoscaled according to fill the scope window
    this.sizeMin = 32;
    this.sizeMax = 2**15;
    this._size = 2**11;

    // triggers
    this._triggers = { 'none': 0, '+': 1, '-': -1, '*': 2 };
    this._trigger = '+';
    this._triggerChannel = 1;
    
    // this could be configured usefully
    this.preTrigger = 32;	// samples before trigger value
    
    // hold after capture/trigger
    // needs continuous tuning?
    this._holds = {
      'none': 0,
      '100ms': 0.1, '200ms': 0.2, '500ms': 0.5,
      '1s': 1, '2s': 2, '5s': 5,
      '10s': 10, '20s': 20, '50s': 50
    };
    this._hold = 'none';

    // horizontal scale
    this._timeScales = {
      '1µs/div': 1e-6, '2µs/div': 2e-6, '5µs/div': 5e-6,
      '10µs/div': 1e-5, '20µs/div': 2e-5, '50µs/div': 5e-5,
      '100µs/div': 1e-4, '200µs/div': 2e-4, '500µs/div': 5e-4,
      '1ms/div': 1e-3, '2ms/div': 2e-3, '5ms/div': 5e-3,
      '10ms/div': 1e-2, '20ms/div': 2e-2, '50ms/div': 5e-2,
      '100ms/div': 1e-1, '200ms/div': 2e-1, '500ms/div': 5e-1,
      '1s/div': 1e+0, '2s/div': 2e+0, '5s/div': 5e+0
    };
    this._timeScale = '10ms/div';

    // vertical scale, one per channel
    // should autoscale
    this._verticalScales = {
      '1µFS/div': 1e-6, '2µFS/div': 2e-6, '5µFS/div': 5e-6,
      '10µFS/div': 1e-5, '20µFS/div': 2e-5, '50µFS/div': 5e-5,
      '100µFS/div': 1e-4, '200µFS/div': 2e-4, '500µFS/div': 5e-4,
      '1mFS/div': 1e-3, '2mFS/div': 2e-3, '5mFS/div': 5e-3,
      '10mFS/div': 1e-2, '20mFS/div': 2e-2, '50mFS/div': 5e-2,
      '100mFS/div': 1e-1, '200mFS/div': 2e-1, '500mFS/div': 5e-1,
      '1FS/div': 1e+0, '2FS/div': 2e+0, '5FS/div': 5e+0
    };

    // vertical offset, one per channel
    // <keyer-spinner min="-4" max="4" step="0.1" unit="div" size="4" input=${e => this.channel(1).updateControl(e)}></keyer-spinner>
    this._channels = {};		// channels available for capture
    this._nchannels = 0;
    this.addChannel('none', '500mFS/div', 0, "rgb(0,0,0)");		// channel 1
    this.addChannel('none', '500mFS/div', 0, "rgb(0,0,0)");		// channel 2
    this.addChannel('none', '500mFS/div', 0, "rgb(0,0,0)");		// channel 3
    this.addChannel('none', '500mFS/div', 0, "rgb(0,0,0)");		// channel 4
  }
  
  addSource(name, node, asByte) { this._sources[name] = new KeyerScopeSource(name, node, asByte); }

  addChannel(source, scale, offset, color) { 
    this._nchannels += 1;
    this._channels[this._nchannels] = new KeyerScopeChannel(this, source, scale, offset, color, this.size); 
 }

  // sources for channels
  get sources() { return Array.from(Object.keys(this._sources)); }

  source(i) { return this._sources[i]; }
  
  // channels
  get nchannels() { return this._nchannels; }
  
  get channels() { return Array.from(Object.keys(this._channels)); }
  
  channel(i) { return this._channels[i]; }

  // trigger
  get triggers() { return Array.from(Object.keys(this._triggers)); }

  set trigger(v) { this._trigger = v; }

  get trigger() { return this._trigger; }

  get triggerValue() { return this._triggers[this._trigger]; }
  
  // trigger channel
  set triggerChannel(v) { this._triggerChannel = v; }

  get triggerChannel() { return this._triggerChannel; }

  get triggerChannelValue() { return this.channel(this.triggerChannel); }
  
  // hold off between scans, converted to ms as holdValue.
  get holds() { return Array.from(Object.keys(this._holds)); }

  set hold(v) { this._hold = v; }
  
  get hold() { return this._hold; }
  
  get holdValue() { return this._holds[this._hold] * 1000; }

  // time scale determines the number of samples per pixel
  get timeScales() { return Array.from(Object.keys(this._timeScales)); }

  set timeScale(v) { this._timeScale = v; this.redraw = true; }

  get timeScale() { return this._timeScale; }
		 
  get timeScaleValue() { return this._timeScales[this._timeScale]; }

  // vertical scale 
  get verticalScales() { return Array.from(Object.keys(this._verticalScales)); }

  // size of sample buffers
  set size(v) { 
    if (v >=  this.sizeMin && v <= this.sizeMax) {
      this._size = v;
      this.channels.forEach(i => { this.channel(i).size = this.size; });
      this.redraw = true;
    }
  }

  get size() { return this._size; }
  
  // enable called when displayed?
  enable(v, canvas) { 
    // console.log(`enable ${v} ${canvas}`);
    if (this.enabled !== v) {
      this.enabled = v;
      if (this.canvas !== canvas) {
	this.canvas = canvas;
	if (this.canvas) {
	  this.canvasCtx = canvas.getContext("2d");
	  if (canvas.width !== canvas.clientWidth) {
	    this.canvas.width = canvas.clientWidth;
	    this.redraw = true;
	  }
	  if (canvas.height !== canvas.clientHeight) {
	    this.canvas.height = canvas.clientHeight;
	    this.redraw = true;
	  }
	}
      }
    }
  }
  
  // run/stop behavior
  set running(v) { 
    this._running = v;
    // start the animation loop
    if (v) {
      this.holdOffTime = performance.now();
      this.loop(this.holdOffTime);
    }
  }

  get running() { return this._running; }
  
  findTrigger() {
    const trigger = this.triggerValue;
    const channel = this.triggerChannelValue;
    const triggerSample = 
	  (trigger === 0) ?	// no trigger
	  0 : 
	  ( ! channel) ?	// no trigger channel
	  0 :
	  (trigger === 1) ? 	// positive transition
	  channel.pos :
	  (trigger === -1) ?	// negative transition
	  channel.neg :
	  (trigger === 2) ?	// any transition
	  channel.any :
	  0;
    // console.log(`findTrigger ${triggerSample}`);
    return triggerSample > 0 ? triggerSample : 0;
  }
  
  loop(step) {
    // enabled means displayed on screen
    if (this.enabled) {
      // running means collecting and displaying samples
      // console.log(`run ${this.running} step ${step} holdOff ${this.holdOffTime} redraw ${this.redraw}`)
      const capture = this.running && (step >= this.holdOffTime);
      const redraw = capture || this.redraw;
      
      if (capture) {
	// capture samples
	this.channels.forEach(i => {
	  const channel = this.channel(i);
	  if (channel.enabled)
	    channel.capture();
	});
	// set the delay for the next capture
	this.holdOffTime = step + this.holdValue;
	// console.log(`set holdOffTime to ${this.holdOffTime}, ${this.holdOffTime-step} ms forward`);
      }

      if (redraw) {
	this.redraw = false;
	
	// get the size of the canvas in pixels, 
	// which has been hacked to be the size
	// the canvas occupies on the screen
	const {width, height} = this.canvas;
	// console.log(`width ${width}, height ${height}`);

	// ts converts sampleOffset to pixels to effect the time/division setting.
	// we have sampleRate samp/sec, and 50px/div, and x sec/div,
	// then (50px/div) / ((x sec/div) * (sampleRate samp/sec)) yields
	// 50 / (x * sampleRate) = px/sample
	const ts = 50 / (this.timeScaleValue * this.sampleRate);

	// compute the sample width of the canvas window
	const sWidth = Math.floor(width / ts);

	// number of samples buffered
	const ktotal = this.size;
	// console.log(`ts ${ts}, sWidth ${sWidth}, ktotal ${ktotal}`);

	// first sample to draw
	// either the beginning of the capture buffer
	// or the trigger location in the capture buffer
	const k0 = this.findTrigger();

	// end of samples to draw
	const kmax = Math.min(ktotal, k0 + sWidth);
	// console.log(`kmax = ${kmax}`);
	this.canvasCtx.clearRect(0, 0, width, height);
	this.canvasCtx.lineWidth = 1;
	
	// autoscale and autoposition
	this.channels.forEach(i => {
	  const channel = this.channel(i)
	  if ( ! channel.enabled) return;

	  // let the units of the samples be volts, so they range from 1V to -1V,
	  // we compute (1-sample) to flip positive and negative,
	  // to get 1/div we multiply by 50, 
	  // to get 0.5/div we multiply by 100,
	  // so vs = 50/(v/div)
	  const vs = 50 / channel.verticalScaleValue;
	  
	  // compute the x and y coordinates
	  const x = (k) => (k-k0) * ts;
	  const y = (s) => height/2 - s * vs - channel.verticalOffset * 50;
	  
	  this.canvasCtx.strokeStyle = channel.color;
	  this.canvasCtx.beginPath();
	  this.canvasCtx.moveTo(x(k0), y(channel.sample(k0)));
	  for (let k = k0+1; k < this.size && k < kmax; k += 1) {
	    const xk = x(k);
	    const yk = y(channel.sample(k))
	    this.canvasCtx.lineTo(xk, yk);
	  }
	  this.canvasCtx.stroke();
	  // console.log(`drew ${minx}, ${miny} to ${maxx}, ${maxy}`);
	});
	// auto increase sample size to fill window
	if (ktotal < k0 + sWidth && this.size < this.sizeMax)
	  this.size *= 2;
      }
    }
    // loop on animation frame if running
    if (this.running) requestAnimationFrame((tstep) => this.loop(tstep));
  }
}
