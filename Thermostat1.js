// Thermostat.js
var util = require("util");
var EventEmitter = require('events').EventEmitter;

var hysteresis = 2.5; //thermostat hysteresis

var Class = function(){ }
Class.prototype.desiredTemperature = 20; //desired room temperature

util.inherits(Class, EventEmitter);

Class.prototype.temp = function(temp){
  if(temp < this.desiredTemperature - hysteresis ){
      this.emit("run");
  }
  else if(temp > this.desiredTemperature + hysteresis){
      this.emit("stop");
  }
};

Class.prototype.setThermostat = function(temp){
   this.desiredTemperature = temp;
}


module.exports = Class;
