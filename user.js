
// user.js

exports.load = function(req, res, next) {
  if (req.session && req.session.LFM_TOKEN) {
    next();
  }

  res.render();
};
