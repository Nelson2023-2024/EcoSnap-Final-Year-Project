export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Not authenticated" });
};

export const isAdmin = (req, res, next) => {
  if (req.isAuthenticated()) {
    if (req.user.role === "admin") {
      return next(); // If the user is an admin, allow access
    } else {
      return res.status(403).json({ message: "Access denied. Admins only." }); // If not an admin
    }
  }
  res.status(401).json({ message: "Not authenticated" }); // If not authenticated
};
