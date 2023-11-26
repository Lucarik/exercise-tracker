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

const getAllUsers = (done) => {
  Person.find({}, function(err, users) {
    if (err) return err;
    var userArray = [];
    users.forEach(function(user) {
      userArray.push({_id:user._id, username:user.username});
    });
    done(null, userArray);  
  });
}

const findPersonById = (personId, done) => {
  Person.findById(personId, function(err, data) {
    if (err) return err;
    done(null, data);
  });
};

const findEditThenSave = (personId, description, duration, date, done) => {
  const foodToAdd = "hamburger";
  Person.findById(personId, function(err, person) {
    person.exercises.push({description: description, duration: +duration, date: (new Date(date)).toString().substring(0,15)})
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
      res.json({_id: person._id, username: person.username});
    });
});

app.get("/api/users", function(req,res) {
  getAllUsers(function(error, users) {
    if (error) return next(error);
    res.json(users);
  });
});

app.post("/api/users/:_id/exercises", function(req,res) {
  findEditThenSave(req.params._id, req.body.description, req.body.duration, req.body.date, function(error, person) {
    if (error) return next(error);
    let exercise = person.exercises[person.exercises.length-1]
    res.json({_id: person._id, username: person.username, 
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
  let dateParams = Object.keys(req.query).length != 0;
  let id = req.params._id;
  if (dateParams) {
    
    var from = params[0];
    var to = params[1];
    var limit = params[2];
  }

  findPersonById(id, function(error, person) {
    if (error) return next(error);
      let exercises = person.exercises;
      let matched = [];
      let c = 0;
      
      if (typeof exercises === undefined) res.json({id: person._id, username: person.username,
        count: count, log: "This user has no saved exercises"});
      if (dateParams) {
        for (let exercise of exercises) {
          console.log(exercise.date);
          if (c >= limit) break;
          //console.log("from: " + from + ", to: " + to + "\n" + exercise)
          if ((new Date(exercise.date)).toISOString().substring(0,10) >= from 
          && (new Date(exercise.date)).toISOString().substring(0,10) <= to) {
            matched.push(exercise);
            c += 1;
          }
        }
      } else {
        matched = exercises;
      }
      let count = exercises.length;
      if (matched.length == 0) res.json({error: "No exercises matched"});
      res.json({id: person._id, username: person.username,
        count: count, log: matched});
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
