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

var timestamp = new Date().toISOString();

var fileLogger = new winston.transports.File({
  level: defaultLevel,
  filename: 'contentful-publication-' + timestamp + '.log'
});

var loggerTransports = [ consoleLogger, fileLogger ];

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
