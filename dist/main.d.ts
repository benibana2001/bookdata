import { CalilRequest } from './Calil';
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
export declare class BeniBook {
    private _openbd;
    private _calil;
    constructor();
    /**
     * 本の書影を取得する
     */
    searchBookCoverURL(isbn: string): Promise<string>;
    /**
     * 本のタイトルを取得する
     */
    searchBookTitle(isbn: string): Promise<string>;
    /**
     * エラーをキャッチする必要あり
     * You should use try-catch
     */
    searchLibraryCollections(request: CalilRequest): Promise<import("./Calil").ParsedResponse>;
}
export declare const beniBook: BeniBook;
