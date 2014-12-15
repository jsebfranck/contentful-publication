### TODO

- Tests : finish content sync tests
- Perf : don't retrieve the space for each item to synchronize
- store last token in s3

### How to use

- create config file like the example
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
