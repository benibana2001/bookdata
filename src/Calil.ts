/**
 *
 *  About Calil API
 *
 * カーリル図書館APIでは、全国のOPAC対応図書館のほぼすべてを網羅するリアルタイム蔵書検索機能を提供します。 また、全国の図書館の名称、住所、経緯度情報などをまとめた図書館データベースへのアクセスを提供します。
 * The Carlyle Library API provides a real-time collection search function that covers almost all OPAC-compatible libraries in Japan. It also provides access to a library database that compiles the names, addresses, and latitude/longitude information of libraries nationwide.
 *
 * https://calil.jp/doc/api_ref.html
 *
 */

/**
 *
 * TEST URL - PLEASE SET YOUR APPKEY -
 *
 * https://api.calil.jp/check?appkey={}&isbn=4334926940&systemid=Tokyo_Setagaya&format=json
 * https://api.calil.jp/check?appkey={}&isbn=4834000826&systemid=Aomori_Pref&format=json
 *
 */
export interface LibRequest {
  /**
   * apkeyはユーザーが各自でCalilに登録して受領する必要あり
   * Users must register and receive apkey from Calil on their own.。
   */
  appkey: string;

  /**
   * 検索したい書籍のISBN
   * ISBN of the book you want to searchN
   */
  isbn: string;

  /**
   * 検索したい市区町村
   * 指定する文字列はCalilによって決められたものを使用する必要がある
   * 市区町村ごとに一つの文字列が割り当てられている
   *
   * The city/town you want to search
   * The string to be specified must be the one determined by Calil
   * One string is assigned to each municipality.
   */
  systemid: string;

  /**
   * ポーリングの間隔(ms)
   * Calil-APIから返却がない場合は時間をおいて再接続(ポーリング)するよう決められている
   * Polling interval (ms)
   * If there is no return from Calil-API, it is decided to reconnect(polling) after some time
   */
  pollingDuration: number;
}

/**
 *
 * Response from Calil API
 *
 */
export interface LibResponse {
  session?: string;

  /**
   * - continue
   *    - 0（偽）または1（真）が返ります
   *    - 1の場合は、まだすべての取得が完了していないことを示します。
   *
   * continueが1で返ってきたときは、クライアントは戻り値のsessionをパラメータにして、再度checkをリクエストします。
   */
  continue: number;

  /**
   *
   */
  books: {};

  /**
   *
   */
  libkey: LibData[];

  /**
   * The URL to reserve book provided by library
   * 図書館が提供している予約WebページへのリンクURL
   */
  reserveurl: string;
}

/**
 * 図書館情報
 * Library Information
 */
export interface LibData {
  /**
   * 図書館のユニークID
   * Library Unique ID
   */
  libraryID: number;
  /**
   * 図書館名
   * Library Name
   */
  libraryName: string;
  /**
   * 検索した本の貸出状況
   * Borrowing status of searched books
   */
  borrowingStatus: string;
}

/**
 * Calilサーバーにおける本の検索状態
 * State of book search on Calil server
 */
enum ServerStatus {
  SUCCESS = 0,
  POLLING = 1,
  SERVER_ERROR = -1,
  NOT_EXIST = -2
}

const DEFAULT_LIB_REQUEST: LibRequest = {
  appkey: '',
  isbn: '',
  systemid: '',
  pollingDuration: 2000
};

const DEFAULT_LIB_RESPONSE: LibResponse = {
  libkey: [],
  reserveurl: '',
  continue: 0,
  books: {}
};

/**
 *
 * カーリルAPIに繋いで検索を行うクラス
 * Class that connects to the Carlyle API to perform searches
 *
 */
export class Calil {
  private readonly HOST: string = 'https://api.calil.jp/check';
  private _request: LibRequest = DEFAULT_LIB_REQUEST;
  private _serverStatus = 0;

  get request() {
    return this._request;
  }

  set request(request: LibRequest) {
    this._request = request;
  }

