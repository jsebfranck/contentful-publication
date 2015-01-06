#!/usr/bin/env node

'use strict';

var ContentSync = require('../lib/ContentSync'),
  ModelSync = require('../lib/ModelSync'),
  argv = require('minimist')(process.argv.slice(2)),
  logger = require('../lib/logger'),
  fs = require('fs');

var config = JSON.parse(fs.readFileSync(argv.c)),
  contentSync = ContentSync.fromConfig(config),
  modelSync = new ModelSync(config);

var type = argv.t ? argv.t : '';

switch (type) {
  case 'model':
    modelSync.run()
      .then(function () {
        logger.info('Synchronization is over');
      })
      .catch(function (error) {
        logger.error('Synchronization error ', error);
      });
    ;
    break;
  case 'content' :
    contentSync.run()
      .then(function () {
        logger.info('Synchronization is over');
      })
      .catch(function (error) {
        logger.error('Synchronization error ', error);
      });
    break;
  default:
    modelSync.run()
      .then(function () {
        return contentSync.run();
      })
      .then(function () {
        logger.info('Synchronization is over');
      })
      .catch(function (error) {
        logger.error('Synchronization error ', error);
      });
    break;
}