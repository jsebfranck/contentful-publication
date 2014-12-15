'use strict';

var Promise = require('bluebird'),
  _ = require('lodash'),
  SyncResponse = require('./SyncResponse'),
  SyncClient = require('./SyncClient'),
  fs = require('fs'),
  logger = require('./logger');

var tokenFile = 'lastSyncToken.json';

var Sync = function(syncClient) {
  this.syncClient = syncClient;
  this.resolver = Promise.pending();
  this.statistics = {
    requests: 0,
    items: 0
  };
  this.promise = this.resolver.promise;
};

Sync.fromConfig = function(config) {
  return new Sync(new SyncClient(config.contentful));
};

Sync.prototype.run = function() {
  var self = this;

  logger.info('Start contents synchronization');
  var lastSyncToken = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  var request = self.syncClient.request(lastSyncToken.url);
  self.handleResponse(request);
  return self.promise;
};

Sync.prototype.handleResponse = function(request) {
  var self = this;
  logger.debug('Processing sync response');
  self.statistics.requests += 1;

  request.then(function(rawResponse) {
    var response = new SyncResponse(self.syncClient.config, rawResponse);
    response.handle().then(function(requestStatistics) {
      var nextPageUrl = response.nextPageUrl();
      self.statistics.items += _.reduce(requestStatistics, function(total, number) {
        return total + number;
      }, 0);

      logger.info('Processed %s items', self.statistics.items);

      if (nextPageUrl) {
        var nextRequest = self.syncClient.request(nextPageUrl);
        self.handleResponse(nextRequest);
      } else {
        self.saveNextSyncUrl(response.nextSyncUrl());
      }
    });
  });
};

Sync.prototype.saveNextSyncUrl = function(nextSyncUrl) {
  var self = this;
  var fileContent = JSON.stringify({url: nextSyncUrl});

  fs.writeFile(tokenFile, fileContent, function(err) {
    if (err) {
      logger.error(err);
    } else {
      logger.debug('New sync URL is %s', nextSyncUrl);
    }

    self.resolver.fulfill();
  });
};

module.exports = Sync;
