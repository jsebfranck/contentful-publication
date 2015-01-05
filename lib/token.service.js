'use strict';

var fs = require('fs'),
  logger = require('./logger');

var TokenService = function(tokenFile) {
  this.tokenFile = tokenFile;
};

TokenService.prototype.getToken = function () {
  var self = this;
  
  try {
    return JSON.parse(fs.readFileSync(self.tokenFile, 'utf8'));
  } catch (error) {
    logger.warn('Cannot read token file %s : %s', self.tokenFile, error);
  }
  return {};
};

TokenService.prototype.setToken = function (newToken) {
  if (!newToken) {
    return ;
  }
  var self = this;

  fs.writeFile(self.tokenFile, newToken, function(err) {
    if (err) {
      logger.error(err);
    } else {
      logger.debug('New sync URL is %s', newToken);
    }
  });
};

module.exports = TokenService;