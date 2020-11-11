import { KeyerEvent } from './KeyerEvent.js';

// delegate to KeyerInput
export class KeyerInputDelegate extends KeyerEvent {

  constructor(context, input) {
    super(context);
    this.input = input;
  }

  get cursor() { return this.input.cursor; }

  keyOnAt(time) { this.input.keyOnAt(time); }

  keyOffAt(time) { this.input.keyOffAt(time); }

  keyHoldFor(time) { return this.input.keyHoldFor(time); }

  cancel() { this.input.cancel(); }
  
  get perRawDit() { return this.input.perRawDit; }
  
  get perDit() { return this.input.perDit; }

  get perDah() { return this.input.perDah; }

  get perIes() { return this.input.perIes; }

  get perIls() { return this.input.perIls; }

  get perIws() { return this.input.perIws; }

  get rise() { return this.input.rise; }

  get fall() { return this.input.fall; }
  
  
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
