Omg.Utils.Geo = {

  MIN_LAT: -90 * Math.PI/180,  // -PI/2
  MAX_LAT: 90 * Math.PI/180,  //  PI/2
  MIN_LON: -180 * Math.PI/180, // -PI
  MAX_LON: 180 * Math.PI/180,  //  PI

  computeBoundingCoordinates: function(coords, distance, radius) {
    radius = 6371.01; // Size of the earth in kilometers

    if (!distance || !radius) {
      return;
    }

    var radDist = distance / radius;

    coords.radLat *= Math.PI/180;
    coords.radLon *= Math.PI/180;

    var minLat = coords.radLat - radDist;
    var maxLat = coords.radLat + radDist;
    var minLon, maxLon, deltaLon;

    if (minLat > Omg.Utils.Geo.MIN_LAT && maxLat < Omg.Utils.Geo.MAX_LAT) {
      
      deltaLon = Math.asin( Math.sin(radDist) / Math.cos(coords.radLat) );
      
      minLon = coords.radLon - deltaLon;
      if (minLon < Omg.Utils.Geo.MIN_LON) {
        minLon += 2 * Math.PI;
      }
      
      maxLon = coords.radLon + deltaLon;
      if (maxLon > Omg.Utils.Geo.MAX_LON) {
        maxLon -= 2 * Math.PI;
      }
    } else {
      // a pole is within the distance
      minLat = Math.max(minLat, Omg.Utils.Geo.MIN_LAT);
      maxLat = Math.min(maxLat, Omg.Utils.Geo.MAX_LAT);
      minLon = Omg.Utils.Geo.MIN_LON;
      maxLon = Omg.Utils.Geo.MAX_LON;
    }

    return {
      minLat: Omg.Utils.Geo.toDegrees(minLat), 
      minLon: Omg.Utils.Geo.toDegrees(minLon), 
      maxLat: Omg.Utils.Geo.toDegrees(maxLat),
      maxLon: Omg.Utils.Geo.toDegrees(maxLon)
    };
  },

  toDegrees: function(val) {
    return val * 180 / Math.PI;
  },
 
  toRadians: function(val) {
    return val *= Math.PI/180;
  }
}