import { CalilRequest } from './Calil';
export declare class BeniBook {
    private _openbd;
    private _calil;
    constructor();
    searchBookCoverURL(isbn: string): Promise<string>;
    searchBookTitle(isbn: string): Promise<string>;
    searchLibraryStock(request: CalilRequest): Promise<import("./Calil").ParsedResponse>;
}
export declare const beniBook: BeniBook;
