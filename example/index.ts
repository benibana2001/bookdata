import { openbd } from "../src/OpenBD.js";
import { calil } from "../src/Calil.js";

const isbn = "9784334779436";

// OpenBD
// console.log(await openbd.search(isbn));

// Calil
const CALIL_KEY = "46a2412f4ceb07b72a251150f2533c74";
const systemid = "Tokyo_Setagaya";
const pollingDuration = 500;

console.log(
  await calil.search({
    appkey: CALIL_KEY,
    isbn,
    systemid,
    pollingDuration,
  })
);
