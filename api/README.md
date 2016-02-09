Configuring the API to run locally
========================================

```bash
$ cd omgtransit-public/api
$ NODE_ENV=local node app.js
```

Configuring the bulk updaters to run locally
========================================
Some of the transit systems, car2go, bikeshares, etc need to be bulk updated periodically.  The "updaters" background process will handle that.

```bash
$ cd omgtransit-public/api
$ NODE_ENV=local node background/updaters.js
```

NOTES
=====

API KEYS, ETC
=====
A .env file must be created at the root of the api folder with key/value pairs for the different systems.

```bash
mongo_host=HOST_STRING
gcm_android_key=ADD_KEY_HERE
google_maps_key=ADD_KEY_HERE
car2go_key=ADD_KEY_HERE
cyclocity_key=ADD_KEY_HERE
bcycle_key=ADD_KEY_HERE
bart_key=ADD_KEY_HERE
cta_bus_key=ADD_KEY_HERE
cta_train_key=ADD_KEY_HERE
wdc_key=ADD_KEY_HERE
uber_key=ADD_KEY_HERE
sidecar_key=ADD_KEY_HERE
hailo_key=ADD_KEY_HERE
forecast_io_key=ADD_KEY_HERE
```