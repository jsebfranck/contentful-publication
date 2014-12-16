'use strict';

var questor = require('questor'),
  logger = require('./logger');

var DEFAULT_HOST = 'cdn.contentful.com';

var ContentSyncClient = function(config) {
  this.config = config;
};

ContentSyncClient.prototype.requestOptions = function() {
  var self = this;
  var options = {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + self.config.sourceContentDeliveryToken
    }
  };
  return options;
};

ContentSyncClient.prototype.initialUrl = function() {
  var self = this;
  var host = self.config.host || DEFAULT_HOST;
  var space = self.config.sourceSpace;
  return [
    'https://',
    host,
    '/spaces/',
    space,
    '/sync?initial=true'
  ].join('');
};

ContentSyncClient.prototype.request = function(url) {
  var self = this;
  if (url) {
    logger.debug('Sync URL is %s', url);
    return questor(url, self.requestOptions());
  } else {
    var initialUrl = self.initialUrl();
    logger.debug('Initial Sync URL is %s', initialUrl);
    return questor(initialUrl, self.requestOptions());
  }
};

module.exports = ContentSyncClient;
