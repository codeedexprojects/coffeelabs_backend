const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// userRoutes
const userRoutes = require('./features/user/auth/UserRoute');
const userProfileRoutes = require('./features/user/Profile/ProfileRoute');








// adminRoutes
const adminRoutes = require('./features/admin/auth/AdminRoute')
const adminUserRoutes = require('./features/admin/User/UserRoutes')


// USER
app.use('/userAuth', userRoutes)

app.use('/userProfile', userProfileRoutes)



// ADMIN
app.use('/admin/auth',adminRoutes)
app.use('/admin/user',adminUserRoutes)

app.use(errorMiddleware);

module.exports = app;