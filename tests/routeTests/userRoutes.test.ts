import dotenv from 'dotenv';
import request from 'supertest';

import app from "../../src/app";

import { DatabaseService } from '../../src/services/database';
import { Db, ObjectId, OrderedBulkOperation } from 'mongodb';

dotenv.config();

// Sistema existingId e notExistingId

const newUserId: string = "507f1f77bcf86cd799439011";
const existingUserId: string = "66b60e2628dd7ad24a9cf378"
const notExistingId: string = "507f1f77bcf86cd799439000";

const newUser = {name: "Boh", email: "boh@gmail.com", password: "Bohboh0!?", userId: "507f1f77bcf86cd799439011"};

let accessToken: string;

beforeAll(async () => {

    const response = await request(app)
    .post("/user/login")
    .send({email: "cicciobello69@gmail.com", password: "Ciccio0!"});

    accessToken = response.headers.authorization;

});

afterAll(async () => {

    await request(app)
    .post("/user/register")
    .send({name: "ciccioBello", email: "cicciobello69@gmail.com", password: "Ciccio0!", userId: "66b60e2628dd7ad24a9cf378"});

    const db: Db = await DatabaseService.getInstance().getDb();

    await db?.collection("users").deleteOne({ _id: new ObjectId(newUserId) });

});

