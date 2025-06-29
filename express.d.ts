// src/types/express.d.ts or simply express.d.ts in root if configured
import { JwtPayload } from '../auth/auth.controller'; // Adjust path if needed

declare global {
  namespace Express {
    interface User extends JwtPayload {} // Optional if JwtPayload has sub, email

    interface Request {
      user?: User;
    }
  }
}

export {}; // <- important to make this a module
