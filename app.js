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
const Property = mongoose.model(
  'Property',
  new mongoose.Schema({
    title: String,
    description: String,
    price: String,
    images: [String],
  })
);

const Roommate = mongoose.model(
  'Roommate',
  new mongoose.Schema({
    name: String,
    age: Number,
    image: String,
    propertyTitle: String,
  })
);

const User = mongoose.model(
  'User',
  new mongoose.Schema({
    email: String,
    password: String,
  })
);

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'mysecretkey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }, // Enforce secure cookies in production
  })
);

// Routes

// Home route
app.get('/', async (req, res) => {
  try {
    const properties = await Property.find();
    const roommates = await Roommate.find();
    res.render('index', { properties, roommates });
  } catch (err) {
    console.error('Error fetching properties and roommates:', err);
    res.status(500).send('Server error');
  }
});

// Signup route
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashedPassword });
    res.redirect('/login');
  } catch (err) {
    console.error('Error signing up:', err);
    res.status(500).send('Server error');
  }
});

// Login route
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.user = user; // Save user in session
      res.redirect('/dashboard');
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).send('Server error');
  }
});

// Admin route
app.get('/admin', async (req, res) => {
  if (!req.session.user || req.session.user.email !== 'admin@gmail.com') {
    return res.status(403).send('Access denied');
  }
  try {
    const properties = await Property.find();
    const roommates = await Roommate.find();
    res.render('admin', { properties, roommates });
  } catch (err) {
    console.error('Error fetching properties and roommates:', err);
    res.status(500).send('Server error');
  }
});

// Dashboard route
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  try {
    const properties = await Property.find();
    const roommates = await Roommate.find();
    res.render('dashboard', { properties, roommates });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).send('Server error');
  }
});

// Add Property
app.post('/add-property', async (req, res) => {
  const { title, description, price, image } = req.body;
  try {
    const newProperty = new Property({ title, description, price, images: [image] });
    await newProperty.save();
    res.redirect('/admin');
  } catch (err) {
    console.error('Error adding property:', err);
    res.status(500).send('Server error');
  }
});

// GET route for displaying the edit form for properties
app.get('/edit-property/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).send('Property not found');
    }
    res.render('edit-property', { property });  // Assuming you have an 'edit-property.ejs' file
  } catch (err) {
    console.error('Error fetching property for edit:', err);
    res.status(500).send('Server error');
  }
});

// POST route for handling the property update
app.post('/edit-property/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, price, image } = req.body;
  try {
    await Property.findByIdAndUpdate(id, { title, description, price, images: [image] });
    res.redirect('/admin');
  } catch (err) {
    console.error('Error updating property:', err);
    res.status(500).send('Server error');
  }
});

// Delete Property
app.post('/delete-property/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Property.findByIdAndDelete(id);
    res.redirect('/admin');
  } catch (err) {
    console.error('Error deleting property:', err);
    res.status(500).send('Server error');
  }
});

// Add Roommate
app.post('/add-roommate', async (req, res) => {
  const { name, age, image, propertyTitle } = req.body;
  try {
    const newRoommate = new Roommate({ name, age, image, propertyTitle });
    await newRoommate.save();
    res.redirect('/admin');
  } catch (err) {
    console.error('Error adding roommate:', err);
    res.status(500).send('Server error');
  }
});

// GET route for displaying the edit form for roommates
app.get('/edit-roommate/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const roommate = await Roommate.findById(id);
    if (!roommate) {
      return res.status(404).send('Roommate not found');
    }
    res.render('edit-roommate', { roommate });  // Assuming you have an 'edit-roommate.ejs' file
  } catch (err) {
    console.error('Error fetching roommate for edit:', err);
    res.status(500).send('Server error');
  }
});

// POST route for handling the roommate update
app.post('/edit-roommate/:id', async (req, res) => {
  const { id } = req.params;
  const { name, age, image, propertyTitle } = req.body;
  try {
    await Roommate.findByIdAndUpdate(id, { name, age, image, propertyTitle });
    res.redirect('/admin');
  } catch (err) {
    console.error('Error updating roommate:', err);
    res.status(500).send('Server error');
  }
});

// Delete Roommate
app.post('/delete-roommate/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Roommate.findByIdAndDelete(id);
    res.redirect('/admin');
  } catch (err) {
    console.error('Error deleting roommate:', err);
    res.status(500).send('Server error');
  }
});

// Property Profile Route
app.get('/property/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const property = await Property.findById(id);
    res.render('propertydetails', { property });
  } catch (err) {
    console.error('Error fetching property:', err);
    res.status(500).send('Server error');
  }
});

// Roommate Profile Route
app.get('/roommate/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const roommate = await Roommate.findById(id);
    res.render('roommatedetails', { roommate });
  } catch (err) {
    console.error('Error fetching roommate:', err);
    res.status(500).send('Server error');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// 404 route for missing pages
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
