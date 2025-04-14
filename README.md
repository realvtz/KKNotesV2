# KKNotes - KTU Computer Science Notes Platform

<div align="center">
  <h3>Your Ultimate Study Companion for KTU Computer Science</h3>
  
  <p>
    <a href="https://christopherjoshy.github.io/KKNotesV2/" target="_blank">🌐 Visit KKNotes</a> •
    <a href="#overview">Overview</a> •
    <a href="#features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#admin-panel">Admin Panel</a> •
    <a href="#contributing">Contributing</a>
  </p>

  [![GitHub Stars](https://img.shields.io/github/stars/ChristopherJoshy/KKNotesV2?style=social)](https://github.com/ChristopherJoshy/KKNotesV2/stargazers)
  [![GitHub Forks](https://img.shields.io/github/forks/ChristopherJoshy/KKNotesV2?style=social)](https://github.com/ChristopherJoshy/KKNotesV2/network/members)
  [![GitHub Issues](https://img.shields.io/github/issues/ChristopherJoshy/KKNotesV2)](https://github.com/ChristopherJoshy/KKNotesV2/issues)
  [![GitHub License](https://img.shields.io/github/license/ChristopherJoshy/KKNotesV2)](https://github.com/ChristopherJoshy/KKNotesV2/blob/main/LICENSE)
  [![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue)](https://kknotes.com)
  [![Firebase](https://img.shields.io/badge/Firebase-Enabled-orange)](https://firebase.google.com)
  [![Responsive](https://img.shields.io/badge/Responsive-Yes-green)](https://kknotes.com)
  [![Website](https://img.shields.io/badge/Website-Live-success)](https://christopherjoshy.github.io/KKNotesV2/)
</div>

---

## 📚 Overview <a name="overview"></a>

KKNotes is a comprehensive web application designed to provide KTU Computer Science Engineering students with easy access to high-quality study materials, including notes and video tutorials. The platform features a modern, responsive design that works seamlessly on both desktop and mobile devices.

### 🌟 Key Features <a name="features"></a>

<table>
  <tr>
    <td width="50%">
      <ul>
        <li><b>📚 Semester-wise Notes</b>: Access organized study materials for all semesters</li>
        <li><b>🎥 Video Tutorials</b>: Watch curated video content for each subject</li>
        <li><b>💬 Global Chat</b>: Connect with other students and share resources</li>
        <li><b>📱 PWA Support</b>: Install as a standalone app on your device</li>
        <li><b>🌓 Dark/Light Mode</b>: Choose your preferred theme</li>
      </ul>
    </td>
    <td width="50%">
      <ul>
        <li><b>📱 Responsive Design</b>: Works on all devices from mobile to desktop</li>
        <li><b>👨‍💼 Admin Panel</b>: Manage content and users (for administrators)</li>
        <li><b>🔐 Google Authentication</b>: Secure login with your Google account</li>
        <li><b>📶 Offline Support</b>: Access content even without internet connection</li>
        <li><b>🔍 Search Functionality</b>: Quickly find the content you need</li>
      </ul>
    </td>
  </tr>
</table>

> **⚠️ Note:** Some features like offline support and notifications are still in development and may not be fully functional yet.

## 🚀 Getting Started <a name="getting-started"></a>

### Prerequisites

<details>
  <summary><b>Click to expand prerequisites</b></summary>
  
  - **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
  - **npm** or **yarn** - Included with Node.js or [Download Yarn](https://yarnpkg.com/getting-started/install)
  - **Firebase account** - [Sign up](https://firebase.google.com/)
  - **Google account** - For authentication
</details>

### Local Development Setup

<details>
  <summary><b>Step 1: Clone the repository</b></summary>
  
  ```bash
  git clone https://github.com/ChristopherJoshy/KKNotesV2.git
  cd KKNotesV2
  ```
</details>

<details>
  <summary><b>Step 2: Install dependencies</b></summary>
  
  ```bash
  npm install
  ```
</details>

<details>
  <summary><b>Step 3: Set up Firebase</b></summary>
  
  1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
  2. Enable Authentication (Google provider)
  3. Create a Realtime Database
  4. Get your Firebase configuration
</details>

<details>
  <summary><b>Step 4: Configure environment variables</b></summary>
  
  Edit the `js/env-config.js` file with your Firebase configuration:
  
  ```javascript
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "your_api_key",
    authDomain: "your_project_id.firebaseapp.com",
    projectId: "your_project_id",
    storageBucket: "your_project_id.appspot.com",
    messagingSenderId: "your_messaging_sender_id",
    appId: "your_app_id"
  };
  
  // Gemini API key
  const GEMINI_API_KEY = "your_gemini_api_key";
  ```
  
  Alternatively, you can set these in localStorage for development:
  
  ```javascript
  localStorage.setItem("FIREBASE_API_KEY", "your_api_key");
  localStorage.setItem("FIREBASE_PROJECT_ID", "your_project_id");
  localStorage.setItem("FIREBASE_APP_ID", "your_app_id");
  localStorage.setItem("FIREBASE_MESSAGING_SENDER_ID", "your_messaging_sender_id");
  localStorage.setItem("GEMINI_API_KEY", "your_gemini_api_key");
  ```
</details>

<details>
  <summary><b>Step 5: Start the development server</b></summary>
  
  ```bash
  npx serve .
  ```
  
  This will start a local server, typically at http://localhost:5000
</details>

### Customizing for Different Streams

<details>
  <summary><b>Click to expand customization instructions</b></summary>
  
  To adapt KKNotes for a different engineering stream:

  1. **Update the content structure**
     - Modify the semester and subject structure in the admin panel
     - Update the notes and videos for each subject

  2. **Customize branding**
     - Replace the logo in `assets/logo.svg`
     - Update the color scheme in `css/style.css` and `css/newstyle.css`
     - Modify the theme colors in the `:root` section

  3. **Update metadata**
     - Edit `manifest.json` to reflect your stream's name and description
     - Update the title and meta tags in `index.html`
</details>

## 📁 Project Structure

### Core Files

| File | Description |
|------|-------------|
| `index.html` | Main application entry point |
| `admin.html` | Admin panel interface |
| `manifest.json` | PWA configuration |
| `sw.js` | Service worker for offline functionality |
| `offline.html` | Offline fallback page |

### JavaScript Files

| File | Description |
|------|-------------|
| `js/main.js` | Main application logic |
| `js/auth.js` | Authentication functionality |
| `js/notes.js` | Notes management |
| `js/videos.js` | Video content management |
| `js/chat.js` | Chat functionality |
| `js/admin.js` | Admin panel functionality |
| `js/firebase-config.js` | Firebase configuration |
| `js/env-config.js` | Environment variables and API keys |
| `js/theme.js` | Theme switching functionality |
| `js/animations.js` | UI animations |
| `js/navigation.js` | Navigation handling |
| `js/github-stats.js` | GitHub statistics integration |

### CSS Files

| File | Description |
|------|-------------|
| `css/style.css` | Main stylesheet |
| `css/newstyle.css` | Updated styles |
| `css/mobile.css` | Mobile-specific styles |
| `css/admin.css` | Admin panel styles |
| `css/wizard-loader.css` | Loading animation styles |

### Assets

| Directory | Contents |
|-----------|----------|
| `assets/icons/` | PWA icons in various sizes |
| `assets/screenshots/` | Application screenshots |
| `assets/avatars/` | User avatar images |

## 🔧 Features in Detail

### Authentication System

The application uses Firebase Authentication with Google as the provider. Users can:
- Sign in with their Google account
- Access personalized content
- Participate in the chat
- Save their preferences

### Content Management

The admin panel allows administrators to:
- Add, edit, and delete notes and videos
- Organize content by semester and subject
- Manage user access and permissions
- View usage statistics

### Progressive Web App (PWA)

KKNotes is a fully functional PWA that:
- Can be installed on any device
- Works offline (not fully implemented)
- Provides a native app-like experience
- Sends notifications for updates (not fully implemented)

### Responsive Design

The application is fully responsive and optimized for:
- Mobile phones
- Tablets
- Laptops
- Desktop monitors

### Theme Support

Users can switch between:
- Light mode
- Dark mode
- System preference

## 👨‍💼 Admin Panel Guide <a name="admin-panel"></a>

The admin panel is a powerful tool for managing content and users in KKNotes. Here's how to use it:

### Accessing the Admin Panel

1. Navigate to `/admin.html` in your browser
2. Sign in with your Google account
3. If your account is authorized as an admin, you'll be granted access

### Changing the Super Admin

<details>
  <summary><b>Click to expand instructions for changing the super admin</b></summary>
  
  The super admin is hardcoded in the `js/auth.js` file. To change it:

  1. Open `js/auth.js` in your code editor
  2. Locate the `isAdmin` function (around line 50-60)
  3. Find the section that checks for the super admin email:
     ```javascript
     // Check if user is the super admin
     if (user.email === "your-email@gmail.com") {
       return true;
     }
     ```
  4. Replace `"your-email@gmail.com"` with your email address
  5. Save the file and refresh the admin page
</details>

### Admin Panel Features

<details>
  <summary><b>Content Management</b></summary>
  
  #### Adding New Content
  
  1. Click "Add New" in the sidebar
  2. Select content type (Notes, Videos, etc.)
  3. Fill in the required fields:
     - Title
     - Description
     - Semester
     - Subject
     - Google Drive link
  4. Click "Save" to add the content
  
  #### Editing Content
  
  1. Find the content in the list
  2. Click the edit icon
  3. Modify the fields as needed
  4. Click "Update" to save changes
  
  #### Deleting Content
  
  1. Find the content in the list
  2. Click the delete icon
  3. Confirm the deletion
</details>

<details>
  <summary><b>User Management</b></summary>
  
  #### Viewing Users
  
  1. Click "Users" in the sidebar
  2. See a list of all registered users
  
  #### Managing Admin Access
  
  1. Find the user in the list
  2. Toggle the admin switch to grant/revoke admin privileges
</details>

<details>
  <summary><b>Analytics</b></summary>
  
  #### View Usage Statistics
  
  1. Click "Analytics" in the sidebar
  2. See charts and graphs showing:
     - Most viewed content
     - User activity
     - Popular subjects
</details>

## 🤝 Contributing <a name="contributing"></a>

We welcome contributions from everyone! Here's how you can help:

### For Beginners

<details>
  <summary><b>Step 1: Fork the repository</b></summary>
  
  - Click the "Fork" button at the top right of this page
  - This creates your own copy of the project
</details>

<details>
  <summary><b>Step 2: Clone your fork</b></summary>
  
  ```bash
  git clone https://github.com/yourusername/KKNotesV2.git
  cd KKNotesV2
  ```
</details>

<details>
  <summary><b>Step 3: Create a new branch</b></summary>
  
  ```bash
  git checkout -b my-feature
  ```
</details>

<details>
  <summary><b>Step 4: Make your changes</b></summary>
  
  - Edit files, add features, fix bugs
  - Test your changes locally
</details>

<details>
  <summary><b>Step 5: Commit your changes</b></summary>
  
  ```bash
  git add .
  git commit -m "Add my awesome feature"
  ```
</details>

<details>
  <summary><b>Step 6: Push to your fork</b></summary>
  
  ```bash
  git push origin my-feature
  ```
</details>

<details>
  <summary><b>Step 7: Create a Pull Request</b></summary>
  
  - Go to your fork on GitHub
  - Click "Compare & pull request"
  - Fill in the details about your changes
  - Submit the pull request
</details>

### For Experienced Developers

- **Code Style**: Follow the existing code style
- **Testing**: Test your changes thoroughly
- **Documentation**: Update documentation as needed
- **Performance**: Ensure your changes don't impact performance

### Bug Reports

If you find a bug, please:
1. Check if it's already reported in the Issues section
2. If not, create a new issue with:
   - A clear description of the problem
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots if applicable

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

<div align="center">
  ** Christopher Joshy **
  
  [![GitHub](https://img.shields.io/badge/GitHub-ChristopherJoshy-181717?style=flat&logo=github)](https://github.com/ChristopherJoshy)
  [![Instagram](https://img.shields.io/badge/Instagram-calculatederror-E4405F?style=flat&logo=instagram)](https://www.instagram.com/calculatederror/)
  [![Email](https://img.shields.io/badge/Email-Christopherjoshy4@gmail.com-D14836?style=flat&logo=gmail)](mailto:Christopherjoshy4@gmail.com)
</div>

## 🙏 Acknowledgments

<div align="center">
  <table>
    <tr>
      <td width="33%">
        <b>Firebase</b>
        <p>Authentication & Database</p>
      </td>
      <td width="33%">
        <b>Google</b>
        <p>Fonts & Authentication</p>
      </td>
      <td width="33%">
        <b>Font Awesome</b>
        <p>Icons</p>
      </td>
    </tr>
    <tr>
      <td width="33%">
        <b>GSAP</b>
        <p>Animations</p>
      </td>
      <td width="33%">
        <b>Three.js</b>
        <p>3D Effects</p>
      </td>
      <td width="33%">
        <b>Marked.js</b>
        <p>Markdown Rendering</p>
      </td>
    </tr>
  </table>
</div>

---

<div align="center">
  <h3>Made with ❤️ by Christopher Joshy</h3>
  
  <p>
    <a href="#overview">Back to Top</a>
  </p>
</div>
