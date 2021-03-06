'use strict';

var nock = require('nock'),
  fs = require('fs'),
  testHelper = require('./testHelper'),
  ContentSync = testHelper.requireModule('ContentSync');

describe('Content publication', function () {

  this.timeout(10000);
  var config = {
    "tokenFilename": 'lastSyncTokenTest.json',
    "contentful": {
      "sourceSpace": "SPACE_SRC",
      "sourceContentDeliveryToken": "SRC_DELIVERY_TOKEN",
      "destinationSpace": "SPACE_DEST",
      "contentManagementAccessToken": "CONTENT_MGT_TOKEN",
      "publishRetryDelay": 1000
    }
  };

  var createEmptyTokenFile = function () {
    fs.writeFileSync(config.tokenFilename, JSON.stringify({}));
  };

  var createTokenFileWithToken = function () {
    fs.writeFileSync(config.tokenFilename, JSON.stringify({ url: 'https://cdn.contentful.com:443/spaces/SPACE_SRC/sync?sync_token=SYNC_TOKEN' }));
  };

  var contentfulCdnNock, contentfulApiNock;

  //nock.recorder.rec();
  nock.disableNetConnect();

  beforeEach(function () {
    createEmptyTokenFile();
    contentfulCdnNock = nock('https://cdn.contentful.com:443');
    contentfulApiNock = nock('https://api.contentful.com:443');
  });

  var executeSync = function(done) {
    var sync = ContentSync.fromConfig(config);
    sync.verbose = true;
    sync.run().then(function () {
      contentfulCdnNock.done();
      contentfulApiNock.done();
      done();
    }).catch(function (err) {
      done(err);
    });
  };

  var expectToGetSourceItemsWithInitialSync = function(items) {
    contentfulCdnNock.get('/spaces/SPACE_SRC/sync?initial=true')
      .reply(200, {"sys": {"type": "Array"}, "items": items,
        "nextSyncUrl": "https://cdn.contentful.com/spaces/SPACE_SRC/sync?sync_token=NEXT-SYNC-TOKEN"});
  };
  var expectToGetSourceItemsWithInitialSyncAndPageUrl = function (items) {
    contentfulCdnNock.get('/spaces/SPACE_SRC/sync?initial=true')
      .reply(200, {"sys": {"type": "Array"}, "items": items,
        "nextPageUrl": "https://cdn.contentful.com/spaces/SPACE_SRC/sync?sync_token=NEXT-SYNC-TOKEN&access_token=SRC_DELIVERY_TOKEN"});
  };

  var expectToGetSourceItemsWithExistingSyncAndPageUrl = function(items) {
    contentfulCdnNock.get('/spaces/SPACE_SRC/sync?sync_token=NEXT-SYNC-TOKEN&access_token=SRC_DELIVERY_TOKEN')
      .reply(200, {"sys": {"type": "Array"}, "items": items,
        "nextSyncUrl": "https://cdn.contentful.com/spaces/SPACE_SRC/sync?sync_token=NEXT-SYNC-TOKEN&access_token=SRC_DELIVERY_TOKEN"});
  };

  var expectToGetSourceItemsWithExistingSync = function (items, syncToken) {
    syncToken = syncToken ? syncToken : 'SYNC_TOKEN';
    contentfulCdnNock.get('/spaces/SPACE_SRC/sync?sync_token=' + syncToken)
      .reply(200, {"sys": {"type": "Array"}, "items": items,
        "nextSyncUrl": "https://cdn.contentful.com/spaces/SPACE_SRC/sync?sync_token=NEW-SYNC-TOKEN"});
  };

  var expectToGetDestinationSpace = function() {
    contentfulApiNock.get('/spaces/SPACE_DEST?access_token=CONTENT_MGT_TOKEN')
      .reply(200, {"sys": {"type": "Space", "id": "SPACE_DEST", "version": 1, "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "createdAt": "2014-12-02T15:46:22Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "updatedAt": "2014-12-02T15:46:22Z"}, "name": "Xebia2"});
  };

  describe('for all contents', function() {
    it('should do nothing if there are no contents to synchronize', function (done) {
      expectToGetSourceItemsWithInitialSync([]);
      executeSync(done);
    });

    it('should process contents with two sync requests', function (done) {
      var entryFields1 = {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}};
      expectToGetSourceItemsWithInitialSyncAndPageUrl([
        {"sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "type": "Entry", "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "id": "ENTRY-ID", "revision": 1, "createdAt": "2014-12-04T14:13:50.630Z", "updatedAt": "2014-12-04T14:13:50.630Z"},
          "fields": entryFields1}
      ]);
      expectToGetDestinationSpace();

      contentfulApiNock.get('/spaces/SPACE_DEST/entries/ENTRY-ID?access_token=CONTENT_MGT_TOKEN')
        .reply(404, {"sys": {"type": "Error", "id": "NotFound"}, "message": "The resource could not be found.", "details": {"type": "Entry", "space": "SPACE_DEST", "id": "ENTRY-ID"}});

      contentfulApiNock.put('/spaces/SPACE_DEST/entries/ENTRY-ID?access_token=CONTENT_MGT_TOKEN', {"fields": entryFields1})
        .reply(201, {"fields": entryFields1, "sys": {"id": "ENTRY-ID", "type": "Entry", "version": 1, "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "updatedAt": "2014-12-04T14:16:58.522Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.put('/spaces/SPACE_DEST/entries/ENTRY-ID/published?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": entryFields1, "sys": {"id": "ENTRY-ID", "type": "Entry", "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "version": 2, "updatedAt": "2014-12-04T14:16:59.193Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "firstPublishedAt": "2014-12-04T14:16:59.193Z", "publishedCounter": 1, "publishedAt": "2014-12-04T14:16:59.193Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 1}});

      var entryFields2 = {"contentfulTitle": {"en-US": "11"}, "message": {"en-US": "22"}, "number": {"en-US": 33}, "text": {"en-US": "44"}};
      expectToGetSourceItemsWithExistingSyncAndPageUrl([
        {"sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "type": "Entry", "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "id": "ENTRY-ID2", "revision": 1, "createdAt": "2014-12-04T14:13:50.630Z", "updatedAt": "2014-12-04T14:13:50.630Z"},
          "fields": entryFields2}
      ]);

      contentfulApiNock.get('/spaces/SPACE_DEST/entries/ENTRY-ID2?access_token=CONTENT_MGT_TOKEN')
        .reply(404, {"sys": {"type": "Error", "id": "NotFound"}, "message": "The resource could not be found.", "details": {"type": "Entry", "space": "SPACE_DEST", "id": "ENTRY-ID2"}});

      contentfulApiNock.put('/spaces/SPACE_DEST/entries/ENTRY-ID2?access_token=CONTENT_MGT_TOKEN', {"fields": entryFields2})
        .reply(201, {"fields": entryFields2, "sys": {"id": "ENTRY-ID2", "type": "Entry", "version": 1, "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "updatedAt": "2014-12-04T14:16:58.522Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.put('/spaces/SPACE_DEST/entries/ENTRY-ID2/published?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": entryFields2, "sys": {"id": "ENTRY-ID2", "type": "Entry", "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "version": 2, "updatedAt": "2014-12-04T14:16:59.193Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "firstPublishedAt": "2014-12-04T14:16:59.193Z", "publishedCounter": 1, "publishedAt": "2014-12-04T14:16:59.193Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 1}});

      executeSync(done);

    });

    it('should process one entry and one asset', function (done) {
      expectToGetSourceItemsWithInitialSync([
        {"sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "type": "Entry", "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "id": "ENTRY-ID", "revision": 1, "createdAt": "2014-12-04T14:13:50.630Z", "updatedAt": "2014-12-04T14:13:50.630Z"}, "fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}},
          {"fields": {"file": {"en-US": {"fileName": "add_directory_icon.svg", "contentType": "image/svg+xml", "details": {"size": 984}, "url": "//assets.contentful.com/SPACE_SRC/ASSET-ID/1365a0d50dbb810b731a815c9a579ad0/add_directory_icon.svg"}}, "title": {"en-US": "add directory icon"}}, "sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "type": "Asset", "id": "ASSET-ID", "revision": 1, "createdAt": "2014-12-04T16:46:25.594Z", "updatedAt": "2014-12-04T16:46:25.594Z"}}
      ]);

      expectToGetDestinationSpace();

      contentfulApiNock.get('/spaces/SPACE_DEST/entries/ENTRY-ID?access_token=CONTENT_MGT_TOKEN')
        .reply(404, {"sys": {"type": "Error", "id": "NotFound"}, "message": "The resource could not be found.", "details": {"type": "Entry", "space": "SPACE_DEST", "id": "ENTRY-ID"}});

      contentfulApiNock.put('/spaces/SPACE_DEST/entries/ENTRY-ID?access_token=CONTENT_MGT_TOKEN', {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}})
        .reply(201, {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "ENTRY-ID", "type": "Entry", "version": 1, "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "updatedAt": "2014-12-04T14:16:58.522Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.put('/spaces/SPACE_DEST/entries/ENTRY-ID/published?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "ENTRY-ID", "type": "Entry", "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "version": 2, "updatedAt": "2014-12-04T14:16:59.193Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "firstPublishedAt": "2014-12-04T14:16:59.193Z", "publishedCounter": 1, "publishedAt": "2014-12-04T14:16:59.193Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 1}});

      contentfulApiNock.get('/spaces/SPACE_DEST/assets/ASSET-ID?access_token=CONTENT_MGT_TOKEN')
        .reply(404, {"sys": {"type": "Error", "id": "NotFound"}, "message": "The resource could not be found.", "details": {"type": "Asset", "space": "SPACE_DEST", "id": "ASSET-ID"}});

      contentfulApiNock.put('/spaces/SPACE_DEST/assets/ASSET-ID?access_token=CONTENT_MGT_TOKEN', {"fields": {"file": {"en-US": {"fileName": "add_directory_icon.svg", "contentType": "image/svg+xml", "details": {"size": 984}, "url": "//assets.contentful.com/SPACE_SRC/ASSET-ID/1365a0d50dbb810b731a815c9a579ad0/add_directory_icon.svg"}}, "title": {"en-US": "add directory icon"}}, "sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "type": "Asset", "id": "ASSET-ID", "revision": 1, "createdAt": "2014-12-04T16:46:25.594Z", "updatedAt": "2014-12-04T16:46:25.594Z"}})
        .reply(201, {"fields": {"file": {"en-US": {"fileName": "add_directory_icon.svg", "contentType": "image/svg+xml", "details": {"size": 984}, "url": "//assets.contentful.com/SPACE_SRC/ASSET-ID/1365a0d50dbb810b731a815c9a579ad0/add_directory_icon.svg"}}, "title": {"en-US": "add directory icon"}}, "sys": {"id": "ASSET-ID", "type": "Asset", "version": 1, "createdAt": "2014-12-04T16:47:12.954Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "updatedAt": "2014-12-04T16:47:12.954Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.put('/spaces/SPACE_DEST/assets/ASSET-ID/published?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": {"file": {"en-US": {"fileName": "add_directory_icon.svg", "contentType": "image/svg+xml", "details": {"size": 984}, "url": "//assets.contentful.com/SPACE_SRC/ASSET-ID/1365a0d50dbb810b731a815c9a579ad0/add_directory_icon.svg"}}, "title": {"en-US": "add directory icon"}}, "sys": {"id": "ASSET-ID", "type": "Asset", "createdAt": "2014-12-04T16:47:12.954Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "version": 2, "updatedAt": "2014-12-04T16:47:13.693Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "firstPublishedAt": "2014-12-04T16:47:13.693Z", "publishedCounter": 1, "publishedAt": "2014-12-04T16:47:13.693Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 1}});

      executeSync(done);
    });
  });

  describe('for entries', function() {
    it('should add new entry to the unsynchronized space', function (done) {
      expectToGetSourceItemsWithInitialSync([
        {"sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "type": "Entry", "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "id": "ENTRY_ID", "revision": 1, "createdAt": "2014-12-04T14:13:50.630Z", "updatedAt": "2014-12-04T14:13:50.630Z"},
          "fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}}
      ]);

      expectToGetDestinationSpace();

      contentfulApiNock.get('/spaces/SPACE_DEST/entries/ENTRY_ID?access_token=CONTENT_MGT_TOKEN')
        .reply(404, {"sys": {"type": "Error", "id": "NotFound"}, "message": "The resource could not be found.", "details": {"type": "Entry", "space": "SPACE_DEST", "id": "ENTRY_ID"}});

      contentfulApiNock.put('/spaces/SPACE_DEST/entries/ENTRY_ID?access_token=CONTENT_MGT_TOKEN', {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}})
        .reply(201, {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "ENTRY_ID", "type": "Entry", "version": 1, "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "updatedAt": "2014-12-04T14:16:58.522Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.put('/spaces/SPACE_DEST/entries/ENTRY_ID/published?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "ENTRY_ID", "type": "Entry", "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "version": 2, "updatedAt": "2014-12-04T14:16:59.193Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "firstPublishedAt": "2014-12-04T14:16:59.193Z", "publishedCounter": 1, "publishedAt": "2014-12-04T14:16:59.193Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 1}});

      executeSync(done);
    });

    it('should add new entry to the unsynchronized space with the second publish action', function (done) {
      expectToGetSourceItemsWithInitialSync([
        {"sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "type": "Entry", "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "id": "ENTRY_ID", "revision": 1, "createdAt": "2014-12-04T14:13:50.630Z", "updatedAt": "2014-12-04T14:13:50.630Z"},
          "fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}}
      ]);

      expectToGetDestinationSpace();

      contentfulApiNock.get('/spaces/SPACE_DEST/entries/ENTRY_ID?access_token=CONTENT_MGT_TOKEN')
        .reply(404, {"sys": {"type": "Error", "id": "NotFound"}, "message": "The resource could not be found.", "details": {"type": "Entry", "space": "SPACE_DEST", "id": "ENTRY_ID"}});

      contentfulApiNock.put('/spaces/SPACE_DEST/entries/ENTRY_ID?access_token=CONTENT_MGT_TOKEN', {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}})
        .reply(201, {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "ENTRY_ID", "type": "Entry", "version": 1, "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "updatedAt": "2014-12-04T14:16:58.522Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.put('/spaces/SPACE_DEST/entries/ENTRY_ID/published?access_token=CONTENT_MGT_TOKEN')
        .once()
        .reply(500, {"name":"ValidationFailed","message":"PUT https://api.contentful.com:443/spaces/zla0uhbybqqb/entries/5zcug30nrGcSY0w8QmWUA6/published?access_token=c734d029c0375ef9cda101d2667b6fcc4c1884451dab7ea46314af8b61ec413b Validation error {\"sys\":{\"type\":\"Error\",\"id\":\"ValidationFailed\"},\"message\":\"Validation error\",\"details\":{\"errors\":[{\"name\":\"notResolvable\",\"link\":{\"type\":\"Link\",\"linkType\":\"Asset\",\"id\":\"68WwcC4go0sKqiIWmmk6gc\"}}]}}","request":{"method":"PUT","uri":"https://api.contentful.com:443/spaces/zla0uhbybqqb/entries/5zcug30nrGcSY0w8QmWUA6/published?access_token=c734d029c0375ef9cda101d2667b6fcc4c1884451dab7ea46314af8b61ec413b"}});

      contentfulApiNock.put('/spaces/SPACE_DEST/entries/ENTRY_ID/published?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "ENTRY_ID", "type": "Entry", "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "version": 2, "updatedAt": "2014-12-04T14:16:59.193Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "firstPublishedAt": "2014-12-04T14:16:59.193Z", "publishedCounter": 1, "publishedAt": "2014-12-04T14:16:59.193Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 1}});

      executeSync(done);
    });


    it('should update an entry on the unsynchronized space', function (done) {
      expectToGetSourceItemsWithInitialSync([
        {"sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "type": "Entry", "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "id": "ENTRY-ID", "revision": 1, "createdAt": "2014-12-04T14:13:50.630Z", "updatedAt": "2014-12-04T14:13:50.630Z"}, "fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}}
      ]);

      expectToGetDestinationSpace();

      contentfulApiNock.get('/spaces/SPACE_DEST/entries/ENTRY-ID?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "ENTRY-ID", "type": "Entry", "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "firstPublishedAt": "2014-12-04T14:16:59.193Z", "publishedCounter": 1, "publishedAt": "2014-12-04T14:16:59.193Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 1, "version": 2, "updatedAt": "2014-12-04T14:16:59.242Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.put('/spaces/SPACE_DEST/entries/ENTRY-ID?access_token=CONTENT_MGT_TOKEN', {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}})
        .reply(200, {"fields": {"contentfulTitle": {"en-US": "12"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "ENTRY-ID", "type": "Entry", "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "firstPublishedAt": "2014-12-04T14:16:59.193Z", "publishedCounter": 1, "publishedAt": "2014-12-04T14:16:59.193Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 1, "version": 3, "updatedAt": "2014-12-04T14:44:30.406Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.put('/spaces/SPACE_DEST/entries/ENTRY-ID/published?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": {"contentfulTitle": {"en-US": "12"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "ENTRY-ID", "type": "Entry", "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "firstPublishedAt": "2014-12-04T14:16:59.193Z", "publishedCounter": 2, "publishedAt": "2014-12-04T14:44:31.005Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 3, "version": 4, "updatedAt": "2014-12-04T14:44:31.005Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      executeSync(done);
    });

    it('should remove an entry on a synchronized space', function (done) {
      createTokenFileWithToken();

      expectToGetSourceItemsWithExistingSync([
        {"sys": {"type": "DeletedEntry", "id": "ENTRY-ID", "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "revision": 1, "createdAt": "2014-12-04T16:07:55.783Z", "updatedAt": "2014-12-04T16:07:55.783Z", "deletedAt": "2014-12-04T16:07:55.783Z"}}
      ]);

      expectToGetDestinationSpace();

      contentfulApiNock.delete('/spaces/SPACE_DEST/entries/ENTRY-ID/published?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": {"contentfulTitle": {"en-US": "123123"}, "message": {"en-US": "A"}, "number": {"en-US": 3}, "text": {"en-US": "21"}}, "sys": {"id": "ENTRY-ID", "type": "Entry", "createdAt": "2014-12-04T16:07:35.207Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "firstPublishedAt": "2014-12-04T16:07:35.933Z", "publishedCounter": 1, "version": 3, "updatedAt": "2014-12-04T16:08:05.573Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.delete('/spaces/SPACE_DEST/entries/ENTRY-ID?access_token=CONTENT_MGT_TOKEN')
        .reply(204, "");

      executeSync(done);
    });

    it('should remove an entry on a synchronized space', function (done) {
      createTokenFileWithToken();

      expectToGetSourceItemsWithExistingSync([
        {"sys": {"type": "DeletedEntry", "id": "ENTRY-ID", "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "revision": 1, "createdAt": "2014-12-04T16:07:55.783Z", "updatedAt": "2014-12-04T16:07:55.783Z", "deletedAt": "2014-12-04T16:07:55.783Z"}}
      ]);

      expectToGetDestinationSpace();

      contentfulApiNock.delete('/spaces/SPACE_DEST/entries/ENTRY-ID/published?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": {"contentfulTitle": {"en-US": "123123"}, "message": {"en-US": "A"}, "number": {"en-US": 3}, "text": {"en-US": "21"}}, "sys": {"id": "ENTRY-ID", "type": "Entry", "createdAt": "2014-12-04T16:07:35.207Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "firstPublishedAt": "2014-12-04T16:07:35.933Z", "publishedCounter": 1, "version": 3, "updatedAt": "2014-12-04T16:08:05.573Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.delete('/spaces/SPACE_DEST/entries/ENTRY-ID?access_token=CONTENT_MGT_TOKEN')
        .reply(204, "");

      executeSync(done);
    });
  });

  describe('for assets', function() {
    it('should add an asset on a unsynchronized space', function (done) {

      expectToGetSourceItemsWithInitialSync([
        {"fields": {"file": {"en-US": {"fileName": "add_directory_icon.svg", "contentType": "image/svg+xml", "details": {"size": 984}, "url": "//assets.contentful.com/SPACE_SRC/ASSET-ID/1365a0d50dbb810b731a815c9a579ad0/add_directory_icon.svg"}}, "title": {"en-US": "add directory icon"}}, "sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "type": "Asset", "id": "ASSET-ID", "revision": 1, "createdAt": "2014-12-04T16:46:25.594Z", "updatedAt": "2014-12-04T16:46:25.594Z"}}
      ]);

      expectToGetDestinationSpace();

      contentfulApiNock.get('/spaces/SPACE_DEST/assets/ASSET-ID?access_token=CONTENT_MGT_TOKEN')
        .reply(404, {"sys": {"type": "Error", "id": "NotFound"}, "message": "The resource could not be found.", "details": {"type": "Asset", "space": "SPACE_DEST", "id": "ASSET-ID"}});

      contentfulApiNock.put('/spaces/SPACE_DEST/assets/ASSET-ID?access_token=CONTENT_MGT_TOKEN', {"fields": {"file": {"en-US": {"fileName": "add_directory_icon.svg", "contentType": "image/svg+xml", "details": {"size": 984}, "url": "//assets.contentful.com/SPACE_SRC/ASSET-ID/1365a0d50dbb810b731a815c9a579ad0/add_directory_icon.svg"}}, "title": {"en-US": "add directory icon"}}, "sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "type": "Asset", "id": "ASSET-ID", "revision": 1, "createdAt": "2014-12-04T16:46:25.594Z", "updatedAt": "2014-12-04T16:46:25.594Z"}})
        .reply(201, {"fields": {"file": {"en-US": {"fileName": "add_directory_icon.svg", "contentType": "image/svg+xml", "details": {"size": 984}, "url": "//assets.contentful.com/SPACE_SRC/ASSET-ID/1365a0d50dbb810b731a815c9a579ad0/add_directory_icon.svg"}}, "title": {"en-US": "add directory icon"}}, "sys": {"id": "ASSET-ID", "type": "Asset", "version": 1, "createdAt": "2014-12-04T16:47:12.954Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "updatedAt": "2014-12-04T16:47:12.954Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.put('/spaces/SPACE_DEST/assets/ASSET-ID/published?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": {"file": {"en-US": {"fileName": "add_directory_icon.svg", "contentType": "image/svg+xml", "details": {"size": 984}, "url": "//assets.contentful.com/SPACE_SRC/ASSET-ID/1365a0d50dbb810b731a815c9a579ad0/add_directory_icon.svg"}}, "title": {"en-US": "add directory icon"}}, "sys": {"id": "ASSET-ID", "type": "Asset", "createdAt": "2014-12-04T16:47:12.954Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "version": 2, "updatedAt": "2014-12-04T16:47:13.693Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "firstPublishedAt": "2014-12-04T16:47:13.693Z", "publishedCounter": 1, "publishedAt": "2014-12-04T16:47:13.693Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 1}});

      executeSync(done);
    });

    it('should update an asset on a unsynchronized space', function (done) {

      expectToGetSourceItemsWithInitialSync([
        {"fields": {"file": {"en-US": {"fileName": "2014_03_05_XEBIA_16_FINAL_1.jpg", "contentType": "image/jpeg", "details": {"image": {"width": 4791, "height": 2695}, "size": 7378737}, "url": "//images.contentful.com/SPACE_SRC/ASSET-ID/975718ead2ad44d685075d46f349f18a/2014_03_05_XEBIA_16_FINAL_1.jpg"}}, "title": {"en-US": "Xebia 2"}}, "sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "type": "Asset", "id": "ASSET-ID", "revision": 2, "createdAt": "2014-12-05T08:31:14.547Z", "updatedAt": "2014-12-08T13:33:04.774Z"}}
      ]);

      expectToGetDestinationSpace();

      contentfulApiNock.get('/spaces/SPACE_DEST/assets/ASSET-ID?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": {"file": {"en-US": {"fileName": "2014_03_05_XEBIA_16_FINAL_1.jpg", "contentType": "image/jpeg", "details": {"image": {"width": 4791, "height": 2695}, "size": 7378737}, "url": "//images.contentful.com/SPACE_SRC/ASSET-ID/975718ead2ad44d685075d46f349f18a/2014_03_05_XEBIA_16_FINAL_1.jpg"}}, "title": {"en-US": "Xebia 2"}}, "sys": {"id": "ASSET-ID", "type": "Asset", "createdAt": "2014-12-05T09:29:24.883Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "firstPublishedAt": "2014-12-05T09:29:25.562Z", "publishedCounter": 5, "publishedAt": "2014-12-08T13:46:00.535Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 9, "version": 10, "updatedAt": "2014-12-08T13:46:00.584Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.put('/spaces/SPACE_DEST/assets/ASSET-ID?access_token=CONTENT_MGT_TOKEN', {"fields": {"file": {"en-US": {"fileName": "2014_03_05_XEBIA_16_FINAL_1.jpg", "contentType": "image/jpeg", "details": {"image": {"width": 4791, "height": 2695}, "size": 7378737}, "url": "//images.contentful.com/SPACE_SRC/ASSET-ID/975718ead2ad44d685075d46f349f18a/2014_03_05_XEBIA_16_FINAL_1.jpg"}}, "title": {"en-US": "Xebia 2"}}})
        .reply(200, {"fields": {"file": {"en-US": {"fileName": "2014_03_05_XEBIA_16_FINAL_1.jpg", "contentType": "image/jpeg", "details": {"image": {"width": 4791, "height": 2695}, "size": 7378737}, "url": "//images.contentful.com/SPACE_SRC/ASSET-ID/975718ead2ad44d685075d46f349f18a/2014_03_05_XEBIA_16_FINAL_1.jpg"}}, "title": {"en-US": "Xebia 2"}}, "sys": {"id": "ASSET-ID", "type": "Asset", "createdAt": "2014-12-05T09:29:24.883Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "firstPublishedAt": "2014-12-05T09:29:25.562Z", "publishedCounter": 5, "publishedAt": "2014-12-08T13:46:00.535Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 9, "version": 11, "updatedAt": "2014-12-08T13:46:34.534Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.put('/spaces/SPACE_DEST/assets/ASSET-ID/published?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": {"file": {"en-US": {"fileName": "2014_03_05_XEBIA_16_FINAL_1.jpg", "contentType": "image/jpeg", "details": {"image": {"width": 4791, "height": 2695}, "size": 7378737}, "url": "//images.contentful.com/SPACE_SRC/ASSET-ID/975718ead2ad44d685075d46f349f18a/2014_03_05_XEBIA_16_FINAL_1.jpg"}}, "title": {"en-US": "Xebia 2"}}, "sys": {"id": "ASSET-ID", "type": "Asset", "createdAt": "2014-12-05T09:29:24.883Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "firstPublishedAt": "2014-12-05T09:29:25.562Z", "publishedCounter": 6, "publishedAt": "2014-12-08T13:46:35.122Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 11, "version": 12, "updatedAt": "2014-12-08T13:46:35.122Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      executeSync(done);
    });

    it('should remove an asset on a synchronized space', function (done) {
      createTokenFileWithToken();

      expectToGetSourceItemsWithExistingSync([
        {"sys": {"type": "DeletedAsset", "id": "ASSET-ID", "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_SRC"}}, "revision": 1, "createdAt": "2014-12-04T16:07:55.783Z", "updatedAt": "2014-12-04T16:07:55.783Z", "deletedAt": "2014-12-04T16:07:55.783Z"}}
      ]);

      expectToGetDestinationSpace();

      contentfulApiNock.delete('/spaces/SPACE_DEST/assets/ASSET-ID/published?access_token=CONTENT_MGT_TOKEN')
        .reply(200, {"fields": {"file": {"en-US": {"fileName": "Capture d’écran 2014-12-05 à 16.58.59.png", "contentType": "image/png", "details": {"image": {"width": 1974, "height": 902}, "size": 189987}, "url": "//images.contentful.com/SPACE_SRC/ASSET-ID/c04bfe84f50559b1b8d38c42dab157b3/Capture_d__cran_2014-12-05___16.58.59.png"}}, "title": {"en-US": "Capture d’écran 2014-12-05 à 16.58.59"}}, "sys": {"id": "ASSET-ID", "type": "Asset", "createdAt": "2014-12-08T14:36:28.594Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "SPACE_DEST"}}, "firstPublishedAt": "2014-12-08T14:36:29.518Z", "publishedCounter": 1, "version": 3, "updatedAt": "2014-12-08T14:36:54.670Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

      contentfulApiNock.delete('/spaces/SPACE_DEST/assets/ASSET-ID?access_token=CONTENT_MGT_TOKEN')
        .reply(204, "");

      executeSync(done);
    });
  });
});
