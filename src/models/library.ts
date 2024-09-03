import BookTuple from "./book";

// Model for library
export default interface LibraryEntry {
    
    libName: string;
    libId: string;
    books: BookTuple[];
}

