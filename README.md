# WedEase
Wedease is an Indian wedding marketplace connecting users with vendors for venues, catering, decorations, photography, and more. It offers personalized AI recommendations, customizable packages, and a secure payment system, making wedding planning easier and more affordable for users and vendors alike.



# Wedease 🎊 - Indian Wedding Marketplace

Wedease is an all-in-one **Indian Wedding Marketplace** where users can find and book venues, catering, decorations, photography, and other wedding services. Vendors can register and list their services, and users can select services based on their **budget, preferences, and package deals**.

## ✨ Features
- 🏛 **Venue Booking** - Browse and book wedding venues.
- 🍽 **Catering Services** - Find catering vendors based on budget & cuisine.
- 🎇 **Decorations** - Choose from a variety of wedding decorations.
- 📸 **Photography & Videography** - Hire wedding photographers.
- 🛍 **Package Deals** - Get customized wedding service packages based on your budget.
- 🔍 **AI Recommendations** - Personalized recommendations based on user preferences.
- 💳 **Secure Payments** - Integrated **Razorpay** for easy transactions.
- 🗺 **Location-Based Services** - Find vendors near you.
- 📩 **Email Notifications** - Receive booking confirmations via **Nodemailer**.

---

## 🚀 Tech Stack
- **Frontend:** HTML, CSS, JavaScript, EJS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Authentication:** Express-session
- **Payment Gateway:** Razorpay
- **File Uploads:** Multer
- **AI Recommendations:** Machine Learning (Scikit-Learn, Python API)

---

## 📌 Installation

### Step-by-Step Guide

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/wedease.git
   cd wedease
Install dependencies:

sh
Copy
Edit
npm install
Set up PostgreSQL Database:

Create a database named wedease in PostgreSQL.

Update the database credentials in the server.js file.

Configure environment variables (for sensitive data such as API keys, database credentials, etc.): Create a .env file and add necessary variables:

ini
Copy
Edit
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=wedease
RAZORPAY_KEY=your_razorpay_key
RAZORPAY_SECRET=your_razorpay_secret
NODEMAILER_USER=your_email
NODEMAILER_PASS=your_email_password
Start the server:

sh
Copy
Edit
node server.js
Or use nodemon for automatic reloading:

sh
Copy
Edit
npm run dev
Access the website: Open your browser and go to:

arduino
Copy
Edit
http://localhost:3000
📌 API Endpoints
User & Vendor Authentication
Method	Endpoint	Description
POST	/registeruser	Register a new user
POST	/registervendor	Register a new vendor
POST	/signuser	User Login
POST	/signvendor	Vendor Login
GET	/logout	Logout user
Services & Packages
Method	Endpoint	Description
GET	/services	View available services
GET	/packages?min_budget=1000&max_budget=5000	Get package recommendations based on budget
POST	/add-service	Vendors add their services
Payments & Booking
Method	Endpoint	Description
POST	/create-order	Create a payment order (Razorpay)
POST	/verify-payment	Verify payment success
POST	/book-service	Book a service
🎯 AI-Powered Budget-Based Packages
We use Machine Learning to suggest personalized wedding packages based on the user's budget.

AI Model for Recommendations
Train AI Model (Python API)

Predict Suitable Packages

Show Recommended Services in Frontend

Example AI Model (Python)
python
Copy
Edit
import numpy as np
from sklearn.cluster import KMeans

# Sample budget data
budgets = np.array([[5000], [10000], [15000], [20000], [30000], [50000]])
kmeans = KMeans(n_clusters=3).fit(budgets)

def recommend_package(user_budget):
    cluster = kmeans.predict([[user_budget]])[0]
    return f"Recommended package for budget {user_budget}: Cluster {cluster}"
Machine Learning Model API
Use the model to predict the package based on the user's budget.

Integrate the Python API with the Node.js backend for real-time recommendations.

Example: Backend Integration
javascript
Copy
Edit
const axios = require('axios');

app.get("/recommendation", async (req, res) => {
    const userBudget = req.query.budget;
    try {
        const response = await axios.get(`http://localhost:5000/recommend?budget=${userBudget}`);
        res.json(response.data);
    } catch (err) {
        res.status(500).send("Error in getting recommendations");
    }
});
📩 Contribution
Contributions are welcome! Follow these steps to contribute:

Fork the repository.

Clone your fork locally:

sh
Copy
Edit
git clone https://github.com/yourusername/wedease.git
cd wedease
Create a new branch for your feature or bug fix:

sh
Copy
Edit
git checkout -b feature-branch
Commit your changes:

sh
Copy
Edit
git add .
git commit -m "Your commit message"
Push your changes to your fork:

sh
Copy
Edit
git push origin feature-branch
Create a Pull Request to merge your changes into the main repository.

📜 License
This project is open-source and available under the MIT License.

🤝 Contact
Project Maintainer: Anjali and Om
Email: rupa20singh25@gmail.com || ombhayde5@gmail.com
