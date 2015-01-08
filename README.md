Tool to synchronize model, entries and assets between two Contentful spaces.

### How to use?

- Create a config file following the example in examples/config.json
- To synchronize contents and models :
```
  node ./bin/fullSync.js -c path/to/config`
```
- To synchronize only the contents (entries and assets)
```
  node ./bin/fullSync.js -c path/to/config -t content
```
- To synchronize only the models
```
  node ./bin/fullSync.js -c path/to/config -t model
```
