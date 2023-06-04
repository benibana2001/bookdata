export interface LibRequest {
  appkey: string
  isbn: string
  systemid: string
}

export interface LibResponse {
  libkey: LibData[]
  reserveurl: string
}

export interface LibData {
  libraryID: number
  libraryName: string
  bookStatus: string
}

enum ServerStatus {
  SUCCESS = 0,
  POLLING = 1,
  SERVER_ERROR = -1,
  NOT_EXIST = -2,
}

export class Calil {
  //----------------------------------------
  public api_timeout_timer = 0
  public api_call_count = 0
  public data_cache = ''
  //
  private readonly HOST: string = 'https://api.calil.jp/check'
  //
  private _request: LibRequest
  get request() {
    return this._request
  }
  set request(request: LibRequest) {
    this._request = request
  }
  //
  private _serverStatus = 0
  set serverStatus(status: number) {
    this._serverStatus = status
  }
  get serverStatus() {
    return this._serverStatus
  }
  //
  private _session = ''
  set session(session: string) {
    this._session = session
  }
  get session() {
    return this._session
  }
  //
  private _response: LibResponse | null = null
  set response(data: LibResponse) {
    this._response = data
  }
  get response() {
    return this._response
  }
  //----------------------------------------
  constructor(req: LibRequest) {
    // Set Arguments.
    this._request = req
    // Check Arguments.
    this.init()
  }
  //----------------------------------------
  /**
   * init
   */
  private init(): void {
    this.checkOptions()
    // THIS IS DEBUG FUNCTION TO BE ERASED!!
    // this.setTestOptions()
  }
  /**
   * setTestOptions
   */
  private setTestOptions(): void {
    this._request = {
      appkey: process.env.APP_API_KEY,
      isbn: '4834000826',
      systemid: 'Tokyo_Setagaya',
    }
  }
  /**
   * checkOptions
   * Validate Options each value.
   */
  private checkOptions(): void {
    // Set AppKey
    if (!this._request.appkey) {
      alert('Please enter appkey')
    }
    // Set ISBN to property.
    /**
     * ISBN would be passed as string everytime.
     */
    // Set SystemID to property.
    /**
     * User wouldn't enter SystemID by theirself, and SystemID would be assumed inputted by App, so omit validataion.
     */
  }
  /**
   * search
   *
   * Call api using XMLHttpRequest or fetch with JSONP.
   * If using fetch API, using third party library for JSONP is required
   * because not supported in standard fetch API.
   *
   */
  public async search(req: LibRequest = this._request): Promise<LibResponse> {
    // Create url
    // https://api.calil.jp/check?appkey={}&isbn=4334926940&systemid=Tokyo_Setagaya&format=json
    // https://api.calil.jp/check?appkey={}&isbn=4834000826&systemid=Aomori_Pref&format=json
    this._request = req
    const url: string =
      this.HOST +
      '?appkey=' +
      this._request.appkey +
      '&isbn=' +
      this._request.isbn +
      '&systemid=' +
      this._request.systemid +
      '&format=json'

    // Request
    const json: any = await this.callApi(url)
    // Check server status
    /**
     * Calis server return status as a number.
     * We should judge server process would be done or not by checking this status.
     * If not finished, we should proceed polling process.
     */
    await this.checkServerStatus(json)
    // Check value 'continue' and decide next process.
    // this.confirm()
    // Parse Data
    return this._response
  }
  /**
   * checkServerStatus
   */
  private async checkServerStatus(json: any): Promise<any> {
    // Set server status
    this.serverStatus = this.getServerStatus(json)
    // Set session
    this.session = this.getSession(json)
    //
    // if (this.server_status === 1) {
    if (this.serverStatus === ServerStatus.POLLING) {
      // Polling
      await this.sleep(2000)
      await this.poll()
    } else if (this.serverStatus === ServerStatus.SUCCESS) {
      // Done
      // Parse
      const res: LibResponse = this.parse(json)
      // Set data
      this.response = res
      return
    } else {
      if (this.serverStatus === ServerStatus.NOT_EXIST) {
        console.error('Error - book is not exist')
      } else if (this.serverStatus === ServerStatus.SERVER_ERROR) {
        console.error(`Error - server.status: ${this.serverStatus}`)
      }
      return
    }
  }
  /**
   * poll
   */
  public async poll(): Promise<any> {
    const url: string =
      this.HOST +
      '?appkey=' +
      this._request.appkey +
      '&session=' +
      this._session +
      '&format=json'
    // request polling
    const json: any = await this.callApi(url)
    // Check server status
    await this.checkServerStatus(json)
  }

  /**
   * parse
   *
   * Parse JSON data to use React JSX easily.
   * When display some data in JSX, you are recommended to use Array.map() function,
   * and raw JSON data is difficult to display. So that this function parse JSON data to array.
   */
  public parse(json: any): LibResponse {
    const libkey: any =
      json.books[this._request.isbn][this._request.systemid].libkey
    const reserveurl: string =
      json.books[this._request.isbn][this._request.systemid].reserveurl
    const res: LibResponse = { libkey: [], reserveurl: reserveurl }
    let i = 1
    for (const key in libkey) {
      const d: LibData = { libraryID: i, libraryName: key, bookStatus: libkey[key] }
      res.libkey.push(d)
      i++
    }
    return res
  }
  /**
   * callApi
   */
  public async callApi(url: string): Promise<any> {
    let s : object

    await fetch(url)
      .then((res) => res.text())
      .then(resText => {
        const match = resText.match(/callback\((.*)\);/)
        if(!match) throw new Error('invalid JSONP response')
        s = JSON.parse(match[1])
      }).catch(error => {
        console.error(error)
      }) 

    return s
  }

  /**
   * getServerStatus
   *
   * 0: success
   * 1: polling
   * -1: server error
   * -2: boo isn't exist
   */
  private getServerStatus(data: any): ServerStatus {
    const c = data.continue
    const status = data.books[this._request.isbn][this._request.systemid].status
    if (c === 1) {
      // return 1
      return ServerStatus.POLLING
    } else if (c === 0) {
      if (status === 'OK' || status === 'Cache') {
        const libkey: any =
          data.books[this._request.isbn][this._request.systemid].libkey
        if (!libkey || !Object.keys(libkey).length) {
          // return -2
          return ServerStatus.NOT_EXIST
        } else {
          // return 0
          return ServerStatus.SUCCESS
        }
      } else {
        // return -1
        return ServerStatus.SERVER_ERROR
      }
    }
  }
  /**
   * getSession
   */
  private getSession(data: any): string {
    return data.session
  }

  /**
   * sleep
   */
  private sleep(ms: number): Promise<any> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
