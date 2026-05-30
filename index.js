const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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

const JWKS = createRemoteJWKSet(
  new URL("http://localhost:3000/api/auth/jwks")
)

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({message: "Unauthorized"})
  }
  
  const token = authHeader.split(" ")[1];

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
     next()
  } catch (error) {
    return res.status(403).json({message: "Forbidden"})
 }
 
}
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = await client.db('nex-drive');
    const carsCollection = db.collection('cars');
    const bookingsCollection= db.collection("bookings")
    
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

    app.get("/cars/:id",verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await carsCollection.findOne({ _id: new ObjectId(id) });
      res.json(result)
    })

    app.post("/bookings", async (req, res) => {
      const bookingData = req.body;
      
      const result = await bookingsCollection.insertOne(bookingData)
      res.json(result)
    })

    app.get("/bookings", async (req, res) => {     
      const result = await bookingsCollection.find().toArray();
      res.json(result)
    })

    app.get("/bookings/:userId", async (req, res) => {
      const userId = req.params;
      const result = await bookingsCollection.find({userId: userId.userId}).toArray();
      res.json(result)
    })

    app.delete("/bookings/:bookingId", async (req, res) => {
      const { bookingId } = req.params;
      const result = await bookingsCollection.deleteOne({_id: new ObjectId(bookingId)  });
      res.json(result)
    })

    app.get('/cars/car/:userId', async (req, res) => {
  const userId = req.params.userId;
  const result = await carsCollection.find({ userId: userId }).toArray();
  res.json(result);
    })
    // delete My car
    app.delete('/cars/:id', async (req, res) => {
  const {id} = req.params;
  const result = await carsCollection.deleteOne({_id: new ObjectId(id)});
  res.json(result);
    })
    
    // edit my car
    app.patch("/cars/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      const result=  carsCollection.updateOne(
        { _id: new ObjectId(id) },
        {$set: updatedData}
      )
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