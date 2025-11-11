# Scrapbook Creator

A beautiful digital scrapbook application for creating and sharing your love story with photos, text, timelines, and special moments.

## Features

- 📖 **Multiple Page Types**: Title pages, timeline pages, and regular content pages
- 🖼️ **Image Management**: Upload and arrange photos in beautiful masonry layouts
- ✨ **Rich Text Editor**: Format text with bold, italic, links, and emoji support
- 😊 **Emoji Autocomplete**: WhatsApp/Telegram-style emoji picker (type `:` to activate)
- 📱 **Responsive Design**: Beautiful on desktop and mobile
- 📄 **PDF Export**: Export your scrapbook as a beautiful PDF
- ☁️ **Cloud Sync**: Automatically saves to Firebase
- 🔐 **Google Authentication**: Secure login with Google

## Setup

### Prerequisites

- Node.js 18+ and npm
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nmezzopera/scrapbook-creator.git
cd scrapbook-creator
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Google provider)
   - Enable Firestore Database
   - Enable Storage
   - Copy `src/firebase.js.template` to `src/firebase.js`
   - Replace the placeholder values with your Firebase configuration

4. Configure Firebase Hosting (optional):
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Update `.firebaserc` with your project ID

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

Build for production:
```bash
npm run build
```

### Deploy

Deploy to Firebase Hosting:
```bash
npm run build
firebase deploy --only hosting
```

## Tech Stack

- **Frontend**: React 18, Vite
- **UI**: Material-UI, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Hosting)
- **Features**:
  - `html-to-image` & `jspdf` for PDF export
  - `node-emoji` for emoji support
  - `react-masonry-css` for image layouts
  - `dompurify` for HTML sanitization

## Project Structure

```
scrapbook-creator/
├── src/
│   ├── components/      # React components
│   │   ├── Section.jsx       # Main section/page component
│   │   └── RichTextEditor.jsx # Rich text editor with emoji support
│   ├── contexts/        # React contexts
│   ├── pages/          # Page components
│   │   └── Scrapbook.jsx     # Main scrapbook page
│   ├── firebase.js     # Firebase configuration (not in repo - see template)
│   └── App.jsx         # Main app component
├── public/             # Static assets
└── dist/              # Production build (generated)
```

## Firebase Configuration Template

The `src/firebase.js` file is excluded from version control for security. Use the template at `src/firebase.js.template` to create your own configuration file.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
