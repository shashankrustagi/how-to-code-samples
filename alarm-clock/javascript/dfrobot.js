/*
* Copyright (c) 2015 - 2016 Intel Corporation.
*
* Permission is hereby granted, free of charge, to any person obtaining
* a copy of this software and associated documentation files (the
* "Software"), to deal in the Software without restriction, including
* without limitation the rights to use, copy, modify, merge, publish,
* distribute, sublicense, and/or sell copies of the Software, and to
* permit persons to whom the Software is furnished to do so, subject to
* the following conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
* LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
* OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
* WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

"use strict";

var exports = module.exports = {};

// The program is using the `mraa` module
// to communicate directly with the digital
// pin used to turn on/off the buzzer
var mraa = require("mraa");

// Initialize the hardware devices
var buzzer = new mraa.Gpio(15), // aka A1
    button = new (require("jsupm_grove").GroveButton)(16), // aka A2
    rotary = new (require("jsupm_grove").GroveRotary)(3), // A3
    screen = new (require("jsupm_i2clcd").SAINSMARTKS)(8, 9, 4, 5, 6, 7, 0);

buzzer.dir(mraa.DIR_OUT);

// The program handles events generated by the various connected
// hardware devices using the Node.js built-in `events` module
var events = new (require("events").EventEmitter)();
exports.events = events;

// Cannot set the background color on this LCD display
exports.color = function(string) {
  return;
}

// Displays a message on the LCD
exports.message = function(string, line) {
  // pad string to avoid display issues
  while (string.length < 16) { string += " "; }

  screen.setCursor(line || 0, 0);
  screen.write(string);
}

// Sound an audible alarm when it is time to get up
exports.buzz = function() {
  buzzer.write(1);
}

// Turn off the audible alarm
exports.stopBuzzing = function() {
  buzzer.write(0);
}

// Loops every 100ms to check to fire a custom event with the
// latest value of the rotary dial, so we can check if has been moved
// Also checks to see if the button was pressed, so we can fire
// our custom button events if needed
exports.setupEvents = function() {
  var prev = { button: 0 };

  setInterval(function() {
    var pressed = button.value();

    if (pressed && !prev.button) { events.emit("button-press"); }
    if (!pressed && prev.button) { events.emit("button-release"); }

    prev.button = pressed;

    events.emit("rotary", rotary.abs_value());
  }, 100);

  events.on("rotary", adjustBrightness);
}

// Turn on/off LCD backlight
function adjustBrightness(value) {
  if (value < 512) {
    screen.displayOn();
  } else {
    screen.displayOff();
  }
}