import { beniBook } from '../src/main';

const isbn = '9784837987499';
// const isbn = '9784837987490'; // TODO: openBDに情報がない場合の対応を行う
// const isbn = '9784837987401'; // TODO: notExist test

/**
 * 書影の取得テスト
 */
console.log(await beniBook.searchBookCoverURL(isbn));

/**
 * タイトルの取得テスト
 */
console.log(await beniBook.searchBookTitle(isbn));

/**
 * 図書館の蔵書検索テスト
 */
const CALIL_KEY = '46a2412f4ceb07b72a251150f2533c74';
const systemid = 'Tokyo_Setagaya';
const pollingDuration = 500;

try {
  const res = await beniBook.searchLibraryStock({
    appkey: CALIL_KEY,
    isbn,
    systemid,
    pollingDuration
  });

  if (Object.keys(res.libraryStock).length < 1) {
    console.log('蔵書なし');
  } else {
    res.libraryStock.forEach(({ libraryID, libraryName, borrowingStatus }) => {
      console.log(
        `- ${libraryID}.${libraryName}: 貸出状況：${borrowingStatus}`
      );
    });
  }
} catch (e) {
  console.log(e);
}
