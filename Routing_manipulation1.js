function createUniqueWaypointPairs(data) {
  const pairsSet = new Set();

  data.forEach(document => {
    const waypointPath = document.Routing;
    const waypoints = waypointPath.split(' ');

    for (let i = 0; i < waypoints.length - 1; i++) {
      const pair = [waypoints[i], waypoints[i + 1]];
      const sortedPair = pair.slice().sort(); // Sort the pair to make order irrelevant
      pairsSet.add(JSON.stringify(sortedPair));
    }
  });

  const uniquePairs = Array.from(pairsSet).map(pair => JSON.parse(pair));
  return uniquePairs;
}

// Simulating JSON objects retrieved from MongoDB
const databaseData = [
  { Routing: "WBGB VBU VSI VKG WBGG" },
  { Routing: "VBU VSI VKG WBGG" },
  { Routing: "VSI VBU VKG WBGG" }
];

const uniqueWaypointPairs = createUniqueWaypointPairs(databaseData);
console.log(uniqueWaypointPairs);
