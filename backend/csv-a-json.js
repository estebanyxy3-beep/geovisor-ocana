import fs from "fs";

const csvPath = "./Contruccion_Expuesta_avenida_torrencial.csv";
const outputPath = "./construccion_expuesta_avenida_torrencial.json";

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function cleanValue(value) {
  const v = value.trim();

  if (v === "") return null;
  if (v.toLowerCase() === "null") return null;

  if (!isNaN(v) && v !== "") {
    return Number(v);
  }

  return v;
}

function csvToJson(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error("El CSV no tiene suficientes filas.");
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = cleanValue(values[index] ?? "");
    });

    return obj;
  });
}

try {
  const csvText = fs.readFileSync(csvPath, "utf8");
  const data = csvToJson(csvText);

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");

  console.log(`JSON creado correctamente en: ${outputPath}`);
  console.log(`Registros convertidos: ${data.length}`);
} catch (error) {
  console.error("Error convirtiendo CSV a JSON:", error.message);
}
