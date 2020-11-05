/* eslint class-methods-use-this: ["error", { "exceptMethods": ["on","off","emit"] }] */
// rewrite this to drop the ctx argument to .on()
// let everyone handle their own binding
// add a timer, after(time, handler)
// 
export class KeyerEvent {
  /**
   * events: installed event handlers
   * these became static because I had multiple
   * chains of extends from KeyerEvent, and the
   * events wouldn't cross between the chains.
   */
  static events = [];
  
  static on(type, func, ctx) {
    // console.log(`on ${type} ${func} ${ctx}`);
    (KeyerEvent.events[type] = KeyerEvent.events[type] || []).push({ f: func, c: ctx });
  }

  static off(type, func) {
    // console.log('off', type, func);
    if (!type) KeyerEvent.events = {};
    const list = KeyerEvent.events[type] || [];
    let i = func ? list.length : 0;
    // as written this loses if func occurs twice in a row
    while (i > 0) {
      i -= 1;
      if (func === list[i].f) list.splice(i, 1);
    }
  }

  static emit(type, args) {
    const list = KeyerEvent.events[type] || [];
    // console.log(`emit ${type} ${args} listeners ${list.length}`);
    list.forEach(j => {
      // console.log(`emit apply in ${j.c} ${j.f}`);
      j.f.apply(j.c, args)
    });
  }

  constructor(audioContext) {
    this.context = audioContext;
  }

  get currentTime() { return this.context.currentTime; }

  get sampleRate() { return this.context.sampleRate; }

  get baseLatency() { return this.context.baseLatency; }
  
  /**
   *  on: listen to events
   */
  on(type, func, ctx) { KeyerEvent.on(type, func, ctx); }

  /**
   *  Off: stop listening to event / specific callback
   */
  off(type, func) { KeyerEvent.off(type, func); }

  /**
   * Emit: send event, callbacks will be triggered
   */
  emit(type, ...args) { KeyerEvent.emit(type, args); }

  /**
   * After: fire an event at some seconds into the future.
   * using the web audio sample timer.
   */
  after(dtime, func) { 
    this.when(this.currentTime+dtime, func);
  }
    
  /**
   * When: fire an event at a specified time.
   * using the web audio sample timer.
   */
  when(time, func) {
    if (time <= this.currentTime)
      func();
    else {
      const timer = this.context.createConstantSource();
      timer.onended = func;
      timer.start();
      timer.stop(Math.max(time,this.currentTime+1/this.sampleRate));
    }
  }

  // eventDebug(type) {
  // console.log('event.debug', type, this._events[type]);
  // console.log('event.debug', this._events);
  // }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
