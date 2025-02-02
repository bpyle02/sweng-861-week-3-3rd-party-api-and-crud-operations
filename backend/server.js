import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config'
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from "firebase-admin";
import serviceAccountKey from "./etc/secrets/firebase_private_key.json" with { type: "json" }
import { getAuth } from "firebase-admin/auth";
import User from './Schema/User.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import rateLimit from 'express-rate-limit';

const server = express();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
})

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password
let PORT = 3173;

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'API for managing user authentication and profile data',
        },
        servers: [
            {
                url: `http://localhost:3173`,
            },
        ],
    },
    apis: ['./routes/book.js'],
};
const swaggerSpec = swaggerJsdoc(options);


const standard_limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 1000ms in a second * 60 seconds in a minute * 15 = 15 minutes in milliseconds
    max: 100 // limit each IP to 100 requests per windowMs
});
const edit_account_limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
const new_account_limiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 100 // limit each IP to 5 requests per windowMs
});
const delete_account_limiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 100 // limit each IP to 5 requests per windowMs
});

server.use(express.json());
server.use(cors(
    {
        origin: '*',
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "username"],
        preflightContinue: false,
    }
))
server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
server.use(standard_limiter);
server.use(edit_account_limiter);
server.use(new_account_limiter);
server.use(delete_account_limiter);


mongoose.connect((process.env.DB_LOCATION), {
    autoIndex: true
})

const verifyJWT = (req, res, next) => {

    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) {
        return res.status(401).json({ error: "No access token" })
    }

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Access token is invalid" })
        }

        req.user = user.id
        req.admin = user.admin
        next()
    })

}

const formatDatatoSend = (user) => {

    const access_token = jwt.sign({ id: user._id, admin: user.admin }, process.env.SECRET_ACCESS_KEY)

    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname,
        isAdmin: user.admin
    }
}

const generateUsername = async (email) => {

    let username = email.split("@")[0];

    let isUsernameNotUnique = await User.exists({ "personal_info.username": username }).then((result) => result)

    isUsernameNotUnique ? username += nanoid().substring(0, 5) : "";

    return username;

}

// Create New User
server.post("/users", new_account_limiter, async (req, res) => {
    let { fullname, email, password } = req.body;
    let isAdmin = process.env.ADMIN_EMAILS.split(",").includes(email);

    // validating the data from frontend
    if (fullname.length < 3) {
        return res.status(403).json({ "error": "Fullname must be at least 3 letters long" })
    }
    if (!email.length) {
        return res.status(403).json({ "error": "Enter Email" })
    }
    if (!emailRegex.test(email)) {
        return res.status(403).json({ "error": "Email is invalid" })
    }
    if (!passwordRegex.test(password)) {
        return res.status(403).json({ "error": "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters" })
    }

    bcrypt.hash(password, 10, async (err, hashed_password) => {
        let username = await generateUsername(email);
        let profile_img = "https://ui-avatars.com/api/?name=" + fullname.replace(" ", "+") + "&background=random&size=384";

        let user = new User({
            personal_info: {
                fullname,
                email,
                password: hashed_password,
                username,
                profile_img
            },
            admin: isAdmin,
            google_auth: false,
            facebook_auth: false
        });

        user.save().then((u) => {
            res.status(201).json(formatDatatoSend(u));
        }).catch(err => {
            if (err.code == 11000) {
                return res.status(500).json({ "error": "Email already exists" })
            }
            return res.status(500).json({ "error": err.message })
        });
    });
});

// Log In Existing User
server.post("/users/login", standard_limiter, (req, res) => {

    let { email, password } = req.body;

    User.findOne({ "personal_info.email": email })
        .then((user) => {
            if (!user) {
                return res.status(403).json({ "error": "Email not found" });
            }


            if (!user.google_auth || !user.facebook_auth) {

                bcrypt.compare(password, user.personal_info.password, (err, result) => {

                    if (err) {
                        return res.status(403).json({ "error": "Error occured while login please try again" });
                    }

                    if (!result) {
                        return res.status(403).json({ "error": "Incorrect password" })
                    } else {
                        console.log("You successfully signed in with an email!")
                        return res.status(200).json(formatDatatoSend(user))
                    }

                })

            } else {
                return res.status(403).json({ "error": "Account was created using an oauth provider. Try logging in with with Facebook or Google." })
            }

        })
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({ "error": err.message })
        })

})

server.post("/google-auth", new_account_limiter, async (req, res) => {

    let { access_token } = req.body;

    getAuth()
        .verifyIdToken(access_token)
        .then(async (decodedUser) => {

            let { email, name, picture } = decodedUser;
            let isAdmin = false;

            if (process.env.ADMIN_EMAILS.split(",").includes(email)) {
                isAdmin = true;
            }

            picture = picture.replace("s96-c", "s384-c");

            let user = await User.findOne({ "personal_info.email": email }).select("personal_info.fullname personal_info.username personal_info.profile_img admin google_auth facebook_auth").then((u) => {
                return u || null
            })
                .catch(err => {
                    return res.status(500).json({ "error": err.message })
                })

            if (user) { // login
                if (!user.google_auth) {
                    return res.status(403).json({ "error": "This email was signed up without google. Please log in with password to access the account" })
                }
            }
            else { // sign up

                let username = await generateUsername(email);

                user = new User({
                    personal_info: { fullname: name, email, username, profile_img: picture },
                    admin: isAdmin,
                    google_auth: true,
                    facebook_auth: false
                })

                await user.save().then((u) => {
                    user = u;
                })
                    .catch(err => {
                        return res.status(500).json({ "error": err.message })
                    })

            }

            console.log("You successfully signed in with Google!")
            return res.status(200).json(formatDatatoSend(user))

        })
        .catch(err => {
            console.log(err.message)
            return res.status(500).json({ "error": "Failed to authenticate you with google. Try with some other google account" })
        })

})

