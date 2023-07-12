import { Prefecture } from './CalilPrefecture';
/**
 ****************************
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
 ****************************
 */
/**
 * 蔵書検索リクエスト
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
    pollingDuration?: number;
}
/**
 * 蔵書検索結果
 */
export interface CalilResponse {
    session: string;
    /**
     * - continue
     *    - 0（偽）または1（真）が返ります
     *    - 1の場合は、まだすべての取得が完了していないことを示します。
     *
     * continueが1で返ってきたときは、クライアントは戻り値のsessionをパラメータにして、再度checkをリクエストします。
     */
    continue: CalilResponseContinueValue;
    /**
     * 蔵書検索結果
     * リクエストしたISBNをキーとした検索結果
     */
    books: {
        [key: string]: CalilResponsePrefecture;
    };
}
/**
 * リクエストした年の名称をキーとした検索結果
 */
type CalilResponsePrefecture = {
    [key: string]: {
        status: CalilResponseSearchStatus;
        reserveurl: string;
        libkey: CalilResponseLibkey;
    };
};
/**
 * Calilサーバーの検索状態. APIで定義された数値
 */
type CalilResponseContinueValue = 0 | 1;
/**
 * Calilサーバーの検索状態. これらはAPI側で定義された文字列
 */
type CalilResponseSearchStatus = 'OK' | 'Cache' | 'Running' | 'Error';
/**
 * 図書館名称をキーとした検索結果. API側で定義されている
 */
type CalilResponseLibkey = {
    [key: string]: CalilResponseBorrowingStatus;
};
/**
 * 本の貸出状態。 API側で定義された文字列
 */
type CalilResponseBorrowingStatus = '貸出可' | '蔵書あり' | '館内のみ' | '貸出中' | '予約中' | '準備中' | '休館中' | '蔵書なし';
/**
 * 検索結果を使いやすいようにパース
 * 最終的に返す値
 */
export interface ParsedResponse {
    continue: number;
    /**
     * 蔵書の状態
     */
    libraryStock: ParsedLibraryData[];
    reserveurl: string;
}
/**
 * 個々の図書館施設における蔵書の状態
 * Library Information
 */
export interface ParsedLibraryData {
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
    borrowingStatus: CalilResponseBorrowingStatus;
}
/**
 * Calilサーバーにおける本の検索状態
 * State of book search on Calil server
 */
type CALIL_SERVER_BOOK_STATUS = 'SUCCESS' | 'POLINLING' | 'SERVER_ERROR';
/**
 *
 * カーリルAPIに繋いで検索を行うクラス
 * Class that connects to the Carlyle API to perform searches
 *
 */
export declare class Calil {
    private readonly HOST;
    private _request;
    private _serverBookStatus;
    get request(): CalilRequest;
    set request(request: CalilRequest);
    set serverStatus(status: CALIL_SERVER_BOOK_STATUS);
    get serverStatus(): CALIL_SERVER_BOOK_STATUS;
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
     *
     * 蔵書がない場合も空のオブジェクトを返す
     */
    search(req?: CalilRequest): Promise<ParsedResponse>;
    /**
     *
     * Check server status
     *
     * Calil server return status code as a number.
     * We should judge server process would be done or not by checking this status code.
     * If not finished, we should proceed polling process.
     *
     */
    private checkServerStatusAndPoll;
    private poll;
    /**
     *
     * Parse JSON data in order to use React JSX.
     * When display some data in JSX, you are recommended to use Array.map() function,
     * and raw JSON data is difficult to display. So that this function parse JSON data to array.
     *
     */
    private parseResponse;
    /**
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
export declare const calil: Calil;
export {};
