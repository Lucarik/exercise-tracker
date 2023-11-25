require('dotenv').config()
let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const express = require('express')
const app = express()
let bodyParser = require('body-parser')
const cors = require('cors')


let Person;

let personSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  exercises: [Object]
});

Person = mongoose.model('Person', personSchema);

const createAndSavePerson = (n, done) => {
  let person = Person({username:n});
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
    person.exercises.push({description: description, duration: duration, date: date})
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

app.use(bodyParser.urlencoded({extended: false}));

app.post("/api/users", function(req,res) {
    createAndSavePerson(req.body.username, function(error, person) {
      if (error) return next(error);
      res.json({id: person._id, username: person.username});
    });
});

app.post("/api/users/:_id/exercises", function(req,res) {
  findEditThenSave(req.params._id, req.body.description, req.body.duration, req.body.date, function(error, person) {
    if (error) return next(error);
    let exercise = person.exercises[person.exercises.length-1]
    res.json({id: person._id, username: person.username, 
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date,});
  });
});

app.get("/api/users/:_id/logs?*", function(req, res) {
  let params = [];
  for (let p of Object.keys(req.query)) {
    params.push(p.replace(/[\[\]]/g, ""));
  }
  //res.json(params);
  console.log(req.params._id);
  let id = req.params._id;
  let from = params[0];
  let to = params[1];
  let limit = params[2];

  findPersonById(id, function(error, person) {
    if (error) return next(error);
      let exercises = person.exercises;
      let matched = [];
      let c = 0;
      if (typeof exercises === undefined) res.json({error: "This user has no saved exercises"});
      for (let exercise of exercises) {
        if (c >= limit) break;
        //console.log("from: " + from + ", to: " + to + "\n" + exercise)
        if (exercise.date >= from && exercise.date <= to) {
          matched.push(exercise);
          c += 1;
        }
      }
      if (matched.length == 0) res.json({error: "No exercises matched"});
      res.json(matched);
  });
});

app.get("/api/users/:_id/logs", function(req, res) {
  findPersonById(req.params._id, function(error, person) {
    if (error) return next(error);
      let exercises = person.exercises;
      if (typeof exercises === undefined) res.json({error: "This user has no saved exercises"});
      let count = exercises.length;
      res.json({id: person._id, username: person.username,
      count: count, exercises: exercises});
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
