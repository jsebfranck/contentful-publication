'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var Item = require('./Item');

var SyncResponse = function(contenfulConfig, response) {
  this.contenfulConfig = contenfulConfig;
  this.payload = JSON.parse(response.body);
  this.resolver = Promise.pending();
  this.promise = this.resolver.promise;
  this.statistics = {};
};

SyncResponse.prototype.items = function() {
  var self = this;
  return _.map(self.payload.items, function(item) {
    return new Item(self.contenfulConfig, item);
  });
};

SyncResponse.prototype.handle = function() {
  var self = this;
  self.processQueue = self.items();
  self.consumeQueue();
  return self.promise;
};

SyncResponse.prototype.consumeQueue = function() {
  var self = this;
  var currentItem = self.processQueue.pop();
  if (currentItem) {
    currentItem.process().then(function() {
      var type = currentItem.type();
      if (self.statistics[type]) {
        self.statistics[type] += 1;
      } else {
        self.statistics[type] = 1;
      }
      self.consumeQueue();
    });
  } else {
    self.resolver.fulfill(self.statistics);
  }
};

SyncResponse.prototype.nextPageUrl = function() {
  var self = this;
  return self.payload.nextPageUrl;
};

SyncResponse.prototype.nextSyncUrl = function() {
  var self = this;
  return self.payload.nextSyncUrl;
};

module.exports = SyncResponse;
