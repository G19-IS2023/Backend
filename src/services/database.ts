import { MongoClient, Db } from "mongodb";

/**
 * Represents a service for interacting with a database.
 */
export class DatabaseService {

    private static instance: DatabaseService;
    private client?: MongoClient;
    private db?: Db;

    private constructor() {}

    /**
     * Returns the singleton instance of the DatabaseService.
     */
    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    /**
     * Retrieves the database connection.
     * returns A promise that resolves to the database connection.
     * throws Error if the database connection configuration is missing.
     */
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
}
