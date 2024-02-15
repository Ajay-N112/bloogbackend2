
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const UserModels = require('./models/UserModels');
const PostModels = require('./models/PostModel');
const { log } = require('console');
const BASE_URL = process.env.BASE_URL

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [`${BASE_URL}`],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(cookieParser());


app.use(express.static('public'))
// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/Blog');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Public/Images');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Route middleware to verify user
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  } else {
    jwt.verify(token, 'jwt-secert-key', (err, decode) => {
      if (err) {
        return res.status(403).json({ error: 'Forbidden: Invalid token' });
      } else {
        req.email = decode.email;
        req.username = decode.username;
        next();
      }
    });
  }
};

// Route to create a new post
// app.post('/create', verifyUser, upload.single('file'), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }
//    PostModels.create({title:req.body.title,description:req.body,description: req.body.description,file:req.file.filename
// .then(result=>res.json(result))
// .catch(err=>res.json(err))
// })
//     return res.status(200).json({ message: 'File uploaded successfully' });
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     return res.status(500).json({ error: 'An error occurred while uploading the file' });
//   }
// });

app.post('/create', verifyUser, upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      PostModels.create({
        title: req.body.title,
        description: req.body.description, 
        file: req.file.filename,
        email:req.body.email
      })
        .then(result => res.json('Sucess'))
        .catch(err => res.json(err));
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: 'An error occurred while uploading the file' });
    }
  });
  

// Route to register a new user
app.post('/register', (req, res) => {
  // Implementation of user registration
  const { username, email, password } = req.body;
  bcrypt.hash(password, 10)
    .then(hash => {
      UserModels.create({ username, email, password: hash })
        .then(user => {
          console.log('User created successfully:', user);
          res.json(user);
        })
        .catch(err => {
          console.error('Error creating user:', err);
          res.status(500).json({ error: 'An error occurred while creating the user.' });
        });
    })
    .catch(err => {
      console.error('Error hashing password:', err);
      res.status(500).json({ error: 'An error occurred while hashing the password.' });
    });
});

// Route to login
app.post('/login', (req, res) => {
  // Implementation of user login
  const { email, password } = req.body;
  UserModels.findOne({ email: email })
    .then(user => {
      if (user) {
        bcrypt.compare(password, user.password, (err, response) => {
          if (response) {
            const token = jwt.sign({ email: user.email, username: user.username }, 'jwt-secert-key', { expiresIn: "1d" });
            res.cookie('token', token);
            return res.json('Success');
          } else res.json('Password is incorrect');
        });
      } else {
        res.json('User does not exist');
      }
    });
});

// Route to logout
app.get('/logout', (req, res) => {
  // Implementation of user logout
  res.clearCookie('token');
  return res.json("Logged out");
});

// Default route
app.get('/', verifyUser, (req, res) => {
  return res.json({ email: req.email, username: req.username });
});




// getposts
app.get('/getposts',(req,res)=>{
   PostModels.find()
   .then(posts => res.json(posts))
   .catch(err=>res.json(err))

})



// app.get('/getPostbyid/:id', (req, res) => {
//   const id = req.params.id;
//   PostModels.findById(id)
//     .then(post => res.json(post))
//     .catch(err => console.log(err));
// });


app.get('/getPostbyid/:id', (req, res) => {
  const id = req.params.id;
  PostModels.findById(id)
    .then(post => {
      if (!post) {
        // If no post is found with the given ID, send a 404 Not Found response
        return res.status(404).json({ error: 'Post not found' });
      }
      // Send the post data as JSON response
      res.json(post);
    })
    .catch(err => {
      // If there's an error, send a 500 Internal Server Error response
      console.error('Error fetching post:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});


// app.put('/editpost/:id',(req,res)=>{
//   const id = req.params.id;
//   PostModels.findByIdAndUpdate({_id:id, title:req.body.title,description:req.body.description})
//   .then(result=>res.json(result))
//   .catch(err=>res.json(err))
// })

app.put('/editpost/:id', (req, res) => {
  const id = req.params.id;
  const { title, description } = req.body;
  PostModels.findByIdAndUpdate(id, { title, description }, { new: true })
    .then(result => {
      res.json({ message: "Edit successful", post: result });
    })
    .catch(err => res.status(500).json({ error: err.message }));
});


app.delete('/deletePost/:id',(req,res)=>{
  PostModels.findByIdAndDelete({_id:req.params.id})
  .then(result=>res.json('success'))
  .catch(err=>res.json(err))
})





// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
