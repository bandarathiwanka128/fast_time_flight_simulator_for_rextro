//http://localhost:3000/themap.html?username=ff

const express = require('express');
//const theUrl = require('');
const mongoose = require("mongoose");
const router = express.Router();
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const { log, error } = require('console');
const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
const { Transform } = require('json2csv');
const json2csv = require('json2csv').parse;
const csvParser = require('csv-parser');
const multer = require('multer')
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {User, Users, PlaneModel, RoutingTable, WaypointCollection, LandedFlightModel } = require("./models");

let count = 0;
const theUrl = '';
const app = express();
// const corsOptions = {
//   origin: 'https://demo.eminenceapps.com',
// };
app.use(cookieParser());
//app.use(cors(corsOptions));
var waypointList = [];
var planeList = [];

const apiUrl = '';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); 
app.use(session({
  secret: 'secret key',
  resave: false,
  saveUninitialized: false,
}));

//mongoose.connect('mongodb://127.0.0.1:27017/LoginSignUp',
//mongoose.connect('mongodb+srv://manjitha:P8PFFv7thmzzNAQE@cluster0.8wcby6i.mongodb.net/?retryWrites=true&w=majority',
mongoose.connect('mongodb+srv://manjitha:P8PFFv7thmzzNAQE@cluster0.8wcby6i.mongodb.net/LoginSignUp?retryWrites=true&w=majority',

  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
).then(() => {
  console.log('Connected to MongoDB');
  
})
.catch((error) => {
  console.log('Error connecting to MongoDB', error);
});

app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "../index.html");
  res.sendFile(filePath);
});

app.get("/grp11/backend/signup", (req, res) => {
  const filePath = path.join(__dirname,"../signup.html");
  res.sendFile(filePath);
});


const collectionNames = ['5-6', '6-7']; // Define the collection names

const server = app.listen(3000, () => {
    console.log('Server started');
});

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsFolder = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsFolder)) {
      fs.mkdirSync(uploadsFolder);
    }
    cb(null, uploadsFolder); // Define the destination folder where uploaded files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Define the filename of the uploaded file
  }
});
// Set up multer upload
const upload = multer({ storage });

/*
const WayPointSchema = new mongoose.Schema({
    Node_name: {
      type: String,
      required: true,
    },
    Lat: {
      type: Number,
      default: 0,
    },
    Lng:{
      type: Number,
      default: 0
    }
  }, { collection: 'WayPoints_100' });


const PlaneShcema = new mongoose.Schema({
  Callsign : {
    type : String,
    required : true,
  },
  Origin_Info:{
    type: String
  },
  Destination_Info : {
    type: String
  },
  path:{
    type: [String]
  },
  Routing : {
    type : String
  },
  Departure_Time : {
    type : String
  },
  Aircraft_Type : {
    type : String
  },
  Altitude : {
    type : [String]
  },
  landed_time : {
    type : String
  }
});

const altitudeSchema = new mongoose.Schema({
  TakeOff_levels : {
    type : String
  },
  Cruise_Levels : {
    type : String
  },
  Decent_levels : {
    type : String
  }
});

const landedFlightsSchema = new mongoose.Schema({
  callSign : {
    type : String
  },
  departure_time : {
    type : String
  },
  landed_time : {
    type : String
  },
  lat : {
    type : Number
  },
  lng : {
    type : Number
  }
});
const collection4 = mongoose.model('landed_flights', landedFlightsSchema);
*/



