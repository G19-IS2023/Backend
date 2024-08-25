import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import LibraryEntry from '../models/library';
import BookTuple from '../models/book';

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


export function validateEmail (email: string): boolean {

  var reg =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
 
  return reg.test(String(email).toLowerCase());
}


export function validatePassword(password: string, req: Request, res: Response): boolean {
  
  // Verifica la lunghezza minima di 8 caratteri
  if (password.length < 8) {
      res.status(406).send("The password must be 8 char long");
      return false;
  }

  // Verifica la presenza di almeno una lettera
  if (!/[a-zA-Z]/.test(password)) {
      res.status(406).send("The password must contain a letter");
      return false;
  }

  // Verifica la presenza di almeno un numero
  if (!/\d/.test(password)) {
      res.status(406).send("The password must contain a number");
      return false;
  }

  // Verifica la presenza di almeno un carattere speciale tra i seguenti: ? ! . _ - @ |
  if (!/[?!._\-@|]/.test(password)) {
      res.status(406).send("The password must contain at least one special char between these: ? ! . _ - @ |");
      return false;
  }

  // Se tutti i controlli sono superati, la password è valida
  return true;
}

//Funzione per ricavare un book specifico
export async function getBookfromLibrary(library: LibraryEntry[], libId: string, bookId: string): Promise<BookTuple | null> {

  const libraryEntry = library.find((lib) => lib.libId == libId) as LibraryEntry | null;
  if(!libraryEntry) return null;

  const bookTuple = libraryEntry.books.find((book) => book.bookId == bookId) as BookTuple | null;

  if(!bookTuple) return null;

  return bookTuple;
}
