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

### TODO

- Publication problem : Contents are not returned in the good order by the Sync API. So some contents could not be published if they have a relationship 
with another content not returned yet by the Sync API
- Bi-directionnal synchronization problem : don't update content models if nothing changed
- Freeze problem : why the script freezes after more than 1 hour?
- Nice to have : store last token in s3?
