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
    this._analyser = this.scope.context.createAnalyser();
    this.enabled = false;	// channel is prepared for capture
    this.source = source;	// source name, subject to change
    this.verticalScale = scale;
    this.verticalOffset = offset;
    this.color = color;
    this.size = size;		// sample buffer size
    this._samples = this.createSamples();
  }

  createSamples() {
    if ( ! this.source || this.source.asByte) {
      this.sample = (i) => (this._samples[i]/128) - 1;
      this.capture = () => this.analyser.getByteTimeDomainData(this._samples)
      return this._samples instanceof Uint8Array && this._samples.length === this._size ?
	this._samples : new Uint8Array(this._size) ;
    }
    this.sample = (i) => this._samples[i]
    this.capture = () => this.analyser.getFloatTimeDomainData(this._samples);
    return this._samples instanceof Float32Array && this._samples.length === this._size ? 
      this._samples : new Float32Array(this._size) ;
  }

  set source(v) {
    if (this.sourceValue && this.sourceValue.node) this.sourceValue.node.disconnect(this.analyser);
    this._source = v;
    if (this.sourceValue && this.sourceValue.node) this.sourceValue.node.connect(this.analyser);
    this._samples = this.createSamples();
  }

  get source() { return this._source; }

  get sourceValue() { return this.scope.source[this._source]; }
  
  set verticalScale(v) { this._verticalScale = v; this.scope.redraw = true; }

  get verticalScale() { return this._verticalScale; }

  get verticalScaleValue() { return this.scope._verticalScales[this._verticalScale]; }
  
  set verticalOffset(v) { this._verticalOffset = v; this.scope.redraw = true; }

  get verticalOffset() { return this._verticalOffset; }

  get verticalOffsetValue() { return this.scope._verticalOffsets[this._verticalOffset]; }
  
  set color(v) { this._color = v; this.scope.redraw = true; }

  get color() { return this._color; }
  
  set enabled(v) { 
    if ( ! v) {
      this._enabled = v;
    } else if (this.source === 'none') {
      this._enabled = false;
    } else {
      this._enabled = v;
    }
  }

  get enabled() { return this._enabled; }

  set size(v) { 
    this._analyser.fftSize = v;
    this._samples = this.createSamples();
  }

  get size() { return this._analyser.fftSize; }
  
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
