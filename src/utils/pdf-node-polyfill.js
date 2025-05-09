/**
 * PDF.js Node.js Polyfills
 * 
 * This file provides polyfills for browser APIs that PDF.js expects but are not available in Node.js.
 * It should be imported before any PDF.js operations.
 */

// Polyfill for DOMMatrix if not available
if (typeof globalThis.DOMMatrix === 'undefined') {
  try {
    // Try to use the canvas package's DOMMatrix implementation
    const canvas = require('canvas');
    if (canvas && canvas.DOMMatrix) {
      globalThis.DOMMatrix = canvas.DOMMatrix;
    }
  } catch (error) {
    console.warn('Failed to load DOMMatrix from canvas package:', error.message);
    
    // Provide a minimal DOMMatrix polyfill
    globalThis.DOMMatrix = class DOMMatrix {
      constructor(init) {
        this.a = 1; this.b = 0;
        this.c = 0; this.d = 1;
        this.e = 0; this.f = 0;
        
        if (init && Array.isArray(init) && init.length === 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        }
      }
      
      // Add minimal required methods
      translate(x, y) {
        this.e += x;
        this.f += y;
        return this;
      }
      
      scale(x, y) {
        this.a *= x;
        this.d *= y;
        return this;
      }
      
      // Add other methods as needed
    };
  }
}

// Polyfill for Path2D if not available
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {
    constructor() {
      this.commands = [];
    }
    
    // Add minimal required methods
    moveTo(x, y) {
      this.commands.push({ type: 'moveTo', x, y });
    }
    
    lineTo(x, y) {
      this.commands.push({ type: 'lineTo', x, y });
    }
    
    // Add other methods as needed
  };
}

// Export a function to check if polyfills are working
function checkPolyfills() {
  const polyfills = {
    DOMMatrix: typeof globalThis.DOMMatrix !== 'undefined',
    Path2D: typeof globalThis.Path2D !== 'undefined',
  };
  
  return polyfills;
}

module.exports = { checkPolyfills };