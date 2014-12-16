'use strict';

var Promise = require('bluebird'),
  _ = require('lodash'),
  contentful = require('contentful-management'),
  ContentSyncResponse = require('./ContentSyncResponse'),
  ContentSyncClient = require('./ContentSyncClient'),
  fs = require('fs'),
  logger = require('./logger');

var ContentSync = function(syncClient, tokenFile) {
  this.syncClient = syncClient;
  this.tokenFile = tokenFile;
  this.resolver = Promise.pending();
  this.statistics = {
    requests: 0,
    items: 0
  };
  this.promise = this.resolver.promise;
};

ContentSync.fromConfig = function(config) {
  return new ContentSync(new ContentSyncClient(config.contentful), config.tokenFilename);
};

ContentSync.prototype.run = function() {
  var self = this;

  logger.info('Start contents synchronization');

  var lastSyncToken;
  try {
    lastSyncToken = JSON.parse(fs.readFileSync(self.tokenFile, 'utf8'));
  } catch (error) {
    logger.warn('Cannot read token file %s : %s', self.tokenFile, error);
    lastSyncToken = {};
  }

  var contentfulClient = contentful.createClient({
    accessToken: self.syncClient.config.contentManagementAccessToken
  });

  return contentfulClient.getSpace(self.syncClient.config.destinationSpace).catch(function(error) {
    logger.error('Could not find Space %s using access token %s', self.syncClient.config.destinationSpace, self.syncClient.config.contentManagementAccessToken);
    return error;
  }).then(function(space) {
    self.destinationSpace = space;

    var request = self.syncClient.request(lastSyncToken.url);
    self.handleResponse(request);
    return self.promise;
  });
};

ContentSync.prototype.handleResponse = function(request) {
  var self = this;
  logger.debug('Processing sync response');
  self.statistics.requests += 1;

  request.then(function(rawResponse) {
    var response = new ContentSyncResponse(self.destinationSpace, rawResponse);
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

ContentSync.prototype.saveNextSyncUrl = function(nextSyncUrl) {
  var self = this;
  var fileContent = JSON.stringify({url: nextSyncUrl});

  fs.writeFile(self.tokenFile, fileContent, function(err) {
    if (err) {
      logger.error(err);
    } else {
      logger.debug('New sync URL is %s', nextSyncUrl);
    }

    self.resolver.fulfill();
  });
};

module.exports = ContentSync;
