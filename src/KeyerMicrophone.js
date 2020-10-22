import { KeyerEvent } from './KeyerEvent.js';

// this would decode morse heard on the microphone input
export class KeyerMicrophone extends KeyerEvent {
  constructor(context) {
    super();
    this.context = context;
  }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
