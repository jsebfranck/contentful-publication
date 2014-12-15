#!/usr/bin/env node

'use strict';

var ContentSync = require('../lib/Sync'),
  ModelSync = require('../lib/ModelSync'),
  argv = require('minimist')(process.argv.slice(2)),
  fs = require('fs');

var config = JSON.parse(fs.readFileSync(argv.c)),
  sync = ContentSync.fromConfig(config),
  modelSync = new ModelSync(config);

var type = argv.t ? argv.t : '';

switch (type) {
  case 'model':
    modelSync.run();
    break;
  case 'content' :
    sync.run();
    break;
  default:
    modelSync.run();
    sync.run();
    break;
}