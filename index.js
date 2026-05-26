const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGO_URI;

const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = await client.db('nex-drive');
    const carsCollection = db.collection('cars');
    
    app.get('/cars', async (req, res) => {
      const { search, type } = req.query;
      const query={}
      if (search) {
        query.carName= {$regex : search, $options: "i"}
      }

      if (type && type !== "All") {
        query.carType = type
      }
      const result = await carsCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/cars', async (req, res) => {
      const carData = req.body;
      // console.log('carData', carData);
        const result = await carsCollection.insertOne(carData);
        res.send(result);
    });

    app.get("/cars/:id", async (req, res) => {
      const { id } = req.params;
      const result = await carsCollection.findOne({ _id: new ObjectId(id) });
      res.json(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
    console.log(`Sever running on ${PORT}`);
})

app.get('/', (req, res) => {
    res.send('Server is running fine');
})