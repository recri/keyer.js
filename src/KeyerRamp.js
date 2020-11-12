import { KeyerWindow } from './KeyerWindow.js';

const ramp = (type, size, k, ...args) => KeyerWindow.window(type, size*2, k, ...args);
const ramp2 = (type1, type2, size, k, ...args) => ramp(type1, size, k, ...args) * ramp(type2, size, k, ...args);

export class KeyerRamp { 
  static get ramps() { return KeyerWindow.windows; }
  
  static rise(type, size, k, ...args) { return ramp(type, size, k, ...args); }

  static fall(type, size, k, ...args) { return ramp(type, size, size+k, ...args); }

  static rise2(type1, type2, size, k, ...args) { return ramp2(type1, type2, size, k, ...args) }

  static fall2(type1, type2, size, k, ...args) { return ramp2(type1, type2, size, size+k, ...args); }
}
