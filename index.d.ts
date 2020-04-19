declare module '@ung/node-etupay' {
  import { Request, Response, NextFunction } from 'express';

  interface Initializer {
    id: number;
    url: string;
    key: string;
  }

  class Basket {
    constructor(title: string, firstname: string, lastname: string, email: string, type: string, data: string);

    addItem(name: string, price: number, quantity: number): void;

    compute(): string;
  }

  export type EtupayMiddleware = (req: Request, res: Response, next: NextFunction) => void;

  interface InitializerReturn {
    Basket: typeof Basket;
    middleware: EtupayMiddleware;
  }

  export default function initialize(initializer: Initializer): InitializerReturn;
}
