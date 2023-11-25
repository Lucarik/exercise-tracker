let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

let Person;

let personSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  date: Date,
  duration: Number,
  description: String
});

Person = mongoose.model('Person', personSchema);

const createAndSavePerson = (name, done) => {
  let person = Person({name:name});
  person.save(function(err, data) {
    if (err) return err;
    done(null, data);
  });
};

const findPersonById = (personId, done) => {
  Person.findById(personId, function(err, data) {
    if (err) return err;
    done(null, data);
  });
};

const findEditThenSave = (personId, description, duration, date, done) => {
  const foodToAdd = "hamburger";
  Person.findById(personId, function(err, person) {
    person.description = description;
    person.duration = duration;
    person.date = date;
    person.save(function(err, data) {
      if (err) return err;
      done(null, data);
    });
  });
};

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
