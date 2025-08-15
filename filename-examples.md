# 📁 Smart Filename Generation

## How It Works
The download filename is now automatically generated based on the content you enter:

### Filename Format Examples:

**With both title and date:**
- Title: "Awesome Radio Show"
- Date: "2025-08-15"
- **Filename**: `awesome-radio-show_2025-08-15.png`

**With title only:**
- Title: "Friday Night Jazz"
- **Filename**: `friday-night-jazz.png`

**With date only:**
- Date: "2025-12-25"
- **Filename**: `vers-libre-event_2025-12-25.png`

**No title or date:**
- **Filename**: `vers-libre-event.png` (default)

## Filename Cleaning Rules:
- **Special characters** are removed (!, @, #, etc.)
- **Spaces** become hyphens (-)
- **Uppercase** becomes lowercase
- **Length limit**: 30 characters for title + date, 40 for title only
- **Safe characters**: Only letters, numbers, and hyphens

## Real Examples:

| Input Title | Input Date | Generated Filename |
|-------------|------------|-------------------|
| "RADIO SHOW GOES HERE" | 2025-08-15 | `radio-show-goes-here_2025-08-15.png` |
| "Jazz & Blues Night!" | 2025-12-31 | `jazz--blues-night_2025-12-31.png` |
| "Morning Show" | (none) | `morning-show.png` |
| (empty) | 2025-01-01 | `vers-libre-event_2025-01-01.png` |
| "Super Long Radio Show Name That Goes On" | 2025-06-15 | `super-long-radio-show-name-th_2025-06-15.png` |

## Benefits:
✅ **Organized Downloads** - Files are named meaningfully  
✅ **Easy Sorting** - Date format allows chronological sorting  
✅ **No Conflicts** - Unique names prevent overwrites  
✅ **Clean Names** - Safe for all operating systems  
✅ **Professional** - Proper file naming conventions  

The filename generation happens automatically when you click "Download Image" - no extra steps required!