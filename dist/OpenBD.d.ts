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
        data?: undefined;
    } | {
        title: string;
        coverurl: string;
        errorMessage: boolean;
        data: any;
    }>;
}
export declare const openbd: OpenBD;
