/**
 * Birthday Manager - Google Apps Script Backend
 * 
 * Automates contact synchronization from Google Contacts into a Google Spreadsheet
 * and sends daily morning birthday digests via email.
 */

const SHEET_NAME = 'Birthdays';
const HEADERS = ['id', 'first_name', 'last_name', 'birth_date', 'email', 'gift', 'gift_done', 'note'];
const MILESTONE_AGES = [10, 18, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
const TIMEZONE = 'Europe/Rome';

/**
 * One-time setup function to remove existing triggers and create scheduled triggers:
 * 1. syncContactsNightly every day at 03:00 (Europe/Rome)
 * 2. sendMorningDigest every day at 07:00 (Europe/Rome)
 */
function setupTriggers() {
  const existingTriggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < existingTriggers.length; i++) {
    ScriptApp.deleteTrigger(existingTriggers[i]);
  }

  ScriptApp.newTrigger('syncContactsNightly')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .inTimezone(TIMEZONE)
    .create();

  ScriptApp.newTrigger('sendMorningDigest')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .inTimezone(TIMEZONE)
    .create();

  Logger.log('Triggers successfully configured for 03:00 and 07:00 (Europe/Rome).');
}

/**
 * Helper to get or create the Birthdays sheet with headers and formatting.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Pads a number with leading zeros.
 * @param {number} num 
 * @param {number} size 
 * @returns {string}
 */
function padZero(num, size = 2) {
  let s = String(num);
  while (s.length < size) {
    s = '0' + s;
  }
  return s;
}

/**
 * Checks whether a given year is a leap year.
 * @param {number} year 
 * @returns {boolean}
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Fetches all Google Contacts with birthdays and performs an upsert into the Birthdays sheet.
 * Preserves gift, gift_done, and note for existing contacts.
 * Automatically resets gift_done to false if the contact's birthday was yesterday.
 */
