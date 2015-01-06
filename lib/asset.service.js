'use strict';

var bluebird = require('bluebird'),
  logger = require('./logger');

var AssetService = function(destinationSpace) {
  this.destinationSpace = destinationSpace;
};

AssetService.prototype.createOrUpdateAsset = function(data) {
  var deferred = bluebird.pending();
  var self = this;
  var assetId = data.sys.id;

  logger.debug('Create or update asset %s', assetId);

  self.destinationSpace.getAsset(assetId).then(function(asset) {
    asset.fields = data.fields;
    return self.destinationSpace.updateAsset(asset);
  }).catch(function() {
    return self.destinationSpace.createAsset(data);
  }).catch(function(error) {
    logger.error('Cannot create asset %s : %s', assetId, error);
  }).then(function(asset) {
    return self.destinationSpace.publishAsset(asset);
  }).catch(function(error) {
    logger.error('Cannot publish asset %s : %s', assetId, error);
    deferred.reject(error);
  }).then(function(asset) {
    logger.info('Created/updated asset %s', asset.sys.id);
    deferred.resolve();
  });
  return deferred.promise;
};

AssetService.prototype.deleteAsset = function(data) {
  var deferred = bluebird.pending();
  var self = this;
  var assetId = data.sys.id;

  logger.info('Delete asset %s', assetId);

  self.destinationSpace.unpublishAsset(assetId).catch(function(error) {
    logger.info('Cannot unpublish asset %s ' + error, assetId);
  }).then(function () {
    return self.destinationSpace.deleteAsset(assetId);
  }).catch(function (error) {
    logger.error('Cannot delete asset %s ' + error, assetId);
    deferred.reject(error);
  }).then(function() {
    deferred.resolve();
  });
  return deferred.promise;
};

module.exports = AssetService;
