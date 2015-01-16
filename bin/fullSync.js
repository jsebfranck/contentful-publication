#!/usr/bin/env node

'use strict';

var ContentSync = require('../lib/ContentSync'),
  ModelSync = require('../lib/ModelSync'),
  argv = require('minimist')(process.argv.slice(2)),
  logger = require('../lib/logger'),
  fs = require('fs');

if (!argv.c || argv.help || argv.h) {
  console.log([
    'USAGE: contentful-publication -c <CONFIG_FILE> [OPTIONS]',
    '',
    'Options:',
    '',
    '  -t          Select the type of data to sync. "model" will only copy',
    '              content types while "content" will sync entries and assets.',
    '',
    '  -h, --help  Show this help.'
  ].join('\n'));
  process.exit(argv.c ? 0 : 1);
}

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
