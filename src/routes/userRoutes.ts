import express, { Request, Response} from 'express';
import User from '../models/user';
import { DatabaseService } from '../services/database';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Library from '../models/library';
import { validateEmail, validatePassword, verifyToken } from '../services/script';

const router = express.Router();

const databaseService = DatabaseService.getInstance();

// Api used to get an user
router.get('/getUser/:userId', async(req: Request, res: Response) => {

    try{

        // Get the database
        const db = await databaseService.getDb();

        // Set the parameter
        const userId: string = req.params.userId;

        // Check if the userId is valid
        if(ObjectId.isValid(userId)) {
            
            const user = await db?.collection("users").findOne( { _id: new ObjectId(userId) } ) as User | null;

            // Check if the user exists, then send it
            if(user) {

                res.status(200).json(user);

            } else {

                res.status(404).send("User not found");
            }

        } else {
            res.status(406).send("Invalid user id");
        }

    }catch(error: any) {

        res.status(500).send("Unable to find the user, try again");
    }
    
});


//API used to login
router.post('/login', async(req: Request, res: Response) => {

    try{
        
        // Get the database
        const db = await databaseService.getDb();

        // Set the parameters
        const searchEmail: string = req.body.email;

        const possibleUser = await db?.collection("users").findOne({email: searchEmail }) as User | null;
        
        // Check if the user exists
        if(!possibleUser) { 

            return res.status(404).send('Cannot find user');
        }

        // Check if the password is correct
        if(await bcrypt.compare(req.body.password, possibleUser.password)) {

            // Create the token
            const accessToken = jwt.sign({ email: possibleUser.email, _id: possibleUser._id }, process.env.ACCESS_TOKEN_SECRET!);

            // Send the token and the userId
            res.set('Authorization', `${accessToken}`);
            res.status(200).json({ userId: possibleUser._id });

        } else {
            
            res.status(401).send('Wrong password');
        }

    } catch (error: any) {

        res.status(500).send('Unable to login, try again');
    }
});


// API used to register
router.post('/register', async (req: Request, res: Response) => {

    try{ 

        // Set the parameters
        const name: string = req.body.name;
        const email: string = req.body.email;
        const password: string = req.body.password;
        const predLibrary: Library = {libName: "Your Books", libId: "1", books: []};
        const library: Library[] = [predLibrary]; // Default library
        const objectId: string = req.body.userId;
        
        // Check if the userId is valid
        if(ObjectId.isValid(objectId)) {

            // Check if the email is valid
            if(validateEmail(email)) {
                
                // Check if the password is valid
                if(validatePassword(password, req, res)) {

                    const userId: ObjectId = new ObjectId(objectId);

                    // Hash the password
                    const salt = await bcrypt.genSalt();
                    const hashedPassword = await bcrypt.hash(password, salt) as string;
                    
                    // Get the database
                    const db = await databaseService.getDb();

                    // Check if the email and the username are already used
                    const existEmail = await db?.collection('users').findOne({ email: email  }) as User | null;
                    const existUsername = await db?.collection('users').findOne({ name: name  }) as User | null;
                    
                    // If the email and the username are not used, create the user
                    if(!existEmail) {
                        if(!existUsername) {

                            const user = new User(name, email, hashedPassword, library, userId) as User | null;

                            // Check if the user is not null, then insert it
                            if(user) {

                                const result = await db?.collection("users").insertOne(user);

                                res.status(201).json(result);

                            } else {

                                res.status(500).send('User not created due to a database problem');
                            }
                        } else { 

                            res.status(409).send('Username already exists');
                        }
                    } else {

                        res.status(409).send('Email already used');
                    }
                }
            } else {

                res.status(406).send('Invalid email');
            }
        } else {

            res.status(406).send('Invalid user id');
        }

    }catch(error: any) {

        res.status(500).send("Unable to register the user, try again");
    }
});


// API used to modify the username
router.put('/modifyUsername', verifyToken, async (req: Request, res: Response) => {

    try {
        
        // Set the parameters
        const userId: string = req.body.userId;
        const newUsername: string = req.body.newUsername;

        // Check if the userId is valid
        if(ObjectId.isValid(userId)) {
            
            // Get the database
            const db = await databaseService.getDb();

            const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) });

            // Check if the user exists
            if(user) {

                // Check if the username is already used, if not update it
                const existUsername = await db?.collection('users').findOne({ name: newUsername  }) as User | null;
                if(!existUsername){
    
                    await db?.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { name: newUsername } });
                    res.status(200).send('Succesfully updated');

                } else {
    
                    res.status(409).send('Username already exist');
                }
            } else {

                res.status(404).send('Cannot find user');
            }

        } else {
            res.status(406).send('Invalid user id');
        }
            
    } catch(error: any) {

        res.status(500).send("Unable to update the username, try again");
    }
});


// API used to modify the password
router.put('/modifyPassword', verifyToken, async (req: Request, res: Response) => {

    try {

        // Set the parameters
        const userId: string = req.body.userId;
        const oldPassword: string = req.body.oldPassword;
        const newPassword: string = req.body.newPassword;

        // Check if the userId is valid
        if(ObjectId.isValid(userId)) {

            // Get the database
            const db = await databaseService.getDb();

            // Check if the user exists
            const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) }) as User | null;
    
            if(!user) {

                res.status(404).send('Cannot find the user');

            } else {

                // Check if the new password is valid
                if(validatePassword(newPassword, req, res)) {
                    
                    // Check if the old password is correct, if it is cript the new password and update it
                    if(await bcrypt.compare(oldPassword, user!.password)) {
                        
                        const salt = await bcrypt.genSalt();
                        const hashedPassword = await bcrypt.hash(newPassword, salt);
    
                        await db?.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: { password: hashedPassword } });
    
                        res.status(200).send('Succesfully updated');

                    } else {
                        
                        res.status(401).send('Old password is incorrect');
                    }
                }
            }

        } else {
            res.status(406).send('Invalid user id');
        }
    } catch(error: any) {

        res.status(500).send("Unable to update the password, try again");
    }
});


// API used to delete the account
router.delete("/deleteProfile/:userId", verifyToken, async (req: Request, res: Response) => {

    try {
        
        // Set the parameter
        const userId: string = req.params.userId;

        // Check if the userId is valid
        if(ObjectId.isValid(userId)) {

            // Get the database
            const db = await databaseService.getDb();

            // Check if the user exists, if it does delete it
            const user = await db?.collection("users").findOne( { _id: new ObjectId(userId) } ) as User | null;
    
            if(!user) {

                res.status(404).send('Cannot find user');
                return;

            } else {
    
                await db?.collection('users').deleteOne({ _id: new ObjectId(userId) });
                res.status(200).send('Succesfully deleted');
            }
            
        } else {

            res.status(406).send('Invalid user id');
            
        }

    } catch(error: any) {

        res.status(500).send("Unable to delete the account, try again");
    }
});


export { router as userRouter };