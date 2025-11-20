# Documentation

This folder contains detailed technical documentation for the Scrapbook Creator project.

## Contents

### [Testing Guide](TESTING.md)
**Purpose**: Comprehensive guide for running and writing E2E tests
**When to use**:
- Running Cypress tests with Firebase emulators
- Adding new test cases
- Debugging test failures
- Understanding cost-free AI testing

**Key topics**:
- Test setup and configuration
- Running tests (interactive and headless modes)
- Custom Cypress commands
- Firebase emulator integration
- Zero-cost AI testing with mocked responses

---

### [Firebase Setup](FIREBASE_SETUP.md)
**Purpose**: Complete Firebase configuration and deployment guide
**When to use**:
- Initial Firebase project setup
- Configuring authentication, Firestore, Storage
- Deploying Cloud Functions
- Setting up environment variables

**Key topics**:
- Firebase project creation
- Service configuration
- Cloud Functions deployment
- Security rules

---

### [Storage Policy](STORAGE_POLICY.md)
**Purpose**: Storage lifecycle and cleanup configuration
**When to use**:
- Configuring automatic file deletion
- Understanding PDF storage lifecycle
- Managing storage costs

**Key topics**:
- Lifecycle policies for temporary PDFs
- Storage bucket configuration
- IAM permissions

---

### [AI Setup](AI_SETUP.md)
**Purpose**: AI text polishing feature setup and configuration
**When to use**:
- Setting up Google Gemini API
- Configuring AI features
- Understanding tier-based access
- Troubleshooting AI integration

**Key topics**:
- Gemini API key setup
- Cloud Function configuration
- User tier management
- Cost optimization

---

## Quick Links

- Back to [Project README](../README.md)
- [Firebase Console](https://console.firebase.google.com)
- [Google Cloud Console](https://console.cloud.google.com)

## Contributing

When adding new documentation:
1. Create a new `.md` file in this folder
2. Update this README with a description
3. Link to it from the main [README.md](../README.md)
