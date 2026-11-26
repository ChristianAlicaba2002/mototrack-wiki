# Screenshots and demo

The main [README](../../README.md) shows these files. Use exactly these names so the images appear.

| File | Screen | What to show |
| --- | --- | --- |
| `home.png` | Home tab | An active bike with a photo, one or two items in **Due next**, and this month's spending |
| `garage.png` | Garage tab | Two or more bikes, odometer visible |
| `service-log.png` | Services (from Home → see all) | A timeline with several services of different types |
| `vault.png` | Vault tab | Documents with all three statuses (Valid, Expiring soon, Expired) and the filter pills |
| `document-viewer.png` | Tap a document photo | A zoomed-in OR/CR or license (use a sample, not a real one) |
| `wiki.png` | Wiki tab | Search results or a category with several spec sheets |
| `ai-mechanic.png` | AI Mechanic tab | A short question and a formatted answer about the active bike |
| `settings.png` | Settings | The Reminders section with the toggles and Push notifications row |
| `demo.mp4` | Whole app | About 1 minute: add a service → see Due next → open the vault → zoom a document → ask the AI Mechanic |

## How to capture

**Screenshots (Android)**
1. Use a **demo account** with realistic sample data. Never show real plate numbers, license numbers or personal details. Blur them if they're in a photo.
2. Turn off notifications from other apps, set the clock to something clean (e.g. 9:41), and use a full battery and signal.
3. Take the screenshot with **Power + Volume down**, or from a computer:
   ```bash
   adb exec-out screencap -p > docs/screenshots/home.png
   ```
4. Keep them **portrait**, all from the same phone so they're the same size. Light mode reads best on GitHub; pick one mode and stick to it.

**Demo video**
```bash
adb shell screenrecord --time-limit 75 /sdcard/demo.mp4
adb pull /sdcard/demo.mp4 docs/screenshots/demo.mp4
```
Keep it under **10 MB** so GitHub plays it in the browser. To shrink it:
```bash
ffmpeg -i demo.mp4 -vf "scale=540:-2" -c:v libx264 -crf 28 -an docs/screenshots/demo.mp4
```

**Before committing:** make the PNGs smaller (e.g. with [TinyPNG](https://tinypng.com) or `pngquant`), aiming for under 500 KB each.
