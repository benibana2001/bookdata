export interface BookResponse {
  title: string;
  coverurl?: string;
  errorMessage: boolean | string;
}

const message = {
  NO_BOOK: "指定のISBNに該当する情報が見つかりませんでした.",
};

export class OpenBD {
  private _isbn = "";
  private readonly HOST = "https://api.openbd.jp/v1/get";
  set isbn(isbn: string) {
    this._isbn = isbn;
  }
  get isbn() {
    return this._isbn;
  }

  // At OpenBD web api, always return 200 status even if no data.
  public async search(isbn: string) {
    this.isbn = isbn;
    const url: string = `${this.HOST}?isbn=${this.isbn}&pretty`;
    const res: any = await fetch(url);
    const ary: any = await res.json();
    const data: any = ary[0];

    if (!data) {
      return { title: "", coverurl: "", errorMessage: message.NO_BOOK };
    }

    const title: string =
      data.onix.DescriptiveDetail.TitleDetail.TitleElement.TitleText.content;
    const coverurl: string = data.summary.cover;

    return { title: title, coverurl: coverurl, errorMessage: false, data };
  }
}

export const openbd = new OpenBD()

