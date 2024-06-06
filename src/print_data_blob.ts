import { parseNewData } from "./utils";
import data from "../lib/data";

const { list } = parseNewData(data);
console.log(list());
