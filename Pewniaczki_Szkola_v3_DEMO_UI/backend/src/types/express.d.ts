import "express";
declare global {
  namespace Express {
    interface Request {
      currentUser?: { id: number; username: string; email: string; role: string; isActive: boolean };
      sessionId?: number;
    }
  }
}
export {};
