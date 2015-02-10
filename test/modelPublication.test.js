'use strict';

var nock = require('nock'),
  testHelper = require('./testHelper'),
  ModelSync = testHelper.requireModule('ModelSync');

describe('Model publication', function () {

  this.timeout(10000);
  var config = {
    'contentful': {
      'sourceSpace': 'SRC_SPACE',
      'destinationSpace': 'DEST_SPACE',
      'contentManagementAccessToken': 'TOKEN_MANAGEMENT',
      "publishRetryDelay": 1000
    }
  };

  var contentfulApiNock;

  nock.disableNetConnect();

  beforeEach(function () {
    contentfulApiNock = nock('https://api.contentful.com:443');
  });

  var synchronizeModels = function (done) {
    var modelSync = new ModelSync(config);
    modelSync.run().then(function () {
      contentfulApiNock.done();
      done();
    }).catch(function (err) {
      done(err);
    });
  };

  it('should add a model', function (done) {

    contentfulApiNock.get('/spaces/DEST_SPACE?access_token=TOKEN_MANAGEMENT')
      .reply(200, {'sys': {'type': 'Space', 'id': 'DEST_SPACE', 'version': 1, 'createdBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'createdAt': '2014-12-02T15:46:22Z', 'updatedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'updatedAt': '2014-12-02T15:46:22Z'}, 'name': 'Xebia2'});

    contentfulApiNock.get('/spaces/SRC_SPACE?access_token=TOKEN_MANAGEMENT')
      .reply(200, {'sys': {'type': 'Space', 'id': 'SRC_SPACE', 'version': 1, 'createdBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'createdAt': '2014-12-02T13:56:51Z', 'updatedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'updatedAt': '2014-12-02T13:56:51Z'}, 'name': 'Xebia'});

    contentfulApiNock.get('/spaces/SRC_SPACE/content_types?access_token=TOKEN_MANAGEMENT')
      .reply(200, {'sys': {'type': 'Array'}, 'total': 1, 'skip': 0, 'limit': 100, 'items': [
        {'fields': [
          {'name': 'titi', 'id': 'titi', 'type': 'Text'}
        ], 'name': 'toto', 'sys': {'id': '1f8imnXqLIscus86aSycu0', 'type': 'ContentType', 'createdAt': '2014-12-15T09:28:55.863Z', 'createdBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '2v4oI5U2gjufo77Kb2DQSr'}}, 'space': {'sys': {'type': 'Link', 'linkType': 'Space', 'id': 'SRC_SPACE'}}, 'firstPublishedAt': '2014-12-15T09:29:05.910Z', 'publishedCounter': 1, 'publishedAt': '2014-12-15T09:29:05.910Z', 'publishedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '2v4oI5U2gjufo77Kb2DQSr'}}, 'publishedVersion': 12, 'version': 13, 'updatedAt': '2014-12-15T09:29:05.961Z', 'updatedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '2v4oI5U2gjufo77Kb2DQSr'}}}, 'displayField': 'titi'}
      ]});

    contentfulApiNock.get('/spaces/DEST_SPACE/content_types/1f8imnXqLIscus86aSycu0?access_token=TOKEN_MANAGEMENT')
      .reply(404, {'sys': {'type': 'Error', 'id': 'NotFound'}, 'message': 'The resource could not be found.', 'details': {'type': 'ContentType', 'space': 'DEST_SPACE', 'id': '1f8imnXqLIscus86aSycu0'}});

    contentfulApiNock.put('/spaces/DEST_SPACE/content_types/1f8imnXqLIscus86aSycu0?access_token=TOKEN_MANAGEMENT', {'sys': {'id': '1f8imnXqLIscus86aSycu0', 'version': 13, 'type': 'ContentType', 'publishedVersion': 12, 'createdAt': '2014-12-15T09:28:55.863Z', 'createdBy': {'sys': {'id': '2v4oI5U2gjufo77Kb2DQSr', 'type': 'Link', 'linkType': 'User'}}, 'publishedAt': '2014-12-15T09:29:05.910Z', 'publishedBy': {'sys': {'id': '2v4oI5U2gjufo77Kb2DQSr', 'type': 'Link', 'linkType': 'User'}}, 'updatedAt': '2014-12-15T09:29:05.961Z', 'updatedBy': {'sys': {'id': '2v4oI5U2gjufo77Kb2DQSr', 'type': 'Link', 'linkType': 'User'}}, 'space': {'sys': {'id': 'SRC_SPACE', 'type': 'Link', 'linkType': 'Space'}}}, 'fields': [
        {'name': 'titi', 'id': 'titi', 'type': 'Text'}
      ], 'name': 'toto', 'displayField': 'titi'})
      .reply(201, {'fields': [
        {'name': 'titi', 'id': 'titi', 'type': 'Text'}
      ], 'name': 'toto', 'displayField': 'titi', 'sys': {'id': '1f8imnXqLIscus86aSycu0', 'type': 'ContentType', 'version': 1, 'createdAt': '2014-12-15T09:29:37.142Z', 'createdBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'space': {'sys': {'type': 'Link', 'linkType': 'Space', 'id': 'DEST_SPACE'}}, 'updatedAt': '2014-12-15T09:29:37.143Z', 'updatedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}}});

    contentfulApiNock.put('/spaces/DEST_SPACE/content_types/1f8imnXqLIscus86aSycu0/published?access_token=TOKEN_MANAGEMENT')
      .reply(200, {'fields': [
        {'name': 'titi', 'id': 'titi', 'type': 'Text'}
      ], 'name': 'toto', 'displayField': 'titi', 'sys': {'id': '1f8imnXqLIscus86aSycu0', 'type': 'ContentType', 'createdAt': '2014-12-15T09:29:37.142Z', 'createdBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'space': {'sys': {'type': 'Link', 'linkType': 'Space', 'id': 'DEST_SPACE'}}, 'version': 2, 'updatedAt': '2014-12-15T09:29:37.652Z', 'updatedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'firstPublishedAt': '2014-12-15T09:29:37.652Z', 'publishedCounter': 1, 'publishedAt': '2014-12-15T09:29:37.652Z', 'publishedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'publishedVersion': 1}});

    synchronizeModels(done);
  });

  it('should update a model', function (done) {
    contentfulApiNock.get('/spaces/DEST_SPACE?access_token=TOKEN_MANAGEMENT')
      .reply(200, {'sys': {'type': 'Space', 'id': 'DEST_SPACE', 'version': 1, 'createdBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'createdAt': '2014-12-02T15:46:22Z', 'updatedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'updatedAt': '2014-12-02T15:46:22Z'}, 'name': 'Xebia2'});

    contentfulApiNock.get('/spaces/SRC_SPACE?access_token=TOKEN_MANAGEMENT')
      .reply(200, {'sys': {'type': 'Space', 'id': 'SRC_SPACE', 'version': 1, 'createdBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'createdAt': '2014-12-02T13:56:51Z', 'updatedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'updatedAt': '2014-12-02T13:56:51Z'}, 'name': 'Xebia'});

    contentfulApiNock.get('/spaces/SRC_SPACE/content_types?access_token=TOKEN_MANAGEMENT')
      .reply(200, {'sys': {'type': 'Array'}, 'total': 1, 'skip': 0, 'limit': 100, 'items': [
        {'fields': [
          {'name': 'contentful title', 'id': 'contentfulTitle', 'type': 'Symbol'},
          {'name': 'message', 'id': 'message', 'type': 'Text', 'required': true},
          {'name': 'number', 'id': 'number', 'type': 'Integer', 'required': true},
          {'name': 'text', 'id': 'text', 'type': 'Text', 'required': true}
        ], 'name': 'Info', 'sys': {'id': '1d4hSJN1CiACKao6G0QyKC', 'type': 'ContentType', 'createdAt': '2014-12-02T13:56:59.323Z', 'createdBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'space': {'sys': {'type': 'Link', 'linkType': 'Space', 'id': 'SRC_SPACE'}}, 'firstPublishedAt': '2014-12-02T13:57:53.334Z', 'publishedCounter': 4, 'publishedAt': '2014-12-03T14:44:10.367Z', 'publishedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'publishedVersion': 96, 'version': 97, 'updatedAt': '2014-12-03T14:44:10.381Z', 'updatedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}}, 'displayField': 'contentfulTitle'}
      ]});

    contentfulApiNock.get('/spaces/DEST_SPACE/content_types/1d4hSJN1CiACKao6G0QyKC?access_token=TOKEN_MANAGEMENT')
      .reply(200, {'fields': [
        {'name': 'contentful title', 'id': 'contentfulTitle', 'type': 'Symbol'},
        {'name': 'message', 'id': 'message', 'type': 'Text', 'required': true},
        {'name': 'number', 'id': 'number', 'type': 'Integer', 'required': true},
        {'name': 'text', 'id': 'text', 'type': 'Text', 'required': true}
      ], 'name': 'Info', 'displayField': 'contentfulTitle', 'sys': {'id': '1d4hSJN1CiACKao6G0QyKC', 'type': 'ContentType', 'createdAt': '2014-12-03T10:03:41.899Z', 'createdBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'space': {'sys': {'type': 'Link', 'linkType': 'Space', 'id': 'DEST_SPACE'}}, 'firstPublishedAt': '2014-12-03T10:03:42.425Z', 'publishedCounter': 9, 'publishedAt': '2014-12-15T09:19:38.549Z', 'publishedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'publishedVersion': 28, 'version': 29, 'updatedAt': '2014-12-15T09:19:38.597Z', 'updatedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}}});

    contentfulApiNock.put('/spaces/DEST_SPACE/content_types/1d4hSJN1CiACKao6G0QyKC?access_token=TOKEN_MANAGEMENT', {'fields': [
        {'name': 'contentful title', 'id': 'contentfulTitle', 'type': 'Symbol'},
        {'name': 'message', 'id': 'message', 'type': 'Text', 'required': true},
        {'name': 'number', 'id': 'number', 'type': 'Integer', 'required': true},
        {'name': 'text', 'id': 'text', 'type': 'Text', 'required': true}
      ], 'name': 'Info', 'displayField': 'contentfulTitle'})
      .reply(200, {'fields': [
        {'name': 'contentful title', 'id': 'contentfulTitle', 'type': 'Symbol'},
        {'name': 'message', 'id': 'message', 'type': 'Text', 'required': true},
        {'name': 'number', 'id': 'number', 'type': 'Integer', 'required': true},
        {'name': 'text', 'id': 'text', 'type': 'Text', 'required': true}
      ], 'name': 'Info', 'displayField': 'contentfulTitle', 'sys': {'id': '1d4hSJN1CiACKao6G0QyKC', 'type': 'ContentType', 'createdAt': '2014-12-03T10:03:41.899Z', 'createdBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'space': {'sys': {'type': 'Link', 'linkType': 'Space', 'id': 'DEST_SPACE'}}, 'firstPublishedAt': '2014-12-03T10:03:42.425Z', 'publishedCounter': 9, 'publishedAt': '2014-12-15T09:19:38.549Z', 'publishedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'publishedVersion': 28, 'version': 30, 'updatedAt': '2014-12-15T09:19:57.821Z', 'updatedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}}});

    contentfulApiNock.put('/spaces/DEST_SPACE/content_types/1d4hSJN1CiACKao6G0QyKC/published?access_token=TOKEN_MANAGEMENT')
      .reply(200, {'fields': [
        {'name': 'contentful title', 'id': 'contentfulTitle', 'type': 'Symbol'},
        {'name': 'message', 'id': 'message', 'type': 'Text', 'required': true},
        {'name': 'number', 'id': 'number', 'type': 'Integer', 'required': true},
        {'name': 'text', 'id': 'text', 'type': 'Text', 'required': true}
      ], 'name': 'Info', 'displayField': 'contentfulTitle', 'sys': {'id': '1d4hSJN1CiACKao6G0QyKC', 'type': 'ContentType', 'createdAt': '2014-12-03T10:03:41.899Z', 'createdBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'space': {'sys': {'type': 'Link', 'linkType': 'Space', 'id': 'DEST_SPACE'}}, 'firstPublishedAt': '2014-12-03T10:03:42.425Z', 'publishedCounter': 10, 'publishedAt': '2014-12-15T09:19:58.734Z', 'publishedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}, 'publishedVersion': 30, 'version': 31, 'updatedAt': '2014-12-15T09:19:58.734Z', 'updatedBy': {'sys': {'type': 'Link', 'linkType': 'User', 'id': '54d2tbbHxWntLgXUA6O72y'}}}});

    synchronizeModels(done);
  });
});
