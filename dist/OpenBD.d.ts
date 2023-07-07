/**
 *
 * Response from OpenBD-API
 *
 * Only "errorMessage" is injected by this code, the rest are passed as defined the OpenBD-API
 * このコードで注入されるのは "errorMessage "だけで、あとはOpenBD-APIで定義されているとおりに渡されます。.
 *
 */
export interface BookResponse {
    title: string;
    coverurl?: string;
    errorMessage: boolean | string;
}
/**
 *
 * ISBNをもとにOpenBDから書籍のタイトルと書影URLを取得します
 * Retrieve the book title and book-cover's URL from OpenBD based on ISBN.。
 *
 * OpenBD API: https://openbd.jp/
 * 仕様書(spec)：https://openbd.jp/spec/
 *
 * 検索例(example)
 * - https://api.openbd.jp/v1/get?isbn=9784837987499&pretty
 *
 * V1の書誌データは、JPRO-onix準拠の基本項目+版元ドットコム独自データの構造になっている。
 * V1 bibliographic data is structured as JPRO-onix compliant basic entries plus publisher.com's own data.
 *
 * 書籍情報がない場合は、空の文字列とエラーメッセージを返します
 * If book information is missing, returns a blank string and an error message
 *
 */
export declare class OpenBD {
    private _isbn;
    private readonly HOST;
    set isbn(isbn: string);
    get isbn(): string;
    private message;
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
