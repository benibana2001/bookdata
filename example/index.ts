import {openbd} from "../src/OpenBD"

console.log(await openbd.search('9784865063677'))

const result = await openbd.search("9999")