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

/** 
* @file window.c
* @brief Functions to allow windowing on the signal 
* @author Frank Brickle, AB2KT and Bob McGwier, N4HY 

This file is part of a program that implements a Software-Defined Radio.

Copyright (C) 2004, 2005, 2006,2007 by Frank Brickle, AB2KT and Bob McGwier, N4HY
Implemented from code by Bill Schottstaedt of Snd Editor at CCRMA
Doxygen comments added by Dave Larsen, KV0S

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 7 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

The authors can be reached by email at

ab2kt@arrl.net
or
rwmcgwier@gmail.com

or by paper mail at

The DTTS Microwave Society
6 Kathleen Place
Bridgewater, NJ 08807
*/

/** shamelessly stolen from Bill Schottstaedt's clm.c 
* made worse in the process, but enough for our purposes here 
*/


/** mostly taken from
 *    Fredric J. Harris, "On the Use of Windows for Harmonic Analysis with the
 *    Discrete Fourier Transform," Proceedings of the IEEE, Vol. 66, No. 1,
 *    January 1978.
 *    Albert H. Nuttall, "Some Windows with Very Good Sidelobe Behaviour", 
 *    IEEE Transactions of Acoustics, Speech, and Signal Processing, Vol. ASSP-29,
 *    No. 1, February 1981, pp 84-91
 *
 * JOS had slightly different numbers for the Blackman-Harris windows.
 */

const pi = Math.PI;
const twoPi = 2*pi;
const {cos, sin, exp, floor} = Math;
const fabs = Math.abs;
const sqr = (x) => x*x;
const square = sqr;

const cosineSeries1 = (size, k, a0,  a1) => a0 - a1 * cos((twoPi * k) / (size-1));
const cosineSeries2 = (size, k, a0, a1, a2) => cosineSeries1(size, k, a0, a1) + a2 * cos((2 * twoPi * k) / (size-1));
const cosineSeries3 = (size, k, a0, a1, a2, a3) => cosineSeries2(size, k, a0, a1, a2) - a3 * cos((3 * twoPi * k) / (size-1));
const cosineSeries4 = (size, k, a0, a1, a2, a3, a4) => cosineSeries3(size, k, a0, a1, a2, a3) + a4 * cos((4 * twoPi * k) / (size-1));
const gaussian = (size, k, sigma) => exp(-0.5 * square((k - (size-1) / 2.0) / (sigma * (size-1) / 2.0)));
const sinc = (x) => x === 0 ? 1 : sin(x * pi) / (x * pi);
/* for decay with time constant tau */
const exponentialTau = (size, k, tau) => exp(-fabs(k-(size-1)/2.0)/tau);
/* for decay over half window of decay decibels */
const exponentialDecay = (size, k, decay) => exponentialTau(size, k, (size / 2.0) * (8.69 / decay));

const windows = {
  'rectangular':
  () => 1.0,
  'triangular':
  (size,k) => 1.0 - fabs( (k - ((size-1)/2.0)) / (size/2.0) ),
  'bartlett':
  (size,k) => 1.0 - fabs( (k - ((size-1)/2.0)) / ((size-1)/2.0) ),
  'bartlett-hann':
  (size,k) => 0.62 - 0.48 * fabs(k/(size-1)-0.5) -0.38 * cos(k * twoPi / (size-1)),
  'welch':
  (size,k) => 1.0 - sqr( (k - ((size-1)/2.0)) / ((size-1)/2.0) ),
  'hann':    /* "Hanning" */
  (size,k) => cosineSeries1(size, k, 0.50, 0.50),
  'hamming':
  (size,k) => cosineSeries1(size, k, 0.54, 0.46),
  'blackman': /* per wikipedia */
  (size,k) => cosineSeries2(size, k, 0.42, 0.50, 0.08),
  'blackman2':    /* using Chebyshev polynomial equivalents here */
  (size,k) => .34401 + (cos(k * twoPi / size) * 
			(-.49755 + (cos(k * twoPi / size) * .15844))),
  'blackman3':
  (size,k) => .21747 + (cos(k * twoPi / size) * 
			(-.45325 + (cos(k * twoPi / size) * 
				    (.28256 - (cos(k * twoPi / size) * .04672))))),
  'blackman4':
  (size,k) => .084037 + (cos(k * twoPi / size) * 
			 (-.29145 + (cos(k * twoPi / size) * 
				     (.375696 + (cos(k * twoPi / size) * 
						 (-.20762 + (cos(k * twoPi / size) * .041194))))))),
  'exponential': /*  decays decay dB over half window */
  (size,k,decay) => exponentialDecay(size, k, decay || 10),
  'blackman-harris':
  (size,k) => cosineSeries3(size, k, 0.3587500, 0.4882900, 0.1412800, 0.0116800),
  'blackman-nuttall': 
  (size,k) => cosineSeries3(size, k, 0.3635819, 0.4891775, 0.1365995, 0.0106411),
  'nuttall':
  (size,k) => cosineSeries3(size, k, 0.3557680, 0.4873960, 0.1442320, 0.0126040),
  'flat-top':
  (size,k) => cosineSeries4(size, k, 0.21557895, 0.41663158, 0.277263158, 0.083578947, 0.032),
  'cosine': // also known as the sine window
  (size,k) => sin(pi*k / (size-1)),
  'gaussian':
  (size,k,sigma) => gaussian(size, k, sigma || 0.50),
  'riemann':
  (size,k) => {
    const midn = floor(size/2);
    if (midn === k) return 1.0;
    const l = (k > midn) ? size-1 - k : k;
    const cx = (midn - l) * twoPi / size;
    return sin(cx) / cx;
  },
  'lanczos':
  (size,k) => sinc(2.0*k/(size-1) - 1.0),
};

const window = (type, size, k) => windows[type](size, k);

export class KeyerWindow {
  static get windows() { return Array.from(Object.keys(windows)); }

  static window(type, n, i, ...args) { return window(type, n, i, ...args); }

  static window2(type1, type2, n, i, ...args) { return window(type1, n, i, ...args) * window(type2, n, i, ...args); }
}

