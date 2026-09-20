const { MongoClient } = require('mongodb');
// GO to mongoDB website
// Create a free M0 cluster
// Create a user
// Get the connection string.
// Install the mongoDB compass
// install the mongodb pagkage
// creaste a connection from database
// perform CRUD operations - Create, Read, Update, Delete


const URI = "mongodb+srv://merishavkumar_db_user:afgwgcupQT79eWHY@cluster0.tvtsc6x.mongodb.net/?appName=Cluster0";

const client = new MongoClient(URI);

// Database Name
const dbName = "Helloworld";

async function main() {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    // Collection name
    const collection = db.collection("User");

    
    // const user = {
    //     firstName: "Suman",
    //     lastName: "Kumar",
    //     city:"pune",
    //     phoneNumber:"1234567812"
        
    // }
    
    // const insertResult = await collection.insertMany([user]);
    // console.log("Inserted documents =>", insertResult);
    
    const findResult = await collection.find({}).toArray()
    console.log('Found document =>', findResult);

    // the following code examples can be pasted here...
   return 'done.';
}

main().then(console.log).catch(console.error).finally(() => {
    client.close();
});

