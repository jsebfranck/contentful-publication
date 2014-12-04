#!/usr/bin/env node

'use strict';

var ModelSync = require('../lib/ModelSync');
var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');

var config = JSON.parse(fs.readFileSync(argv.c));
var modelSync = new ModelSync(config.contentful);
modelSync.run();