app.post("/grp11/backend/signup", async (req, res) => {

  try {
    // Create a new database for the user using their email as the database name
    const data = {
      name: req.body.username,
      password: req.body.password,
    };

    const existingUser = await Users.findOne({ name: req.body.username });
    if (existingUser) {
      const filePath = path.join(__dirname,"../nameExists.html");
      res.sendFile(filePath);
    } else {
      await Users.insertMany([data]);
      const userDbName = req.body.username;
      //const connectionUser = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${userDbName}`, {
      const connectionUser = await mongoose.createConnection(`mongodb+srv://manjitha:P8PFFv7thmzzNAQE@cluster0.8wcby6i.mongodb.net/${userDbName}?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      connectionUser.model('User', User.schema);
      //const filePath = path.join(__dirname, "../login.html");
      //res.sendFile(filePath);
      res.json({ success: true, message: 'Login successful' });
    }
    

    // Use the new database connection for future user-specific operations
    //connection.model('User', User.schema);

    //res.status(200).json({ message: 'User registered successfully' });
    
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/grp11/backend/home", (req, res) =>{
  //console.log('inside home');
  const username = req.query.username;
  const filePath = path.join(__dirname, "../home.html");
  res.sendFile(filePath);
});


app.post("/grp11/backend/login", async (req, res) => {
  console.log("login");
  //const connection = mongoose.createConnection(`mongodb://127.0.0.1:27017/LoginSignUp`, {
  const connection = mongoose.createConnection(`mongodb+srv://manjitha:P8PFFv7thmzzNAQE@cluster0.8wcby6i.mongodb.net/?retryWrites=true&w=majority/LoginSignUp`, {

      useNewUrlParser: true,
      useUnifiedTopology: true
  })
  try {
    const{username, password} = req.body;
    console.log('name = '+username);
    const check = await Users.findOne({ name: username });
    console.log(check);
    if (check && check.password === password) {
      console.log('login success');
      res.json({ success: true, message: 'Login successful' });
      
    } else {
      const filePath = path.join(__dirname,"../loginwrong.html");
      res.sendFile(filePath);
    }
  } catch (error) {
    const filePath = path.join(__dirname,"../loginwrong.html");
    res.sendFile(filePath);
  }
});

// Handle POST request
app.post("/grp11/backend/upload", upload.array('file', 4), async (req, res) => {
  const files = req.files;
  const username = req.query.username;
  
  //console.log('name = '+req.query.name);
  //const connectionUser = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${req.query.username}`, {
  const connectionUser = await mongoose.createConnection(`mongodb+srv://manjitha:P8PFFv7thmzzNAQE@cluster0.8wcby6i.mongodb.net/${req.query.username}?retryWrites=true&w=majority`, {
  
      useNewUrlParser: true,
      useUnifiedTopology: true
  });

  const collectionName = 'WayPoints_100'; // Specify the collection name
  const collectionW = connectionUser.model(collectionName, WaypointCollection.schema);

// Delete all documents in the collection
collectionW.deleteMany({})
  .then(() => {
    // Read and upload new data------------------------------------------------------------------------------
    fs.createReadStream(files[1].path)
      .pipe(csvParser())
      .on('data', (data) => {
        // Create a new document for the corresponding collection
        const document = new collectionW(data);
        document.save();
      })
      .on('end', () => {
        console.log(`Data from ${files[1].filename} saved to ${collectionName}`);
        // Remove the temporary CSV file
        fs.unlinkSync(files[1].path);
      });
  })
  .catch((error) => {
    console.error('Error deleting documents:', error);
  });
//------------------------------------------------------------------------------------------------------------------
  const collectionR = connectionUser.model('RoutingTable', RoutingTable.schema);

// Delete all documents in the collection
collectionR.deleteMany({})
  .then(() => {
    // Read and upload new data
    fs.createReadStream(files[2].path)
      .pipe(csvParser({ separator: ';' }))
      .on('data', (data) => {
        // Create a new document for the corresponding collection
        const document = new collectionR(data);
        document.save();
      })
      .on('end', () => {
        console.log(`Data from ${files[2].filename} saved to RoutingTable`);
        // Remove the temporary CSV file
        fs.unlinkSync(files[2].path);
      });
  })
  .catch((error) => {
    console.error('Error deleting documents:', error);
  });
//-----------------------------------------------------------------------------------------------------------------------
  const collectionNames = ['5-6', '6-7', '7-8']; // Define the collection names
  const collections = {};

  // Delete data from each collection
  async function deleteDataFromCollections() {
    for (const name of collectionNames) {
      const CollectionModel = collections[name];
      await CollectionModel.deleteMany({})
        .then(() => {
          console.log(`Data deleted from ${name}`);
        })
        .catch((error) => {
          console.error(`Error deleting data from ${name}:`, error);
        });
    }
  }

  // Create collection models
  collectionNames.forEach((name) => {
    collections[name] = connectionUser.model(name, PlaneModel.schema);
  });

  // Delete data from collections
  deleteDataFromCollections()
    .then(() => {
      // Read and upload new data
      fs.createReadStream(files[0].path)
        .pipe(csvParser({ separator: ';' }))
        .on('data', async (row) => {
              //console.log(row);
          const departureTime = row.Departure_Time; // Extract Departure_Time value
          const hour = parseInt(departureTime.split('.')[0]); // Extract hour from Departure_Time

          const collectionName = `${hour}-${hour + 1}`; // Determine the appropriate collection name
          console.log(collectionName)
          const CollectionModel = collections[collectionName]; // Get the corresponding collection model

          // Create a new document and save it to the respective collection
          const document = new CollectionModel({
            Callsign : row.Callsign,
            Origin_Info : row.Origin_Info,
            Destination_Info : row.Destination_Info,
            path : row.path,
            Routing : row.Routing,
            Departure_Time : row.Departure_Time,
            Aircraft_Type : row.Aircraft_Type,
            Altitude : row.Altitude,
            landed_time : row.landed_time,
            Speed_multiplied : row.Speed_multiplied
          });
          //console.log(document);
          await document.save()
            .then(() => {
              //console.log(`Document saved to ${collectionName}`);
            })
            .catch((error) => {
              console.error(`Error saving document to ${collectionName}:`, error);
            });
        })
        .on('end', () => {
          console.log('Data processing complete');
        });
    })
    .catch((error) => {
      console.error('Error deleting data from collections:', error);
    });
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, message: `${username}` });
    //res.redirect('/googlemap');
  });

// app.get('/themap', (req, res) => {
//   const username = req.query.username;
//   res.sendFile(path.join(__dirname,"/themap.html"));
// });


// Handling the request for waypoints
app.get('/grp11/backend/wayPoints', async (req, res) => {
  //const connectionUser = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${req.query.username}`, {
  const connectionUser = await mongoose.createConnection(`mongodb+srv://manjitha:P8PFFv7thmzzNAQE@cluster0.8wcby6i.mongodb.net/${req.query.username}?retryWrites=true&w=majority`, {

      useNewUrlParser: true,
      useUnifiedTopology: true
  });
  const collection1 = connectionUser.model('WayPoints_100', WaypointCollection.schema);
  const username = req.query
  Promise.all([collection1.find().exec()])
  .then((doc1) => {
    //console.log('waypoints');
    //console.log(doc1);
    const data = {collection1: doc1[0]};
    // sending the waypoints data
    res.send(data);
  }).catch((err) => {
    console.error(err);
  });
});

app.post('/grp11/backend/altitudes', async (req, res) => {
  console.log('Request received');
  
  try {
    const connectionUser = await mongoose.createConnection(`mongodb+srv://manjitha:P8PFFv7thmzzNAQE@cluster0.8wcby6i.mongodb.net/${req.query.username}?retryWrites=true&w=majority`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const query = {
      Departure_Time: req.body.value_time,
      Callsign : req.body.value_callsign
    };
    console.log(query);
    console.log('collection = '+req.body.value_name);

    connectionUser.on('connected', () => {
      const collectionP = connectionUser.model(req.body.value_name, PlaneModel.schema);

      collectionP.findOne(query).exec()
      .then((doc) => {
        if (doc) {
          console.log('Found document:');
          //const grphData = processStrings(doc.Altitude, doc.path);
          //res.send(grphData);
          const grphData = { 
            altitudes: removeBrackets(doc.Altitude), 
            waypoints: removeBrackets(doc.path), 
            speeds: removeBrackets(doc.Speed_multiplied),
          };
          res.send(grphData);
        } else {
          console.log('Document not found');
          res.status(404).send('Document not found');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error retrieving data');
      });
    });

    connectionUser.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      res.status(500).send('Error connecting to database');
    });
  } catch (err) {
    console.error('Connection error:', err);
    res.status(500).send('Error connecting to database');
  }
});



app.get('/grp11/backend/fetchRouting', async (req, res) => {
  
  const connectionUser = await mongoose.createConnection(`mongodb+srv://manjitha:P8PFFv7thmzzNAQE@cluster0.8wcby6i.mongodb.net/${req.query.username}?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  connectionUser.on('connected', () => {
    const collectionR = connectionUser.model('routingtables', RoutingTable.schema);
    Promise.all([collectionR.find().exec()])
    .then((doc1) => {
      const waypointPairArray = createUniqueWaypointPairs(doc1[0]);
      //console.log(waypointPairArray)
      const data = {collection1: waypointPairArray};
      // sending the waypoints data
      res.send(data);
    }).catch((err) => {
      console.error(err);
    });
  });
})

// handling the request for the flight data
app.get('/grp11/backend/data', async (req, res) => {
  // Process the request and fetch data from the database
  //console.log("Plane fetch request received"+count);
  console.log("Inside data");

  console.log("username = "+req.query.username);
  const connectionUser = await mongoose.createConnection(`mongodb+srv://manjitha:P8PFFv7thmzzNAQE@cluster0.8wcby6i.mongodb.net/${req.query.username}?retryWrites=true&w=majority`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
  });
  const collectionP = connectionUser.model(req.query.time, PlaneModel.schema);
  count++;
  //const timeData = req.query.time;
  console.log("time collection "+req.query.time);
  //const collection2 = mongoose.model(timeData, PlaneShcema);
  Promise.all([collectionP.find().exec()])
  .then((doc2) =>{
    const data = {collection2: doc2[0]};
    res.send(JSON.stringify(data));
  }).catch((err) => {
    console.error(err);
  });
});

