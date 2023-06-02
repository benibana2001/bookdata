// import {openbd} from "../dist/OpenBD"
// import {NDL} from "../src/NDL"
import {Calil} from "../src/Calil.js"
const isbn = '9784877713379'
// console.log(await openbd.search(isbn))

// console.log(NDL)
// console.log(await new NDL().search())
const CALIL_KEY ="46a2412f4ceb07b72a251150f2533c74"
const systemid = 'Tokyo_Setagaya';

console.log(await new Calil({
  appkey: CALIL_KEY,
  isbn,
  systemid 
}).search())
