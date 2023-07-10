import { CalilServerStatusError } from './Errors';

/**
 *
 *  About Calil API
 *
 * カーリル図書館APIでは、全国のOPAC対応図書館のほぼすべてを網羅するリアルタイム蔵書検索機能を提供します。 また、全国の図書館の名称、住所、経緯度情報などをまとめた図書館データベースへのアクセスを提供します。
 * The Carlyle Library API provides a real-time collection search function that covers almost all OPAC-compatible libraries in Japan. It also provides access to a library database that compiles the names, addresses, and latitude/longitude information of libraries nationwide.
 *
 * https://calil.jp/doc/api_ref.html
 *
 * TEST URL - PLEASE SET YOUR APPKEY -
 *
 * https://api.calil.jp/check?appkey={}&isbn=4334926940&systemid=Tokyo_Setagaya&format=json
 * https://api.calil.jp/check?appkey={}&isbn=4834000826&systemid=Aomori_Pref&format=json
 *
 */
export interface CalilRequest {
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
  systemid: Prefecture;

  /**
   * ポーリングの間隔(ms)
   * Calil-APIから返却がない場合は時間をおいて再接続(ポーリング)するよう決められている
   * Polling interval (ms)
   * If there is no return from Calil-API, it is decided to reconnect(polling) after some time
   */
  pollingDuration: number;
}

export interface CalilResponse {
  session: string;
  /**
   * - continue
   *    - 0（偽）または1（真）が返ります
   *    - 1の場合は、まだすべての取得が完了していないことを示します。
   *
   * continueが1で返ってきたときは、クライアントは戻り値のsessionをパラメータにして、再度checkをリクエストします。
   */
  continue: CALIL_SERVER_CONTINUE_STATUS;

  books: CalilResponseBook;
}

type CalilResponseBook = {
  // Key is ISBN you requested
  [key: string]: CalilResponsePrefecture;
};

type CalilResponsePrefecture = {
  [key: string]: {
    status: CalilResponseSearchStatus;
    reserveurl: string;
    libkey: CalilResponseLibkey;
  };
};

type CalilResponseSearchStatus = 'OK' | 'Cache' | 'Running' | 'Error';

type CalilResponseLibkey = { [key: string]: BorrowingStatus };

type BorrowingStatus =
  | '貸出可'
  | '蔵書あり'
  | '館内のみ'
  | '貸出中'
  | '予約中'
  | '準備中'
  | '休館中'
  | '蔵書なし';

/**
 *
 * Response from Calil API
 *
 */
export interface ParsedResponse {
  session?: string;

  continue: number;

  /**
   *
   */
  libkey: LibData[];

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
  borrowingStatus: BorrowingStatus;
}

/**
 * Calilサーバーにおける本の検索状態
 * State of book search on Calil server
 */
// type CALIL_SERVER_BOOK_STATUS = 0 | 1 | -1 | -2;
type CALIL_SERVER_BOOK_STATUS =
  | 'SUCCESS'
  | 'POLINLING'
  | 'SERVER_ERROR'
  | 'NOT_EXIST';

type CALIL_SERVER_CONTINUE_STATUS = 0 | 1;

// TODO: 文字列でユニオン型でOK
// const ServerStatus: { [key: string]: CALIL_SERVER_BOOK_STATUS } = {
//   SUCCESS: 0,
//   POLLING: 1,
//   SERVER_ERROR: -1,
//   NOT_EXIST: -2
// };

const DEFAULT_CALIL_REQUEST: CalilRequest = {
  appkey: '',
  isbn: '',
  systemid: 'Tokyo_Setagaya',
  pollingDuration: 2000
};

/**
 *
 * カーリルAPIに繋いで検索を行うクラス
 * Class that connects to the Carlyle API to perform searches
 *
 */
export class Calil {
  private readonly HOST = 'https://api.calil.jp/check';
  private _request: CalilRequest = DEFAULT_CALIL_REQUEST;
  private _serverBookStatus: CALIL_SERVER_BOOK_STATUS;

  get request() {
    return this._request;
  }

  set request(request: CalilRequest) {
    this._request = request;
  }

