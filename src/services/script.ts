import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import LibraryEntry from '../models/library';
import BookTuple from '../models/book';

// This function is used to verify the token in the request header
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send('Unauthorized: No token provided');
  }

  const token = authHeader;

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err) => {
    if (err) {
      return res.status(401).send('Unauthorized: Invalid token');
    }

    next();
  });
};

// This function is used to validate an email address
export function validateEmail(email: string): boolean {
  var reg =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  return reg.test(String(email).toLowerCase());
}

// This function is used to validate a password
export function validatePassword(password: string, req: Request, res: Response): boolean {
  // Check for minimum length of 8 characters
  if (password.length < 8) {
    res.status(406).send("The password must be 8 characters long");
    return false;
  }

  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    res.status(406).send("The password must contain a letter");
    return false;
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    res.status(406).send("The password must contain a number");
    return false;
  }

  // Check for at least one special character among: ? ! . _ - @ |
  if (!/[?!._\-@|]/.test(password)) {
    res.status(406).send("The password must contain at least one special character among: ? ! . _ - @ |");
    return false;
  }

  // If all checks pass, the password is valid
  return true;
}

// This function is used to retrieve a specific book from the library
export async function getBookfromLibrary(library: LibraryEntry[], libId: string, bookId: string): Promise<BookTuple | null> {
  const libraryEntry = library.find((lib) => lib.libId == libId) as LibraryEntry | null;
  if (!libraryEntry) return null;

  const bookTuple = libraryEntry.books.find((book) => book.bookId == bookId) as BookTuple | null;

  if (!bookTuple) return null;

  return bookTuple;
}
