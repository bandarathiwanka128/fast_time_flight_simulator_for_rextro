const express = require('express');
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
const {User, Users, PlaneCollection, AltitudeCollection,WaypointCollection, LandedFlights } = require("./models");

let count = 0;

const app = express();
app.use(cookieParser());


app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'secret key',
  resave: false,
  saveUninitialized: false,
}));

mongoose.connect('mongodb://127.0.0.1:27017/LoginSignUp',
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

app.use(express.static(__dirname + '/public'));

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



// app.get("/", (req, res) => {
//   const filePath = path.join(__dirname, "/index.html");
//   res.sendFile(filePath);
// });

app.get("/signup", (req, res) => {
  const filePath = path.join(__dirname,"/signup.html");
  res.sendFile(filePath);
});

app.post("/signup", async (req, res) => {

  try {
    // Create a new database for the user using their email as the database name
    const data = {
      name: req.body.name,
      password: req.body.password,
    };
    const existingUser = await Users.findOne({ name: req.body.name });
    if (existingUser) {
      const filePath = path.join(__dirname,"/public/nameExists.html");
      res.sendFile(filePath);
    } else {
      await Users.insertMany([data]);
      const userDbName = req.body.name;
      const connectionUser = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${userDbName}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      connectionUser.model('User', User.schema);
      const filePath = path.join(__dirname, "/public/login.html");
      res.sendFile(filePath);
    }
    

    // Use the new database connection for future user-specific operations
    //connection.model('User', User.schema);

    //res.status(200).json({ message: 'User registered successfully' });
    
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/home", (req, res) =>{
  const username = req.query.username;
  const filePath = path.join(__dirname, "/public/home.html");
  res.sendFile(filePath);
});


app.post("/login", async (req, res) => {
  console.log("login");
  const connection = mongoose.createConnection(`mongodb://127.0.0.1:27017/LoginSignUp`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
  })
  try {
    console.log('name = '+req.query.username);
    const check = await Users.findOne({ name: req.query.username });
    console.log(check);
    if (check && check.password === req.query.password) {

      res.json({ success: true, message: 'Login successful' });
    } else {
      const filePath = path.join(__dirname,"/public/loginwrong.html");
      res.sendFile(filePath);
    }
  } catch (error) {
    const filePath = path.join(__dirname,"/public/loginwrong.html");
    res.sendFile(filePath);
  }
});

// Handle POST request
app.post('/upload', upload.array('file', 4), async (req, res) => {
  const files = req.files;
  const collectionNames = ['5-6', '6-7']; // Define the collection names
  const collections = {};
  //console.log('name = '+req.query.name);
  const connectionUser = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${req.query.username}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
  });

  collectionNames.forEach((name) => {
    const collectionSchema = new mongoose.Schema(PlaneCollection.schema.obj, { collection: name });
    collections[name] = mongoose.model(name, collectionSchema);
  });

  fs.createReadStream(files[0].path)
  .pipe(csvParser({ separator: ';' }))
  .on('data', (row) => {
    //console.log(row);
    const departureTime = row.Departure_Time; // Extract Departure_Time value
    const hour = parseInt(departureTime.split('.')[0]); // Extract hour from Departure_Time

    const collectionName = `${hour}-${hour + 1}`; // Determine the appropriate collection name
    const CollectionModel = collections[collectionName]; // Get the corresponding collection model

    // Create a new document and save it to the respective collection
    const document = new CollectionModel(row);
    document.save()
      .then(() => {
        console.log(`Document saved to ${collectionName}`);
      })
      .catch((error) => {
        console.error(`Error saving document to ${collectionName}:`, error);
      });
  })
  .on('end', () => {
    console.log('Data processing complete');
  });

  res.send('Files uploaded successfully');
});





