import { ObjectId } from 'mongodb';
import LibraryEntry from './library';


export default class User {

    constructor(

        public name: string,
        public email: string,
        public password: string,
        public library: LibraryEntry[],
        public _id: ObjectId
        
    ) {
        if(this._id && typeof this._id === 'string') {
        
        try {

            this._id = new ObjectId(this._id as string);
        } catch(error) {

            throw new Error('Invalid ID format');
        }
        }
    }
}