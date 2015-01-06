'use strict';

var bluebird = require('bluebird'),
  logger = require('./logger'),
  _ = require('lodash');

var entriesToPublish = [];
var EntryService = function(destinationSpace) {
  this.destinationSpace = destinationSpace;
};

EntryService.prototype.createOrUpdateEntry = function(data) {
  var deferred = bluebird.pending();

  var self = this;
  var entryType = data.sys.contentType.sys.id;
  var entryId = data.sys.id;

  self.destinationSpace.getEntry(entryId).then(function(entry) {
    entry.fields = data.fields;
    return self.destinationSpace.updateEntry(entry);

  }).catch(function() {
    logger.debug('Entry %s does not exist yet or cannot be updated', entryId);
    return self.destinationSpace.createEntry(entryType, data);

  }).then(function(entry) {
    logger.info('Created/updated entry %s', entry.sys.id);
    entriesToPublish.push(entry);
    deferred.resolve();

  }).catch(function(error) {
    logger.error('Cannot create/update entry %s ' + error, entryId);
    deferred.reject(error);
  });

  return deferred.promise;
};

EntryService.prototype.deleteEntry = function(data) {
  var deferred = bluebird.pending();
  var self = this;
  var entryId = data.sys.id;

  logger.info('Delete entry %s', entryId);

  self.destinationSpace.unpublishEntry(entryId).catch(function () {
    logger.info('Cannot unpublish entry %s', entryId);
  }).then(function () {
    return self.destinationSpace.deleteEntry(entryId);
  }).then(function() {
    deferred.resolve();
  }).catch(function (error) {
    logger.error('Cannot delete entry %s : ' + error, entryId);
    deferred.reject(error);
  });

  return deferred.promise;
};

EntryService.prototype.publishEntry = function(entry) {
  var self = this;
  var deferred = bluebird.pending();

  self.destinationSpace.publishEntry(entry).then(function() {
    logger.info('Published entry %s', entry.sys.id);
    deferred.resolve();
  }).catch(function(error) {
    deferred.reject(error);
  });

  return deferred.promise;
};

EntryService.prototype.publishAll = function() {
  logger.info('Publish all entries');

  var self = this;
  var promises = _.map(entriesToPublish, function (entry, index) {
    return self.destinationSpace.publishEntry(entry);
  });
  entriesToPublish = [];
  return promises;
};

module.exports = EntryService;
