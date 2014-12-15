'use strict';

var contentful = require('contentful-management'),
  Q = require('Q'),
  _ = require('lodash');

var ModelSync = function(contenfulConfig) {
  this.config = contenfulConfig;
};

ModelSync.prototype.createOrUpdateContentType = function(contentType, spaceDestination) {
  var contentTypeId = contentType.sys.id;

  return spaceDestination.getContentType(contentTypeId).then(function(destinationContentType) {
    destinationContentType.fields = contentType.fields;
    return spaceDestination.updateContentType(destinationContentType);
  }).catch(function() {
    console.log('Cannot update, try to create content type');
    return spaceDestination.createContentType(contentType);
  }).then(function(contentType) {
    return spaceDestination.publishContentType(contentType);
  }).catch(function(error) {
    console.log('Cannot publish content type', contentTypeId, error);
  });
};

ModelSync.prototype.run = function() {
  var self = this;
  var spaceSource, spaceDestination;

  var client = contentful.createClient({
    accessToken: self.config.accessTokenDestination
  });

  return client.getSpace(self.config.spaceDestination)
    .catch(function(error) {
    console.log('Could not find Space %s using access token %s', self.config.spaceDestination, self.config.accessTokenDestination);
    return error;
  }).then(function(space) {
    spaceDestination = space;
    return client.getSpace(self.config.spaceSource);
  }).catch(function(error) {
    console.log('Could not find Space %s using access token %s', self.config.spaceSource, self.config.accessTokenDestination);
    return error;
  }).then(function(space) {
    spaceSource = space;
    return spaceSource.getContentTypes();
  }).catch(function(error) {
    console.log('Could not get content types');
    return error;
  }).then(function(contentTypes) {
     var promises = contentTypes.map(function(contentType) {
       return self.createOrUpdateContentType(contentType, spaceDestination);
     });
     return Q.allSettled(promises);
  }).then(function(results) {
    return Q.resolve('All content types have been created / updated');
  });
};

module.exports = ModelSync;
