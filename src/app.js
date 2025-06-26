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
const userProductRoutes = require("./features/user/Product/ProductRoute");


// adminRoutes
const adminRoutes = require("./features/admin/auth/AdminRoute");
const adminUserRoutes = require("./features/admin/User/UserRoutes");
const adminDashboardRoutes = require("./features/admin/Dashboard/DashboardRoutes");
const adminProductRoutes = require("./features/admin/Product/ProductRoutes");
const adminCategoryRoutes = require("./features/admin/Category/CategoryRoutes");
const adminSubcategoryRoutes = require("./features/admin/subCategory/subCategoryRoutes");


// USER
app.use("/userAuth", userRoutes);
app.use("/userProfile", userProfileRoutes);
app.use("/category", userCategoryRoutes);
app.use("/subcategory", userSubCategoryRoutes);
app.use("/products", userProductRoutes)


// ADMIN
app.use("/admin/auth", adminRoutes);
app.use("/admin/user", adminUserRoutes);
app.use("/admin/category", adminCategoryRoutes);
app.use("/admin/subcategory", adminSubcategoryRoutes)
app.use("/admin/dashboard", adminDashboardRoutes)
app.use("/admin/product", adminProductRoutes)


app.use(errorMiddleware);

module.exports = app;