app.post('/grp11/backend/destination', async (req, res) => {
  //let { callSign, startTime, endTime, lat, lng } = req.body;
  const connectionUser = await  mongoose.createConnection(`mongodb+srv://manjitha:P8PFFv7thmzzNAQE@cluster0.8wcby6i.mongodb.net/${req.query.username}?retryWrites=true&w=majority`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
  });
  const collectionD = connectionUser.model('LandedFlightModel', LandedFlightModel.schema);
  let landedFlight = new collectionD({
    'callSign' : req.query.callSign,
    'departure_time' : req.query.startTimee,
    'landed_time' : req.query.endTime,
    'lat' : req.query.lat,
    'lng' : req.query.lng
  }); 
  // Save the landed flight document to the collection
  landedFlight
    .save()
    .then(() => {
      res.status(200).send('Landed flight'+req.query.callSign+' created successfully');
    })
    .catch((err) => {
      console.error('Error saving landed flight:', err);
      res.status(500).send('Error saving landed flight');
    });
})


// Route to handle the GET request
app.get('/grp11/backend/download-landed-flights', async (req, res) => {
  console.log("request received");
  try {
    // Fetch the documents from the "landed_flights" collection
    const connectionUser =  mongoose.createConnection(`mongodb+srv://manjitha:P8PFFv7thmzzNAQE@cluster0.8wcby6i.mongodb.net/${req.query.username}?retryWrites=true&w=majority`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    //const collectionD = connectionUser.model('landed_flights', LandedFlightModel.schema);
    const collectionD = connectionUser.model('LandedFlightModel', LandedFlightModel.schema);
    const landedFlights = await collectionD.find({});

    // Convert the retrieved documents to a CSV string
    const csv = json2csv(landedFlights, { fields: ['callSign', 'departure_time', 'landed_time', 'lat', 'lng'] });

    // Set the response headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=landed_flights.csv');
    res.set('Content-Type', 'text/csv');

    // Send the CSV file as the response
    res.send(csv);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.use(express.static(path.join(__dirname, '../')));

function removeBrackets(inputString) {
  if (inputString.startsWith('[') && inputString.endsWith(']')) {
    return inputString.slice(1, -1);
  }
  return inputString;
}

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



