import type { ObjectId, OptionalId } from "mongodb";

export type UserModel = OptionalId<{
    name: string;
    email: string;
    telefono: string;
    amigos: ObjectId[];
}>;

export type User = {
    id: string;
    name: string;
    email: string;
    telefono : string; 
    amigos: User[];
}