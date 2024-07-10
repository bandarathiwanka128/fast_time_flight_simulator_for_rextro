class Graph {
    constructor() {
        this.nodes = new Map();
        this.nodeCount = 0;
    }

    addNode(nodeName) {
        this.nodeCount++;
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

    getNeighbors(nodeName) {
        const neighbors = this.nodes.get(nodeName);
        return neighbors.map(neighbor => ({
            node: neighbor.node,
            distance: neighbor.weight
        }));
    }

    // Dijkstra's algorithm to find the shortest path
    findShortestPath(startNode, endNode, excludedNodes = ['VJR', 'GUPTA', 'SAROX']) {
        //console.log(' endNode = '+endNode)
        const distances = new Map();
        const previousNodes = new Map();
        const queue = [];

        // Initialize distances and queue
        this.nodes.forEach((_, nodeName) => {
            distances.set(nodeName, Infinity);
            previousNodes.set(nodeName, null);
            queue.push(nodeName);
        });
        distances.set(startNode, 0);

        while (queue.length > 0) {
            // Find the node with the smallest distance in the queue
            const closestNode = queue.reduce((minNode, node) =>
                distances.get(node) < distances.get(minNode) ? node : minNode
            );
            //console.log(closestNode);

            // Remove the closest node from the queue
            queue.splice(queue.indexOf(closestNode), 1);

            // Stop if we reached the end node
            if (closestNode === endNode) {
                break;
            }

            // Skip excluded nodes
            if (excludedNodes.includes(closestNode)) {
                continue;
            }

            // Update distances to neighbors
            const neighbors = this.getNeighbors(closestNode);
            for (const neighbor of neighbors) {
                const distance = distances.get(closestNode) + neighbor.distance;
                if (distance < distances.get(neighbor.node)) {
                    distances.set(neighbor.node, distance);
                    previousNodes.set(neighbor.node, closestNode);
                }
            }
        }

        //Build the shortest path
        var path = [];
        let currentNode = endNode;
        let i = 0;
        while (currentNode !== startNode) {
            i++;
            //console.log('hi')
            path.unshift(currentNode);
            currentNode = previousNodes.get(currentNode);
            if(i > this.nodeCount){
                console.log('no path')
                return null;
            }
        }
        path.unshift(startNode);
        return path;
    }

    findValidShortestPath(startNode, endNode, excludedNodes = ['VJR', 'GUPTA', 'SAROX']) {
        let shortestPath = this.findShortestPath(startNode, endNode);
        //console.log('shortestPath = '+shortestPath)

        while ((shortestPath != null) && detectLineCrossing(shortestPath, markedRegionPolygon)) {
            //console.log('detected crossing')
            excludedNodes.push(shortestPath[1]); // Exclude the second waypoint of the previous path
            if(shortestPath.length == 2 || shortestPath.length < 2){
                return null;
            }
            shortestPath = this.findShortestPath(startNode, endNode, excludedNodes);
            //console.log('shortestPath = '+shortestPath)

        }
        return shortestPath;
    }
}


function createGraph(waypointArray, gateways) {
    const graph = new Graph();

    for (const connection of waypointArray) {
        const [source, destination] = connection;
        
        const sourceGateway = gateways.find(gateway => gateway.label === source);
        const destGateway = gateways.find(gateway => gateway.label === destination);
        
        if (sourceGateway && destGateway) {
            const weight = haversineDistance(sourceGateway.lat, sourceGateway.lng, destGateway.lat, destGateway.lng);
            graph.addEdge(source, destination, weight);
        }
    }
    
    console.log('Graph created');
    return graph;
}

