### TODO

- test for two sync requests
- tests for content model
- don't retrieve the space for each item to synchronize
- one script to synchronize model and contents
- store last token in s3
- errors management
- winston
- replace bluebird by Q
- replace questor by request

### How to use

- create config file like the example
- node ./bin/fullSync.js -c path/to/config -t content|model|nothing