server.post("/facebook-auth", new_account_limiter, async (req, res) => {

    let { access_token } = req.body;


    getAuth()
        .verifyIdToken(access_token)
        .then(async (decodedUser) => {

            let { email, name, picture } = decodedUser;
            let isAdmin = false;

            if (process.env.ADMIN_EMAILS.split(",").includes(email)) {
                isAdmin = true;
            }

            let user = await User.findOne({ "personal_info.email": email }).select("personal_info.fullname personal_info.username personal_info.profile_img admin google_auth facebook_auth").then((u) => {
                return u || null
            })
                .catch(err => {
                    return res.status(500).json({ "error": err.message })
                })

            if (user) { // login
                if (!user.facebook_auth) {
                    return res.status(403).json({ "error": "This email was signed up without facebook. Please log in with password to access the account" })
                }
            }
            else { // sign up

                let username = await generateUsername(email);

                user = new User({
                    personal_info: { fullname: name, email, username, profile_img: picture },
                    admin: isAdmin,
                    google_auth: false,
                    facebook_auth: true
                })

                await user.save().then((u) => {
                    user = u;
                })
                    .catch(err => {
                        return res.status(500).json({ "error": err.message })
                    })

            }

            console.log("You successfully signed in with Facebook!")
            return res.status(200).json(formatDatatoSend(user))

        })
        .catch(err => {
            console.log(err.message)
            return res.status(500).json({ "error": "Failed to authenticate you with facebook. Try with some other google account" })
        })

})

// Get User Data
server.get("/users/:username", standard_limiter, (req, res) => {
    User.findOne({ "personal_info.username": req.params.username })
        .select("-personal_info.password -google_auth -facebook_auth -updatedAt -posts -admin")
        .then(user => {
            if (!user) return res.status(404).json({ error: "User not found" });
            res.status(200).json(user);
        })
        .catch(err => {
            res.status(500).json({ error: err.message })
        });
});

// Edit User
server.put("/users/:id", verifyJWT, edit_account_limiter, (req, res) => {
    const updateData = {
        "personal_info.username": req.body.username,
        "personal_info.bio": req.body.bio,
        "social_links": req.body.social_links
    };

    if (req.user !== req.params.id) return res.status(403).json({ error: "Forbidden" });

    User.findOneAndUpdate({ _id: req.params.id }, updateData, { new: true, runValidators: true })
        .then(updatedUser => {
            if (!updatedUser) {
                return res.status(404).json({ error: "User not found" });
            }
            res.status(200).json({ updatedUser });
        })
        .catch(err => {
            console.log(err)
            if (err.code == 11000) {
                return res.status(409).json({ error: "Username already taken" })
            }
            res.status(500).json({ error: err.message });
        });
});

server.post("/users/:id", verifyJWT, edit_account_limiter, (req, res) => {

    let { currentPassword, newPassword } = req.body;

    if (!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)) {
        return res.status(403).json({ error: "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters" })
    }

    User.findOne({ _id: req.user })
        .then((user) => {

            if (user.google_auth) {
                return res.status(403).json({ error: "You can't change account's password because you logged in through google" })
            }

            bcrypt.compare(currentPassword, user.personal_info.password, (err, result) => {
                if (err) {
                    return res.status(500).json({ error: "Some error occured while changing the password, please try again later" })
                }

                if (!result) {
                    return res.status(403).json({ error: "Incorrect current password" })
                }

                bcrypt.hash(newPassword, 10, (err, hashed_password) => {

                    User.findOneAndUpdate({ _id: req.user }, { "personal_info.password": hashed_password })
                        .then((u) => {
                            return res.status(200).json({ status: 'password changed' })
                        })
                        .catch(err => {
                            return res.status(500).json({ error: 'Some error occured while saving new password, please try again later' })
                        })

                })
            })

        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: "User not found" })
        })

})

// Delete User
server.delete("/users/:id", verifyJWT, delete_account_limiter, (req, res) => {
    if (req.user !== req.params.id) return res.status(403).json({ error: "Forbidden" });

    User.findByIdAndDelete(req.params.id)
        .then(deletedUser => {
            if (!deletedUser) {
                console.log("user not found")
                return res.status(404).json({ error: "User not found" });
            }
            console.log("user deleted successfully")
            res.status(200).json({ message: "User deleted successfully" });
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({ error: "Error deleting user" });
        });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('listening on port -> ' + PORT);
})