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
import { KeyerEvent } from './KeyerEvent.js';

export class KeyerScope extends KeyerEvent {

  constructor(context) {
    super(context);
    this.enabled = false;	// we are not displayed on screen
    this.sampling = false;	// we are not capturing samples
    this.redraw = false;	// we do not require a redraw
    this.running = false;	// we do not start running
    this.analyser = this.context.createAnalyser();
    this.size = 2**15;
    this.analyser.fftSize = this.size;
    this.holdSteps = {
      '100ms': 0.1, '200ms': 0.2, '500ms': 0.5,
      '1s': 1, '2s': 2, '5s': 5,
      '10s': 10, '20s': 20, '50s': 50
    };
    this.timeSteps = {
      '1µs/div': 1e-6, '2µs/div': 2e-6, '5µs/div': 5e-6,
      '10µs/div': 1e-5, '20µs/div': 2e-5, '50µs/div': 5e-5,
      '100µs/div': 1e-4, '200µs/div': 2e-4, '500µs/div': 5e-4,
      '1ms/div': 1e-3, '2ms/div': 2e-3, '5ms/div': 5e-3,
      '10ms/div': 1e-2, '20ms/div': 2e-2, '50ms/div': 5e-2,
      '100ms/div': 1e-1, '200ms/div': 2e-1, '500ms/div': 5e-1,
      '1s/div': 1e+0, '2s/div': 2e+0, '5s/div': 5e+0
    };
    this.verticalSteps = {
      '1µFS/div': 1e-6, '2µFS/div': 2e-6, '5µFS/div': 5e-6,
      '10µFS/div': 1e-5, '20µFS/div': 2e-5, '50µFS/div': 5e-5,
      '100µFS/div': 1e-4, '200µFS/div': 2e-4, '500µFS/div': 5e-4,
      '1mFS/div': 1e-3, '2mFS/div': 2e-3, '5mFS/div': 5e-3,
      '10mFS/div': 1e-2, '20mFS/div': 2e-2, '50mFS/div': 5e-2,
      '100mFS/div': 1e-1, '200mFS/div': 2e-1, '500mFS/div': 5e-1,
      '1FS/div': 1e+0, '2FS/div': 2e+0, '5FS/div': 5e+0
    };
    this.holdTime = '1s';
    this.timeOffset = 0;
    this.timeScale = '10ms/div';
    this.verticalScale = '200mFS/div';
    this.length = 1;		// 1 * 2**15 samples/capture
    this.lengths = [ 1, 2, 3 ];
    this.draw();
  }
  
  set running(v) { this._running = v; if (this.running) this.capture(); }

  get running() { return this._running; }
  
  // length determines the number of 32k sample buffers captured
  set length(v) {
    this._length = v;
    this.samples = [];
    for (let i = 0; i < v; i += 1) this.samples.push(new Float32Array(this.size));
  }
  
  get length() { return this._length; }

  get holdTimes() { return Array.from(Object.keys(this.holdSteps)); }

  set holdTime(v) {
    this._holdTime = v;
    this.holdStep = this.holdSteps[v];
  }

  get holdTime() { return this._holdTime; }
  
  // time scale determines the number of samples per pixel
  get timeScales() { return Array.from(Object.keys(this.timeSteps)); }

  set timeScale(v) {
    this._timeScale = v;
    this.timeStep = this.timeSteps[v];
    // console.log(`set timeScale(${v}) => ${this.timeStep}`);
    this.redraw = true;
  }

  get timeScale() { return this._timeScale; }
		 
  // vertical scale 
  get verticalScales() { return Array.from(Object.keys(this.verticalSteps)); }

  set verticalScale(v) { 
    this._verticalScale = v;
    this.verticalStep = this.verticalSteps[v];
    this.redraw = true;
  }
  
  get verticalScale() { return this._verticalScale; }
  
  // time offset
  set timeOffset(v) { this._timeOffset = v; this.redraw = true; }

