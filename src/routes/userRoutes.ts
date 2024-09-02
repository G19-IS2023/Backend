import express, { Request, Response} from 'express';
import User from '../models/user';
import { DatabaseService } from '../services/database';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import LibraryEntry from '../models/library';
import { validateEmail, validatePassword, verifyToken } from '../services/script';

const router = express.Router();

const databaseService = DatabaseService.getInstance();


/**
 * @swagger
 * /getUser/{userId}:
 *   get:
 *     summary: Retrieve a user by ID
 *     description: Retrieve a user by their unique ID from the database.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the user
 *     responses:
 *       200:
 *         description: A user object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *       404:
 *         description: User not found
 *       406:
 *         description: Invalid user id
 *       500:
 *         description: Unable to find the user, try again
 */
//API per inviare l'User
router.get('/getUser/:userId', async(req: Request, res: Response) => {

    try{

        const db = await databaseService.getDb();
        const userId: string = req.params.userId;

        if(ObjectId.isValid(userId)) {
        
            const user = await db?.collection("users").findOne( { _id: new ObjectId(userId) } ) as User | null;

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


//API per verificare le credenziali e inviare l'accessToken
router.post('/login', async(req: Request, res: Response) => {

    try{
    
        const db = await databaseService.getDb();

        const searchEmail: string = req.body.email;

        const possibleUser = await db?.collection("users").findOne({email: searchEmail }) as User | null;
        
        if(!possibleUser) { 
            return res.status(404).send('Cannot find user');
        }

        if(await bcrypt.compare(req.body.password, possibleUser.password)) {

            const accessToken = jwt.sign({ email: possibleUser.email, _id: possibleUser._id }, process.env.ACCESS_TOKEN_SECRET!);

            res.set('Authorization', `${accessToken}`);
            res.status(200).json({ userId: possibleUser._id });

        } else {
            
            res.status(401).send('Wrong password');
        }

    } catch (error: any) {

        res.status(500).send('Unable to login, try again');
    }
});


//API per registrare l'User e criptare la password
router.post('/register', async (req: Request, res: Response) => {

    try{ 

        const name: string = req.body.name;
        const email: string = req.body.email;
        const password: string = req.body.password;
        const predLibrary: LibraryEntry = {libName: "Your Books", libId: "1", books: []};
        const library: LibraryEntry[] = [predLibrary]; //Setta libreria predefinita
        const objectId: string = req.body.userId;
        
       if(ObjectId.isValid(objectId)) {

            if(validateEmail(email)) {
                
                if(validatePassword(password, req, res)) {

                    const userId: ObjectId = new ObjectId(objectId);
                    const salt = await bcrypt.genSalt();
                    const hashedPassword = await bcrypt.hash(password, salt) as string;
                    
                    const db = await databaseService.getDb();

                    const existEmail = await db?.collection('users').findOne({ email: email  }) as User | null;
                    const existUsername = await db?.collection('users').findOne({ name: name  }) as User | null;

                    if(!existEmail) {
                        if(!existUsername) {

                            const user = new User(name, email, hashedPassword, library, userId) as User | null;

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


//API per modificare l'username
router.put('/modifyUsername', verifyToken, async (req: Request, res: Response) => {

    try {

        const userId: string = req.body.userId;
        const newUsername: string = req.body.newUsername;

        if(ObjectId.isValid(userId)) {
            
            const db = await databaseService.getDb();

            const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) });

            if(user) {

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


//API per modificare la password
router.put('/modifyPassword', verifyToken, async (req: Request, res: Response) => {

    try {

        const userId: string = req.body.userId;
        const oldPassword: string = req.body.oldPassword;
        const newPassword: string = req.body.newPassword;

        if(ObjectId.isValid(userId)) {

            const db = await databaseService.getDb();
            const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) }) as User | null;
    
            if(!user) {

                res.status(404).send('Cannot find the user');

            } else {

                if(validatePassword(newPassword, req, res)) {
    
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


//API per eliminare l'account
router.delete("/deleteProfile/:userId", verifyToken, async (req: Request, res: Response) => {

    try {

        const userId: string = req.params.userId;

        if(ObjectId.isValid(userId)) {

            const db = await databaseService.getDb();
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