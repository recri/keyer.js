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
export class KeyerScopeChannel {

  constructor(scope, source, scale, offset, color, size) {
    this.scope = scope;
    this.analyser = this.scope.context.createAnalyser();
    this.source = source;	// source name, subject to change
    this.verticalScale = scale;
    this.verticalOffset = offset;
    this.color = color;
    this.size = size;		// sample buffer size
    this._samples = this.createSamples();
    this.captured = false;
    // console.log(`scope ${scope}, source ${source}, scale ${scale}, offset ${offset}, color ${color}, size ${size}`);
    // console.log(`this.size ${this.size}`);
  }

  createSamples() {
    if ( ! this.source || this.source.asByte) {
      // console.log(`uint8[]`);
      if ( ! (this._samples instanceof Uint8Array) || this._samples.length !== this.size)
	this._samples = new Uint8Array(this.size);
      this.sample = (i) => ((this._samples[i]/128) - 1);
      this.capture = () => {
	this.t0 = this.scope.currentTime;
	this.analyser.getByteTimeDomainData(this._samples)
	this.t1 = this.scope.currentTime;
	this.captured = true;
      }
    } else {
      // console.log(`float32[]`);
      if (! (this._samples instanceof Float32Array) || this._samples.length !== this.size) 
	this._samples = new Float32Array(this.size);
      this.sample = (i) => this._samples[i]
      this.capture = () => {
	this.t0 = this.scope.currentTime;
	this.analyser.getFloatTimeDomainData(this._samples);
	this.t1 = this.scope.currentTime;
	// do the statistical summary and trigger identification
	let last = this.sample(0);
	this.min = last;
	this.max = last;
	this.pos = -1;
	this.neg = -1;
	this.any = -1;
	for (let i = 1; i < this.size; i += 1) {
	  const s = this.sample(i);
	  this.min = Math.min(s, this.min);
	  this.max = Math.max(s, this.max);
	  if (this.pos === -1 && s > 0 && last <= 0) {
	    this.pos = i;
	    if (this.any === -1) this.any = this.pos;
	  }
	  if (this.neg === -1 && s < 0 && last >= 0) {
	    this.neg = i;
	    if (this.any === -1) this.any = this.neg;
	  }
	  last = s;
	}
      }
    }
    return this._samples;
  }

  set source(v) {
    // console.log(`set source ${v}, when this.source ${this.source} and this.sourceValue ${this.sourceValue}`);
    if (this.sourceValue && this.sourceValue.node) this.sourceValue.node.disconnect(this.analyser);
    this._source = v;
    // console.log(`set source ${v}, now when this.source ${this.source} and this.sourceValue ${this.sourceValue}`);
    if (this.sourceValue && this.sourceValue.node) this.sourceValue.node.connect(this.analyser);
    this._samples = this.createSamples();
    // console.log(this.sourceValue);
  }

  get source() { return this._source; }

  get sourceValue() { return this.scope.source(this._source); }
  
  get enabled() { return this.source !== 'none'; }
  
  set verticalScale(v) { this._verticalScale = v; this.scope.redraw = true; }

  get verticalScale() { return this._verticalScale; }

  get verticalScaleValue() { return this.scope._verticalScales[this._verticalScale]; }
  
  set verticalOffset(v) { this._verticalOffset = v; this.scope.redraw = true; }

  get verticalOffset() { return this._verticalOffset; }

  get verticalOffsetValue() { return this._verticalOffset; }
  
  set color(v) { this._color = v; this.scope.redraw = true; }

  get color() { return this._color; }
  
  set size(v) { 
    this.analyser.fftSize = v;
    this._samples = this.createSamples();
  }

  get size() { return this.analyser.fftSize; }

}
// Loca Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
