/* =========================================================================
   BC Embroidery Studio · inquiry form → Google Sheet
   -------------------------------------------------------------------------
   Receives submissions from the website's inquiry form, saves each one as
   a row in the "Inquiries" tab and (optionally) emails you an alert.

   Setup steps: see docs/form-setup.md
   ========================================================================= */

/* ---------- Settings ---------- */

// Where alerts go. Leave empty ('') to turn email alerts off.
const NOTIFY_EMAIL = '';

const SHEET_NAME = 'Inquiries';

// Column headings, in order. "Status" is for you to update as orders progress.
const HEADERS = ['Received', 'Status', 'Name', 'Email', 'Item', 'Lettering', 'Thread', 'Custom text', 'Message'];

// Form field names (the `name` attributes in index.html), matching the columns after Status.
const FIELDS = ['name', 'email', 'item', 'lettering', 'thread', 'custom_text', 'message'];

// Choices offered in the Status column's dropdown.
const STATUSES = ['New', 'Replied', 'Proof sent', 'Approved', 'In progress', 'Shipped', 'Closed'];

// Longest value accepted per field, to keep stray or abusive posts small.
const MAX_LENGTH = 2000;


/* ---------- One-time setup: run this once from the Apps Script editor ---------- */

function setup() {
  const sheet = getSheet_();

  sheet.getRange(1, 1, 1, HEADERS.length)
    .setValues([HEADERS])
    .setFontWeight('bold')
    .setBackground('#21140f')
    .setFontColor('#f1e7d3');
  sheet.setFrozenRows(1);

  // Status dropdown for every row below the header
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUSES, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 2, sheet.getMaxRows() - 1, 1).setDataValidation(statusRule);

  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(9, 360);
  sheet.getRange('I:I').setWrap(true);
}


/* ---------- Receives each form submission ---------- */

function doPost(e) {
  const data = (e && e.parameter) || {};

  // Spam trap: real visitors never see or fill the hidden "website" field.
  // Answer as if it worked so bots learn nothing.
  if (data.website) return json_({ result: 'success' });

  if (!data.name || !data.email) {
    return json_({ result: 'error', error: 'Name and email are required.' });
  }

  const values = FIELDS.map(field => clean_(data[field]));

  // Lock so two submissions arriving at once can't overwrite each other.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet_().appendRow([new Date(), 'New'].concat(values));
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) sendAlert_(data);

  return json_({ result: 'success' });
}

// Visiting the web app URL in a browser shows this, which is a quick way to
// confirm the deployment is live.
function doGet() {
  return json_({ result: 'ok', message: 'Inquiry endpoint is running.' });
}


/* ---------- Helpers ---------- */

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

// Trim, cap length, and stop values like "=HYPERLINK(...)" from running as formulas.
function clean_(value) {
  let text = String(value || '').trim().slice(0, MAX_LENGTH);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function sendAlert_(data) {
  const lines = FIELDS.map((field, i) => `${HEADERS[i + 2]}: ${String(data[field] || '—').slice(0, MAX_LENGTH)}`);
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: String(data.email).slice(0, 200),
    subject: `New inquiry from ${String(data.name).slice(0, 100)}`,
    body: lines.join('\n') + `\n\nAll inquiries: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`
  });
}

function json_(object) {
  return ContentService
    .createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
