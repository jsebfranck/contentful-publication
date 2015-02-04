'use strict';

var bluebird = require('bluebird'),
  logger = require('./logger');

var createOrUpdateCount = 0,
  publishedCount = 0,
  deletedCount = 0;
var AssetService = function (destinationSpace) {
  this.destinationSpace = destinationSpace;
};

AssetService.prototype.createOrUpdateAssetsCount = function () {
  return createOrUpdateCount;
};
AssetService.prototype.publishedAssetsCount = function () {
  return publishedCount;
};
AssetService.prototype.deletedAssetsCount = function () {
  return deletedCount;
};

AssetService.prototype.createOrUpdateAsset = function (data) {
  var deferred = bluebird.pending();
  var self = this;
  var assetId = data.sys.id;

  logger.debug('Create or update asset %s', assetId);

  self.destinationSpace.getAsset(assetId).then(function (asset) {
    asset.fields = data.fields;
    return self.destinationSpace.updateAsset(asset);

  }).catch(function () {
    return self.destinationSpace.createAsset(data);

  }).catch(function (error) {
    logger.error('Cannot create asset %s : %s', assetId, error);

  }).then(function (asset) {
    createOrUpdateCount++;
    return self.destinationSpace.publishAsset(asset);

  }).then(function () {
    logger.info('Created/updated asset %s', assetId);
    publishedCount++;
    deferred.resolve();

  }).catch(function (error) {
    logger.error('Cannot publish asset %s : ' + error, assetId);
    deferred.reject(error);
  });

  return deferred.promise;
};

AssetService.prototype.deleteAsset = function (data) {
  var deferred = bluebird.pending();
  var self = this;
  var assetId = data.sys.id;

  logger.info('Delete asset %s', assetId);

  self.destinationSpace.unpublishAsset(assetId).catch(function (error) {
    logger.info('Cannot unpublish asset %s ' + error, assetId);

  }).then(function () {
    return self.destinationSpace.deleteAsset(assetId);

  }).then(function () {
    deletedCount++;
    deferred.resolve();

  }).catch(function (error) {
    logger.error('Cannot delete asset %s ' + error, assetId);
    if (error.name === 'NotFound') {
      deferred.resolve();
    } else {
      deferred.reject(error);
    }
  });

  return deferred.promise;
};

module.exports = AssetService;
