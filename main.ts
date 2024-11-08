import { MongoClient, ObjectId } from 'mongodb';
import { User, UserModel} from './types.ts'
import { FromModelToUser } from "./resolvers.ts";


const MONGO_URL = Deno.env.get("MONGO_URL")

if (!MONGO_URL){
  console.error("La URL no es correcta");
  Deno.exit();
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Conectado a la base de datos correctamente");

const db = client.db("personas");

const userCollection = db.collection<UserModel>("personas");

const handler = async (req: Request): Promise<Response> => {
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  if (method === "GET"){
    if (path === "/users"){
      const name = url.searchParams.get("name");

      if (name){
        const userdb = await userCollection.find({name}).toArray();
        const users = await Promise.all(
          userdb.map((b) => FromModelToUser(b, userCollection))
        )

        return new Response(JSON.stringify(users));
      } else {
        const userdb = await userCollection.find().toArray();
        const users = await Promise.all(
          userdb.map((b) => FromModelToUser(b, userCollection))
        )

        return new Response(JSON.stringify(users));
      }
    } else if (path === "/user"){
      const email = url.searchParams.get("email");
      if (!email){
        return new Response ("Bad request", {status: 400})
      }
      const userdb = await userCollection.findOne({email});
      if (!userdb) {
        return new Response ("User not found", {status: 404})
      }

      const user = await FromModelToUser(userdb, userCollection);
      return new Response(JSON.stringify(user));
    }
  } else if (method === "POST"){
    if (path === "/user"){
      const persona = await req.json();
      if (!persona.name || !persona.email || !persona.telefono){
        return new Response("Bad request", {status: 400})
      }
      const personadbe = await userCollection.findOne({
        email: persona.email,
      });
      if (personadbe){
        return new Response("The person already exists", {status: 400})
      }
      const personadbt = await userCollection.findOne({
        telefono: persona.telefono,
      });
      if (personadbt){
        return new Response("The person already exists", {status: 400})
      }
      
      const { insertedId } = await userCollection.insertOne({
        name: persona.name,
        email: persona.email,
        telefono: persona.telefono,
        amigos: []
      });

      return new Response(
        JSON.stringify({
          name: persona.name,
          email: persona.email,
          telefono: persona.telefono,
          amigos: [],
          id: insertedId
        }),
        { status: 201}
      );
    }
  } else if (method === "PUT"){
    if (path === "/user"){
      const persona = await req.json();

      if (!persona.name || !persona.email || !persona.telefono || !persona.amigos){
        return new Response ("Bad request", {status: 400});
      }

      if (persona.amigos){
        const amigos = await userCollection.find({
          _id: {$in: persona.amigos.map((id:string) => new ObjectId(id))}
        }).toArray();
        if (amigos.length !== persona.amigos.length){
          return new Response ("Amigos no ectontrados", {status: 404})
        }
      }

      const { modifiedCount } = await userCollection.updateOne({email: persona.email}, {$set: {
        name: persona.name, email: persona.email, telefono: persona.telefono, amigos: persona.amigos}})

      if (modifiedCount === 0){
        return new Response ("Personan no encontrada", {status: 404})
      }

      return new Response ("OKAY", {status : 200})
    }
  } else if (method === "DELETE"){
    if (path === "/user"){

    }
  }

  return new Response ("Endpont not found", {status: 400})
}

Deno.serve({port: 3000}, handler);