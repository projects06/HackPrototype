const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require("path")
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

mongoose.connect("mongodb+srv://AR:AR2025@ar.6txmw7j.mongodb.net/");

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  mail: { type: String, unique: true },
  gender: String,
  placeOfInterest: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

app.post('/signup', async (req, res) => {
  console.log('Signup POST received', req.body);

  const { name, age, mail, gender, placeOfInterest, password } = req.body;
  if (!name || !age || !mail || !gender || !placeOfInterest || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const numericAge = Number(age);
  if (isNaN(numericAge)) return res.status(400).json({ message: 'Age must be a number' });

  try {
    const existing = await User.findOne({ mail });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ name, age: numericAge, mail, gender, placeOfInterest, password });
    const savedUser = await user.save();
    console.log('Saved user:', savedUser);

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('DB Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.use(express.static(__dirname));


app.post('/signin', async (req, res) => {
  console.log('Signin request body:', req.body);

  const { mail, password } = req.body;

  if (!mail || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ mail, password });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.status(200).json({ message: 'Signin successful', user: { name: user.name, mail: user.mail } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/user', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  try {
    const user = await User.findOne({ mail: token });
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({
      name: user.name,
      mail: user.mail,
      placeOfInterest: user.placeOfInterest,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.use(cors({
  origin: 'http://localhost:3000',
}));


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});