describe('User Routes', () => {


    describe('GET user/getUser/:userId', () => {
        
        it('should retrieve user details if the user exists and send status code 200', async () => {

            const response = await request(app)
            .get(`/user/getUser/${existingUserId}`)
            
            expect(response.statusCode).toBe(200);
        });

        it('should send status code 404 if user does not exists', async () => {

            const response = await request(app)
            .get(`/user/getUser/${notExistingId}`);
            
            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("User not found");
        });

        it('should send status code 406 if userId is not valid', async () => {

            const response = await request(app)
            .get("/user/getUser/invalidUserId")

            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual("Invalid user id");
        });

    });


    describe('POST /login', () => {
    
        it(`should send status code 200 if the user's credentials are valid`, async () => {

            const response = await request(app)
            .post("/user/login")
            .send({email: "cicciobello69@gmail.com", password: "Ciccio0!"});

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("userId");
            expect(response.headers['authorization']).toBeDefined();
        });

        it(`should send status code 401 if the user's password is wrong`, async () => {

            const response = await request(app)
            .post("/user/login")
            .send({email: "cicciobello69@gmail.com", password: "Wrongpassword0!?"});

            expect(response.statusCode).toBe(401);
            expect(response.text).toEqual("Wrong password");
        });
    });


    describe('POST /register', () => {

        it('should send status code 409 if the username already exists', async () => {
        
            const response = await request(app)
            .post("/user/register")
            .send({name: "ciccioBello", email: "boh@gmail.com", password: "Bohboh0!?", userId: newUserId})

            expect(response.statusCode).toBe(409);
            expect(response.text).toEqual("Username already exists");
        });

        it('should send status code 406 if the email is invalid', async () => {
        
            const response = await request(app)
            .post("/user/register")
            .send({name: "Bahboh", email: "notvalidgmail.com", password: "Bohboh0!?", userId: newUserId})

            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual("Invalid email");
        });

        it('should send status code 406 if the userId is invalid', async () => {
        
            const response = await request(app)
            .post("/user/register")
            .send({name: "Bahboh", email: "valid@gmail.com", password: "Bohboh0!?", userId: "notValidUserId"})

            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual("Invalid user id");
        });

        it('should send status code 406 if the password is less than 8 char long', async () => {
            
            const response = await request(app)
            .post("/user/register")
            .send({name: "Bahboh", email: "valid@gmail.com", password: "boh0!?", userId: newUserId})
            
            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual("The password must be 8 char long");
        });

        it(`should send status code 406 if the password doesn't contain any letter`, async () => {
            
            const response = await request(app)
            .post("/user/register")
            .send({name: "Bahboh", email: "valid@gmail.com", password: "1234560!?", userId: newUserId})

            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual("The password must contain a letter");
        });

        it(`should send status code 406 if the password doesn't contain any number`, async () => {
            
            const response = await request(app)
            .post("/user/register")
            .send({name: "Bahboh", email: "valid@gmail.com", password: "abcdefg!?", userId: newUserId})

            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual("The password must contain a number");
        });

        it(`should send status code 406 if the password doesn't contain any special char between: ? ! . _ - @ |`, async () => {
            
            const response = await request(app)
            .post("/user/register")
            .send({name: "Bahboh", email: "valid@gmail.com", password: "NotValidPassword00", userId: newUserId})

            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual("The password must contain at least one special char between these: ? ! . _ - @ |");
        });

        it('should send code 201 if the registration is successful', async () => {

            const response = await request(app)
            .post("/user/register")
            .send(newUser);

            expect(response.statusCode).toBe(201);
        });

        it('should send status code 409 if the email is already used', async () => {
        
            const response = await request(app)
            .post("/user/register")
            .send({name: "Bahboh", email: "boh@gmail.com", password: "Bohboh0!?", userId: newUserId})

            expect(response.statusCode).toBe(409);
            expect(response.text).toEqual("Email already used");
        });

    });

    describe('PUT /modifyUsername', () => {

        it('should send status code 401 if there is not an access token', async () => {

            const response = await request(app)
            .put("/user/modifyUsername")
            .send({userId: existingUserId, newUsername: "NewUsername"});

            expect(response.statusCode).toBe(401);
            expect(response.text).toEqual('Unauthorized: No token provided');
        });

        it('should send status code 401 if the access token is invalid', async () => {

            const response = await request(app)
            .put("/user/modifyUsername")
            .set('Authorization', `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
            .send({userId: existingUserId, newUsername: "NewUsername"});

            expect(response.statusCode).toBe(401);
            expect(response.text).toEqual('Unauthorized: Invalid token');
        });

        it('should send status code 200 if the user successfully modified his username', async () => {

            const response = await request(app)
            .put("/user/modifyUsername")
            .set('Authorization', `${accessToken}`)
            .send({userId: existingUserId, newUsername: "NewUsername"});

            expect(response.statusCode).toBe(200);
            expect(response.text).toEqual("Succesfully updated");
        });

        it('should send status code 409 if the new username already exists', async () => {

            const response = await request(app)
            .put("/user/modifyUsername")
            .set('Authorization', `${accessToken}`)
            .send({userId: existingUserId, newUsername: "Pat"});

            expect(response.statusCode).toBe(409);
            expect(response.text).toEqual("Username already exist");
        });

        it("should send status code 404 if the user doesn't exists", async () => {

            const response = await request(app)
            .put("/user/modifyUsername")
            .set('Authorization', `${accessToken}`)
            .send({userId: notExistingId, newUsername: "Pattone"});

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("Cannot find user");
        });

        it('should send status code 406 if the userId is not valid', async () => {

            const response = await request(app)
            .put("/user/modifyUsername")
            .set("Authorization", `${accessToken}`)
            .send({userId: "notValidUserId", newUsername: "UsernameValid"});

            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual("Invalid user id");
        });
    });


    describe('PUT /modifyPassword', () => {

        it('should send status code 401 if there is not an access token', async () => {

            const response = await request(app)
            .put("/user/modifyPassword")
            .send({userId: existingUserId, oldPassword: "Ciccio0!", newPassword: "Cicciobello00!?"});

            expect(response.statusCode).toBe(401);
            expect(response.text).toEqual('Unauthorized: No token provided');
        });

        it('should send status code 401 if the access token is invalid', async () => {

            const response = await request(app)
            .put("/user/modifyPassword")
            .set('Authorization', `notValidAccessToken`)
            .send({userId: existingUserId, oldPassword: "Ciccio0!", newPassword: "Cicciobello00!?"});

            expect(response.statusCode).toBe(401);
            expect(response.text).toEqual('Unauthorized: Invalid token');
        });


        it('should send status code 404 if the user does not exists', async () => {

            const response = await request(app)
            .put("/user/modifyPassword")
            .set("Authorization", `${accessToken}`)
            .send({userId: notExistingId, oldPassword: "Ciccio0!", newPassword: "Cicciobello00!?"});

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual("Cannot find the user");
        });

        it('should send status code 406 if the password is less than 8 char long', async () => {
            
            const response = await request(app)
            .put("/user/modifyPassword")
            .set("Authorization", `${accessToken}`)
            .send({userId: existingUserId, oldPassword: "Ciccio0!", newPassword: "Cic0!"});
            
            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual("The password must be 8 char long");
        });

        it(`should send status code 406 if the password doesn't contain any letter`, async () => {
            
            const response = await request(app)
            .put("/user/modifyPassword")
            .set("Authorization", `${accessToken}`)
            .send({userId: existingUserId, oldPassword: "Ciccio0!", newPassword: "12345500!?"});

            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual("The password must contain a letter");
        });

        it(`should send status code 406 if the password doesn't contain any number`, async () => {
            
            const response = await request(app)
            .put("/user/modifyPassword")
            .set("Authorization", `${accessToken}`)
            .send({userId: existingUserId, oldPassword: "Ciccio0!", newPassword: "Cicciobello!?"});
            
            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual("The password must contain a number");
        });

        it(`should send status code 406 if the password doesn't contain any special char between: ? ! . _ - @ |`, async () => {
            
            const response = await request(app)
            .put("/user/modifyPassword")
            .set("Authorization", `${accessToken}`)
            .send({userId: existingUserId, oldPassword: "Ciccio0!", newPassword: "Cicciobello00"});

            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual("The password must contain at least one special char between these: ? ! . _ - @ |");
        });

        it(`should send status code 406 if the user id isn't valid`, async () => {
            
            const response = await request(app)
            .put("/user/modifyPassword")
            .set("Authorization", `${accessToken}`)
            .send({userId: "notValidUserId", oldPassword: "Ciccio0!", newPassword: "Cicciobello00!?"});

            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual("Invalid user id");
        });

        it(`should send status code 401 if the old password isn't correct`, async () => {
            
            const response = await request(app)
            .put("/user/modifyPassword")
            .set("Authorization", `${accessToken}`)
            .send({userId: existingUserId, oldPassword: "Cicciobello0!", newPassword: "Cicciobello00!?"});
            
            expect(response.statusCode).toBe(401);
            expect(response.text).toEqual("Old password is incorrect");
        });


        it(`should send status code 200 if the user successfully modified his password`, async () => {
            
            const response = await request(app)
            .put("/user/modifyPassword")
            .set("Authorization", `${accessToken}`)
            .send({userId: existingUserId, oldPassword: "Ciccio0!", newPassword: "Cicciobello00!?"});
            
            expect(response.statusCode).toBe(200);
            expect(response.text).toEqual("Succesfully updated");
        });
    });


    describe('DELETE /deleteProfile', () => {

        it('should send status code 401 if there is not an access token', async () => {

            const response = await request(app)
            .delete(`/user/deleteProfile/${existingUserId}`)

            expect(response.statusCode).toBe(401);
            expect(response.text).toEqual('Unauthorized: No token provided');
        });

        it('should send status code 401 if the access token is invalid', async () => {

            const response = await request(app)
            .delete(`/user/deleteProfile/${existingUserId}`)
            .set('Authorization', `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

            expect(response.statusCode).toBe(401);
            expect(response.text).toEqual('Unauthorized: Invalid token');
        });

        it('should send status code 406 if the user id is invalid', async () => {

            const response = await request(app)
            .delete(`/user/deleteProfile/notValidUserId`)
            .set('Authorization', `${accessToken}`)

            expect(response.statusCode).toBe(406);
            expect(response.text).toEqual('Invalid user id');
        });

        it('should send status code 200 if the server successfully deleted the user', async () => {

            const response = await request(app)
            .delete(`/user/deleteProfile/${existingUserId}`)
            .set('Authorization', `${accessToken}`)

            expect(response.statusCode).toBe(200);
            expect(response.text).toEqual('Succesfully deleted');
        });


        it('should send status code 404 if the user does not exists', async () => {

            const response = await request(app)
            .delete(`/user/deleteProfile/${notExistingId}`)
            .set('Authorization', `${accessToken}`)

            expect(response.statusCode).toBe(404);
            expect(response.text).toEqual('Cannot find user');
        });
    });

});
