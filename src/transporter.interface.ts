export interface ITransporter {
  send(message: string): Promise<void>;
}
