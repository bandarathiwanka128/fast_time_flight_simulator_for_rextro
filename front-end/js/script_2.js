


function createCircle(lt, lg){
  var circle = new google.maps.Circle({
    strokeColor: "#FF0000", // Set the stroke color of the circle
    strokeOpacity: 0.8, // Set the stroke opacity
    strokeWeight: 2, // Set the stroke weight
    fillColor: "#FF0000", // Set the fill color of the circle
    fillOpacity: 0.35, // Set the fill opacity
    map: map, // Set the map instance
    center: { lat: lt,  lng: lg }, // Set the center coordinates
    radius: 20000, // Set the radius in meters
    visibility : true,
    count : 0
  });
  return circle;
}

function blinkCircle(latitude, longitude) {
  //console.log("Inside blink circle");
  const center = new google.maps.LatLng(latitude, longitude);

  // Create new circle
  const circle = new google.maps.Circle({
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.35,
    map: map,
    center: center,
    radius: 50000, // Adjust the radius as per your requirement
  });

  // Blink the circle for 5 seconds
  let blinkCount = 0;
  const blinkTimer = setInterval(() => {
    if (blinkCount % 2 === 0) {
      circle.setOptions({ fillOpacity: 0.35, strokeOpacity: 0.8 });
    } else {
      circle.setOptions({ fillOpacity: 0, strokeOpacity: 0 });
    }
    blinkCount++;

    if (blinkCount > 5) {
      clearInterval(blinkTimer);
      // Remove the circle from the map
      circle.setMap(null);

      // Remove the circle and timer from the arrays
      const index = circles.indexOf(circle);
      if (index !== -1) {
        circles.splice(index, 1);
        blinkTimers.splice(index, 1);
      }
    }
  }, 500);

  // Add the circle and timer to the arrays
  circles.push(circle);
  blinkTimers.push(blinkTimer);
}


// calculate the gradient of the straight line path
function calcGradient(x1, y1, x2, y2){
  var gradient = (y2 - y1)/(x2 - x1);
  return gradient;
}

// claculate the intercept of the straight line path
function calcIntercept(x, y, m){
  var intercept = y - m*x;
  return intercept;
}


// marker creating function - used for creating waypoints
function createMarker(coordinates, label){
  var marker = new google.maps.Marker({
    map:map,
    icon:{
      url : "./images/waypoint2.png",
      scaledSize: new google.maps.Size(10, 10)
    },
    position : {lat : coordinates.lat, lng : coordinates.lng},
    setTitle : coordinates.label
    //label : coordinates.label
  })
  return marker;
}


// calculate the angle of the plane marker according to the path in degrees
function clacPlaneAngle(tanVal){
  let tanInverse = Math.atan(tanVal) * (180/ Math.PI);
  if(tanInverse < 0){
    tanInverse = tanInverse + 180;
  }
  return tanInverse;
}

/*generate a string according to the gradient of the plane path so that the appropriate rotated
  marker can be used*/
function makeImageString(angle){

  // get the integer of the division
  var ans = Math.floor(angle / 10);
  var remainder = angle % 10;

  if(remainder >= 5){
    ans = ans + 1;
  }

  // convert the integer to a string
  var fileName = './images/planes/' + (ans*10).toString() + '.png'
  return fileName;
}

// this function is not used. 'initialString_2()' is used instead of this.
function initalString(initLat, initLng, gateWay){
  var grad = calcGradient(initLng, initLat, gateWay.lng, gateWay.lat);
  tanvalue = clacPlaneAngle(grad);
  if(initLat > gateWay.lat){
    tanvalue = tanvalue + 180;
  }
  markerName = makeImageString(tanvalue-40);
  return markerName;

}

// this is the working function
function initalString_2(initLat, initLng, nextLat, nextLng){
  var grad = calcGradient(initLng, initLat, nextLng, nextLat);
  tanvalue = clacPlaneAngle(grad);
  if(initLat > nextLat){
    tanvalue = tanvalue + 180;
  }
  markerName = makeImageString(tanvalue-40);
  return markerName;

}

function rearrangeArray(inputString) {
  inputString = inputString.slice(1, -1);
  // split the input string by commas
  const elements = inputString.split(",");
  // create a new array of strings
  const outputArray = elements.map((element) => {
    element = element.trim().replace(/^\s+|\s+$/g, '');
    // return the element as a string
    return String(element);
  });
  // return the output array
  return outputArray;
}
  
function compareTime(inputTime, name) {
  // Split the input time string into hours, minutes, and seconds
  const [inputHours, inputMinutes, inputSeconds] = inputTime.split('.').map(Number);

  // Get the current local machine time as hours, minutes, and seconds
  const localDate = new Date();
  const localHours = localDate.getHours();
  const localMinutes = localDate.getMinutes();
  const localSeconds = localDate.getSeconds();

  //console.log('callsign = '+name+' ,loacalTIme = '+localHours+':'+localMinutes+':'+localSeconds+', inputTime = '+inputTime);
  let numMins;
  if(localMinutes == '00'){
    numMins = '59';
  }
  else{
    numMins = Number(localMinutes) - 1;
    numMins = numMins.toString();
  }
  
  // Compare inputTime to local time
  if (inputHours > localHours ||
    (inputHours === localHours && inputMinutes > localMinutes) ||
    (inputHours === localHours && inputMinutes === localMinutes && inputSeconds > localSeconds)) {
    return false; //inputTime is greater than current local time
  } else if((inputHours === localHours && inputMinutes === localMinutes && inputSeconds > (localSeconds-6)) ||
            (inputHours === localHours && inputMinutes === localMinutes && inputSeconds === localSeconds)) {

            //(inputHours === localHours && inputMinutes >= numMins)) {
    return true; //inputTime is less than or equal to current local time
  }
}

function flattenAndRemoveDuplicates(array2D) {
  const flattenedArray = array2D.flat();
  const uniqueValues = new Set();

  // Create an array to store the final result
  const result = [];

  // Iterate over each value in the flattened array
  for (const value of flattenedArray) {
    // Add the value to the result array if it's not already present in the uniqueValues Set
    if (!uniqueValues.has(value)) {
      result.push(value);
      uniqueValues.add(value);
    }
  }
  return result;
}

function displayInfo(callsign, departure_time, origin, dest, routing) {
  console.log('display')
  console.log(callsign)

  document.getElementById("callsignLabel").textContent = callsign;
  document.getElementById("departureTimeLabel").textContent = departure_time;
  document.getElementById("originLabel").textContent = origin;
  document.getElementById("destinationLabel").textContent = dest;
  document.getElementById("routingLabel").textContent = routing;
}

// Helper function to convert radians to degrees
function toDegrees(radians) {
  return radians * (180 / Math.PI);
}
// Helper function to convert degrees to radians
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Function to calculate the new location along the straight line path
function calculateNewPositionOnCircle(initialLatitude, initialLongitude, finalLatitude, finalLongitude, distance) {
  const earthRadius = 6371000; // Earth's approximate radius in meters (WGS84 ellipsoid)

  // Convert degrees to radians
  const initialLatitudeRad = toRadians(initialLatitude);
  const initialLongitudeRad = toRadians(initialLongitude);
  const finalLatitudeRad = toRadians(finalLatitude);
  const finalLongitudeRad = toRadians(finalLongitude);

  // Calculate the angular distance between the two points
  // const angularDistance = 2 * Math.asin(Math.sqrt(
  //     Math.pow(Math.sin((finalLatitudeRad - initialLatitudeRad) / 2), 2) +
  //     Math.cos(initialLatitudeRad) * Math.cos(finalLatitudeRad) * Math.pow(Math.sin((finalLongitudeRad - initialLongitudeRad) / 2), 2)
  // ));

  // Calculate the azimuth from the initial point to the final point
  const azimuth = Math.atan2(
      Math.sin(finalLongitudeRad - initialLongitudeRad) * Math.cos(finalLatitudeRad),
      Math.cos(initialLatitudeRad) * Math.sin(finalLatitudeRad) -
      Math.sin(initialLatitudeRad) * Math.cos(finalLatitudeRad) * Math.cos(finalLongitudeRad - initialLongitudeRad)
  );

  // Calculate the new latitude and longitude
  const newLatitude = Math.asin(
      Math.sin(initialLatitudeRad) * Math.cos(distance / earthRadius) +
      Math.cos(initialLatitudeRad) * Math.sin(distance / earthRadius) * Math.cos(azimuth)
  );
  const newLongitude = initialLongitudeRad + Math.atan2(
      Math.sin(azimuth) * Math.sin(distance / earthRadius) * Math.cos(initialLatitudeRad),
      Math.cos(distance / earthRadius) - Math.sin(initialLatitudeRad) * Math.sin(newLatitude)
  );

  // Convert radians to degrees
  const newLatitudeDeg = toDegrees(newLatitude);
  const newLongitudeDeg = toDegrees(newLongitude);

  return { latitude: newLatitudeDeg, longitude: newLongitudeDeg };
}

function createTimeCollection(){
  const now = new Date();
  const presentHour = now.getHours();
  current_hour = presentHour;

  // Calculate the next hour
  const nextHour = (presentHour + 1) % 24;
  return current_hour + '-' + nextHour;
}

function getHourRange(timeStr) {
  // Parse the input time string
  const [hours, minutes, seconds] = timeStr.split('.').map(Number);

  // Calculate the hour based on minutes (and seconds) for finer resolution
  const calculatedHour = hours + (minutes / 60) + (seconds / 3600);

  // Determine the hour range
  let hourRangeStart = Math.floor(calculatedHour);
  let hourRangeEnd = hourRangeStart + 1;

  // Adjust hour range for the case of 23rd hour
  if (hourRangeStart === 23) {
      hourRangeEnd = '00';
  } else if (hourRangeEnd === 24) {
      hourRangeStart = '23';
  }

  return `${hourRangeStart}-${hourRangeEnd}`;
}


function detectLineCrossing(pathWaypointSequence, markedRegionPolygon){
  //console.log('inside detectLineCrossing')

  const pathWaypoints = pathWaypointSequence.map(waypointName => {
    return gateWays.find(waypoint => waypoint.label === waypointName);
  });
  
  const intersectsMarkedRegion = doesPathIntersectMarkedRegion(pathWaypoints, markedRegionPolygon);

  if (intersectsMarkedRegion) {
    //console.log('intersected____')
    return true;
  } else { 
    //console.log('Not intersected .....')
    return false;
  }
}

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

// function doesPathIntersectMarkedRegion(pathWaypoints, markedRegionPolygon) {
//   for (let i = 0; i < pathWaypoints.length - 1; i++) {
  
//     const startPoint = new google.maps.LatLng(pathWaypoints[i].lat, pathWaypoints[i].lng);
//     const endPoint = new google.maps.LatLng(pathWaypoints[i + 1].lat, pathWaypoints[i + 1].lng);
    

//     if (
//       google.maps.geometry.poly.containsLocation(startPoint, markedRegionPolygon) ||
//       google.maps.geometry.poly.containsLocation(endPoint, markedRegionPolygon)
//     ) {
//       return true; // Flight path intersects the marked region
//     }
//   }

//   return false; // Flight path does not intersect the marked region
// }

function generateAltitudes(waypointCount) {
  const validFirstLastValues = ['7000', '12000'];
  const validMiddleValues = ['33000', '31000', '36000', '38000', '41000'];

  if (waypointCount === 2) {
    return [validFirstLastValues[0], validFirstLastValues[1]];
  }

  const waypoints = [];

  for (let i = 0; i < waypointCount; i++) {
    if (i === 0 || i === waypointCount - 1) {
      waypoints.push(validFirstLastValues[Math.floor(Math.random() * validFirstLastValues.length)]);
    } else {
      waypoints.push(validMiddleValues[Math.floor(Math.random() * validMiddleValues.length)]);
    }
  }

  return waypoints;
}

function generateSpeeds(waypointCount) {
  const validFirstLastValues = ['8240', '9280', '8160'];
  const validMiddleValues = ['8000', '8600', '8920', '8800', '8200'];

  if (waypointCount === 2) {
    return [validFirstLastValues[0], validFirstLastValues[1]];
  }

  const waypoints = [];

  for (let i = 0; i < waypointCount; i++) {
    if (i === 0 || i === waypointCount - 1) {
      waypoints.push(validFirstLastValues[Math.floor(Math.random() * validFirstLastValues.length)]);
    } else {
      waypoints.push(validMiddleValues[Math.floor(Math.random() * validMiddleValues.length)]);
    }
  }

  return waypoints;
}

function doesPathIntersectMarkedRegion(pathWaypoints, markedRegionPolygon) {
  for (let i = 0; i < pathWaypoints.length - 1; i++) {
    const startPoint = pathWaypoints[i];
    const endPoint = pathWaypoints[i + 1];

    // Get the vertices of the marked region polygon
    const markedRegionVertices = markedRegionPolygon.getPath().getArray();
    //console.log(markedRegionVertices)
    for (let j = 0; j < markedRegionVertices.length; j++) {
    
      const vertex1 = markedRegionVertices[j];
      const vertex2 = markedRegionVertices[(j + 1) % markedRegionVertices.length];

      // Calculate the slope and y-intercept of the flight path segment
      const m1 = (endPoint.lat - startPoint.lat) / (endPoint.lng - startPoint.lng);
      const c1 = startPoint.lat - m1 * startPoint.lng;

      // Calculate the slope and y-intercept of the marked region edge
      const m2 = (vertex2.lat() - vertex1.lat()) / (vertex2.lng() - vertex1.lng());
      const c2 = vertex1.lat() - m2 * vertex1.lng();

      // Calculate the latitude (y-coordinate) of intersection
      const intersection_lat = (c2 - c1) / (m1 - m2);

      // Check if the intersection_lat is within bounds
      if (
        intersection_lat >= Math.min(startPoint.lng, endPoint.lng) &&
        intersection_lat <= Math.max(startPoint.lng, endPoint.lng) &&
        intersection_lat >= Math.min(vertex1.lng(), vertex2.lng()) &&
        intersection_lat <= Math.max(vertex1.lng(), vertex2.lng())
      ) {
        return true; // Flight path intersects the marked region
      }
    }
  }

  return false; // Flight path does not intersect the marked region
}




// function rayCrossesSegment(point, p1, p2) {
//   const x = point.lng();
//   const y = point.lat();

//   const x1 = p1.lng();
//   const y1 = p1.lat();
//   const x2 = p2.lng();
//   const y2 = p2.lat();

//   return ((y1 > y) !== (y2 > y)) && (x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1);
// }

// function doesPathIntersectMarkedRegion(pathWaypoints, markedRegionPolygon) {
//   for (let i = 0; i < pathWaypoints.length - 1; i++) {
//     const startPoint = new google.maps.LatLng(pathWaypoints[i].lat, pathWaypoints[i].lng);
//     const endPoint = new google.maps.LatLng(pathWaypoints[i + 1].lat, pathWaypoints[i + 1].lng);

//     let isIntersecting = false;
//     for (let j = 0; j < markedRegionPolygon.getPath().getLength(); j++) {
//       const vertex1 = markedRegionPolygon.getPath().getAt(j);
//       const vertex2 = markedRegionPolygon.getPath().getAt((j + 1) % markedRegionPolygon.getPath().getLength());

//       if (rayCrossesSegment(startPoint, vertex1, vertex2) || rayCrossesSegment(endPoint, vertex1, vertex2)) {
//         isIntersecting = true;
//         break;
//       }
//     }

//     if (isIntersecting) {
//       return true; // Flight path intersects the marked region
//     }
//   }

//   return false; // Flight path does not intersect the marked region
// }




