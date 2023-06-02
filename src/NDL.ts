// This File Is Client To Use National Diet Libray API
// 国立国会図書館サーチについて: https://iss.ndl.go.jp/information/outline/
// 国立国会図書館サーチ - 外部提供インタフェース仕様書: https://iss.ndl.go.jp/information/wp-content/uploads/2018/09/ndlsearch_api_20180925_jp.pdf

// INPUT: URL
// OUTPUT: XML
// METHOD: GET
// HOST:
//  - SRU: https://iss.ndl.go.jp/api/sru
//    - example: https://iss.ndl.go.jp/api/sru?operation=searchRetrieve&maximumRecords=10&query=title%3d%22%e6%a1%9c%22%20AND%20from=%222018%22
//  - 書影: http://iss.ndl.go.jp/thumbnail

export { NDL }

class NDL {
  constructor() {
    console.log('Hello NDL!')
  }
  //----------------------------------------
  /**
   * search
   */
  public async search(): Promise<any> {
    let url: string = this.createURL()
    // Set Dummy
    url =
      'https://iss.ndl.go.jp/api/sru?operation=searchRetrieve&maximumRecords=10&query=title%3d%22%e6%a1%9c%22%20AND%20from=%222018%22'
    //
    const xml: any = await this.callApi(url)
    console.log(xml)
  }
  /**
   * callApi
   */
  private async callApi(url: string): Promise<any> {
    // Return type is XML.
    const header: {} = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/xml',
      },
    }
    const xml: any = await fetch(url, header)
    return xml
  }
  /**
   * createURL
   */
  private createURL(): string {
    return 'xxx'
  }
}
