# MxSend Roadmap — Post v0.1.7 Ideas

> **Status:** Planned / Backlog  
> *These ideas are not part of v0.1.7 and are candidates for future releases.*

---

## User Experience

### First-Time Onboarding
* **Goal:** Help new users understand the file transfer workflow without needing external documentation.
* **Planned Features:**
  * Multi-step welcome guide shown on first launch.
  * Explain the difference between Sender and Receiver modes.
  * Walk users through:
    1. Selecting files.
    2. Connecting devices.
    3. Starting a transfer.
    4. Receiving files.
  * Allow users to skip the guide.
  * Add a "View Guide Again" option in Settings.
* **Motivation:** Reduce friction for first-time users and lower the learning curve.

### Landing Page
* **Goal:** Create a dedicated website for MxSend.
* **Planned Sections:**
  * Hero section.
  * Feature overview.
  * Screenshots.
  * Download links.
  * "How it Works" walkthrough.
  * Frequently Asked Questions.
  * GitHub repository link.
* **Motivation:** Provide a professional public presence and make downloading the app easier.

---

## Performance

### Predictive Image Preloading
* **Goal:** Improve the responsiveness of the image gallery.
* **Current Implementation:**
  * Sliding-window image virtualization.
  * Images outside the window are unmounted.
  * Skeleton placeholders appear while new images load.
* **Planned Improvements:**
  * Predict scrolling direction.
  * Preload images slightly ahead of the viewport.
  * Keep a small forward buffer in memory.
  * Reduce visible skeleton loading during normal scrolling.
* **Inspiration:** Native mobile gallery applications.

---

## Updates

### Automatic Update Notifications
* **Goal:** Notify users when a newer version of MxSend is available.
* **Planned Behaviour:**
  * Listen for internet connectivity using the browser's "online" event.
  * Only perform one successful update check per day.
  * Compare the installed version against the latest GitHub Release.
  * Notify the user when an update exists.
  * Provide a button to open the latest release.
* **Optional Features:**
  * Manual "Check for Updates" button in Settings.
  * Display release notes inside the update dialog.
* **Motivation:** Keep users on the latest version without requiring them to manually check GitHub.

---

## Future Considerations

*These ideas are still exploratory and may be revisited later.*
