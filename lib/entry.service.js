'use strict';

var bluebird = require('bluebird'),
  logger = require('./logger'),
  _ = require('lodash');

var EntryService = function(destinationSpace) {
  this.destinationSpace = destinationSpace;
  this.entriesToPublish = [];
};

EntryService.prototype.createOrUpdateEntry = function(data) {
  var deferred = bluebird.pending();

  var self = this;
  var entryType = data.sys.contentType.sys.id;
  var entryId = data.sys.id;

  console.log('Entry service')

  self.destinationSpace.getEntry(entryId).then(function(entry) {
    entry.fields = data.fields;
    return self.destinationSpace.updateEntry(entry);
  }).catch(function() {
    return self.destinationSpace.createEntry(entryType, data);
  }).catch(function(error) {
    deferred.reject(error);
    logger.error('Cannot create/update entry %s : %s', entryId, error);
  }).then(function(entry) {
    self.entriesToPublish.push(entry);
    deferred.fulfill();
  });

  return deferred.promise;
};

EntryService.prototype.deleteEntry = function(data) {
  var deferred = bluebird.pending();
  var self = this;
  var entryId = data.sys.id;

  self.destinationSpace.unpublishEntry(entryId).catch(function () {
    logger.info('Cannot unpublish entry %s', entryId);
  }).then(function () {
    return self.destinationSpace.deleteEntry(entryId);
  }).catch(function () {
    deferred.reject(new Error('Cannot delete entry ' + entryId));
  });

  return deferred.promise;
};

EntryService.prototype.publishAll = function() {
  var self = this;
  return _.map(self.entriesToPublish, function (entry) {
    return self.destinationSpace.publishEntry(entry);
  });
};

module.exports = EntryService;