  set serverStatus(status: number) {
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
  private _session = '';
  set session(session: string) {
    this._session = session;
  }
  get session() {
    return this._session;
  }

  private _response: LibResponse;
  set response(data: LibResponse) {
    this._response = data;
  }
  get response() {
    return this._response;
  }

  private validateRequestOptions(): void {
    if (!this._request.appkey) {
      console.error('Please set APP KEY');
    }
    if (typeof this.request.isbn !== 'string') {
      console.error('Please set ISBN as string.');
    }
    if (!this._request.isbn) {
      console.error('Please set ISBN');
    }
    if (!this._request.systemid) {
      console.error('Please set SYSTEM ID');
    }
  }

  /**
   * Search book states
   *
   * Call api using fetch with JSONP.
   */
  public async search(
    req: LibRequest = this._request
  ): Promise<LibResponse | null> {
    this._request = req;

    this.validateRequestOptions();

    /**
     * URLにはAPP_KEYと、検索対象の書籍のISBN、それからSYSTEM_IDを設定する
     * Set the URL to APP_KEY, the ISBN of the book to be searched, and the SYSTEM_ID.
     */
    const url = `${this.HOST}?appkey=${this._request.appkey}&isbn=${this._request.isbn}&systemid=${this._request.systemid}&format=json`;

    // Request
    const json: LibResponse = await this.callApi(url);

    // APIから帰ってきたサーバーステータスを確認し、ポーリングが必要化どうか判定
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
  private async checkServerStatus(json: LibResponse): Promise<void> {
    // Set server status
    this.serverStatus = this.retrieveStatusCodeFromJSON(json);

    // Set session
    if (json.session) this.session = json.session;

    if (this.serverStatus === ServerStatus.POLLING) {
      // Polling
      await this.sleep(this.request.pollingDuration);
      await this.poll();
    } else if (this.serverStatus === ServerStatus.SUCCESS) {
      this.response = this.retrieveLibraryResponseFromJSON(json);
    } else if (this.serverStatus === ServerStatus.NOT_EXIST) {
      console.error('Error - book is not exist');
    } else if (this.serverStatus === ServerStatus.SERVER_ERROR) {
      console.error(`Error - server.status: ${this.serverStatus}`);
    } else {
      console.error(`Error - Unexpected Error was occured`);
    }
  }

  private async poll(): Promise<void> {
    const url: string = `${this.HOST}?appkey=${this._request.appkey}&session=${this._session}&format=json`;
    // request polling
    const json: LibResponse = await this.callApi(url);
    // Check server status
    await this.checkServerStatus(json);
  }

  /**
   *
   * Parse JSON data in order to use React JSX.
   * When display some data in JSX, you are recommended to use Array.map() function,
   * and raw JSON data is difficult to display. So that this function parse JSON data to array.
   *
   */
  private retrieveLibraryResponseFromJSON(json: any): LibResponse {
    const libkey: any =
      json.books[this._request.isbn][this._request.systemid].libkey;
    const reserveurl: string =
      json.books[this._request.isbn][this._request.systemid].reserveurl;
    const books: {} =
      json.books[this._request.isbn][this._request.systemid].books;
    const res: LibResponse = {
      libkey: [],
      reserveurl,
      continue: 0,
      books
    };
    let i = 1;
    for (const key in libkey) {
      const d: LibData = {
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
  private async callApi(url: string): Promise<LibResponse> {
    let parsedObject: LibResponse;

    return await fetch(url)
      .then((res) => res.text())
      .then((resText) => {
        const match = resText.match(/callback\((.*)\);/);
        if (!match) throw new Error('invalid JSONP response');
        parsedObject = JSON.parse(match[1]);
        return parsedObject;
      })
      .catch((error) => {
        console.error(error);
        return DEFAULT_LIB_RESPONSE
      });

  }


  /**
   * getServerStatus
   *
   * サーバーから返却されたcontinueの値を見て処理を分岐・実行します。
   */
  private retrieveStatusCodeFromJSON(data: LibResponse): ServerStatus {
    const status =
      data.books[this._request.isbn][this._request.systemid].status;

    if (data.continue === 1) {
      return ServerStatus.POLLING;
    } else if (data.continue === 0) {
      // 蔵書の有無を判定
      if (status === 'OK' || status === 'Cache') {
        const libkey: any =
          data.books[this._request.isbn][this._request.systemid].libkey;

        if (!libkey || !Object.keys(libkey).length) {
          return ServerStatus.NOT_EXIST;
        } else {
          return ServerStatus.SUCCESS;
        }
      } else {
        return ServerStatus.SERVER_ERROR;
      }
    } else {
      console.error(`Error: Failed to retrieve Status Code from JSON`);
    }
    return ServerStatus.SERVER_ERROR;
  }

  private sleep(ms: number): Promise<any> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const calil = new Calil();
