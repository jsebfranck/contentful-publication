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
  logger.debug('New sync URL is %s', newToken);
  if (!newToken) {
    return;
  }
  var self = this;

  fs.writeFile(self.tokenFile, newToken, function(error) {
    if (error) {
      logger.error('Cannot save the token : ' + error);
    } else {
      logger.info('Token file updated');
    }
  });
};

module.exports = TokenService;