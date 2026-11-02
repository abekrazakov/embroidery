# Connecting the inquiry form to a Google Sheet

The website's inquiry form saves every submission as a row in a Google Sheet
you own. A small Google Apps Script receives each submission. This takes
about 10 minutes and you only do it once.

## 1. Create the sheet

1. Signed in to the Google account that should own the inquiries, go to
   <https://sheets.new> to create a blank spreadsheet.
2. Name it, for example **BC Embroidery Studio · Inquiries**.

## 2. Add the script

1. In the spreadsheet, open **Extensions → Apps Script**.
2. Delete the placeholder code in `Code.gs`.
3. Paste in the whole of [`google-apps-script/Code.gs`](../google-apps-script/Code.gs)
   from this repository.
4. To get an email for each new inquiry, put your address in the
   `NOTIFY_EMAIL` line near the top, e.g.
   `const NOTIFY_EMAIL = 'hello@bekcollective.com';`
5. Click **Save** (the disk icon).

## 3. Run the one-time setup

1. In the toolbar's function menu, choose **setup**, then click **Run**.
2. Google asks you to authorize the script. Choose your account. You may see
   "Google hasn't verified this app". That's expected for your own script:
   click **Advanced → Go to (project name) (unsafe)**, then **Allow**.
3. Back in the spreadsheet, an **Inquiries** tab now has bold column headings
   and a Status dropdown.

## 4. Publish it as a web app

1. In Apps Script, click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy** and copy the **Web app URL**. It looks like
   `https://script.google.com/macros/s/AKfy…/exec`.

"Anyone" only lets people *send* submissions to the script. Nobody can read
your sheet through it.

## 5. Connect the website

In `index.html`, find the form line and paste your URL into `data-endpoint`:

```html
<form class="inquiry-form" id="inquiry-form" method="post" data-endpoint="https://script.google.com/macros/s/AKfy…/exec">
```

Commit and push. GitHub Pages republishes in about a minute. Send a test
inquiry from the live site and check the sheet.

## Managing inquiries

- New rows arrive with Status **New**. Use the dropdown to move them through
  Replied → Proof sent → Approved → In progress → Shipped → Closed.
- Sort or filter with **Data → Create a filter**.
- Add your own columns (price, due date, notes) to the **right** of the
  existing ones. The script writes only the first nine columns.

## Changing the script later

After editing `Code.gs`, publish the change with **Deploy → Manage
deployments → (pencil icon) → Version: New version → Deploy**. This keeps the
same URL, so the website doesn't need updating. A *New deployment* would
create a new URL instead.
