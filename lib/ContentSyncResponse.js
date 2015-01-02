'use strict';

var bluebird = require('bluebird');
var _ = require('lodash');
var ContentService = require('./content.service');

var ContentSyncResponse = function(destinationSpace, response) {
  this.contentService = new ContentService(destinationSpace);
  this.payload = JSON.parse(response.body);
  this.resolver = bluebird.pending();
  this.promise = this.resolver.promise;
};

ContentSyncResponse.prototype.handle = function() {
  var self = this;

  var contentPromises = _.map(self.payload.items, function(content) {
    return self.contentService.processContent(content);
  });

  bluebird.settle(contentPromises).then(function() {
    self.resolver.fulfill();
  }).catch(function(error) {
    self.resolver.reject(error);
  });

  return self.promise;
};

/*
exports.limitConcurrency = function(promiseFactory, limit) {
  var running = 0,
    semaphore;

  function scheduleNextJob() {
    if (running < limit) {
      running++;
      return new Q();
    }

    if (!semaphore) {
      semaphore = Q.defer();
    }

    return semaphore.promise
      .finally(scheduleNextJob);
  }

  function processScheduledJobs() {
    running--;

    if (semaphore && running < limit) {
      semaphore.resolve();
      semaphore = null;
    }
  }

  return function () {
    var _this = this,
      args = arguments;

    function runJob() {
      return promiseFactory.apply(_this, args);
    }

    return scheduleNextJob()
      .then(runJob)
      .finally(processScheduledJobs);
  };
};*/

ContentSyncResponse.prototype.nextPageUrl = function() {
  var self = this;
  return self.payload.nextPageUrl;
};

ContentSyncResponse.prototype.nextSyncUrl = function() {
  var self = this;
  return self.payload.nextSyncUrl;
};

module.exports = ContentSyncResponse;
