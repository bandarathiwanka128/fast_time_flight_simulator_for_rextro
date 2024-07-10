class Graph {
    constructor() {
        this.nodes = new Map();
    }

    addNode(nodeName) {
        if (!this.nodes.has(nodeName)) {
            this.nodes.set(nodeName, []);
        }
    }

    addEdge(source, destination, weight) {
        this.addNode(source);
        this.addNode(destination);

        this.nodes.get(source).push({ node: destination, weight: weight });
        this.nodes.get(destination).push({ node: source, weight: weight }); // If the graph is undirected
    }

    getNeighborsWithDistances(nodeName) {
        const neighbors = this.nodes.get(nodeName);
        return neighbors.map(neighbor => ({
            node: neighbor.node,
            distance: neighbor.weight
        }));
    }
}


function createGraph(waypointArray, gateways) {
    const graph = new Graph();

    for (const connection of waypointArray) {
        const [source, destination] = connection;
        
        const sourceGateway = gateways.find(gateway => gateway.name === source);
        const destGateway = gateways.find(gateway => gateway.name === destination);
        
        if (sourceGateway && destGateway) {
            const weight = haversineDistance(sourceGateway.lat, sourceGateway.lng, destGateway.lat, destGateway.lng);
            graph.addEdge(source, destination, weight);
        }
    }
    
    console.log('Graph with weights created');
    return graph;
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
  
  // Helper function to convert degrees to radians
  function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }


