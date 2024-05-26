const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql');
const multer = require('multer');
const app = express();
const port = 3000;

// MySQL setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shopping'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Routes
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM login WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const user = results[0];
            if (user.type === 'c') {
                res.redirect(`/customer.html?username=${username}`);
            } else if (user.type === 's') {
                res.redirect(`/seller.html?username=${username}`);
            }
        } else {
            res.send('Username/Password does not match');
        }
    });
});

app.post('/create-account', (req, res) => {
    const { username, password, type } = req.body;

    const query = 'INSERT INTO login (username, password, type) VALUES (?, ?, ?)';
    db.query(query, [username, password, type], (err, results) => {
        if (err) throw err;
        res.redirect('/index.html');
    });
});

app.post('/add-product', upload.single('image'), (req, res) => {
    const { name, description, category, price } = req.body;
    const image = req.file.filename;

    const query = 'INSERT INTO products (name, description, category, price, image) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, description, category, price, image], (err, results) => {
        if (err) throw err;
        res.send('Product uploaded successfully');
    });
});


app.get('/customer', (req, res) => {
    const query = 'SELECT name, image FROM products';
    db.query(query, (err, results) => {
        if (err) throw err;

        let productListHtml = '<h1>Available Products</h1>';
        productListHtml += '<div class="product-list">';

        results.forEach(product => {
            productListHtml += `
                <div class="product">
                    <h2>${product.name}</h2>
                    <img src="/uploads/${product.image}" alt="${product.name}">
                </div>
            `;
        });

        productListHtml += '</div>';

        res.send(productListHtml);
    });
});


// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
