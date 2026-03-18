# How to Use This (Friendly Guide)

This guide is written for someone like John: you click things, you get results fast, and your last filters come back even if you accidentally close the browser.

## 1) Open the app
After you start the backend + frontend, go to:

`http://localhost:4200`

When it loads, you’ll see:
* Left side -> Filters, search, numeric ranges, and buttons
* Right side -> The car table + pagination
* Also on the left -> “Add Car” form

## 2) Filter + Search (the main workflow)

Use the Filters panel like this:
1. Type in **Search** (matches car `name`, case-insensitive)
2. Choose **Origin** (USA / Europe / Japan)
3. Fill in any numeric ranges you care about:
   * MPG min/max
   * Cylinders min/max
   * Displacement min/max
   * Horsepower min/max
   * Weight min/max
   * Acceleration min/max
   * Model year min/max
4. Click **Apply**

What to expect:
* The table updates only after you press **Apply** (so you don’t get half-finished results while typing).
* Press **Reset** if you want to go back to the default view.

## 3) Sorting (click the column names)

Click any column header:
* Name, MPG, Cyl., Displ., HP, Weight, Accel., Year, Origin

If you click the same header again:
* It toggles between ascending and descending.

Sorting works together with your current filters (as soon as you press Apply / navigate pages).

## 4) Pagination (don’t scroll forever)

At the bottom you’ll see:
* **Prev** and **Next**
* A **Rows** dropdown to change how many cars you view per page

## 5) CSV Download (backup your current view)

When your table shows the exact results you want:
1. Click **Download CSV**
2. Your browser downloads `cars.csv`

Important:
* The CSV matches the same filters/sort/search you’re currently using.

## 6) Your filters stay saved (even after browser close)

This is the “oops factor” feature:
* Your last filter/search/sort settings are saved automatically in your browser.

So when you come back later:
* You’ll see your previous choices restored.

## 7) Add Car (extend the dataset)

In the **Add Car** card:
1. Enter **Name** (required)
2. Optionally enter the numeric fields (MPG, Cylinders, etc.)
3. Pick **Origin**
4. Click **Add**

If something is invalid:
* You’ll get an error message

The backend validates the data before writing it into Firestore.

