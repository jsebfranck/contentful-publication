'use strict';

var bluebird = require('bluebird');
var _ = require('lodash');
var Item = require('./Item');

var ContentSyncResponse = function(destinationSpace, response) {
  this.destinationSpace = destinationSpace;
  this.payload = JSON.parse(response.body);
  this.resolver = bluebird.pending();
  this.promise = this.resolver.promise;
  this.statistics = {};
};

ContentSyncResponse.prototype.items = function() {
  var self = this;
  return _.map(self.payload.items, function(item) {
    return new Item(self.destinationSpace, item);
  });
};

ContentSyncResponse.prototype.handle = function() {
  var self = this;
  self.processQueue = self.items();
  self.consumeQueue();
  return self.promise;
};

ContentSyncResponse.prototype.consumeQueue = function() {
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

ContentSyncResponse.prototype.nextPageUrl = function() {
  var self = this;
  return self.payload.nextPageUrl;
};

ContentSyncResponse.prototype.nextSyncUrl = function() {
  var self = this;
  return self.payload.nextSyncUrl;
};

module.exports = ContentSyncResponse;
