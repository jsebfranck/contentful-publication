#!/usr/bin/env node

'use strict';

var Sync = require('../lib/Sync');
var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');

var config = JSON.parse(fs.readFileSync(argv.c));
var sync = Sync.fromConfig(config);
sync.verbose = config.verbose;
sync.run();
