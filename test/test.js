'use strict';

var nock = require('nock'),
  Sync = require('../lib/Sync');

describe('Content publication', function() {

  this.timeout(30000);
  var config = {
    "contentful": {
      "accessToken": "fb515830ae5e9b6684cc89044ddc6fe91d17eb6a5ed68491be1e75b5abe02212",
      "spaceSource": "d3ivyl5chrsd",
      "accessTokenDestination": "614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702",
      "spaceDestination": "2udq9e16iv3p"
    }
  };
  //nock.recorder.rec();
  nock.disableNetConnect();
  /*before(function() {
   nock.disableNetConnect();
   });*/

  it('should do nothing if there are no entries to synchronize', function() {
    nock('https://cdn.contentful.com:443')
      .get('/spaces/d3ivyl5chrsd/sync?initial=true')
      .reply(200, {"sys":{"type":"Array"},"items":[],
        "nextSyncUrl":"https://cdn.contentful.com/spaces/d3ivyl5chrsd/sync?sync_token=wonDrcKnRgcSOF4-wrDCgcKefWzCgsOxDCvDsMO3MMO6wpLDs2bDjH4kwo48NWjDrcOHaxJiwp7DtsKjwpXDmjxTwq9sw4HCv8KUP8KLf3fDvMOKwqpLGsO7w7vCuSnCmcOqAMOTwr4uwoIQw5LDmzlswpHDrMOAJV8m"});

    var sync = Sync.fromConfig(config);
    sync.verbose = true;
    sync.run().done();
  });

  it('should add new entry to the unsynchronized space', function(done) {
    nock('https://cdn.contentful.com:443')
      .get('/spaces/d3ivyl5chrsd/sync?initial=true')
      .reply(200, {"sys":{"type":"Array"},"items":[{"sys":{"space":{"sys":{"type":"Link","linkType":"Space","id":"d3ivyl5chrsd"}},"type":"Entry","contentType":{"sys":{"type":"Link","linkType":"ContentType","id":"1d4hSJN1CiACKao6G0QyKC"}},"id":"2XS1ZMB87KSWAI4o6aOw0G","revision":1,"createdAt":"2014-12-04T14:13:50.630Z","updatedAt":"2014-12-04T14:13:50.630Z"},"fields":{"contentfulTitle":{"en-US":"1"},"message":{"en-US":"2"},"number":{"en-US":3},"text":{"en-US":"4"}}}],
        "nextSyncUrl":"https://cdn.contentful.com/spaces/d3ivyl5chrsd/sync?sync_token=w5ZGw6JFwqZmVcKsE8Kow4grw45QdyYjw6oWwpEoAsOgw7DCosOGwoodNsOHIsO4acK1W1PCncO-w6_DozZAFCzDhBnCr8K7w4TDo8KgHBLDtxsawowYF319C2_DnAUGw6gfwp5fwqopw5V6wpR4MsOwZMKL"});

    nock('https://api.contentful.com:443')
      .get('/spaces/2udq9e16iv3p?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"sys":{"type":"Space","id":"2udq9e16iv3p","version":1,"createdBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"createdAt":"2014-12-02T15:46:22Z","updatedBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"updatedAt":"2014-12-02T15:46:22Z"},"name":"Xebia2"});

    nock('https://api.contentful.com:443')
      .get('/spaces/2udq9e16iv3p/entries/2XS1ZMB87KSWAI4o6aOw0G?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(404, {"sys":{"type":"Error","id":"NotFound"},"message":"The resource could not be found.","details":{"type":"Entry","space":"2udq9e16iv3p","id":"2XS1ZMB87KSWAI4o6aOw0G"}});

    nock('https://api.contentful.com:443')
      .put('/spaces/2udq9e16iv3p/entries/2XS1ZMB87KSWAI4o6aOw0G?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702', {"fields":{"contentfulTitle":{"en-US":"1"},"message":{"en-US":"2"},"number":{"en-US":3},"text":{"en-US":"4"}}})
      .reply(201, {"fields":{"contentfulTitle":{"en-US":"1"},"message":{"en-US":"2"},"number":{"en-US":3},"text":{"en-US":"4"}},"sys":{"id":"2XS1ZMB87KSWAI4o6aOw0G","type":"Entry","version":1,"createdAt":"2014-12-04T14:16:58.522Z","createdBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"space":{"sys":{"type":"Link","linkType":"Space","id":"2udq9e16iv3p"}},"contentType":{"sys":{"type":"Link","linkType":"ContentType","id":"1d4hSJN1CiACKao6G0QyKC"}},"updatedAt":"2014-12-04T14:16:58.522Z","updatedBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}}}});

    nock('https://api.contentful.com:443')
      .put('/spaces/2udq9e16iv3p/entries/2XS1ZMB87KSWAI4o6aOw0G/published?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"fields":{"contentfulTitle":{"en-US":"1"},"message":{"en-US":"2"},"number":{"en-US":3},"text":{"en-US":"4"}},"sys":{"id":"2XS1ZMB87KSWAI4o6aOw0G","type":"Entry","createdAt":"2014-12-04T14:16:58.522Z","createdBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"space":{"sys":{"type":"Link","linkType":"Space","id":"2udq9e16iv3p"}},"contentType":{"sys":{"type":"Link","linkType":"ContentType","id":"1d4hSJN1CiACKao6G0QyKC"}},"version":2,"updatedAt":"2014-12-04T14:16:59.193Z","updatedBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"firstPublishedAt":"2014-12-04T14:16:59.193Z","publishedCounter":1,"publishedAt":"2014-12-04T14:16:59.193Z","publishedBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"publishedVersion":1}});

    var sync = Sync.fromConfig(config);
    sync.verbose = true;
    sync.run().then(function() {
      done();
    }).catch(function(err) {
      done(err);
    });
  });


  it('should update an to the unsynchronized space', function(done) {

    nock('https://cdn.contentful.com:443')
     .get('/spaces/d3ivyl5chrsd/sync?initial=true')
     .reply(200, {"sys":{"type":"Array"},"items":[{"sys":{"space":{"sys":{"type":"Link","linkType":"Space","id":"d3ivyl5chrsd"}},"type":"Entry","contentType":{"sys":{"type":"Link","linkType":"ContentType","id":"1d4hSJN1CiACKao6G0QyKC"}},"id":"2XS1ZMB87KSWAI4o6aOw0G","revision":1,"createdAt":"2014-12-04T14:13:50.630Z","updatedAt":"2014-12-04T14:13:50.630Z"},"fields":{"contentfulTitle":{"en-US":"1"},"message":{"en-US":"2"},"number":{"en-US":3},"text":{"en-US":"4"}}}],
     "nextSyncUrl":"https://cdn.contentful.com/spaces/d3ivyl5chrsd/sync?sync_token=w5ZGw6JFwqZmVcKsE8Kow4grw45QdyYjw6oWwpEoAsOgw7DCosOGwoodNsOHIsO4acK1W1PCncO-w6_DozZAFCzDhBnCr8K7w4TDo8KgHBLDtxsawowYF319C2_DnAUGw6gfwp5fwqopw5V6wpR4MsOwZMKL"});

    nock('https://api.contentful.com:443')
      .get('/spaces/2udq9e16iv3p?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"sys":{"type":"Space","id":"2udq9e16iv3p","version":1,"createdBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"createdAt":"2014-12-02T15:46:22Z","updatedBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"updatedAt":"2014-12-02T15:46:22Z"},"name":"Xebia2"});

    nock('https://api.contentful.com:443')
      .get('/spaces/2udq9e16iv3p/entries/2XS1ZMB87KSWAI4o6aOw0G?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"fields":{"contentfulTitle":{"en-US":"1"},"message":{"en-US":"2"},"number":{"en-US":3},"text":{"en-US":"4"}},"sys":{"id":"2XS1ZMB87KSWAI4o6aOw0G","type":"Entry","createdAt":"2014-12-04T14:16:58.522Z","createdBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"space":{"sys":{"type":"Link","linkType":"Space","id":"2udq9e16iv3p"}},"contentType":{"sys":{"type":"Link","linkType":"ContentType","id":"1d4hSJN1CiACKao6G0QyKC"}},"firstPublishedAt":"2014-12-04T14:16:59.193Z","publishedCounter":1,"publishedAt":"2014-12-04T14:16:59.193Z","publishedBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"publishedVersion":1,"version":2,"updatedAt":"2014-12-04T14:16:59.242Z","updatedBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}}}});

    nock('https://api.contentful.com:443')
      .put('/spaces/2udq9e16iv3p/entries/2XS1ZMB87KSWAI4o6aOw0G?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702', {"fields":{"contentfulTitle":{"en-US":"12"},"message":{"en-US":"2"},"number":{"en-US":3},"text":{"en-US":"4"}}})
      .reply(200, {"fields":{"contentfulTitle":{"en-US":"12"},"message":{"en-US":"2"},"number":{"en-US":3},"text":{"en-US":"4"}},"sys":{"id":"2XS1ZMB87KSWAI4o6aOw0G","type":"Entry","createdAt":"2014-12-04T14:16:58.522Z","createdBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"space":{"sys":{"type":"Link","linkType":"Space","id":"2udq9e16iv3p"}},"contentType":{"sys":{"type":"Link","linkType":"ContentType","id":"1d4hSJN1CiACKao6G0QyKC"}},"firstPublishedAt":"2014-12-04T14:16:59.193Z","publishedCounter":1,"publishedAt":"2014-12-04T14:16:59.193Z","publishedBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"publishedVersion":1,"version":3,"updatedAt":"2014-12-04T14:44:30.406Z","updatedBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}}}});

    nock('https://api.contentful.com:443')
      .put('/spaces/2udq9e16iv3p/entries/2XS1ZMB87KSWAI4o6aOw0G/published?access_token=614a7d5c05162a3879c55fe3f00d7115e1718efcd6dd969efeba01cc26a5a702')
      .reply(200, {"fields":{"contentfulTitle":{"en-US":"12"},"message":{"en-US":"2"},"number":{"en-US":3},"text":{"en-US":"4"}},"sys":{"id":"2XS1ZMB87KSWAI4o6aOw0G","type":"Entry","createdAt":"2014-12-04T14:16:58.522Z","createdBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"space":{"sys":{"type":"Link","linkType":"Space","id":"2udq9e16iv3p"}},"contentType":{"sys":{"type":"Link","linkType":"ContentType","id":"1d4hSJN1CiACKao6G0QyKC"}},"firstPublishedAt":"2014-12-04T14:16:59.193Z","publishedCounter":2,"publishedAt":"2014-12-04T14:44:31.005Z","publishedBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}},"publishedVersion":3,"version":4,"updatedAt":"2014-12-04T14:44:31.005Z","updatedBy":{"sys":{"type":"Link","linkType":"User","id":"54d2tbbHxWntLgXUA6O72y"}}}});

    var sync = Sync.fromConfig(config);
    sync.verbose = true;
    sync.run().then(function() {
      done();
    }).catch(function(err) {
      done(err);
    });
  });
});
