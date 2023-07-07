/**
 *
 * Response from OpenBD-API
 *
 * Only "errorMessage" is injected by this code, the rest are passed as defined the OpenBD-API
 * このコードで注入されるのは "errorMessage "だけで、あとはOpenBD-APIで定義されているとおりに渡されます。.
 *
 */
export interface BookResponse {
  title: string; // Book Title
  coverurl?: string; // Book Cover Image's URL
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
export class OpenBD {
  private _isbn = '';
  private readonly HOST = 'https://api.openbd.jp/v1/get';
  set isbn(isbn: string) {
    this._isbn = isbn;
  }
  get isbn() {
    return this._isbn;
  }

  private message = {
    NO_BOOK: '指定のISBNに該当する情報がデータベースに見つかりませんでした.'
  };

  // At OpenBD web api, always return 200 status even if no data.
  public async search(isbn: string) {
    this.isbn = isbn;
    const url = `${this.HOST}?isbn=${this.isbn}&pretty`;
    const res: any = await fetch(url);
    const ary: any = await res.json();
    const data: any = ary[0];

    if (!data) {
      return { title: '', coverurl: '', errorMessage: this.message.NO_BOOK };
    }

    const title: string =
      data.onix.DescriptiveDetail.TitleDetail.TitleElement.TitleText.content;
    const coverurl: string = data.summary.cover;

    return { title: title, coverurl: coverurl, errorMessage: false, data };
  }
}

export const openbd = new OpenBD();
