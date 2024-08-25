import dotenv from 'dotenv';
import request from 'supertest';

import app from "../../src/app";

import { DatabaseService } from '../../src/services/database';
import { Db, ObjectId, OrderedBulkOperation } from 'mongodb';
import LibraryEntry from '../../src/models/library';
import BookTuple from '../../src/models/book';
import User from '../../src/models/user';

dotenv.config();

const existingId: ObjectId = new ObjectId("517f1f77bcf86cd799439055");
const notExistingId: ObjectId = new ObjectId("517f1f77bcf86cd799439000");

beforeAll(async () => {

    const db: Db = await DatabaseService.getInstance().getDb();

    const book: BookTuple = {bookId: "88", pagesRead: 0};

    const newUser: User = {name: "Bohbohboh", email: "bohhh@gmail.com", password: "Bohboh0!?", _id: existingId, library: [{libName: "Your Books", libId: "1", books: []}]};
    
    const library: LibraryEntry[] = newUser.library;
    library.forEach((lib) => {
        if(lib.libId === "1") lib.books.push(book);
    });

    await db?.collection('users').insertOne(newUser);

});

afterAll(async () => {

    const db: Db = await DatabaseService.getInstance().getDb();

    await db?.collection('users').deleteOne({ _id: new ObjectId("517f1f77bcf86cd799439055") });

});

