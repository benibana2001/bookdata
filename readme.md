# benibana_bookdata

下記の外部 API を使用して。書籍情報を取得します。

- [Calil](https://calil.jp/doc/api_ref.html): ISBN をもとに図書館の蔵書情報を検索
  TODO:APP_key のリンク
  - 蔵書検索を行うには Calil が提供する[APP_KEY を取得](https://calil.jp/api/dashboard/)してください
- [OpenBD](https://openbd.jp/): ISBN をもとに本のタイトル・書影を取得

## Usage

```bash
npm i benibana_bookdata
```

```javascript
try {
  const res = await beniBook.searchLibraryCollections({
    <<YOUR APP KEY>>,
    '9784837987499', // ISBN
    'Tokyo_Setagaya', // Prefecture
  });
} catch(error) {...}
```

## Methods

### searchLibraryCollections({string, number, string, (number)})

指定の書籍の蔵書情報を取得します。ISBN と検索をしたい都市名を記入します。

```javascript
await beniBook.searchLibraryCollections({
    <<YOUR APP KEY>>,
    '9784837987499', // ISBN
    'Tokyo_Setagaya', // Prefecture
});
/**
 * => [
 *  { libraryID: 1, libraryName: '中央', borrowingStatus: '貸出中' }
 *  { libraryID: 2, libraryName: '世田谷', borrowingStatus: '貸出中' }
 *  { libraryID: 3, libraryName: '砧', borrowingStatus: '貸出中' }
 *  { libraryID: 4, libraryName: '代田', borrowingStatus: '貸出可' }
 *  { libraryID: 5, libraryName: '上北沢', borrowingStatus: '貸出中' }
 * ]
 *
```

### options
第四引数にはAPIにGET通信を行う際のポーリングの間隔(ms)を指定します。CalilAPIへはポーリング通信を行うため、一回の通信で情報が取得できない場合は、ここで指定した間隔をおいて連続で通信処理を試みます。これはCalil APIの指定した処理です。


### 書影の取得

OpenBD API を使用し指定の書籍の書影を取得します。

```javascript
beniBook.searchBookCoverURL();
```

ISBN をもとに書籍の書影を取得します。
