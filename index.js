require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Job portal server is running");
});
app.listen(port, () => {
  console.log(`job portal is running on port:${port}`);
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vvycnhh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const jobCollection = client.db("CareerCrafters").collection("jobs");
    const applicationCollection = client
      .db("CareerCrafters")
      .collection("applications");

    app.get("/jobs", async (req, res) => {
      const result = await jobCollection.find().toArray();
      res.send(result);
    });
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });
    // job application related API

    app.post("/applications", async (req, res) => {
      const application = req.body;
      const result = await applicationCollection.insertOne(application);
      res.send(result);
    });

    app.get("/my-applications", async (req, res) => {
      const userId = req.query.userId;
      if (!userId) return res.status(400).send({ error: "Missing userId" });

      // Step 1: Find applications by user
      const applications = await applicationCollection
        .find({ userId })
        .toArray();
      console.log(applications);
      
      // Step 2: Extract all jobIds from them
      const jobIds = applications.map((app) => new ObjectId(app.jobId));
      
      // Step 3: Get those jobs from jobs collection
      const jobs = await jobCollection.find({ _id: { $in: jobIds } }).toArray();

      // Step 4: Combine job + application metadata
      const enriched = jobs.map((job) => {
        const application = applications.find(
          (app) => app.jobId === job._id.toString()
        );
        return {
          ...job,
          appliedAt: application?.submittedAt,
          applicationId: application?._id, // optional for withdraw
        };
      });
      

      res.send(enriched);
    });

  

    // app.delete("/applications/:id", async (req, res) => {
    //     const id = req.params.id;
    //     const result = await applicationCollection.deleteOne({ _id: new ObjectId(id) });
    //     if (result.deletedCount === 1) {
    //         res.send({ message: "Application removed" });
    //     } else {
    //         res.status(404).send({ error: "Application not found" });
    //     }
    // });

    // app.delete("/applications/:jobId", async (req, res) => {
    //     const jobId = req.params.jobId;
    //     const userId = req.query.userId;

    //     const result = await applicationCollection.deleteOne({
    //         jobId,
    //         userId,
    //     });

    //     if (result.deletedCount === 1) {
    //         res.send({ message: "Application withdrawn" });
    //     } else {
    //         res.status(404).send({ error: "No matching application found" });
    //     }
    // });

    // app.delete('/Recipes/:id', async (req, res) => {
    //     const id = req.params.id;
    //     const result = await recipeCollection.deleteOne({ _id: new ObjectId(id) });
    //     res.send(result);
    // });

    // app.put('/Recipes/:id', async (req, res) => {
    //     const id = req.params.id
    //     const filter = { _id: new ObjectId(id) }
    //     const options = { upsert: true };
    //     const updatedRecipe = req.body;
    //     const updateDoc = {
    //         $set: updatedRecipe
    //     };
    //     const result = await recipeCollection.updateOne(filter, updateDoc, options)
    //     res.send(result);
    // })

    // user related API's
    // app.get('/users', async (req, res) => {
    //     const result = await userCollection.find().toArray();
    //     res.send(result);
    // })
    // app.post('/users', async (req, res) => {
    //     const userProfile = req.body;
    //     const result = await userCollection.insertOne(userProfile);
    //     res.send(result);
    // })
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);
