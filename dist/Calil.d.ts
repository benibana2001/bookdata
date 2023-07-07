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
type CalilResponseLibkey = {
    [key: string]: BorrowingStatus;
};
type BorrowingStatus = '貸出可' | '蔵書あり' | '館内のみ' | '貸出中' | '予約中' | '準備中' | '休館中' | '蔵書なし';
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
type CALIL_SERVER_CONTINUE_STATUS = 0 | 1;
/**
 *
 * カーリルAPIに繋いで検索を行うクラス
 * Class that connects to the Carlyle API to perform searches
 *
 */
export declare class Calil {
    private readonly HOST;
    private _request;
    private _serverStatus;
    get request(): CalilRequest;
    set request(request: CalilRequest);
    set serverStatus(status: number);
    get serverStatus(): number;
    /**
     * Calilでの検索に時間がかかる場合に、Calilよりセッションが文字列として返ります。
     * このセッションは、２度目の呼び出し（ポーリング)の時に使用します。
     * If the search in Calil takes a long time, a session is returned from Calil as a string.
     * This session is used for the second call (polling).
     */
    private _session;
    set session(session: string);
    get session(): string;
    private _response;
    set response(data: ParsedResponse);
    get response(): ParsedResponse;
    private validateRequestOptions;
    /**
     * Search book states
     *
     * Call api using fetch with JSONP.
     */
    search(req?: CalilRequest): Promise<ParsedResponse | null>;
    /**
     *
     * Check server status
     *
     * Calil server return status code as a number.
     * We should judge server process would be done or not by checking this status code.
     * If not finished, we should proceed polling process.
     *
     */
    private checkServerStatus;
    private poll;
    /**
     *
     * Parse JSON data in order to use React JSX.
     * When display some data in JSX, you are recommended to use Array.map() function,
     * and raw JSON data is difficult to display. So that this function parse JSON data to array.
     *
     */
    private retrieveLibraryResponseFromJSON;
    /**
     *
     * @param url Calil蔵書検索APIのURL
     * @returns APIのレスポンス(JSONP)をパースして返却する
     *
     * APIからの返却値はJSONP形式であるため、JSONデータに変換して返している。
     * Since the value returned from the API is in JSONP format, it is converted to JSON data and returned.
     *
     */
    private callApi;
    /**
     * getServerStatus
     *
     * サーバーから返却されたcontinueの値を見て処理を分岐・実行します。
     */
    private retrieveStatusCodeFromJSON;
    private sleep;
}
type PrefecturePrefix = 'Tokyo_';
type PrefectureName = 'Adachi' | 'Akiruno' | 'Akishima' | 'Arakawa' | 'Bunkyo' | 'Chiyoda' | 'Chofu' | 'Chuo' | 'Edogawa' | 'Fuchu' | 'Fussa' | 'Hachijo' | 'Hachioji' | 'Hamura' | 'Higashikurume' | 'Higashimurayama' | 'Higashiyamato' | 'Hino' | 'Hinode' | 'Inagi' | 'Itabashi' | 'Katsushika' | 'Kita' | 'Kiyose' | 'Kodaira' | 'Koganei' | 'Kokubunji' | 'Komae' | 'Koto' | 'Kunitachi' | 'Machida' | 'Meguro' | 'Minato' | 'Mitaka' | 'Mizuho' | 'Musashimurayama' | 'Musashino' | 'Nakano' | 'NDL' | 'Nerima' | 'Niijima' | 'Nishitokyo' | 'Okutama' | 'Ome' | 'Ota' | 'Koganei' | 'Setagaya' | 'Shibuya' | 'Shinagawa' | 'Shinjuku' | 'Suginami' | 'Sumida' | 'Tachikawa' | 'Taito' | 'Tama' | 'Toshima';
type Prefecture = `${PrefecturePrefix}${PrefectureName}`;
export declare const PrefectureList: [Prefecture, string][];
export declare const calil: Calil;
export {};
