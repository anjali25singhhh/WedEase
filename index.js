import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import nodemailer from "nodemailer";
import session from "express-session";
import multer from "multer"; 
import axios from "axios";

const app = express();
const port = 3000;
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');
import crypto from "crypto";
import Razorpay from "razorpay";
const instance = new Razorpay({
    key_id: 'rzp_test_ykjH2mmfVaDX96',  // Replace with your Razorpay Key ID
    key_secret: 'AbMBg1CyCNTejeoabuoSvXp3' // Replace with your Razorpay Key Secret
});



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configure session management
app.use(session({
    secret: 'anjaliandom',  // Use a strong secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true } // Ensure the cookie is being set correctly
}));


// Database configuration
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "wedease",
    password: "Anjali@123", // replace with your database password
    port: 5432
});
db.connect();

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rupa20singh25@gmail.com', // replace with your email
        pass: 'hrzu zdwb btaj wtig' // replace with your app-specific password
    }
});

// Routes
app.get("/", (req, res) => {
    res.render("index.ejs", { path: "/", username: req.session.username, role: req.session.role });
});

app.get("/contact", (req, res) => {
    const success = req.query.success || null;
    res.render("contact", { 
        success, 
        username: req.session.username || null,  // Pass username
        role: req.session.role || null            // Pass role
    });
});


app.get("/home", (req, res) => {
    res.render("home.ejs", { path: "/home", username: req.session.username, role: req.session.role });
});
app.get("/add-service", (req, res) => {
    res.render("addservice.ejs", { path: "/add-service", username: req.session.username, role: req.session.role });
});


app.get("/faq", (req, res) => {
    // Render the faq view with username and role from the session
    res.render("faq.ejs", { 
        username: req.session.username,  // Pass username to the view
        role: req.session.role           // Pass role to the view
    });
});



app.get("/register", (req, res) => {
    res.render("register.ejs", { path: "/register" });
});

app.get("/registervendor", (req, res) => {
    res.render("registerasvendor.ejs");
});

app.get("/registeruser", (req, res) => {
    res.render("registerasuser.ejs");
});

app.get("/signin", (req, res) => {
    res.render("signin.ejs", { path: "/signin" });
});

app.get("/signuser", (req, res) => {
    res.render("signuser.ejs");
});

app.get("/signvendor", (req, res) => {
    res.render("signvendor.ejs");
});

app.get("/landing", (req, res) => {
    res.render("landing.ejs", { username: req.session.username, role: req.session.role });
});

// Route for Services - Conditional redirect based on user role
app.get("/services", (req, res) => {
    // Check if the user is a vendor or a regular user
    if (req.session.isVendor) {
        // Render the services view for vendors with username and role
        res.render("services.ejs", {
            username: req.session.username,  // Pass username to the view
            role: req.session.role           // Pass role to the view
        });
    } else if (req.session.isUser) {
        // Render the service taker view for regular users with username and role
        res.render("servicetaker.ejs", {
            username: req.session.username,  // Pass username to the view
            role: req.session.role           // Pass role to the view
        });
    } else {
        // Redirect to sign in page if not logged in
        res.redirect("/signin");
    }
});


// Protect the servicetaker route for users only
app.get("/servicetaker", (req, res) => {
    if (req.session.isUser) {
        res.render("servicetaker.ejs");
    } else {
        res.redirect("/signin");
    }
});

// Registration and Sign-in Routes
app.post("/registerven", async (req, res) => {
    try {
        const username = req.body.Username;
        const password = req.body.password;

        const existingUser = await db.query("SELECT username FROM vendor WHERE username=$1", [username]);
        if (existingUser.rowCount === 0) {
            await db.query("INSERT INTO vendor (username, password) VALUES ($1, $2)", [username, password]);
            res.redirect("signvendor");
        } else {
            res.render('registerasvendor', { errorMessage: 'Username already exists!' });
        }
    } catch (err) {
        res.render('registerasvendor', { errorMessage: 'An error occurred!' });
    }
});

