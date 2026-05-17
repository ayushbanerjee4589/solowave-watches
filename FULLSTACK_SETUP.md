# Solowave 777 — Full-Stack Setup Guide

## What's Connected

| Feature | Technology | Status |
|---------|-----------|--------|
| User Auth (Login/Register) | Firebase Auth | ✅ |
| Orders | Firestore + localStorage | ✅ |
| Wishlist | Firestore + localStorage | ✅ |
| Messages/Contact | Firestore + localStorage | ✅ |
| Newsletter | Firestore + localStorage | ✅ |
| Admin Panel | Real-time Firestore | ✅ |
| Stock Management | Firestore + localStorage | ✅ |
| Analytics | Firestore | ✅ |
| Payment | Razorpay (test mode) | ✅ |

## Firebase Setup (Already Done)
Your Firebase config is in `firebase-config.js`:
- Project: `solowave-watches`
- Auth, Firestore enabled

## To Go Live

### 1. Enable Firebase Auth
- Go to Firebase Console → Authentication → Sign-in method
- Enable: Email/Password

### 2. Firestore Rules (paste in Firebase Console → Firestore → Rules)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{doc} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.token.admin == true);
      allow create: if request.auth != null;
      allow update: if request.auth.token.admin == true;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    match /wishlists/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    match /messages/{doc} {
      allow create: if true;
      allow read, update: if request.auth.token.admin == true;
    }
    match /subscribers/{doc} {
      allow create: if true;
      allow read: if request.auth.token.admin == true;
    }
    match /analytics/{doc} {
      allow create: if true;
    }
    match /settings/{doc} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

### 3. Razorpay Payment
- Get key from: https://dashboard.razorpay.com/app/keys
- Replace in `checkout.js`: `var RAZORPAY_KEY_ID = 'rzp_live_XXXXXXXX';`

### 4. Admin Panel
- Open: `admin.html`
- Password: `solowave2024`
- All orders/messages sync from Firestore in real-time

## File Structure
```
watch/
├── index.html          # Homepage
├── login.html          # Auth (Firebase)
├── orders.html         # Order history (Firebase)
├── wishlist.html       # Wishlist (Firebase sync)
├── checkout.html       # Checkout (Razorpay)
├── product.html        # Product detail
├── contact.html        # Contact (Firebase)
├── admin.html          # Admin dashboard (Firebase real-time)
├── auth.js             # Firebase Auth module
├── db.js               # Firestore CRUD module
├── firebase.js         # Legacy Firebase module
├── fullstack.js        # Shared utilities (all pages)
├── admin-firebase.js   # Admin real-time bridge
├── checkout.js         # Payment logic
├── script.js           # Main site script
└── watches-data.js     # Product catalog
```
