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
  static get windows() { return Object.keys(windows); }

  static window(type, n, i, ...args) { return window(type, n, i, ...args); }

  static window2(type1, type2, n, i, ...args) { return window(type1, n, i, ...args) * window(type2, n, i, ...args); }
}