app.post("/signven", async (req, res) => {
    try {
        const username = req.body.Username;
        const password = req.body.password;

        const existingUser = await db.query("SELECT username FROM vendor WHERE username=$1", [username]);
        const userpass = await db.query("SELECT password FROM vendor WHERE username=$1", [username]);
        if (existingUser.rowCount > 0 && userpass.rows[0].password === password) {
            req.session.isVendor = true; // Mark as vendor
            req.session.isUser = false;
            req.session.username = username;
            req.session.role = "Vendor";
            res.redirect("/landing");
        } else {
            res.render('signvendor', { errorMessage1: 'Invalid Credential' });
        }
    } catch (err) {
        res.render('signvendor', { errorMessage1: 'Invalid Credential' });
    }
});

app.post("/registeruser", async (req, res) => {
    try {
        const username = req.body.Username;
        const password = req.body.password;

        const existingUser = await db.query("SELECT username FROM users WHERE username=$1", [username]);
        if (existingUser.rowCount === 0) {
            await db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, password]);
            res.render("signuser");
        } else {
            res.render('registerasuser', { errorMessage2: 'Username Already Exist!!' });
        }
    } catch (err) {
        res.render('registerasuser', { errorMessage2: 'Username Already Exist!!' });
    }
});

app.post("/signuser", async (req, res) => {
    try {
        const username = req.body.Username;
        const password = req.body.password;

        const existingUser = await db.query("SELECT username, id, password FROM users WHERE username=$1", [username]);
        
        if (existingUser.rowCount > 0 && existingUser.rows[0].password === password) {
            // Store user_id in the session
            req.session.isUser = true;  // Mark as regular user
            req.session.isVendor = false;
            req.session.username = username;
            req.session.user_id = existingUser.rows[0].user_id;  // Store user_id
            req.session.role = "User";
            res.redirect("/landing");
        } else {
            res.render('signuser', { errorMessage3: 'Invalid Credential' });
        }
    } catch (err) {
        res.render('signuser', { errorMessage3: 'Invalid Credential' });
    }
});


// Sign-out route
app.get("/signout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect("/landing");
        }
        res.clearCookie("connect.sid");
        res.redirect("/");
    });
});

