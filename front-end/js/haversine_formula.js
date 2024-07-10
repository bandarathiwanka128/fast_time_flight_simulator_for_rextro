function haversineDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000; // Earth's approximate radius in meters (WGS84 ellipsoid)

  // Convert degrees to radians
  const lat1Rad = toRadians(lat1);
  const lon1Rad = toRadians(lon1);
  const lat2Rad = toRadians(lat2);
  const lon2Rad = toRadians(lon2);

  // Calculate the differences between the latitudes and longitudes
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;

  // Calculate the square of half the chord length between the points
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  // Calculate the angular distance in radians
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Calculate the distance using the Earth's radius
  const distance = earthRadius * c;

  return distance;
}

// Helper function to convert degrees to radians
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Example usage:
const latitude1 = 7.61890;
const longitude1 = 80.20711;
const latitude2 = 7.61903;
const longitude2 = 80.22148;

const distance = haversineDistance(latitude1, longitude1, latitude2, longitude2);
console.log("Distance between the two points:", distance, "meters");
