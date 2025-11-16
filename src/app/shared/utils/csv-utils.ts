export interface CsvParseOptions {
  delimiter?: string;
}

export function parseCsv(content: string, options?: CsvParseOptions): string[][] {
  const normalizedContent = normalizeLineEndings(content);
  const delimiter = options?.delimiter ?? detectDelimiter(normalizedContent);

  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < normalizedContent.length; index += 1) {
    const char = normalizedContent[index];

    if (char === '"') {
      const nextChar = normalizedContent[index + 1];
      if (insideQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if (char === '\n' && !insideQuotes) {
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows
    .map((originalRow) =>
      originalRow.map((cell) => String(cell ?? '').replace(/\uFEFF/g, '').trim()),
    )
    .filter((parsedRow) => parsedRow.some((cell) => cell.length > 0));
}

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function detectDelimiter(content: string): string {
  const defaultDelimiter = ',';
  const firstNonEmptyLine =
    content
      .split('\n')
      .find((line) => line.trim().length > 0 && !line.trimStart().startsWith('#')) ?? '';

  if (!firstNonEmptyLine) {
    return defaultDelimiter;
  }

  const delimiterCandidates = [',', ';', '\t'];
  let bestDelimiter = defaultDelimiter;
  let bestScore = -1;

  for (const candidate of delimiterCandidates) {
    const occurrences = firstNonEmptyLine.split(candidate).length - 1;
    if (occurrences > bestScore) {
      bestDelimiter = candidate;
      bestScore = occurrences;
    }
  }

  return bestDelimiter;
}

export async function readTabularFile(
  file: File,
): Promise<{ rows: string[][]; errors: string[] }> {
  const extension = getExtension(file.name);

  if (extension === 'csv') {
    const text = await file.text();
    return { rows: parseCsv(text), errors: [] };
  }

  if (extension === 'xlsx') {
    try {
      const buffer = await file.arrayBuffer();
      const xlsxModule = await import('xlsx');
      const workbook = xlsxModule.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        return {
          rows: [],
          errors: ['ไฟล์ไม่มีข้อมูลชีต กรุณาตรวจสอบไฟล์ Template (.xlsx) อีกครั้ง'],
        };
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const sheetRows = xlsxModule.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
        defval: '',
        raw: false,
      }) as Array<Array<string | number>>;

      const rows = sheetRows.map((sheetRow) =>
        sheetRow.map((cell) => String(cell ?? '').trim()),
      );

      return { rows, errors: [] };
    } catch (error) {
      console.error('Failed to parse xlsx file', error);
      return {
        rows: [],
        errors: ['ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบไฟล์ Template (.xlsx) อีกครั้ง'],
      };
    }
  }

  return {
    rows: [],
    errors: ['รูปแบบไฟล์ไม่รองรับ กรุณาใช้งานไฟล์ .csv หรือ .xlsx เท่านั้น'],
  };
}

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}