  get timeOffset() { return this._timeOffset; }
  
  // enable called when displayed?
  enable(v, canvas) { 
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
  
  // The capture steps are reasonable for the audio timer,
  // but the draw step may spoil timing for other audio events.
  // may want some other way to trigger a redraw
  capture() { 
    console.log(`capture ${this.length} segments`);
    this.sampling = true;
    const dt = this.size/this.sampleRate;
    const t = this.currentTime;
    // console.log(`capture ${dt} sec per segment`);
    for (let i = 0; i < this.length; i += 1)
      this.when(t+i*dt, () => {
	// console.log(`capture segment ${i}`);
	this.analyser.getFloatTimeDomainData(this.samples[i]);
	if (i === this.length-1) {
	  this.sampling = false;
	  this.redraw = true;
	}
      });
  }

  draw() {
    // console.log(`draw enabled = '${this.enabled}' sampling = '${this.sampling}', redraw = '${this.redraw}', canvas = '${this.canvas}'`);

    window.requestAnimationFrame((step) => this.draw(step));

    if ( ! this.enabled ) return;
    if ( this.sampling ) return;
    if ( ! this.redraw ) return;

    this.redraw = false;

    // get the size of the canvas in pixels, 
    // which has been hacked to be the size
    // the canvas occupies on the screen
    const {width, height} = this.canvas;

    // ts converts sampleOffset to pixels to effect the time/division setting.
    // we have sampleRate samp/sec, and 50px/div, and x sec/div,
    // then (50px/div) / ((x sec/div) * (sampleRate samp/sec)) yields
    // 50 / (x * sampleRate) = px/sample
    const ts = 50 / (this.timeStep * this.sampleRate);

    // let the units of the samples volts, so they range from 1V to -1V,
    // we compute (1-sample) to flip positive and negative,
    // to get 1/div we multiply by 50, 
    // to get 0.5/div we multiply by 100,
    // so vs = 50/(v/div)
    const vs = 50 / this.verticalStep;

    // compute the sample width of the canvas window
    const sWidth = Math.floor(width / ts);

    // number of samples buffered
    const ktotal = this.length*this.size;

    // first sample to draw
    // the offset percentage applies to the midpoint of the window
    // it's possible that the whole capture buffer is displayed at offset 0
    const k0 = Math.max(0, Math.floor((ktotal - sWidth) * this.timeOffset/100)); // offset in samples

    // first buffer of samples to touch
    const i0 = Math.floor(k0 / this.size)

    // first sample in first buffer to touch
    const j0 = Math.floor(k0 % this.size)
    
    // end of samples to draw
    const kmax = Math.min(ktotal, k0 + sWidth);

    // compute the x and y coordinates
    const x = (k) => (k-k0) * ts;
    const y = (s) => height/2 - s * vs;

    this.canvasCtx.clearRect(0, 0, width, height);
    this.canvasCtx.lineWidth = 1;
    this.canvasCtx.strokeStyle = "rgb(0, 0, 0)";
    this.canvasCtx.beginPath();
    let i = i0;
    let j = j0;
    let k = k0;
    let nd = 0;
    if (i < this.length) {
      const s = this.samples[i];
      this.canvasCtx.moveTo(x(k), y(s[j]));
      for ( ; j < this.size && k < kmax; j += 1, k += 1, nd += 1)
	this.canvasCtx.lineTo(x(k), y(s[j]));
    }
    for (i += 1; i < this.length && k < kmax; i += 1) {
      const s = this.samples[i];
      for (j = 0; j < this.size && k < kmax; j += 1, k += 1, nd += 1)
	this.canvasCtx.lineTo(x(k), y(s[j]));
    }
    this.canvasCtx.stroke();

    // console.log(`draw completed ${nd} points in ${(this.currentTime-t0).toFixed(3)} seconds`);
    if (this.running)
      this.after(this.holdStep, () => { if (this.running) this.capture(); });
  }
}
