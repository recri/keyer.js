// rewrite this to drop the ctx argument to .on()
// let everyone handle their own binding
export class KeyerEvent {
  /**
   * events: installed event handlers
   */
  constructor(audioContext) {
    this.context = audioContext;
    this.events = [];
  }

  /**
   *  on: listen to events
   */
  on(type, func, ctx) {
    // console.log('on', type, func, ctx);
    (this.events[type] = this.events[type] || []).push({ f: func, c: ctx });
  }

  /**
   *  Off: stop listening to event / specific callback
   */
  off(type, func) {
    // console.log('off', type, func);
    if (!type) this.events = {};
    const list = this.events[type] || [];
    let i = func ? list.length : 0;
    // as written this loses if func occurs twice in a row
    while (i > 0) {
      i -= 1;
      if (func === list[i].f) list.splice(i, 1);
    }
  }

  /**
   * Emit: send event, callbacks will be triggered
   */
  emit(type, ...args) {
    const list = this.events[type] || [];
    list.forEach(j => j.f.apply(j.c, args));
  }

  // eventDebug(type) {
  // console.log('event.debug', type, this.events[type]);
  // console.log('event.debug', this.events);
  // }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
