export class KeyerTable {
  // construct a morse code decoding table
  constructor(name) {
    // the name of the encoding currently in use
    this.name = null;
    // the object dictionary table used for encoding
    this.code = null;
    // the object dictionary used to transliterate into roman
    this.trans = null;
    // the object dictionary used to decode morse back to unicode
    this.invert = null;
    // the object dictionary of dit lengths for each character
    this.dits = null;
    // set the encoding
    this.setName(name || 'fldigi');
  }

  // encode the string into dit, dah, and space
  // dit is a period, dah is a hyphen, space is a space that represents
  // a nominal 2 dit clocks of space which is added to the 1 dit clock of space
  // that terminates each dit or dah.
  encode(string) {
    const result = [];
    if (string && this.code) {
      for (let i = 0; i < string.length; i += 1) {
        const c = string.charAt(i).toUpperCase();
        if (this.code[c]) {
          result.push(this.code[c]);
          result.push(' ');
        } else if (c === ' ') {
          result.push('\t');
        }
      }
    }
    return result.join('');
  }

  decode(string) { return this.invert[string]; }

  // take a string in arabic, cyrillic, farsi, greek, hebrew, or wabun and transliterate into roman
  transliterate(string) {
    const result = [];
    if (this.trans) {
      for (let i = 0; i < string.length; i += 1) {
        const c = string.charAt(i).toUpperCase();
        if (this.trans[c]) {
          result.push(this.trans[c]);
        } else if (c === ' ') {
          result.push(' ');
        }
      }
    } else {
      result.push(string);
    }
    return result.join('');
  }

  // compute the dit length of a string
  ditLength(string) {
    let result = 0;
    if (this.dits) {
      for (let i = 0; i < string.length; i += 1) {
        const c = string.charAt(i).toUpperCase();
        if (this.code[c]) {
          result += this.dits[c];
          result += 2;
        } else if (c === ' ') {
          result += 4;
        }
      }
    }
    return result;
  }

  // select the code to use
  setName(name) {
    if (this.name !== name) {
      if (KeyerTable.codes[name]) {
        this.name = name;
        this.code = KeyerTable.codes[name];
        this.trans = KeyerTable.transliterations[name];
        this.invert = {};
        this.dits = {};
        // there is a problem with multiple translations
        // because some morse codes get used for more than one character
        // ignored for now
        for (const i of Object.keys(this.code)) {
          const code = this.code[i];
          this.invert[code] = i; // deal with multiple letters sharing codes
          this.dits[i] = 0;
          for (let j = 0; j < code.length; j += 1) {
            const c = code.charAt(j);
            if (c === '.') this.dits[i] += 2;
            else this.dits[i] += 4;
          }
        }
      }
    }
  }

  // return the list of valid name for codes
  /* eslint class-methods-use-this: ["error", { "exceptMethods": ["getNames"] }] */
  getNames() { return Object.keys(KeyerTable.codes); }