function syncContactsNightly() {
  const sheet = getOrCreateSheet();
  const contactsWithBirthdays = [];
  let pageToken = null;

  // 1. Fetch contacts from Google People API with pagination
  do {
    const response = People.People.Connections.list('people/me', {
      personFields: 'names,birthdays,emailAddresses',
      pageSize: 1000,
      pageToken: pageToken
    });

    const connections = response.connections || [];
    for (let i = 0; i < connections.length; i++) {
      const person = connections[i];
      const birthdays = person.birthdays || [];
      
      let parsedDate = null;
      for (let b = 0; b < birthdays.length; b++) {
        const bdayDate = birthdays[b].date;
        if (bdayDate && bdayDate.month && bdayDate.day) {
          const monthStr = padZero(bdayDate.month);
          const dayStr = padZero(bdayDate.day);
          if (bdayDate.year) {
            parsedDate = `${bdayDate.year}-${monthStr}-${dayStr}`;
          } else {
            parsedDate = `--${monthStr}-${dayStr}`;
          }
          break; // Use the first valid birthday found
        }
      }

      if (parsedDate) {
        let firstName = '';
        let lastName = '';
        if (person.names && person.names.length > 0) {
          firstName = person.names[0].givenName || person.names[0].displayName || '';
          lastName = person.names[0].familyName || '';
        }

        let email = '';
        if (person.emailAddresses && person.emailAddresses.length > 0) {
          email = person.emailAddresses[0].value || '';
        }

        contactsWithBirthdays.push({
          id: person.resourceName,
          first_name: firstName,
          last_name: lastName,
          birth_date: parsedDate,
          email: email
        });
      }
    }

    pageToken = response.nextPageToken;
  } while (pageToken);

  Logger.log(`Found ${contactsWithBirthdays.length} contacts with birthdays.`);

  // 2. Read existing spreadsheet data
  const lastRow = sheet.getLastRow();
  const existingMap = new Map();
  let existingData = [];

  if (lastRow > 1) {
    existingData = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    for (let i = 0; i < existingData.length; i++) {
      const row = existingData[i];
      const id = String(row[0]);
      if (id) {
        existingMap.set(id, {
          rowIndex: i + 2, // 1-based index in sheet
          first_name: row[1],
          last_name: row[2],
          birth_date: String(row[3]),
          email: row[4],
          gift: Boolean(row[5]),
          gift_done: Boolean(row[6]),
          note: row[7] || ''
        });
      }
    }
  }

  // 3. Compute yesterday's MM-DD in Rome time for annual gift_done reset
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayMMDD = Utilities.formatDate(yesterday, TIMEZONE, 'MM-dd');

  // 4. Upsert logic
  const checkboxValidation = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  const rowsToUpdate = [];
  const rowsToAppend = [];

  for (let c = 0; c < contactsWithBirthdays.length; c++) {
    const contact = contactsWithBirthdays[c];
    const contactBirthdayMMDD = contact.birth_date.slice(-5); // "MM-DD"

    if (existingMap.has(contact.id)) {
      const existing = existingMap.get(contact.id);
      let updatedGiftDone = existing.gift_done;

      // Annual automatic reset: if birthday was yesterday and gift was marked done, reset to false
      if (contactBirthdayMMDD === yesterdayMMDD && updatedGiftDone === true) {
        updatedGiftDone = false;
        Logger.log(`Resetting gift_done for contact: ${contact.first_name} ${contact.last_name}`);
      }

      // Check if anything changed before scheduling an update
      const dateFormatted = "'" + contact.birth_date;
      rowsToUpdate.push({
        rowIndex: existing.rowIndex,
        values: [
          contact.id,
          contact.first_name,
          contact.last_name,
          dateFormatted,
          contact.email,
          existing.gift,
          updatedGiftDone,
          existing.note
        ]
      });
    } else {
      // New contact: append to bottom
      rowsToAppend.push([
        contact.id,
        contact.first_name,
        contact.last_name,
        "'" + contact.birth_date,
        contact.email,
        false,
        false,
        ''
      ]);
    }
  }

  // 5. Apply updates
  for (let u = 0; u < rowsToUpdate.length; u++) {
    const update = rowsToUpdate[u];
    sheet.getRange(update.rowIndex, 1, 1, HEADERS.length).setValues([update.values]);
  }

  // 6. Apply appends
  if (rowsToAppend.length > 0) {
    const startAppendRow = sheet.getLastRow() + 1;
    sheet.getRange(startAppendRow, 1, rowsToAppend.length, HEADERS.length).setValues(rowsToAppend);
    
    // Format columns F (gift) and G (gift_done) as checkboxes
    sheet.getRange(startAppendRow, 6, rowsToAppend.length, 2).setDataValidation(checkboxValidation);
  }

  Logger.log(`Sync completed. Updated ${rowsToUpdate.length} rows, appended ${rowsToAppend.length} new rows.`);
}

/**
 * Calculates days remaining until the next birthday and turning age.
 * @param {string} birthDateStr Formatted as 'YYYY-MM-DD' or '--MM-DD'
 * @param {Date} todayDate Current date object in Rome timezone
 * @returns {{ daysUntil: number, turningAge: number | null, nextDate: Date, hasYear: boolean }}
 */
function calculateNextBirthday(birthDateStr, todayDate) {
  let cleanStr = String(birthDateStr).trim();
  if (cleanStr.startsWith("'")) {
    cleanStr = cleanStr.substring(1);
  }

  const hasYear = !cleanStr.startsWith('--');
  let birthYear = null;
  let birthMonth = 0;
  let birthDay = 0;

  if (hasYear) {
    const parts = cleanStr.split('-');
    birthYear = parseInt(parts[0], 10);
    birthMonth = parseInt(parts[1], 10);
    birthDay = parseInt(parts[2], 10);
  } else {
    const parts = cleanStr.replace('--', '').split('-');
    birthMonth = parseInt(parts[0], 10);
    birthDay = parseInt(parts[1], 10);
  }

  const currentYear = todayDate.getFullYear();
  const todayZero = new Date(currentYear, todayDate.getMonth(), todayDate.getDate());

  // Determine target day for this year handling Feb 29 on non-leap years (celebrate on Feb 28)
  function getCandidateDate(targetYear) {
    let day = birthDay;
    if (birthMonth === 2 && birthDay === 29 && !isLeapYear(targetYear)) {
      day = 28;
    }
    return new Date(targetYear, birthMonth - 1, day);
  }

  let nextBday = getCandidateDate(currentYear);
  if (nextBday < todayZero) {
    nextBday = getCandidateDate(currentYear + 1);
  }

  const diffTime = nextBday.getTime() - todayZero.getTime();
  const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const turningAge = hasYear && birthYear ? (nextBday.getFullYear() - birthYear) : null;

  return {
    daysUntil,
    turningAge,
    nextDate: nextBday,
    hasYear
  };
}

