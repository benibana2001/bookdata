# bookdata

外部の API を使用して。書籍の情報を取得します。

## Usage

```bash
npm i benibana_bookdata
```

```javascript
try {
  const res = await beniBook.searchLibraryStock({
    appkey: <<YOUR APP KEY>>,
    '9784837987499', // ISBN
    'Tokyo_Setagaya', // Prefecture
    500 // duration
  });
} catch(error) console.error(error);
```

## Methods

### 図書館の蔵書検索

CalilAPIを使用し指定の書籍の蔵書情報を取得します。

```javascript
beniBook.searchLibraryStock();
```

ISBN をもとに図書館の在庫を確認します。

### 書影の取得

OpenBD APIを使用し指定の書籍の書影を取得します。

```javascript
beniBook.searchBookCoverURL();
```

ISBN をもとに書籍の書影を取得します。