  // morse code translation tables
  static codes = {
    'arabic' : {
      "\u0627" : '.-', "\u062f" : '-..', "\u0636" : '...-', "\u0643" : '-.-', "\ufe80" : '.', "\u0628" : '-...',
      "\u0630" : '--..', "\u0637" : '..-', "\u0644" : '.-..', "\u062a" : '-', "\u0631" : '.-.', "\u0638" : '-.--',
      "\u0645" : '--', "\u062b" : '-.-.', "\u0632" : '---.', "\u0639" : '.-.-', "\u0646" : '-.', "\u062c": '.---',
      "\u0633" : '...', "\u063a" : '--.', "\u0647" : '..-..', "\u062d" : '....', "\u0634" : '----', "\u0641" : '..-.',
      "\u0648" : '.--', "\u062e" : '---', "\u0635" : '-..-', "\u0642" : '--.-', "\u064a" : '..' },
    'cyrillic' : {
      "\u0410" : '.-', "\u041b" : '.-..', "\u0425" : '....', "\u0411" : '-...', "\u041c" : '--', "\u0426" : '-.-.',
      "\u0412" : '.--', "\u041d" : '-.', "\u0427" : '---.', "\u0413" : '--.', "\u041e" : '---', "\u0428" : '----',
      "\u0414" : '-..', "\u041f" : '.--.', "\u0429" : '--.-', "\u0415" : '.', "\u0420" : '.-.', "\u042c" : '-..-',
      "\u0416" : '...-', "\u0421" : '...', "\u042b" : '-.--', "\u0417" : '--..', "\u0422" : '-', "\u042d" : '..-..',
      "\u0418" : '..', "\u0423" : '..-', "\u042e" : '..--', "\u0419" : '.---', "\u0424" : '..-.', "\u042f" : '.-.-',
      "\u041a" : '-.-' },
    'farsi' : {
      "\u0627" : '.-', "\u062e" : '-..-', "\u0635" : '.-.-', "\u06a9" : '-.-', "\u0628" : '-...', "\u062f" : '-..',
      "\u0636" : '..-..', "\u06af" : '--.-', "\u067e" : '.--.', "\u0630" : '...-', "\u0637" : '..-', "\u0644" : '.-..',
      "\u062a" : '-', "\u0631" : '.-.', "\u0638" : '-.--', "\u0645" : '--', "\u062b" : '-.-.', "\u0632" : '--..',
      "\u0639" : '---', "\u0646" : '-.', "\u062c" : '.---', "\u0698" : '--.', "\u063a" : '..--', "\u0648" : '.--',
      "\u0686" : '---.', "\u0633" : '...', "\u0641" : '..-.', "\u0647" : '.', "\u062d" : '....', "\u0634" : '----',
      "\u0642" : '...---', "\u06cc" : '..' },
    'greek' : {
      "\u0391" : '.-', "\u0399" : '..', "\u03a1" : '.-.', "\u0392" : '-...', "\u039a" : '-.-', "\u03a3" : '...',
      "\u0393" : '--.', "\u039b" : '.-..', "\u03a4" : '-', "\u0394" : '-..', "\u039c" : '--', "\u03a5" : '-.--',
      "\u0395" : '.', "\u039d" : '-.', "\u03a6" : '..-.', "\u0396" : '--..', "\u039e" : '-..-', "\u03a7" : '----',
      "\u0397" : '....', "\u039f" : '---', "\u03a8" : '--.-', "\u0398" : '-.-.', "\u03a0" : '.--.', "\u03a9" : '.--' },
    'hebrew' : {
      "\u05d0" : '.-', "\u05dc" : '.-..', "\u05d1" : '-...', "\u05de" : '--', "\u05d2" : '--.', "\u05e0" : '-.',
      "\u05d3" : '-..', "\u05e1" : '-.-.', "\u05d4" : '---', "\u05e2" : '.---', "\u05d5" : '.', "\u05e4" : '.--.',
      "\u05d6" : '--..', "\u05e6" : '.--', "\u05d7" : '....', "\u05e7" : '--.-', "\u05d8" : '..-', "\u05e8" : '.-.',
      "\u05d9" : '..', "\u05e9" : '...', "\u05db" : '-.-', "\u05ea" : '-' },
    'itu' : {
      '!' : '-.-.--', '"' : '.-..-.', '$' : '...-..-', '&' : '.-...', "'" : '.----.', '(' : '-.--.', ')' : '-.--.-',
      '+' : '.-.-.', ',' : '--..--', '-' : '-....-', '.' : '.-.-.-', '/' : '-..-.',
      '0' : '-----', '1': '.----', '2' : '..---', '3' : '...--', '4' : '....-',
      '5' : '.....', '6' : '-....', '7' : '--...', '8' : '---..', '9' : '----.',
      ':' : '---...', ';' : '-.-.-.', '=' : '-...-', '?' : '..--..', '@' : '.--.-.',
      'A' : '.-', 'B' : '-...', 'C' : '-.-.', 'D' : '-..', 'E' : '.', 'F' : '..-.',
      'G' : '--.', 'H' : '....', 'I' : '..', 'J' : '.---', 'K' : '-.-',
      'L' : '.-..', 'M' : '--', 'N' : '-.', 'O' : '---', 'P' : '.--.', 'Q' : '--.-',
      'R' : '.-.', 'S' : '...', 'T' : '-', 'U' : '..-', 'V' : '...-',
      'W' : '.--', 'X' : '-..-', 'Y' : '-.--', 'Z' : '--..', '_' : '..--.-',
      '*' : '...-.-', //  prosigns assigned to ascii punctuation
      'À' : '.--.-', 'Ä' : '.-.-', 'Ç' : '----', 'È' : '..-..', 'Ñ' : '--.--', 'Ö' : '---.', 'Ü' : '..--', // latin extensions
    },
    // rather than get all creative, though I'm not sure where the creation came from, copy the fldigi code table
    'fldigi' : {
      '!' : '-.-.--',	            '$' : '...-..-', '&' : '..-.-', "'" : '.----.', '(' : '-.--.', ')' : '-.--.-',
      '+' : '.-.-.', ',' : '--..--', '-' : '-....-', '.' : '.-.-.-', '/' : '-..-.',
      '0' : '-----', '1' : '.----', '2' : '..---', '3' : '...--', '4' : '....-',
      '5' : '.....', '6' : '-....', '7' : '--...', '8' : '---..', '9' : '----.',
      ':' : '---...', ';' : '-.-.-.', '=' : '-...-', '?' : '..--..', '@' : '.--.-.',
      'A' : '.-', 'B' : '-...', 'C' : '-.-.', 'D' : '-..', 'E' : '.', 'F' : '..-.',
      'G' : '--.', 'H' : '....', 'I' : '..', 'J' : '.---', 'K' : '-.-',
      'L' : '.-..', 'M' : '--', 'N' : '-.', 'O' : '---', 'P' : '.--.', 'Q' : '--.-',
      'R' : '.-.', 'S' : '...', 'T' : '-', 'U' : '..-', 'V' : '...-',
      'W' : '.--', 'X' : '-..-', 'Y' : '-.--', 'Z' : '--..', '_' : '..--.-',

      '\\' : '.-..-.',
      '~' : '.-.-',
      '%' : '.-...',
      '>' : '...-.-',
      // '<' : '-.--.', this conflicts with '('
      '}' : '....--',
      '{' : '...-.',
    },
    'wabun' : {
      "\u30a2" : '--.--', "\u30ab" : '.-..', "\u30b5" : '-.-.-', "\u30bf" : '-.', "\u30ca" : '.-.', "\u30cf" : '-...',
      "\u30de" : '-..-', "\u30e4" : '.--', "\u30e9" : '...', "\u30ef" : '-.-', "\u25cc" : '..', "\u30a4" : '.-',
      "\u30ad" : '-.-..', "\u30b7" : '--.-.', "\u30c1" : '..-.', "\u30cb" : '-.-.', "\u30d2" : '--..-', "\u30df" : '..-.-',
      "\u30ea" : '--.', "\u30f0" : '.-..-', "\u30a6" : '..-', "\u30af" : '...-', "\u30b9" : '---.-',
      "\u30c4" : '.--.', "\u30cc" : '....', "\u30d5" : '--..', "\u30e0" : '-', "\u30e6" : '-..--', "\u30eb" : '-.--.',
      "\u30f3" : '.-.-.',  "\u30a8" : '-.---', "\u30b1" : '-.--', "\u30bb" : '.---.', "\u30c6" : '.-.--',
      "\u30cd" : '--.-', "\u30d8" : '.', "\u30e1" : '-...-', "\u30ec" : '---', "\u30f1" : '.--..', "\u3001" : '.-.-.-',
      "\u30aa" : '.-...', "\u30b3" : '----', "\u30bd" : '---.', "\u30c8" : '..-..', "\u30ce" : '..--', "\u30db" : '-..',
      "\u30e2" : '-..-.', "\u30e8" : '--', "\u30ed" : '.-.-', "\u30f2" : '.---', "\u3002": '.-.-..' 
    }
    // duplicate key "\u25cc" : '.--.-', "\u25cc" : '..--.', 
  };

