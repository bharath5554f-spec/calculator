const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg'];

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseButton = document.getElementById('browseButton');
const previewPanel = document.getElementById('previewPanel');
const fileNameEl = document.getElementById('fileName');
const fileTypeEl = document.getElementById('fileType');
const fileSizeEl = document.getElementById('fileSize');
const extractedTableBody = document.getElementById('extractedTableBody');
const autoSumEl = document.getElementById('autoSum');
const autoAverageEl = document.getElementById('autoAverage');
const autoCountEl = document.getElementById('autoCount');
const dataSummary = document.getElementById('dataSummary');
const operationSelect = document.getElementById('operationSelect');
const manualValues = document.getElementById('manualValues');
const formulaText = document.getElementById('formulaText');
const resultText = document.getElementById('resultText');
const resultData = document.getElementById('resultData');
const resultFormula = document.getElementById('resultFormula');
const resultAnswer = document.getElementById('resultAnswer');
const calculateButton = document.getElementById('calculateButton');
const resetButton = document.getElementById('resetButton');
const clearExtraction = document.getElementById('clearExtraction');
const useExtracted = document.getElementById('useExtracted');
const downloadPdf = document.getElementById('downloadPdf');
const printButton = document.getElementById('printButton');
const themeToggle = document.getElementById('themeToggle');

let extractedValues = [];
let extractedLabels = [];
let activeText = '';
let selectedOperation = operationSelect.value;

const formatBytes = bytes => {
  const unit = bytes >= 1024 ? 'KB' : 'bytes';
  return bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} ${unit}`;
};

const updateFileInfo = file => {
  fileNameEl.textContent = file.name;
  fileTypeEl.textContent = file.type || 'Unknown';
  fileSizeEl.textContent = formatBytes(file.size);
};

const showPreview = file => {
  previewPanel.innerHTML = '';
  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    previewPanel.appendChild(img);
    return;
  }

  const previewBox = document.createElement('div');
  previewBox.className = 'preview-empty';
  previewBox.innerHTML = `<p>${file.name}</p><small>${file.type || 'Document preview available after upload.'}</small>`;
  previewPanel.appendChild(previewBox);
};

const normalizeText = raw => raw.replace(/\u00A0/g, ' ').replace(/[\u200B\u200C\u200D]/g, '').trim();

const extractLabeledNumbers = rawText => {
  const lines = normalizeText(rawText).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const entries = [];
  const numberRegex = /[-+]?\d*\.?\d+/g;

  lines.forEach(line => {
    const matches = [...line.matchAll(numberRegex)];
    if (!matches.length) return;
    const label = line.replace(numberRegex, '').trim().replace(/[:;\-–]+$/, '');
    matches.forEach(match => {
      entries.push({ label: label || `Value ${entries.length + 1}`, value: Number(match[0]) });
    });
  });

  if (!entries.length) {
    const simpleNumbers = [...normalizeText(rawText).matchAll(numberRegex)].map(item => Number(item[0]));
    return simpleNumbers.map((value, index) => ({ label: `Value ${index + 1}`, value }));
  }

  return entries;
};

const renderExtractedTable = values => {
  extractedTableBody.innerHTML = '';
  if (!values.length) {
    extractedTableBody.innerHTML = '<tr><td colspan="3" class="empty-row">No values extracted yet.</td></tr>';
    return;
  }

  values.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${index + 1}</td><td>${item.label}</td><td>${item.value}</td>`;
    extractedTableBody.appendChild(row);
  });
};

const updateSummaryCards = values => {
  if (!values.length) {
    autoSumEl.textContent = '-';
    autoAverageEl.textContent = '-';
    autoCountEl.textContent = '0';
    dataSummary.innerHTML = '<p class="muted-text">Upload a supported file to extract values automatically.</p>';
    return;
  }

  const sum = values.reduce((acc, { value }) => acc + value, 0);
  const average = sum / values.length;
  autoSumEl.textContent = sum.toLocaleString();
  autoAverageEl.textContent = average.toLocaleString(undefined, { maximumFractionDigits: 2 });
  autoCountEl.textContent = values.length;
  dataSummary.innerHTML = `<p class="muted-text">Detected ${values.length} numeric values across the uploaded file. Use the calculator panel to apply operations.</p>`;
};

