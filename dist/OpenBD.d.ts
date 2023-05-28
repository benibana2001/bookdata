export interface BookResponse {
    title: string;
    coverurl?: string;
    errorMessage: boolean | string;
}
export declare class OpenBD {
    private _isbn;
    private readonly HOST;
    set isbn(isbn: string);
    get isbn(): string;
    search(isbn: string): Promise<{
        title: string;
        coverurl: string;
        errorMessage: string;
    } | {
        title: string;
        coverurl: string;
        errorMessage: boolean;
    }>;
}
export declare const openbd: OpenBD;
