'use strict';

var bluebird = require('bluebird'),
  logger = require('./logger');

var Item = function(destinationSpace, itemData) {
  this.destinationSpace = destinationSpace;
  this.data = itemData;
};

Item.prototype.type = function() {
  return this.data.sys.type;
};

Item.prototype.process = function() {
  var self = this;
  var type = self.data.sys.type;
  if (type === 'Entry' || type === 'Asset') {
    return self.processUpdate();
  } else if (type === 'DeletedEntry' || type === 'DeletedAsset') {
    return self.processDeletion();
  } else {
    throw('unknown type ' + type);
  }
};

Item.prototype.processAssetUpdate = function(space) {
  var self = this;
  var assetId = self.data.sys.id;

  return space.getAsset(assetId).then(function(asset) {
    asset.fields = self.data.fields;
    return space.updateAsset(asset);
  }).catch(function() {
    return space.createAsset(self.data);
  }).catch(function(error) {
    logger.error('Cannot create asset %s : %s', assetId, error);
  }).then(function(asset) {
    return space.publishAsset(asset);
  }).catch(function() {
    logger.error('Cannot publish asset %s : %s', assetId);
  });
};

Item.prototype.processEntryUpdate = function(space) {
  var self = this;
  var entryType = self.data.sys.contentType.sys.id;
  var entryId = self.data.sys.id;

  return space.getEntry(entryId).then(function(entry) {
    entry.fields = self.data.fields;
    return space.updateEntry(entry);
  }).catch(function() {
    return space.createEntry(entryType, self.data);
  }).catch(function(error) {
    logger.error('Cannot create entry %s : %j', entryId, error);
  }).then(function(entry) {
    return space.publishEntry(entry);
  }).catch(function() {
    logger.error('Cannot publish entry %s', entryId);
  });
};

Item.prototype.processUpdate = function() {
  var self = this;
  var resolver = bluebird.pending();
  var promise = resolver.promise;

  if (self.data.sys.type === 'Asset') {
    self.processAssetUpdate(self.destinationSpace).then(function(obj) {
      resolver.fulfill(obj);
    });
  } else if (self.data.sys.type === 'Entry') {
    self.processEntryUpdate(self.destinationSpace).then(function(obj) {
      resolver.fulfill(obj);
    });
  }

  logger.debug('update ' + self.data.sys.type + ' : ', self.data.sys.id);
  return promise;
};

Item.prototype.processAssetDeletion = function(space) {
  var self = this;
  var assetId = self.data.sys.id;

  return space.unpublishAsset(assetId).catch(function () {
    logger.info('Cannot unpublish asset %s', assetId);
  }).then(function () {
    return space.deleteAsset(assetId);
  }).catch(function () {
    logger.error('Cannot delete asset %s', assetId);
  });
};

Item.prototype.processEntryDeletion = function(space) {
  var self = this;
  var entryId = self.data.sys.id;

  return space.unpublishEntry(entryId).catch(function () {
    logger.info('Cannot unpublish entry %s', entryId);
  }).then(function () {
    return space.deleteEntry(entryId);
  }).catch(function () {
    logger.error('Cannot delete entry %s', entryId);
  });
};

Item.prototype.processDeletion = function() {
  var self = this;
  var resolver = bluebird.pending();
  var promise = resolver.promise;

  if (self.data.sys.type === 'DeletedAsset') {
    self.processAssetDeletion(self.destinationSpace).then(function(obj) {
      resolver.fulfill(obj);
    });
  } else if (self.data.sys.type === 'DeletedEntry') {
    self.processEntryDeletion(self.destinationSpace).then(function(obj) {
      resolver.fulfill(obj);
    });
  }

  logger.info('delete ' + self.data.sys.type + ' : ', self.data);
  return promise;
};

module.exports = Item;
