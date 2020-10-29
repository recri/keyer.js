import { KeyerPlayer } from './KeyerPlayer.js';

// handle the details of making morse elements
// the timing of dits and dahs and their spacing
export class KeyerTimer extends KeyerPlayer {
  constructor(context) {
    super(context);

    // initialize
    this._weight = 50;
    this._ratio = 50;
    this._compensation = 0;
    this._wpm = 20;
    this.updateTiming();
  }
    
  set wpm(v) { this._wpm = v; this.updateTiming(); }

  get wpm() { return this._wpm; }

  set weight(v) { this._weight = v; this.updateTiming(); }

  get weight() { return this._weight; }

  set ratio(v) { this._ratio = v; this.updateTiming(); }

  get ratio() { return this._ratio; }
  
  set compensation(v) { this._compensation = v; this.updateTiming(); }

  get compensation() { return this._compensation; }
  
  // update timing
  // for reference a plain dit is
  //              80ms at 15wpm
  //              60ms at 20wpm
  //              48ms at 25wpm
  //              40ms at 30wpm
  //              30ms at 40wpm
  //              24ms at 50wpm
  updateTiming() {
    const dit = 60.0 / (this.wpm * 50); // seconds/dit
    const microsPerDit = dit * 1e6;
    const r = (this._ratio-50)/100.0;
    const w = (this._weight-50)/100.0;
    const c = 1000.0 * this._compensation / microsPerDit;
    // console.log(`updateTiming r ${r} w ${w} c ${c} dit ${dit}`);
    this._perRawDit = dit;
    this._perDit = dit*(1+r+w+c);
    this._perDah = dit*(3-r+w+c);
    this._perIes = dit*(1  -w-c);
    this._perIls = dit*(3  -w-c); 
    this._perIws = dit*(7  -w-c);
    this.emit('updateTiming');
  }
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End: