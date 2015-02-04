'use strict';

var bluebird = require('bluebird'),
  _ = require('lodash'),
  contentful = require('contentful-management'),
  ContentSyncResponse = require('./ContentSyncResponse'),
  ContentSyncClient = require('./ContentSyncClient'),
  logger = require('./logger'),
  TokenService = require('./token.service'),
  ContentService = require('./content.service');

var defaultDelayValue = 30000;

var ContentSync = function (syncClient, tokenFile) {
  this.syncClient = syncClient;
  this.tokenService = new TokenService(tokenFile);
  this.resolver = bluebird.pending();
  this.promise = this.resolver.promise;
};

ContentSync.fromConfig = function (config) {
  return new ContentSync(new ContentSyncClient(config.contentful), config.tokenFilename);
};

ContentSync.prototype.run = function () {
  var self = this;

  logger.info('Start contents synchronization');
  var lastSyncToken = self.tokenService.getToken();

  var contentfulClient = contentful.createClient({
    accessToken: self.syncClient.config.contentManagementAccessToken
  });

  return contentfulClient.getSpace(self.syncClient.config.destinationSpace).catch(function (error) {
    logger.error('Could not find Space %s using access token %s ' + error, self.syncClient.config.destinationSpace, self.syncClient.config.contentManagementAccessToken);
    return error;
  }).then(function (space) {
    logger.info('Connected to the destination space', space.name);
    self.destinationSpace = space;
    self.contentService = new ContentService(space);
    var request = self.syncClient.request(lastSyncToken.url);
    self.handleResponse(request);
    return self.promise;
  });
};

ContentSync.prototype.publishAllPromise = function () {
  return bluebird.map(this.contentService.processPublish(), function (promise) {
    return promise;
  }, {concurrency: 1});
};

ContentSync.prototype.getDelayConfigValue = function () {
  var delay = this.syncClient.config.publishRetryDelay ? this.syncClient.config.publishRetryDelay : defaultDelayValue;
  delay = Number.isNaN(delay) ? defaultDelayValue : parseInt(delay);
  return delay > 0 ? delay : defaultDelayValue;
};

ContentSync.prototype.handleResponse = function (request) {
  var self = this;
  logger.debug('Processing sync response');

  request.then(function (rawResponse) {
    var response = new ContentSyncResponse(self.destinationSpace, rawResponse);
    response.handle().then(function () {
      var nextPageUrl = response.nextPageUrl();

      if (nextPageUrl) {
        logger.info('Response handled correctly, next page is', nextPageUrl);
        var nextRequest = self.syncClient.request(nextPageUrl);
        self.handleResponse(nextRequest);
      } else {
        logger.info('%s contents added/updated', self.contentService.entryService.createOrUpdateEntriesCount() + self.contentService.assetService.createOrUpdateAssetsCount());
        self.publishAllPromise()
          .then(function () {
            if (self.contentService.entryService.entriesToPublishCount() > 0) {
              var delay = self.getDelayConfigValue();
              logger.info('There is %s entries not published, trying again in %s seconds', self.contentService.entryService.entriesToPublishCount(), delay / 1000);
              return new bluebird(function (resolve, reject) {
                setTimeout(function (){
                  resolve();
                }, delay);
              }).then(function() {
                  logger.info('Start new contents synchronization');
                  return self.publishAllPromise();
              });
            }
          }).then(function () {
            logger.info('%s entries deleted', self.contentService.entryService.deletedEntriesCount());
            logger.info('%s assets deleted', self.contentService.assetService.deletedAssetsCount());
            logger.info('%s entries published', self.contentService.entryService.publishedEntriesCount());
            logger.info('%s assets published', self.contentService.assetService.publishedAssetsCount());
            self.saveNextSyncUrl(response.nextSyncUrl());
          });
      }
    });
  });
};

ContentSync.prototype.saveNextSyncUrl = function (nextSyncUrl) {
  var self = this;
  var fileContent = JSON.stringify({url: nextSyncUrl});

  self.tokenService.setToken(fileContent);
  self.resolver.fulfill();
};

module.exports = ContentSync;
