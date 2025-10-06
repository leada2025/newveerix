

// middleware/authorize.js
// middleware/authorize.js
module.exports = function authorize(requiredPermissions = []) {
  return (req, res, next) => {
    const { role, permissions } = req.user;

    // ✅ Admin bypass (superuser)
    if (role === "admin") {
      return next();
    }

    // ✅ Check if user has all required permissions
    const hasPermission = requiredPermissions.every((perm) =>
      permissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};




