const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// userRoutes
const userRoutes = require("./features/user/auth/UserRoute");
const userProfileRoutes = require("./features/user/Profile/ProfileRoute");
const userCategoryRoutes = require("./features/user/category/CategoryRoutes");
const userSubCategoryRoutes = require("./features/user/subcategory/subCategoryRoutes");


// adminRoutes
const adminRoutes = require("./features/admin/auth/AdminRoute");
const adminUserRoutes = require("./features/admin/User/UserRoutes");
const adminCategoryRoutes = require("./features/admin/Category/CategoryRoutes");
const adminSubcategoryRoutes = require("./features/admin/subCategory/subCategoryRoutes");


// USER
app.use("/userAuth", userRoutes);
app.use("/userProfile", userProfileRoutes);
app.use("/category", userCategoryRoutes);
app.use("/subcategory", userSubCategoryRoutes);


// ADMIN
app.use("/admin/auth", adminRoutes);
app.use("/admin/user", adminUserRoutes);
app.use("/admin/category", adminCategoryRoutes);
app.use("/admin/subcategory", adminSubcategoryRoutes)


app.use(errorMiddleware);

module.exports = app;
