import { OpenBD, openbd } from './OpenBD';
import { Calil, CalilRequest, calil } from './Calil';

/**
 * 
 * ISBNをもとに書籍の情報を取得する
 * - 書影、タイトル、
 * - 図書館の在庫
 * 
 * 
 * Retrieve information about a book based on its ISBN
 * - Book cover imate, title,
 * - Book library (@Tokyo) inventory
 * 
 */
export class BeniBook {
  private _openbd: OpenBD;
  private _calil: Calil;

  constructor() {
    this._openbd = openbd;
    this._calil = calil;
  }

  /**
   * 本の書影を取得する
   */
  public async searchBookCoverURL(isbn: string) {
    return (await this._openbd.search(isbn)).coverurl;
  }

  /**
   * 本のタイトルを取得する
   */
  public async searchBookTitle(isbn: string) {
    return (await this._openbd.search(isbn)).title;
  }

  /**
   * エラーをキャッチする必要あり
   * You should use try-catch
   */
  public async searchLibraryCollections(request: CalilRequest) {
    return await this._calil.search(request);
  }
}

export const beniBook = new BeniBook();
