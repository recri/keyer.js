class KeyerKeyedOscillatorProcessor extends AudioWorkletProcessor {
  // constructor() { super(); }

  static get parameterDescriptors() {
    return [
      {				// linear gain
	name: "gain",
	defaultValue: 0.5,
	minValue: 0,
	maxValue: 1
      },
      {				// pitch frequency Hertz
	name: "frequency",
	defaultValue: 700.0,
	minValue: 27.5,
	maxValue: 4186.009
      },
      {				// ramp time, milliseconds
	name: "ramp",
	defaultValue: 4.0,
	minValue: 0.1,
	maxValue: 10.0
      }
    ];
  }

  process(inputList, outputList, parameters) {
    const sourceLimit = Math.min(inputList.length, outputList.length);
    if (parameters.envelope.value !== this.envelope) {
      // not empty
    }
    for (let inputNum = 0; inputNum < sourceLimit; inputNum += 1) {
      const input = inputList[inputNum];
      const output = outputList[inputNum];
      const channelCount = Math.min(input.length, output.length);
      
      for (let channelNum = 0; channelNum < channelCount; channelNum += 1) {
	const sampleCount = input[channelNum].length;

	for (let i = 0; i < sampleCount; i += 1) {
          const sample = input[channelNum][i];

          /* Manipulate the sample */

          output[channelNum][i] = sample;
	}
      }
    }
    
    return true;
  }
};

registerProcessor("keyer-keyed-oscillator-processor", KeyerKeyedOscillatorProcessor);
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