// Contact Form
app.post("/contact-via-email", (req, res) => {
    const { name, email, message } = req.body;

    const mailOptions = {
        from: email,
        to: 'rupa20singh25@gmail.com',
        subject: `Contact Form Submission from ${name}`,
        text: `You received a message from ${name} (${email}): \n\n${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.status(500).send('Something went wrong. Please try again later.');
        } else {
            console.log('Email sent: ' + info.response);
            res.redirect("/contact?success=true");
        }
    });
});

app.use(async (req, res, next) => {
    res.locals.username = req.session.username || null;
    res.locals.role = req.session.role || null;
    res.locals.id=(await db.query("SELECT id FROM users WHERE username=$1",[req.session.username]))||null;
    next();
});


app.get("/user-info", async (req, res) => {
    const { username, role } = req.session;

    if (!username) {
        return res.redirect("/signin"); // Redirect to signin if not logged in
    }

    try {
        let userImage = null;

        if (role === "Vendor") {
            // Fetch vendor's image from the vendorimage table
            const result = await db.query("SELECT image FROM vendorimage WHERE username = $1", [username]);
            if (result.rows.length > 0) {
                userImage = result.rows[0].image.toString('base64'); // Convert image buffer to base64
            }
        } else {
            // Fetch user's image from the userimage table
            const result = await db.query("SELECT image FROM userimage WHERE username = $1", [username]);
            if (result.rows.length > 0) {
                userImage = result.rows[0].image.toString('base64'); // Convert image buffer to base64
            }
        }

        // Render the user info page
        res.render("user-info.ejs", { 
            username: username,
            role: role,
            userImage: userImage // Pass image data for rendering
        });
    } catch (err) {
        console.error(err);
        res.render("user-info.ejs", { username: req.session.username, role: req.session.role, userImage: null });
    }
});

// Image Upload Handling for both User and Vendor
app.post("/upload-image", upload.single('image'), async (req, res) => {
    const { username, role } = req.session;
    if (!username) {
        return res.redirect("/signin"); // Redirect to signin if not logged in
    }

    const image = req.file.buffer; // The uploaded image buffer

    try {
        if (role === "Vendor") {
            // Save the image to the vendorimage table
            await db.query(
                "INSERT INTO vendorimage (username, image) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET image = $2",
                [username, image]
            );
        } else {
            // Save the image to the userimage table
            await db.query(
                "INSERT INTO userimage (username, image) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET image = $2",
                [username, image]
            );
        }

        // Redirect to user info page after successful upload
        res.redirect("/user-info");
    } catch (err) {
        console.error(err);
        res.redirect("/user-info"); // Handle error and redirect back
    }
});


// Configure multer for memory storage
const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({ storage: memoryStorage });

// Configure multer for disk storage
const diskStorage = multer.diskStorage({
    destination: 'uploads/', // Save images to an 'uploads' folder
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const diskUpload = multer({ storage: diskStorage });
// Route to handle adding a new service


app.post("/add-service", diskUpload.array('photos', 10), async (req, res) => {
    const { serviceType, price, location, description } = req.body;  // Include description
    const username = req.session.username;  // Get the username from session

    if (!username) {
        console.error("Username not found in session");
        return res.status(400).send("You must be logged in to add a service.");
    }

    // Collect file paths of uploaded photos
    const photoPaths = req.files.map(file => file.path);

    try {
        // Check if a service of the same type already exists for the vendor
        const existingService = await db.query(
            `SELECT * FROM services WHERE username=$1 AND service_type=$2`,
            [username, serviceType]
        );

        if (existingService.rowCount > 0) {
            // If the service already exists, update it with the new data
            await db.query(
                `UPDATE services 
                SET photos=$1::TEXT[], price=$2, location=$3, description=$4, created_at=DEFAULT
                WHERE username=$5 AND service_type=$6`,
                [photoPaths, price, location, description, username, serviceType]
            );
            res.redirect("/services");  // Redirect to services page after update
        } else {
            // If no service exists, insert a new one
            await db.query(
                `INSERT INTO services (username, service_type, photos, price, location, description) 
                VALUES ($1, $2, $3::TEXT[], $4, $5, $6)`,
                [username, serviceType, photoPaths, price, location, description]
            );
            res.redirect("/services");  // Redirect to services page after adding new service
        }
    } catch (err) {
        console.error("Error adding/updating service:", err);
        res.status(500).send('An error occurred while adding or updating the service');
    }
});




app.get("/add-service", (req, res) => {
    if (!req.session.username) {
        return res.redirect("/signin");  // Redirect to sign-in if not logged in
    }
    res.render("addservice.ejs", { path: "/add-service", username: req.session.username, role: req.session.role });
});


app.use('/uploads', express.static('uploads')); // Assuming images are in the 'uploads' folder


app.get("/venues", async (req, res) => {
    try {
        // Query to fetch all services of type 'Venue' from the services table
        const result = await db.query("SELECT * FROM services WHERE service_type='venue'");
        const userResult = await db.query("SELECT id FROM users WHERE username=$1", [req.session.username]);

// Ensure the result contains rows before accessing the id
        const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;

        console.log(userId);
        // Check if services were found
        if (result.rows.length > 0) {
            res.render('venue', { services: result.rows, errorMessage: null,userId: userId });
        } else {
            res.render('venue', { services: [], errorMessage: 'No venues available.',userId: userId });
        }
    } catch (err) {
        console.error("Error fetching venues:", err);
        res.render('venue', { services: [], errorMessage: 'Something went wrong, please try again later.', userId: userId });
    }
});






app.get("/venuedetail/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query("SELECT * FROM services WHERE id = $1", [id]);
        const userResult = await db.query("SELECT id FROM users WHERE username=$1", [req.session.username]);
        const username = req.session.username;
        const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;
        if (result.rows.length > 0) {
            res.render('venueDetails', { venue: result.rows[0],userId:userId });
        } else {
            res.status(404).send("Venue not found");
        }
    } catch (err) {
        console.error("Error fetching venue details:", err);
        res.status(500).send("An error occurred while fetching venue details");
    }
});
// app.get("/venuedetail/:id/:username",(req,res)=>{
//     const { id } = req.params;
//     const { username } = req.params;
//     res.render("venueDetails.ejs");
//     console.log(id);
//     console.log(username);
// });





//decoration

app.get("/decore", async (req, res) => {
    try {
        // Query to fetch all services of type 'Venue' from the services table
        const result = await db.query("SELECT * FROM services WHERE service_type='decoration'");
        const userResult = await db.query("SELECT id FROM users WHERE username=$1", [req.session.username]);

// Ensure the result contains rows before accessing the id
        const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;

        console.log(userId);
        // Check if services were found
        if (result.rows.length > 0) {
            res.render('decor', { services: result.rows, errorMessage: null,userId: userId });
        } else {
            res.render('decor', { services: [], errorMessage: 'No venues available.',userId: userId });
        }
    } catch (err) {
        console.error("Error fetching venues:", err);
        res.render('decor', { services: [], errorMessage: 'Something went wrong, please try again later.', userId: userId });
    }
});


//caters

app.get("/caters", async (req, res) => {
    try {
        // Query to fetch all services of type 'Venue' from the services table
        const result = await db.query("SELECT * FROM services WHERE service_type='catering'");
        const userResult = await db.query("SELECT id FROM users WHERE username=$1", [req.session.username]);

// Ensure the result contains rows before accessing the id
        const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;

        console.log(userId);
        // Check if services were found
        if (result.rows.length > 0) {
            res.render('cater', { services: result.rows, errorMessage: null,userId: userId });
        } else {
            res.render('cater', { services: [], errorMessage: 'No venues available.',userId: userId });
        }
    } catch (err) {
        console.error("Error fetching venues:", err);
        res.render('cater', { services: [], errorMessage: 'Something went wrong, please try again later.', userId: userId });
    }
});


//photographer

app.get("/photographer", async (req, res) => {
    try {
        // Query to fetch all services of type 'Venue' from the services table
        const result = await db.query("SELECT * FROM services WHERE service_type='photography'");
        const userResult = await db.query("SELECT id FROM users WHERE username=$1", [req.session.username]);

// Ensure the result contains rows before accessing the id
        const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;

        console.log(userId);
        // Check if services were found
        if (result.rows.length > 0) {
            res.render('photograph', { services: result.rows, errorMessage: null,userId: userId });
        } else {
            res.render('photograph', { services: [], errorMessage: 'No venues available.',userId: userId });
        }
    } catch (err) {
        console.error("Error fetching venues:", err);
        res.render('photograph', { services: [], errorMessage: 'Something went wrong, please try again later.', userId: userId });
    }
});

app.get('/view-service', async (req, res) => {
    if (!req.session.username) {
        return res.redirect('/login');  // Redirect to login if the vendor is not logged in
    }
    const userResult = await db.query("SELECT id FROM users WHERE username=$1", [req.session.username]);
    const username = req.session.username;
    const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;
    
    // Query to fetch services added by the logged-in vendor
    const query = `
        SELECT * FROM services
        WHERE username = $1
        ORDER BY created_at DESC;
    `;
    
    db.query(query, [username])
    .then(result => {
        const services = result.rows;  // Assuming 'result.rows' contains the services
        res.render('viewservice.ejs', {
            services: services,
            username: req.session.username,
            userId: userId  // Ensure userId is passed
        });
    })
    .catch(error => {
        console.error(error);
        res.status(500).send('Error retrieving services');
    });
});



// Route to display the edit form for a specific service
app.get('/edit-service/:id', (req, res) => {
    if (!req.session.username) {
        return res.redirect('/login');  // Redirect to login if the vendor is not logged in
    }

    const serviceId = req.params.id;
    const username = req.session.username;

    // Query to get the service details by its ID
    const query = `
        SELECT * FROM services
        WHERE id = $1 AND username = $2;
    `;
    
    db.query(query, [serviceId, username])
    .then(result => {
        const service = result.rows[0];  // Get the first (and only) result
        if (!service) {
            return res.status(404).send('Service not found or you do not have permission to edit it');
        }

        // Render the edit page with service data
        res.render('editservice.ejs', { service });
    })
    .catch(error => {
        console.error(error);
        res.status(500).send('Error retrieving service');
    });
});

// Route to handle the form submission and update the service details
app.post('/edit-service/:id', (req, res) => {
    const serviceId = req.params.id;
    const { description, price, location } = req.body;

    // Fetch the existing service to keep the photos unchanged
    const fetchQuery = 'SELECT photos FROM services WHERE id = $1 AND username = $2';
    
    db.query(fetchQuery, [serviceId, req.session.username])
    .then(result => {
        if (result.rows.length === 0) {
            return res.status(404).send('Service not found');
        }

        // Get the existing photos, if present, otherwise use an empty array
        const existingPhotos = result.rows[0].photos || [];

        // Update only the description, price, and location, keeping the existing photos
        const updateQuery = `
            UPDATE services
            SET description = $1, price = $2, location = $3, photos = $4
            WHERE id = $5 AND username = $6
            RETURNING *;
        `;

        // Execute the update query, ensuring existing photos are retained
        db.query(updateQuery, [description, price, location, existingPhotos, serviceId, req.session.username])
        .then(() => {
            res.redirect('/view-service');
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Error updating service');
        });
    })
    .catch(error => {
        console.error(error);
        res.status(500).send('Error fetching service');
    });
});




app.post('/add-to-cart', (req, res) => {
    const { userId, quantity, serviceId } = req.body;

    if (!userId || !serviceId) {
        return res.status(400).json({ message: 'User ID or Service ID is missing' });
    }

    // Check if the item already exists in the cart for the user
    const checkQuery = 'SELECT * FROM cart WHERE user_id = $1 AND service_id = $2';
    db.query(checkQuery, [userId, serviceId], (checkError, checkResult) => {
        if (checkError) {
            return res.status(500).json({ message: 'Error checking cart' });
        }

        if (checkResult.rows.length > 0) {
            // Item already in cart
            return res.json({ success: false, message: 'Item already in your cart' });
        } else {
            // Insert item into cart
            const query = 'INSERT INTO cart (user_id, quantity, service_id) VALUES ($1, $2, $3)';
            db.query(query, [userId, quantity, serviceId], (error, result) => {
                if (error) {
                    console.error('Error adding to cart:', error);
                    return res.status(500).json({ message: 'Failed to add to cart' });
                }

                return res.json({ success: true });
            });
        }
    });
});




// Route to fetch user's cart details
app.get('/get-cart/:userId', (req, res) => {
    const { userId } = req.params;

    // Query to fetch cart items for the given user_id
    const query = 'SELECT service_id, quantity FROM cart WHERE user_id = $1';
    db.query(query, [userId], (error, result) => {
        if (error) {
            console.error('Error fetching cart:', error);
            return res.status(500).json({ message: 'Failed to fetch cart' });
        }

        const cartItems = result.rows;

        // Optionally, you can fetch additional details like service names, prices, etc.
        // For now, we are just sending the cart items with service_id and quantity

        res.json({ success: true, cartItems });
    });
});




app.get('/cart/:id', (req, res) => {
    const userId = req.params.id;  // Get the userId from the URL parameter
    console.log(userId);

    if (!userId) {
        return res.redirect('/signuser'); // Redirect to login page if not logged in
    }

    // Join the cart table with the services table to get vendor, service_type, price, and the first photo from the photos array
    const query = `
        SELECT cart.service_id, cart.quantity, services.username AS vendor_name, services.service_type, services.price, services.photos[1] AS photo_url
        FROM cart
        INNER JOIN services ON cart.service_id = services.id
        WHERE cart.user_id = $1
    `;
    
    db.query(query, [userId], (error, result) => {
        if (error) {
            console.error('Error fetching cart:', error);
            return res.status(500).send('Server Error');
        }

        const cartItems = result.rows; // Cart items with joined service details
        res.render('cart', { cartItems }); // Render cart page and pass the items
    });
});

    



app.get('/get-cart-count', (req, res) => {
    const userId = req.session.userId; // Get userId from session
    
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User not logged in' });
    }

    // Query to count cart items for this user
    const query = 'SELECT COUNT(*) FROM cart WHERE user_id = $1';
    db.query(query, [userId], (error, result) => {
        if (error) {
            console.error('Error fetching cart count:', error);
            return res.status(500).json({ success: false, message: 'Server Error' });
        }

        const count = parseInt(result.rows[0].count, 10); // Get the count of items
        res.json({ success: true, count });
    });
});



app.post('/remove-from-cart/:service_id', async (req, res) => {
    const serviceId = req.params.service_id; // Get the service_id to remove from cart

    // Get the user_id associated with the service_id
    const result = await db.query('SELECT user_id FROM cart WHERE service_id=$1', [serviceId]);
    
    if (result.rows.length === 0) {
        return res.redirect('/signuser'); // If no user_id is found, redirect to login page
    }

    const userId = result.rows[0].user_id; // Get the user_id from the query result

    // SQL query to remove the service from the cart
    const query = 'DELETE FROM cart WHERE service_id = $1';
    
    try {
        await db.query(query, [serviceId]); // Execute the deletion query
        res.redirect('/cart/' + userId); // Redirect to the cart page after removal
    } catch (error) {
        console.error('Error removing service from cart:', error);
        return res.status(500).send('Server Error');
    }
});




app.get('/checkout', async (req, res) => {
    if (!req.session.username) {
        return res.redirect('/signuser'); // Redirect to login if not logged in
    }

    const userResult = await db.query("SELECT id FROM users WHERE username=$1", [req.session.username]);
    const userId = userResult.rows[0]?.id;
    console.log(userId);
    console.log(req.session.username);

    if (!userId) {
        return res.status(400).send('User not found');
    }

    // Fetch all services in the user's cart
    const cartItemsResult = await db.query(`
        SELECT s.id AS service_id, s.username, s.price, c.quantity
        FROM cart c
        JOIN services s ON c.service_id = s.id
        WHERE c.user_id = $1
    `, [userId]);

    const cartItems = cartItemsResult.rows;

    if (!cartItems || cartItems.length === 0) {
        return res.status(400).send('Cart is empty');
    }

    // Calculate total amount
    let totalAmount = 0;
    cartItems.forEach(item => {
        totalAmount += item.price * (item.quantity || 1); // Default quantity to 1
    });

    console.log('Total Amount in INR:', totalAmount); // Debugging
    console.log('Total Amount in Paise:', totalAmount * 100); // Debugging

    // Create Razorpay order
    const options = {
        amount: totalAmount *100, // Amount in paisa
        currency: "INR",
        receipt: `order_rcptid_${userId}`
    };

    try {
        const order = await instance.orders.create(options); // Razorpay order creation
        res.render('checkout.ejs', {
            cartItems: cartItems,       // Pass all cart items
            totalAmount: totalAmount,   // Pass total amount in INR
            orderId: order.id,          // Pass Razorpay order ID
            username: req.session.username
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).send('Error creating order');
    }
});




app.post("/create-order", async (req, res) => {
    const { totalAmount } = req.body;

    try {
        // Convert amount to paise (if it's in rupees)
        const options = {
            amount: parseInt(totalAmount, 10), // totalAmount should already be in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await instance.orders.create(options);

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ success: false, error: "Something went wrong!" });
    }
});



app.post("/booking", async (req, res) => {
    const { totalAmount, cartItems, bookedOn, paymentId } = req.body;
    const username = req.session.username;

    try {
        // Parse cartItems (it arrives as a JSON string)
        const parsedCartItems = JSON.parse(cartItems);

        // Insert booking into the database
        const query = `
            INSERT INTO booking (total_amount, cart_items, booked_on, payment_id,username)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;

        const values = [
            totalAmount,
            JSON.stringify(parsedCartItems), // Store JSON as a string
            bookedOn,
            paymentId,
            username,
        ];

        const result = await db.query(query, values);

        console.log("Booking confirmed:", result.rows[0]);

        res.status(200).json({ success: true, message: "Booking confirmed!", booking: result.rows[0] });
    } catch (error) {
        console.error("Error saving booking:", error);
        res.status(500).json({ success: false, message: "Failed to confirm booking." });
    }
});




