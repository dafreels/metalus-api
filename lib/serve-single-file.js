// express middleware
module.exports = (filePath) => {
  return (req, res, next) => {
    try {
      res.sendFile(filePath);
    }
    catch (e) {
      next(e);
    }
  };
};
