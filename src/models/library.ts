import BookTuple from "./book";

export default interface LibraryEntry {
    
    libName: string;
    libId: string;
    books: BookTuple[];
}

