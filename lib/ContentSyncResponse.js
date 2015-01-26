'use strict';

var bluebird = require('bluebird');
var _ = require('lodash');
var logger = require('./logger');
var ContentService = require('./content.service');

var ContentSyncResponse = function (destinationSpace, response) {
  this.contentService = new ContentService(destinationSpace);
  this.payload = JSON.parse(response.body);
  this.resolver = bluebird.pending();
  this.promise = this.resolver.promise;
};

ContentSyncResponse.prototype.handle = function () {
  var self = this;

  logger.info('Handle new response');

  var contentPromises = _.map(self.payload.items, function (content) {
    return self.contentService.processContent(content);
  });
  
  bluebird.map(contentPromises, function (promise) {
    return promise;
  }, {concurrency: 2}).catch(function (error) {
    self.resolver.reject(error);
  }).then(function () {
    logger.info('%s contents added/updated', self.contentService.entryService.createOrUpdateEntriesCount() + self.contentService.assetService.createOrUpdateAssetsCount());
    self.resolver.fulfill();
  }).catch(function (error) {
    logger.error('Error handling response : ' + error);
    self.resolver.reject(error);
  });

  return self.promise;
};

ContentSyncResponse.prototype.nextPageUrl = function () {
  return this.payload.nextPageUrl;
};

ContentSyncResponse.prototype.nextSyncUrl = function () {
  return this.payload.nextSyncUrl;
};

module.exports = ContentSyncResponse;
