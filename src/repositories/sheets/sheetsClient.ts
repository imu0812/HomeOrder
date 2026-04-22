export type SheetsClientConfig = {
  spreadsheetId: string;
  serviceAccountEmail?: string;
  privateKey?: string;
};

export class GoogleSheetsClient {
  constructor(private readonly config: SheetsClientConfig) {}

  async readRange(_range: string): Promise<unknown[][]> {
    throw new Error(`Google Sheets readRange is not implemented yet for ${this.config.spreadsheetId}`);
  }

  async appendRows(_range: string, _rows: unknown[][]): Promise<void> {
    throw new Error(`Google Sheets appendRows is not implemented yet for ${this.config.spreadsheetId}`);
  }
}
