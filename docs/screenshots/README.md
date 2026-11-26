# Screenshots

The images shown in the main [README](../../README.md).

| File | Screen |
| --- | --- |
| `login.jpg`, `register.jpg` | Sign in, create account |
| `service-log.png` | A bike's service log |
| `update-odometer.png` | Update odometer |
| `edit-motorcycle.png` | Edit motorcycle |
| `vault.png` | Vault (empty) |
| `add-document.png` | Add a document |
| `settings.png` | Settings |
| `wiki.png`, `wiki-filters.png` | Wiki and its filters |
| `spec-sheet.png` | Spec sheet |
| `ai-mechanic.png`, `new-chat.png`, `chat.png` | AI Mechanic |

The PNGs are rendered with the app's own fonts (Instrument Serif, Instrument Sans and DM Mono), so they look the same for everyone on GitHub. To change one, replace the file with a new image of the same name.

## Adding or replacing a screenshot

- Use a demo account with sample data. Never show a real license, plate number or personal email.
- Close the Expo dev menu bubble and clear the status bar of other apps' notifications first.
- `adb exec-out screencap -p > docs/screenshots/<name>.png`, then shrink it (e.g. `pngquant`) to under about 500 KB.
- Add it to the table above and to the Screenshots section of the main README.
