import express, { Request, Response } from "express";
import User from "../models/user";
import LibraryEntry from "../models/library";
import BookTuple from "../models/book";
import { DatabaseService } from "../services/database";
import { ObjectId } from "mongodb";
import { getBookfromLibrary } from "../services/script";

const router = express.Router();

const databaseService = DatabaseService.getInstance();

//API per trovare un libro
router.get("/library/:libId/getBook/:bookId/id/:userId", async (req: Request, res: Response) => {

    try {

        const libId: string = req.params.libId;
        const bookId: string = req.params.bookId;
        const userId: string = req.params.userId;

        const db = await databaseService.getDb();

        const user = await db?.collection('users').findOne({ _id: new ObjectId(userId) }) as User | null;

        if(!user) {

            res.status(404).send("User not found");
        } else {
            
            const library: LibraryEntry[] = user!.library;
            const book: BookTuple | null = await getBookfromLibrary(library, libId, bookId);

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

//API per dare true se trova il libro
router.get("/library/:libId/id/:userId/getBook/:bookId", async (req: Request, res: Response) => {

    try {

        const libId: string = req.params.libId;
        const bookId: string = req.params.bookId;
        const userId: string = req.params.userId;

        const db = await databaseService.getDb();

        const user = await db?.collection('users').findOne({ _id: new ObjectId(userId) }) as User | null;

        if(!user) {

            res.status(404).send("User not found");
        } else {
            
            const library: LibraryEntry[] = user!.library;
            const book:BookTuple | null = await getBookfromLibrary(library, libId, bookId);

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


//API per trovare una specifica libreria
router.get("/getSpecLibrary/:libId/id/:userId", async (req: Request, res: Response) => {

    try {

        const libId: string = req.params.libId;
        const userId: string = req.params.userId;

        const db = await databaseService.getDb();
        
        const user = await db?.collection('users').findOne({ _id: new ObjectId(userId)}) as User | null;

        if(!user) {
            res.status(404).send("User not found");
        } else {

            const library = user!.library.find((lib: LibraryEntry) => {
            
                if(lib.libId == libId) return lib;
                return null;
            }) as LibraryEntry | null;

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


//API per trovare tutte le librerie
router.get("/getLibraries/:userId", async (req: Request, res: Response) => {

    try {
        
        const userId: string = req.params.userId;

        const db = await databaseService.getDb();

        const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) }) as User | null;

        if(!user) {

            res.status(404).send("User not found");
        } else {

            const libraries: LibraryEntry[] = user!.library;
            
            res.status(200).json(libraries);
        }

    } catch(error: any) {

        res.status(500).send("Cannot find the libraries, try again");
    }

});


//API per modificare il numero delle pagine lette
router.put("/modifyPages", async(req: Request, res: Response) => {
    
    try {
        const bookId: string = req.body.bookId;
        const libId: string = req.body.libId;
        const pages: number = req.body.pages;
        const userId: string = req.body.userId;

        const db = await databaseService.getDb();
        const user = await db?.collection('users').findOne({ _id: new ObjectId(userId) }) as User | null;

        if(!user) { 
            
            res.status(404).send('User not found');
        } else {

            const library: LibraryEntry[] = user!.library;
            let libraryPresence: boolean = false;

            library.forEach((lib) => {
                if(lib.libId == libId) lib.books.forEach((book) => {
                    libraryPresence = true;
                    if(book.bookId == bookId) book.pagesRead = pages;
                });
            });

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


//API per creare una libreria
router.post("/createLibrary", async (req: Request, res: Response) => {

    try {

        const libName: string = req.body.libName;
        const libId: string = req.body.libId;
        const userId: string = req.body.userId;
        
        const db = await databaseService.getDb();
        const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) }) as User | null;

        if(user) {

            const library: LibraryEntry[] = user.library;

            const newLibrary: LibraryEntry = { libName: libName as string, libId: libId as string, books: [] as BookTuple[]};

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


//API per aggiungere un libro a una libreria
router.post("/addBook", async(req: Request, res: Response) => {

    try{ 
        const bookId: string = req.body.bookId;
        const libId: string = req.body.libId;
        const userId: string = req.body.userId;
        
        const newBook: BookTuple = { bookId: bookId, pagesRead: 0 };

        const db = await databaseService.getDb(); 
        const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) }) as User | null;

        if(user) {

            const library: LibraryEntry[] = user.library;
            let libraryPresence: boolean = false;

            library.forEach((lib) => {
                if(lib.libId === libId) {
                    libraryPresence = true;
                    lib.books.push(newBook);
                }
            });

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



//API per eliminare un libro da una libreria
router.delete("/library/:libId/deleteBook/:bookId/id/:userId", async (req: Request, res: Response) => {
    
    try {

        const libId: string = req.params.libId;
        const bookId: string = req.params.bookId;
        const userId: string = req.params.userId;

        const db = await databaseService.getDb();

        const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) }) as User | null;

        if(user) {

            const library: LibraryEntry[] = user.library;
            let libraryPresence: boolean = false;

            library.forEach((lib) => {

                if(lib.libId === libId) {
                    libraryPresence = true;
                    lib.books = lib.books.filter((book) => book.bookId !== bookId) as BookTuple[];
                }
            });

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


//API per eliminare una libreria
router.delete("/deleteLibrary/:libId/id/:userId", async (req: Request, res: Response) => {

    try {

        const libId: string = req.params.libId;
        const userId: string = req.params.userId;

        const db = await databaseService.getDb();
        const user = await db?.collection("users").findOne({ _id: new ObjectId(userId) }) as User | null;

        if(user) {

            const library: LibraryEntry[] = user.library;
            
            const updateLibrary = library.filter((lib) => {
                return lib.libId !== libId;
            }) as LibraryEntry[];

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