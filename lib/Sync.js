'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var SyncResponse = require('./SyncResponse');
var SyncClient = require('./SyncClient');
var tokenFile = 'lastSyncToken.json';
var fs = require('fs');

var SYNC_URL_ID = 'CF_contentful_syncurl';

var Sync = function(syncClient) {
  this.syncClient = syncClient;
  this.resolver = Promise.pending();
  this.statistics = {
    requests: 0,
    items: 0,
  };
  this.promise = this.resolver.promise;
};

Sync.fromConfig = function(config) {
  return new Sync(new SyncClient(config.contentful));
};

Sync.prototype.run = function() {
  var self = this;

  //TODO read last sync token from S3
  var lastSyncToken = {}; //JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  var request = self.syncClient.request(lastSyncToken.url);
  self.handleResponse(request);
  return self.promise;
};

Sync.prototype.handleResponse = function(request) {
  var self = this;
  if (self.verbose) {
    console.log('processing sync response');
  }
  self.statistics.requests += 1;
  request.then(function(rawResponse) {
    var response = new SyncResponse(self.syncClient.config, rawResponse);
    response.handle().then(function(requestStatistics) {
      var nextPageUrl = response.nextPageUrl();
      self.statistics.items += _.reduce(requestStatistics, function(total, number) {return total + number;
                                                                            }, 0);
      if (self.verbose) {
        console.log([
          'processed',
          self.statistics.items,
          'items'
        ].join(' '));
      }
      if (nextPageUrl) {
        var nextRequest = self.syncClient.request(nextPageUrl);
        self.handleResponse(nextRequest);
      } else {
        self.saveNextSyncUrl(response.nextSyncUrl());
      }
    });
  });
};

Sync.prototype.saveNextSyncUrl = function(nextSyncUrl) {
  var self = this;
  var fileContent = JSON.stringify({url: nextSyncUrl});

  self.resolver.fulfill();

  //TODO Add nextSyncUrl file in S3

  /*fs.writeFile(tokenFile, fileContent, function(err) {
    console.log(fileContent);
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + tokenFile);
    }

    console.log('will fulfill');
    self.resolver.fulfill();
  });*/
};

module.exports = Sync;
