'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var contentful = require('contentful-management');

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
  }).catch(function () {
    return space.createAsset(self.data);
  }).then(function (asset) {
    return space.publishAsset(asset);
  }).catch(function () {
    console.log('Cannot publish asset', assetId);
  });
};

Item.prototype.processEntryUpdate = function(space) {
  var self = this;
  var entryType = self.data.sys.contentType.sys.id;
  var entryId = self.data.sys.id;

  return space.getEntry(entryId).then(function (entry) {
    entry.fields = self.data.fields;
    return space.updateEntry(entry);
  }).catch(function () {
    return space.createEntry(entryType, self.data);
  }).then(function (entry) {
    return space.publishEntry(entry);
  }).catch(function () {
    console.log('Cannot publish entry', entryId);
  });
};

Item.prototype.processUpdate = function() {
  var resolver = Promise.pending();
  var promise = resolver.promise;
  var self = this;

  var client = contentful.createClient({
    accessToken: self.config.accessTokenDestination
  });

  client.getSpace(self.config.spaceDestination).catch(function(error) {
    console.log('Could not find Space %s using access token %s', self.config.spaceDestination, self.config.accessTokenDestination);
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

  console.log('update ' + self.data.sys.type + ' : ', self.data);
  return promise;
};

Item.prototype.processAssetDeletion = function(space) {
  var self = this;
  var assetId = self.data.sys.id;

  return space.unpublishAsset(assetId).catch(function () {
    console.log('Cannot unpublish asset', assetId);
  }).then(function () {
    return space.deleteAsset(assetId);
  }).catch(function () {
    console.log('Cannot delete asset', assetId);
  });
};

Item.prototype.processEntryDeletion = function(space) {
  var self = this;
  var entryId = self.data.sys.id;

  return space.unpublishEntry(entryId).catch(function () {
    console.log('Cannot unpublish entry', entryId);
  }).then(function () {
    return space.deleteEntry(entryId);
  }).catch(function () {
    console.log('Cannot delete entry', entryId);
  });
};

Item.prototype.processDeletion = function() {
  var resolver = Promise.pending();
  var promise = resolver.promise;
  var self = this;

  var client = contentful.createClient({
    accessToken: self.config.accessTokenDestination
  });

  client.getSpace(self.config.spaceDestination).catch(function(error) {
    console.log('Could not find Space %s using access token %s', self.config.spaceDestination, self.config.accessTokenDestination);
    return error;
  }).then(function(space) {
    if (self.data.sys.type == 'DeletedAsset') {
      return self.processAssetDeletion(space);
    } else if (self.data.sys.type == 'DeletedEntry') {
      return self.processEntryDeletion(space);
    }
  });
  console.log('delete ' + self.data.sys.type + ' : ', self.data);
  resolver.fulfill(self.data);
  return promise;
};

module.exports = Item;
