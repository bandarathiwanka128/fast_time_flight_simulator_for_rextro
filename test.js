function generateWaypoints(waypointCount) {
  const validFirstLastValues = ['7000', '12000'];
  const validMiddleValues = ['33000', '31000', '36000', '38000', '41000'];

  if (waypointCount === 2) {
    return [validFirstLastValues[0], validFirstLastValues[1]];
  }

  const middleIndex = Math.floor(waypointCount / 2);
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

const waypointCount = 2; // Change this value as needed
const result = generateWaypoints(waypointCount);
console.log(result);
