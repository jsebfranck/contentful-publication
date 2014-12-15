### TODO

- Tests : finish content sync tests
- Perf : don't retrieve the space for each item to synchronize
- store last token in s3?
- don't update content models if nothing changed

### How to use

- create config file following the example in examplces/config.json
- Please note that source token must be a content delivery token, whereas destination token must be a content management token.
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
