'use strict';

var AssetService = require('./asset.service'),
  EntryService = require('./entry.service'),
  bluebird = require('bluebird');

var ContentService = function(destinationSpace) {
  this.entryService = new EntryService(destinationSpace);
  this.assetService = new AssetService(destinationSpace);
};

ContentService.prototype.processContent = function(data) {
  var self = this;

  switch (data.sys.type) {
    case 'Entry':
      return self.entryService.createOrUpdateEntry(data);
    case 'Asset':
      return self.assetService.createOrUpdateAsset(data);
    case 'DeletedEntry':
      return self.entryService.deleteEntry(data);
    case 'DeletedAsset':
      return self.assetService.deleteAsset(data);
    default:
      return bluebird.reject('Undefined type');
  }
};

ContentService.prototype.processPublish = function() {
  return this.entryService.publishAll();
};

module.exports = ContentService;
