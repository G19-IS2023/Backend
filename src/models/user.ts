import { ObjectId } from 'mongodb';
import Library from './library';

// Model for User
export default class User {

    constructor(

        public name: string,
        public email: string,
        public password: string,
        public library: Library[],
        public _id: ObjectId
        
    ) {
        // Check if the ID is a valid ObjectId
        if(this._id && typeof this._id === 'string') {
        
        try {

            this._id = new ObjectId(this._id as string);
        } catch(error) {

            throw new Error('Invalid ID format');
        }
        }
    }
}