// src/OpenBD.ts
var message = {
  NO_BOOK: "\u6307\u5B9A\u306EISBN\u306B\u8A72\u5F53\u3059\u308B\u60C5\u5831\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F."
};
var OpenBD = class {
  _isbn = "";
  HOST = "https://api.openbd.jp/v1/get";
  set isbn(isbn) {
    this._isbn = isbn;
  }
  get isbn() {
    return this._isbn;
  }
  // At OpenBD web api, always return 200 status even if no data.
  async search(isbn) {
    this.isbn = isbn;
    const url = `${this.HOST}?isbn=${this.isbn}&pretty`;
    const res = await fetch(url);
    const ary = await res.json();
    const data = ary[0];
    if (!data) {
      return { title: "", coverurl: "", errorMessage: message.NO_BOOK };
    }
    const title = data.onix.DescriptiveDetail.TitleDetail.TitleElement.TitleText.content;
    const coverurl = data.summary.cover;
    return { title, coverurl, errorMessage: false };
  }
};
var openbd = new OpenBD();
export {
  OpenBD,
  openbd
};
