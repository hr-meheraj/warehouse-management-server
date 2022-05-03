const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 8000;
const jwt = require("jsonwebtoken");


// Common Middleware
app.use(express.json());
app.use(cors());

// Mongodb Basic needed
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://process.env.USER_NAME:process.env.PASSWORD@cluster0.cv5my.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// First Sign then Verify
// Secret Token - You have to hide to for security
const secretToken = process.env.SECRECT_KEY_TOKEN;

// Verify to JWT token
function verifyJwtToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, secretToken, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

// Home page url
app.get("/", (req, res) => {
  res.send(
    `
			<h2> Products  <a href='/products'>Products</a></h2>
			<h2> Products  Count : <a href='/productsCount'>Count</a></h2>
			<h2> Update /Inventory/:id </h2>
			<h2> Products by Email /productsByEmail?email=hr@h.com </h2>
			<h2> Products Delete : /product/:id </h2> 
			<h2> insert one : /inventory - post method </h2>
			<h2> Blogs : /blogs </h2>
				`
  );
});

async function run() {
  try {
    await client.connect();
    const inventory = client.db("inventory");
    const products = inventory.collection("products");
    const blogs = inventory.collection("blogs");

    // jwt json web token  -security api
    app.post("/login", (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, secretToken, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    //------------------------------------------//
    // Get Documetns  finilize (Done!);
    app.get("/products", async (req, res) => {
      const query = {};
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await products
        .find(query)
        .skip(size * page)
        .limit(size)
        .toArray();
      res.send(result);
    });

    app.get("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await products.findOne(filter);
      res.send(result);
    });

    // Products Count finilize (Done!)
    app.get("/ProductsCount", async (req, res) => {
      const count = await products.estimatedDocumentCount();
      res.send({ count });
    });

    // Blogs API
    app.post("/blogs", async (req, res) => {
      const data = {
        ...req.body,
      };
      const result = await blogs.insertOne(req.body);
      res.send(result);
    });

    // All blogs get
    app.get("/blogs", async (req, res) => {
      const query = {};
      const result = await blogs.find(query).toArray();
      res.send(result);
    });

    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await blogs.findOne(filter);
      res.send(result);
    });

    // create a document to insert - finilize work (Done!)
    app.post("/inventory", async (req, res) => {
      const body = req.body;
      console.log(body);
      const result = await products.insertOne(body);
      res.send({ message: "Successfully Added" });
    });

    // Find by Email:
    // JWT protected - Simple
    app.get("/productsByEmail", verifyJwtToken, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      const query = { email };
      if (decodedEmail === email) {
        const result = await products.find(query).toArray();
        res.send(result);
      } else {
        res.status(403).send({ message: "Forbidden Access" });
      }
    });
    // update a document
    app.put("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...req.body,
        },
      };
      const result = await products.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // Delete a Products Article - finilize work (Done!)
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const result = await products.deleteOne({ _id: new ObjectId(id) });
      res.send({ message: "Deleted one" });
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => console.log("Server listening on ther port ", port));
