import express, { Request, Response } from "express";
import User from "../models/user";
import Library from "../models/library";
import BookTuple from "../models/book";
import { DatabaseService } from "../services/database";
import { ObjectId } from "mongodb";
import { getBookfromLibrary } from "../services/script";

const router = express.Router();

const databaseService = DatabaseService.getInstance();

// API used to find a book
router.get("/library/:libId/getBook/:bookId/id/:userId", async (req: Request, res: Response) => {

    try {

        // Set the parameters
        const libId: string = req.params.libId;
        const bookId: string = req.params.bookId;
        const userId: string = req.params.userId;

        // Get the database
        const db = await databaseService.getDb();

        // Find the user
        const user = await db?.collection('users').findOne({ _id: new ObjectId(userId) }) as User | null;

        // Check if the user exists
        if(!user) {

            res.status(404).send("User not found");

        } else {
            
            // Get the library and the book
            const library: Library[] = user!.library;
            const book: BookTuple | null = await getBookfromLibrary(library, libId, bookId);

            // Check if the book exists
            if(book) {

                res.status(200).json(book);

            } else {

                res.status(404).send("Book not found");
            }
        }

    } catch(error: any) {

        res.status(500).send("Cannot find the book, try again");
    }

});

// API used to return true if a book exists
router.get("/library/:libId/id/:userId/getBook/:bookId", async (req: Request, res: Response) => {

    try {

        // Set the parameters
        const libId: string = req.params.libId;
        const bookId: string = req.params.bookId;
        const userId: string = req.params.userId;

        // Get the database
        const db = await databaseService.getDb();

        // Find the user
        const user = await db?.collection('users').findOne({ _id: new ObjectId(userId) }) as User | null;

        // Check if the user exists
        if(!user) {

            res.status(404).send("User not found");

        } else {
            
            // Get the library and the book
            const library: Library[] = user!.library;
            const book: BookTuple | null = await getBookfromLibrary(library, libId, bookId);

            // Check if the book exists
            if(book) {
                
                res.status(200).json({result: true});

            } else {

                res.status(404).send("Book not found");
            }
        }

    } catch(error: any) {

        res.status(500).send("Cannot find the book, try again");
    }

});


// API used to find a library
router.get("/getSpecLibrary/:libId/id/:userId", async (req: Request, res: Response) => {

    try {

        // Set the parameters
        const libId: string = req.params.libId;
        const userId: string = req.params.userId;

        // Get the database
        const db = await databaseService.getDb();
        
        // Find the user
        const user = await db?.collection('users').findOne({ _id: new ObjectId(userId)}) as User | null;

        // Check if the user exists
        if(!user) {

            res.status(404).send("User not found");

        } else {

            // Get the library
            const library = user!.library.find((lib: Library) => {
            
                if(lib.libId == libId) return lib;
                return null;
            }) as Library | null;
            
            // Check if the library exists
            if(library) {

                res.status(200).json(library);

            } else {

                res.status(404).send("Library not found");
            }
        }

    } catch(error: any) {

        res.status(500).send("Cannot find the library, try again");
    }
});


// API used to find all the libraries
router.get("/getLibraries/:userId", async (req: Request, res: Response) => {

    try {
        
        // Set the parameter
        const userId: string = req.params.userId;

        // Get the database
        const db = await databaseService.getDb();

        // Find the user
        const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) }) as User | null;

        // Check if the user exists
        if(!user) {

            res.status(404).send("User not found");

        } else {

            // Get the libraries
            const libraries: Library[] = user!.library;
            
            res.status(200).json(libraries);
        }

    } catch(error: any) {

        res.status(500).send("Cannot find the libraries, try again");
    }

});


//API used to modify the number of pages read
router.put("/modifyPages", async(req: Request, res: Response) => {
    
    try {

        // Set the parameters
        const bookId: string = req.body.bookId;
        const libId: string = req.body.libId;
        const pages: number = req.body.pages;
        const userId: string = req.body.userId;

        // Get the database
        const db = await databaseService.getDb();

        // Find the user
        const user = await db?.collection('users').findOne({ _id: new ObjectId(userId) }) as User | null;

        // Check if the user exists
        if(!user) { 
            
            res.status(404).send('User not found');

        } else {

            // Get the libraries' container and check if the library exists, then update the number of pages
            const library: Library[] = user!.library;
            let libraryPresence: boolean = false;

            library.forEach((lib) => {
                if(lib.libId == libId) lib.books.forEach((book) => {
                    libraryPresence = true;
                    if(book.bookId == bookId) book.pagesRead = pages;
                });
            });

            // Update the number of pages if the library exists
            if(libraryPresence) {

                await db?.collection('users').updateOne( { _id: new ObjectId(userId) }, { $set: { library: library } } );

                res.status(200).send("Number of pages read updated");

            } else {

                res.status(404).send("The library where you want to modify the book doesn't exist");
            }
        }

    } catch(error: any) {

        res.status(500).send("Cannot modify the nuber of pages");
    }
});