app.get("/my-bookings", async (req, res) => {
    
    const username = req.session.username; // Assuming user session contains the username
    if (!username) {
        return res.redirect('/signuser');  // Redirect to the sign-in page
    }
    

    try {
        // Query the booking table for the user's bookings
        function getProgressBarClass(status) {
            switch (status) {
                case 'Booking Confirmed':
                    return 'progress-33';
                case 'Working':
                    return 'progress-66';
                case 'Work Completed':
                    return 'progress-100';
                default:
                    return 'progress-0';
            }
        }
        
        const result = await db.query(
            "SELECT * FROM booking WHERE username = $1 ORDER BY booking_date DESC",
            [username]
        );

        const bookings = result.rows;

        res.render("myBookings", { bookings, username, getProgressBarClass });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).send("Error fetching your bookings. Please try again later.");
    }
});


app.get("/vendor-my-bookings", async (req, res) => {
    const username = req.session.username;
    if (!username) {
        return res.redirect('/signuser');  // Redirect to sign-in page
    }

    try {
        // Query to fetch vendor bookings and related service information
        const result = await db.query(
            `SELECT 
                b.username,
                b.booked_on,
                (cart_item->>'service_id') AS service_id
             FROM 
                booking b,
                LATERAL jsonb_array_elements(b.cart_items::jsonb) AS cart_item
             WHERE 
                cart_item->>'username' = $1
             ORDER BY 
                b.booked_on DESC`,
            [username]
        );

        const bookings = result.rows;

        // Pass the filtered bookings to the EJS view
        res.render("vendorMyBookings", { bookings, username });
    } catch (error) {
        console.error("Error fetching vendor bookings:", error);
        res.status(500).send("Error fetching vendor bookings. Please try again later.");
    }
});


