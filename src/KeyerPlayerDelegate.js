import { KeyerEvent } from './KeyerEvent.js';
// import { KeyerTimer } from './KeyerTimer.js';

// delegate to keyertimer
export class KeyerPlayerDelegate extends KeyerEvent {

  constructor(context, keyertimer) {
    super(context);
    this.keyertimer = keyertimer;
  }

  get cursor() { return this.keyertimer.cursor; }

  keyOnAt(time) { this.keyertimer.keyOnAt(time); }

  keyOffAt(time) { this.keyertimer.keyOffAt(time); }

  keyHoldFor(time) { return this.keyertimer.keyHoldFor(time); }

  cancel() { this.keyertimer.cancel(); }
  
  get perDit() { return this.keyertimer.perDit; }

  get perDah() { return this.keyertimer.perDah; }

  get perIes() { return this.keyertimer.perIes; }

  get perIls() { return this.keyertimer.perIls; }

  get perIws() { return this.keyertimer.perIws; }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
