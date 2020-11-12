export class KeyerEvent {

  constructor(audioContext) {
    this.context = audioContext;
    this.events = [];
  }

  // delegate to context
  
  get currentTime() { return this.context.currentTime; }

  get sampleRate() { return this.context.sampleRate; }

  get baseLatency() { return this.context.baseLatency; }
  
  /**
   *  on: listen to events
   */
  on(type, func) {
    // console.log(`on ${type} ${func}`);
    (this.events[type] = this.events[type] || []).push(func);
  }

  /**
   *  Off: stop listening to event / specific callback
   */
  off(type, func) {
    // console.log('off', type, func);
    if (!type) this.events = [];
    const list = this.events[type] || [];
    let i = func ? list.length : 0;
    while (i > 0) {
      i -= 1;
      if (func === list[i]) list.splice(i, 1);
    }
  }

  /**
   * Emit: send event, callbacks will be triggered
   */
  emit(type, ...args) {
    const list = this.events[type] || [];
    // console.log(`emit '${type}' (${args}) listeners ${list.length}`);
    list.forEach(f => f.apply(window, args));
  }

  /**
   * After: fire an event at some seconds into the future.
   * using the web audio sample timer.
   */
  after(dtime, func) { this.when(this.currentTime+dtime, func); }
    
  /**
   * When: fire an event at a specified time.
   * using the web audio sample timer.
   */
  when(time, func) {
    const timer = this.context.createConstantSource();
    timer.onended = func;
    timer.start();
    timer.stop(Math.max(time,this.currentTime+1/this.sampleRate));
  }

}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
