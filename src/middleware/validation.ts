import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export const validateBody =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };


