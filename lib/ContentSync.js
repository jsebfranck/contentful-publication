'use strict';

var bluebird = require('bluebird'),
  _ = require('lodash'),
  contentful = require('contentful-management'),
  ContentSyncResponse = require('./ContentSyncResponse'),
  ContentSyncClient = require('./ContentSyncClient'),
  fs = require('fs'),
  logger = require('./logger'),
  TokenService = require('./token.service');

var ContentSync = function(syncClient, tokenFile) {
  this.syncClient = syncClient;
  this.tokenService = new TokenService(tokenFile);
  this.resolver = bluebird.pending();
  this.promise = this.resolver.promise;
};

ContentSync.fromConfig = function(config) {
  return new ContentSync(new ContentSyncClient(config.contentful), config.tokenFilename);
};

ContentSync.prototype.run = function() {
  var self = this;

  logger.info('Start contents synchronization');

  var lastSyncToken = self.tokenService.getToken();

  var contentfulClient = contentful.createClient({
    accessToken: self.syncClient.config.contentManagementAccessToken
  });

  return contentfulClient.getSpace(self.syncClient.config.destinationSpace).catch(function(error) {
    logger.error('Could not find Space %s using access token %s ' + error, self.syncClient.config.destinationSpace, self.syncClient.config.contentManagementAccessToken);
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

  request.then(function(rawResponse) {
    var response = new ContentSyncResponse(self.destinationSpace, rawResponse);
    response.handle().then(function() {
      var nextPageUrl = response.nextPageUrl();

      logger.info('Response handled correctly, next page is', nextPageUrl);
      if (nextPageUrl) {
        var nextRequest = self.syncClient.request(nextPageUrl);
        self.handleResponse(nextRequest);
      } else {
        bluebird.map(self.contentService.processPublish(), function (promise) {
          return promise;
        }, {concurrency: 15});
        self.saveNextSyncUrl(response.nextSyncUrl());
      }
    });
  });
};

ContentSync.prototype.saveNextSyncUrl = function(nextSyncUrl) {
  var self = this;
  var fileContent = JSON.stringify({url: nextSyncUrl});

  self.tokenService.setToken(fileContent);
  self.resolver.fulfill();
};

module.exports = ContentSync;
