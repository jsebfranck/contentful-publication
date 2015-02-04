'use strict';

var bluebird = require('bluebird'),
  logger = require('./logger'),
  _ = require('lodash');

var entriesToPublish = [],
  createOrUpdateCount = 0,
  publishedCount = 0,
  deletedCount = 0;
var EntryService = function (destinationSpace) {
  this.destinationSpace = destinationSpace;
};

EntryService.prototype.entriesToPublishCount = function () {
  return entriesToPublish.length;
};
EntryService.prototype.createOrUpdateEntriesCount = function () {
  return createOrUpdateCount;
};
EntryService.prototype.publishedEntriesCount = function () {
  return publishedCount;
};
EntryService.prototype.deletedEntriesCount = function () {
  return deletedCount;
};

EntryService.prototype.createOrUpdateEntry = function (data) {
  var deferred = bluebird.pending();

  var self = this;
  var entryType = data.sys.contentType.sys.id;
  var entryId = data.sys.id;

  self.destinationSpace.getEntry(entryId).then(function (entry) {
    entry.fields = data.fields;
    return self.destinationSpace.updateEntry(entry);

  }).catch(function () {
    logger.debug('Entry %s does not exist yet or cannot be updated', entryId);
    return self.destinationSpace.createEntry(entryType, data);

  }).then(function (entry) {
    logger.info('Created/updated entry %s', entry.sys.id);
    entriesToPublish.push(entry);
    createOrUpdateCount++;
    deferred.resolve();

  }).catch(function (error) {
    logger.error('Cannot create/update entry %s ' + error, entryId);
    deferred.reject(error);
  });

  return deferred.promise;
};

EntryService.prototype.deleteEntry = function (data) {
  var deferred = bluebird.pending();
  var self = this;
  var entryId = data.sys.id;

  logger.debug('Delete entry %s', entryId);

  self.destinationSpace.unpublishEntry(entryId).catch(function () {
    logger.info('Cannot unpublish entry %s', entryId);
  }).then(function () {
    return self.destinationSpace.deleteEntry(entryId);
  }).then(function () {
    deletedCount++;
    deferred.resolve();
  }).catch(function (error) {
    logger.error('Cannot delete entry %s : ' + error, entryId);
    if (error.name === 'NotFound') {
      deferred.resolve();
    } else {
      deferred.reject(error);
    }
  });

  return deferred.promise;
};

EntryService.prototype.publishEntry = function (entry) {
  var self = this;
  var deferred = bluebird.pending();

  self.destinationSpace.publishEntry(entry)
    .then(function () {
      logger.info('Published entry %s', entry.sys.id);
      publishedCount++;
      deferred.resolve();
    }).catch(function (error) {
      logger.error('Can not publish entry %s for reason %s', entry.sys.id, JSON.stringify(error, null, 4));
      deferred.resolve(error);
      entriesToPublish.push(entry);
    });

  return deferred.promise;
};

EntryService.prototype.publishAll = function () {
  logger.info('%s entries are waiting to be published', entriesToPublish.length);

  var self = this;
  var promises = _.map(entriesToPublish, function (entry) {
    return self.publishEntry(entry);
  });
  entriesToPublish = [];
  return promises;
};

module.exports = EntryService;
