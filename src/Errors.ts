export class CalilServerStatusError extends Error {
  public constructor(status: number, options?: { detailMessage: string }) {
    super(
      `\n***\n
        Server Response.status is ${status}\nfailed to fetch Calil response.
      \n***`
    );
    if (options) this.options = options;
  }
  public options: {
    detailMessage: string;
  };
}
