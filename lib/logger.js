'use strict';

var winston = require('winston');

var defaultLevel = 'debug';

var consoleLogger = new winston.transports.Console({
    level: defaultLevel,
    timestamp: function() {
      return new Date().toISOString();
    },
    colorize: true
  });

var loggerTransports = [ consoleLogger ];

var logger = new winston.Logger({
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  },
  transports: loggerTransports
});

module.exports = logger;