// API used to create a library
router.post("/createLibrary", async (req: Request, res: Response) => {

    try {

        // Set the parameters
        const libName: string = req.body.libName;
        const libId: string = req.body.libId;
        const userId: string = req.body.userId;
        
        // Get the database
        const db = await databaseService.getDb();

        // Find the user
        const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) }) as User | null;

        // Check if the user exists
        if(user) {

            // Get the the container of the libraries
            const library: Library[] = user.library;

            // Creating the new library
            const newLibrary: Library = { libName: libName as string, libId: libId as string, books: [] as BookTuple[]};

            // Add the new library to the container
            library.push(newLibrary);
            
            await db?.collection("users").updateOne( { _id: new ObjectId(userId) }, { $set: { library: library } } );

            res.status(200).send(`Library "${libName}" created`);

        } else {

            res.status(404).send("User not found");
        }

    }catch(error: any) {

        res.status(500).send("Failed to create the library, try again");
    }
});


// API used to add a book to a library
router.post("/addBook", async(req: Request, res: Response) => {

    try{ 
        // Set the parameters
        const bookId: string = req.body.bookId;
        const libId: string = req.body.libId;
        const userId: string = req.body.userId;
        
        // Create the new book
        const newBook: BookTuple = { bookId: bookId, pagesRead: 0 };

        // Get the database
        const db = await databaseService.getDb();

        // Find the user
        const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) }) as User | null;

        // Check if the user exists
        if(user) {

            // Get the libraries' container and check if the library exists
            const library: Library[] = user.library;
            let libraryPresence: boolean = false;

            library.forEach((lib) => {
                if(lib.libId === libId) {
                    libraryPresence = true;
                    lib.books.push(newBook);
                }
            });

            // Add the book if the library exists
            if(libraryPresence) {

                await db?.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: { library: library } });

                res.status(200).send("Book added with success");

            } else {

                res.status(404).send("The library where you want to add the book dosen't exist");
            }

        } else {

            res.status(404).send("User not found");
        }

    } catch(error: any) {

        res.status(500).send("Cannot add the book");
    }
});



// API used to delete a book from a library
router.delete("/library/:libId/deleteBook/:bookId/id/:userId", async (req: Request, res: Response) => {
    
    try {

        // Set the parameters
        const libId: string = req.params.libId;
        const bookId: string = req.params.bookId;
        const userId: string = req.params.userId;

        // Get the database
        const db = await databaseService.getDb();

        // Find the user
        const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) }) as User | null;

        // Check if the user exists
        if(user) {

            // Get the libraries' container and check if the library exists
            const library: Library[] = user.library;
            let libraryPresence: boolean = false;

            library.forEach((lib) => {

                if(lib.libId === libId) {
                    libraryPresence = true;
                    lib.books = lib.books.filter((book) => book.bookId !== bookId) as BookTuple[];
                }
            });

            // Delete the book if the library exists
            if(libraryPresence) {

                await db?.collection("users").updateOne( { _id: new ObjectId(userId) }, {$set: { library: library}});

                res.status(200).send(`Book deleted with success`);

            } else {

                res.status(404).send("The library where you want to delete the book doesn't exist");
            }

        } else {

            res.status(404).send("User not found");
        }

    } catch(error: any) {

        res.status(500).send("Cannot delete the book");
    }
});


// API used to delete a library
router.delete("/deleteLibrary/:libId/id/:userId", async (req: Request, res: Response) => {

    try {

        // Set the parameters
        const libId: string = req.params.libId;
        const userId: string = req.params.userId;

        // Get the database
        const db = await databaseService.getDb();

        // Find the user
        const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) }) as User | null;

        // Check if the user exists
        if(user) {

            // Get the libraries' container and if the libraries exists, delete it
            const library: Library[] = user.library;
            
            const updateLibrary = library.filter((lib) => {
                return lib.libId !== libId;
            }) as Library[];

            // Delete the library if it's been deleted a library
            if(library.length !== updateLibrary.length) {

                await db?.collection("users").updateOne({ _id: new ObjectId(userId) }, {  $set: { library: updateLibrary }});

                res.status(200).send(`Library "${libId}" deleted with success`);
                
            } else {

                res.status(404).send("The library that you want to delete doesn't exist");
            }

        } else {

            res.status(404).send("User not found");
        }

    } catch(error: any) {

        res.status(500).send("Cannot delete the library");
    }
});

export {router as bookRouter};