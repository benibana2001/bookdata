import { LibRequest } from './Calil';
export declare class BeniBook {
    private _openbd;
    private _calil;
    constructor();
    searchBookCoverURL(isbn: string): Promise<string>;
    searchBookTitle(isbn: string): Promise<string>;
    searchLibraryStock(request: LibRequest): Promise<import("./Calil").LibResponse>;
}
export declare const beniBook: BeniBook;
