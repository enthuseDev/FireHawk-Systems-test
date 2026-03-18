# How to Use the Car Dataset Explorer

This guide is written for someone like John: you click things, you get results fast, and your last filters come back even if you accidentally close the browser.

## 1) Open the App

After you start the backend and frontend, open your browser and go to:

`http://localhost:4200`

When it loads you will see two main areas:

* **Left side** — Filters panel (search, origin, numeric ranges) and an "Add Car" form.
* **Right side** — The car table with sorting, pagination, and a row-count selector.

## 2) Search and Filter

### Text Search

Type a car name (or part of one) into the **Search** box. The search is case-insensitive, so typing "chevrolet" will match "Chevrolet Chevelle Malibu" and similar entries.

### Origin Filter

Use the **Origin** dropdown to narrow results to cars from **USA**, **Europe**, or **Japan**. Choose "All origins" to remove this filter.

### Numeric Range Filters

You can set minimum and/or maximum values for any of these fields:

* MPG
* Cylinders
* Displacement
* Horsepower
* Weight
* Acceleration
* Model Year

Leave a field blank if you do not want to filter by it.

### How Filters Apply

Filters apply **automatically** as you type or change a value — there is a short delay so the table does not flicker while you are still typing. You can also press the **Apply** button to trigger the filters immediately.

Press **Reset** to clear all filters and return to the default view.

## 3) Sorting

Click any **column header** in the table to sort by that column:

* Name, MPG, Cyl., Displ., HP, Weight, Accel., Year, Origin

Click the same header again to toggle between **ascending** (↑) and **descending** (↓) order. The arrow next to the header name shows the current direction.

Sorting works together with your active filters — only the filtered results are reordered.

## 4) Pagination

At the bottom of the table you will find:

* **Prev** and **Next** buttons to move between pages.
* A **Rows** dropdown (10 / 20 / 50) to choose how many cars appear per page.
* A label showing your current page and total pages (e.g. "Page 1 of 20").

Changing the rows-per-page resets you back to page 1.

## 5) Download CSV

When the table shows the results you want to keep:

1. Click **Download CSV**.
2. Your browser will download a file called `cars.csv`.

The CSV contains **all** cars that match your current filters and sort order (not just the current page), so it works well as a full backup of your filtered view.

## 6) Filters Are Remembered

Your last set of filters, search text, sort column, sort direction, page, and page size are **saved automatically** in your browser.

This means:

* If you accidentally close your browser or tab, just reopen `http://localhost:4200` and everything will be exactly as you left it.
* Filters are also reflected in the URL, so you can bookmark or share a specific filtered view.

## 7) Add a New Car

Use the **Add Car** form on the left side:

1. Enter a **Name** (required).
2. Fill in the numeric fields you know — MPG, Cylinders, Displacement, Horsepower (optional), Weight, Acceleration, and Model Year.
3. Pick the **Origin** (USA, Europe, or Japan).
4. Click **Add**.

What happens next:

* A green success message appears if the car was added.
* A red error message appears if something is invalid (for example, a missing name).
* The table refreshes automatically so you can see your new entry.

Click **Clear** to reset the form without submitting.

The backend validates every field before writing to the database, so bad data cannot sneak in.