# Adhyatmik KBC — Production Deployment & Hardware Setup Guide

## 1. Single-Laptop Extended Display Setup (Live Event)

### Hardware Checklist:
- **1 Laptop** (running Windows or macOS)
- **1 Projector** (connected via HDMI cable)
- **1 Host Tablet** (Samsung Tablet or iPad)
- **1 Contestant Tablet** (Samsung Tablet or iPad)
- **~100 Participant Smartphones** (connected to local Wi-Fi router)

### Extended Display Configuration (No Second Laptop Needed!):
1. Plug the **HDMI cable** from the projector into the laptop.
2. In OS Display Settings:
   - **Windows:** Press `Win + P` and select **Extend** (Do NOT choose Duplicate/Mirror).
   - **macOS:** Open *System Settings → Displays* and select **Extended Display**.
3. On the laptop's primary built-in screen, open Google Chrome and navigate to:
   ```
   http://localhost:3000/admin
   ```
   *(This is the private operator control panel with answer keys and controls).*
4. Open a **second** Chrome window and navigate to:
   ```
   http://localhost:3000/projector
   ```
5. Drag this second window onto the extended projector display screen.
6. Press **F11** (or `Cmd + Shift + F` on Mac) to enter full-screen mode on the projector.
7. Give the host tablet the URL: `https://<YOUR-APP-URL>/host`
8. Give the contestant tablet the URL: `https://<YOUR-APP-URL>/contestant`
9. Participants join automatically by pointing their smartphone camera at the QR code on the projector screen (or navigating to `https://<YOUR-APP-URL>/join`).

---

## 2. Firebase Deployment Guide

### Prerequisites
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Login to your Google / Firebase account:
   ```bash
   firebase login
   ```
3. Initialize or link your Firebase project:
   ```bash
   firebase use --add
   ```

### Deploying Hosting and Security Rules:
```bash
# 1. Build the production React application
npm run build

# 2. Deploy Firestore Security Rules & Indexes
firebase deploy --only firestore

# 3. Deploy Frontend to Firebase Hosting
firebase deploy --only hosting
```

---

## 3. Game Structure & Scoring Rules Reference

- **Points System:** **Samvar Points** (strictly spiritual points, no rupees or monetary terminology).
- **Maximum Prize:** **7 Crore Samvar Points**.
- **Guaranteed Milestones:**
  - **Milestone 1 (Q3):** 10,000 Samvar Points
  - **Milestone 2 (Q8):** 25 Lakh (25,00,000) Samvar Points
- **Wrong Answer Rules:**
  - Before Q3: 0 Samvar Points
  - Between Q3 and Q8: 10,000 Samvar Points
  - At or after Q8: 25 Lakh Samvar Points
- **Quitting Rules:**
  - Contestant retains the exact points corresponding to the **LAST correctly answered question**.
- **Lifelines:**
  - **50:50:** Eliminates 2 incorrect options, strictly preserves correct option.
  - **Ask the Maharaj:** Real physical presence in hall. Prompts host stage cue.
  - **Audience Poll:** Real-time smartphone voting from ~100 participants with percentage bars.
