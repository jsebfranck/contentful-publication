'use strict';

var nock = require('nock'),
  fs = require('fs'),
  Sync = require('../lib/Sync');

describe('Content publication', function () {

  this.timeout(30000);
  var config = {
    "contentful": {
      "accessToken": "fb515830ae5e9b6684cc89044ddc6fe91d17eb6a5ed68491be1e75b5abe02212",
      "spaceSource": "d3ivyl5chrsd",
      "accessTokenDestination": "614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702",
      "spaceDestination": "2udq9e16iv3p"
    }
  };

  var createEmptyTokenFile = function () {
    fs.writeFileSync('lastSyncToken.json', JSON.stringify({}));
  };

  var createTokenFileWithToken = function () {
    fs.writeFileSync('lastSyncToken.json', JSON.stringify({ url: 'https://cdn.contentful.com:443/spaces/d3ivyl5chrsd/sync?sync_token=SYNC_TOKEN' }));
  };

  //nock.recorder.rec();
  nock.disableNetConnect();

  beforeEach(function () {
    createEmptyTokenFile();
  });

  it('should do nothing if there are no contents to synchronize', function () {
    nock('https://cdn.contentful.com:443')
      .get('/spaces/d3ivyl5chrsd/sync?initial=true')
      .reply(200, {"sys": {"type": "Array"}, "items": [],
        "nextSyncUrl": "https://cdn.contentful.com/spaces/d3ivyl5chrsd/sync?sync_token=NEXT-SYNC-TOKEN"});

    var sync = Sync.fromConfig(config);
    sync.verbose = true;
    sync.run().done();
  });

  it('should add new entry to the unsynchronized space', function (done) {
    nock('https://cdn.contentful.com:443')
      .get('/spaces/d3ivyl5chrsd/sync?initial=true')
      .reply(200, {"sys": {"type": "Array"}, "items": [
        {"sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "d3ivyl5chrsd"}}, "type": "Entry", "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "id": "2XS1ZMB87KSWAI4o6aOw0G", "revision": 1, "createdAt": "2014-12-04T14:13:50.630Z", "updatedAt": "2014-12-04T14:13:50.630Z"}, "fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}}
      ],
        "nextSyncUrl": "https://cdn.contentful.com/spaces/d3ivyl5chrsd/sync?sync_token=NEXT-SYNC-TOKEN"});

    nock('https://api.contentful.com:443')
      .get('/spaces/2udq9e16iv3p?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"sys": {"type": "Space", "id": "2udq9e16iv3p", "version": 1, "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "createdAt": "2014-12-02T15:46:22Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "updatedAt": "2014-12-02T15:46:22Z"}, "name": "Xebia2"});

    nock('https://api.contentful.com:443')
      .get('/spaces/2udq9e16iv3p/entries/2XS1ZMB87KSWAI4o6aOw0G?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(404, {"sys": {"type": "Error", "id": "NotFound"}, "message": "The resource could not be found.", "details": {"type": "Entry", "space": "2udq9e16iv3p", "id": "2XS1ZMB87KSWAI4o6aOw0G"}});

    nock('https://api.contentful.com:443')
      .put('/spaces/2udq9e16iv3p/entries/2XS1ZMB87KSWAI4o6aOw0G?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702', {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}})
      .reply(201, {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "2XS1ZMB87KSWAI4o6aOw0G", "type": "Entry", "version": 1, "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "2udq9e16iv3p"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "updatedAt": "2014-12-04T14:16:58.522Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

    nock('https://api.contentful.com:443')
      .put('/spaces/2udq9e16iv3p/entries/2XS1ZMB87KSWAI4o6aOw0G/published?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "2XS1ZMB87KSWAI4o6aOw0G", "type": "Entry", "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "2udq9e16iv3p"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "version": 2, "updatedAt": "2014-12-04T14:16:59.193Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "firstPublishedAt": "2014-12-04T14:16:59.193Z", "publishedCounter": 1, "publishedAt": "2014-12-04T14:16:59.193Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 1}});

    var sync = Sync.fromConfig(config);
    sync.verbose = true;
    sync.run().then(function () {
      done();
    }).catch(function (err) {
        done(err);
      });
  });


  it('should update an entry on the unsynchronized space', function (done) {
    nock('https://cdn.contentful.com:443')
      .get('/spaces/d3ivyl5chrsd/sync?initial=true')
      .reply(200, {"sys": {"type": "Array"}, "items": [
        {"sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "d3ivyl5chrsd"}}, "type": "Entry", "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "id": "2XS1ZMB87KSWAI4o6aOw0G", "revision": 1, "createdAt": "2014-12-04T14:13:50.630Z", "updatedAt": "2014-12-04T14:13:50.630Z"}, "fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}}
      ],
        "nextSyncUrl": "https://cdn.contentful.com/spaces/d3ivyl5chrsd/sync?sync_token=NEXT-SYNC-TOKEN"});

    nock('https://api.contentful.com:443')
      .get('/spaces/2udq9e16iv3p?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"sys": {"type": "Space", "id": "2udq9e16iv3p", "version": 1, "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "createdAt": "2014-12-02T15:46:22Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "updatedAt": "2014-12-02T15:46:22Z"}, "name": "Xebia2"});

    nock('https://api.contentful.com:443')
      .get('/spaces/2udq9e16iv3p/entries/2XS1ZMB87KSWAI4o6aOw0G?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"fields": {"contentfulTitle": {"en-US": "1"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "2XS1ZMB87KSWAI4o6aOw0G", "type": "Entry", "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "2udq9e16iv3p"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "firstPublishedAt": "2014-12-04T14:16:59.193Z", "publishedCounter": 1, "publishedAt": "2014-12-04T14:16:59.193Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 1, "version": 2, "updatedAt": "2014-12-04T14:16:59.242Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

    nock('https://api.contentful.com:443')
      .put('/spaces/2udq9e16iv3p/entries/2XS1ZMB87KSWAI4o6aOw0G?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702', {"fields": {"contentfulTitle": {"en-US": "12"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}})
      .reply(200, {"fields": {"contentfulTitle": {"en-US": "12"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "2XS1ZMB87KSWAI4o6aOw0G", "type": "Entry", "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "2udq9e16iv3p"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "firstPublishedAt": "2014-12-04T14:16:59.193Z", "publishedCounter": 1, "publishedAt": "2014-12-04T14:16:59.193Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 1, "version": 3, "updatedAt": "2014-12-04T14:44:30.406Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

    nock('https://api.contentful.com:443')
      .put('/spaces/2udq9e16iv3p/entries/2XS1ZMB87KSWAI4o6aOw0G/published?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"fields": {"contentfulTitle": {"en-US": "12"}, "message": {"en-US": "2"}, "number": {"en-US": 3}, "text": {"en-US": "4"}}, "sys": {"id": "2XS1ZMB87KSWAI4o6aOw0G", "type": "Entry", "createdAt": "2014-12-04T14:16:58.522Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "2udq9e16iv3p"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "firstPublishedAt": "2014-12-04T14:16:59.193Z", "publishedCounter": 2, "publishedAt": "2014-12-04T14:44:31.005Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 3, "version": 4, "updatedAt": "2014-12-04T14:44:31.005Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

    var sync = Sync.fromConfig(config);
    sync.verbose = true;
    sync.run().then(function () {
      done();
    }).catch(function (err) {
        done(err);
      });
  });

  it('should remove an entry on a synchronized space', function (done) {
    createTokenFileWithToken();

    nock('https://cdn.contentful.com:443')
      .get('/spaces/d3ivyl5chrsd/sync?sync_token=SYNC_TOKEN')
      .reply(200, {"sys": {"type": "Array"}, "items": [
        {"sys": {"type": "DeletedEntry", "id": "26GRGDvgvyQ0cswwMscCIc", "space": {"sys": {"type": "Link", "linkType": "Space", "id": "d3ivyl5chrsd"}}, "revision": 1, "createdAt": "2014-12-04T16:07:55.783Z", "updatedAt": "2014-12-04T16:07:55.783Z", "deletedAt": "2014-12-04T16:07:55.783Z"}}
      ],
        "nextSyncUrl": "https://cdn.contentful.com/spaces/d3ivyl5chrsd/sync?sync_token=NEW-SYNC-TOKEN"});

    nock('https://api.contentful.com:443')
      .get('/spaces/2udq9e16iv3p?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"sys": {"type": "Space", "id": "2udq9e16iv3p", "version": 1, "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "createdAt": "2014-12-02T15:46:22Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "updatedAt": "2014-12-02T15:46:22Z"}, "name": "Xebia2"});

    nock('https://api.contentful.com:443')
      .delete('/spaces/2udq9e16iv3p/entries/26GRGDvgvyQ0cswwMscCIc/published?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"fields": {"contentfulTitle": {"en-US": "123123"}, "message": {"en-US": "A"}, "number": {"en-US": 3}, "text": {"en-US": "21"}}, "sys": {"id": "26GRGDvgvyQ0cswwMscCIc", "type": "Entry", "createdAt": "2014-12-04T16:07:35.207Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "2udq9e16iv3p"}}, "contentType": {"sys": {"type": "Link", "linkType": "ContentType", "id": "1d4hSJN1CiACKao6G0QyKC"}}, "firstPublishedAt": "2014-12-04T16:07:35.933Z", "publishedCounter": 1, "version": 3, "updatedAt": "2014-12-04T16:08:05.573Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

    nock('https://api.contentful.com:443')
      .delete('/spaces/2udq9e16iv3p/entries/26GRGDvgvyQ0cswwMscCIc?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(204, "");

    var sync = Sync.fromConfig(config);
    sync.verbose = true;
    sync.run().then(function () {
      done();
    }).catch(function (err) {
        done(err);
      });
  });

  it('should add an asset on a unsynchronized space', function (done) {

    nock('https://cdn.contentful.com:443')
      .get('/spaces/d3ivyl5chrsd/sync?initial=true')
      .reply(200, {"sys": {"type": "Array"}, "items": [
        {"fields": {"file": {"en-US": {"fileName": "add_directory_icon.svg", "contentType": "image/svg+xml", "details": {"size": 984}, "url": "//assets.contentful.com/d3ivyl5chrsd/9WwNj5BjrOwawsOuAIIce/1365a0d50dbb810b731a815c9a579ad0/add_directory_icon.svg"}}, "title": {"en-US": "add directory icon"}}, "sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "d3ivyl5chrsd"}}, "type": "Asset", "id": "9WwNj5BjrOwawsOuAIIce", "revision": 1, "createdAt": "2014-12-04T16:46:25.594Z", "updatedAt": "2014-12-04T16:46:25.594Z"}}
      ],
        "nextSyncUrl": "https://cdn.contentful.com/spaces/d3ivyl5chrsd/sync?sync_token=NEXT-SYNC-TOKEN"});

    nock('https://api.contentful.com:443')
      .get('/spaces/2udq9e16iv3p?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"sys": {"type": "Space", "id": "2udq9e16iv3p", "version": 1, "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "createdAt": "2014-12-02T15:46:22Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "updatedAt": "2014-12-02T15:46:22Z"}, "name": "Xebia2"});

    nock('https://api.contentful.com:443')
      .get('/spaces/2udq9e16iv3p/assets/9WwNj5BjrOwawsOuAIIce?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(404, {"sys": {"type": "Error", "id": "NotFound"}, "message": "The resource could not be found.", "details": {"type": "Asset", "space": "2udq9e16iv3p", "id": "9WwNj5BjrOwawsOuAIIce"}});

    nock('https://api.contentful.com:443')
      .put('/spaces/2udq9e16iv3p/assets/9WwNj5BjrOwawsOuAIIce?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702', {"fields": {"file": {"en-US": {"fileName": "add_directory_icon.svg", "contentType": "image/svg+xml", "details": {"size": 984}, "url": "//assets.contentful.com/d3ivyl5chrsd/9WwNj5BjrOwawsOuAIIce/1365a0d50dbb810b731a815c9a579ad0/add_directory_icon.svg"}}, "title": {"en-US": "add directory icon"}}, "sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "d3ivyl5chrsd"}}, "type": "Asset", "id": "9WwNj5BjrOwawsOuAIIce", "revision": 1, "createdAt": "2014-12-04T16:46:25.594Z", "updatedAt": "2014-12-04T16:46:25.594Z"}})
      .reply(201, {"fields": {"file": {"en-US": {"fileName": "add_directory_icon.svg", "contentType": "image/svg+xml", "details": {"size": 984}, "url": "//assets.contentful.com/d3ivyl5chrsd/9WwNj5BjrOwawsOuAIIce/1365a0d50dbb810b731a815c9a579ad0/add_directory_icon.svg"}}, "title": {"en-US": "add directory icon"}}, "sys": {"id": "9WwNj5BjrOwawsOuAIIce", "type": "Asset", "version": 1, "createdAt": "2014-12-04T16:47:12.954Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "2udq9e16iv3p"}}, "updatedAt": "2014-12-04T16:47:12.954Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

    nock('https://api.contentful.com:443')
      .put('/spaces/2udq9e16iv3p/assets/9WwNj5BjrOwawsOuAIIce/published?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"fields": {"file": {"en-US": {"fileName": "add_directory_icon.svg", "contentType": "image/svg+xml", "details": {"size": 984}, "url": "//assets.contentful.com/d3ivyl5chrsd/9WwNj5BjrOwawsOuAIIce/1365a0d50dbb810b731a815c9a579ad0/add_directory_icon.svg"}}, "title": {"en-US": "add directory icon"}}, "sys": {"id": "9WwNj5BjrOwawsOuAIIce", "type": "Asset", "createdAt": "2014-12-04T16:47:12.954Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "2udq9e16iv3p"}}, "version": 2, "updatedAt": "2014-12-04T16:47:13.693Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "firstPublishedAt": "2014-12-04T16:47:13.693Z", "publishedCounter": 1, "publishedAt": "2014-12-04T16:47:13.693Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 1}});

    var sync = Sync.fromConfig(config);
    sync.verbose = true;
    sync.run().then(function () {
      done();
    }).catch(function (err) {
        done(err);
      });
  });

  it('should update an asset on a unsynchronized space', function (done) {

    nock('https://cdn.contentful.com:443')
      .get('/spaces/d3ivyl5chrsd/sync?initial=true')
      .reply(200, {"sys": {"type": "Array"}, "items": [
        {"fields": {"file": {"en-US": {"fileName": "2014_03_05_XEBIA_16_FINAL_1.jpg", "contentType": "image/jpeg", "details": {"image": {"width": 4791, "height": 2695}, "size": 7378737}, "url": "//images.contentful.com/d3ivyl5chrsd/1P3ydRWdSwcmEIQkeGySAo/975718ead2ad44d685075d46f349f18a/2014_03_05_XEBIA_16_FINAL_1.jpg"}}, "title": {"en-US": "Xebia 2"}}, "sys": {"space": {"sys": {"type": "Link", "linkType": "Space", "id": "d3ivyl5chrsd"}}, "type": "Asset", "id": "1P3ydRWdSwcmEIQkeGySAo", "revision": 2, "createdAt": "2014-12-05T08:31:14.547Z", "updatedAt": "2014-12-08T13:33:04.774Z"}}
      ], "nextSyncUrl": "https://cdn.contentful.com/spaces/d3ivyl5chrsd/sync?sync_token=w5ZGw6JFwqZmVcKsE8Kow4grw45QdybDo8KowpbChcKUw6DDl1ElWw94wobCusKMwo8fwrnDk2bDpsKYJcOQEcOSLHZoVyDCgMOFwofDn8KdNsKudxNLw6RSwrlhSHIpbsO3wrfCo8KEH8KQwrVFLF3CssOLwoZuBw"});

    nock('https://api.contentful.com:443')
      .get('/spaces/2udq9e16iv3p?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"sys": {"type": "Space", "id": "2udq9e16iv3p", "version": 1, "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "createdAt": "2014-12-02T15:46:22Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "updatedAt": "2014-12-02T15:46:22Z"}, "name": "Xebia2"});

    nock('https://api.contentful.com:443')
      .get('/spaces/2udq9e16iv3p/assets/1P3ydRWdSwcmEIQkeGySAo?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"fields": {"file": {"en-US": {"fileName": "2014_03_05_XEBIA_16_FINAL_1.jpg", "contentType": "image/jpeg", "details": {"image": {"width": 4791, "height": 2695}, "size": 7378737}, "url": "//images.contentful.com/d3ivyl5chrsd/1P3ydRWdSwcmEIQkeGySAo/975718ead2ad44d685075d46f349f18a/2014_03_05_XEBIA_16_FINAL_1.jpg"}}, "title": {"en-US": "Xebia 2"}}, "sys": {"id": "1P3ydRWdSwcmEIQkeGySAo", "type": "Asset", "createdAt": "2014-12-05T09:29:24.883Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "2udq9e16iv3p"}}, "firstPublishedAt": "2014-12-05T09:29:25.562Z", "publishedCounter": 5, "publishedAt": "2014-12-08T13:46:00.535Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 9, "version": 10, "updatedAt": "2014-12-08T13:46:00.584Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

    nock('https://api.contentful.com:443')
      .put('/spaces/2udq9e16iv3p/assets/1P3ydRWdSwcmEIQkeGySAo?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702', {"fields": {"file": {"en-US": {"fileName": "2014_03_05_XEBIA_16_FINAL_1.jpg", "contentType": "image/jpeg", "details": {"image": {"width": 4791, "height": 2695}, "size": 7378737}, "url": "//images.contentful.com/d3ivyl5chrsd/1P3ydRWdSwcmEIQkeGySAo/975718ead2ad44d685075d46f349f18a/2014_03_05_XEBIA_16_FINAL_1.jpg"}}, "title": {"en-US": "Xebia 2"}}})
      .reply(200, {"fields": {"file": {"en-US": {"fileName": "2014_03_05_XEBIA_16_FINAL_1.jpg", "contentType": "image/jpeg", "details": {"image": {"width": 4791, "height": 2695}, "size": 7378737}, "url": "//images.contentful.com/d3ivyl5chrsd/1P3ydRWdSwcmEIQkeGySAo/975718ead2ad44d685075d46f349f18a/2014_03_05_XEBIA_16_FINAL_1.jpg"}}, "title": {"en-US": "Xebia 2"}}, "sys": {"id": "1P3ydRWdSwcmEIQkeGySAo", "type": "Asset", "createdAt": "2014-12-05T09:29:24.883Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "2udq9e16iv3p"}}, "firstPublishedAt": "2014-12-05T09:29:25.562Z", "publishedCounter": 5, "publishedAt": "2014-12-08T13:46:00.535Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 9, "version": 11, "updatedAt": "2014-12-08T13:46:34.534Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

    nock('https://api.contentful.com:443')
      .put('/spaces/2udq9e16iv3p/assets/1P3ydRWdSwcmEIQkeGySAo/published?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"fields": {"file": {"en-US": {"fileName": "2014_03_05_XEBIA_16_FINAL_1.jpg", "contentType": "image/jpeg", "details": {"image": {"width": 4791, "height": 2695}, "size": 7378737}, "url": "//images.contentful.com/d3ivyl5chrsd/1P3ydRWdSwcmEIQkeGySAo/975718ead2ad44d685075d46f349f18a/2014_03_05_XEBIA_16_FINAL_1.jpg"}}, "title": {"en-US": "Xebia 2"}}, "sys": {"id": "1P3ydRWdSwcmEIQkeGySAo", "type": "Asset", "createdAt": "2014-12-05T09:29:24.883Z", "createdBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "space": {"sys": {"type": "Link", "linkType": "Space", "id": "2udq9e16iv3p"}}, "firstPublishedAt": "2014-12-05T09:29:25.562Z", "publishedCounter": 6, "publishedAt": "2014-12-08T13:46:35.122Z", "publishedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}, "publishedVersion": 11, "version": 12, "updatedAt": "2014-12-08T13:46:35.122Z", "updatedBy": {"sys": {"type": "Link", "linkType": "User", "id": "54d2tbbHxWntLgXUA6O72y"}}}});

    var sync = Sync.fromConfig(config);
    sync.verbose = true;
    sync.run().then(function () {
      done();
    }).catch(function (err) {
        done(err);
      });
  });
});
