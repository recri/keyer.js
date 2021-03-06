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
import { KeyerDetone } from './KeyerDetone.js';

// translate keydown/keyup events to dit dah strings
export class KeyerDetime extends KeyerDetone {
  /*
   ** from observations of on/off events
   ** deduce the CW timing of the morse being received
   ** and start translating the marks and spaces into
   ** dits, dahs, inter-symbol spaces, and inter-word spaces
   */
  constructor(context) {
    super(context);
    this.wpm = 0; /* float words per minute */
    this.word = 50; /* float dits per word */
    this.estimate = 0; /* float estimated dot clock period */
    this.frame = 0; /* float time of last event */
    this.nDit = 1; /* unsigned number of dits estimated */
    this.nDah = 1; /* unsigned number of dahs estimated */
    this.nIes = 1; /* unsigned number of inter-element spaces estimated */
    this.nIls = 1; /* unsigned number of inter-letter spaces estimated */
    this.nIws = 1; /* unsigned number of inter-word spaces estimated */

    this.on('transition', (onoff, time) => this.ontransition(onoff, time));
    this.configure(15, 50); // this is part suggestion (15 wpm) and part routine (50 dits/word is PARIS)
  }

  configure(wpm, word) {
    this.wpm = wpm > 0 ? wpm : 15;
    this.word = word;
    this.estimate = (this.context.sampleRate * 60) / (this.wpm * this.word);
  }

  /*
   ** The basic problem is to infer the dit clock rate from observations of dits,
   ** dahs, inter-element spaces, inter-letter spaces, and maybe inter-word spaces.
   **
   ** Assume that each element observed is either a dit or a dah and record its
   ** contribution to the estimated dot clock as if it were both T and 3*T in length.
   ** Similarly, take each space observed as potentially T, 3*T, and 7*T in length.
   **
   ** But weight the T, 3*T, and 7*T observations by the inverse of their squared
   ** distance from the current estimate, and weight the T, 3*T, and 7*T observations
   **
   ** by their observed frequency in morse code.
   **
   ** Until detime has seen both dits and dahs, it may be a little confused.
   */
  detimeProcess(onoff, time) {
    const frame = time * this.context.sampleRate; /* convert seconds to frames */
    const observation =
      frame - this.frame; /* float length of observed element or space */
    // let guess = 0
    // let wt = 0
    // let update =0
    this.frame = frame;
    if (onoff === 0) {
      /* the end of a dit or a dah */
      const oDit = observation; /* float if it's a dit, then the length is the dit clock observation */
      const oDah =
        observation /
        3; /* float if it's a dah, then the length/3 is the dit clock observation */
      const dDit =
        oDit -
        this.estimate; /* float the dit distance from the current estimate */
      const dDah =
        oDah -
        this.estimate; /* float the dah distance from the current estimate */
      if (dDit === 0 || dDah === 0) {
        /* one of the observations is spot on, so 1/(d*d) will be infinite and the estimate is unchanged */
      } else {
        /* the weight of an observation is the observed frequency of the element scaled by inverse of
         * distance from our current estimate normalized to one over the observations made.
         */
        const wDit =
          (1.0 * this.nDit) / (dDit * dDit); /* raw weight of dit observation */
        const wDah =
          (1.0 * this.nDah) / (dDah * dDah); /* raw weight of dah observation */
        const wt = wDit + wDah; /* weight normalization */
        const update = (oDit * wDit + oDah * wDah) / wt;
        // console.log("o_dit="+o_dit+", w_dit="+w_dit+", o_dah="+o_dah+", w_dah="+w_dah+", wt="+wt);
        // console.log("update="+update+", estimate="+this.estimate);
        this.estimate += update;
        this.estimate /= 2;
        this.wpm = (this.context.sampleRate * 60) / (this.estimate * this.word);
      }
      const guess = (100 * observation) / this.estimate; /* make a guess */
      if (guess < 200) {
        this.nDit += 1;
        return '.';
      }
      this.nDah += 1;
      return '-';
    }
    const oIes = observation;
    const oIls = observation / 3;
    const dIes = oIes - this.estimate;
    const dIls = oIls - this.estimate;
    let guess = (100 * observation) / this.estimate;
    if (dIes === 0 || dIls === 0) {
      /* if one of the observations is spot on, then 1/(d*d) will be infinite and the estimate is unchanged */
    } else if (guess > 500) {
      /* if it looks like a word space, it could be any length, don't worry about how long it is */
    } else {
      const wIes = (1.0 * this.nIes) / (dIes * dIes);
      const wIls = (1.0 * this.nIls) / (dIls * dIls);
      const wt = wIes + wIls;
      const update = (oIes * wIes + oIls * wIls) / wt;
      // console.log("o_ies="+o_ies+", w_ies="+w_ies+", o_ils="+o_ils+", w_ils="+w_ils+", wt="+wt);
      // console.log("update="+update+", estimate="+this.estimate);
      this.estimate += update;
      this.estimate /= 2;
      this.wpm = (this.context.sampleRate * 60) / (this.estimate * this.word);
      guess = (100 * observation) / this.estimate;
    }
    if (guess < 200) {
      this.nIes += 1;
      return '';
    }
    if (guess < 500) {
      this.nIls += 1;
      return ' ';
    }
    this.nIws += 1;
    return '\t';
  }

  // event handler
  ontransition(onoff, time) {
    // console.log('ontransition('+onoff+", "+time+") in "+this);
    this.emit('element', this.detimeProcess(onoff, time), time);
  }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
