import BookTuple from "./book";

// Model for library
export default interface Library {

    libName: string;
    libId: string;
    books: BookTuple[];
}