  set serverStatus(status: CALIL_SERVER_BOOK_STATUS) {
    this._serverBookStatus = status;
  }
  get serverStatus() {
    return this._serverBookStatus;
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

  private _response: ParsedResponse;
  set response(data: ParsedResponse) {
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
    req: CalilRequest = this._request
  ): Promise<ParsedResponse> {
    this._request = req;

    this.validateRequestOptions();

    /**
     * URLにはAPP_KEYと、検索対象の書籍のISBN、それからSYSTEM_IDを設定する
     * Set the URL to APP_KEY, the ISBN of the book to be searched, and the SYSTEM_ID.
     */
    const url = `${this.HOST}?appkey=${this._request.appkey}&isbn=${this._request.isbn}&systemid=${this._request.systemid}&format=json`;
    console.log(url)
    // Request
    const json: CalilResponse = await this.callApi(url);
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
  private async checkServerStatus(json: CalilResponse): Promise<void> {
    // Set server status
    this.serverStatus = this.retrieveStatusCodeFromJSON(json);

    // Set session
    if (json.session) this.session = json.session;

    if (this.serverStatus === 'POLINLING') {
      // Polling
      await this.sleep(this.request.pollingDuration);
      await this.poll();
    } else if (this.serverStatus === 'SUCCESS') {
      this.response = this.retrieveLibraryResponseFromJSON(json);
    } else if (this.serverStatus === 'NOT_EXIST') {
      // TODO THIS IS NOT ERROR ⚠️
      console.error('Error - book is not exist');
    } else if (this.serverStatus === 'SERVER_ERROR') {
      throw new CalilServerStatusError(500, {
        // TODO: to keep clean
        detailMessage: `Error was occured at Calil Server..\n This Error status code is generated at Calil Server.\n You shold referto https://calil.jp/doc/api_ref.html`
      });
      console.error(`Error - server.status: ${this.serverStatus}`);
    } else {
      console.error(`Error - Unexpected Error was occured`);
    }
  }

  private async poll(): Promise<void> {
    const url = `${this.HOST}?appkey=${this._request.appkey}&session=${this._session}&format=json`;
    // request polling
    const json: CalilResponse = await this.callApi(url);
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
  private retrieveLibraryResponseFromJSON(json: CalilResponse): ParsedResponse {
    const libkey: CalilResponseLibkey =
      json.books[this._request.isbn][this._request.systemid].libkey;
    const reserveurl: string =
      json.books[this._request.isbn][this._request.systemid].reserveurl;
    const res: ParsedResponse = {
      libkey: [],
      reserveurl,
      continue: 0
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
  private async callApi(url: string): Promise<CalilResponse> {
    let parsedObject: CalilResponse;

    return await fetch(url)
      .then((res) => {
        if (res.status === 200) return res.text();
        throw new CalilServerStatusError(res.status);
      })
      .then((resText) => {
        const match = resText.match(/callback\((.*)\);/);
        if (!match) throw new Error('invalid JSONP response');
        parsedObject = JSON.parse(match[1]);
        return parsedObject;
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  /**
   * getServerStatus
   *
   * サーバーから返却されたcontinueの値を見て処理を分岐・実行します。
   */
  private retrieveStatusCodeFromJSON(
    data: CalilResponse
  ): CALIL_SERVER_BOOK_STATUS {
    const searchStatus =
      data.books[this._request.isbn][this._request.systemid].status;

    if (data.continue === 1) {
      // TODO not use number. replace string. 'POLLING', 'NOT_EXIST', 'SUCCESS', 'SERVER_ERROR'
      return 'POLINLING';
    } else if (data.continue === 0) {
      // 蔵書の有無を判定
      if (searchStatus === 'OK' || searchStatus === 'Cache') {
        const libkey: CalilResponseLibkey =
          data.books[this._request.isbn][this._request.systemid].libkey;

        if (!libkey || !Object.keys(libkey).length) {
          // TODO エラーではないのでnull,あるいは空オブジェクトで返す
          return 'NOT_EXIST';
        } else {
          return 'SUCCESS';
        }
      } else {
        return 'SERVER_ERROR';
      }
    } else {
      console.error(`Error: Failed to retrieve Status Code from JSON`);
    }
    return 'SERVER_ERROR';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

type PrefecturePrefix = 'Tokyo_';
type PrefectureName =
  | 'Adachi'
  | 'Akiruno'
  | 'Akishima'
  | 'Arakawa'
  | 'Bunkyo'
  | 'Chiyoda'
  | 'Chofu'
  | 'Chuo'
  | 'Edogawa'
  | 'Fuchu'
  | 'Fussa'
  | 'Hachijo'
  | 'Hachioji'
  | 'Hamura'
  | 'Higashikurume'
  | 'Higashimurayama'
  | 'Higashiyamato'
  | 'Hino'
  | 'Hinode'
  | 'Inagi'
  | 'Itabashi'
  | 'Katsushika'
  | 'Kita'
  | 'Kiyose'
  | 'Kodaira'
  | 'Koganei'
  | 'Kokubunji'
  | 'Komae'
  | 'Koto'
  | 'Kunitachi'
  | 'Machida'
  | 'Meguro'
  | 'Minato'
  | 'Mitaka'
  | 'Mizuho'
  | 'Musashimurayama'
  | 'Musashino'
  | 'Nakano'
  | 'NDL'
  | 'Nerima'
  | 'Niijima'
  | 'Nishitokyo'
  | 'Okutama'
  | 'Ome'
  | 'Ota'
  | 'Koganei'
  | 'Setagaya'
  | 'Shibuya'
  | 'Shinagawa'
  | 'Shinjuku'
  | 'Suginami'
  | 'Sumida'
  | 'Tachikawa'
  | 'Taito'
  | 'Tama'
  | 'Toshima';
type Prefecture = `${PrefecturePrefix}${PrefectureName}`;

export const PrefectureList: [Prefecture, string][] = [
  ['Tokyo_Adachi', '足立区'],
  ['Tokyo_Akiruno', 'あきる野市'],
  ['Tokyo_Akishima', '昭島市'],
  ['Tokyo_Arakawa', '荒川区'],
  ['Tokyo_Bunkyo', '文京区'],
  ['Tokyo_Chiyoda', '千代田区'],
  ['Tokyo_Chofu', '調布市'],
  ['Tokyo_Chuo', '中央区'],
  ['Tokyo_Edogawa', '江戸川区'],
  ['Tokyo_Fuchu', '府中市'],
  ['Tokyo_Fussa', '福生市'],
  ['Tokyo_Hachijo', '八丈町'],
  ['Tokyo_Hachioji', '八王子市'],
  ['Tokyo_Hamura', '羽村市'],
  ['Tokyo_Higashikurume', '東久留米市'],
  ['Tokyo_Higashimurayama', '東村山市'],
  ['Tokyo_Higashiyamato', '東大和市'],
  ['Tokyo_Hino', '日野市'],
  ['Tokyo_Hinode', '日の出町'],
  ['Tokyo_Inagi', '稲城市'],
  ['Tokyo_Itabashi', '板橋区'],
  ['Tokyo_Katsushika', '葛飾区'],
  ['Tokyo_Kita', '北区'],
  ['Tokyo_Kiyose', '清瀬市'],
  ['Tokyo_Kodaira', '小平市'],
  ['Tokyo_Koganei', '小金井市'],
  ['Tokyo_Kokubunji', '国分寺市'],
  ['Tokyo_Komae', '狛江市'],
  ['Tokyo_Koto', '江東区'],
  ['Tokyo_Kunitachi', '国立市'],
  ['Tokyo_Machida', '町田市'],
  ['Tokyo_Meguro', '目黒区'],
  ['Tokyo_Minato', '港区'],
  ['Tokyo_Mitaka', '三鷹市'],
  ['Tokyo_Mizuho', '瑞穂町'],
  ['Tokyo_Musashimurayama', '武蔵村山市'],
  ['Tokyo_Musashino', '武蔵野市'],
  ['Tokyo_Nakano', '中野区'],
  ['Tokyo_NDL', '国立国会図書館'],
  ['Tokyo_Nerima', '練馬区'],
  ['Tokyo_Niijima', '新島村'],
  ['Tokyo_Nishitokyo', '西東京市'],
  ['Tokyo_Okutama', '奥多摩町'],
  ['Tokyo_Ome', '青梅市'],
  ['Tokyo_Ota', '大田区'],
  ['Tokyo_Setagaya', '世田谷区'],
  ['Tokyo_Shibuya', '渋谷区'],
  ['Tokyo_Shinagawa', '品川区'],
  ['Tokyo_Shinjuku', '新宿区'],
  ['Tokyo_Suginami', '杉並区'],
  ['Tokyo_Sumida', '墨田区'],
  ['Tokyo_Tachikawa', '立川市'],
  ['Tokyo_Taito', '台東区'],
  ['Tokyo_Tama', '多摩市'],
  ['Tokyo_Toshima', '豊島区']
];

export const calil = new Calil();
