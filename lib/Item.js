'use strict';

var _ = require('lodash'),
  Promise = require('bluebird'),
  contentful = require('contentful-management'),
  logger = require('./logger');

var Item = function(contenfulConfig, itemData) {
  this.config = contenfulConfig;
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
    logger.warn('Cannot create asset %s : %s', assetId, error);
  }).then(function(asset) {
    return space.publishAsset(asset);
  }).catch(function(error) {
    logger.warn('Cannot publish asset %s : %s', assetId, error);
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
    logger.warn('Cannot create entry %s : %s', entryId, error);
  }).then(function(entry) {
    return space.publishEntry(entry);
  }).catch(function(error) {
    logger.warn('Cannot publish entry %s : %s', entryId, error);
  });
};

Item.prototype.processUpdate = function() {
  var resolver = Promise.pending();
  var promise = resolver.promise;
  var self = this;

  var client = contentful.createClient({
    accessToken: self.config.destinationAccessToken
  });

  client.getSpace(self.config.destinationSpace).catch(function(error) {
    logger.error('Could not find Space %s using access token %s', self.config.destinationSpace, self.config.destinationAccessToken);
    return error;
  }).then(function(space) {
    if (self.data.sys.type == 'Asset') {
      return self.processAssetUpdate(space);

    } else if (self.data.sys.type == 'Entry') {
      return self.processEntryUpdate(space);
    }
  }).then(function(obj) {
    resolver.fulfill(obj);
  });

  logger.info('update ' + self.data.sys.type + ' : ', self.data);
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
  var resolver = Promise.pending();
  var promise = resolver.promise;
  var self = this;

  var client = contentful.createClient({
    accessToken: self.config.destinationAccessToken
  });

  client.getSpace(self.config.destinationSpace).catch(function(error) {
    logger.error('Could not find Space %s using access token %s', self.config.destinationSpace, self.config.destinationAccessToken);
    return error;
  }).then(function(space) {
    if (self.data.sys.type == 'DeletedAsset') {
      return self.processAssetDeletion(space);
    } else if (self.data.sys.type == 'DeletedEntry') {
      return self.processEntryDeletion(space);
    }
  }).then(function(obj) {
    resolver.fulfill(obj);
  });
  logger.info('delete ' + self.data.sys.type + ' : ', self.data);
  return promise;
};

module.exports = Item;