describe('Book routes', () => {

    
    describe("GET book/library/:libId/getBook/:bookId/id/:userId", () => {

        it("should send status code 200 if it finds the book", async () => {

            const response = await request(app)
            .get(`/book/library/1/getBook/88/id/${existingId}`)

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("bookId", "88");
        });

        it("should send status code 404 if it doesn't find the book", async () => {

            const response = await request(app)
            .get(`/book/library/1/getBook/70/id/${existingId}`)

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("Book not found");
        });

        it("should send status code 404 if it doesn't find the user", async () => {

            const response = await request(app)
            .get(`/book/library/1/getBook/70/id/${notExistingId}`)

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("User not found");
        });
    });


    describe("GET book/library/:libId/id/:userId/getBook/:bookId", () => {

        it("should send status code 200 and gives an object true in the body if it finds the book", async () => {

            const response = await request(app)
            .get(`/book/library/1/id/${existingId}/getBook/88`)

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("result", true);
        });

        it("should send status code 404 if it doesn't find the book", async () => {

            const response = await request(app)
            .get(`/book/library/1/id/${existingId}/getBook/70`)

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("Book not found");
        });

        it("should send status code 404 if it doesn't find the user", async () => {

            const response = await request(app)
            .get(`/book/library/1/id/${notExistingId}/getBook/88`)

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("User not found");
        });
    });


    describe("GET book/getSpecLibrary/:libId/id/:userId", () => {

        it("should send status code 404 if it doesn't find the user", async () => {

            const response = await request(app)
            .get(`/book/getSpecLibrary/1/id/${notExistingId}`)

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("User not found");
        });

        it("should send status code 200 if it finds the library", async () => {

            const response = await request(app)
            .get(`/book/getSpecLibrary/1/id/${existingId}`)

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("libId", "1");
        });

        it("should send status code 404 if it doesn't find the library", async () => {

            const response = await request(app)
            .get(`/book/getSpecLibrary/100/id/${existingId}`)

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("Library not found");
        });
    });


    describe("GET book/getLibraries/:userId", () => {

        it("should send status code 404 if it doesn't find the user", async () => {

            const response = await request(app)
            .get(`/book/getLibraries/${notExistingId}`)

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("User not found");
        });

        it("should send status code 200 if it finds the libraries", async () => {

            const response = await request(app)
            .get(`/book/getLibraries/${existingId}`)

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveLength(1);
        });
    });

    
    describe("PUT book/modifyPages", () => {

        it("should send status code 404 if it doesn't find the user", async () => {

            const response = await request(app)
            .put("/book/modifyPages")
            .send({ bookId: "88", libId: "1", pages: 59, userId: notExistingId});

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("User not found");
        });

        
        it("should send status code 404 if it doesn't find the library where to modify the book's number of pages", async () => {

            const response = await request(app)
            .put("/book/modifyPages")
            .send({ bookId: "88", libId: "100", pages: 59, userId: existingId});

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("The library where you want to modify the book doesn't exist");
        });

        it("should send status code 200 if it updates the number of pages", async () => {

            const response = await request(app)
            .put("/book/modifyPages")
            .send({ bookId: "88", libId: "1", pages: 59, userId: existingId});

            expect(response.statusCode).toBe(200);
            expect(response.text).toEqual("Number of pages read updated");
        });
    });


    describe("POST book/createLibrary", () => {

        it("should send status code 404 if it doesn't find the user", async () => {

            const response = await request(app)
            .post("/book/createLibrary")
            .send({ libName: "Nuova Libreria", libId: "2", userId: notExistingId })

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("User not found");
        });

        it("should send status code 200 if it successfully creates the new library", async () => {

            const response = await request(app)
            .post("/book/createLibrary")
            .send({ libName: "Nuova Libreria", libId: "2", userId: existingId })

            expect(response.statusCode).toBe(200);
            expect(response.text).toEqual(`Library "Nuova Libreria" created`);
        });
    });


    describe("POST book/addBook", () => {

        it("should send status code 404 if it doesn't find the user", async () => {

            const response = await request(app)
            .post("/book/addBook")
            .send( { bookId: "80", libId: "1", userId: notExistingId })

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("User not found");
        });

        it("should send status code 404 if it doesn't find the library where to add the book", async () => {

            const response = await request(app)
            .post("/book/addBook")
            .send( { bookId: "80", libId: "100", userId: existingId })

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("The library where you want to add the book dosen't exist");
        });

        it("should send status code 200 if it adds the book", async () => {

            const response = await request(app)
            .post("/book/addBook")
            .send( { bookId: "80", libId: "1", userId: existingId })

            expect(response.statusCode).toBe(200);
            expect(response.text).toEqual("Book added with success");
        });
    });

    
    describe("DELETE book/library/:libId/deleteBook/:bookId/id/:userId", () => {

        it("should send status code 404 if it doesn't find the user", async () => {

            const response = await request(app)
            .delete(`/book/library/1/deleteBook/88/id/${notExistingId}`)

            expect(response.statusCode).toBe(404),
            expect(response.text).toEqual("User not found");
        });

        it("should send status code 404 if it doesn't find the library where to delete the book", async () => {

            const response = await request(app)
            .delete(`/book/library/100/deleteBook/88/id/${existingId}`)

            expect(response.statusCode).toBe(404),
            expect(response.text).toEqual("The library where you want to delete the book doesn't exist");
        });

        it("should send status code 200 if it succesfully deletes the book", async () => {

            const response = await request(app)
            .delete(`/book/library/1/deleteBook/88/id/${existingId}`)

            expect(response.statusCode).toBe(200),
            expect(response.text).toEqual("Book deleted with success");
        });
    }); 


    describe("DELETE book/deleteLibrary/:libId/id/:userId", () => {

        it("should send status code 404 if it doesn't find the user", async () => {

            const response = await request(app)
            .delete(`/book/deleteLibrary/1/id/${notExistingId}`)

            expect(response.statusCode).toBe(404),
            expect(response.text).toEqual("User not found");
        });

        it("should send status code 404 if it doesn't find the library to delete", async () => {

            const response = await request(app)
            .delete(`/book/deleteLibrary/100/id/${existingId}`)

            expect(response.statusCode).toBe(404),
            expect(response.text).toEqual("The library that you want to delete doesn't exist");
        });

        it("should send status code 200 if it succesfully deletes the library", async () => {

            const response = await request(app)
            .delete(`/book/deleteLibrary/1/id/${existingId}`)

            expect(response.statusCode).toBe(200),
            expect(response.text).toEqual('Library "1" deleted with success');
        });
    }); 
});