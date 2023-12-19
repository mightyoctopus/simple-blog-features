const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const multer = require('multer');

const app = express();
const port = 5000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(methodOverride('_method'));

// Setup Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, 'public', 'images'));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ storage: storage });


// ****************** DATA CONNECTION ***********************

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://devhong777:12345@cluster0.xbdlu8z.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

mongoose.connect(uri, {
    useNewUrlParser: false,
    useUnifiedTopology: false,
    serverSelectionTimeoutMS: 30000
})

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    // image files
    
    await Post.updateMany({ imageUrl: { $ne: 'default-image-url' } }, { $set: { imageUrl: 'default-image-url' } }, { multi: true });


  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


//Import Post DATA MODEL:

const Post = require('./models/post');
const { deflateRawSync } = require('zlib');


// ****************** ROUTING *********************
// Homepage:
app.get('/', async (req, res) => {
    try {
        let postData = await Post.find().sort({ _id: -1 });

        // Truncate text:
        postData = postData.map(Post => {
            Post.content = Post.content.substring(0, 200) + "...";
            return Post;
        })
        res.render('index', {postData: postData });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


//Load-More-Posts Feature: 
app.get('/load-more-posts', async (req, res) => {
    const startIndex = Number(req.query.start) || 0; 
    const numPosts = 8; // Adjust this to change the number of posts loaded each time
    
    try {
        const posts = await Post.find().sort({ _id: -1 }).skip(startIndex).limit(numPosts) // Replace 'Post' with your model name
        res.json(posts);
    } catch (err) {
        res.status(500).send("Internal server error");
    }
});



// New Post Page:
app.get('/add-new-post', (req, res) => {
    res.render("add-new-post")
});

// Post an Article (Submit):
app.post('/post-article', upload.single('image'), async (req, res) => {
    try {
        const data = new Post({
            name: req.body.name,
            email: req.body.email,
            title: req.body.title,
            content: req.body.content,
            imageUrl: req.file ? `/images/${req.file.filename}` : '/images/default-image-url'
        });

        await data.save();
        res.redirect('/');
    } catch (err) {
        console.log(err);
    }
});

// Article Details Page: 
app.get('/post-details/:id', async (req, res) => {
    try {
        const data = await Post.findOne({ _id: req.params.id });
        res.render('post_details', { data: data }); 
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
}); 

// Edit Page View:
app.get('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send('Invalid post ID');
        }

        const data = await Post.findOne ({ _id: id }); 

        if (!data) {
            return res.status(404).send('Post not found');
        }

        res.render('edit', { data: data });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
});

// Edit a Post:
app.put('/edit/:id', upload.single('imageUrl'), async (req, res) => {
    try {
        //to invest what causes the img error by inspecting the data sent from the form
        console.log('req.body', req.body);

        const { id } = req.params;
        const{ title, content, imageUrl } = req.body;
        const foundPost = await Post.findOne({ _id: id });
        
        if (foundPost) {
            foundPost.title = title;
            foundPost.content = content;
            // This initially caused an error from the image configuration sector as the Multer middleware wasn't set properly (not set at all)
            foundPost.imageUrl = req.file ? `/images/${req.file.filename}` : '/images/default-image-url';
            await foundPost.save();
            res.redirect(`/post-details/${ id }`);
        } else {
            res.status(404).send("No post found");
        }    
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal server error");
    }
});

//Delete: 
app.delete('/delete/:id', async (req, res) => {
    try {
    const { id } = req.params;
    const postToDelete = await Post.deleteOne({ _id: id }); 
    if (postToDelete.deletedCount > 0) {
        res.redirect('/');
    } else {
        res.status(404).send("No post found to delete");
    }} catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
});



// Contact:
app.get('/contact', (req, res) => {
    res.render('contact');
});

//Contact Submission (Submit):
app.post('/contact-sent', (req, res) => {
    res.send("data hasn't been yet connected :(");
});


app.listen(port, () => {
    console.log("Server running on Port:", port);
});




