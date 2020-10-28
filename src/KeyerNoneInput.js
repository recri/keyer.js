import { KeyerEvent } from './KeyerEvent.js';
/*
*/
export class KeyerNoneInput extends KeyerEvent {

    onfocus() { this.start = true; }

    onblur() { this.start = false; }

    keydown(e) { this.event = e; }

    keyup(e) {  this.event = e; }

    onmidievent(e) { this.event = e; }

}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
