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

// audio shift keying worklet
// build and communicate rise / fall ramps to processor

export class KeyerPaddleWorklet extends AudioWorkletNode {

  constructor(context, name, params, eparent) {
    super(context, name, params);
    this.eparent = eparent;	// event parent
    this.sampleRate = context.sampleRate;
    this.port.onmessage = (e) => this.onmessage(e);
    this.port.onmessageerror = (e) => this.onmessageerror(e);
    this.onprocessorerror = (e) => this.onprocessorerror(e);
    this.eparent.on('change:timing', () => this.changeTiming());
  }

  changeTiming() {
    this.port.postMessage(['timing', 1/this.eparent.sampleRate, 
			   this.eparent.perRawDit, this.eparent.perDit, this.eparent.perDah,
			   this.eparent.perIes, this.eparent.perIls, this.eparent.perIws]);
  }
  
  set mode(v) {
    this._mode = v;
    this.port.postMessage(['mode', v]);
  }

  get mode() { return this._mode; }
  
  onmessage(e) {
    const [message, ...data] = e.data;
    if (message === 'element')
      this.eparent.emit(message, ...data);
    else {
      console.log(`KeyerPaddleWorklet message '${message}, ${data}'`);
      this.message = e;
    }
  }

  onmessageerror(e) {
    console.log(`KeyerPaddleWorklet messageerror '${e.data}'`);
    this.messageError = e;
  }

  onprocessorerror(e) {
    console.log(`KeyerPaddleWorklet processorerror '${e.data}'`);
    this.processorError = e;
  }

}


