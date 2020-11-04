import { KeyerWindow } from './KeyerWindow.js';


const ramps = {
  'linear':
  (size, k) => k/size,
  'raised-cosine':
  (size, k) => KeyerWindow.window('cosine', 2*size, k),
  'exponential':
  (size, k, shape) => (k/size)**(shape||0.1),
  'blackman-harris':
  (size, k) => KeyerWindow.window('blackman-harris', 2*size, k),
};

const ramp = (type, size, k, ...args) => ramps[type](size, k, ...args);
const ramp2 = (type1, type2, size, k, ...args) => ramp(type1, size, k, ...args) * ramp(type2, size, k, ...args);

export class KeyerRamp { 
  static get ramps() { return Array.from(Object.keys(ramps)); }
  
  static rise(type, size, k, ...args) { return ramp(type, size, k, ...args); }

  static fall(type, size, k, ...args) { return 1-ramp(type, size, k, ...args); }

  static rise2(type1, type2, size, k, ...args) { return ramp2(type1, type2, size, k, ...args) }

  static fall2(type1, type2, size, k, ...args) { return 1-ramp2(type1, type2, size, size+k, ...args); }
}
