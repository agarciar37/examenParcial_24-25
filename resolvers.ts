import type { Collection } from "mongodb";
import { User, UserModel } from "./types.ts"

export const FromModelToUser = async (
    userDB: UserModel,
    userCollection: Collection<UserModel>
): Promise <User> => {

    const amigos = await userCollection.find({_id: {$in: userDB.amigos}}).toArray();

    return {
        id : userDB._id!.toString(),
        name : userDB.name,
        email: userDB.email,
        telefono: userDB.telefono,
        amigos: await Promise.all(amigos.map(async (a) => await FromModelToUser(a, userCollection))),
    };
}