app.post("/update-status", async (req, res) => {
    const { status, username } = req.body;

    try {
        // Update the booking status in the database for the given username
        const result = await db.query(
            "UPDATE booking SET status = $1 WHERE username = $2 RETURNING *",
            [status, username]
        );

        if (result.rows.length > 0) {
            res.redirect("/vendor-my-bookings");  // Redirect back to vendor's booking page after update
        } else {
            res.status(404).send("Booking not found or update failed");
        }
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).send("Error updating status. Please try again later.");
    }
});







app.get("/success", (req, res) => {
    res.render("success", { message: "Your booking was successful!" });
});


// Chatbot Route
app.get('/chatbot', (req, res) => {
    res.render('chatbot', { username: req.session.username || 'Guest', role: req.session.role || 'User' });
});

app.post('/chatbot', (req, res) => {
    const { message } = req.body;

    // Simple chatbot logic for testing
    let reply = 'Sorry, I don’t understand that. Can you rephrase?';

    if (message.toLowerCase().includes('hello')) {
        reply = 'Hi there! How can I assist you today?';
    } else if (message.toLowerCase().includes('services')) {
        reply = 'You can explore our Services page for wedding venues, decorations, and more.';
    } else if (message.toLowerCase().includes('bookings')) {
        reply = 'You can check your bookings in the "My Bookings" section.';
    } else if (message.toLowerCase().includes('thank you')) {
        reply = 'You’re welcome! Let me know if there’s anything else I can help with.';
    }

    res.json({ reply });
});


