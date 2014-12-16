'use strict';

var contentful = require('contentful-management'),
  Q = require('Q'),
  _ = require('lodash'),
  logger = require('./logger');

var ModelSync = function(config) {
  this.config = config.contentful;
};

ModelSync.prototype.createOrUpdateContentType = function(contentType, spaceDestination) {
  var contentTypeId = contentType.sys.id;

  logger.info('Create or update model %s', contentTypeId);

  return spaceDestination.getContentType(contentTypeId).then(function(destinationContentType) {
    destinationContentType.fields = contentType.fields;
    return spaceDestination.updateContentType(destinationContentType);
  }).catch(function() {
    logger.debug('Cannot update, try to create content type');
    return spaceDestination.createContentType(contentType);
  }).then(function(contentType) {
    return spaceDestination.publishContentType(contentType);
  }).catch(function(error) {
    logger.error('Cannot publish content type %s %s', contentTypeId, error);
  });
};

ModelSync.prototype.run = function() {
  var self = this;
  var spaceSource, spaceDestination;

  var contentManagementClient = contentful.createClient({
    accessToken: self.config.contentManagementAccessToken
  });

  logger.info('Start models synchronization');

  return contentManagementClient.getSpace(self.config.destinationSpace)
    .catch(function(error) {
    logger.error('Could not find Space %s using access token %s', self.config.destinationSpace, self.config.contentManagementAccessToken);
    return error;
  }).then(function(space) {
    spaceDestination = space;
    return contentManagementClient.getSpace(self.config.sourceSpace);
  }).catch(function(error) {
    logger.error('Could not find Space %s using access token %s', self.config.sourceSpace, self.config.contentManagementAccessToken);
    return error;
  }).then(function(space) {
    spaceSource = space;
    return spaceSource.getContentTypes();
  }).catch(function(error) {
    logger.error('Could not get content types');
    return error;
  }).then(function(contentTypes) {
     var promises = contentTypes.map(function(contentType) {
       return self.createOrUpdateContentType(contentType, spaceDestination);
     });
     return Q.allSettled(promises);
  }).then(function() {
    logger.info('All content types have been created or updated');
    return Q.resolve();
  });
};

module.exports = ModelSync;
