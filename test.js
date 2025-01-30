import { createReadStream } from "fs";
import { SaxesParser } from "saxes";

console.log("Hello, Node.js!");

const parser = new SaxesParser();
let currentTag = null;

// 当遇到开始标签时
parser.on("opentag", (node) => {
    currentTag = node.name;
    if (currentTag === "book") {
        console.log("Book ID:", node.attributes.id);
    }
});

// 当遇到文本时
parser.on("text", (text) => {
    if (currentTag === "c:name") {
        console.log("c:name！", text);
    } else if (currentTag === "author") {
        console.log("Book Author:", text);
    }
});

// 当遇到结束标签时
parser.on("closetag", (tagName) => {
    currentTag = null;
});

// 当解析完成时
parser.on("end", () => {
    console.log("XML parsing completed");
});

// 读取xml文件，转换为字符串
const stream = createReadStream("chart0.xml");

let data = '';
// let data = "";
// 当有数据流入时触发
stream.on("data", (chunk) => {
    data += chunk.toString("utf8"); // 将 Buffer 转换为字符串
});

// 当流结束时触发，才执行saxes的解析
stream.on("end", () => {
    console.log("File content:", data);
    // Write bytes onto the stream
    // 将字符串转换为 Buffer，并写入到流中
    parser.write(data).close();
});

// 如果发生错误
stream.on("error", (err) => {
    console.error("Error reading file:", err);
});

// stream.close();
