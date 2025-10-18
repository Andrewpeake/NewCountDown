# T+Andrew

A modern React + TypeScript single-page app for relationship countdown and photo gallery, built for Andrew & Tara.

## Features

### 🕐 Countdown Timer
- **Flip Animation**: Beautiful flip cards showing days, hours, minutes, and seconds
- **Timezone Support**: Automatic DST handling with timezone picker
- **Past Date Handling**: Graceful "She's here ✈️" state for past dates
- **Real-time Updates**: Smooth 1-second interval updates
- **Editable Target**: Floating edit button with date/time picker

### 📸 Photo Gallery
- **Masonry Grid**: Responsive photo grid with drag-and-drop upload
- **Image Compression**: Automatic client-side compression (max 3000px, 2MB)
- **EXIF Support**: Automatic date extraction from photo metadata
- **Lightbox**: Full-screen photo viewing with swipe/keyboard navigation
- **Photo Management**: Captions, favorites, sorting, and deletion
- **Drag to Reorder**: Intuitive photo reordering

### 💾 Data Storage
- **IndexedDB**: Efficient binary storage for photos (no localStorage bloat)
- **localStorage**: Settings and countdown configuration
- **Export/Import**: Complete data backup as ZIP files
- **Offline Support**: PWA with service worker for offline functionality

### 🎨 Modern UI
- **Tailwind CSS**: Minimal, classy design with soft gradients
- **Dark Mode**: System preference detection with manual toggle
- **shadcn/ui**: High-quality, accessible components
- **Framer Motion**: Smooth animations and transitions
- **Responsive**: Works beautifully on mobile and desktop

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Framer Motion** for animations
- **Luxon** for timezone handling
- **IndexedDB** (via idb-keyval) for photo storage
- **PWA** support with Vite PWA plugin

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd NewCountDown
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── gallery/           # Photo gallery components
│   ├── Countdown.tsx      # Main countdown display
│   ├── CountdownEditor.tsx # Date/time picker modal
│   ├── FlipUnit.tsx       # Animated flip cards
│   ├── Gallery.tsx        # Photo gallery container
│   └── Settings.tsx       # Settings page
├── lib/
│   ├── storage.ts         # IndexedDB & localStorage utilities
│   ├── time.ts           # Timezone & date utilities
│   └── utils.ts          # General utilities
├── App.tsx               # Main app component
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## Data Storage

### Photos (IndexedDB)
- **Binary data**: Compressed image files
- **Metadata**: Created date, EXIF date, caption, favorites
- **Ordering**: Custom sort order for drag-and-drop
- **Efficient**: No localStorage bloat, handles large images

### Settings (localStorage)
- **Theme**: Light/dark/system preference
- **Countdown**: Target date, time, and timezone
- **Persistent**: Survives browser restarts

### Export/Import
- **ZIP Format**: Complete backup with manifest
- **Cross-device**: Restore on any device
- **Versioned**: Future-proof export format

## Default Configuration

- **Target Date**: November 2, 2025, 12:03 AM
- **Timezone**: America/Edmonton (UTC-6, handles DST)
- **Theme**: System preference
- **Sample Data**: 6 placeholder photos available

## Accessibility

- **WCAG Compliant**: Alt text, focus states, keyboard navigation
- **ARIA Labels**: Screen reader support for flip animations
- **High Contrast**: Supports system high contrast mode
- **Reduced Motion**: Respects user motion preferences

## Performance

- **Lazy Loading**: Gallery images load on demand
- **Compression**: Client-side image optimization
- **Efficient Storage**: IndexedDB for large binary data
- **Smooth Animations**: 60fps flip animations
- **Offline Ready**: PWA with service worker

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Features**: IndexedDB, ES2020, CSS Grid, Flexbox

## Development

### Key Dependencies
```json
{
  "react": "^18.2.0",
  "typescript": "^5.2.2",
  "vite": "^4.5.0",
  "tailwindcss": "^3.3.5",
  "framer-motion": "^10.16.4",
  "luxon": "^3.4.4",
  "idb-keyval": "^6.2.1",
  "exifr": "^7.1.3",
  "browser-image-compression": "^2.0.2"
}
```

### Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - ESLint checking

## Sample Data

The app includes a "Load Sample Data" feature in Settings that adds:
- 6 placeholder photos with different colors
- Sample captions and metadata
- Mix of favorites and regular photos
- Spread across different dates

This lets you see the full layout and functionality immediately.

## Troubleshooting

### Common Issues

1. **Photos not loading**: Check browser IndexedDB support
2. **Timezone issues**: Ensure Luxon is properly configured
3. **Build errors**: Clear node_modules and reinstall
4. **PWA not working**: Check service worker registration

### Data Recovery

If data becomes corrupted:
1. Use Settings → Export Data to backup
2. Clear all data and re-import
3. Or use the sample data feature

## License

Built with ❤️ for Tara & Andrew. Personal use only.

---

**Made with React, TypeScript, and lots of love 💕**