  // transliteration tables for non-roman alphabets
  static transliterations = {
    'arabic' : {
      "\u0627" : 'A', "\u062f" : 'D', "\u0636" : 'V', "\u0643" : 'K', "\ufe80" : 'E', "\u0628" : 'B', "\u0630" : 'Z', "\u0637" : 'U', "\u0644" : 'L',
      "\u062a" : 'T', "\u0631" : 'R', "\u0638" : 'Y', "\u0645" : 'M', "\u062b" : 'C', "\u0632" : 'Z', "\u0639" : 'Ä', "\u0646" : 'N', "\u062c" : 'J',
      "\u0633" : 'S', "\u063a" : 'G', "\u0647" : 'É', "\u062d" : 'H', "\u0634" : 'SH', "\u0641" : 'F', "\u0648" : 'W', "\u062e" : 'O', "\u0635" : 'X',
      "\u0642" : 'Q', "\u064a" : 'I'
    },
    'cyrillic' : {
      "\u0410" : 'A', "\u041b" : 'L', "\u0425" : 'H', "\u0411" : 'B', "\u041c" : 'M', "\u0426" : 'C', "\u0412" : 'W', "\u041d" : 'N', "\u0427" : 'Ö',
      "\u0413" : 'G', "\u041e" : 'O', "\u0428" : 'CH', "\u0414" : 'D', "\u041f" : 'P', "\u0429" : 'Q', "\u0415" : 'E', "\u0420" : 'R', "\u042c" : 'X',
      "\u0416" : 'V', "\u0421" : 'S', "\u042b" : 'Y', "\u0417" : 'Z', "\u0422" : 'T', "\u042d" : 'É', "\u0418" : 'I', "\u0423" : 'U', "\u042e" : 'Ü',
      "\u0419" : 'J', "\u0424" : 'F', "\u042f" : 'Ä', "\u041a" : 'K'
    },
    'farsi' : {
      "\u0627" : 'A', "\u062e" : 'X', "\u0635" : 'Ä', "\u06a9" : 'K', "\u0628" : 'B', "\u062f" : 'D', "\u0636" : 'É', "\u06af" : 'Q', "\u067e" : 'P',
      "\u0630" : 'V', "\u0637" : 'U', "\u0644" : 'L', "\u062a" : 'T', "\u0631" : 'R', "\u0638" : 'Y', "\u0645" : 'M', "\u062b" : 'C', "\u0632" : 'Z',
      "\u0639" : 'O', "\u0646" : 'N', "\u062c" : 'J', "\u0698" : 'G', "\u063a" : 'Ü', "\u0648" : 'W', "\u0686" : 'Ö', "\u0633" : 'S', "\u0641" : 'F',
      "\u0647" : 'E', "\u062d" : 'H', "\u0634" : 'Š', "\u0642" : '?', "\u06cc" : 'I'
    },
    'greek' : {
      "\u0391" : 'A', "\u0399" : 'I', "\u03a1" : 'R', "\u0392" : 'B', "\u039a" : 'K', "\u03a3" : 'S', "\u0393" : 'G', "\u039b" : 'L', "\u03a4" : 'T',
      "\u0394" : 'D', "\u039c" : 'M', "\u03a5" : 'Y', "\u0395" : 'E', "\u039d" : 'N', "\u03a6" : 'F', "\u0396" : 'Z', "\u039e" : 'X', "\u03a7" : 'CH',
      "\u0397" : 'H', "\u039f" : 'O', "\u03a8" : 'Q', "\u0398" : 'C', "\u03a0" : 'P', "\u03a9" : 'W'
    },
    'hebrew' : {
      "\u05d0" : 'A', "\u05dc" : 'L', "\u05d1" : 'B', "\u05de" : 'M', "\u05d2" : 'G', "\u05e0" : 'N', "\u05d3" : 'D', "\u05e1" : 'C', "\u05d4" : 'O',
      "\u05e2" : 'J', "\u05d5" : 'E', "\u05e4" : 'P', "\u05d6" : 'Z', "\u05e6" : 'W', "\u05d7" : 'H', "\u05e7" : 'Q', "\u05d8" : 'U', "\u05e8" : 'R',
      "\u05d9" : 'I', "\u05e9" : 'S', "\u05db" : 'K', "\u05ea" : 'T'
    },
    'wabun' : {
      "\u30a2" : 'a', "\u30ab" : 'ka', "\u30b5" : 'sa',  "\u30bf" : 'ta',  "\u30ca" : 'na', "\u30cf" : 'ha', "\u30de" : 'ma', "\u30e4" : 'ya', "\u30e9" : 'ra',
      "\u30a4" : 'i', "\u30ad" : 'ki', "\u30b7" : 'shi', "\u30c1" : 'chi', "\u30cb" : 'ni', "\u30d2" : 'hi', "\u30df" : 'mi', "\u30ea" : 'ri', "\u30f0" : 'wi',
      "\u30a6" : 'u', "\u30af" : 'ku', "\u30b9" : 'su',  "\u30c4" : 'tsu', "\u30cc" : 'nu', "\u30d5" : 'fu', "\u30e0" : 'mu', "\u30e6" : 'yu', "\u30eb" : 'ru',
      "\u30f3" : 'n',
      "\u30a8" : 'e', "\u30b1" : 'ke', "\u30bb" : 'se',  "\u30c6" : 'te',  "\u30cd" : 'ne', "\u30d8" : 'he', "\u30e1" : 'me', "\u30ec" : 're', "\u30f1" : 'we',
      "\u30aa" : 'o', "\u30b3" : 'ko', "\u30bd" : 'so',  "\u30c8" : 'to',  "\u30ce" : 'no', "\u30db" : 'ho', "\u30e2" : 'mo', "\u30e8" : 'yo', "\u30ed" : 'ro',
      "\u30f2" : 'wo',
      // these end up as duplicate keys
      // "\u25cc" : 'Dakuten', "\u25cc" : 'Handakuten', "\u25cc" : 'Long vowel',
      "\u3001" : 'Comma', "\u3002" : 'Full stop'
    }
  };
}
// Local Variables: 
// mode: JavaScript
// js-indent-level: 2
// End:
