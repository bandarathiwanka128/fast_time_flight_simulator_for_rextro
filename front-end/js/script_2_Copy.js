//send a get request to fetch the flight data at each hour





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

    if (blinkCount > 10) {
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

function rearrangeArray(inputString){
  // remove initial '[' and final ']' characters
  inputString = inputString.slice(1, -1);
  // split the input string by commas
  const elements = inputString.split(",");
  // create a new array of strings
  const outputArray = elements.map((element) => {
    // remove any leading or trailing whitespace
    element = element.trim();
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
  } else if((inputHours === localHours && inputMinutes === localMinutes && inputSeconds > (localSeconds-8)) ||
            (inputHours === localHours && inputMinutes === localMinutes && inputSeconds === localSeconds)) {

            //(inputHours === localHours && inputMinutes >= numMins)) {
    return true; //inputTime is less than or equal to current local time
  }
}

function flattenAndRemoveDuplicates(array2D) {
  // Flatten the 2D array
  const flattenedArray = array2D.flat();

  // Create a Set to store non-duplicated values
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

