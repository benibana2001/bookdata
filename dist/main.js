// src/OpenBD.ts
var OpenBD = class {
  _isbn = "";
  HOST = "https://api.openbd.jp/v1/get";
  set isbn(isbn) {
    this._isbn = isbn;
  }
  get isbn() {
    return this._isbn;
  }
  message = {
    NO_BOOK: "\u6307\u5B9A\u306EISBN\u306B\u8A72\u5F53\u3059\u308B\u60C5\u5831\u304C\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306B\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F."
  };
  // At OpenBD web api, always return 200 status even if no data.
  async search(isbn) {
    this.isbn = isbn;
    const url = `${this.HOST}?isbn=${this.isbn}&pretty`;
    const res = await fetch(url);
    const ary = await res.json();
    const data = ary[0];
    if (!data) {
      return { title: "", coverurl: "", errorMessage: this.message.NO_BOOK };
    }
    const title = data.onix.DescriptiveDetail.TitleDetail.TitleElement.TitleText.content;
    const coverurl = data.summary.cover;
    return { title, coverurl, errorMessage: false, data };
  }
};
var openbd = new OpenBD();

// src/Calil.ts
var DEFAULT_LIB_REQUEST = {
  appkey: "",
  isbn: "",
  systemid: "",
  pollingDuration: 2e3
};
var DEFAULT_LIB_RESPONSE = {
  libkey: [],
  reserveurl: "",
  continue: 0,
  books: {}
};
var Calil = class {
  HOST = "https://api.calil.jp/check";
  _request = DEFAULT_LIB_REQUEST;
  _serverStatus = 0;
  get request() {
    return this._request;
  }
  set request(request) {
    this._request = request;
  }
  set serverStatus(status) {
    this._serverStatus = status;
  }
  get serverStatus() {
    return this._serverStatus;
  }
  /**
   * Calilでの検索に時間がかかる場合に、Calilよりセッションが文字列として返ります。
   * このセッションは、２度目の呼び出し（ポーリング)の時に使用します。
   * If the search in Calil takes a long time, a session is returned from Calil as a string.
   * This session is used for the second call (polling).
   */
  _session = "";
  set session(session) {
    this._session = session;
  }
  get session() {
    return this._session;
  }
  _response;
  set response(data) {
    this._response = data;
  }
  get response() {
    return this._response;
  }
  validateRequestOptions() {
    if (!this._request.appkey) {
      console.error("Please set APP KEY");
    }
    if (typeof this.request.isbn !== "string") {
      console.error("Please set ISBN as string.");
    }
    if (!this._request.isbn) {
      console.error("Please set ISBN");
    }
    if (!this._request.systemid) {
      console.error("Please set SYSTEM ID");
    }
  }
  /**
   * Search book states
   *
   * Call api using fetch with JSONP.
   */
  async search(req = this._request) {
    this._request = req;
    this.validateRequestOptions();
    const url = `${this.HOST}?appkey=${this._request.appkey}&isbn=${this._request.isbn}&systemid=${this._request.systemid}&format=json`;
    const json = await this.callApi(url);
    await this.checkServerStatus(json);
    return this._response;
  }
  /**
   *
   * Check server status
   *
   * Calil server return status code as a number.
   * We should judge server process would be done or not by checking this status code.
   * If not finished, we should proceed polling process.
   *
   */
  async checkServerStatus(json) {
    this.serverStatus = this.retrieveStatusCodeFromJSON(json);
    if (json.session)
      this.session = json.session;
    if (this.serverStatus === 1 /* POLLING */) {
      await this.sleep(this.request.pollingDuration);
      await this.poll();
    } else if (this.serverStatus === 0 /* SUCCESS */) {
      this.response = this.retrieveLibraryResponseFromJSON(json);
    } else if (this.serverStatus === -2 /* NOT_EXIST */) {
      console.error("Error - book is not exist");
    } else if (this.serverStatus === -1 /* SERVER_ERROR */) {
      console.error(`Error - server.status: ${this.serverStatus}`);
    } else {
      console.error(`Error - Unexpected Error was occured`);
    }
  }
  async poll() {
    const url = `${this.HOST}?appkey=${this._request.appkey}&session=${this._session}&format=json`;
    const json = await this.callApi(url);
    await this.checkServerStatus(json);
  }
  /**
   *
   * Parse JSON data in order to use React JSX.
   * When display some data in JSX, you are recommended to use Array.map() function,
   * and raw JSON data is difficult to display. So that this function parse JSON data to array.
   *
   */
  retrieveLibraryResponseFromJSON(json) {
    const libkey = json.books[this._request.isbn][this._request.systemid].libkey;
    const reserveurl = json.books[this._request.isbn][this._request.systemid].reserveurl;
    const books = json.books[this._request.isbn][this._request.systemid].books;
    const res = {
      libkey: [],
      reserveurl,
      continue: 0,
      books
    };
    let i = 1;
    for (const key in libkey) {
      const d = {
        libraryID: i,
        libraryName: key,
        borrowingStatus: libkey[key]
      };
      res.libkey.push(d);
      i++;
    }
    return res;
  }
  /**
   *
   * @param url Calil蔵書検索APIのURL
   * @returns APIのレスポンス(JSONP)をパースして返却する
   *
   * APIからの返却値はJSONP形式であるため、JSONデータに変換して返している。
   * Since the value returned from the API is in JSONP format, it is converted to JSON data and returned.
   *
   */
  async callApi(url) {
    let parsedObject;
    return await fetch(url).then((res) => res.text()).then((resText) => {
      const match = resText.match(/callback\((.*)\);/);
      if (!match)
        throw new Error("invalid JSONP response");
      parsedObject = JSON.parse(match[1]);
      return parsedObject;
    }).catch((error) => {
      console.error(error);
      return DEFAULT_LIB_RESPONSE;
    });
  }
  /**
   * getServerStatus
   *
   * サーバーから返却されたcontinueの値を見て処理を分岐・実行します。
   */
  retrieveStatusCodeFromJSON(data) {
    const status = data.books[this._request.isbn][this._request.systemid].status;
    if (data.continue === 1) {
      return 1 /* POLLING */;
    } else if (data.continue === 0) {
      if (status === "OK" || status === "Cache") {
        const libkey = data.books[this._request.isbn][this._request.systemid].libkey;
        if (!libkey || !Object.keys(libkey).length) {
          return -2 /* NOT_EXIST */;
        } else {
          return 0 /* SUCCESS */;
        }
      } else {
        return -1 /* SERVER_ERROR */;
      }
    } else {
      console.error(`Error: Failed to retrieve Status Code from JSON`);
    }
    return -1 /* SERVER_ERROR */;
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};
var calil = new Calil();

// src/main.ts
var BeniBook = class {
  _openbd;
  _calil;
  constructor() {
    this._openbd = openbd;
    this._calil = calil;
  }
  async searchBookCoverURL(isbn) {
    return (await this._openbd.search(isbn)).coverurl;
  }
  async searchBookTitle(isbn) {
    return (await this._openbd.search(isbn)).title;
  }
  async searchLibraryStock(request) {
    return await this._calil.search(request);
  }
};
var beniBook = new BeniBook();
export {
  BeniBook,
  beniBook
};
