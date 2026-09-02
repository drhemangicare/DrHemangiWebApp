# Real ultrasound images

Drop scan images in this folder, then add an entry for each in
`src/lib/site/scans.ts`. Until that list has at least one entry, the
"Scan view" toggle does not appear anywhere on the site and visitors
see only the illustration.

## Before any image leaves the clinic

1. **Written consent.** Get the patient's written consent for her scan to
   appear on a public website, and keep it on file. Verbal consent is not
   enough for publication.

2. **Crop the identity band.** Ultrasound machines burn the patient name,
   hospital ID and date across the top of the image. **Crop it off** — do not
   draw a black box over it. A box can be deleted from the file; a crop cannot.
   Check the corners for a second ID line too.

3. **Strip metadata.** Save as JPEG or PNG. Never upload a DICOM file straight
   from the machine — it carries the full patient record inside the file.

4. **Name by week.** `week-12.jpg`, `week-20.jpg`, `week-32.jpg`.

## How many

Three is plenty — roughly one per trimester (about 12, 20 and 32 weeks).
The site shows the closest available scan to whatever week the reader is
looking at, and always labels it with the image's own week.

## Sizing

Anything from about 600px to 1200px wide is fine. Note the pixel width and
height when you add the entry, so the page reserves the right space and the
layout does not jump while the image loads.
