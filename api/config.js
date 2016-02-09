exports.mappings={};

exports.mappings.stop={
  "properties": {
    "location": {
      "type": "geo_point"
    },
    "source_id": {
      "type": "long"
    },
    "stop_city": {
      "type": "string"
    },
    "stop_id": {
      "type": "string"
    },
    "stop_name": {
      "type": "string"
    },
    "stop_street": {
      "type": "string"
    },
    "stop_type": {
      "type": "long"
    },
    "stop_url": {
      "type": "string"
    },
    "updated": {
      "type": "long"
    }
  }
};