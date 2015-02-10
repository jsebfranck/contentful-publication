# contentful-publication

[![Build Status](https://travis-ci.org/jsebfranck/contentful-publication.svg?branch=master)](https://travis-ci.org/jsebfranck/contentful-publication.js)

Tool to synchronize model, entries and assets between two Contentful spaces.

### Install

```
npm install -g contentful-publication
```

### How to use?

- Create a config file following the example in examples/config.json
- To synchronize contents and models :
```
  contentful-publication -c path/to/config
```
- To synchronize only the contents (entries and assets)
```
  contentful-publication -c path/to/config -t content
```
- To synchronize only the models
```
  contentful-publication -c path/to/config -t model
```