// Route to fetch services associated with a specific user (vendor)
app.get('/chatbot-services/:username', (req, res) => {
    const { username } = req.params;  // Get username from URL params

    // Query to fetch services for the given username
    const query = 'SELECT * FROM services WHERE username = $1';
    
    db.query(query, [username], (error, result) => {
        if (error) {
            console.error('Error fetching services:', error);
            return res.status(500).json({ message: 'Error fetching services' });
        }

        const services = result.rows;
        if (services.length === 0) {
            return res.status(404).json({ message: 'No services found for this user' });
        }

        res.json({ success: true, services });
    });
});

app.get("/packages", async (req, res) => {
    const { min_budget, max_budget } = req.query;

    if (!min_budget || !max_budget) {
        return res.status(400).send("Missing budget parameters");
    }

    try {
        // Query the packages within the specified budget range
        const result = await db.query(
            `SELECT * FROM packages WHERE min_budget <= $1 AND max_budget >= $2`,
            [max_budget, min_budget]
        );

        if (result.rows.length === 0) {
            return res.json({ message: "No packages found for this budget range" });
        }

        // Optionally, fetch services in each package
        const packagesWithServices = await Promise.all(result.rows.map(async (pkg) => {
            const services = await db.query(
                `SELECT s.name FROM services s JOIN package_services ps ON s.id = ps.service_id WHERE ps.package_id = $1`,
                [pkg.id]
            );
            pkg.services = services.rows;
            return pkg;
        }));

        res.json(packagesWithServices);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching packages.");
    }
});



app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