const buildInputList = values => values.map(item => item.value);

const formatFormula = (operation, numbers, result) => {
  if (!numbers.length) return 'No formula yet';

  switch (operation) {
    case 'sum':
      return `${numbers.join(' + ')} = ${result}`;
    case 'average':
      return `(${numbers.join(' + ')}) / ${numbers.length} = ${result}`;
    case 'add':
      return `${numbers.join(' + ')} = ${result}`;
    case 'subtract':
      return `${numbers.join(' - ')} = ${result}`;
    case 'multiply':
      return `${numbers.join(' × ')} = ${result}`;
    case 'divide':
      return `${numbers.join(' ÷ ')} = ${result}`;
    case 'percentage':
      return numbers.length >= 2
        ? `(${numbers[0]} / ${numbers[1]}) × 100 = ${result}%`
        : `Cannot calculate percentage with fewer than 2 values`;
    default:
      return 'No formula yet';
  }
};

const calculateResult = (operation, values) => {
  const decimals = value => Number(Number(value).toFixed(4));
  if (!values.length) return { formula: 'No inputs provided.', result: '-' };

  const numbers = [...values];

  switch (operation) {
    case 'sum': {
      const result = decimals(numbers.reduce((acc, item) => acc + item, 0));
      return { result, formula: formatFormula('sum', numbers, result) };
    }
    case 'average': {
      const total = numbers.reduce((acc, item) => acc + item, 0);
      const result = decimals(total / numbers.length);
      return { result, formula: formatFormula('average', numbers, result) };
    }
    case 'add': {
      const result = decimals(numbers.reduce((acc, item) => acc + item, 0));
      return { result, formula: formatFormula('add', numbers, result) };
    }
    case 'subtract': {
      if (numbers.length === 1) return { result: decimals(numbers[0]), formula: `Single value: ${numbers[0]}` };
      const result = decimals(numbers.slice(1).reduce((acc, item) => acc - item, numbers[0]));
      return { result, formula: formatFormula('subtract', numbers, result) };
    }
    case 'multiply': {
      const result = decimals(numbers.reduce((acc, item) => acc * item, 1));
      return { result, formula: formatFormula('multiply', numbers, result) };
    }
    case 'divide': {
      if (numbers.length === 1) return { result: decimals(numbers[0]), formula: `Single value: ${numbers[0]}` };
      const result = decimals(numbers.slice(1).reduce((acc, item) => (item === 0 ? NaN : acc / item), numbers[0]));
      return { result: Number.isNaN(result) ? 'Error' : result, formula: formatFormula('divide', numbers, result) };
    }
    case 'percentage': {
      if (numbers.length < 2) return { result: '-', formula: 'Need at least two values for percentage.' };
      const result = decimals((numbers[0] / numbers[1]) * 100);
      return { result, formula: formatFormula('percentage', numbers, result) };
    }
    default:
      return { result: '-', formula: 'Unsupported operation.' };
  }
};

const updateResultsPanel = (operation, inputValues) => {
  const numbers = inputValues;
  const { result, formula } = calculateResult(operation, numbers);
  formulaText.textContent = formula;
  resultText.textContent = result;
  resultData.textContent = extractedValues.length ? extractedValues.map((item, index) => `${index + 1}. ${item.label} = ${item.value}`).join('\n') : 'No extracted data available.';
  resultFormula.textContent = formula;
  resultAnswer.textContent = result;
};

const normalizeOperation = value => value || 'sum';

const updateCalculationState = () => {
  selectedOperation = normalizeOperation(operationSelect.value);
  const manualList = manualValues.value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite);

  const numbers = manualList.length ? manualList : extractedValues.map(item => item.value);
  updateResultsPanel(selectedOperation, numbers);
};

const parseTextFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Unable to read text file.'));
  reader.readAsText(file);
});

const parsePdfFile = async file => {
  const arrayBuffer = await file.arrayBuffer();
  if (!window.pdfjsLib) throw new Error('PDF.js is unavailable.');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let extracted = '';

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    extracted += content.items.map(item => item.str).join(' ') + '\n';
  }

  return extracted;
};