/**
 * Reads all rows from the Birthdays sheet and sends an email digest to the active user
 * if there are birthdays today, upcoming birthdays within 10 days, or gifts to buy within 14 days.
 */
function sendMorningDigest() {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('No birthday data found in the spreadsheet.');
    return;
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  
  // Current date in Rome timezone
  const now = new Date();
  const romeDateStr = Utilities.formatDate(now, TIMEZONE, 'yyyy-MM-dd');
  const [nowY, nowM, nowD] = romeDateStr.split('-').map(Number);
  const todayRome = new Date(nowY, nowM - 1, nowD);

  const birthdaysToday = [];
  const birthdaysNext10Days = [];
  const giftsToBuyNext14Days = [];
  const missingYearWarnings = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const contact = {
      id: row[0],
      first_name: row[1],
      last_name: row[2],
      birth_date: String(row[3]),
      email: row[4],
      gift: Boolean(row[5]),
      gift_done: Boolean(row[6]),
      note: row[7] || ''
    };

    if (!contact.birth_date) continue;

    const calc = calculateNextBirthday(contact.birth_date, todayRome);
    const fullName = `${contact.first_name} ${contact.last_name}`.trim() || 'Unknown Name';
    const isMilestone = calc.turningAge !== null && MILESTONE_AGES.includes(calc.turningAge);

    const item = {
      ...contact,
      fullName,
      daysUntil: calc.daysUntil,
      turningAge: calc.turningAge,
      isMilestone,
      hasYear: calc.hasYear,
      formattedDate: Utilities.formatDate(calc.nextDate, TIMEZONE, 'EEEE, MMMM d')
    };

    // 1. Birthdays today (daysUntil === 0)
    if (calc.daysUntil === 0) {
      birthdaysToday.push(item);
    }

    // 2. Birthdays in the next 10 days (1 <= daysUntil <= 10)
    if (calc.daysUntil >= 1 && calc.daysUntil <= 10) {
      birthdaysNext10Days.push(item);
    }

    // 3. Gifts to buy within 14 days (gift === true, gift_done === false, 0 <= daysUntil <= 14)
    if (contact.gift && !contact.gift_done && calc.daysUntil >= 0 && calc.daysUntil <= 14) {
      giftsToBuyNext14Days.push(item);
    }

    // 4. Missing birth year warnings within 14 days
    if (!calc.hasYear && calc.daysUntil >= 0 && calc.daysUntil <= 14) {
      missingYearWarnings.push(item);
    }
  }

  // Send email only if at least one of the first 3 lists is not empty
  if (birthdaysToday.length === 0 && birthdaysNext10Days.length === 0 && giftsToBuyNext14Days.length === 0) {
    Logger.log('No relevant birthdays or pending gifts today. Skipping morning digest email.');
    return;
  }

  // Sort lists by daysUntil ascending
  birthdaysNext10Days.sort((a, b) => a.daysUntil - b.daysUntil);
  giftsToBuyNext14Days.sort((a, b) => a.daysUntil - b.daysUntil);
  missingYearWarnings.sort((a, b) => a.daysUntil - b.daysUntil);

  const recipientEmail = Session.getActiveUser().getEmail();
  const subjectDate = Utilities.formatDate(todayRome, TIMEZONE, 'MMMM d, yyyy');
  const subject = `🎂 Birthday Digest - ${subjectDate}`;

  // Build clean HTML email
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .section { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
    .section:last-child { border-bottom: none; }
    .section-title { font-size: 16px; font-weight: 700; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; }
    .card-urgent { background: #fef2f2; border-color: #fecaca; }
    .card-today { background: #eff6ff; border-color: #bfdbfe; }
    .card-name { font-weight: 600; font-size: 15px; color: #0f172a; }
    .card-meta { font-size: 13px; color: #64748b; margin-top: 4px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-left: 6px; }
    .badge-milestone { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-warning { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
    .note-box { font-size: 12px; color: #475569; background: #ffffff; border-radius: 6px; padding: 6px 10px; margin-top: 8px; border: 1px dashed #cbd5e1; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎂 Birthday Manager</h1>
      <p>Your Daily Birthday & Gift Digest for ${subjectDate}</p>
    </div>
  `;

  // Section 1: Today
  if (birthdaysToday.length > 0) {
    html += `
    <div class="section">
      <div class="section-title" style="color: #2563eb;">🎉 Birthdays Today!</div>
    `;
    for (const b of birthdaysToday) {
      const milestoneBadge = b.isMilestone ? `<span class="badge badge-milestone">🌟 Milestone: Turning ${b.turningAge}!</span>` : '';
      const ageText = b.turningAge ? `Turning ${b.turningAge} years old` : 'Age unknown';
      html += `
        <div class="card card-today">
          <div class="card-name">${escapeHtml(b.fullName)} ${milestoneBadge}</div>
          <div class="card-meta">${ageText} ${b.email ? `• <a href="mailto:${escapeHtml(b.email)}">${escapeHtml(b.email)}</a>` : ''}</div>
          ${b.note ? `<div class="note-box"><strong>Note:</strong> ${escapeHtml(b.note)}</div>` : ''}
        </div>
      `;
    }
    html += `</div>`;
  }

  // Section 2: Gifts to Buy (Next 14 Days)
  if (giftsToBuyNext14Days.length > 0) {
    html += `
    <div class="section">
      <div class="section-title" style="color: #dc2626;">🎁 Gifts to Buy (Next 14 Days)</div>
    `;
    for (const g of giftsToBuyNext14Days) {
      const daysText = g.daysUntil === 0 ? 'Today!' : `in ${g.daysUntil} day${g.daysUntil > 1 ? 's' : ''} (${g.formattedDate})`;
      html += `
        <div class="card card-urgent">
          <div class="card-name">${escapeHtml(g.fullName)} <span style="font-weight: normal; color: #dc2626;">— Birthday ${daysText}</span></div>
          <div class="card-meta">Gift pending purchase</div>
          ${g.note ? `<div class="note-box"><strong>Gift Ideas / Note:</strong> ${escapeHtml(g.note)}</div>` : ''}
        </div>
      `;
    }
    html += `</div>`;
  }

  // Section 3: Upcoming Birthdays (Next 10 Days)
  if (birthdaysNext10Days.length > 0) {
    html += `
    <div class="section">
      <div class="section-title" style="color: #4f46e5;">🗓️ Upcoming Birthdays (Next 10 Days)</div>
    `;
    for (const u of birthdaysNext10Days) {
      const milestoneBadge = u.isMilestone ? `<span class="badge badge-milestone">🌟 Milestone: Turning ${u.turningAge}!</span>` : '';
      const ageText = u.turningAge ? `Turning ${u.turningAge}` : 'Age unknown';
      html += `
        <div class="card">
          <div class="card-name">${escapeHtml(u.fullName)} ${milestoneBadge}</div>
          <div class="card-meta">${u.formattedDate} (in ${u.daysUntil} day${u.daysUntil > 1 ? 's' : ''}) • ${ageText}</div>
          ${u.note ? `<div class="note-box"><strong>Note:</strong> ${escapeHtml(u.note)}</div>` : ''}
        </div>
      `;
    }
    html += `</div>`;
  }

  // Section 4: Missing Birth Year Warnings (within 14 days)
  if (missingYearWarnings.length > 0) {
    html += `
    <div class="section">
      <div class="section-title" style="color: #d97706;">⚠️ Missing Birth Year (Within 14 Days)</div>
      <p style="font-size: 13px; color: #64748b; margin-top: 0;">Add the birth year in Google Contacts so milestone ages can be calculated properly:</p>
    `;
    for (const m of missingYearWarnings) {
      html += `
        <div class="card">
          <div class="card-name">${escapeHtml(m.fullName)} <span class="badge badge-warning">Missing Year</span></div>
          <div class="card-meta">Birthday: ${m.formattedDate} • <a href="https://contacts.google.com/" target="_blank">Open Google Contacts</a></div>
        </div>
      `;
    }
    html += `</div>`;
  }

  html += `
    <div class="footer">
      Sent automatically by Birthday Manager • Google Apps Script
    </div>
  </div>
</body>
</html>
  `;

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    htmlBody: html
  });

  Logger.log(`Daily digest email sent to ${recipientEmail}`);
}

/**
 * Escapes HTML characters for email templates.
 * @param {string} str 
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
