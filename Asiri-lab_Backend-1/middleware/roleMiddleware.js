
// check role and validate 

const roleCheck = (allowedRoles) => {
    return (req, res, next) => {
      if (req.user && allowedRoles.includes(req.user.role)) {
       next();
         
     } else {
        res.status(403).send("Access denied due to insufficient role.");
      }
    };
  };
  
  module.exports = roleCheck;
  

