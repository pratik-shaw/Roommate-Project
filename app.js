require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setting EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Schemas and Models
const Property = mongoose.model('Property', new mongoose.Schema({
  title: String,
  description: String,
  price: String,
  images: [String],
}));

const Roommate = mongoose.model('Roommate', new mongoose.Schema({
  name: String,
  age: Number,
  image: String,
  propertyTitle: String,
}));

const User = mongoose.model('User', new mongoose.Schema({
  email: String,
  password: String,
}));

// Session Middleware
app.use(
  session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true,
  })
);

// Routes

// Home route
app.get('/', async (req, res) => {
  const properties = await Property.find();
  const roommates = await Roommate.find();
  res.render('index', { properties, roommates });
});

// Signup route
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ email, password: hashedPassword });
  res.redirect('/login');
});

// Login route
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.user = user; // Save user in session
    res.redirect('/dashboard');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

// Admin route
app.get('/admin', (req, res) => {
  if (!req.session.user || req.session.user.email !== 'admin@gmail.com') {
    return res.status(403).send('Access denied');
  }
  res.render('admin');
});

// Dashboard route
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const properties = await Property.find();
  const roommates = await Roommate.find();
  res.render('dashboard', { properties, roommates });
});

// Add Property
app.post('/add-property', async (req, res) => {
  const { title, description, price, image } = req.body;
  const newProperty = new Property({ title, description, price, images: [image] });
  await newProperty.save();
  res.redirect('/admin');
});

// Add Roommate
app.post('/add-roommate', async (req, res) => {
  const { name, age, image, propertyTitle } = req.body;
  const newRoommate = new Roommate({ name, age, image, propertyTitle });
  await newRoommate.save();
  res.redirect('/admin');
});

// Property Profile Route (View details of property by ID)
app.get('/property/:id', async (req, res) => {
  const { id } = req.params;

  // Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('Invalid property ID format');
  }

  try {
    // Fetch property details by ID from the database
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).send('Property not found');
    }

    // Render the property details page with the found property
    res.render('propertydetails', { property });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Roommate Profile Route (View details of roommate by ID)
app.get('/roommate/:id', async (req, res) => {
  const { id } = req.params;

  // Check if the ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('Invalid roommate ID format');
  }

  try {
    // Fetch roommate details by ID from the database
    const roommate = await Roommate.findById(id);
    if (!roommate) {
      return res.status(404).send('Roommate not found');
    }

    // Render the roommate details page with the found roommate
    res.render('roommatedetails', { roommate });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


// 2 things to be edited and changed are that ability to do CRUD operations over the listing properties
// second thing to be done is that if necessary make a roomate user model to fetch the roomates listed properties