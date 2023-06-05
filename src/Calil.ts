/**
 *
 * TEST URL - PLEASE SET YOUR APPKEY -
 *
 * https://api.calil.jp/check?appkey={}&isbn=4334926940&systemid=Tokyo_Setagaya&format=json
 * https://api.calil.jp/check?appkey={}&isbn=4834000826&systemid=Aomori_Pref&format=json
 *
 */
export interface LibRequest {
  appkey: string;
  isbn: string;
  systemid: string;
  pollingDuration: number;
}

export interface LibResponse {
  libkey: LibData[];
  reserveurl: string;
}

export interface LibData {
  libraryID: number;
  libraryName: string;
  bookStatus: string;
}

enum ServerStatus {
  SUCCESS = 0,
  POLLING = 1,
  SERVER_ERROR = -1,
  NOT_EXIST = -2,
}

const DEFAULT_LIB_REQUEST: LibRequest = {
  appkey: "",
  isbn: "",
  systemid: "",
  pollingDuration: 2000,
};

class Calil {
  //----------------------------------------
  public api_timeout_timer = 0;
  public api_call_count = 0;
  public data_cache = "";

  private readonly HOST: string = "https://api.calil.jp/check";
  private _request: LibRequest;
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

  private _session = "";
  set session(session: string) {
    this._session = session;
  }
  get session() {
    return this._session;
  }

  private _response: LibResponse | null = null;
  set response(data: LibResponse) {
    this._response = data;
  }
  get response() {
    return this._response;
  }

  /**
   * checkOptions
   * Validate Options each value.
   */
  private checkOptions(): void {
    if (!this._request.appkey) {
      console.error("Please set APP KEY");
    }
    if (typeof this.request.isbn !== "string") {
      console.error("Please set ISBN as string.");
    }
    if (!this._request.isbn) {
      console.error("Please set ISBN");
    }
    // Set SystemID to property.
    if (!this._request.systemid) {
      console.error("Please set SYSTEM ID");
    }
  }

  /**
   * Search book states
   *
   * Call api using fetch with JSONP.
   */
  public async search(req: LibRequest = this._request): Promise<LibResponse> {
    this._request = req;

    this.checkOptions();

    const url = `${this.HOST}?appkey=${this._request.appkey}&isbn=${this._request.isbn}&systemid=${this._request.systemid}&format=json`;

    // Request
    const json: object = await this.callApi(url);

    /**
     *
     * Check server status
     *
     * Calis server return status code as a number.
     * We should judge server process would be done or not by checking this status code.
     * If not finished, we should proceed polling process.
     *
     */
    await this.checkServerStatus(json);

    return this._response;
  }
  /**
   * checkServerStatus
   */
  private async checkServerStatus(json: object): Promise<any> {
    // Set server status
    this.serverStatus = this.retrieveStatusCodeFromJSON(json);
    // Set session

    this.session = this.retrieveSessionFromJSON(json);

    if (this.serverStatus === ServerStatus.POLLING) {
      // Polling
      await this.sleep(this.request.pollingDuration);
      await this.poll();
    } else if (this.serverStatus === ServerStatus.SUCCESS) {
      this.response = this.retrieveLibraryResponseFromJSON(json);
      return;
    } else {
      if (this.serverStatus === ServerStatus.NOT_EXIST) {
        console.error("Error - book is not exist");
      } else if (this.serverStatus === ServerStatus.SERVER_ERROR) {
        console.error(`Error - server.status: ${this.serverStatus}`);
      }

      return;
    }
  }
  /**
   * poll
   */
  public async poll(): Promise<any> {
    const url: string = `${this.HOST}?appkey=${this._request.appkey}&session=${this._session}&format=json`;
    // request polling
    const json: object = await this.callApi(url);
    // Check server status
    await this.checkServerStatus(json);
  }

  /**
   *
   * Parse JSON data to use React JSX easily.
   * When display some data in JSX, you are recommended to use Array.map() function,
   * and raw JSON data is difficult to display. So that this function parse JSON data to array.
   *
   */
  public retrieveLibraryResponseFromJSON(json: any): LibResponse {
    const libkey: any =
      json.books[this._request.isbn][this._request.systemid].libkey;
    const reserveurl: string =
      json.books[this._request.isbn][this._request.systemid].reserveurl;
    const res: LibResponse = { libkey: [], reserveurl: reserveurl };
    let i = 1;
    for (const key in libkey) {
      const d: LibData = {
        libraryID: i,
        libraryName: key,
        bookStatus: libkey[key],
      };
      res.libkey.push(d);
      i++;
    }
    return res;
  }

  public async callApi(url: string): Promise<object> {
    let s: object;

    await fetch(url)
      .then((res) => res.text())
      .then((resText) => {
        const match = resText.match(/callback\((.*)\);/);
        if (!match) throw new Error("invalid JSONP response");
        s = JSON.parse(match[1]);
      })
      .catch((error) => {
        console.error(error);
      });

    return s;
  }

  /**
   * getServerStatus
   *
   * 0: success
   * 1: polling
   * -1: server error
   * -2: boo isn't exist
   */
  private retrieveStatusCodeFromJSON(data: any): ServerStatus {
    const c = data.continue;
    const status =
      data.books[this._request.isbn][this._request.systemid].status;
    if (c === 1) {
      // return 1
      return ServerStatus.POLLING;
    } else if (c === 0) {
      if (status === "OK" || status === "Cache") {
        const libkey: any =
          data.books[this._request.isbn][this._request.systemid].libkey;
        if (!libkey || !Object.keys(libkey).length) {
          // return -2
          return ServerStatus.NOT_EXIST;
        } else {
          // return 0
          return ServerStatus.SUCCESS;
        }
      } else {
        // return -1
        return ServerStatus.SERVER_ERROR;
      }
    }
  }
  /**
   * getSession
   */
  private retrieveSessionFromJSON(data: any): string {
    return data.session;
  }

  /**
   * sleep
   */
  private sleep(ms: number): Promise<any> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const calil = new Calil();
