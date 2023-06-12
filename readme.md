# bookdata

外部のAPIを使用して。書籍の情報を取得します。

## Usage

```bash
npm i benibana_bookdata
```


## Methods

### 図書館の蔵書検索
```javascript
beniBook.searchLibraryStock()
```

ISBNをもとに図書館の在庫を確認します。

### 書影の取得

```javascript
beniBook.searchBookCoverURL()
```

ISBNをもとに書籍の書影を取得します。