const express = require("express");
const mongoose = require('mongoose');
const getPosts = require("./controllers/posts");
const postMessage = require("./models/postMessage");
const Profile = require("./models/profile");
const User = require("./user"); 
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const withAuth = require('./middleware/middleware');
const { request } = require("express");
const uri = "mongodb+srv://Gamewebsite:WqvWDOvAEHUPfevX@cluster0.h0txi.mongodb.net/UserInformation?retryWrites=true&w=majority";
// import postRoutes from './posts';

//move token to .env file
const secret = "website-secret-string"

//Middleware
app.use(express.urlencoded({ extended: false })); //parse URL-encoded bodies
app.use(express.json({limit:'50mb'}));//parse JSON bodies
app.use(cookieParser());
// app.use('/posts', postRoutes);

mongoose.connect(uri, 
    { useUnifiedTopology: true, useNewUrlParser: true},
    function(err){
    if(err){
        throw err;
    } else {
        console.log(`connected to ${uri}`);
    }
});

app.post('/api/register', function(req, res) {
    const { email, password } = req.body;
    const user = new User({ email, password});
    user.save(function(err) {
        if(err) {
            console.log(err);
        } else{
            res.status(200).send("You are registered!");
        }
    });
});

app.get('/checkToken', withAuth, function(req, res) {
    res.sendStatus(200);
  });

app.get('/api/profile/:id', (req, res) => {
    const id = req.params.id;
    Profile.findById (id)
        .then(data => {
            console.log(data);
            res.send(data);
        })
        .catch(
            console.log("error")
        )
  });

app.put('/profile/:id', (request, response) => {
    const id = request.params.id;
    Profile.findByIdAndUpdate(id, request.body, function (err, docs) {
      if (err){
          console.log(err)
      }
      else{
          console.log("Updated User : ", docs);
      }
  });
});

app.post('/api/authenticate', function(req, res) {
    const { email, password } = req.body;
    User.findOne({ email }, function(err, user) {
      if (err) {
        console.error(err);
        res.status(500)
          .json({
          error: 'Internal error please try again'
        });
      } else if (!user) {
        res.status(401)
          .json({
            error: 'Incorrect email or password'
          });
      } else {
        user.isCorrectPassword(password, function(err, same) {
          if (err) {
            res.status(500)
              .json({
                error: 'Internal error please try again'
            });
          } else if (!same) {
            res.status(401)
              .json({
                error: 'Incorrect email or password'
            });
          } else {
            // Issue token
            const payload = { email };
            const token = jwt.sign(payload, secret, {
              expiresIn: '1h'
            });
            res.cookie('token', token, { httpOnly: true })
              .sendStatus(200);
          }
        });
      }
    });
  });


app.post('/forum/post', (req, res) => {
    const newPostMessage = new postMessage({
        title: req.body.title,
        message: req.body.message,
        creator: req.body.creator,
        tags: req.body.tags,
        selectedFile: req.body.selectedFile
    })
    newPostMessage
        .save()
        .then(result => {
            console.log(result);
            res.status(201).json({
                message: "Handling POST request to /forum",
                createdPost: result
            })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            })
        });
})

app.get('/forum/get', async (req, res) => {
    try{
        const posts = await postMessage.find().limit(20);
        if(posts.length >= 0){
            res.status(200).json(posts);
        }else{
            res.status(204).json({message: "No valid entry found"})
        }
    }catch(err){
        res.status(404).json({message: err.message});
    }
})

app.patch('/forum/patch/likeCount', (req, res) => {
    const id = req.body._id;
    postMessage.update({_id: id}, {$set:{likeCount: req.body.likeCount+1}})
    .exec()
    .then(result => {
        console.log(result);
        res.status(200).json(result);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });
})

app.delete('/del/:id', (req, res) => {
    const id = req.params.id;
    postMessage.remove({_id: id})
    .exec()
    .then(result => {
        console.log(result);
        res.status(200).json(result);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });
})


app.get('/search/user/:searchString', async (req, res) => {
    const searchString = req.param.searchString;
    const query = {Games: searchString}
    const projection = {
        _id: 1,
        Games: 1,
        Name: 1,
        image: 1,
        Friendids: 0,
        Friends: 0,
        Email: 0,
    }
    try{
        const users = await Profile.find(query).project(projection).limit(10)
        if (users.length > 0){
            console.log(users);
            res.status(200).json(users);
        }else{
            console.log("No users found");
            res.status(204).json({message: "No valid user found"});
        }
    }catch(err){
        res.status(404).json({error: err})
    }

})

app.listen(8080, function() {
    console.log("Server is running on Port: 8080");
  });