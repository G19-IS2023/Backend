import { MongoClient, Db } from "mongodb";

export class DatabaseService {

    private static instance: DatabaseService;
    private client?: MongoClient;
    private db?: Db;

    private constructor() {}

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public async getDb(): Promise<Db> {
        if (!this.client || !this.db) {
            if (!process.env.DB_CONN_STRING || !process.env.DB_NAME) {
                throw new Error('Database connection configuration is missing.');
            }
            this.client = new MongoClient(process.env.DB_CONN_STRING);
            try {
                await this.client.connect();
                this.db = this.client.db(process.env.DB_NAME);
            } catch (error: any) {
                console.error('Failed to connect to the database:', error);
                throw error;
            }
        }
        return this.db;
    }

    public setDB(db: Db) {
        this.db = db;
    }

    public getClient(): MongoClient | undefined {
        return this.client;
    }

    public setClient(client: MongoClient) {
        this.client = client;
    }

}