const parseDocxFile = async file => {
  const arrayBuffer = await file.arrayBuffer();
  if (!window.mammoth) throw new Error('Mammoth is unavailable.');
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const parseXlsxFile = async file => {
  const arrayBuffer = await file.arrayBuffer();
  if (!window.XLSX) throw new Error('SheetJS is unavailable.');
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const extracted = workbook.SheetNames.map(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_csv(worksheet);
  }).join('\n');
  return extracted;
};

const parseImageFile = async file => {
  if (!window.Tesseract) throw new Error('Tesseract.js is unavailable.');
  const { data } = await Tesseract.recognize(file, 'eng', { logger: m => console.debug('OCR', m) });
  return data.text;
};

const handleExtraction = async file => {
  activeText = '';
  extractedValues = [];
  extractedLabels = [];

  try {
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      activeText = await parseTextFile(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      activeText = await parsePdfFile(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      activeText = await parseDocxFile(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx')) {
      activeText = await parseXlsxFile(file);
    } else if (file.type.startsWith('image/') || /\.(png|jpe?g)$/i.test(file.name)) {
      activeText = await parseImageFile(file);
    } else {
      throw new Error('Unsupported file type.');
    }

    const extracted = extractLabeledNumbers(activeText);
    extractedValues = extracted;
    updateSummaryCards(extracted);
    renderExtractedTable(extracted);
    updateCalculationState();
  } catch (error) {
    console.warn(error);
    extractedValues = [];
    renderExtractedTable([]);
    updateSummaryCards([]);
    resultAnswer.textContent = 'Extraction failed.';
    resultFormula.textContent = error.message;
  }
};

const resetApp = () => {
  fileInput.value = '';
  previewPanel.innerHTML = '<div class="preview-empty"><p>No file selected yet.</p></div>';
  fileNameEl.textContent = '-';
  fileTypeEl.textContent = '-';
  fileSizeEl.textContent = '-';
  extractedValues = [];
  extractedLabels = [];
  activeText = '';
  renderExtractedTable([]);
  updateSummaryCards([]);
  manualValues.value = '';
  operationSelect.value = 'sum';
  formulaText.textContent = 'No formula yet';
  resultText.textContent = '-';
  resultData.textContent = 'No extracted data yet.';
  resultFormula.textContent = 'No formula';
  resultAnswer.textContent = '-';
};

const resetDarkMode = () => {
  const stored = localStorage.getItem('smartCalcTheme');
  if (stored === 'dark') document.body.classList.add('dark');
};

const toggleTheme = () => {
  document.body.classList.toggle('dark');
  const mode = document.body.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('smartCalcTheme', mode);
};

browseButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  if (!allowedTypes.some(type => file.type === type) && !/\.(pdf|docx|txt|xlsx|png|jpe?g)$/i.test(file.name)) {
    alert('Please select a supported file type.');
    return;
  }
  updateFileInfo(file);
  showPreview(file);
  handleExtraction(file);
});

dropZone.addEventListener('dragover', event => {
  event.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

dropZone.addEventListener('drop', event => {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (!file) return;
  if (!allowedTypes.some(type => file.type === type) && !/\.(pdf|docx|txt|xlsx|png|jpe?g)$/i.test(file.name)) {
    alert('Please drop a supported file type.');
    return;
  }
  fileInput.files = event.dataTransfer.files;
  updateFileInfo(file);
  showPreview(file);
  handleExtraction(file);
});

operationSelect.addEventListener('change', updateCalculationState);
manualValues.addEventListener('input', updateCalculationState);
calculateButton.addEventListener('click', updateCalculationState);
resetButton.addEventListener('click', resetApp);
clearExtraction.addEventListener('click', () => {
  extractedValues = [];
  renderExtractedTable([]);
  updateSummaryCards([]);
  updateCalculationState();
});
useExtracted.addEventListener('click', () => {
  if (!extractedValues.length) return;
  manualValues.value = extractedValues.map(item => item.value).join(', ');
  updateCalculationState();
});
downloadPdf.addEventListener('click', () => {
  const element = document.getElementById('resultCard');
  html2pdf().from(element).set({ margin: 10, filename: 'smart-calculation-results.pdf' }).save();
});
printButton.addEventListener('click', () => window.print());
themeToggle.addEventListener('click', toggleTheme);

window.addEventListener('DOMContentLoaded', () => {
  resetDarkMode();
  resetApp();
});