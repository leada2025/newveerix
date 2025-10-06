// middleware/checkPermission.js
module.exports = function(requiredPermission) {
  return (req, res, next) => {
    const user = req.user; // set by auth middleware

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // If admin => allow everything
    if (user.role?.name === "admin" || user.role?.permissions.includes("*")) {
      return next();
    }

    if (!user.role?.permissions.includes(requiredPermission)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
