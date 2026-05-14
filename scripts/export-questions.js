const fs = require("fs");
const path = require("path");
const { getQuestionBank, getAreaInfo } = require("../data/questions");

const outputDir = path.join(__dirname, "..", "src", "data");
fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(
  path.join(outputDir, "baseQuestions.json"),
  `${JSON.stringify(getQuestionBank(), null, 2)}\n`,
  "utf8"
);

fs.writeFileSync(
  path.join(outputDir, "areas.json"),
  `${JSON.stringify(getAreaInfo(), null, 2)}\n`,
  "utf8"
);

console.log("Banco exportado para la app web.");
