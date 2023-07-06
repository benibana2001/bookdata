import { OpenBD, openbd } from './OpenBD';
import { Calil, CalilRequest, calil } from './Calil';

export class BeniBook {
  private _openbd: OpenBD;
  private _calil: Calil;

  constructor() {
    this._openbd = openbd;
    this._calil = calil;
  }

  public async searchBookCoverURL(isbn: string) {
    return (await this._openbd.search(isbn)).coverurl;
  }

  public async searchBookTitle(isbn: string) {
    return (await this._openbd.search(isbn)).title;
  }

  public async searchLibraryStock(request: CalilRequest) {
    return await this._calil.search(request);
  }
}

export const beniBook = new BeniBook();
