### TODO

- Tests : finish content sync tests
- Perf : don't retrieve the space for each item to synchronize
- store last token in s3?
- don't update content models if nothing changed

### How to use

- create config file following the example in examples/config.json
- To synchronize contents and models :
```
  node ./bin/fullSync.js -c path/to/config`
```
- To synchronize only the contents
```
  node ./bin/fullSync.js -c path/to/config -t content
```
- To synchronize only the models
```
  node ./bin/fullSync.js -c path/to/config -t model
```
